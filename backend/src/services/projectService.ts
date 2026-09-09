import { prisma } from '../lib/prisma';
import { ProjectWithClient, RateVersionRecord } from './registryTypes';

export class ProjectService {
  static async getAllProjects(role: string): Promise<ProjectWithClient[]> {
    if (role === 'Employee') throw new Error('Access Denied: Employees cannot view all projects.');
    const projects = await prisma.project.findMany({ include: { client: true } });
    return projects.map((p) => ({
      id: p.id, name: p.name, clientId: p.clientId, clientName: p.client.name,
      clientCurrency: p.client.billingCurrency, billingType: p.billingType as any,
      rate: role === 'Super Admin' ? p.rate : 'RESTRICTED',
      businessLine: p.businessLine || '', service: p.service || '',
      startDate: p.startDate || '', endDate: p.endDate || '',
      budgetHours: p.budgetHours || 0, loggedHours: p.loggedHours || 0,
      status: p.status as 'Active' | 'Inactive',
      managerId: p.managerId || '', managerName: p.managerName || '',
      assignedEmployees: p.assignedEmployees ? p.assignedEmployees.split(',').map((s) => s.trim()).filter(Boolean) : [],
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
    const nextNum = maxNum + 1;
    return `PC${String(nextNum).padStart(4, '0')}`;
  }

  static async createProject(
    role: string, clientId: string, name: string, billingType: string, rate: string,
    budgetHours?: number, startDate?: string, endDate?: string, id?: string,
    managerId?: string, managerName?: string, assignedEmployees?: string[],
    businessLine?: string, service?: string
  ): Promise<ProjectWithClient> {
    if (role !== 'Super Admin') throw new Error('Access Denied: Only Super Admins can create projects.');
    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) throw new Error(`Client with ID ${clientId} not found.`);
    let targetProjectId = id?.trim().toUpperCase();
    if (!targetProjectId) {
      targetProjectId = await ProjectService.getNextProjectId();
    }
    const cleanName = name.trim();
    if (await prisma.project.findUnique({ where: { id: targetProjectId } })) {
      throw new Error(`Project ID "${targetProjectId}" already exists. Please enter a unique ID.`);
    }
    const assignedStr = Array.isArray(assignedEmployees) ? assignedEmployees.join(', ') : '';
    const proj = await prisma.project.create({
      data: {
        id: targetProjectId, clientId, name: cleanName, billingType, rate,
        budgetHours: budgetHours || 0, startDate: startDate || '', endDate: endDate || '',
        status: 'Active', managerId: managerId || '', managerName: managerName || '',
        assignedEmployees: assignedStr, businessLine: businessLine || '', service: service || '',
      },
      include: { client: true },
    });
    return {
      id: proj.id, name: proj.name, clientId: proj.clientId, clientName: proj.client.name,
      clientCurrency: proj.client.billingCurrency, billingType: proj.billingType as any,
      rate: proj.rate, businessLine: proj.businessLine || '', service: proj.service || '',
      startDate: proj.startDate || '', endDate: proj.endDate || '',
      budgetHours: proj.budgetHours || 0, loggedHours: proj.loggedHours || 0,
      status: proj.status as 'Active' | 'Inactive',
      managerId: proj.managerId || '', managerName: proj.managerName || '',
      assignedEmployees: proj.assignedEmployees ? proj.assignedEmployees.split(',').map((s) => s.trim()).filter(Boolean) : [],
    };
  }

  static async updateProject(role: string, id: string, data: any): Promise<ProjectWithClient> {
    if (role !== 'Super Admin') throw new Error('Access Denied: Only Super Admins can update projects.');
    const existing = await prisma.project.findUnique({ where: { id }, include: { client: true } });
    if (!existing) throw new Error(`Project with ID ${id} not found.`);
    let rateVersionsList = Array.isArray(existing.rateVersions) ? [...(existing.rateVersions as any[])] : [];
    if (data.rate && data.rate !== existing.rate) {
      const amount = parseFloat(data.rate.replace(/[^0-9.]/g, '')) || 0;
      const newVersion = {
        id: Date.now(),
        projectId: id,
        billingType: data.billingType || existing.billingType,
        rateAmount: amount,
        currency: existing.client.billingCurrency || 'USD ($)',
        effectiveStartDate: data.rateEffectiveDate || new Date().toISOString().slice(0, 10),
        effectiveEndDate: '',
        notes: data.rateChangeReason || 'Rate update from project edit',
        createdAt: new Date().toISOString(),
      };
      rateVersionsList = [newVersion, ...rateVersionsList];
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
        ...(data.status && { status: data.status }),
        ...(data.managerId !== undefined && { managerId: data.managerId }),
        ...(data.managerName !== undefined && { managerName: data.managerName }),
        ...(assignedStr !== undefined && { assignedEmployees: assignedStr }),
        ...(rateVersionsList.length > 0 && { rateVersions: rateVersionsList as any }),
      },
      include: { client: true },
    });
    return {
      id: updated.id, name: updated.name, clientId: updated.clientId, clientName: updated.client.name,
      clientCurrency: updated.client.billingCurrency, billingType: updated.billingType as any,
      rate: updated.rate, businessLine: updated.businessLine || '', service: updated.service || '',
      startDate: updated.startDate || '', endDate: updated.endDate || '',
      budgetHours: updated.budgetHours || 0, loggedHours: updated.loggedHours || 0,
      status: updated.status as 'Active' | 'Inactive',
      managerId: updated.managerId || '', managerName: updated.managerName || '',
      assignedEmployees: updated.assignedEmployees ? updated.assignedEmployees.split(',').map((s) => s.trim()).filter(Boolean) : [],
    };
  }

  static async getRateHistory(role: string, projectId?: string): Promise<RateVersionRecord[]> {
    if (role !== 'Super Admin') throw new Error('Access Denied: Only Super Admins can view rate histories.');
    if (projectId) {
      const proj = await prisma.project.findUnique({ where: { id: projectId }, select: { rateVersions: true, id: true } });
      if (!proj || !Array.isArray(proj.rateVersions)) return [];
      return (proj.rateVersions as unknown as RateVersionRecord[]).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    const projects = await prisma.project.findMany({ select: { rateVersions: true, id: true } });
    const allRecords: RateVersionRecord[] = [];
    for (const p of projects) {
      if (Array.isArray(p.rateVersions)) {
        allRecords.push(...(p.rateVersions as unknown as RateVersionRecord[]));
      }
    }
    return allRecords.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}
