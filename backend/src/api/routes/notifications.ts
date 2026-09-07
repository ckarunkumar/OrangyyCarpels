import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { NotificationService } from '../../services/notificationService';

const notificationRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.get('/notifications', async (request) => {
    const role = request.user?.role || 'Employee';
    const userId = request.user?.userId ? String(request.user.userId) : undefined;
    return NotificationService.getNotifications(role, userId);
  });

  fastify.post('/notifications/:id/read', async (request, reply) => {
    const { id } = request.params as { id: string };
    const numId = parseInt(id, 10);
    if (isNaN(numId)) return reply.status(400).send({ error: 'Invalid notification id' });
    await NotificationService.markAsRead(numId);
    return { success: true };
  });

  fastify.post('/notifications/read-all', async (request) => {
    const role = request.user?.role || 'Employee';
    const userId = request.user?.userId ? String(request.user.userId) : undefined;
    await NotificationService.markAllAsRead(role, userId);
    return { success: true };
  });
};

export default notificationRoutes;
