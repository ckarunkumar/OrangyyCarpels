import { FastifyPluginAsync } from 'fastify';
import { LeaveService } from '../../services/leaveService';
import { CompOffService } from '../../services/compOffService';
import { HolidayService } from '../../services/holidayService';

const leaveRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/leaves/balance', async (request, reply) => {
    if (!request.user) return reply.status(401).send({ error: 'Unauthorized' });
    const empId = request.user.employeeId || `ODE${String(request.user.id).padStart(4, '0')}`;
    const year = Number((request.query as any)?.year) || 2026;
    const balance = await LeaveService.getBalance(empId, year);
    return reply.send(balance);
  });

  fastify.get('/leaves/requests', async (request, reply) => {
    if (!request.user) return reply.status(401).send({ error: 'Unauthorized' });
    const requests = await LeaveService.getLeaveRequests(request.user);
    return reply.send(requests);
  });

  fastify.post('/leaves/apply', async (request, reply) => {
    if (!request.user) return reply.status(401).send({ error: 'Unauthorized' });
    try {
      const record = await LeaveService.applyLeave(request.user, request.body as any);
      return reply.status(201).send(record);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.post('/leaves/requests/:id/action', async (request, reply) => {
    if (!request.user) return reply.status(401).send({ error: 'Unauthorized' });
    const { id } = request.params as { id: string };
    const { action, remarks } = request.body as { action: 'approve' | 'reject'; remarks?: string };
    try {
      const record = await LeaveService.approveOrRejectLeave(request.user, Number(id), action, remarks);
      return reply.send(record);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.get('/leaves/compoff', async (request, reply) => {
    if (!request.user) return reply.status(401).send({ error: 'Unauthorized' });
    const records = await CompOffService.getCompOffRequests(request.user);
    return reply.send(records);
  });

  fastify.post('/leaves/compoff/apply', async (request, reply) => {
    if (!request.user) return reply.status(401).send({ error: 'Unauthorized' });
    try {
      const record = await CompOffService.applyCompOff(request.user, request.body as any);
      return reply.status(201).send(record);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.post('/leaves/compoff/:id/action', async (request, reply) => {
    if (!request.user) return reply.status(401).send({ error: 'Unauthorized' });
    const { id } = request.params as { id: string };
    const { action } = request.body as { action: 'approve' | 'reject' };
    try {
      const record = await CompOffService.approveOrRejectCompOff(request.user, id, action);
      return reply.send(record);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.get('/leaves/holidays', async (request, reply) => {
    const year = Number((request.query as any)?.year) || 2026;
    const onlyPublished = (request.query as any)?.published === 'true';
    const holidays = await HolidayService.getHolidays(year, onlyPublished);
    return reply.send(holidays);
  });

  fastify.post('/leaves/holidays', async (request, reply) => {
    if (!request.user) return reply.status(401).send({ error: 'Unauthorized' });
    try {
      const holiday = await HolidayService.createHoliday(request.user.role, request.body as any);
      return reply.status(201).send(holiday);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.delete('/leaves/holidays/:id', async (request, reply) => {
    if (!request.user) return reply.status(401).send({ error: 'Unauthorized' });
    const { id } = request.params as { id: string };
    try {
      const res = await HolidayService.deleteHoliday(request.user.role, Number(id));
      return reply.send(res);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.post('/leaves/holidays/publish', async (request, reply) => {
    if (!request.user) return reply.status(401).send({ error: 'Unauthorized' });
    const year = Number((request.body as any)?.year) || 2026;
    try {
      const res = await HolidayService.publishYearlyCalendar(request.user.role, year);
      return reply.send(res);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.get('/leaves/attendance', async (request, reply) => {
    const monthYear = (request.query as any)?.monthYear || '2026-08';
    const data = await LeaveService.getAttendanceMatrix(monthYear);
    return reply.send(data);
  });

  fastify.get('/leaves/settings', async (request, reply) => {
    const year = Number((request.query as any)?.year) || 2026;
    const configs = await LeaveService.getLeaveConfigs(year);
    return reply.send(configs);
  });

  fastify.post('/leaves/settings', async (request, reply) => {
    if (!request.user) return reply.status(401).send({ error: 'Unauthorized' });
    try {
      const created = await LeaveService.createLeaveConfig(request.user.role, request.body as any);
      return reply.status(201).send(created);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.put('/leaves/settings/:id', async (request, reply) => {
    if (!request.user) return reply.status(401).send({ error: 'Unauthorized' });
    const { id } = request.params as { id: string };
    try {
      const updated = await LeaveService.updateLeaveConfig(request.user.role, Number(id), request.body as any);
      return reply.send(updated);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.delete('/leaves/settings/:id', async (request, reply) => {
    if (!request.user) return reply.status(401).send({ error: 'Unauthorized' });
    const { id } = request.params as { id: string };
    try {
      const res = await LeaveService.deleteLeaveConfig(request.user.role, Number(id));
      return reply.send(res);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });
};

export default leaveRoutes;
