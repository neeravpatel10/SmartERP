import { Request, Response } from 'express';
import { prisma } from '../index';
import bcrypt from 'bcrypt';
import * as XLSX from 'xlsx';

export const createStudent = async (req: Request, res: Response) => {
  try {
    const {
      usn,
      firstName,
      middleName,
      lastName,
      email,
      phone,
      dob,
      gender,
      address,
      batchId,
      departmentId,
      semester,
      section,
      admissionYear,
      fatherName,
      motherName,
      guardianName,
      guardianContact
    } = req.body;

    // Check if USN already exists
    const existingStudentUSN = await prisma.student.findUnique({
      where: { usn }
    });

    if (existingStudentUSN) {
      return res.status(400).json({
        success: false,
        message: 'Student with this USN already exists'
      });
    }

    // Check if email already exists
    const existingStudentEmail = await prisma.student.findFirst({
      where: { email }
    });

    if (existingStudentEmail) {
      return res.status(400).json({
        success: false,
        message: 'Student with this email already exists'
      });
    }

    // Check if batch exists
    const batch = await prisma.batch.findUnique({
      where: { id: batchId }
    });

    if (!batch) {
      return res.status(400).json({
        success: false,
        message: 'Batch not found'
      });
    }

    // Check if department exists
    const department = await prisma.department.findUnique({
      where: { id: departmentId }
    });

    if (!department) {
      return res.status(400).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Create student
    const student = await prisma.student.create({
      data: {
        usn,
        firstName,
        middleName,
        lastName,
        email,
        phone,
        dob: dob ? new Date(dob) : undefined,
        gender,
        address,
        batchId,
        departmentId,
        semester,
        section,
        admissionYear,
        fatherName,
        motherName,
        guardianName,
        guardianContact
      },
      include: {
        batch: {
          select: {
            id: true,
            name: true,
            startYear: true,
            endYear: true
          }
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    });

    // Create user account for the student
    const username = usn.toLowerCase(); // Use USN as username
    const defaultPassword = `${usn.toLowerCase()}@${admissionYear}`; // Default password pattern
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash: hashedPassword,
        loginType: -1, // Student login type
        departmentId,
        isActive: true,
        firstLogin: true,
        student: {
          connect: {
            usn
          }
        }
      },
      select: {
        id: true,
        username: true,
        loginType: true,
        isActive: true,
        firstLogin: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Student created successfully',
      data: {
        student,
        user
      }
    });
  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const updateStudent = async (req: Request, res: Response) => {
  try {
    const { usn } = req.params;
    const {
      firstName,
      middleName,
      lastName,
      email,
      phone,
      dob,
      gender,
      address,
      batchId,
      departmentId,
      semester,
      section,
      fatherName,
      motherName,
      guardianName,
      guardianContact
    } = req.body;

    // Check if student exists
    const existingStudent = await prisma.student.findUnique({
      where: { usn }
    });

    if (!existingStudent) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // If email is being updated, check for duplicates
    if (email && email !== existingStudent.email) {
      const duplicateEmail = await prisma.student.findFirst({
        where: {
          email,
          usn: { not: usn }
        }
      });

      if (duplicateEmail) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use by another student'
        });
      }
    }

    // If batchId is provided, check if batch exists
    if (batchId) {
      const batch = await prisma.batch.findUnique({
        where: { id: batchId }
      });

      if (!batch) {
        return res.status(400).json({
          success: false,
          message: 'Batch not found'
        });
      }
    }

    // If departmentId is provided, check if department exists
    if (departmentId) {
      const department = await prisma.department.findUnique({
        where: { id: departmentId }
      });

      if (!department) {
        return res.status(400).json({
          success: false,
          message: 'Department not found'
        });
      }
    }

    // Update student
    const updatedStudent = await prisma.student.update({
      where: { usn },
      data: {
        firstName,
        middleName,
        lastName,
        email,
        phone,
        dob: dob ? new Date(dob) : undefined,
        gender,
        address,
        batchId,
        departmentId,
        semester,
        section,
        fatherName,
        motherName,
        guardianName,
        guardianContact
      },
      include: {
        batch: {
          select: {
            id: true,
            name: true,
            startYear: true,
            endYear: true
          }
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    });

    // If email is updated, also update the linked user account
    if (email && email !== existingStudent.email) {
      await prisma.user.updateMany({
        where: {
          student: {
            usn
          }
        },
        data: {
          email
        }
      });
    }

    // If department is updated, also update the linked user account
    if (departmentId && departmentId !== existingStudent.departmentId) {
      await prisma.user.updateMany({
        where: {
          student: {
            usn
          }
        },
        data: {
          departmentId
        }
      });
    }

    res.json({
      success: true,
      message: 'Student updated successfully',
      data: updatedStudent
    });
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getStudents = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, search = '', departmentId, batchId, semester, section } = req.query;
    let pageNumber = parseInt(page as string);
    let limitNumber = parseInt(limit as string);

    // Ensure pageNumber and limitNumber are valid positive integers
    if (isNaN(pageNumber) || pageNumber < 1) {
      pageNumber = 1;
    }
    if (isNaN(limitNumber) || limitNumber < 1) {
      limitNumber = 10; // Or a reasonable default limit
    }

    // Build filter conditions
    const filterConditions: any = {};

    if (departmentId) {
      filterConditions.departmentId = parseInt(departmentId as string);
    }

    if (batchId) {
      filterConditions.batchId = parseInt(batchId as string);
    }

    if (semester) {
      filterConditions.semester = parseInt(semester as string);
    }

    if (section) {
      filterConditions.section = section as string;
    }

    // Build search condition
    const searchCondition = search ? {
      OR: [
        { firstName: { contains: search as string } },
        { lastName: { contains: search as string } },
        { usn: { contains: search as string } },
        { email: { contains: search as string } }
      ]
    } : {};

    // Combine filter and search conditions
    const whereCondition = {
      ...filterConditions,
      ...searchCondition
    };

    // Get total count for pagination
    const total = await prisma.student.count({
      where: whereCondition
    });

    // Get students with pagination, filtering, and search
    const students = await prisma.student.findMany({
      where: whereCondition,
      select: {
        usn: true,
        firstName: true,
        middleName: true,
        lastName: true,
        email: true,
        phone: true,
        semester: true,
        section: true,
        batch: {
          select: {
            id: true,
            name: true
          }
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        user: {
          select: {
            id: true,
            isActive: true
          }
        }
      },
      skip: (pageNumber - 1) * limitNumber,
      take: limitNumber,
      orderBy: [
        { semester: 'asc' },
        { section: 'asc' },
        { firstName: 'asc' }
      ]
    });

    res.json({
      success: true,
      data: {
        students,
        pagination: {
          total,
          page: pageNumber,
          limit: limitNumber,
          totalPages: Math.ceil(total / limitNumber)
        }
      }
    });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getStudentByUSN = async (req: Request, res: Response) => {
  try {
    const { usn } = req.params;

    const student = await prisma.student.findUnique({
      where: { usn },
      include: {
        batch: {
          select: {
            id: true,
            name: true,
            startYear: true,
            endYear: true
          }
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        user: {
          select: {
            id: true,
            username: true,
            isActive: true,
            lastLogin: true
          }
        }
      }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.json({
      success: true,
      data: student
    });
  } catch (error) {
    console.error('Get student by USN error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const bulkUploadStudents = async (req: Request, res: Response) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Fetch all batches and departments for lookup
    const allBatches = await prisma.batch.findMany({ select: { id: true, name: true } });
    const allDepartments = await prisma.department.findMany({ select: { id: true, name: true, code: true } });

    // Create maps for efficient name-to-ID lookup (case-insensitive)
    const batchNameToId = new Map(allBatches.map(b => [b.name.toLowerCase(), b.id]));
    // Allow lookup by name or code for departments
    const departmentNameToId = new Map<string, number>();
    allDepartments.forEach(d => {
      departmentNameToId.set(d.name.toLowerCase(), d.id);
      if (d.code) {
        departmentNameToId.set(d.code.toLowerCase(), d.id);
      }
    });


    // Process the uploaded file (Excel/CSV)
    const fileBuffer = req.file.buffer;
    let studentsData: any[] = [];
    let parsingErrors: any[] = [];

    try {
      // Parse the Excel or CSV file
      const workbook = XLSX.read(fileBuffer, { type: 'buffer', cellDates: true }); // Enable cellDates for DOB
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      // Use { raw: false } to get formatted strings, { defval: '' } for empty cells
      const rawData = XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: '' }); 
      
      // Transform the data to match our student schema
      studentsData = rawData.map((row: any, index: number) => {
        const rowIndex = index + 2; // Assuming headers are on row 1

        // Flexible header matching (case-insensitive, common variations)
        const getRowValue = (keys: string[]) => {
          for (const key of keys) {
            const lowerKey = key.toLowerCase();
            const matchingHeader = Object.keys(row).find(header => header.toLowerCase() === lowerKey);
            if (matchingHeader && row[matchingHeader] !== '') {
              return String(row[matchingHeader]).trim(); // Ensure string and trim whitespace
            }
          }
          return ''; // Return empty string if no key matches or value is empty
        };

        const batchName = getRowValue(['batch', 'batch_name']);
        const departmentNameOrCode = getRowValue(['dept_name', 'branch', 'dept', 'department']);
        const admissionYearStr = getRowValue(['reg_year', 'admissionyear', 'admission_year', 'admission year']);
        const semesterStr = getRowValue(['semester', 'sem']);
        const dobValue = getRowValue(['dob', 'date of birth']);

        const batchId = batchNameToId.get(batchName.toLowerCase());
        const departmentId = departmentNameToId.get(departmentNameOrCode.toLowerCase());

        // --- Basic Data Cleaning and Parsing ---
        let semester: number | null = parseInt(semesterStr, 10);
        if (isNaN(semester)) semester = null;

        let admissionYear: number | null = parseInt(admissionYearStr, 10);
        if (isNaN(admissionYear)) admissionYear = null;
        
        let dob: Date | undefined = undefined;
        if (dobValue) {
          // Try parsing common date formats or if XLSX parsed it already
          const parsedDate = new Date(dobValue); 
          if (!isNaN(parsedDate.getTime())) {
             // Check if it's a reasonable date (e.g., not epoch 0 if original string was not '0')
             if (parsedDate.getTime() !== 0 || dobValue === '0') { 
               dob = parsedDate;
             }
          } 
          // Add more robust date parsing if needed for specific Excel formats
        }

        const usn = getRowValue(['usn', 'usn number']);
        const email = getRowValue(['email', 'email_id', 'email id']);
        const phone = getRowValue(['phone', 'mob_no', 'mobile', 'contact']);


        // Collect potential issues for this row
        const rowIssues: string[] = [];
        if (!usn) rowIssues.push("Missing USN");
        if (!email) rowIssues.push("Missing Email");
        if (!getRowValue(['fname', 'firstname', 'first name'])) rowIssues.push("Missing First Name");
        if (!getRowValue(['lname', 'lastname', 'last name'])) rowIssues.push("Missing Last Name");
        if (batchName && !batchId) rowIssues.push(`Batch '${batchName}' not found`);
        if (departmentNameOrCode && !departmentId) rowIssues.push(`Department '${departmentNameOrCode}' not found`);
        if (!batchId) rowIssues.push("Missing valid Batch");
        if (!departmentId) rowIssues.push("Missing valid Department");
        if (semesterStr && semester === null) rowIssues.push("Invalid Semester value");
        if (!semester) rowIssues.push("Missing Semester"); // Make semester required?
        if (admissionYearStr && admissionYear === null) rowIssues.push("Invalid Admission Year value");
        if (!admissionYear) rowIssues.push("Missing Admission Year"); // Make admission year required

        return {
          originalRowIndex: rowIndex, // Keep track for error reporting
          usn,
          firstName: getRowValue(['fname', 'firstname', 'first name']),
          middleName: getRowValue(['mname', 'middlename', 'middle name']),
          lastName: getRowValue(['lname', 'lastname', 'last name']),
          email,
          phone,
          dob,
          gender: getRowValue(['gender']),
          address: getRowValue(['address', 'addr']),
          batchId, // Looked-up ID
          departmentId, // Looked-up ID
          semester,
          section: getRowValue(['section', 'sec']),
          admissionYear, // Parsed from reg_year
          fatherName: getRowValue(['fathername', 'father name', 'ffname']),
          motherName: getRowValue(['mothername', 'mother name', 'mfname']),
          guardianName: getRowValue(['guardianname', 'guardian name', 'gfname']),
          guardianContact: getRowValue(['guardiancontact', 'guardian phone', 'gphone']),
          _issues: rowIssues, // Store issues for validation
          _batchName: batchName, // Store original names for error reporting
          _departmentNameOrCode: departmentNameOrCode
        };
      });
      
      if (!Array.isArray(studentsData) || studentsData.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid student data found in the file'
        });
      }
      
      // --- Validation Phase ---
      const invalidEntries = studentsData.filter(student => student._issues.length > 0);

      if (invalidEntries.length > 0) {
        const formattedErrors = invalidEntries.map(entry => ({
          row: entry.originalRowIndex,
          usn: entry.usn || 'N/A',
          batchAttempted: entry._batchName,
          deptAttempted: entry._departmentNameOrCode,
          issues: entry._issues
        }));
        return res.status(400).json({
          success: false,
          message: `Found ${invalidEntries.length} invalid entries in the file. Please correct them and re-upload.`,
          errors: formattedErrors
        });
      }

    } catch (parseError: any) {
      console.error('File parsing or data transformation error:', parseError);
      return res.status(400).json({
        success: false,
        message: `Failed to parse file or process data: ${parseError.message}`
      });
    }
    
    // Filter out entries that had issues during mapping (already handled above, but as safeguard)
    const validStudents = studentsData.filter(student => student._issues.length === 0);

    if (validStudents.length === 0) {
       return res.status(400).json({
         success: false,
         message: 'No valid student records to process after validation.'
       });
     }


    // Collect all valid USNs and emails for duplicate check
    const usns = validStudents.map(student => student.usn);
    const emails = validStudents.map(student => student.email);

    // Check for duplicate USNs/Emails within the file itself
    const usnCounts = usns.reduce((acc, usn) => ({ ...acc, [usn]: (acc[usn] || 0) + 1 }), {} as Record<string, number>);
    const emailCounts = emails.reduce((acc, email) => ({ ...acc, [email]: (acc[email] || 0) + 1 }), {} as Record<string, number>);
    const duplicateUsnsInFile = Object.entries(usnCounts).filter(([_, count]) => count > 1).map(([usn, _]) => usn);
    const duplicateEmailsInFile = Object.entries(emailCounts).filter(([_, count]) => count > 1).map(([email, _]) => email);

    if (duplicateUsnsInFile.length > 0 || duplicateEmailsInFile.length > 0) {
       return res.status(400).json({
         success: false,
         message: 'Duplicate USNs or Emails found within the uploaded file.',
         data: {
           duplicateUsnsInFile,
           duplicateEmailsInFile
         }
       });
     }


    // Check for duplicates in the database
    const existingStudents = await prisma.student.findMany({
      where: {
        OR: [
          { usn: { in: usns } },
          { email: { in: emails } }
        ]
      },
      select: {
        usn: true,
        email: true
      }
    });

    if (existingStudents.length > 0) {
      // Report which specific USNs/Emails already exist
      const existingUSNs = existingStudents.map(s => s.usn);
      const existingEmails = existingStudents.map(s => s.email);
       const conflictingEntries = validStudents.filter(s => existingUSNs.includes(s.usn) || existingEmails.includes(s.email))
         .map(s => ({ 
             row: s.originalRowIndex, 
             usn: s.usn, 
             email: s.email, 
             conflict: existingUSNs.includes(s.usn) ? 'USN exists' : 'Email exists' 
         }));

      return res.status(400).json({
        success: false,
        message: `Found ${existingStudents.length} students with conflicting USN or Email already in the database.`,
        errors: conflictingEntries
      });
    }
    
    // --- Database Insertion Phase ---
    let createdStudentsCount = 0;
    const creationErrors: any[] = [];

    // Use transaction for atomicity
    try {
      await prisma.$transaction(async (tx) => {
        for (const student of validStudents) {
           try {
             const createdStudent = await tx.student.create({
               data: {
                 usn: student.usn,
                 firstName: student.firstName,
                 middleName: student.middleName,
                 lastName: student.lastName,
                 email: student.email,
                 phone: student.phone,
                 dob: student.dob,
                 gender: student.gender,
                 address: student.address,
                 batchId: student.batchId!, // Assert non-null as validation passed
                 departmentId: student.departmentId!, // Assert non-null
                 semester: student.semester!, // Assert non-null
                 section: student.section,
                 admissionYear: student.admissionYear!, // Assert non-null
                 fatherName: student.fatherName,
                 motherName: student.motherName,
                 guardianName: student.guardianName,
                 guardianContact: student.guardianContact
               }
             });
  
             // Create user account
             const username = createdStudent.usn.toLowerCase();
             const defaultPassword = `${username}@${createdStudent.admissionYear}`; // Use created student's data
             const hashedPassword = await bcrypt.hash(defaultPassword, 10);
  
             await tx.user.create({
               data: {
                 username,
                 email: createdStudent.email,
                 passwordHash: hashedPassword,
                 loginType: -1, // Student login type
                 departmentId: createdStudent.departmentId,
                 isActive: true,
                 firstLogin: true,
                 student: {
                   connect: {
                     usn: createdStudent.usn
                   }
                 }
               }
             });
             createdStudentsCount++;
           } catch (studentError: any) {
             // Log individual creation error and add to list
             console.error(`Error creating student USN ${student.usn} (Row ${student.originalRowIndex}):`, studentError);
             creationErrors.push({ 
               row: student.originalRowIndex, 
               usn: student.usn, 
               error: studentError.message || 'Failed to create student or user' 
             });
             // Important: Re-throw the error to abort the transaction
             throw studentError; 
           }
         }
      }); // End transaction

      // If transaction succeeded without re-throwing error
       res.status(201).json({
         success: true,
         message: `Successfully added ${createdStudentsCount} students.`,
         data: {
           count: createdStudentsCount
         }
       });

    } catch (transactionError: any) {
       // Transaction was rolled back
       console.error('Bulk upload transaction error:', transactionError);
       res.status(500).json({
         success: false,
         message: 'Bulk upload failed due to an error during database insertion. Transaction rolled back.',
         // Provide specific errors if available and safe to expose
         errors: creationErrors.length > 0 ? creationErrors : [{ error: transactionError.message || 'Transaction failed' }]
       });
     }

  } catch (error: any) {
    // Catch-all for unexpected errors (e.g., initial DB fetch failure)
    console.error('Unexpected bulk upload students error:', error);
    res.status(500).json({
      success: false,
      message: `Internal server error: ${error.message}`
    });
  }
}; 