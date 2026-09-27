import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ClientUserService, CreateClientUserInput } from '../../services/clientUserService';

export async function clientUserRoutes(fastify: FastifyInstance) {
  // GET all client users
  fastify.get('/client-users', async (request: FastifyRequest<{ Querystring: { clientId?: string } }>, reply: FastifyReply) => {
    try {
      const role = request.user?.role || 'Employee';
      const { clientId } = request.query || {};
      const users = await ClientUserService.getAllClientUsers(role, clientId);
      return reply.send(users);
    } catch (err: any) {
      return reply.status(403).send({ error: err.message });
    }
  });

  // GET next client user ID
  fastify.get('/client-users/next-id', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const nextId = await ClientUserService.getNextId();
      return reply.send({ nextId });
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  // GET client users for a specific client (active users for dropdown)
  fastify.get('/clients/:clientId/client-users', async (request: FastifyRequest<{ Params: { clientId: string } }>, reply: FastifyReply) => {
    try {
      const users = await ClientUserService.getClientUsersByClient(request.params.clientId);
      return reply.send(users);
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  // GET single client user
  fastify.get('/client-users/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const user = await ClientUserService.getClientUserById(request.params.id);
      if (!user) return reply.status(404).send({ error: 'Client User not found' });
      return reply.send(user);
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  // POST create client user
  fastify.post('/client-users', async (request: FastifyRequest<{ Body: CreateClientUserInput }>, reply: FastifyReply) => {
    try {
      const role = request.user?.role || 'Employee';
      const created = await ClientUserService.createClientUser(role, request.body);
      return reply.status(201).send(created);
    } catch (err: any) {
      const status = err.message.includes('already registered') || err.message.includes('already taken') ? 409 : 400;
      return reply.status(status).send({ error: err.message });
    }
  });

  // PUT update client user
  fastify.put('/client-users/:id', async (request: FastifyRequest<{ Params: { id: string }; Body: Partial<CreateClientUserInput> }>, reply: FastifyReply) => {
    try {
      const role = request.user?.role || 'Employee';
      const updated = await ClientUserService.updateClientUser(role, request.params.id, request.body);
      return reply.send(updated);
    } catch (err: any) {
      const status = err.message.includes('already registered') || err.message.includes('already taken') ? 409 : 400;
      return reply.status(status).send({ error: err.message });
    }
  });

  // DELETE client user
  fastify.delete('/client-users/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const role = request.user?.role || 'Employee';
      const result = await ClientUserService.deleteClientUser(role, request.params.id);
      return reply.send(result);
    } catch (err: any) {
      const status = err.message.includes('Access Denied') ? 403 : err.message.includes('not found') ? 404 : 400;
      return reply.status(status).send({ error: err.message });
    }
  });
}

export default clientUserRoutes;
