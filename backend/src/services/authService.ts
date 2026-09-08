import { prisma } from '../lib/prisma';
import crypto from 'crypto';
import { hashPassword, verifyPassword, validatePasswordPolicy } from '../utils/passwordUtils';

export interface UserSession {
  id: string;
  userId: string;
  employeeId: string;
  email: string;
  role: string;
  fullName: string;
  designation: string;
  department: string;
  phone: string;
  location: string;
  avatar?: string | null;
}

// In-memory session datastore
const sessionStore: Record<string, { userId: string }> = {};

export class AuthService {
  /**
   * Logs in a user by email & password, verifying credentials and profile in database.
   */
  static async login(
    email: string,
    password?: string
  ): Promise<{ success: boolean; sessionId?: string; session?: UserSession; error?: string }> {
    const cleanEmail = email.toLowerCase().trim();
    const employee = await prisma.employee.findUnique({
      where: { email: cleanEmail },
    });

    if (!employee) {
      return { success: false, error: 'Invalid email or password.' };
    }

    if (employee.status === 'Inactive') {
      return { success: false, error: 'Account is inactive. Please contact your studio administrator.' };
    }

    if (!password) {
      return { success: false, error: 'Password is required.' };
    }

    // Verify stored password hash
    if (employee.password) {
      const isValid = verifyPassword(password, employee.password);
      if (!isValid) {
        return { success: false, error: 'Invalid email or password.' };
      }
    } else {
      // If legacy unhashed password exists or account is not set, initialize password
      const policy = validatePasswordPolicy(password);
      if (!policy.isValid) {
        return { success: false, error: 'Invalid email or password.' };
      }
      await prisma.employee.update({
        where: { employeeId: employee.employeeId },
        data: { password: hashPassword(password) },
      });
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

  /**
   * Allows an employee to change their own password.
   */
  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> {
    const employee = await prisma.employee.findUnique({
      where: { employeeId: userId },
    });

    if (!employee) {
      return { success: false, error: 'Employee not found.' };
    }

    if (employee.password && !verifyPassword(currentPassword, employee.password)) {
      return { success: false, error: 'Current password does not match.' };
    }

    const policy = validatePasswordPolicy(newPassword);
    if (!policy.isValid) {
      return { success: false, error: policy.error };
    }

    await prisma.employee.update({
      where: { employeeId: userId },
      data: { password: hashPassword(newPassword) },
    });

    return { success: true };
  }

  /**
   * Allows Super Admins to reset another employee's password.
   */
  static async resetPassword(
    adminRole: string,
    targetEmployeeId: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> {
    if (adminRole !== 'Super Admin') {
      return { success: false, error: 'Access Denied: Only Super Admins can reset employee passwords.' };
    }

    const policy = validatePasswordPolicy(newPassword);
    if (!policy.isValid) {
      return { success: false, error: policy.error };
    }

    await prisma.employee.update({
      where: { employeeId: targetEmployeeId },
      data: { password: hashPassword(newPassword) },
    });

    return { success: true };
  }

  /**
   * Retrieves active session by ID, fetching the latest DB details.
   */
  static async getSession(sessionId: string): Promise<UserSession | null> {
    const record = sessionStore[sessionId];
    if (!record) return null;

    const employee = await prisma.employee.findUnique({
      where: { employeeId: record.userId },
    });
    if (!employee) return null;

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

  /**
   * Updates user profile fields: phone, location, avatar.
   */
  static async updateProfile(
    userId: string,
    data: { phone?: string; location?: string; avatar?: string | null }
  ): Promise<UserSession> {
    const employee = await prisma.employee.update({
      where: { employeeId: userId },
      data: {
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.location !== undefined && { location: data.location }),
        ...(data.avatar !== undefined && { avatar: data.avatar }),
      },
    });

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

  /**
   * Destroys active session.
   */
  static destroySession(sessionId: string): boolean {
    if (sessionStore[sessionId]) {
      delete sessionStore[sessionId];
      return true;
    }
    return false;
  }
}


