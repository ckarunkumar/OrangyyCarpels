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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const cookie_1 = __importDefault(require("@fastify/cookie"));
const dotenv = __importStar(require("dotenv"));
const timesheets_1 = __importDefault(require("./api/routes/timesheets"));
const registries_1 = __importDefault(require("./api/routes/registries"));
const auth_1 = __importDefault(require("./api/routes/auth"));
const billing_1 = __importDefault(require("./api/routes/billing"));
const notifications_1 = __importDefault(require("./api/routes/notifications"));
const businessLines_1 = require("./api/routes/businessLines");
const leaves_1 = __importDefault(require("./api/routes/leaves"));
const systemLogs_1 = __importDefault(require("./api/routes/systemLogs"));
const authService_1 = require("./services/authService");
const security_1 = require("./utils/security");
dotenv.config();
const isProduction = process.env.NODE_ENV === 'production';
const fastify = (0, fastify_1.default)({
    logger: isProduction
        ? { level: 'info' }
        : true,
    disableRequestLogging: isProduction,
});
const start = async () => {
    try {
        // 1. HTTP Security Headers Hook
        fastify.addHook('onRequest', async (request, reply) => {
            (0, security_1.applySecurityHeaders)(request, reply);
        });
        // 2. Production-hardened CORS with Whitelist
        await fastify.register(cors_1.default, {
            origin: (origin, cb) => {
                if ((0, security_1.isAllowedOrigin)(origin)) {
                    cb(null, true);
                }
                else {
                    cb(new Error(`CORS blocked for unauthorized origin: ${origin}`), false);
                }
            },
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
            allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With', 'Accept'],
        });
        // 3. Register cookie support with secret
        await fastify.register(cookie_1.default, {
            secret: process.env.COOKIE_SECRET || 'super-secret-cookie-decryption-key-minimum-32-chars-long',
        });
        // 4. Global Production Error Shielding
        fastify.setErrorHandler((error, request, reply) => {
            fastify.log.error(error);
            const statusCode = error.statusCode || 500;
            if (isProduction && statusCode === 500) {
                return reply.status(500).send({
                    error: 'An internal server error occurred. Please try again later.',
                });
            }
            return reply.status(statusCode).send({
                error: error.message || 'Request failed.',
            });
        });
        // 5. Global Authentication Session Hook
        fastify.addHook('preHandler', async (request, reply) => {
            const url = request.url.split('?')[0]; // strip query parameters
            // Allow health check and auth login routes without session
            if (url === '/api/health' || url === '/api/auth/login') {
                return;
            }
            const sessionId = request.cookies.sessionId;
            if (!sessionId) {
                return reply.status(401).send({ error: 'Unauthorized: No active session.' });
            }
            const session = await authService_1.AuthService.getSession(sessionId);
            if (!session) {
                return reply.status(401).send({ error: 'Unauthorized: Session expired or invalid.' });
            }
            // Attach resolved session context to request context
            request.user = session;
        });
        // Health check endpoint
        fastify.get('/api/health', async () => {
            return { status: 'OK', message: 'Orangyy Carpels Backend API is healthy' };
        });
        // Register timesheet, registry, billing, and auth API routes
        await fastify.register(auth_1.default, { prefix: '/api' });
        await fastify.register(timesheets_1.default, { prefix: '/api' });
        await fastify.register(registries_1.default, { prefix: '/api' });
        await fastify.register(billing_1.default, { prefix: '/api' });
        await fastify.register(notifications_1.default, { prefix: '/api' });
        await fastify.register(leaves_1.default, { prefix: '/api' });
        await fastify.register(systemLogs_1.default, { prefix: '/api' });
        await fastify.register(businessLines_1.businessLineRoutes);
        const port = Number(process.env.PORT) || 5001;
        const host = process.env.HOST || '0.0.0.0';
        await fastify.listen({ port, host });
        console.log(`Backend server listening on http://localhost:${port}`);
    }
    catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};
start();
