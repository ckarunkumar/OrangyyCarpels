"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.billingRoutes = billingRoutes;
const billingService_1 = require("../../services/billingService");
const fxRateService_1 = require("../../services/fxRateService");
const billingSchema_1 = require("../schemas/billingSchema");
async function billingRoutes(fastify) {
    // GET /billing/summary
    fastify.get('/billing/summary', { schema: billingSchema_1.getBillingSummarySchema }, async (request, reply) => {
        try {
            const role = request.user?.role || 'Employee';
            const { fy, month, periodType, clientId } = request.query || {};
            const summary = await billingService_1.BillingService.getBillingSummary(role, fy, month, periodType, clientId);
            return reply.send(summary);
        }
        catch (err) {
            return reply.status(403).send({ error: err.message });
        }
    });
    // GET /billing/rates
    fastify.get('/billing/rates', async (_request, reply) => {
        try {
            const rates = await billingService_1.BillingService.getExchangeRates();
            return reply.send(rates);
        }
        catch (err) {
            return reply.status(500).send({ error: err.message });
        }
    });
    // GET /billing/rates/history
    fastify.get('/billing/rates/history', async (request, reply) => {
        try {
            const target = request.query?.targetCurrency || 'INR';
            const history = await fxRateService_1.FxRateService.getRateHistory(target);
            return reply.send(history);
        }
        catch (err) {
            return reply.status(500).send({ error: err.message });
        }
    });
    // GET /billing/rates/current
    fastify.get('/billing/rates/current', async (request, reply) => {
        try {
            const target = request.query?.targetCurrency || 'INR';
            const current = await fxRateService_1.FxRateService.getCurrentRates(target);
            return reply.send(current);
        }
        catch (err) {
            return reply.status(500).send({ error: err.message });
        }
    });
    // POST /billing/rates/sync
    fastify.post('/billing/rates/sync', async (request, reply) => {
        try {
            const role = request.user?.role || 'Employee';
            if (role !== 'Super Admin')
                return reply.status(403).send({ error: 'Super Admin only' });
            const target = request.body?.targetCurrency || 'INR';
            const rates = await fxRateService_1.FxRateService.syncLiveExchangeRates(target);
            return reply.send({ success: true, rates });
        }
        catch (err) {
            return reply.status(500).send({ error: err.message });
        }
    });
    // GET /billing/projects/:id/rate-versions
    fastify.get('/billing/projects/:id/rate-versions', async (request, reply) => {
        try {
            const versions = await billingService_1.BillingService.getProjectRateVersions(request.params.id);
            return reply.send(versions);
        }
        catch (err) {
            return reply.status(500).send({ error: err.message });
        }
    });
    // POST /billing/projects/:id/rate-versions
    fastify.post('/billing/projects/:id/rate-versions', { schema: billingSchema_1.addRateVersionSchema }, async (request, reply) => {
        try {
            const role = request.user?.role || 'Employee';
            const version = await billingService_1.BillingService.addProjectRateVersion(role, request.params.id, request.body);
            return reply.status(201).send(version);
        }
        catch (err) {
            return reply.status(403).send({ error: err.message });
        }
    });
    // GET /billing/projects/:id/monthly-budgets
    fastify.get('/billing/projects/:id/monthly-budgets', async (request, reply) => {
        try {
            const budgets = await billingService_1.BillingService.getProjectMonthlyBudgets(request.params.id);
            return reply.send(budgets);
        }
        catch (err) {
            return reply.status(500).send({ error: err.message });
        }
    });
    // POST /billing/projects/:id/monthly-budgets
    fastify.post('/billing/projects/:id/monthly-budgets', async (request, reply) => {
        try {
            const role = request.user?.role || 'Employee';
            const { monthYear, budgetHours } = request.body;
            const budget = await billingService_1.BillingService.setProjectMonthlyBudget(role, request.params.id, monthYear, budgetHours);
            return reply.status(200).send(budget);
        }
        catch (err) {
            return reply.status(403).send({ error: err.message });
        }
    });
}
exports.default = billingRoutes;
