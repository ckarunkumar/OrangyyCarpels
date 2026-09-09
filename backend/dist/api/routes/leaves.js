"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const leaveService_1 = require("../../services/leaveService");
const compOffService_1 = require("../../services/compOffService");
const holidayService_1 = require("../../services/holidayService");
const leaveRoutes = async (fastify) => {
    fastify.get('/leaves/balance', async (request, reply) => {
        if (!request.user)
            return reply.status(401).send({ error: 'Unauthorized' });
        const empId = request.user.employeeId || `ODE${String(request.user.id).padStart(4, '0')}`;
        const year = Number(request.query?.year) || 2026;
        const balance = await leaveService_1.LeaveService.getBalance(empId, year);
        return reply.send(balance);
    });
    fastify.get('/leaves/requests', async (request, reply) => {
        if (!request.user)
            return reply.status(401).send({ error: 'Unauthorized' });
        const requests = await leaveService_1.LeaveService.getLeaveRequests(request.user);
        return reply.send(requests);
    });
    fastify.post('/leaves/apply', async (request, reply) => {
        if (!request.user)
            return reply.status(401).send({ error: 'Unauthorized' });
        try {
            const record = await leaveService_1.LeaveService.applyLeave(request.user, request.body);
            return reply.status(201).send(record);
        }
        catch (err) {
            return reply.status(400).send({ error: err.message });
        }
    });
    fastify.post('/leaves/requests/:id/action', async (request, reply) => {
        if (!request.user)
            return reply.status(401).send({ error: 'Unauthorized' });
        const { id } = request.params;
        const { action, remarks } = request.body;
        try {
            const record = await leaveService_1.LeaveService.approveOrRejectLeave(request.user, Number(id), action, remarks);
            return reply.send(record);
        }
        catch (err) {
            return reply.status(400).send({ error: err.message });
        }
    });
    fastify.get('/leaves/compoff', async (request, reply) => {
        if (!request.user)
            return reply.status(401).send({ error: 'Unauthorized' });
        const records = await compOffService_1.CompOffService.getCompOffRequests(request.user);
        return reply.send(records);
    });
    fastify.post('/leaves/compoff/apply', async (request, reply) => {
        if (!request.user)
            return reply.status(401).send({ error: 'Unauthorized' });
        try {
            const record = await compOffService_1.CompOffService.applyCompOff(request.user, request.body);
            return reply.status(201).send(record);
        }
        catch (err) {
            return reply.status(400).send({ error: err.message });
        }
    });
    fastify.post('/leaves/compoff/:id/action', async (request, reply) => {
        if (!request.user)
            return reply.status(401).send({ error: 'Unauthorized' });
        const { id } = request.params;
        const { action } = request.body;
        try {
            const record = await compOffService_1.CompOffService.approveOrRejectCompOff(request.user, id, action);
            return reply.send(record);
        }
        catch (err) {
            return reply.status(400).send({ error: err.message });
        }
    });
    fastify.get('/leaves/holidays', async (request, reply) => {
        const year = Number(request.query?.year) || 2026;
        const onlyPublished = request.query?.published === 'true';
        const holidays = await holidayService_1.HolidayService.getHolidays(year, onlyPublished);
        return reply.send(holidays);
    });
    fastify.post('/leaves/holidays', async (request, reply) => {
        if (!request.user)
            return reply.status(401).send({ error: 'Unauthorized' });
        try {
            const holiday = await holidayService_1.HolidayService.createHoliday(request.user.role, request.body);
            return reply.status(201).send(holiday);
        }
        catch (err) {
            return reply.status(400).send({ error: err.message });
        }
    });
    fastify.delete('/leaves/holidays/:id', async (request, reply) => {
        if (!request.user)
            return reply.status(401).send({ error: 'Unauthorized' });
        const { id } = request.params;
        try {
            const res = await holidayService_1.HolidayService.deleteHoliday(request.user.role, Number(id));
            return reply.send(res);
        }
        catch (err) {
            return reply.status(400).send({ error: err.message });
        }
    });
    fastify.post('/leaves/holidays/publish', async (request, reply) => {
        if (!request.user)
            return reply.status(401).send({ error: 'Unauthorized' });
        const year = Number(request.body?.year) || 2026;
        try {
            const res = await holidayService_1.HolidayService.publishYearlyCalendar(request.user.role, year);
            return reply.send(res);
        }
        catch (err) {
            return reply.status(400).send({ error: err.message });
        }
    });
    fastify.get('/leaves/attendance', async (request, reply) => {
        const monthYear = request.query?.monthYear || '2026-08';
        const data = await leaveService_1.LeaveService.getAttendanceMatrix(monthYear);
        return reply.send(data);
    });
    fastify.get('/leaves/settings', async (request, reply) => {
        const year = Number(request.query?.year) || 2026;
        const configs = await leaveService_1.LeaveService.getLeaveConfigs(year);
        return reply.send(configs);
    });
    fastify.post('/leaves/settings', async (request, reply) => {
        if (!request.user)
            return reply.status(401).send({ error: 'Unauthorized' });
        try {
            const created = await leaveService_1.LeaveService.createLeaveConfig(request.user.role, request.body);
            return reply.status(201).send(created);
        }
        catch (err) {
            return reply.status(400).send({ error: err.message });
        }
    });
    fastify.put('/leaves/settings/:id', async (request, reply) => {
        if (!request.user)
            return reply.status(401).send({ error: 'Unauthorized' });
        const { id } = request.params;
        try {
            const updated = await leaveService_1.LeaveService.updateLeaveConfig(request.user.role, Number(id), request.body);
            return reply.send(updated);
        }
        catch (err) {
            return reply.status(400).send({ error: err.message });
        }
    });
    fastify.delete('/leaves/settings/:id', async (request, reply) => {
        if (!request.user)
            return reply.status(401).send({ error: 'Unauthorized' });
        const { id } = request.params;
        try {
            const res = await leaveService_1.LeaveService.deleteLeaveConfig(request.user.role, Number(id));
            return reply.send(res);
        }
        catch (err) {
            return reply.status(400).send({ error: err.message });
        }
    });
};
exports.default = leaveRoutes;
