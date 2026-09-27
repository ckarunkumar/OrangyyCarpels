import { prisma } from '../lib/prisma';
import crypto from 'crypto';
import { hashPassword, verifyPassword, validatePasswordPolicy } from '../utils/passwordUtils';

export interface UserSession {
  id: string;
  userId: string;
  employeeId: string;
  email: string;
  role: string; // 'Super Admin', 'Project Manager', 'Employee', 'Client'
  fullName: string;
  designation: string;
  department: string;
  phone: string;
  location: string;
  avatar?: string | null;
  clientId?: string;
  clientName?: string;
}

const sessionStore: Record<string, { userId: string }> = {};

export class AuthService {
  static async login(
    email: string,
    password?: string
  ): Promise<{ success: boolean; sessionId?: string; session?: UserSession; error?: string }> {
    const cleanEmail = email.toLowerCase().trim();
    if (!password) return { success: false, error: 'Password is required.' };

    // 1. Check Employee
    const employee = await prisma.employee.findUnique({ where: { email: cleanEmail } });
    if (employee) {
      if (employee.status === 'Inactive') {
        return { success: false, error: 'Account is inactive. Please contact your studio administrator.' };
      }
      if (employee.password) {
        if (!verifyPassword(password, employee.password)) return { success: false, error: 'Invalid email or password.' };
      } else {
        const policy = validatePasswordPolicy(password);
        if (!policy.isValid) return { success: false, error: 'Invalid email or password.' };
        await prisma.employee.update({ where: { employeeId: employee.employeeId }, data: { password: hashPassword(password) } });
      }

      const sessionId = crypto.randomBytes(16).toString('hex');
      sessionStore[sessionId] = { userId: employee.employeeId };
      const session: UserSession = {
        id: employee.employeeId,
        userId: employee.employeeId,
        employeeId: employee.employeeId,
        email: employee.email,
        role: employee.role || 'Employee',
        fullName: employee.fullName,
        designation: employee.designation,
        department: employee.department,
        phone: employee.phone,
        location: employee.location || 'Delhi, India',
        avatar: employee.avatar,
      };
      return { success: true, sessionId, session };
    }

    // 2. Check Client User
    const clientUser = await prisma.clientUser.findFirst({
      where: { OR: [{ email: cleanEmail }, { username: cleanEmail }] },
      include: { client: true },
    });

    if (clientUser) {
      if (clientUser.status === 'Cannot Login' || clientUser.status === 'Inactive') {
        return { success: false, error: 'Account is disabled from logging in. Please contact your administrator.' };
      }
      if (!verifyPassword(password, clientUser.password)) {
        return { success: false, error: 'Invalid email or password.' };
      }

      const sessionId = crypto.randomBytes(16).toString('hex');
      sessionStore[sessionId] = { userId: clientUser.id };
      const session: UserSession = {
        id: clientUser.id,
        userId: clientUser.id,
        employeeId: clientUser.id,
        email: clientUser.email,
        role: 'Client',
        fullName: clientUser.name,
        designation: 'Client Contact',
        department: clientUser.client?.displayName || clientUser.client?.name || 'Client Account',
        phone: clientUser.phone,
        location: clientUser.client?.country || 'India',
        avatar: null,
        clientId: clientUser.clientId,
        clientName: clientUser.client?.displayName || clientUser.client?.name || '',
      };
      return { success: true, sessionId, session };
    }

    return { success: false, error: 'Invalid email or password.' };
  }

  static async getSession(sessionId: string): Promise<UserSession | null> {
    const record = sessionStore[sessionId];
    if (!record) return null;

    const employee = await prisma.employee.findUnique({ where: { employeeId: record.userId } });
    if (employee) {
      if (employee.status === 'Inactive') return null;
      return {
        id: employee.employeeId,
        userId: employee.employeeId,
        employeeId: employee.employeeId,
        email: employee.email,
        role: employee.role || 'Employee',
        fullName: employee.fullName,
        designation: employee.designation,
        department: employee.department,
        phone: employee.phone,
        location: employee.location || 'Delhi, India',
        avatar: employee.avatar,
      };
    }

    const clientUser = await prisma.clientUser.findUnique({
      where: { id: record.userId },
      include: { client: true },
    });
    if (clientUser) {
      if (clientUser.status === 'Cannot Login' || clientUser.status === 'Inactive') return null;
      return {
        id: clientUser.id,
        userId: clientUser.id,
        employeeId: clientUser.id,
        email: clientUser.email,
        role: 'Client',
        fullName: clientUser.name,
        designation: 'Client Contact',
        department: clientUser.client?.displayName || clientUser.client?.name || 'Client Account',
        phone: clientUser.phone,
        location: clientUser.client?.country || 'India',
        avatar: null,
        clientId: clientUser.clientId,
        clientName: clientUser.client?.displayName || clientUser.client?.name || '',
      };
    }

    return null;
  }

  static async resetPassword(adminRole: string, targetEmployeeId: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    if (adminRole !== 'Super Admin') return { success: false, error: 'Access Denied: Only Super Admins can reset passwords.' };
    const policy = validatePasswordPolicy(newPassword);
    if (!policy.isValid) return { success: false, error: policy.error };

    const employee = await prisma.employee.findUnique({ where: { employeeId: targetEmployeeId } });
    if (employee) {
      await prisma.employee.update({ where: { employeeId: targetEmployeeId }, data: { password: hashPassword(newPassword) } });
      return { success: true };
    }
    const clientUser = await prisma.clientUser.findUnique({ where: { id: targetEmployeeId } });
    if (clientUser) {
      await prisma.clientUser.update({ where: { id: targetEmployeeId }, data: { password: hashPassword(newPassword) } });
      return { success: true };
    }
    return { success: false, error: 'User not found.' };
  }

  static async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    const policy = validatePasswordPolicy(newPassword);
    if (!policy.isValid) return { success: false, error: policy.error };

    const employee = await prisma.employee.findUnique({ where: { employeeId: userId } });
    if (employee) {
      if (employee.password && !verifyPassword(currentPassword, employee.password)) return { success: false, error: 'Current password does not match.' };
      await prisma.employee.update({ where: { employeeId: userId }, data: { password: hashPassword(newPassword) } });
      return { success: true };
    }

    const clientUser = await prisma.clientUser.findUnique({ where: { id: userId } });
    if (clientUser) {
      if (clientUser.password && !verifyPassword(currentPassword, clientUser.password)) return { success: false, error: 'Current password does not match.' };
      await prisma.clientUser.update({ where: { id: userId }, data: { password: hashPassword(newPassword) } });
      return { success: true };
    }

    return { success: false, error: 'User not found.' };
  }

  static async updateProfile(userId: string, data: { phone?: string; location?: string; avatar?: string | null }): Promise<UserSession> {
    const employee = await prisma.employee.findUnique({ where: { employeeId: userId } });
    if (employee) {
      const updated = await prisma.employee.update({
        where: { employeeId: userId },
        data: {
          ...(data.phone !== undefined && { phone: data.phone }),
          ...(data.location !== undefined && { location: data.location }),
          ...(data.avatar !== undefined && { avatar: data.avatar }),
        },
      });
      return {
        id: updated.employeeId,
        userId: updated.employeeId,
        employeeId: updated.employeeId,
        email: updated.email,
        role: updated.role || 'Employee',
        fullName: updated.fullName,
        designation: updated.designation,
        department: updated.department,
        phone: updated.phone,
        location: updated.location || 'Delhi, India',
        avatar: updated.avatar,
      };
    }

    const updatedClient = await prisma.clientUser.update({
      where: { id: userId },
      data: { ...(data.phone !== undefined && { phone: data.phone }) },
      include: { client: true },
    });
    return {
      id: updatedClient.id,
      userId: updatedClient.id,
      employeeId: updatedClient.id,
      email: updatedClient.email,
      role: 'Client',
      fullName: updatedClient.name,
      designation: 'Client Contact',
      department: updatedClient.client?.displayName || updatedClient.client?.name || 'Client Account',
      phone: updatedClient.phone,
      location: updatedClient.client?.country || 'India',
      avatar: null,
      clientId: updatedClient.clientId,
      clientName: updatedClient.client?.displayName || updatedClient.client?.name || '',
    };
  }

  static destroySession(sessionId: string): boolean {
    if (sessionStore[sessionId]) {
      delete sessionStore[sessionId];
      return true;
    }
    return false;
  }
}
