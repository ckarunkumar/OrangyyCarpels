"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const systemLogService_1 = require("../../services/systemLogService");
const getLoginLogsSchema = {
    querystring: {
        type: 'object',
        properties: {
            page: { type: 'integer', minimum: 1, default: 1 },
            limit: { type: 'integer', minimum: 1, maximum: 200, default: 50 },
            search: { type: 'string' },
        },
    },
    response: {
        200: {
            type: 'object',
            properties: {
                logs: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'integer' },
                            employeeId: { type: 'string' },
                            fullName: { type: 'string' },
                            email: { type: 'string' },
                            role: { type: 'string' },
                            ipAddress: { type: 'string' },
                            city: { type: ['string', 'null'] },
                            region: { type: ['string', 'null'] },
                            country: { type: ['string', 'null'] },
                            latitude: { type: ['number', 'null'] },
                            longitude: { type: ['number', 'null'] },
                            os: { type: 'string' },
                            browser: { type: 'string' },
                            deviceType: { type: 'string' },
                            networkInfo: { type: ['string', 'null'] },
                            userAgent: { type: 'string' },
                            loginAt: { type: 'string', format: 'date-time' },
                        },
                    },
                },
                total: { type: 'integer' },
                page: { type: 'integer' },
                limit: { type: 'integer' },
                totalPages: { type: 'integer' },
            },
        },
    },
};
const systemLogRoutes = async (fastify) => {
    // GET /api/logs/logins - Retrieve system login logs (Super Admin Only)
    fastify.get('/logs/logins', { schema: getLoginLogsSchema }, async (request, reply) => {
        if (!request.user || request.user.role !== 'Super Admin') {
            return reply.status(403).send({
                error: 'Forbidden: Only Super Admin can access system login activity logs.',
            });
        }
        const query = request.query;
        const result = await systemLogService_1.SystemLogService.getLoginLogs(query);
        return result;
    });
};
exports.default = systemLogRoutes;
