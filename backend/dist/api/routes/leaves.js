"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const leaveService_1 = require("../../services/leaveService");
const compOffService_1 = require("../../services/compOffService");
const holidayService_1 = require("../../services/holidayService");
const leaveRoutes = async (fastify) => {
    const handleGetBalance = async (request, reply) => {
        if (!request.user)
            return reply.status(401).send({ error: 'Unauthorized' });
        const empId = request.user.employeeId || `ODE${String(request.user.id).padStart(4, '0')}`;
        const year = Number(request.query?.year) || 2026;
        return reply.send(await leaveService_1.LeaveService.getBalance(empId, year));
    };
    fastify.get('/leaves/balance', handleGetBalance);
    fastify.get('/leaves/balances', handleGetBalance);
    fastify.get('/leaves/requests', async (request, reply) => {
        if (!request.user)
            return reply.status(401).send({ error: 'Unauthorized' });
        const scope = request.query?.scope || 'mine';
        return reply.send(await leaveService_1.LeaveService.getLeaveRequests(request.user, scope));
    });
    fastify.get('/leaves/my-requests', async (request, reply) => {
        if (!request.user)
            return reply.status(401).send({ error: 'Unauthorized' });
        return reply.send(await leaveService_1.LeaveService.getLeaveRequests(request.user, 'mine'));
    });
    fastify.get('/leaves/approval-requests', async (request, reply) => {
        if (!request.user)
            return reply.status(401).send({ error: 'Unauthorized' });
        return reply.send(await leaveService_1.LeaveService.getLeaveRequests(request.user, 'approvals'));
    });
    fastify.get('/leaves/approval-compoffs', async (request, reply) => {
        if (!request.user)
            return reply.status(401).send({ error: 'Unauthorized' });
        return reply.send(await compOffService_1.CompOffService.getCompOffRequests(request.user, 'approvals'));
    });
    fastify.post('/leaves/apply', async (request, reply) => {
        if (!request.user)
            return reply.status(401).send({ error: 'Unauthorized' });
        try {
            return reply.status(201).send(await leaveService_1.LeaveService.applyLeave(request.user, request.body));
        }
        catch (err) {
            return reply.status(400).send({ error: err.message });
        }
    });
    fastify.put('/leaves/requests/:id', async (request, reply) => {
        if (!request.user)
            return reply.status(401).send({ error: 'Unauthorized' });
        const { id } = request.params;
        try {
            return reply.send(await leaveService_1.LeaveService.updateLeave(request.user, Number(id), request.body));
        }
        catch (err) {
            return reply.status(400).send({ error: err.message });
        }
    });
    fastify.post('/leaves/requests/:id/cancel', async (request, reply) => {
        if (!request.user)
            return reply.status(401).send({ error: 'Unauthorized' });
        const { id } = request.params;
        try {
            return reply.send(await leaveService_1.LeaveService.cancelLeave(request.user, Number(id)));
        }
        catch (err) {
            return reply.status(400).send({ error: err.message });
        }
    });
    fastify.delete('/leaves/requests/:id', async (request, reply) => {
        if (!request.user)
            return reply.status(401).send({ error: 'Unauthorized' });
        const { id } = request.params;
        try {
            return reply.send(await leaveService_1.LeaveService.deleteLeave(request.user, Number(id)));
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
            return reply.send(await leaveService_1.LeaveService.approveOrRejectLeave(request.user, Number(id), action, remarks));
        }
        catch (err) {
            return reply.status(400).send({ error: err.message });
        }
    });
    fastify.get('/leaves/compoff', async (request, reply) => {
        if (!request.user)
            return reply.status(401).send({ error: 'Unauthorized' });
        const scope = request.query?.scope || 'mine';
        return reply.send(await compOffService_1.CompOffService.getCompOffRequests(request.user, scope));
    });
    fastify.post('/leaves/compoff/apply', async (request, reply) => {
        if (!request.user)
            return reply.status(401).send({ error: 'Unauthorized' });
        try {
            return reply.status(201).send(await compOffService_1.CompOffService.applyCompOff(request.user, request.body));
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
            return reply.send(await compOffService_1.CompOffService.approveOrRejectCompOff(request.user, id, action));
        }
        catch (err) {
            return reply.status(400).send({ error: err.message });
        }
    });
    fastify.get('/leaves/holidays', async (request, reply) => {
        const year = Number(request.query?.year) || 2026;
        const onlyPublished = request.query?.published === 'true';
        return reply.send(await holidayService_1.HolidayService.getHolidays(year, onlyPublished));
    });
    fastify.post('/leaves/holidays', async (request, reply) => {
        if (!request.user)
            return reply.status(401).send({ error: 'Unauthorized' });
        try {
            return reply.status(201).send(await holidayService_1.HolidayService.createHoliday(request.user.role, request.body));
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
            return reply.send(await holidayService_1.HolidayService.deleteHoliday(request.user.role, Number(id)));
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
            return reply.send(await holidayService_1.HolidayService.publishYearlyCalendar(request.user.role, year));
        }
        catch (err) {
            return reply.status(400).send({ error: err.message });
        }
    });
    fastify.get('/leaves/attendance', async (request, reply) => {
        const monthYear = request.query?.monthYear || '2026-08';
        return reply.send(await leaveService_1.LeaveService.getAttendanceMatrix(monthYear));
    });
    fastify.get('/leaves/settings', async (request, reply) => {
        const year = Number(request.query?.year) || 2026;
        return reply.send(await leaveService_1.LeaveService.getLeaveConfigs(year));
    });
    fastify.post('/leaves/settings', async (request, reply) => {
        if (!request.user)
            return reply.status(401).send({ error: 'Unauthorized' });
        try {
            return reply.status(201).send(await leaveService_1.LeaveService.createLeaveConfig(request.user.role, request.body));
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
            return reply.send(await leaveService_1.LeaveService.updateLeaveConfig(request.user.role, Number(id), request.body));
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
            return reply.send(await leaveService_1.LeaveService.deleteLeaveConfig(request.user.role, Number(id)));
        }
        catch (err) {
            return reply.status(400).send({ error: err.message });
        }
    });
};
exports.default = leaveRoutes;
