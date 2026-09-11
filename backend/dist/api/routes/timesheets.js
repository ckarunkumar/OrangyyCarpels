"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const timesheetService_1 = require("../../services/timesheetService");
const timesheetSchema_1 = require("../schemas/timesheetSchema");
const timesheetRoutes = async (fastify) => {
    // GET projects summary for timesheet view (scoped to assigned projects for employees)
    fastify.get('/timesheets/projects-summary', async (request) => {
        const { month } = request.query;
        const role = request.user?.role || 'Employee';
        const employeeId = request.user?.userId ? String(request.user.userId) : undefined;
        return timesheetService_1.TimesheetService.getEmployeeProjectsSummary(month || '2026-08', employeeId, role);
    });
    // GET full month daily entries for a specific project
    fastify.get('/timesheets/daily-entries', async (request, reply) => {
        const { projectId, month, weekStart } = request.query;
        const monthStr = month || (weekStart ? weekStart.slice(0, 7) : '2026-08');
        const role = request.user?.role || 'Employee';
        const employeeId = request.user?.userId ? String(request.user.userId) : undefined;
        try {
            return await timesheetService_1.TimesheetService.getProjectDailyEntries(projectId, monthStr, employeeId, role);
        }
        catch (err) {
            return reply.status(403).send({ error: err.message });
        }
    });
    // POST save daily entries (draft auto-save)
    fastify.post('/timesheets/daily-entries/save', async (request, reply) => {
        const { projectId, month, weekStart, entries } = request.body;
        const monthStr = month || (weekStart ? weekStart.slice(0, 7) : '2026-08');
        const role = request.user?.role || 'Employee';
        const employeeId = request.user?.userId ? String(request.user.userId) : undefined;
        try {
            return await timesheetService_1.TimesheetService.saveDailyEntries(projectId, monthStr, employeeId, role, entries, 'Draft');
        }
        catch (err) {
            return reply.status(403).send({ error: err.message });
        }
    });
    // POST submit daily entries (by Employee or PM)
    fastify.post('/timesheets/daily-entries/submit', async (request, reply) => {
        const { projectId, month, weekStart, entries } = request.body;
        const monthStr = month || (weekStart ? weekStart.slice(0, 7) : '2026-08');
        const role = request.user?.role || 'Employee';
        const employeeId = request.user?.userId ? String(request.user.userId) : undefined;
        try {
            return await timesheetService_1.TimesheetService.saveDailyEntries(projectId, monthStr, employeeId, role, entries, 'Submitted');
        }
        catch (err) {
            return reply.status(403).send({ error: err.message });
        }
    });
    // POST approve daily entries (PM -> PM_Approved, Super Admin -> Approved)
    fastify.post('/timesheets/daily-entries/approve', async (request, reply) => {
        const { projectId, month } = request.body;
        const role = request.user?.role || 'Employee';
        const employeeId = request.user?.userId ? String(request.user.userId) : undefined;
        try {
            return await timesheetService_1.TimesheetService.approveTimesheet(projectId, month || '2026-08', employeeId, role);
        }
        catch (err) {
            return reply.status(403).send({ error: err.message });
        }
    });
    // POST reopen daily entries (PM or Super Admin -> sets to Draft to allow Emp rework)
    fastify.post('/timesheets/daily-entries/reopen', async (request, reply) => {
        const { projectId, month } = request.body;
        const role = request.user?.role || 'Employee';
        const employeeId = request.user?.userId ? String(request.user.userId) : undefined;
        try {
            return await timesheetService_1.TimesheetService.reopenTimesheet(projectId, month || '2026-08', employeeId, role);
        }
        catch (err) {
            return reply.status(403).send({ error: err.message });
        }
    });
    // Legacy timesheet routes for fallback
    fastify.get('/timesheets', { schema: timesheetSchema_1.getTimesheetSchema }, async (request) => {
        const { weekStart } = request.query;
        return timesheetService_1.TimesheetService.getWeeklySheet(weekStart);
    });
    fastify.post('/timesheets/save', { schema: timesheetSchema_1.saveTimesheetSchema }, async (request, reply) => {
        const { weekStart, rows } = request.body;
        const result = await timesheetService_1.TimesheetService.saveDraft(weekStart, request.user.role, rows);
        if (!result.success)
            return reply.status(403).send({ error: result.error });
        return result.data;
    });
    fastify.post('/timesheets/submit', { schema: timesheetSchema_1.saveTimesheetSchema }, async (request, reply) => {
        const { weekStart, rows } = request.body;
        const result = await timesheetService_1.TimesheetService.submitSheet(weekStart, request.user.role, rows);
        if (!result.success)
            return reply.status(403).send({ error: result.error });
        return result.data;
    });
    fastify.post('/timesheets/approve', { schema: timesheetSchema_1.approveTimesheetSchema }, async (request, reply) => {
        const { weekStart, action } = request.body;
        const result = await timesheetService_1.TimesheetService.approveOrRejectSheet(weekStart, request.user.role, action);
        if (!result.success)
            return reply.status(403).send({ error: result.error });
        return result.data;
    });
};
exports.default = timesheetRoutes;
