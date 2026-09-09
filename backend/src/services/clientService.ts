import { prisma } from '../lib/prisma';
import { ClientProfile } from './registryTypes';

export class ClientService {
  static async getClients(role: string): Promise<ClientProfile[]> {
    if (role === 'Employee') throw new Error('Access Denied: Employees cannot view clients.');
    const clients = await prisma.client.findMany({ include: { projects: true } });
    return clients.map((c) => ({
      id: c.id, name: c.name, legalName: c.legalName || '', displayName: c.displayName || '',
      contactPerson: c.contactPerson || '', email: c.email || '', phone: c.phone || '',
      accountsPerson: c.accountsPerson || '', accountsEmail: c.accountsEmail || '', accountsPhone: c.accountsPhone || '',
      address: c.address || '', country: c.country || 'India',
      cinNumber: c.cinNumber || '', gstNumber: c.gstNumber || '', panNumber: c.panNumber || '', msmeNumber: c.msmeNumber || '',
      billingCurrency: c.billingCurrency, defaultBillingType: c.defaultBillingType, dueTime: c.dueTime || '30 days',
      status: c.status as 'Active' | 'Inactive',
      projects: c.projects.map((p) => ({
        id: p.id, name: p.name, billingType: p.billingType as any,
        rate: role === 'Super Admin' ? p.rate : 'RESTRICTED',
        businessLine: p.businessLine || '', service: p.service || '',
        startDate: p.startDate || '', endDate: p.endDate || '',
        budgetHours: p.budgetHours || 0, loggedHours: p.loggedHours || 0,
        status: p.status as 'Active' | 'Inactive',
        managerId: p.managerId || '', managerName: p.managerName || '',
        assignedEmployees: p.assignedEmployees ? p.assignedEmployees.split(',').map((s) => s.trim()).filter(Boolean) : [],
      })),
    }));
  }

  static async getNextClientId(): Promise<string> {
    const clients = await prisma.client.findMany({ select: { id: true } });
    let maxNum = 0;
    for (const c of clients) {
      const match = c.id.match(/^ODC(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
    const nextNum = maxNum + 1;
    return `ODC${String(nextNum).padStart(4, '0')}`;
  }

  static async createClient(role: string, data: Omit<ClientProfile, 'projects'>): Promise<ClientProfile> {
    if (role !== 'Super Admin') throw new Error('Access Denied: Only Super Admins can create client profiles.');
    let targetClientId = data.id?.trim().toUpperCase();
    if (!targetClientId) {
      targetClientId = await ClientService.getNextClientId();
    }
    const cleanName = data.name.trim();
    if (await prisma.client.findUnique({ where: { id: targetClientId } })) {
      throw new Error(`Client ID "${targetClientId}" already exists. Please enter a unique ID.`);
    }
    if (await prisma.client.findFirst({ where: { name: { equals: cleanName } } })) {
      throw new Error(`A client with the name "${cleanName}" already exists.`);
    }
    const created = await prisma.client.create({
      data: {
        id: targetClientId, name: cleanName, legalName: data.legalName?.trim() || cleanName,
        displayName: data.displayName?.trim() || cleanName, contactPerson: data.contactPerson?.trim() || '',
        email: data.email?.trim().toLowerCase() || '', phone: data.phone?.trim() || '',
        accountsPerson: data.accountsPerson?.trim() || '', accountsEmail: data.accountsEmail?.trim().toLowerCase() || '',
        accountsPhone: data.accountsPhone?.trim() || '', address: data.address?.trim() || '', country: data.country?.trim() || 'India',
        cinNumber: data.cinNumber?.trim() || '', gstNumber: data.gstNumber?.trim() || '',
        panNumber: data.panNumber?.trim() || '', msmeNumber: data.msmeNumber?.trim() || '',
        billingCurrency: data.billingCurrency || 'USD ($)', defaultBillingType: data.defaultBillingType || 'T&M',
        dueTime: data.dueTime || '30 days', status: data.status || 'Active',
      },
      include: { projects: true },
    });
    return {
      ...created, legalName: created.legalName || '', displayName: created.displayName || '',
      contactPerson: created.contactPerson || '', email: created.email || '', phone: created.phone || '',
      accountsPerson: created.accountsPerson || '', accountsEmail: created.accountsEmail || '', accountsPhone: created.accountsPhone || '',
      address: created.address || '', country: created.country || 'India', cinNumber: created.cinNumber || '',
      gstNumber: created.gstNumber || '', panNumber: created.panNumber || '', msmeNumber: created.msmeNumber || '',
      dueTime: created.dueTime || '30 days', status: created.status as 'Active' | 'Inactive',
      projects: [],
    };
  }

  static async updateClient(role: string, id: string, data: Partial<ClientProfile>): Promise<ClientProfile> {
    if (role !== 'Super Admin') throw new Error('Access Denied: Only Super Admins can update client profiles.');
    const existing = await prisma.client.findUnique({ where: { id } });
    if (!existing) throw new Error(`Client with ID ${id} not found.`);
    if (data.name && data.name.trim() !== existing.name) {
      const dup = await prisma.client.findFirst({ where: { name: { equals: data.name.trim() } } });
      if (dup && dup.id !== id) throw new Error(`Client name "${data.name}" is already taken.`);
    }
    const updated = await prisma.client.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name.trim() }),
        ...(data.legalName !== undefined && { legalName: data.legalName.trim() }),
        ...(data.displayName !== undefined && { displayName: data.displayName.trim() }),
        ...(data.contactPerson !== undefined && { contactPerson: data.contactPerson.trim() }),
        ...(data.email !== undefined && { email: data.email.trim().toLowerCase() }),
        ...(data.phone !== undefined && { phone: data.phone.trim() }),
        ...(data.accountsPerson !== undefined && { accountsPerson: data.accountsPerson.trim() }),
        ...(data.accountsEmail !== undefined && { accountsEmail: data.accountsEmail.trim().toLowerCase() }),
        ...(data.accountsPhone !== undefined && { accountsPhone: data.accountsPhone.trim() }),
        ...(data.address !== undefined && { address: data.address.trim() }),
        ...(data.country !== undefined && { country: data.country.trim() }),
        ...(data.cinNumber !== undefined && { cinNumber: data.cinNumber.trim() }),
        ...(data.gstNumber !== undefined && { gstNumber: data.gstNumber.trim() }),
        ...(data.panNumber !== undefined && { panNumber: data.panNumber.trim() }),
        ...(data.msmeNumber !== undefined && { msmeNumber: data.msmeNumber.trim() }),
        ...(data.billingCurrency && { billingCurrency: data.billingCurrency }),
        ...(data.defaultBillingType && { defaultBillingType: data.defaultBillingType }),
        ...(data.dueTime !== undefined && { dueTime: data.dueTime }),
        ...(data.status && { status: data.status }),
      },
      include: { projects: true },
    });
    return {
      ...updated, legalName: updated.legalName || '', displayName: updated.displayName || '',
      contactPerson: updated.contactPerson || '', email: updated.email || '', phone: updated.phone || '',
      accountsPerson: updated.accountsPerson || '', accountsEmail: updated.accountsEmail || '', accountsPhone: updated.accountsPhone || '',
      address: updated.address || '', country: updated.country || 'India', cinNumber: updated.cinNumber || '',
      gstNumber: updated.gstNumber || '', panNumber: updated.panNumber || '', msmeNumber: updated.msmeNumber || '',
      dueTime: updated.dueTime || '30 days', status: updated.status as 'Active' | 'Inactive',
      projects: updated.projects.map((p) => ({
        id: p.id, name: p.name, billingType: p.billingType as any,
        rate: role === 'Super Admin' ? p.rate : 'RESTRICTED',
        businessLine: p.businessLine || '', service: p.service || '',
        startDate: p.startDate || '', endDate: p.endDate || '',
        budgetHours: p.budgetHours || 0, loggedHours: p.loggedHours || 0,
        status: p.status as 'Active' | 'Inactive',
        managerId: p.managerId || '', managerName: p.managerName || '',
        assignedEmployees: p.assignedEmployees ? p.assignedEmployees.split(',').map((s) => s.trim()).filter(Boolean) : [],
      })),
    };
  }
}
