"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const prisma_1 = require("../lib/prisma");
const crypto_1 = __importDefault(require("crypto"));
const passwordUtils_1 = require("../utils/passwordUtils");
// In-memory session datastore
const sessionStore = {};
class AuthService {
    /**
     * Logs in a user by email & password, verifying credentials and profile in database.
     */
    static async login(email, password) {
        const cleanEmail = email.toLowerCase().trim();
        const employee = await prisma_1.prisma.employee.findUnique({
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
            const isValid = (0, passwordUtils_1.verifyPassword)(password, employee.password);
            if (!isValid) {
                return { success: false, error: 'Invalid email or password.' };
            }
        }
        else {
            // If legacy unhashed password exists or account is not set, initialize password
            const policy = (0, passwordUtils_1.validatePasswordPolicy)(password);
            if (!policy.isValid) {
                return { success: false, error: 'Invalid email or password.' };
            }
            await prisma_1.prisma.employee.update({
                where: { employeeId: employee.employeeId },
                data: { password: (0, passwordUtils_1.hashPassword)(password) },
            });
        }
        const sessionId = crypto_1.default.randomBytes(16).toString('hex');
        sessionStore[sessionId] = { userId: employee.employeeId };
        const session = {
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
    static async changePassword(userId, currentPassword, newPassword) {
        const employee = await prisma_1.prisma.employee.findUnique({
            where: { employeeId: userId },
        });
        if (!employee) {
            return { success: false, error: 'Employee not found.' };
        }
        if (employee.password && !(0, passwordUtils_1.verifyPassword)(currentPassword, employee.password)) {
            return { success: false, error: 'Current password does not match.' };
        }
        const policy = (0, passwordUtils_1.validatePasswordPolicy)(newPassword);
        if (!policy.isValid) {
            return { success: false, error: policy.error };
        }
        await prisma_1.prisma.employee.update({
            where: { employeeId: userId },
            data: { password: (0, passwordUtils_1.hashPassword)(newPassword) },
        });
        return { success: true };
    }
    /**
     * Allows Super Admins to reset another employee's password.
     */
    static async resetPassword(adminRole, targetEmployeeId, newPassword) {
        if (adminRole !== 'Super Admin') {
            return { success: false, error: 'Access Denied: Only Super Admins can reset employee passwords.' };
        }
        const policy = (0, passwordUtils_1.validatePasswordPolicy)(newPassword);
        if (!policy.isValid) {
            return { success: false, error: policy.error };
        }
        await prisma_1.prisma.employee.update({
            where: { employeeId: targetEmployeeId },
            data: { password: (0, passwordUtils_1.hashPassword)(newPassword) },
        });
        return { success: true };
    }
    /**
     * Retrieves active session by ID, fetching the latest DB details.
     */
    static async getSession(sessionId) {
        const record = sessionStore[sessionId];
        if (!record)
            return null;
        const employee = await prisma_1.prisma.employee.findUnique({
            where: { employeeId: record.userId },
        });
        if (!employee)
            return null;
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
    static async updateProfile(userId, data) {
        const employee = await prisma_1.prisma.employee.update({
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
    static destroySession(sessionId) {
        if (sessionStore[sessionId]) {
            delete sessionStore[sessionId];
            return true;
        }
        return false;
    }
}
exports.AuthService = AuthService;
