import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { RegistryService } from '../../services/registryService';
import {
  getRegistrySchema,
  createEmployeeSchema,
  updateEmployeeSchema,
  createClientSchema,
  updateClientSchema,
  createProjectSchema,
  updateProjectSchema,
} from '../schemas/registrySchema';

const registryRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // GET employees list
  fastify.get('/employees', { schema: getRegistrySchema }, async (request, reply) => {
    const role = request.user!.role;
    try {
      const emps = await RegistryService.getEmployees(role);
      return emps;
    } catch (err: any) {
      return reply.status(403).send({ error: err.message });
    }
  });

  // POST create employee
  fastify.post('/employees', { schema: createEmployeeSchema }, async (request, reply) => {
    const employeeData = request.body as any;
    const role = request.user!.role;
    try {
      const newEmp = await RegistryService.createEmployee(role, employeeData);
      return newEmp;
    } catch (err: any) {
      return reply.status(403).send({ error: err.message });
    }
  });

  // PUT update employee
  fastify.put('/employees/:id', { schema: updateEmployeeSchema }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const updateData = request.body as any;
    const role = request.user!.role;
    try {
      const updated = await RegistryService.updateEmployee(role, id, updateData);
      return updated;
    } catch (err: any) {
      const status = err.message.startsWith('Access Denied') ? 403 : 404;
      return reply.status(status).send({ error: err.message });
    }
  });

  // GET clients list (with projects)
  fastify.get('/clients', { schema: getRegistrySchema }, async (request, reply) => {
    const role = request.user!.role;
    try {
      const clients = await RegistryService.getClients(role);
      return clients;
    } catch (err: any) {
      return reply.status(403).send({ error: err.message });
    }
  });

  // POST create client
  fastify.post('/clients', { schema: createClientSchema }, async (request, reply) => {
    const data = request.body as any;
    const role = request.user!.role;
    try {
      const newClient = await RegistryService.createClient(role, data);
      return newClient;
    } catch (err: any) {
      const status = err.message.includes('already exists') ? 409 : 403;
      return reply.status(status).send({ error: err.message });
    }
  });

  // PUT update client
  fastify.put('/clients/:id', { schema: updateClientSchema }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const updateData = request.body as any;
    const role = request.user!.role;
    try {
      const updated = await RegistryService.updateClient(role, id, updateData);
      return updated;
    } catch (err: any) {
      const status = err.message.startsWith('Access Denied') ? 403 : 404;
      return reply.status(status).send({ error: err.message });
    }
  });

  // GET all projects list
  fastify.get('/projects', { schema: getRegistrySchema }, async (request, reply) => {
    const role = request.user!.role;
    try {
      const projects = await RegistryService.getAllProjects(role);
      return projects;
    } catch (err: any) {
      return reply.status(403).send({ error: err.message });
    }
  });

  // POST create project under client
  fastify.post('/projects', { schema: createProjectSchema }, async (request, reply) => {
    const { id, clientId, name, billingType, rate, budgetHours, startDate, endDate, managerId, managerName, assignedEmployees, businessLine, service } = request.body as any;
    const role = request.user!.role;
    try {
      const newProj = await RegistryService.createProject(role, clientId, name, billingType, rate, budgetHours, startDate, endDate, id, managerId, managerName, assignedEmployees, businessLine, service);
      return newProj;
    } catch (err: any) {
      return reply.status(403).send({ error: err.message });
    }
  });

  // PUT update project
  fastify.put('/projects/:id', { schema: updateProjectSchema }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const updateData = request.body as any;
    const role = request.user!.role;
    try {
      const updated = await RegistryService.updateProject(role, id, updateData);
      return updated;
    } catch (err: any) {
      const status = err.message.startsWith('Access Denied') ? 403 : 404;
      return reply.status(status).send({ error: err.message });
    }
  });
};

export default registryRoutes;
