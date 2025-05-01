import { prisma } from '../index';

/**
 * Check if a user has the required role permissions
 * @param userId User ID to check permissions for
 * @param requiredRole The role required for access
 * @returns Boolean indicating whether user has permission
 */
export const checkRolePermission = async (userId: number, requiredRole: number): Promise<boolean> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) return false;
    
    // Super admin (role 1) has access to everything
    if (user.loginType === 1) return true;
    
    // Check if user's role matches or exceeds the required role
    return user.loginType <= requiredRole;
  } catch (error) {
    console.error('Error checking role permission:', error);
    return false;
  }
};

/**
 * Check if a faculty member has access to a student's data
 * @param facultyId Faculty user ID
 * @param studentUsn Student USN
 * @returns Boolean indicating whether faculty has access
 */
export const checkFacultyStudentAccess = async (facultyId: number, studentUsn: string): Promise<boolean> => {
  try {
    // Get faculty details
    const faculty = await prisma.faculty.findFirst({
      where: { userId: facultyId }
    });
    
    if (!faculty) return false;
    
    // Get student details
    const student = await prisma.student.findUnique({
      where: { usn: studentUsn },
      select: { 
        departmentId: true,
        batchId: true,
        semester: true,
        section: true
      }
    });
    
    if (!student) return false;
    
    // Check if faculty is in the same department
    if (faculty.departmentId === student.departmentId) {
      // Check if faculty teaches any subjects for this student
      const facultySubjects = await prisma.facultySubjectMapping.findMany({
        where: {
          facultyId: faculty.id,
          status: 'active' as any
        },
        include: {
          subject: {
            select: {
              id: true,
              semester: true,
              departmentId: true
            }
          }
        }
      });
      
      // Check if any of the faculty's subjects match the student's semester
      return facultySubjects.some(mapping => 
        mapping.subject.semester === student.semester && 
        mapping.subject.departmentId === student.departmentId
      );
    }
    
    return false;
  } catch (error) {
    console.error('Error checking faculty-student access:', error);
    return false;
  }
};

/**
 * Check if a department admin has access to a student's data
 * @param adminId Department admin user ID
 * @param studentUsn Student USN
 * @returns Boolean indicating whether admin has access
 */
export const checkDepartmentAdminAccess = async (adminId: number, studentUsn: string): Promise<boolean> => {
  try {
    // Get admin details
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { departmentId: true }
    });
    
    if (!admin || !admin.departmentId) return false;
    
    // Get student details
    const student = await prisma.student.findUnique({
      where: { usn: studentUsn },
      select: { departmentId: true }
    });
    
    if (!student) return false;
    
    // Department admin has access to students in their department
    return admin.departmentId === student.departmentId;
  } catch (error) {
    console.error('Error checking department admin access:', error);
    return false;
  }
}; 