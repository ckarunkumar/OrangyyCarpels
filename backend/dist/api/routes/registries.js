"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const registryService_1 = require("../../services/registryService");
const registrySchema_1 = require("../schemas/registrySchema");
const registryRoutes = async (fastify) => {
    // GET employees list
    fastify.get('/employees', { schema: registrySchema_1.getRegistrySchema }, async (request, reply) => {
        const role = request.user.role;
        try {
            const emps = await registryService_1.RegistryService.getEmployees(role);
            return emps;
        }
        catch (err) {
            return reply.status(403).send({ error: err.message });
        }
    });
    // GET next employee ID
    fastify.get('/employees/next-id', async (request, reply) => {
        try {
            const nextId = await registryService_1.RegistryService.getNextEmployeeId();
            return { nextId };
        }
        catch (err) {
            return reply.status(500).send({ error: err.message });
        }
    });
    // POST create employee
    fastify.post('/employees', { schema: registrySchema_1.createEmployeeSchema }, async (request, reply) => {
        const employeeData = request.body;
        const role = request.user.role;
        try {
            const newEmp = await registryService_1.RegistryService.createEmployee(role, employeeData);
            return newEmp;
        }
        catch (err) {
            return reply.status(403).send({ error: err.message });
        }
    });
    // PUT update employee
    fastify.put('/employees/:id', { schema: registrySchema_1.updateEmployeeSchema }, async (request, reply) => {
        const { id } = request.params;
        const updateData = request.body;
        const role = request.user.role;
        try {
            const updated = await registryService_1.RegistryService.updateEmployee(role, id, updateData);
            return updated;
        }
        catch (err) {
            const status = err.message.startsWith('Access Denied') ? 403 : 404;
            return reply.status(status).send({ error: err.message });
        }
    });
    // GET clients list (with projects)
    fastify.get('/clients', { schema: registrySchema_1.getRegistrySchema }, async (request, reply) => {
        const role = request.user.role;
        try {
            const clients = await registryService_1.RegistryService.getClients(role);
            return clients;
        }
        catch (err) {
            return reply.status(403).send({ error: err.message });
        }
    });
    // GET next client ID
    fastify.get('/clients/next-id', async (request, reply) => {
        try {
            const nextId = await registryService_1.RegistryService.getNextClientId();
            return { nextId };
        }
        catch (err) {
            return reply.status(500).send({ error: err.message });
        }
    });
    // POST create client
    fastify.post('/clients', { schema: registrySchema_1.createClientSchema }, async (request, reply) => {
        const data = request.body;
        const role = request.user.role;
        try {
            const newClient = await registryService_1.RegistryService.createClient(role, data);
            return newClient;
        }
        catch (err) {
            const status = err.message.includes('already exists') ? 409 : 403;
            return reply.status(status).send({ error: err.message });
        }
    });
    // PUT update client
    fastify.put('/clients/:id', { schema: registrySchema_1.updateClientSchema }, async (request, reply) => {
        const { id } = request.params;
        const updateData = request.body;
        const role = request.user.role;
        try {
            const updated = await registryService_1.RegistryService.updateClient(role, id, updateData);
            return updated;
        }
        catch (err) {
            const status = err.message.startsWith('Access Denied') ? 403 : 404;
            return reply.status(status).send({ error: err.message });
        }
    });
    // GET all projects list
    fastify.get('/projects', { schema: registrySchema_1.getRegistrySchema }, async (request, reply) => {
        const role = request.user.role;
        try {
            const projects = await registryService_1.RegistryService.getAllProjects(role);
            return projects;
        }
        catch (err) {
            return reply.status(403).send({ error: err.message });
        }
    });
    // GET next project ID
    fastify.get('/projects/next-id', async (request, reply) => {
        try {
            const nextId = await registryService_1.RegistryService.getNextProjectId();
            return { nextId };
        }
        catch (err) {
            return reply.status(500).send({ error: err.message });
        }
    });
    // POST create project under client
    fastify.post('/projects', { schema: registrySchema_1.createProjectSchema }, async (request, reply) => {
        const { id, clientId, name, billingType, rate, budgetHours, startDate, endDate, managerId, managerName, assignedEmployees, businessLine, service } = request.body;
        const role = request.user.role;
        try {
            const newProj = await registryService_1.RegistryService.createProject(role, clientId, name, billingType, rate, budgetHours, startDate, endDate, id, managerId, managerName, assignedEmployees, businessLine, service);
            return newProj;
        }
        catch (err) {
            return reply.status(403).send({ error: err.message });
        }
    });
    // PUT update project
    fastify.put('/projects/:id', { schema: registrySchema_1.updateProjectSchema }, async (request, reply) => {
        const { id } = request.params;
        const updateData = request.body;
        const role = request.user.role;
        try {
            const updated = await registryService_1.RegistryService.updateProject(role, id, updateData);
            return updated;
        }
        catch (err) {
            const status = err.message.startsWith('Access Denied') ? 403 : 404;
            return reply.status(status).send({ error: err.message });
        }
    });
};
exports.default = registryRoutes;
