import { PrismaClient } from '@prisma/client';
import { Request } from 'express';

const prisma = new PrismaClient();

/**
 * Creates an audit log entry for a user action
 */
export const createAuditLog = async (
  userId: number,
  action: string,
  entityType: string,
  entityId: string,
  oldValue?: any,
  newValue?: any,
  req?: Request
) => {
  try {
    const ipAddress = req?.ip || req?.headers['x-forwarded-for'] || 'unknown';
    const userAgent = req?.headers['user-agent'] || 'unknown';

    return await prisma.auditLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        oldValue: oldValue ? JSON.stringify(oldValue) : null,
        newValue: newValue ? JSON.stringify(newValue) : null,
        ipAddress: typeof ipAddress === 'string' ? ipAddress : ipAddress[0],
        userAgent
      }
    });
  } catch (error) {
    console.error('Error creating audit log:', error);
    // We don't want audit logging failures to break application flow
    // So we log the error but don't throw it
  }
};

/**
 * Retrieves audit logs with filtering options
 */
export const getAuditLogs = async (
  options: {
    userId?: number;
    action?: string;
    entityType?: string;
    entityId?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  } = {}
) => {
  const {
    userId,
    action,
    entityType,
    entityId,
    startDate,
    endDate,
    page = 1,
    limit = 50
  } = options;

  const where: any = {};

  if (userId) where.userId = userId;
  if (action) where.action = action;
  if (entityType) where.entityType = entityType;
  if (entityId) where.entityId = entityId;

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            username: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    }),
    prisma.auditLog.count({ where })
  ]);

  return {
    logs,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};

/**
 * Retrieves recent audit logs for a specific entity
 */
export const getEntityAuditLogs = async (
  entityType: string,
  entityId: string,
  limit = 10
) => {
  return prisma.auditLog.findMany({
    where: {
      entityType,
      entityId
    },
    include: {
      user: {
        select: {
          username: true,
          email: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: limit
  });
};

/**
 * Creates formatted data for export
 */
export const exportAuditLogs = async (options: any = {}) => {
  const { logs } = await getAuditLogs({
    ...options,
    limit: 1000 // Limit export to 1000 records
  });

  return logs.map(log => ({
    id: log.id,
    timestamp: log.createdAt,
    user: log.user.username,
    email: log.user.email,
    role: log.user.role,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    ipAddress: log.ipAddress,
    userAgent: log.userAgent,
    oldValue: log.oldValue ? JSON.stringify(log.oldValue) : null,
    newValue: log.newValue ? JSON.stringify(log.newValue) : null
  }));
}; 