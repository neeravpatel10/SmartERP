import { PrismaClient, SubjectStatus } from '@prisma/client';
const prisma = new PrismaClient();

// Get all subjects with status info
export const getAllSubjects = async () => {
  return await prisma.subject.findMany({
    include: {
      department: true,
      category: true,
      facultyMappings: {
        include: {
          faculty: true,
        },
      },
    },
  });
};

// Get subject by ID with status info
export const getSubjectById = async (id: number) => {
  return await prisma.subject.findUnique({
    where: { id },
    include: {
      department: true,
      category: true,
      facultyMappings: {
        include: {
          faculty: true,
        },
      },
      statusLogs: {
        orderBy: {
          timestamp: 'desc',
        },
        take: 10,
      },
    },
  });
};

// Create new subject (starts in draft status)
export const createSubject = async (subjectData: any, userId: number) => {
  const subject = await prisma.subject.create({
    data: {
      code: subjectData.code,
      name: subjectData.name,
      semester: subjectData.semester,
      credits: subjectData.credits,
      isLab: subjectData.isLab || false,
      departmentId: subjectData.departmentId,
      categoryId: subjectData.categoryId,
      schemeYear: subjectData.schemeYear,
      status: SubjectStatus.draft,
    },
  });

  // Log initial status
  await prisma.subjectStatusLog.create({
    data: {
      subjectId: subject.id,
      status: SubjectStatus.draft,
      changedBy: userId,
    },
  });

  return subject;
};

// Update subject status
export const updateSubjectStatus = async (id: number, newStatus: SubjectStatus, userId: number) => {
  const subject = await prisma.subject.findUnique({
    where: { id },
  });

  if (!subject) {
    throw new Error('Subject not found');
  }

  // Validate status transition
  validateStatusTransition(subject.status, newStatus);

  // Update timestamps based on the new status
  const updateData: any = { status: newStatus };
  
  if (newStatus === SubjectStatus.locked) {
    updateData.lockedAt = new Date();
  }
  
  if (newStatus === SubjectStatus.archived) {
    updateData.archivedAt = new Date();
  }

  // Update subject status
  const updatedSubject = await prisma.subject.update({
    where: { id },
    data: updateData,
  });

  // Create status log entry
  await prisma.subjectStatusLog.create({
    data: {
      subjectId: id,
      status: newStatus,
      changedBy: userId,
    },
  });

  return updatedSubject;
};

// Get subject status history
export const getSubjectStatusHistory = async (id: number) => {
  return await prisma.subjectStatusLog.findMany({
    where: { subjectId: id },
    orderBy: { timestamp: 'desc' },
    include: {
      subject: true,
    },
  });
};

// Helper to validate status transitions
const validateStatusTransition = (currentStatus: SubjectStatus, newStatus: SubjectStatus) => {
  const allowedTransitions: Record<SubjectStatus, SubjectStatus[]> = {
    [SubjectStatus.draft]: [SubjectStatus.active],
    [SubjectStatus.active]: [SubjectStatus.locked],
    [SubjectStatus.locked]: [SubjectStatus.active, SubjectStatus.archived],
    [SubjectStatus.archived]: [],
  };

  if (!allowedTransitions[currentStatus].includes(newStatus)) {
    throw new Error(`Cannot transition from ${currentStatus} to ${newStatus}`);
  }
};

// Update subject details
export const updateSubject = async (id: number, subjectData: any) => {
  return await prisma.subject.update({
    where: { id },
    data: {
      code: subjectData.code,
      name: subjectData.name,
      semester: subjectData.semester,
      credits: subjectData.credits,
      isLab: subjectData.isLab,
      departmentId: subjectData.departmentId,
      categoryId: subjectData.categoryId,
      schemeYear: subjectData.schemeYear,
    },
  });
};

// Get subjects filtered by status
export const getSubjectsByStatus = async (status: SubjectStatus) => {
  return await prisma.subject.findMany({
    where: { status },
    include: {
      department: true,
      category: true,
      facultyMappings: {
        include: {
          faculty: true,
        },
      },
    },
  });
};

// Get subjects by department
export const getSubjectsByDepartment = async (departmentId: number) => {
  return await prisma.subject.findMany({
    where: { departmentId },
    include: {
      category: true,
      facultyMappings: {
        include: {
          faculty: true,
        },
      },
    },
  });
};

// Delete subject
export const deleteSubject = async (id: number) => {
  // Check if subject is in draft status
  const subject = await prisma.subject.findUnique({
    where: { id },
  });

  if (!subject) {
    throw new Error('Subject not found');
  }

  if (subject.status !== SubjectStatus.draft) {
    throw new Error('Only subjects in draft status can be deleted');
  }

  return await prisma.subject.delete({
    where: { id },
  });
}; 