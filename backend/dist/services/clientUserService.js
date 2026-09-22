"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientUserService = void 0;
const prisma_1 = require("../lib/prisma");
const passwordUtils_1 = require("../utils/passwordUtils");
class ClientUserService {
    static async getNextId() {
        const count = await prisma_1.prisma.clientUser.count();
        let nextNum = count + 1;
        let nextId = `CU${String(nextNum).padStart(4, '0')}`;
        while (await prisma_1.prisma.clientUser.findUnique({ where: { id: nextId } })) {
            nextNum += 1;
            nextId = `CU${String(nextNum).padStart(4, '0')}`;
        }
        return nextId;
    }
    static async getAllClientUsers(role, clientId) {
        if (role !== 'Super Admin' && role !== 'Project Manager') {
            throw new Error('Access Denied: Only Admins and Project Managers can view client users.');
        }
        return prisma_1.prisma.clientUser.findMany({
            where: clientId ? { clientId } : undefined,
            include: {
                client: { select: { id: true, name: true, displayName: true } },
                projects: {
                    include: {
                        project: { select: { id: true, name: true, status: true } },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    static async getClientUsersByClient(clientId) {
        return prisma_1.prisma.clientUser.findMany({
            where: { clientId, status: 'Active' },
            select: { id: true, name: true, email: true, username: true, status: true, clientId: true },
            orderBy: { name: 'asc' },
        });
    }
    static async getClientUserById(id) {
        return prisma_1.prisma.clientUser.findUnique({
            where: { id },
            include: {
                client: true,
                projects: { include: { project: true } },
            },
        });
    }
    static async createClientUser(role, data) {
        if (role !== 'Super Admin' && role !== 'Project Manager') {
            throw new Error('Access Denied: Only Admins and Project Managers can create client users.');
        }
        const cleanEmail = data.email.toLowerCase().trim();
        const cleanUsername = data.username.toLowerCase().trim();
        const [existingEmail, existingUsername, clientExists] = await Promise.all([
            prisma_1.prisma.clientUser.findUnique({ where: { email: cleanEmail } }),
            prisma_1.prisma.clientUser.findUnique({ where: { username: cleanUsername } }),
            prisma_1.prisma.client.findUnique({ where: { id: data.clientId } }),
        ]);
        if (!clientExists)
            throw new Error(`Client ID "${data.clientId}" not found.`);
        if (existingEmail)
            throw new Error(`Email "${cleanEmail}" is already registered.`);
        if (existingUsername)
            throw new Error(`Username "${cleanUsername}" is already taken.`);
        const rawPassword = data.password?.trim() || 'Client@123';
        const policy = (0, passwordUtils_1.validatePasswordPolicy)(rawPassword);
        if (!policy.isValid)
            throw new Error(policy.error || 'Password does not meet requirements.');
        const id = await this.getNextId();
        const clientUser = await prisma_1.prisma.clientUser.create({
            data: {
                id,
                name: data.name.trim(),
                username: cleanUsername,
                email: cleanEmail,
                phone: data.phone?.trim() || '',
                password: (0, passwordUtils_1.hashPassword)(rawPassword),
                status: data.status || 'Active',
                clientId: data.clientId,
            },
        });
        if (Array.isArray(data.projectIds) && data.projectIds.length > 0) {
            await this.assignProjects(id, data.clientId, data.projectIds);
        }
        return this.getClientUserById(id);
    }
    static async updateClientUser(role, id, data) {
        if (role !== 'Super Admin' && role !== 'Project Manager') {
            throw new Error('Access Denied: Only Admins and Project Managers can update client users.');
        }
        const existing = await prisma_1.prisma.clientUser.findUnique({ where: { id } });
        if (!existing)
            throw new Error(`Client User "${id}" not found.`);
        const updateData = {};
        if (data.name)
            updateData.name = data.name.trim();
        if (data.phone !== undefined)
            updateData.phone = data.phone.trim();
        if (data.status)
            updateData.status = data.status;
        if (data.email) {
            const cleanEmail = data.email.toLowerCase().trim();
            const dup = await prisma_1.prisma.clientUser.findUnique({ where: { email: cleanEmail } });
            if (dup && dup.id !== id)
                throw new Error(`Email "${cleanEmail}" is already registered.`);
            updateData.email = cleanEmail;
        }
        if (data.username) {
            const cleanUsername = data.username.toLowerCase().trim();
            const dup = await prisma_1.prisma.clientUser.findUnique({ where: { username: cleanUsername } });
            if (dup && dup.id !== id)
                throw new Error(`Username "${cleanUsername}" is already taken.`);
            updateData.username = cleanUsername;
        }
        if (data.password && data.password.trim()) {
            const policy = (0, passwordUtils_1.validatePasswordPolicy)(data.password.trim());
            if (!policy.isValid)
                throw new Error(policy.error || 'Password does not meet requirements.');
            updateData.password = (0, passwordUtils_1.hashPassword)(data.password.trim());
        }
        await prisma_1.prisma.clientUser.update({ where: { id }, data: updateData });
        if (Array.isArray(data.projectIds)) {
            await this.assignProjects(id, existing.clientId, data.projectIds);
        }
        return this.getClientUserById(id);
    }
    static async assignProjects(clientUserId, clientId, projectIds) {
        // 1. Verify all projects belong to this client
        const clientProjects = await prisma_1.prisma.project.findMany({
            where: { id: { in: projectIds } },
            select: { id: true, clientId: true },
        });
        const invalid = clientProjects.find((p) => p.clientId !== clientId);
        if (invalid) {
            throw new Error(`Project "${invalid.id}" does not belong to Client "${clientId}". Cross-client assignment is prohibited.`);
        }
        // 2. Clear old assignments and insert new
        await prisma_1.prisma.clientUserProject.deleteMany({ where: { clientUserId } });
        if (projectIds.length > 0) {
            await prisma_1.prisma.clientUserProject.createMany({
                data: projectIds.map((pId) => ({
                    clientUserId,
                    projectId: pId,
                    clientId,
                })),
                skipDuplicates: true,
            });
        }
    }
    static async getAssignedProjectIds(clientUserId) {
        const assignments = await prisma_1.prisma.clientUserProject.findMany({
            where: { clientUserId },
            select: { projectId: true },
        });
        return assignments.map((a) => a.projectId);
    }
}
exports.ClientUserService = ClientUserService;
