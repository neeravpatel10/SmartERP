"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardData = void 0;
const index_1 = require("../index");
/**
 * Get integrated dashboard data based on user role
 */
const getDashboardData = async (req, res) => {
    try {
        const { userId, loginType } = req.user;
        let dashboardData = {};
        if (loginType === 1) {
            // Super Admin Dashboard
            dashboardData = await getSuperAdminDashboard();
        }
        else if (loginType === 2) {
            // Faculty Dashboard
            dashboardData = await getFacultyDashboard(userId);
        }
        else if (loginType === 3) {
            // Department Admin Dashboard
            dashboardData = await getDepartmentAdminDashboard(userId);
        }
        else if (loginType === -1) {
            try {
                // Student Dashboard
                dashboardData = await getStudentDashboard(userId);
            }
            catch (error) {
                const err = error;
                if (err.message === 'Student record not found') {
                    return res.status(404).json({
                        success: false,
                        message: 'No student profile found for your account. Please contact an administrator.'
                    });
                }
                throw error; // re-throw any other errors
            }
        }
        return res.json({
            success: true,
            data: dashboardData
        });
    }
    catch (error) {
        console.error('Dashboard data error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard data'
        });
    }
};
exports.getDashboardData = getDashboardData;
/**
 * Get dashboard data for Super Admin
 */
const getSuperAdminDashboard = async () => {
    // Run queries in parallel for better performance
    const [studentsCount, facultyCount, departmentsCount, subjectsCount, recentAttendance, recentMarks, lowAttendance, pendingMarksCount] = await Promise.all([
        // Count of students
        index_1.prisma.student.count(),
        // Count of faculty
        index_1.prisma.faculty.count(),
        // Count of departments
        index_1.prisma.department.count(),
        // Count of subjects
        index_1.prisma.subject.count(),
        // Recent attendance sessions
        index_1.prisma.attendanceSession.findMany({
            take: 5,
            orderBy: { attendanceDate: 'desc' },
            include: {
                subject: true,
                faculty: true,
                _count: {
                    select: { attendanceentry: true }
                },
                attendanceentry: {
                    select: { status: true }
                }
            }
        }),
        // Recent marks entries
        index_1.prisma.studentcomponentmark.findMany({
            take: 5,
            orderBy: { updatedAt: 'desc' },
            include: {
                examcomponent: {
                    include: {
                        subject: true
                    }
                },
                user: {
                    include: {
                        facultyAccount: true
                    }
                }
            },
            distinct: ['componentId']
        }),
        // Students with low attendance
        index_1.prisma.$queryRaw `
      SELECT s.usn, CONCAT(s.firstName, ' ', s.lastName) as name, 
        AVG(CASE WHEN ae.status = 'Present' THEN 100 ELSE 0 END) as attendancePercentage,
        GROUP_CONCAT(DISTINCT subj.code SEPARATOR ', ') as subjects
      FROM student s
      JOIN attendanceentry ae ON s.usn = ae.usn
      JOIN attendancesession sess ON ae.sessionId = sess.id
      JOIN subject subj ON sess.subjectId = subj.id
      GROUP BY s.usn
      HAVING attendancePercentage < 75
      LIMIT 10
    `,
        // Count subjects needing marks entry
        index_1.prisma.examcomponent.count({
            where: {
                studentcomponentmark: {
                    none: {}
                }
            }
        })
    ]);
    // Process the attendance data
    const formattedAttendance = recentAttendance.map((session) => {
        const total = session._count.attendanceentry;
        const present = session.attendanceentry.filter((entry) => entry.status === 'Present').length;
        return {
            id: session.id,
            date: session.attendanceDate,
            faculty: {
                name: session.faculty ? `${session.faculty.name || ''}` : 'N/A'
            },
            subject: {
                code: session.subject.code,
                name: session.subject.name
            },
            total,
            present
        };
    });
    // Process the marks data
    const formattedMarks = recentMarks.map((mark) => {
        var _a, _b;
        return {
            id: mark.id,
            componentId: mark.componentId,
            updatedAt: mark.updatedAt,
            component: {
                name: mark.examcomponent.name,
                maxMarks: mark.examcomponent.maxMarks
            },
            subject: {
                code: mark.examcomponent.subject.code
            },
            faculty: {
                name: ((_b = (_a = mark.user) === null || _a === void 0 ? void 0 : _a.facultyAccount) === null || _b === void 0 ? void 0 : _b.name) || 'N/A'
            },
            averageMarks: 0 // This would ideally be calculated
        };
    });
    return {
        students: studentsCount,
        faculty: facultyCount,
        departments: departmentsCount,
        subjects: subjectsCount,
        recentAttendance: formattedAttendance,
        recentMarks: formattedMarks,
        lowAttendance,
        pendingMarks: pendingMarksCount
    };
};
/**
 * Get dashboard data for Faculty
 */
const getFacultyDashboard = async (facultyId) => {
    // Run queries in parallel for better performance
    const [subjectsCount, attendanceSessionsCount, recentAttendance, recentMarks, lowAttendance, pendingComponents] = await Promise.all([
        // Count of subjects assigned to faculty
        index_1.prisma.facultySubjectMapping.count({
            where: {
                facultyId: String(facultyId),
                status: 'active'
            }
        }),
        // Count of attendance sessions taken by faculty
        index_1.prisma.attendancesession.count({
            where: {
                facultyId: String(facultyId)
            }
        }),
        // Recent attendance sessions by faculty
        index_1.prisma.attendanceSession.findMany({
            where: {
                facultyId: String(facultyId)
            },
            take: 5,
            orderBy: { attendanceDate: 'desc' },
            include: {
                subject: true,
                _count: {
                    select: { attendanceentry: true }
                },
                attendanceentry: {
                    select: { status: true }
                }
            }
        }),
        // Recent marks entries by faculty
        index_1.prisma.studentcomponentmark.findMany({
            where: {
                recordedBy: facultyId
            },
            take: 5,
            orderBy: { updatedAt: 'desc' },
            include: {
                examcomponent: {
                    include: {
                        subject: true
                    }
                }
            },
            distinct: ['componentId']
        }),
        // Students with low attendance in faculty's subjects
        index_1.prisma.$queryRaw `
      SELECT s.usn, CONCAT(s.firstName, ' ', s.lastName) as name, 
        AVG(CASE WHEN ae.status = 'Present' THEN 100 ELSE 0 END) as attendancePercentage,
        GROUP_CONCAT(DISTINCT subj.code SEPARATOR ', ') as subjects
      FROM student s
      JOIN attendanceentry ae ON s.usn = ae.usn
      JOIN attendancesession sess ON ae.sessionId = sess.id
      JOIN subject subj ON sess.subjectId = subj.id
      WHERE sess.facultyId = ${String(facultyId)}
      GROUP BY s.usn
      HAVING attendancePercentage < 75
      LIMIT 10
    `,
        // Components pending mark entry for faculty
        index_1.prisma.examcomponent.findMany({
            where: {
                subject: {
                    facultyMappings: {
                        some: {
                            facultyId: String(facultyId),
                            status: 'active'
                        }
                    }
                },
                studentcomponentmark: {
                    none: {}
                }
            },
            include: {
                subject: {
                    select: {
                        code: true,
                        name: true
                    }
                }
            }
        })
    ]);
    // Process the attendance data
    const formattedAttendance = recentAttendance.map((session) => {
        const total = session._count.attendanceentry;
        const present = session.attendanceentry.filter((entry) => entry.status === 'Present').length;
        return {
            id: session.id,
            date: session.attendanceDate,
            subject: {
                code: session.subject.code,
                name: session.subject.name
            },
            total,
            present
        };
    });
    // Process the marks data
    const formattedMarks = recentMarks.map((mark) => {
        return {
            id: mark.id,
            componentId: mark.componentId,
            updatedAt: mark.updatedAt,
            component: {
                name: mark.examcomponent.name,
                maxMarks: mark.examcomponent.maxMarks
            },
            subject: {
                code: mark.examcomponent.subject.code
            },
            averageMarks: 0 // This would ideally be calculated
        };
    });
    return {
        subjects: subjectsCount,
        attendanceSessions: attendanceSessionsCount,
        recentAttendance: formattedAttendance,
        recentMarks: formattedMarks,
        lowAttendance,
        pendingComponents
    };
};
/**
 * Get dashboard data for Department Admin
 */
const getDepartmentAdminDashboard = async (userId) => {
    // Get the department ID for this admin
    const user = await index_1.prisma.user.findUnique({
        where: { id: userId },
        select: { departmentId: true }
    });
    if (!(user === null || user === void 0 ? void 0 : user.departmentId)) {
        throw new Error('Department admin without department assignment');
    }
    const departmentId = user.departmentId;
    // Run queries in parallel for better performance
    const [studentsCount, facultyCount, subjectsCount, recentAttendance, recentMarks, lowAttendance, pendingMarksCount] = await Promise.all([
        // Count of students in department
        index_1.prisma.student.count({
            where: {
                departmentId
            }
        }),
        // Count of faculty in department
        index_1.prisma.faculty.count({
            where: {
                departmentId
            }
        }),
        // Count of subjects in department
        index_1.prisma.subject.count({
            where: {
                departmentId
            }
        }),
        // Recent attendance sessions in department
        index_1.prisma.attendanceSession.findMany({
            where: {
                subject: {
                    departmentId
                }
            },
            take: 5,
            orderBy: { attendanceDate: 'desc' },
            include: {
                subject: true,
                faculty: true,
                _count: {
                    select: { attendanceentry: true }
                },
                attendanceentry: {
                    select: { status: true }
                }
            }
        }),
        // Recent marks entries in department
        index_1.prisma.studentcomponentmark.findMany({
            where: {
                examcomponent: {
                    subject: {
                        departmentId
                    }
                }
            },
            take: 5,
            orderBy: { updatedAt: 'desc' },
            include: {
                examcomponent: {
                    include: {
                        subject: true
                    }
                },
                user: {
                    include: {
                        facultyAccount: true
                    }
                }
            },
            distinct: ['componentId']
        }),
        // Students with low attendance in department
        index_1.prisma.$queryRaw `
      SELECT s.usn, CONCAT(s.firstName, ' ', s.lastName) as name, 
        AVG(CASE WHEN ae.status = 'Present' THEN 100 ELSE 0 END) as attendancePercentage,
        GROUP_CONCAT(DISTINCT subj.code SEPARATOR ', ') as subjects
      FROM student s
      JOIN attendanceentry ae ON s.usn = ae.usn
      JOIN attendancesession sess ON ae.sessionId = sess.id
      JOIN subject subj ON sess.subjectId = subj.id
      WHERE s.departmentId = ${departmentId}
      GROUP BY s.usn
      HAVING attendancePercentage < 75
      LIMIT 10
    `,
        // Count subjects needing marks entry in department
        index_1.prisma.examcomponent.count({
            where: {
                subject: {
                    departmentId
                },
                studentcomponentmark: {
                    none: {}
                }
            }
        })
    ]);
    // Process the attendance data
    const formattedAttendance = recentAttendance.map((session) => {
        const total = session._count.attendanceentry;
        const present = session.attendanceentry.filter((entry) => entry.status === 'Present').length;
        return {
            id: session.id,
            date: session.attendanceDate,
            faculty: {
                name: session.faculty ? `${session.faculty.name || ''}` : 'N/A'
            },
            subject: {
                code: session.subject.code,
                name: session.subject.name
            },
            total,
            present
        };
    });
    // Process the marks data
    const formattedMarks = recentMarks.map((mark) => {
        var _a, _b;
        return {
            id: mark.id,
            componentId: mark.componentId,
            updatedAt: mark.updatedAt,
            component: {
                name: mark.examcomponent.name,
                maxMarks: mark.examcomponent.maxMarks
            },
            subject: {
                code: mark.examcomponent.subject.code
            },
            faculty: {
                name: ((_b = (_a = mark.user) === null || _a === void 0 ? void 0 : _a.facultyAccount) === null || _b === void 0 ? void 0 : _b.name) || 'N/A'
            },
            averageMarks: 0 // This would ideally be calculated
        };
    });
    return {
        students: studentsCount,
        faculty: facultyCount,
        subjects: subjectsCount,
        recentAttendance: formattedAttendance,
        recentMarks: formattedMarks,
        lowAttendance,
        pendingMarks: pendingMarksCount
    };
};
/**
 * Get dashboard data for Student
 */
const getStudentDashboard = async (userId) => {
    console.log(`Looking for student with userId: ${userId}`);
    // Get the student details
    const student = await index_1.prisma.student.findFirst({
        where: {
            userId
        },
        select: {
            usn: true
        }
    });
    if (!student) {
        console.log(`No student found with userId: ${userId}`);
        throw new Error('Student record not found');
    }
    const usn = student.usn;
    // Run queries in parallel for better performance
    const [subjectsCount, attendanceData, marksData, semesterPerformance] = await Promise.all([
        // Count of subjects for the student - using raw query to avoid schema mismatch
        index_1.prisma.$queryRaw `
      SELECT COUNT(*) as count
      FROM subject s
      JOIN studentsubjectenrollment sse ON s.id = sse.subjectId
      WHERE sse.studentUsn = ${usn}
    `,
        // Fetch attendance data for the student
        index_1.prisma.$queryRaw `
      SELECT 
        subj.code as subjectCode,
        subj.name as subjectName,
        COUNT(ae.id) as totalSessions,
        SUM(CASE WHEN ae.status = 'Present' THEN 1 ELSE 0 END) as presentCount
      FROM student s
      JOIN attendanceentry ae ON s.usn = ae.usn
      JOIN attendancesession sess ON ae.sessionId = sess.id
      JOIN subject subj ON sess.subjectId = subj.id
      WHERE s.usn = ${usn}
      GROUP BY subj.id
    `,
        // Fetch recent marks for the student
        index_1.prisma.studentcomponentmark.findMany({
            where: {
                usn
            },
            take: 5,
            orderBy: { updatedAt: 'desc' },
            include: {
                examcomponent: {
                    include: {
                        subject: true
                    }
                }
            }
        }),
        // Fetch semester performance data
        index_1.prisma.$queryRaw `
      SELECT 
        s.semester as semesterNumber,
        AVG(scm.marksObtained / ec.maxMarks * 10) as sgpa
      FROM student s
      JOIN studentcomponentmark scm ON s.usn = scm.studentUsn
      JOIN examcomponent ec ON scm.componentId = ec.id
      WHERE s.usn = ${usn}
        AND ec.maxMarks IS NOT NULL AND ec.maxMarks <> 0
      GROUP BY s.semester
      ORDER BY s.semester
    `
    ]);
    // Process attendance data
    const subjects = {};
    let overallAttendance = 0;
    let totalSessions = 0;
    let totalPresent = 0;
    if (Array.isArray(attendanceData)) {
        attendanceData.forEach((data) => {
            const percentage = data.totalSessions > 0
                ? Math.round((data.presentCount / data.totalSessions) * 100)
                : 0; // Avoid division by zero
            subjects[data.subjectName] = percentage;
            totalSessions += data.totalSessions;
            totalPresent += data.presentCount;
        });
        overallAttendance = totalSessions > 0
            ? Math.round((totalPresent / totalSessions) * 100)
            : 0;
    }
    // Process marks data
    const formattedMarks = marksData.map((mark) => {
        var _a, _b, _c, _d;
        return {
            id: mark.id,
            component: {
                name: ((_a = mark.examcomponent) === null || _a === void 0 ? void 0 : _a.name) || 'N/A',
                maxMarks: ((_b = mark.examcomponent) === null || _b === void 0 ? void 0 : _b.maxMarks) || 0
            },
            subject: {
                code: ((_d = (_c = mark.examcomponent) === null || _c === void 0 ? void 0 : _c.subject) === null || _d === void 0 ? void 0 : _d.code) || 'N/A'
            },
            obtainedMarks: mark.marksObtained,
            date: mark.updatedAt
        };
    });
    // Calculate CGPA if semester data is available
    let cgpa = 0;
    if (Array.isArray(semesterPerformance) && semesterPerformance.length > 0) {
        let validSemesters = 0;
        const totalPoints = semesterPerformance.reduce((sum, sem) => {
            const sgpaValue = parseFloat(sem.sgpa);
            if (!isNaN(sgpaValue)) {
                validSemesters++;
                return sum + sgpaValue;
            }
            return sum;
        }, 0);
        if (validSemesters > 0) {
            cgpa = parseFloat((totalPoints / validSemesters).toFixed(2));
        }
    }
    // Extract subject count from raw query result
    const subjectCountResult = subjectsCount;
    const subjectCount = Array.isArray(subjectCountResult) && subjectCountResult.length > 0
        ? Number(subjectCountResult[0].count)
        : 0;
    return {
        subjects: subjectCount,
        studentStats: {
            attendance: {
                overall: `${overallAttendance}%`,
                subjects
            },
            performance: {
                cgpa,
                semesters: semesterPerformance
            },
            recentMarks: formattedMarks
        }
    };
};
