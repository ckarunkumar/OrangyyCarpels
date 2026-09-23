"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const prisma_1 = require("../lib/prisma");
const crypto_1 = __importDefault(require("crypto"));
const passwordUtils_1 = require("../utils/passwordUtils");
const sessionStore = {};
class AuthService {
    static async login(email, password) {
        const cleanEmail = email.toLowerCase().trim();
        if (!password)
            return { success: false, error: 'Password is required.' };
        // 1. Check Employee
        const employee = await prisma_1.prisma.employee.findUnique({ where: { email: cleanEmail } });
        if (employee) {
            if (employee.status === 'Inactive') {
                return { success: false, error: 'Account is inactive. Please contact your studio administrator.' };
            }
            if (employee.password) {
                if (!(0, passwordUtils_1.verifyPassword)(password, employee.password))
                    return { success: false, error: 'Invalid email or password.' };
            }
            else {
                const policy = (0, passwordUtils_1.validatePasswordPolicy)(password);
                if (!policy.isValid)
                    return { success: false, error: 'Invalid email or password.' };
                await prisma_1.prisma.employee.update({ where: { employeeId: employee.employeeId }, data: { password: (0, passwordUtils_1.hashPassword)(password) } });
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
        // 2. Check Client User
        const clientUser = await prisma_1.prisma.clientUser.findFirst({
            where: { OR: [{ email: cleanEmail }, { username: cleanEmail }] },
            include: { client: true },
        });
        if (clientUser) {
            if (clientUser.status === 'Cannot Login' || clientUser.status === 'Inactive') {
                return { success: false, error: 'Account is disabled from logging in. Please contact your administrator.' };
            }
            if (!(0, passwordUtils_1.verifyPassword)(password, clientUser.password)) {
                return { success: false, error: 'Invalid email or password.' };
            }
            const sessionId = crypto_1.default.randomBytes(16).toString('hex');
            sessionStore[sessionId] = { userId: clientUser.id };
            const session = {
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
    static async getSession(sessionId) {
        const record = sessionStore[sessionId];
        if (!record)
            return null;
        const employee = await prisma_1.prisma.employee.findUnique({ where: { employeeId: record.userId } });
        if (employee) {
            if (employee.status === 'Inactive')
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
        const clientUser = await prisma_1.prisma.clientUser.findUnique({
            where: { id: record.userId },
            include: { client: true },
        });
        if (clientUser) {
            if (clientUser.status === 'Cannot Login' || clientUser.status === 'Inactive')
                return null;
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
    static async resetPassword(adminRole, targetEmployeeId, newPassword) {
        if (adminRole !== 'Super Admin')
            return { success: false, error: 'Access Denied: Only Super Admins can reset passwords.' };
        const policy = (0, passwordUtils_1.validatePasswordPolicy)(newPassword);
        if (!policy.isValid)
            return { success: false, error: policy.error };
        const employee = await prisma_1.prisma.employee.findUnique({ where: { employeeId: targetEmployeeId } });
        if (employee) {
            await prisma_1.prisma.employee.update({ where: { employeeId: targetEmployeeId }, data: { password: (0, passwordUtils_1.hashPassword)(newPassword) } });
            return { success: true };
        }
        const clientUser = await prisma_1.prisma.clientUser.findUnique({ where: { id: targetEmployeeId } });
        if (clientUser) {
            await prisma_1.prisma.clientUser.update({ where: { id: targetEmployeeId }, data: { password: (0, passwordUtils_1.hashPassword)(newPassword) } });
            return { success: true };
        }
        return { success: false, error: 'User not found.' };
    }
    static async changePassword(userId, currentPassword, newPassword) {
        const policy = (0, passwordUtils_1.validatePasswordPolicy)(newPassword);
        if (!policy.isValid)
            return { success: false, error: policy.error };
        const employee = await prisma_1.prisma.employee.findUnique({ where: { employeeId: userId } });
        if (employee) {
            if (employee.password && !(0, passwordUtils_1.verifyPassword)(currentPassword, employee.password))
                return { success: false, error: 'Current password does not match.' };
            await prisma_1.prisma.employee.update({ where: { employeeId: userId }, data: { password: (0, passwordUtils_1.hashPassword)(newPassword) } });
            return { success: true };
        }
        const clientUser = await prisma_1.prisma.clientUser.findUnique({ where: { id: userId } });
        if (clientUser) {
            if (clientUser.password && !(0, passwordUtils_1.verifyPassword)(currentPassword, clientUser.password))
                return { success: false, error: 'Current password does not match.' };
            await prisma_1.prisma.clientUser.update({ where: { id: userId }, data: { password: (0, passwordUtils_1.hashPassword)(newPassword) } });
            return { success: true };
        }
        return { success: false, error: 'User not found.' };
    }
    static async updateProfile(userId, data) {
        const employee = await prisma_1.prisma.employee.findUnique({ where: { employeeId: userId } });
        if (employee) {
            const updated = await prisma_1.prisma.employee.update({
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
        const updatedClient = await prisma_1.prisma.clientUser.update({
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
    static destroySession(sessionId) {
        if (sessionStore[sessionId]) {
            delete sessionStore[sessionId];
            return true;
        }
        return false;
    }
}
exports.AuthService = AuthService;
