"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const authService_1 = require("../../services/authService");
const loginSchema = {
    body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 1 },
            rememberMe: { type: 'boolean' },
        },
    },
};
const changePasswordSchema = {
    body: {
        type: 'object',
        required: ['currentPassword', 'newPassword'],
        properties: {
            currentPassword: { type: 'string' },
            newPassword: { type: 'string', minLength: 9 },
        },
    },
};
const resetPasswordSchema = {
    body: {
        type: 'object',
        required: ['employeeId', 'newPassword'],
        properties: {
            employeeId: { type: 'string' },
            newPassword: { type: 'string', minLength: 9 },
        },
    },
};
const updateProfileSchema = {
    body: {
        type: 'object',
        properties: {
            phone: { type: 'string' },
            location: { type: 'string' },
            avatar: { type: ['string', 'null'] },
        },
    },
};
const authRoutes = async (fastify) => {
    // POST login user
    fastify.post('/auth/login', { schema: loginSchema }, async (request, reply) => {
        const { email, password, rememberMe } = request.body;
        const result = await authService_1.AuthService.login(email, password);
        if (!result.success || !result.sessionId || !result.session) {
            return reply.status(401).send({ error: result.error || 'Authentication failed.' });
        }
        // Set HTTP-only session cookie (15 days if rememberMe or default 15 days session)
        const maxAgeSeconds = rememberMe !== false ? (3600 * 24 * 15) : (3600 * 24 * 7);
        reply.setCookie('sessionId', result.sessionId, {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: maxAgeSeconds,
        });
        return result.session;
    });
    // POST change user password
    fastify.post('/auth/change-password', { schema: changePasswordSchema }, async (request, reply) => {
        const sessionId = request.cookies.sessionId;
        if (!sessionId) {
            return reply.status(401).send({ error: 'Unauthorized: No active session.' });
        }
        const session = await authService_1.AuthService.getSession(sessionId);
        if (!session) {
            reply.clearCookie('sessionId', { path: '/' });
            return reply.status(401).send({ error: 'Unauthorized: Session expired or invalid.' });
        }
        const { currentPassword, newPassword } = request.body;
        const result = await authService_1.AuthService.changePassword(session.userId, currentPassword, newPassword);
        if (!result.success) {
            return reply.status(400).send({ error: result.error || 'Failed to change password.' });
        }
        return { success: true, message: 'Password updated successfully.' };
    });
    // POST reset employee password (Admin only)
    fastify.post('/auth/reset-password', { schema: resetPasswordSchema }, async (request, reply) => {
        const sessionId = request.cookies.sessionId;
        if (!sessionId) {
            return reply.status(401).send({ error: 'Unauthorized: No active session.' });
        }
        const session = await authService_1.AuthService.getSession(sessionId);
        if (!session || session.role !== 'Super Admin') {
            return reply.status(403).send({ error: 'Access Denied: Only Super Admins can reset passwords.' });
        }
        const { employeeId, newPassword } = request.body;
        const result = await authService_1.AuthService.resetPassword(session.role, employeeId, newPassword);
        if (!result.success) {
            return reply.status(400).send({ error: result.error || 'Failed to reset password.' });
        }
        return { success: true, message: 'Employee password reset successfully.' };
    });
    // POST logout user
    fastify.post('/auth/logout', async (request, reply) => {
        const sessionId = request.cookies.sessionId;
        if (sessionId) {
            authService_1.AuthService.destroySession(sessionId);
            reply.clearCookie('sessionId', { path: '/' });
        }
        return { success: true, message: 'Logged out successfully.' };
    });
    // GET currently logged-in profile context
    fastify.get('/auth/me', async (request, reply) => {
        const sessionId = request.cookies.sessionId;
        if (!sessionId) {
            return reply.status(401).send({ error: 'Unauthorized: No active session.' });
        }
        const session = await authService_1.AuthService.getSession(sessionId);
        if (!session) {
            reply.clearCookie('sessionId', { path: '/' });
            return reply.status(401).send({ error: 'Unauthorized: Session expired or invalid.' });
        }
        return session;
    });
    // PUT update currently logged-in user profile
    fastify.put('/auth/profile', { schema: updateProfileSchema }, async (request, reply) => {
        const sessionId = request.cookies.sessionId;
        if (!sessionId) {
            return reply.status(401).send({ error: 'Unauthorized: No active session.' });
        }
        const session = await authService_1.AuthService.getSession(sessionId);
        if (!session) {
            reply.clearCookie('sessionId', { path: '/' });
            return reply.status(401).send({ error: 'Unauthorized: Session expired or invalid.' });
        }
        const { phone, location, avatar } = request.body;
        try {
            const updated = await authService_1.AuthService.updateProfile(session.userId, { phone, location, avatar });
            return updated;
        }
        catch (err) {
            return reply.status(400).send({ error: err.message || 'Failed to update profile.' });
        }
    });
};
exports.default = authRoutes;
