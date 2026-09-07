"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectService = void 0;
const prisma_1 = require("../lib/prisma");
class ProjectService {
    static async getAllProjects(role) {
        if (role === 'Employee')
            throw new Error('Access Denied: Employees cannot view all projects.');
        const projects = await prisma_1.prisma.project.findMany({ include: { client: true } });
        return projects.map((p) => ({
            id: p.id, name: p.name, clientId: p.clientId, clientName: p.client.name,
            clientCurrency: p.client.billingCurrency, billingType: p.billingType,
            rate: role === 'Super Admin' ? p.rate : 'RESTRICTED',
            businessLine: p.businessLine || '', service: p.service || '',
            startDate: p.startDate || '', endDate: p.endDate || '',
            budgetHours: p.budgetHours || 0, loggedHours: p.loggedHours || 0,
            status: p.status,
            managerId: p.managerId || '', managerName: p.managerName || '',
            assignedEmployees: p.assignedEmployees ? p.assignedEmployees.split(',').map((s) => s.trim()).filter(Boolean) : [],
        }));
    }
    static async createProject(role, clientId, name, billingType, rate, budgetHours, startDate, endDate, id, managerId, managerName, assignedEmployees, businessLine, service) {
        if (role !== 'Super Admin')
            throw new Error('Access Denied: Only Super Admins can create projects.');
        const client = await prisma_1.prisma.client.findUnique({ where: { id: clientId } });
        if (!client)
            throw new Error(`Client with ID ${clientId} not found.`);
        let targetProjectId = id?.trim().toUpperCase();
        if (!targetProjectId) {
            let count = (await prisma_1.prisma.project.count()) + 1;
            targetProjectId = `AODP${String(count).padStart(4, '0')}`;
            while (await prisma_1.prisma.project.findUnique({ where: { id: targetProjectId } })) {
                count++;
                targetProjectId = `AODP${String(count).padStart(4, '0')}`;
            }
        }
        const cleanName = name.trim();
        if (await prisma_1.prisma.project.findUnique({ where: { id: targetProjectId } })) {
            throw new Error(`Project ID "${targetProjectId}" already exists. Please enter a unique ID.`);
        }
        const assignedStr = Array.isArray(assignedEmployees) ? assignedEmployees.join(', ') : '';
        const proj = await prisma_1.prisma.project.create({
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
            clientCurrency: proj.client.billingCurrency, billingType: proj.billingType,
            rate: proj.rate, businessLine: proj.businessLine || '', service: proj.service || '',
            startDate: proj.startDate || '', endDate: proj.endDate || '',
            budgetHours: proj.budgetHours || 0, loggedHours: proj.loggedHours || 0,
            status: proj.status,
            managerId: proj.managerId || '', managerName: proj.managerName || '',
            assignedEmployees: proj.assignedEmployees ? proj.assignedEmployees.split(',').map((s) => s.trim()).filter(Boolean) : [],
        };
    }
    static async updateProject(role, id, data) {
        if (role !== 'Super Admin')
            throw new Error('Access Denied: Only Super Admins can update projects.');
        const existing = await prisma_1.prisma.project.findUnique({ where: { id }, include: { client: true } });
        if (!existing)
            throw new Error(`Project with ID ${id} not found.`);
        let rateVersionsList = Array.isArray(existing.rateVersions) ? [...existing.rateVersions] : [];
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
        const updated = await prisma_1.prisma.project.update({
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
                ...(rateVersionsList.length > 0 && { rateVersions: rateVersionsList }),
            },
            include: { client: true },
        });
        return {
            id: updated.id, name: updated.name, clientId: updated.clientId, clientName: updated.client.name,
            clientCurrency: updated.client.billingCurrency, billingType: updated.billingType,
            rate: updated.rate, businessLine: updated.businessLine || '', service: updated.service || '',
            startDate: updated.startDate || '', endDate: updated.endDate || '',
            budgetHours: updated.budgetHours || 0, loggedHours: updated.loggedHours || 0,
            status: updated.status,
            managerId: updated.managerId || '', managerName: updated.managerName || '',
            assignedEmployees: updated.assignedEmployees ? updated.assignedEmployees.split(',').map((s) => s.trim()).filter(Boolean) : [],
        };
    }
    static async getRateHistory(role, projectId) {
        if (role !== 'Super Admin')
            throw new Error('Access Denied: Only Super Admins can view rate histories.');
        if (projectId) {
            const proj = await prisma_1.prisma.project.findUnique({ where: { id: projectId }, select: { rateVersions: true, id: true } });
            if (!proj || !Array.isArray(proj.rateVersions))
                return [];
            return proj.rateVersions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        const projects = await prisma_1.prisma.project.findMany({ select: { rateVersions: true, id: true } });
        const allRecords = [];
        for (const p of projects) {
            if (Array.isArray(p.rateVersions)) {
                allRecords.push(...p.rateVersions);
            }
        }
        return allRecords.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
}
exports.ProjectService = ProjectService;
