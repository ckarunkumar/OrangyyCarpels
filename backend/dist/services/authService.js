"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const prisma_1 = require("../lib/prisma");
const crypto_1 = __importDefault(require("crypto"));
// In-memory session datastore
const sessionStore = {};
class AuthService {
    /**
     * Logs in a user by email, verifying profile exists in database.
     */
    static async login(email) {
        const cleanEmail = email.toLowerCase().trim();
        const employee = await prisma_1.prisma.employee.findUnique({
            where: { email: cleanEmail },
        });
        if (!employee) {
            return { success: false, error: 'Unauthorized: No employee profile registered with this email.' };
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
