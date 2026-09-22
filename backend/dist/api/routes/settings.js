"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsRoutes = settingsRoutes;
const settingsService_1 = require("../../services/settingsService");
async function settingsRoutes(fastify) {
    // GET /settings/studio
    fastify.get('/settings/studio', async (_request, reply) => {
        try {
            const data = await settingsService_1.SettingsService.getStudioIdentity();
            return reply.send(data);
        }
        catch (err) {
            return reply.status(500).send({ error: err.message });
        }
    });
    // PUT /settings/studio
    fastify.put('/settings/studio', async (request, reply) => {
        try {
            const role = request.user?.role || 'Employee';
            if (role !== 'Super Admin')
                return reply.status(403).send({ error: 'Super Admin only' });
            const updated = await settingsService_1.SettingsService.updateStudioIdentity(role, request.body);
            return reply.send(updated);
        }
        catch (err) {
            return reply.status(403).send({ error: err.message });
        }
    });
    // GET /settings/configurations
    fastify.get('/settings/configurations', async (_request, reply) => {
        try {
            const data = await settingsService_1.SettingsService.getConfigurations();
            return reply.send(data);
        }
        catch (err) {
            return reply.status(500).send({ error: err.message });
        }
    });
    // PUT /settings/configurations
    fastify.put('/settings/configurations', async (request, reply) => {
        try {
            const role = request.user?.role || 'Employee';
            if (role !== 'Super Admin')
                return reply.status(403).send({ error: 'Super Admin only' });
            const updated = await settingsService_1.SettingsService.updateConfigurations(role, request.body);
            return reply.send(updated);
        }
        catch (err) {
            return reply.status(403).send({ error: err.message });
        }
    });
}
exports.default = settingsRoutes;
