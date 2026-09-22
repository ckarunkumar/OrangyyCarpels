import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { BillingService } from '../../services/billingService';
import { FxRateService } from '../../services/fxRateService';
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
  fastify.get('/billing/summary', { schema: getBillingSummarySchema }, async (request: FastifyRequest<{ Querystring: { fy?: string; month?: string; periodType?: string; clientId?: string } }>, reply: FastifyReply) => {
    try {
      const role = request.user?.role || 'Employee';
      const { fy, month, periodType, clientId } = request.query || {};
      const summary = await BillingService.getBillingSummary(role, fy, month, periodType, clientId);
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

  // GET /billing/rates/history
  fastify.get('/billing/rates/history', async (request: FastifyRequest<{ Querystring: { targetCurrency?: string } }>, reply: FastifyReply) => {
    try {
      const target = request.query?.targetCurrency || 'INR';
      const history = await FxRateService.getRateHistory(target);
      return reply.send(history);
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  // GET /billing/rates/current
  fastify.get('/billing/rates/current', async (request: FastifyRequest<{ Querystring: { targetCurrency?: string } }>, reply: FastifyReply) => {
    try {
      const target = request.query?.targetCurrency || 'INR';
      const current = await FxRateService.getCurrentRates(target);
      return reply.send(current);
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  // POST /billing/rates/sync
  fastify.post('/billing/rates/sync', async (request: FastifyRequest<{ Body?: { targetCurrency?: string } }>, reply: FastifyReply) => {
    try {
      const role = request.user?.role || 'Employee';
      if (role !== 'Super Admin') return reply.status(403).send({ error: 'Super Admin only' });
      const target = request.body?.targetCurrency || 'INR';
      const rates = await FxRateService.syncLiveExchangeRates(target);
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
