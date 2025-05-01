import { PrismaClient, SubjectStatus } from '@prisma/client';
import { getDefaultComponentsForSubject } from './examComponentService';

const prisma = new PrismaClient();

/**
 * Transition a subject from draft to active state
 * Validates that necessary conditions are met before activation
 */
export const activateSubject = async (subjectId: number, userId: number) => {
  // Get the subject with relevant relations
  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    include: {
      facultyMappings: true,
      examComponents: true,
      category: true
    }
  });

  if (!subject) {
    throw new Error('Subject not found');
  }

  // Verify subject is in draft state
  if (subject.status !== 'draft') {
    throw new Error('Only subjects in draft state can be activated');
  }

  // Verify subject has a category assigned
  if (!subject.categoryId) {
    throw new Error('Subject must have a category assigned before activation');
  }

  // Verify subject has at least one faculty mapping
  if (subject.facultyMappings.length === 0) {
    throw new Error('Subject must be assigned to at least one faculty member before activation');
  }

  // If no exam components exist, generate default ones based on category
  if (subject.examComponents.length === 0) {
    await getDefaultComponentsForSubject(subjectId);
  }

  // Update subject status and create a log entry
  return await prisma.$transaction([
    prisma.subject.update({
      where: { id: subjectId },
      data: { status: 'active' }
    }),
    prisma.subjectStatusLog.create({
      data: {
        subjectId,
        status: 'active',
        changedBy: userId
      }
    })
  ]);
};

/**
 * Lock a subject, preventing further edits to marks and attendance
 * Validates that necessary conditions are met before locking
 */
export const lockSubject = async (subjectId: number, userId: number) => {
  // Get the subject with relevant relations
  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    include: {
      examComponents: {
        include: {
          studentMarks: true
        }
      }
    }
  });

  if (!subject) {
    throw new Error('Subject not found');
  }

  // Verify subject is in active state
  if (subject.status !== 'active') {
    throw new Error('Only active subjects can be locked');
  }

  // Verify all components have at least some marks recorded
  const hasComponents = subject.examComponents.length > 0;
  if (!hasComponents) {
    throw new Error('Subject must have at least one exam component before locking');
  }
  
  const hasMarks = subject.examComponents.some(component => component.studentMarks.length > 0);
  if (!hasMarks) {
    throw new Error('At least one component should have marks recorded before locking');
  }

  // Update subject status, set locked timestamp, and create a log entry
  return await prisma.$transaction([
    prisma.subject.update({
      where: { id: subjectId },
      data: { 
        status: 'locked',
        lockedAt: new Date()
      }
    }),
    prisma.subjectStatusLog.create({
      data: {
        subjectId,
        status: 'locked',
        changedBy: userId
      }
    })
  ]);
};

/**
 * Unlock a locked subject (Super Admin only)
 */
export const unlockSubject = async (subjectId: number, userId: number) => {
  const subject = await prisma.subject.findUnique({
    where: { id: subjectId }
  });

  if (!subject) {
    throw new Error('Subject not found');
  }

  // Verify subject is in locked state
  if (subject.status !== 'locked') {
    throw new Error('Only locked subjects can be unlocked');
  }

  // Update subject status, clear locked timestamp, and create a log entry
  return await prisma.$transaction([
    prisma.subject.update({
      where: { id: subjectId },
      data: { 
        status: 'active',
        lockedAt: null
      }
    }),
    prisma.subjectStatusLog.create({
      data: {
        subjectId,
        status: 'active',
        changedBy: userId
      }
    })
  ]);
};

/**
 * Archive a subject, making it read-only
 */
export const archiveSubject = async (subjectId: number, userId: number) => {
  const subject = await prisma.subject.findUnique({
    where: { id: subjectId }
  });

  if (!subject) {
    throw new Error('Subject not found');
  }

  // Verify subject is in locked state
  if (subject.status !== 'locked') {
    throw new Error('Only locked subjects can be archived');
  }

  // Update subject status, set archived timestamp, and create a log entry
  return await prisma.$transaction([
    prisma.subject.update({
      where: { id: subjectId },
      data: { 
        status: 'archived',
        archivedAt: new Date()
      }
    }),
    prisma.subjectStatusLog.create({
      data: {
        subjectId,
        status: 'archived',
        changedBy: userId
      }
    })
  ]);
};

/**
 * Get the status history of a subject
 */
export const getSubjectStatusHistory = async (subjectId: number) => {
  const subject = await prisma.subject.findUnique({
    where: { id: subjectId }
  });

  if (!subject) {
    throw new Error('Subject not found');
  }

  return await prisma.subjectStatusLog.findMany({
    where: { subjectId },
    orderBy: { timestamp: 'desc' },
    include: {
      subject: {
        select: {
          id: true,
          name: true,
          code: true
        }
      }
    }
  });
};

/**
 * Check if a subject can be transitioned to the given status
 * Returns an object with validation results
 */
export const validateStatusTransition = async (subjectId: number, targetStatus: SubjectStatus) => {
  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    include: {
      facultyMappings: true,
      examComponents: {
        include: {
          studentMarks: true
        }
      },
      attendanceSessions: true
    }
  });

  if (!subject) {
    throw new Error('Subject not found');
  }

  const hasCategory = !!subject.categoryId;
  const hasFacultyMappings = subject.facultyMappings.length > 0;
  const hasComponents = subject.examComponents.length > 0;
  const hasMarks = subject.examComponents.some(comp => comp.studentMarks.length > 0);
  const hasAttendance = subject.attendanceSessions.length > 0;

  switch (targetStatus) {
    case 'active':
      if (subject.status !== 'draft') {
        return { 
          valid: false, 
          message: 'Only subjects in draft state can be activated',
          checks: { hasCategory, hasFacultyMappings, hasComponents }
        };
      }
      
      return {
        valid: hasCategory && hasFacultyMappings,
        message: hasCategory && hasFacultyMappings ? 
          'Subject can be activated' : 
          'Subject does not meet requirements for activation',
        checks: { hasCategory, hasFacultyMappings, hasComponents }
      };

    case 'locked':
      if (subject.status !== 'active') {
        return { 
          valid: false, 
          message: 'Only active subjects can be locked',
          checks: { hasComponents, hasMarks, hasAttendance }
        };
      }

      return {
        valid: hasComponents && hasMarks,
        message: hasComponents && hasMarks ? 
          'Subject can be locked' : 
          'Subject does not meet requirements for locking',
        checks: { hasComponents, hasMarks, hasAttendance }
      };

    case 'archived':
      if (subject.status !== 'locked') {
        return { 
          valid: false, 
          message: 'Only locked subjects can be archived',
          checks: {}
        };
      }

      return {
        valid: true,
        message: 'Subject can be archived',
        checks: {}
      };

    default:
      return {
        valid: false,
        message: 'Invalid target status',
        checks: {}
      };
  }
}; 