"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clientUserRoutes = clientUserRoutes;
const clientUserService_1 = require("../../services/clientUserService");
async function clientUserRoutes(fastify) {
    // GET all client users
    fastify.get('/client-users', async (request, reply) => {
        try {
            const role = request.user?.role || 'Employee';
            const { clientId } = request.query || {};
            const users = await clientUserService_1.ClientUserService.getAllClientUsers(role, clientId);
            return reply.send(users);
        }
        catch (err) {
            return reply.status(403).send({ error: err.message });
        }
    });
    // GET next client user ID
    fastify.get('/client-users/next-id', async (_request, reply) => {
        try {
            const nextId = await clientUserService_1.ClientUserService.getNextId();
            return reply.send({ nextId });
        }
        catch (err) {
            return reply.status(500).send({ error: err.message });
        }
    });
    // GET client users for a specific client (active users for dropdown)
    fastify.get('/clients/:clientId/client-users', async (request, reply) => {
        try {
            const users = await clientUserService_1.ClientUserService.getClientUsersByClient(request.params.clientId);
            return reply.send(users);
        }
        catch (err) {
            return reply.status(500).send({ error: err.message });
        }
    });
    // GET single client user
    fastify.get('/client-users/:id', async (request, reply) => {
        try {
            const user = await clientUserService_1.ClientUserService.getClientUserById(request.params.id);
            if (!user)
                return reply.status(404).send({ error: 'Client User not found' });
            return reply.send(user);
        }
        catch (err) {
            return reply.status(500).send({ error: err.message });
        }
    });
    // POST create client user
    fastify.post('/client-users', async (request, reply) => {
        try {
            const role = request.user?.role || 'Employee';
            const created = await clientUserService_1.ClientUserService.createClientUser(role, request.body);
            return reply.status(201).send(created);
        }
        catch (err) {
            const status = err.message.includes('already registered') || err.message.includes('already taken') ? 409 : 400;
            return reply.status(status).send({ error: err.message });
        }
    });
    // PUT update client user
    fastify.put('/client-users/:id', async (request, reply) => {
        try {
            const role = request.user?.role || 'Employee';
            const updated = await clientUserService_1.ClientUserService.updateClientUser(role, request.params.id, request.body);
            return reply.send(updated);
        }
        catch (err) {
            const status = err.message.includes('already registered') || err.message.includes('already taken') ? 409 : 400;
            return reply.status(status).send({ error: err.message });
        }
    });
}
exports.default = clientUserRoutes;
