import { Request, Response } from 'express';
import { prisma } from '../index';
import { z } from 'zod';

/**
 * Create a new attendance session
 */
export const createAttendanceSession = async (req: Request, res: Response) => {
  try {
    const { 
      subjectId, 
      facultyId, 
      attendanceDate, 
      sessionSlot, 
      duration, 
      academicYear, 
      semester, 
      section, 
      batchId 
    } = req.body;

    // Validate that subject exists
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId }
    });

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    // Validate that faculty exists if facultyId is provided
    if (facultyId) {
      const faculty = await prisma.faculty.findUnique({
        where: { id: facultyId }
      });

      if (!faculty) {
        return res.status(404).json({
          success: false,
          message: 'Faculty not found'
        });
      }
    }

    // Check if session already exists for this subject, date and slot
    const existingSession = await prisma.attendanceSession.findFirst({
      where: {
        subjectId,
        attendanceDate: new Date(attendanceDate),
        sessionSlot
      }
    });

    if (existingSession) {
      return res.status(400).json({
        success: false,
        message: 'An attendance session already exists for this subject, date and slot'
      });
    }

    // Create attendance session
    const attendanceSession = await prisma.attendanceSession.create({
      data: {
        subjectId,
        facultyId,
        attendanceDate: new Date(attendanceDate),
        sessionSlot,
        duration: duration || 1,
        academicYear,
        semester,
        section,
        batchId
      }
    });

    res.status(201).json({
      success: true,
      message: 'Attendance session created successfully',
      data: attendanceSession
    });
  } catch (error) {
    console.error('Create attendance session error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get all attendance sessions with filters
 */
export const getAttendanceSessions = async (req: Request, res: Response) => {
  try {
    const { 
      subjectId, 
      facultyId, 
      startDate, 
      endDate, 
      academicYear, 
      semester, 
      section,
      batchId,
      page = 1,
      limit = 10
    } = req.query;

    const pageNumber = parseInt(page as string);
    const limitNumber = parseInt(limit as string);

    // Build filter conditions
    const filterConditions: any = {};

    if (subjectId) {
      filterConditions.subjectId = parseInt(subjectId as string);
    }

    if (facultyId) {
      filterConditions.facultyId = parseInt(facultyId as string);
    }

    if (academicYear) {
      filterConditions.academicYear = academicYear as string;
    }

    if (semester) {
      filterConditions.semester = parseInt(semester as string);
    }

    if (section) {
      filterConditions.section = section as string;
    }

    if (batchId) {
      filterConditions.batchId = parseInt(batchId as string);
    }

    // Date range filter
    if (startDate || endDate) {
      filterConditions.attendanceDate = {};
      
      if (startDate) {
        filterConditions.attendanceDate.gte = new Date(startDate as string);
      }
      
      if (endDate) {
        filterConditions.attendanceDate.lte = new Date(endDate as string);
      }
    }

    // Get total count for pagination
    const total = await prisma.attendanceSession.count({
      where: filterConditions
    });

    // Get attendance sessions with pagination and filters
    const attendanceSessions = await prisma.attendanceSession.findMany({
      where: filterConditions,
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        faculty: {
          select: {
            id: true,
            name: true
          }
        },
        batch: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            attendanceentry: true
          }
        }
      },
      skip: (pageNumber - 1) * limitNumber,
      take: limitNumber,
      orderBy: {
        attendanceDate: 'desc'
      }
    });

    res.json({
      success: true,
      data: {
        attendanceSessions,
        pagination: {
          total,
          page: pageNumber,
          limit: limitNumber,
          totalPages: Math.ceil(total / limitNumber)
        }
      }
    });
  } catch (error) {
    console.error('Get attendance sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get a specific attendance session by ID
 */
export const getAttendanceSessionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const attendanceSession = await prisma.attendanceSession.findUnique({
      where: { id: parseInt(id) },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        faculty: {
          select: {
            id: true,
            name: true
          }
        },
        batch: {
          select: {
            id: true,
            name: true
          }
        },
        entries: {
          include: {
            student: {
              select: {
                usn: true,
                firstName: true,
                middleName: true,
                lastName: true
              }
            }
          }
        }
      }
    });

    if (!attendanceSession) {
      return res.status(404).json({
        success: false,
        message: 'Attendance session not found'
      });
    }

    res.json({
      success: true,
      data: attendanceSession
    });
  } catch (error) {
    console.error('Get attendance session by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Add an attendance entry for a student
 */
export const addAttendanceEntry = async (req: Request, res: Response) => {
  try {
    const { sessionId, usn, status } = req.body;

    // Validate session exists
    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId }
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Attendance session not found'
      });
    }

    // Validate student exists
    const student = await prisma.student.findUnique({
      where: { usn }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check if entry already exists
    const existingEntry = await prisma.attendanceEntry.findFirst({
      where: {
        sessionId,
        usn
      }
    });

    if (existingEntry) {
      // Update existing entry
      const updatedEntry = await prisma.attendanceEntry.update({
        where: {
          id: existingEntry.id
        },
        data: {
          status
        }
      });

      return res.json({
        success: true,
        message: 'Attendance entry updated successfully',
        data: updatedEntry
      });
    }

    // Create new entry
    const attendanceEntry = await prisma.attendanceEntry.create({
      data: {
        sessionId,
        usn,
        status
      }
    });

    res.status(201).json({
      success: true,
      message: 'Attendance entry added successfully',
      data: attendanceEntry
    });
  } catch (error) {
    console.error('Add attendance entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Bulk upload attendance for a session
 */
export const bulkUploadAttendance = async (req: Request, res: Response) => {
  try {
    const { sessionId, entries } = req.body;

    // Validate session exists
    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId }
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Attendance session not found'
      });
    }

    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Entries must be a non-empty array'
      });
    }

    // Schema for validating entries
    const entrySchema = z.object({
      usn: z.string(),
      status: z.enum(['Present', 'Absent', 'Late', 'Excused'])
    });

    // Validate each entry
    const validatedEntries = [];
    const errors = [];

    for (let i = 0; i < entries.length; i++) {
      const result = entrySchema.safeParse(entries[i]);
      
      if (result.success) {
        validatedEntries.push(result.data);
      } else {
        errors.push({
          index: i,
          errors: result.error.format()
        });
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid entries found',
        errors
      });
    }

    // Check if any students don't exist
    const usns = validatedEntries.map(entry => entry.usn);
    const existingStudents = await prisma.student.findMany({
      where: {
        usn: {
          in: usns
        }
      },
      select: {
        usn: true
      }
    });

    const existingUsns = new Set(existingStudents.map(student => student.usn));
    const nonExistentUsns = usns.filter(usn => !existingUsns.has(usn));

    if (nonExistentUsns.length > 0) {
      return res.status(404).json({
        success: false,
        message: 'Some students not found',
        nonExistentUsns
      });
    }

    // Process entries (update or create)
    const results = await Promise.all(
      validatedEntries.map(async entry => {
        const { usn, status } = entry;
        
        // Check if entry already exists
        const existingEntry = await prisma.attendanceEntry.findFirst({
          where: {
            sessionId,
            usn
          }
        });

        if (existingEntry) {
          // Update existing entry
          return prisma.attendanceEntry.update({
            where: {
              id: existingEntry.id
            },
            data: {
              status
            }
          });
        } else {
          // Create new entry
          return prisma.attendanceEntry.create({
            data: {
              sessionId,
              usn,
              status
            }
          });
        }
      })
    );

    res.status(200).json({
      success: true,
      message: 'Attendance entries processed successfully',
      data: {
        created: results.filter(result => !('id' in result)).length,
        updated: results.filter(result => 'id' in result).length,
        total: results.length
      }
    });
  } catch (error) {
    console.error('Bulk upload attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get attendance summary for a student
 */
export const getStudentAttendanceSummary = async (req: Request, res: Response) => {
  try {
    const { usn, academicYear, semester } = req.params;

    // Check if student exists
    const student = await prisma.student.findUnique({
      where: { usn }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Get all attendance sessions for the student's current semester and academic year
    const sessions = await prisma.attendanceSession.findMany({
      where: {
        academicYear,
        semester: parseInt(semester),
        subject: {
          departmentId: student.departmentId
        }
      },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
            isLab: true
          }
        },
        entries: {
          where: {
            usn
          }
        }
      }
    });

    // Group sessions by subject
    const subjects = new Map();

    sessions.forEach(session => {
      const subjectId = session.subjectId;
      
      if (!subjects.has(subjectId)) {
        subjects.set(subjectId, {
          id: session.subject.id,
          name: session.subject.name,
          code: session.subject.code,
          isLab: session.subject.isLab,
          theoryClasses: 0,
          labClasses: 0,
          theoryPresent: 0,
          labPresent: 0,
          sessions: []
        });
      }
      
      const subject = subjects.get(subjectId);
      
      // Count classes and add session details
      if (session.duration > 1 || session.subject.isLab) {
        subject.labClasses += session.duration;
        
        if (session.entries.length > 0 && session.entries[0].status === 'Present') {
          subject.labPresent += session.duration;
        }
      } else {
        subject.theoryClasses += session.duration;
        
        if (session.entries.length > 0 && session.entries[0].status === 'Present') {
          subject.theoryPresent += session.duration;
        }
      }
      
      subject.sessions.push({
        id: session.id,
        date: session.attendanceDate,
        slot: session.sessionSlot,
        duration: session.duration,
        status: session.entries.length > 0 ? session.entries[0].status : 'Not Marked',
        isLab: session.duration > 1 || session.subject.isLab
      });
    });

    // Calculate percentages and prepare response
    const attendanceSummary = [];
    
    subjects.forEach(subject => {
      // Calculate percentages
      const theoryPercentage = subject.theoryClasses > 0 
        ? (subject.theoryPresent / subject.theoryClasses) * 100 
        : null;
        
      const labPercentage = subject.labClasses > 0 
        ? (subject.labPresent / subject.labClasses) * 100 
        : null;
        
      const totalClasses = subject.theoryClasses + subject.labClasses;
      const totalPresent = subject.theoryPresent + subject.labPresent;
      
      const overallPercentage = totalClasses > 0 
        ? (totalPresent / totalClasses) * 100 
        : null;

      attendanceSummary.push({
        subject: {
          id: subject.id,
          name: subject.name,
          code: subject.code
        },
        attendance: {
          theory: {
            total: subject.theoryClasses,
            present: subject.theoryPresent,
            percentage: theoryPercentage !== null ? parseFloat(theoryPercentage.toFixed(2)) : null
          },
          lab: {
            total: subject.labClasses,
            present: subject.labPresent,
            percentage: labPercentage !== null ? parseFloat(labPercentage.toFixed(2)) : null
          },
          overall: {
            total: totalClasses,
            present: totalPresent,
            percentage: overallPercentage !== null ? parseFloat(overallPercentage.toFixed(2)) : null
          }
        },
        sessions: subject.sessions
      });
    });

    res.json({
      success: true,
      data: attendanceSummary
    });
  } catch (error) {
    console.error('Get student attendance summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Create multiple attendance sessions at once (batch creation)
 */
export const createBatchAttendanceSessions = async (req: Request, res: Response) => {
  try {
    const { 
      subjectId, 
      facultyId, 
      sessionDates, 
      sessionSlots, 
      duration, 
      academicYear, 
      semester, 
      section, 
      batchId 
    } = req.body;

    // Validate that subject exists
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId }
    });

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    // Validate that faculty exists if facultyId is provided
    if (facultyId) {
      const faculty = await prisma.faculty.findUnique({
        where: { id: facultyId }
      });

      if (!faculty) {
        return res.status(404).json({
          success: false,
          message: 'Faculty not found'
        });
      }
    }

    // Validate input arrays
    if (!Array.isArray(sessionDates) || sessionDates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'sessionDates must be a non-empty array'
      });
    }

    if (!Array.isArray(sessionSlots) || sessionSlots.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'sessionSlots must be a non-empty array'
      });
    }

    // Create combinations of all dates and slots
    const sessions = [];
    
    for (const date of sessionDates) {
      for (const slot of sessionSlots) {
        sessions.push({
          date: new Date(date),
          slot: parseInt(slot)
        });
      }
    }

    // Check for existing sessions
    const existingSessions = await prisma.attendanceSession.findMany({
      where: {
        subjectId,
        AND: sessions.map(session => ({
          attendanceDate: session.date,
          sessionSlot: session.slot
        }))
      }
    });

    // Filter out existing sessions
    const existingSessionMap = new Map();
    
    existingSessions.forEach(session => {
      const key = `${session.attendanceDate.toISOString()}_${session.sessionSlot}`;
      existingSessionMap.set(key, true);
    });
    
    const sessionsToCreate = sessions.filter(session => {
      const key = `${session.date.toISOString()}_${session.slot}`;
      return !existingSessionMap.has(key);
    });

    if (sessionsToCreate.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'All requested sessions already exist'
      });
    }

    // Create new sessions
    const createdSessions = await prisma.attendanceSession.createMany({
      data: sessionsToCreate.map(session => ({
        subjectId,
        facultyId,
        attendanceDate: session.date,
        sessionSlot: session.slot,
        duration: duration || 1,
        academicYear,
        semester,
        section,
        batchId
      })),
      skipDuplicates: true
    });

    res.status(201).json({
      success: true,
      message: 'Attendance sessions created successfully',
      data: {
        created: createdSessions.count,
        skipped: sessions.length - createdSessions.count,
        total: sessions.length
      }
    });
  } catch (error) {
    console.error('Create batch attendance sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Edit multiple attendance entries at once (batch edit)
 */
export const batchEditAttendance = async (req: Request, res: Response) => {
  try {
    const { sessionId, entries } = req.body;

    // Validate session exists
    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId }
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Attendance session not found'
      });
    }

    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Entries must be a non-empty array'
      });
    }

    // Schema for validating entries
    const entrySchema = z.object({
      usn: z.string(),
      status: z.enum(['Present', 'Absent', 'Late', 'Excused'])
    });

    // Validate each entry
    const validatedEntries = [];
    const errors = [];

    for (let i = 0; i < entries.length; i++) {
      const result = entrySchema.safeParse(entries[i]);
      
      if (result.success) {
        validatedEntries.push(result.data);
      } else {
        errors.push({
          index: i,
          errors: result.error.format()
        });
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid entries found',
        errors
      });
    }

    // Get all existing entries for this session
    const existingEntries = await prisma.attendanceEntry.findMany({
      where: {
        sessionId
      }
    });

    // Create a map for quick lookup
    const existingEntriesMap = new Map();
    existingEntries.forEach(entry => {
      existingEntriesMap.set(entry.usn, entry);
    });

    // Process entries (update or create)
    const updatePromises = [];
    const createEntries = [];

    validatedEntries.forEach(entry => {
      const { usn, status } = entry;
      
      if (existingEntriesMap.has(usn)) {
        const existingEntry = existingEntriesMap.get(usn);
        
        if (existingEntry.status !== status) {
          updatePromises.push(
            prisma.attendanceEntry.update({
              where: {
                id: existingEntry.id
              },
              data: {
                status
              }
            })
          );
        }
      } else {
        createEntries.push({
          sessionId,
          usn,
          status
        });
      }
    });

    // Execute all updates and creates
    const updateResults = await Promise.all(updatePromises);
    
    let createResults = { count: 0 };
    if (createEntries.length > 0) {
      createResults = await prisma.attendanceEntry.createMany({
        data: createEntries,
        skipDuplicates: true
      });
    }

    res.status(200).json({
      success: true,
      message: 'Attendance entries updated successfully',
      data: {
        updated: updateResults.length,
        created: createResults.count,
        total: validatedEntries.length
      }
    });
  } catch (error) {
    console.error('Batch edit attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get students below attendance threshold
 */
export const getStudentsBelowThreshold = async (req: Request, res: Response) => {
  try {
    const { academicYear, semester, threshold } = req.query;
    
    if (!academicYear || !semester || !threshold) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: academicYear, semester, and threshold'
      });
    }
    
    // Get all attendance sessions for the semester and academic year
    const sessions = await prisma.attendanceSession.findMany({
      where: {
        academicYear: academicYear as string,
        semester: parseInt(semester as string)
      },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        entries: true
      }
    });
    
    // Group sessions by subject
    const sessionsBySubject = new Map();
    sessions.forEach(session => {
      const subjectId = session.subjectId;
      if (!sessionsBySubject.has(subjectId)) {
        sessionsBySubject.set(subjectId, []);
      }
      sessionsBySubject.get(subjectId).push(session);
    });
    
    // Calculate attendance percentages
    const studentsData = [];
    
    for (const [subjectId, subjectSessions] of sessionsBySubject.entries()) {
      // Group sessions by type (theory/lab)
      const theoryPeriods = subjectSessions
        .filter((s: any) => s.duration === 1)
        .reduce((total: number, s: any) => total + s.duration, 0);
        
      const labPeriods = subjectSessions
        .filter((s: any) => s.duration > 1)
        .reduce((total: number, s: any) => total + s.duration, 0);
      
      // Get unique students for this subject
      const studentUsns = new Set();
      subjectSessions.forEach(session => {
        session.entries.forEach(entry => {
          studentUsns.add(entry.usn);
        });
      });
      
      // Calculate attendance for each student
      for (const usn of studentUsns) {
        let theoryPresent = 0;
        let labPresent = 0;
        
        subjectSessions.forEach(session => {
          const studentEntry = session.entries.find(e => e.usn === usn);
          if (studentEntry && studentEntry.status === 'Present') {
            if (session.duration === 1) {
              theoryPresent += session.duration;
            } else {
              labPresent += session.duration;
            }
          }
        });
        
        // Calculate percentages
        const theoryPercentage = theoryPeriods > 0 
          ? (theoryPresent / theoryPeriods) * 100 
          : null;
          
        const labPercentage = labPeriods > 0 
          ? (labPresent / labPeriods) * 100 
          : null;
          
        const overallPercentage = (theoryPeriods + labPeriods > 0)
          ? ((theoryPresent + labPresent) / (theoryPeriods + labPeriods)) * 100
          : null;
        
        // Add students below threshold
        if (overallPercentage !== null && overallPercentage < parseInt(threshold as string)) {
          studentsData.push({
            usn,
            subjectId,
            subject: subjectSessions[0].subject,
            attendancePercentage: {
              theory: theoryPercentage !== null ? parseFloat(theoryPercentage.toFixed(2)) : null,
              lab: labPercentage !== null ? parseFloat(labPercentage.toFixed(2)) : null,
              overall: parseFloat(overallPercentage.toFixed(2))
            },
            totalClasses: {
              theory: theoryPeriods,
              lab: labPeriods,
              total: theoryPeriods + labPeriods
            },
            present: {
              theory: theoryPresent,
              lab: labPresent,
              total: theoryPresent + labPresent
            }
          });
        }
      }
    }
    
    // Get student details
    const studentUsns = studentsData.map(data => data.usn);
    const students = await prisma.student.findMany({
      where: {
        usn: {
          in: studentUsns
        }
      },
      select: {
        usn: true,
        firstName: true,
        lastName: true,
        section: true,
        semester: true
      }
    });
    
    // Create a map for quick lookup
    const studentMap = new Map();
    students.forEach(student => {
      studentMap.set(student.usn, student);
    });
    
    // Combine data
    const result = studentsData.map(data => ({
      ...data,
      student: studentMap.get(data.usn)
    }));
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get students below threshold error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
