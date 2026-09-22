import { prisma } from '../lib/prisma';
import { hashPassword, validatePasswordPolicy } from '../utils/passwordUtils';

export interface CreateClientUserInput {
  name: string;
  username: string;
  email: string;
  phone?: string;
  password?: string;
  clientId: string;
  status?: 'Active' | 'Inactive';
  projectIds?: string[];
}

export class ClientUserService {
  static async getNextId(): Promise<string> {
    const count = await prisma.clientUser.count();
    let nextNum = count + 1;
    let nextId = `CU${String(nextNum).padStart(4, '0')}`;
    while (await prisma.clientUser.findUnique({ where: { id: nextId } })) {
      nextNum += 1;
      nextId = `CU${String(nextNum).padStart(4, '0')}`;
    }
    return nextId;
  }

  static async getAllClientUsers(role: string, clientId?: string) {
    if (role !== 'Super Admin' && role !== 'Project Manager') {
      throw new Error('Access Denied: Only Admins and Project Managers can view client users.');
    }
    return prisma.clientUser.findMany({
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

  static async getClientUsersByClient(clientId: string) {
    return prisma.clientUser.findMany({
      where: { clientId, status: 'Active' },
      select: { id: true, name: true, email: true, username: true, status: true, clientId: true },
      orderBy: { name: 'asc' },
    });
  }

  static async getClientUserById(id: string) {
    return prisma.clientUser.findUnique({
      where: { id },
      include: {
        client: true,
        projects: { include: { project: true } },
      },
    });
  }

  static async createClientUser(role: string, data: CreateClientUserInput) {
    if (role !== 'Super Admin' && role !== 'Project Manager') {
      throw new Error('Access Denied: Only Admins and Project Managers can create client users.');
    }
    const cleanEmail = data.email.toLowerCase().trim();
    const cleanUsername = data.username.toLowerCase().trim();

    const [existingEmail, existingUsername, clientExists] = await Promise.all([
      prisma.clientUser.findUnique({ where: { email: cleanEmail } }),
      prisma.clientUser.findUnique({ where: { username: cleanUsername } }),
      prisma.client.findUnique({ where: { id: data.clientId } }),
    ]);

    if (!clientExists) throw new Error(`Client ID "${data.clientId}" not found.`);
    if (existingEmail) throw new Error(`Email "${cleanEmail}" is already registered.`);
    if (existingUsername) throw new Error(`Username "${cleanUsername}" is already taken.`);

    const rawPassword = data.password?.trim() || 'Client@123';
    const policy = validatePasswordPolicy(rawPassword);
    if (!policy.isValid) throw new Error(policy.error || 'Password does not meet requirements.');

    const id = await this.getNextId();
    const clientUser = await prisma.clientUser.create({
      data: {
        id,
        name: data.name.trim(),
        username: cleanUsername,
        email: cleanEmail,
        phone: data.phone?.trim() || '',
        password: hashPassword(rawPassword),
        status: data.status || 'Active',
        clientId: data.clientId,
      },
    });

    if (Array.isArray(data.projectIds) && data.projectIds.length > 0) {
      await this.assignProjects(id, data.clientId, data.projectIds);
    }

    return this.getClientUserById(id);
  }

  static async updateClientUser(role: string, id: string, data: Partial<CreateClientUserInput>) {
    if (role !== 'Super Admin' && role !== 'Project Manager') {
      throw new Error('Access Denied: Only Admins and Project Managers can update client users.');
    }
    const existing = await prisma.clientUser.findUnique({ where: { id } });
    if (!existing) throw new Error(`Client User "${id}" not found.`);

    const updateData: any = {};
    if (data.name) updateData.name = data.name.trim();
    if (data.phone !== undefined) updateData.phone = data.phone.trim();
    if (data.status) updateData.status = data.status;

    if (data.email) {
      const cleanEmail = data.email.toLowerCase().trim();
      const dup = await prisma.clientUser.findUnique({ where: { email: cleanEmail } });
      if (dup && dup.id !== id) throw new Error(`Email "${cleanEmail}" is already registered.`);
      updateData.email = cleanEmail;
    }

    if (data.username) {
      const cleanUsername = data.username.toLowerCase().trim();
      const dup = await prisma.clientUser.findUnique({ where: { username: cleanUsername } });
      if (dup && dup.id !== id) throw new Error(`Username "${cleanUsername}" is already taken.`);
      updateData.username = cleanUsername;
    }

    if (data.password && data.password.trim()) {
      const policy = validatePasswordPolicy(data.password.trim());
      if (!policy.isValid) throw new Error(policy.error || 'Password does not meet requirements.');
      updateData.password = hashPassword(data.password.trim());
    }

    await prisma.clientUser.update({ where: { id }, data: updateData });

    if (Array.isArray(data.projectIds)) {
      await this.assignProjects(id, existing.clientId, data.projectIds);
    }

    return this.getClientUserById(id);
  }

  static async assignProjects(clientUserId: string, clientId: string, projectIds: string[]) {
    // 1. Verify all projects belong to this client
    const clientProjects = await prisma.project.findMany({
      where: { id: { in: projectIds } },
      select: { id: true, clientId: true },
    });

    const invalid = clientProjects.find((p) => p.clientId !== clientId);
    if (invalid) {
      throw new Error(`Project "${invalid.id}" does not belong to Client "${clientId}". Cross-client assignment is prohibited.`);
    }

    // 2. Clear old assignments and insert new
    await prisma.clientUserProject.deleteMany({ where: { clientUserId } });
    if (projectIds.length > 0) {
      await prisma.clientUserProject.createMany({
        data: projectIds.map((pId) => ({
          clientUserId,
          projectId: pId,
          clientId,
        })),
        skipDuplicates: true,
      });
    }
  }

  static async getAssignedProjectIds(clientUserId: string): Promise<string[]> {
    const assignments = await prisma.clientUserProject.findMany({
      where: { clientUserId },
      select: { projectId: true },
    });
    return assignments.map((a) => a.projectId);
  }
}
