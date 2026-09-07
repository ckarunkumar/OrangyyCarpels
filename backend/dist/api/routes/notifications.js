"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const notificationService_1 = require("../../services/notificationService");
const notificationRoutes = async (fastify) => {
    fastify.get('/notifications', async (request) => {
        const role = request.user?.role || 'Employee';
        const userId = request.user?.userId ? String(request.user.userId) : undefined;
        return notificationService_1.NotificationService.getNotifications(role, userId);
    });
    fastify.post('/notifications/:id/read', async (request, reply) => {
        const { id } = request.params;
        const numId = parseInt(id, 10);
        if (isNaN(numId))
            return reply.status(400).send({ error: 'Invalid notification id' });
        await notificationService_1.NotificationService.markAsRead(numId);
        return { success: true };
    });
    fastify.post('/notifications/read-all', async (request) => {
        const role = request.user?.role || 'Employee';
        const userId = request.user?.userId ? String(request.user.userId) : undefined;
        await notificationService_1.NotificationService.markAllAsRead(role, userId);
        return { success: true };
    });
};
exports.default = notificationRoutes;
