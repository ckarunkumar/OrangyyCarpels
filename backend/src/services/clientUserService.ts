import { prisma } from '../lib/prisma';
import { hashPassword, validatePasswordPolicy } from '../utils/passwordUtils';

export interface CreateClientUserInput {
  name: string;
  email: string;
  phone?: string;
  password?: string;
  clientId: string;
  status?: 'Active' | 'Can Login' | 'Cannot Login';
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
      where: { clientId, status: { in: ['Active', 'Can Login'] } },
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

    const [existingEmail, clientExists] = await Promise.all([
      prisma.clientUser.findFirst({
        where: { OR: [{ email: cleanEmail }, { username: cleanEmail }] },
      }),
      prisma.client.findUnique({ where: { id: data.clientId } }),
    ]);

    if (!clientExists) throw new Error(`Client ID "${data.clientId}" not found.`);
    if (existingEmail) throw new Error(`Email "${cleanEmail}" is already registered.`);

    const rawPassword = data.password?.trim() || 'Client@123';
    const policy = validatePasswordPolicy(rawPassword);
    if (!policy.isValid) throw new Error(policy.error || 'Password does not meet requirements.');

    const id = await this.getNextId();
    await prisma.clientUser.create({
      data: {
        id,
        name: data.name.trim(),
        username: cleanEmail,
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

    let targetClientId = existing.clientId;
    if (data.clientId && data.clientId !== existing.clientId) {
      const client = await prisma.client.findUnique({ where: { id: data.clientId } });
      if (!client) throw new Error(`Client ID "${data.clientId}" not found.`);
      updateData.clientId = data.clientId;
      targetClientId = data.clientId;
    }

    if (data.email) {
      const cleanEmail = data.email.toLowerCase().trim();
      const dup = await prisma.clientUser.findFirst({
        where: {
          id: { not: id },
          OR: [{ email: cleanEmail }, { username: cleanEmail }],
        },
      });
      if (dup) throw new Error(`Email "${cleanEmail}" is already registered.`);
      updateData.email = cleanEmail;
      updateData.username = cleanEmail;
    }

    if (data.password && data.password.trim()) {
      const policy = validatePasswordPolicy(data.password.trim());
      if (!policy.isValid) throw new Error(policy.error || 'Password does not meet requirements.');
      updateData.password = hashPassword(data.password.trim());
    }

    await prisma.clientUser.update({ where: { id }, data: updateData });

    if (Array.isArray(data.projectIds)) {
      await this.assignProjects(id, targetClientId, data.projectIds);
    }

    return this.getClientUserById(id);
  }

  static async deleteClientUser(role: string, id: string) {
    if (role !== 'Super Admin' && role !== 'Project Manager') {
      throw new Error('Access Denied: Only Admins and Project Managers can delete client users.');
    }
    const existing = await prisma.clientUser.findUnique({ where: { id } });
    if (!existing) throw new Error(`Client User "${id}" not found.`);

    await prisma.$transaction([
      prisma.clientUserProject.deleteMany({ where: { clientUserId: id } }),
      prisma.clientUser.delete({ where: { id } }),
    ]);

    return { success: true, message: `Client User ${id} deleted successfully.` };
  }

  static async assignProjects(clientUserId: string, clientId: string, projectIds: string[]) {
    const clientProjects = await prisma.project.findMany({
      where: { id: { in: projectIds } },
      select: { id: true, clientId: true },
    });

    const invalid = clientProjects.find((p) => p.clientId !== clientId);
    if (invalid) {
      throw new Error(`Project "${invalid.id}" does not belong to Client "${clientId}". Cross-client assignment is prohibited.`);
    }

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
