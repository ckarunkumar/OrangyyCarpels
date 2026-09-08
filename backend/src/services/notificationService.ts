import { prisma } from '../lib/prisma';

export interface NotificationItem {
  id: number;
  userId?: string | null;
  role?: string | null;
  title: string;
  message: string;
  type: string;
  projectId?: string | null;
  isRead: boolean;
  readAt?: Date | null;
  createdAt: Date;
}

export class NotificationService {
  static async cleanupExpiredReadNotifications(): Promise<void> {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    try {
      await prisma.notification.deleteMany({
        where: {
          isRead: true,
          readAt: { not: null, lt: twoHoursAgo },
        },
      });
    } catch {
      // Ignore cleanup error
    }
  }

  static async getNotifications(role: string, userId?: string): Promise<NotificationItem[]> {
    await this.cleanupExpiredReadNotifications();
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

    const list = await prisma.notification.findMany({
      where: {
        AND: [
          {
            OR: [
              { role: 'All' },
              { role },
              ...(userId ? [{ userId }] : []),
            ],
          },
          {
            OR: [
              { isRead: false },
              { isRead: true, readAt: { gte: twoHoursAgo } },
            ],
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 40,
    });

    if (list.length === 0) {
      return this.seedInitialNotifications(role, userId);
    }
    return list;
  }

  static async seedInitialNotifications(role: string, userId?: string): Promise<NotificationItem[]> {
    const activeProjects = await prisma.project.findMany({ where: { status: 'Active' }, take: 2 });
    const p1 = activeProjects[0] || { id: 'AODP0001', name: 'Website Redesign' };
    const p2 = activeProjects[1] || { id: 'AODP0002', name: 'CMS Integration' };

    const defaultAlerts = [
      {
        title: `Timesheet Due: ${p1.name}`,
        message: `Submit August timesheet for ${p1.name} before month-end closing.`,
        type: 'deadline_reminder',
        projectId: p1.id,
        role: 'Employee',
      },
      {
        title: `Timesheet Due: ${p2.name}`,
        message: `Submit August timesheet for ${p2.name} before month-end closing.`,
        type: 'deadline_reminder',
        projectId: p2.id,
        role: 'Employee',
      },
      {
        title: 'New Project Assigned',
        message: `You have been assigned to project "${p1.name}" (${p1.id}).`,
        type: 'project_assign',
        projectId: p1.id,
        role: 'Employee',
      },
      {
        title: 'Timesheet Ready for Review',
        message: `Monthly timesheet submitted for "${p1.name}".`,
        type: 'timesheet_submit',
        projectId: p1.id,
        role: 'Project Manager',
      },
    ];

    for (const a of defaultAlerts) {
      await prisma.notification.create({ data: { ...a, isRead: false } });
    }

    return prisma.notification.findMany({
      where: { OR: [{ role: 'All' }, { role }, ...(userId ? [{ userId }] : [])] },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async createNotification(data: {
    userId?: string;
    role?: string;
    title: string;
    message: string;
    type: string;
    projectId?: string;
  }): Promise<NotificationItem> {
    return prisma.notification.create({
      data: {
        userId: data.userId,
        role: data.role || 'All',
        title: data.title,
        message: data.message,
        type: data.type,
        projectId: data.projectId || '',
        isRead: false,
      },
    });
  }

  static async markAsRead(id: number): Promise<boolean> {
    await prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
    return true;
  }

  static async markAllAsRead(role: string, userId?: string): Promise<boolean> {
    await prisma.notification.updateMany({
      where: {
        OR: [
          { role: 'All' },
          { role },
          ...(userId ? [{ userId }] : []),
        ],
        isRead: false,
      },
      data: { isRead: true, readAt: new Date() },
    });
    return true;
  }
}

