import { prisma } from '../lib/prisma';
import { ProjectWithClient, RateVersionRecord } from './registryTypes';
import { NotificationService } from './notificationService';

export class ProjectService {
  static async getAllProjects(role: string, clientId?: string, userId?: string): Promise<ProjectWithClient[]> {
    if (role === 'Employee') throw new Error('Access Denied: Employees cannot view all projects.');
    let where: any = clientId ? { clientId } : {};
    if (role === 'Client') {
      if (!userId || !clientId) throw new Error('Access Denied: Unauthenticated client user.');
      where = {
        clientId,
        OR: [
          { clientContactPersonId: userId },
          { clientUsers: { some: { clientUserId: userId } } },
        ],
      };
    }

    const projects = await prisma.project.findMany({ where, include: { client: true } });
    return projects.map((p) => ({
      id: p.id, name: p.name, clientId: p.clientId, clientName: p.client.name,
      clientCurrency: p.client.billingCurrency, billingType: p.billingType as any,
      rate: role === 'Super Admin' ? p.rate : 'RESTRICTED',
      businessLine: p.businessLine || '', service: p.service || '',
      startDate: p.startDate || '', endDate: p.endDate || '',
      budgetHours: p.budgetHours || 0, budgetType: (p.budgetType || 'Monthly') as any, loggedHours: p.loggedHours || 0,
      status: p.status as 'Active' | 'Inactive',
      managerId: p.managerId || '', managerName: p.managerName || '',
      assignedEmployees: p.assignedEmployees ? p.assignedEmployees.split(',').map((s) => s.trim()).filter(Boolean) : [],
      clientContactPersonId: p.clientContactPersonId || '',
      clientContactPersonName: p.clientContactPersonName || '',
      monthlyBudgets: Array.isArray(p.monthlyBudgets) ? (p.monthlyBudgets as any) : [],
    }));
  }

  static async getNextProjectId(): Promise<string> {
    const projects = await prisma.project.findMany({ select: { id: true } });
    let maxNum = 0;
    for (const p of projects) {
      const match = p.id.match(/^PC(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
    return `PC${String(maxNum + 1).padStart(4, '0')}`;
  }

  static async createProject(
    role: string, clientId: string, name: string, billingType: string, rate: string,
    budgetHours?: number, startDate?: string, endDate?: string, id?: string,
    managerId?: string, managerName?: string, assignedEmployees?: string[],
    businessLine?: string, service?: string, budgetType?: string, monthlyBudgets?: any[],
    clientContactPersonId?: string, clientContactPersonName?: string
  ): Promise<ProjectWithClient> {
    if (role !== 'Super Admin') throw new Error('Access Denied: Only Super Admins can create projects.');
    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) throw new Error(`Client with ID ${clientId} not found.`);
    const targetProjectId = (id?.trim().toUpperCase()) || (await ProjectService.getNextProjectId());
    if (await prisma.project.findUnique({ where: { id: targetProjectId } })) {
      throw new Error(`Project ID "${targetProjectId}" already exists.`);
    }

    let contactPersonName = clientContactPersonName || '';
    if (clientContactPersonId) {
      const cu = await prisma.clientUser.findUnique({ where: { id: clientContactPersonId } });
      if (!cu || cu.clientId !== clientId) throw new Error(`Selected contact user does not belong to Client "${clientId}".`);
      contactPersonName = cu.name;
    }

    const totalHours = Number(budgetHours) || 0;
    const assignedStr = Array.isArray(assignedEmployees) ? assignedEmployees.join(', ') : '';
    const proj = await prisma.project.create({
      data: {
        id: targetProjectId, clientId, name: name.trim(), billingType, rate,
        budgetHours: totalHours, budgetType: budgetType || 'Monthly', startDate: startDate || '', endDate: endDate || '',
        status: 'Active', managerId: managerId || '', managerName: managerName || '',
        assignedEmployees: assignedStr, businessLine: businessLine || '', service: service || '',
        clientContactPersonId: clientContactPersonId || '', clientContactPersonName: contactPersonName,
        monthlyBudgets: Array.isArray(monthlyBudgets) ? (monthlyBudgets as any) : undefined,
      },
    });

    if (clientContactPersonId) {
      await prisma.clientUserProject.upsert({
        where: { clientUserId_projectId: { clientUserId: clientContactPersonId, projectId: targetProjectId } },
        update: { clientId },
        create: { clientUserId: clientContactPersonId, projectId: targetProjectId, clientId },
      });
    }

    if (Array.isArray(assignedEmployees)) {
      for (const empCode of assignedEmployees) {
        await NotificationService.createNotification({
          userId: empCode, role: 'Employee', title: 'Project Assignment',
          message: `You’ve been assigned to Project ${proj.name}.`, type: 'project_assign', projectId: proj.id,
        });
      }
    }

    return {
      id: proj.id, name: proj.name, clientId: proj.clientId, clientName: client.name,
      clientCurrency: client.billingCurrency, billingType: proj.billingType as any,
      rate: proj.rate, businessLine: proj.businessLine || '', service: proj.service || '',
      startDate: proj.startDate || '', endDate: proj.endDate || '',
      budgetHours: proj.budgetHours || 0, budgetType: (proj.budgetType || 'Monthly') as any, loggedHours: proj.loggedHours || 0,
      status: proj.status as 'Active' | 'Inactive',
      managerId: proj.managerId || '', managerName: proj.managerName || '',
      assignedEmployees: proj.assignedEmployees ? proj.assignedEmployees.split(',').map((s) => s.trim()).filter(Boolean) : [],
      clientContactPersonId: proj.clientContactPersonId || '', clientContactPersonName: proj.clientContactPersonName || '',
      monthlyBudgets: Array.isArray(proj.monthlyBudgets) ? (proj.monthlyBudgets as any) : [],
    };
  }

  static async updateProject(role: string, id: string, data: any): Promise<ProjectWithClient> {
    if (role !== 'Super Admin') throw new Error('Access Denied: Only Super Admins can update projects.');
    const existing = await prisma.project.findUnique({ where: { id }, include: { client: true } });
    if (!existing) throw new Error(`Project with ID ${id} not found.`);

    let contactPersonName = data.clientContactPersonName !== undefined ? data.clientContactPersonName : existing.clientContactPersonName;
    const targetClientId = data.clientId || existing.clientId;
    if (data.clientContactPersonId) {
      const cu = await prisma.clientUser.findUnique({ where: { id: data.clientContactPersonId } });
      if (!cu || cu.clientId !== targetClientId) throw new Error(`Selected contact user does not belong to Client "${targetClientId}".`);
      contactPersonName = cu.name;
    }

    const assignedStr = Array.isArray(data.assignedEmployees) ? data.assignedEmployees.join(', ') : data.assignedEmployees;
    const updated = await prisma.project.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name.trim() }),
        ...(data.clientId && { clientId: data.clientId }),
        ...(data.billingType && { billingType: data.billingType }),
        ...(data.rate && { rate: data.rate }),
        ...(data.businessLine !== undefined && { businessLine: data.businessLine }),
        ...(data.service !== undefined && { service: data.service }),
        ...(data.startDate !== undefined && { startDate: data.startDate }),
        ...(data.endDate !== undefined && { endDate: data.endDate }),
        ...(data.budgetHours !== undefined && { budgetHours: Number(data.budgetHours) || 0 }),
        ...(data.budgetType !== undefined && { budgetType: data.budgetType }),
        ...(data.status && { status: data.status }),
        ...(data.managerId !== undefined && { managerId: data.managerId }),
        ...(data.managerName !== undefined && { managerName: data.managerName }),
        ...(assignedStr !== undefined && { assignedEmployees: assignedStr }),
        ...(data.clientContactPersonId !== undefined && { clientContactPersonId: data.clientContactPersonId, clientContactPersonName: contactPersonName }),
        ...(data.monthlyBudgets !== undefined && { monthlyBudgets: Array.isArray(data.monthlyBudgets) ? (data.monthlyBudgets as any) : undefined }),
      },
      include: { client: true },
    });

    if (data.clientContactPersonId) {
      await prisma.clientUserProject.upsert({
        where: { clientUserId_projectId: { clientUserId: data.clientContactPersonId, projectId: id } },
        update: { clientId: targetClientId },
        create: { clientUserId: data.clientContactPersonId, projectId: id, clientId: targetClientId },
      });
    }

    if (Array.isArray(data.assignedEmployees)) {
      const oldAssigned = (existing.assignedEmployees || '').split(',').map((s) => s.trim()).filter(Boolean);
      const newAssigned = data.assignedEmployees.filter((e: string) => !oldAssigned.includes(e));
      for (const empCode of newAssigned) {
        await NotificationService.createNotification({
          userId: empCode, role: 'Employee', title: 'Project Assignment',
          message: `You’ve been assigned to Project ${updated.name}.`, type: 'project_assign', projectId: updated.id,
        });
      }
    }

    return {
      id: updated.id, name: updated.name, clientId: updated.clientId, clientName: updated.client.name,
      clientCurrency: updated.client.billingCurrency, billingType: updated.billingType as any,
      rate: updated.rate, businessLine: updated.businessLine || '', service: updated.service || '',
      startDate: updated.startDate || '', endDate: updated.endDate || '',
      budgetHours: updated.budgetHours || 0, budgetType: (updated.budgetType || 'Monthly') as any, loggedHours: updated.loggedHours || 0,
      status: updated.status as 'Active' | 'Inactive',
      managerId: updated.managerId || '', managerName: updated.managerName || '',
      assignedEmployees: updated.assignedEmployees ? updated.assignedEmployees.split(',').map((s) => s.trim()).filter(Boolean) : [],
      clientContactPersonId: updated.clientContactPersonId || '', clientContactPersonName: updated.clientContactPersonName || '',
      monthlyBudgets: Array.isArray(updated.monthlyBudgets) ? (updated.monthlyBudgets as any) : [],
    };
  }

  static async getRateHistory(role: string, projectId?: string): Promise<RateVersionRecord[]> {
    if (role !== 'Super Admin') throw new Error('Access Denied: Only Super Admins can view rate histories.');
    const where = projectId ? { id: projectId } : {};
    const projects = await prisma.project.findMany({ where, select: { rateVersions: true, id: true } });
    const allRecords: RateVersionRecord[] = [];
    for (const p of projects) {
      if (Array.isArray(p.rateVersions)) allRecords.push(...(p.rateVersions as unknown as RateVersionRecord[]));
    }
    return allRecords.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}
