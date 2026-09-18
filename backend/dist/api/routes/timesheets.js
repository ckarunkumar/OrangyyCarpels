"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const timesheetService_1 = require("../../services/timesheetService");
const timesheetRoutes = async (fastify) => {
    // GET timesheet PM / Employee summary for dashboard (scoped by managerId or employee self, date range)
    fastify.get('/timesheets/summary', async (request, reply) => {
        const { fy, fromDate, toDate, clientId, managerId, employeeId: empQuery, scope } = request.query;
        const role = request.user?.role || 'Employee';
        const isEmployee = role === 'Employee';
        const effectiveScope = isEmployee ? 'self' : (scope || 'manager');
        const effectiveUserId = isEmployee
            ? (request.user?.userId ? String(request.user.userId) : undefined)
            : (empQuery || managerId || (request.user?.userId ? String(request.user.userId) : undefined));
        try {
            const { TimesheetPmSummaryService } = await Promise.resolve().then(() => __importStar(require('../../services/timesheetPmSummaryService')));
            return await TimesheetPmSummaryService.getPmSummary(role, effectiveUserId, fy, fromDate, toDate, clientId, effectiveScope);
        }
        catch (err) {
            return reply.status(403).send({ error: err.message });
        }
    });
    // GET projects summary for timesheet view (scoped to assigned projects for employees)
    fastify.get('/timesheets/projects-summary', async (request) => {
        const { month } = request.query;
        const role = request.user?.role || 'Employee';
        const employeeId = request.user?.employeeId || (request.user?.userId ? String(request.user.userId) : undefined);
        return timesheetService_1.TimesheetService.getEmployeeProjectsSummary(month || '2026-08', employeeId, role);
    });
    // GET full month daily entries for a specific project
    fastify.get('/timesheets/daily-entries', async (request, reply) => {
        const { projectId, month, weekStart } = request.query;
        const monthStr = month || (weekStart ? weekStart.slice(0, 7) : '2026-08');
        const role = request.user?.role || 'Employee';
        const employeeId = request.user?.employeeId || (request.user?.userId ? String(request.user.userId) : undefined);
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
        const employeeId = request.user?.employeeId || (request.user?.userId ? String(request.user.userId) : undefined);
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
        const employeeId = request.user?.employeeId || (request.user?.userId ? String(request.user.userId) : undefined);
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
        const employeeId = request.user?.employeeId || (request.user?.userId ? String(request.user.userId) : undefined);
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
        const employeeId = request.user?.employeeId || (request.user?.userId ? String(request.user.userId) : undefined);
        try {
            return await timesheetService_1.TimesheetService.reopenTimesheet(projectId, month || '2026-08', employeeId, role);
        }
        catch (err) {
            return reply.status(403).send({ error: err.message });
        }
    });
};
exports.default = timesheetRoutes;
