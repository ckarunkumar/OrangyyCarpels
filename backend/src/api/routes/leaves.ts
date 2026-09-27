import { FastifyPluginAsync } from 'fastify';
import { LeaveService } from '../../services/leaveService';
import { CompOffService } from '../../services/compOffService';
import { HolidayService } from '../../services/holidayService';

const leaveRoutes: FastifyPluginAsync = async (fastify) => {
  const handleGetBalance = async (request: any, reply: any) => {
    if (!request.user) return reply.status(401).send({ error: 'Unauthorized' });
    const empId = request.user.employeeId || `ODE${String(request.user.id).padStart(4, '0')}`;
    const year = Number((request.query as any)?.year) || 2026;
    return reply.send(await LeaveService.getBalance(empId, year));
  };

  fastify.get('/leaves/balance', handleGetBalance);
  fastify.get('/leaves/balances', handleGetBalance);

  fastify.get('/leaves/requests', async (request, reply) => {
    if (!request.user) return reply.status(401).send({ error: 'Unauthorized' });
    const scope = ((request.query as any)?.scope as 'mine' | 'approvals') || 'mine';
    return reply.send(await LeaveService.getLeaveRequests(request.user, scope));
  });

  fastify.get('/leaves/my-requests', async (request, reply) => {
    if (!request.user) return reply.status(401).send({ error: 'Unauthorized' });
    return reply.send(await LeaveService.getLeaveRequests(request.user, 'mine'));
  });

  fastify.get('/leaves/approval-requests', async (request, reply) => {
    if (!request.user) return reply.status(401).send({ error: 'Unauthorized' });
    return reply.send(await LeaveService.getLeaveRequests(request.user, 'approvals'));
  });

  fastify.get('/leaves/approval-compoffs', async (request, reply) => {
    if (!request.user) return reply.status(401).send({ error: 'Unauthorized' });
    return reply.send(await CompOffService.getCompOffRequests(request.user, 'approvals'));
  });

  fastify.post('/leaves/apply', async (request, reply) => {
    if (!request.user) return reply.status(401).send({ error: 'Unauthorized' });
    try {
      return reply.status(201).send(await LeaveService.applyLeave(request.user, request.body as any));
    } catch (err: any) { return reply.status(400).send({ error: err.message }); }
  });

  fastify.put('/leaves/requests/:id', async (request, reply) => {
    if (!request.user) return reply.status(401).send({ error: 'Unauthorized' });
    const { id } = request.params as { id: string };
    try {
      return reply.send(await LeaveService.updateLeave(request.user, Number(id), request.body as any));
    } catch (err: any) { return reply.status(400).send({ error: err.message }); }
  });

  fastify.post('/leaves/requests/:id/cancel', async (request, reply) => {
    if (!request.user) return reply.status(401).send({ error: 'Unauthorized' });
    const { id } = request.params as { id: string };
    try {
      return reply.send(await LeaveService.cancelLeave(request.user, Number(id)));
    } catch (err: any) { return reply.status(400).send({ error: err.message }); }
  });

  fastify.delete('/leaves/requests/:id', async (request, reply) => {
    if (!request.user) return reply.status(401).send({ error: 'Unauthorized' });
    const { id } = request.params as { id: string };
    try {
      return reply.send(await LeaveService.deleteLeave(request.user, Number(id)));
    } catch (err: any) { return reply.status(400).send({ error: err.message }); }
  });

  fastify.post('/leaves/requests/:id/action', async (request, reply) => {
    if (!request.user) return reply.status(401).send({ error: 'Unauthorized' });
    const { id } = request.params as { id: string };
    const { action, remarks } = request.body as { action: 'approve' | 'reject'; remarks?: string };
    try {
      return reply.send(await LeaveService.approveOrRejectLeave(request.user, Number(id), action, remarks));
    } catch (err: any) { return reply.status(400).send({ error: err.message }); }
  });

  fastify.get('/leaves/compoff', async (request, reply) => {
    if (!request.user) return reply.status(401).send({ error: 'Unauthorized' });
    const scope = ((request.query as any)?.scope as 'mine' | 'approvals') || 'mine';
    return reply.send(await CompOffService.getCompOffRequests(request.user, scope));
  });

  fastify.post('/leaves/compoff/apply', async (request, reply) => {
    if (!request.user) return reply.status(401).send({ error: 'Unauthorized' });
    try {
      return reply.status(201).send(await CompOffService.applyCompOff(request.user, request.body as any));
    } catch (err: any) { return reply.status(400).send({ error: err.message }); }
  });

  fastify.post('/leaves/compoff/:id/action', async (request, reply) => {
    if (!request.user) return reply.status(401).send({ error: 'Unauthorized' });
    const { id } = request.params as { id: string };
    const { action } = request.body as { action: 'approve' | 'reject' };
    try {
      return reply.send(await CompOffService.approveOrRejectCompOff(request.user, id, action));
    } catch (err: any) { return reply.status(400).send({ error: err.message }); }
  });

  fastify.get('/leaves/holidays', async (request, reply) => {
    const year = Number((request.query as any)?.year) || 2026;
    const onlyPublished = (request.query as any)?.published === 'true';
    return reply.send(await HolidayService.getHolidays(year, onlyPublished));
  });

  fastify.post('/leaves/holidays', async (request, reply) => {
    if (!request.user) return reply.status(401).send({ error: 'Unauthorized' });
    try {
      return reply.status(201).send(await HolidayService.createHoliday(request.user.role, request.body as any));
    } catch (err: any) { return reply.status(400).send({ error: err.message }); }
  });

  fastify.delete('/leaves/holidays/:id', async (request, reply) => {
    if (!request.user) return reply.status(401).send({ error: 'Unauthorized' });
    const { id } = request.params as { id: string };
    try {
      return reply.send(await HolidayService.deleteHoliday(request.user.role, Number(id)));
    } catch (err: any) { return reply.status(400).send({ error: err.message }); }
  });

  fastify.post('/leaves/holidays/publish', async (request, reply) => {
    if (!request.user) return reply.status(401).send({ error: 'Unauthorized' });
    const year = Number((request.body as any)?.year) || 2026;
    try {
      return reply.send(await HolidayService.publishYearlyCalendar(request.user.role, year));
    } catch (err: any) { return reply.status(400).send({ error: err.message }); }
  });

  fastify.get('/leaves/attendance', async (request, reply) => {
    const monthYear = (request.query as any)?.monthYear || '2026-08';
    return reply.send(await LeaveService.getAttendanceMatrix(monthYear));
  });

  fastify.get('/leaves/settings', async (request, reply) => {
    const year = Number((request.query as any)?.year) || 2026;
    return reply.send(await LeaveService.getLeaveConfigs(year));
  });

  fastify.post('/leaves/settings', async (request, reply) => {
    if (!request.user) return reply.status(401).send({ error: 'Unauthorized' });
    try {
      return reply.status(201).send(await LeaveService.createLeaveConfig(request.user.role, request.body as any));
    } catch (err: any) { return reply.status(400).send({ error: err.message }); }
  });

  fastify.put('/leaves/settings/:id', async (request, reply) => {
    if (!request.user) return reply.status(401).send({ error: 'Unauthorized' });
    const { id } = request.params as { id: string };
    try {
      return reply.send(await LeaveService.updateLeaveConfig(request.user.role, Number(id), request.body as any));
    } catch (err: any) { return reply.status(400).send({ error: err.message }); }
  });

  fastify.delete('/leaves/settings/:id', async (request, reply) => {
    if (!request.user) return reply.status(401).send({ error: 'Unauthorized' });
    const { id } = request.params as { id: string };
    try {
      return reply.send(await LeaveService.deleteLeaveConfig(request.user.role, Number(id)));
    } catch (err: any) { return reply.status(400).send({ error: err.message }); }
  });
};

export default leaveRoutes;
