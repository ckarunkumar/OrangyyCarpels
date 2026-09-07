import { prisma } from '../lib/prisma';
import crypto from 'crypto';

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
   * Logs in a user by email, verifying profile exists in database.
   */
  static async login(email: string): Promise<{ success: boolean; sessionId?: string; session?: UserSession; error?: string }> {
    const cleanEmail = email.toLowerCase().trim();
    const employee = await prisma.employee.findUnique({
      where: { email: cleanEmail },
    });

    if (!employee) {
      return { success: false, error: 'Unauthorized: No employee profile registered with this email.' };
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

