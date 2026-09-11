import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { TimesheetService } from '../../services/timesheetService';
import {
  getTimesheetSchema,
  saveTimesheetSchema,
  approveTimesheetSchema,
} from '../schemas/timesheetSchema';

const timesheetRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // GET projects summary for timesheet view (scoped to assigned projects for employees)
  fastify.get('/timesheets/projects-summary', async (request) => {
    const { month } = request.query as { month?: string };
    const role = request.user?.role || 'Employee';
    const employeeId = request.user?.userId ? String(request.user.userId) : undefined;
    return TimesheetService.getEmployeeProjectsSummary(month || '2026-08', employeeId, role);
  });

  // GET full month daily entries for a specific project
  fastify.get('/timesheets/daily-entries', async (request, reply) => {
    const { projectId, month, weekStart } = request.query as { projectId: string; month?: string; weekStart?: string };
    const monthStr = month || (weekStart ? weekStart.slice(0, 7) : '2026-08');
    const role = request.user?.role || 'Employee';
    const employeeId = request.user?.userId ? String(request.user.userId) : undefined;
    try {
      return await TimesheetService.getProjectDailyEntries(projectId, monthStr, employeeId, role);
    } catch (err: any) {
      return reply.status(403).send({ error: err.message });
    }
  });

  // POST save daily entries (draft auto-save)
  fastify.post('/timesheets/daily-entries/save', async (request, reply) => {
    const { projectId, month, weekStart, entries } = request.body as {
      projectId: string; month?: string; weekStart?: string; entries: any[];
    };
    const monthStr = month || (weekStart ? weekStart.slice(0, 7) : '2026-08');
    const role = request.user?.role || 'Employee';
    const employeeId = request.user?.userId ? String(request.user.userId) : undefined;
    try {
      return await TimesheetService.saveDailyEntries(projectId, monthStr, employeeId, role, entries, 'Draft');
    } catch (err: any) {
      return reply.status(403).send({ error: err.message });
    }
  });

  // POST submit daily entries (by Employee or PM)
  fastify.post('/timesheets/daily-entries/submit', async (request, reply) => {
    const { projectId, month, weekStart, entries } = request.body as {
      projectId: string; month?: string; weekStart?: string; entries: any[];
    };
    const monthStr = month || (weekStart ? weekStart.slice(0, 7) : '2026-08');
    const role = request.user?.role || 'Employee';
    const employeeId = request.user?.userId ? String(request.user.userId) : undefined;
    try {
      return await TimesheetService.saveDailyEntries(projectId, monthStr, employeeId, role, entries, 'Submitted');
    } catch (err: any) {
      return reply.status(403).send({ error: err.message });
    }
  });

  // POST approve daily entries (PM -> PM_Approved, Super Admin -> Approved)
  fastify.post('/timesheets/daily-entries/approve', async (request, reply) => {
    const { projectId, month } = request.body as { projectId: string; month: string };
    const role = request.user?.role || 'Employee';
    const employeeId = request.user?.userId ? String(request.user.userId) : undefined;
    try {
      return await TimesheetService.approveTimesheet(projectId, month || '2026-08', employeeId, role);
    } catch (err: any) {
      return reply.status(403).send({ error: err.message });
    }
  });

  // POST reopen daily entries (PM or Super Admin -> sets to Draft to allow Emp rework)
  fastify.post('/timesheets/daily-entries/reopen', async (request, reply) => {
    const { projectId, month } = request.body as { projectId: string; month: string };
    const role = request.user?.role || 'Employee';
    const employeeId = request.user?.userId ? String(request.user.userId) : undefined;
    try {
      return await TimesheetService.reopenTimesheet(projectId, month || '2026-08', employeeId, role);
    } catch (err: any) {
      return reply.status(403).send({ error: err.message });
    }
  });

  // Legacy timesheet routes for fallback
  fastify.get('/timesheets', { schema: getTimesheetSchema }, async (request) => {
    const { weekStart } = request.query as { weekStart: string };
    return TimesheetService.getWeeklySheet(weekStart);
  });

  fastify.post('/timesheets/save', { schema: saveTimesheetSchema }, async (request, reply) => {
    const { weekStart, rows } = request.body as { weekStart: string; rows: any[] };
    const result = await TimesheetService.saveDraft(weekStart, request.user!.role, rows);
    if (!result.success) return reply.status(403).send({ error: result.error });
    return result.data;
  });

  fastify.post('/timesheets/submit', { schema: saveTimesheetSchema }, async (request, reply) => {
    const { weekStart, rows } = request.body as { weekStart: string; rows: any[] };
    const result = await TimesheetService.submitSheet(weekStart, request.user!.role, rows);
    if (!result.success) return reply.status(403).send({ error: result.error });
    return result.data;
  });

  fastify.post('/timesheets/approve', { schema: approveTimesheetSchema }, async (request, reply) => {
    const { weekStart, action } = request.body as { weekStart: string; action: 'approve' | 'reject' };
    const result = await TimesheetService.approveOrRejectSheet(weekStart, request.user!.role, action);
    if (!result.success) return reply.status(403).send({ error: result.error });
    return result.data;
  });
};

export default timesheetRoutes;
