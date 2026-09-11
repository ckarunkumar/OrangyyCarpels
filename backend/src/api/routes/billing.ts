import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { BillingService } from '../../services/billingService';
import { getBillingSummarySchema, addRateVersionSchema } from '../schemas/billingSchema';

interface AddRateVersionBody {
  billingType: string;
  rateAmount: number;
  currency: string;
  effectiveStartDate: string;
  effectiveEndDate?: string;
  notes?: string;
}

export async function billingRoutes(fastify: FastifyInstance) {
  // GET /billing/summary
  fastify.get('/billing/summary', { schema: getBillingSummarySchema }, async (request: FastifyRequest<{ Querystring: { fy?: string } }>, reply: FastifyReply) => {
    try {
      const role = request.user?.role || 'Employee';
      const fy = request.query?.fy;
      const summary = await BillingService.getBillingSummary(role, fy);
      return reply.send(summary);
    } catch (err: any) {
      return reply.status(403).send({ error: err.message });
    }
  });

  // GET /billing/rates
  fastify.get('/billing/rates', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const rates = await BillingService.getExchangeRates();
      return reply.send(rates);
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  // POST /billing/rates/sync
  fastify.post('/billing/rates/sync', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const role = request.user?.role || 'Employee';
      if (role !== 'Super Admin') return reply.status(403).send({ error: 'Super Admin only' });
      const rates = await BillingService.syncLiveExchangeRates();
      return reply.send({ success: true, rates });
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  // GET /billing/projects/:id/rate-versions
  fastify.get('/billing/projects/:id/rate-versions', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const versions = await BillingService.getProjectRateVersions(request.params.id);
      return reply.send(versions);
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  // POST /billing/projects/:id/rate-versions
  fastify.post('/billing/projects/:id/rate-versions', { schema: addRateVersionSchema }, async (request: FastifyRequest<{ Params: { id: string }; Body: AddRateVersionBody }>, reply: FastifyReply) => {
    try {
      const role = request.user?.role || 'Employee';
      const version = await BillingService.addProjectRateVersion(role, request.params.id, request.body);
      return reply.status(201).send(version);
    } catch (err: any) {
      return reply.status(403).send({ error: err.message });
    }
  });

  // GET /billing/projects/:id/monthly-budgets
  fastify.get('/billing/projects/:id/monthly-budgets', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const budgets = await BillingService.getProjectMonthlyBudgets(request.params.id);
      return reply.send(budgets);
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  // POST /billing/projects/:id/monthly-budgets
  fastify.post('/billing/projects/:id/monthly-budgets', async (request: FastifyRequest<{ Params: { id: string }; Body: { monthYear: string; budgetHours: number } }>, reply: FastifyReply) => {
    try {
      const role = request.user?.role || 'Employee';
      const { monthYear, budgetHours } = request.body;
      const budget = await BillingService.setProjectMonthlyBudget(role, request.params.id, monthYear, budgetHours);
      return reply.status(200).send(budget);
    } catch (err: any) {
      return reply.status(403).send({ error: err.message });
    }
  });
}

export default billingRoutes;
