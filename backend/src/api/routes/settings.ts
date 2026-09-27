import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { SettingsService, StudioIdentityData, OperationalStandardsData, CurrencyBillingData } from '../../services/settingsService';

export async function settingsRoutes(fastify: FastifyInstance) {
  // GET /settings/studio
  fastify.get('/settings/studio', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await SettingsService.getStudioIdentity();
      return reply.send(data);
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  // PUT /settings/studio
  fastify.put('/settings/studio', async (request: FastifyRequest<{ Body: StudioIdentityData }>, reply: FastifyReply) => {
    try {
      const role = request.user?.role || 'Employee';
      if (role !== 'Super Admin') return reply.status(403).send({ error: 'Super Admin only' });
      const updated = await SettingsService.updateStudioIdentity(role, request.body);
      return reply.send(updated);
    } catch (err: any) {
      return reply.status(403).send({ error: err.message });
    }
  });

  // GET /settings/configurations
  fastify.get('/settings/configurations', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await SettingsService.getConfigurations();
      return reply.send(data);
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  // PUT /settings/configurations
  fastify.put(
    '/settings/configurations',
    async (
      request: FastifyRequest<{ Body: { operational?: OperationalStandardsData; currencyBilling?: CurrencyBillingData } }>,
      reply: FastifyReply
    ) => {
      try {
        const role = request.user?.role || 'Employee';
        if (role !== 'Super Admin') return reply.status(403).send({ error: 'Super Admin only' });
        const updated = await SettingsService.updateConfigurations(role, request.body);
        return reply.send(updated);
      } catch (err: any) {
        return reply.status(403).send({ error: err.message });
      }
    }
  );
}

export default settingsRoutes;
