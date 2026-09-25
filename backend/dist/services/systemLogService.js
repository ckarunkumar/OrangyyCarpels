"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemLogService = void 0;
const prisma_1 = require("../lib/prisma");
const notificationService_1 = require("./notificationService");
class SystemLogService {
    static extractClientIp(headers, socketIp) {
        const xForwardedFor = headers['x-forwarded-for'];
        if (xForwardedFor) {
            const rawIp = Array.isArray(xForwardedFor) ? xForwardedFor[0] : xForwardedFor;
            const firstIp = rawIp.split(',')[0].trim();
            if (firstIp)
                return firstIp;
        }
        const xRealIp = headers['x-real-ip'];
        if (xRealIp)
            return Array.isArray(xRealIp) ? xRealIp[0].trim() : xRealIp.trim();
        const fallback = socketIp || '127.0.0.1';
        return fallback === '::1' || fallback === '::ffff:127.0.0.1' ? '127.0.0.1' : fallback;
    }
    static parseUserAgent(ua) {
        if (!ua || typeof ua !== 'string') {
            return { os: 'Unknown OS', browser: 'Unknown Browser', deviceType: 'Desktop / Web' };
        }
        let deviceType = 'Desktop / Web';
        if (/tablet|ipad|playbook|silk/i.test(ua)) {
            deviceType = 'Tablet';
        }
        else if (/mobile|iphone|ipod|android.*mobile|blackberry|iemobile/i.test(ua)) {
            deviceType = 'Mobile';
        }
        let os = 'Unknown OS';
        if (/iPad|iPhone|iPod/i.test(ua))
            os = 'iOS';
        else if (/Android/i.test(ua))
            os = 'Android';
        else if (/Macintosh|Mac OS X/i.test(ua))
            os = 'macOS';
        else if (/Windows NT/i.test(ua))
            os = 'Windows';
        else if (/CrOS/i.test(ua))
            os = 'ChromeOS';
        else if (/Linux|X11/i.test(ua))
            os = 'Linux';
        let browser = 'Unknown Browser';
        if (/Edg\//i.test(ua))
            browser = 'Edge';
        else if (/OPR\/|Opera/i.test(ua))
            browser = 'Opera';
        else if (/Chrome\/|CriOS\//i.test(ua))
            browser = 'Chrome';
        else if (/Firefox\/|FxiOS\//i.test(ua))
            browser = 'Firefox';
        else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua))
            browser = 'Safari';
        else if (/curl\/|PostmanRuntime|node-fetch|undici/i.test(ua))
            browser = 'API Client';
        return { os, browser, deviceType };
    }
    static async lookupIpLocation(ip) {
        const isPrivate = !ip || ip === '127.0.0.1' || ip === 'localhost' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.16.');
        if (isPrivate) {
            return { city: 'Localhost', region: '', country: 'Local Network', latitude: null, longitude: null, networkInfo: 'Loopback / Private LAN' };
        }
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1800);
            const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,regionName,city,lat,lon,isp,org`, { signal: controller.signal });
            clearTimeout(timeoutId);
            if (res.ok) {
                const data = (await res.json());
                if (data && data.status === 'success') {
                    return {
                        city: data.city || '',
                        region: data.regionName || '',
                        country: data.country || '',
                        latitude: typeof data.lat === 'number' ? data.lat : null,
                        longitude: typeof data.lon === 'number' ? data.lon : null,
                        networkInfo: data.isp || data.org || '',
                    };
                }
            }
        }
        catch {
            // Non-blocking fallback
        }
        return { city: '', region: '', country: '', latitude: null, longitude: null, networkInfo: '' };
    }
    static async recordLogin(input) {
        try {
            const { os, browser, deviceType } = this.parseUserAgent(input.userAgent);
            const geo = await this.lookupIpLocation(input.ipAddress);
            await prisma_1.prisma.loginLog.create({
                data: {
                    employeeId: input.employeeId || '',
                    fullName: input.fullName,
                    email: input.email.toLowerCase().trim(),
                    role: input.role || 'Employee',
                    ipAddress: input.ipAddress || '127.0.0.1',
                    city: geo.city,
                    region: geo.region,
                    country: geo.country,
                    latitude: geo.latitude,
                    longitude: geo.longitude,
                    os,
                    browser,
                    deviceType,
                    networkInfo: geo.networkInfo,
                    userAgent: input.userAgent || '',
                },
            });
            const loc = [geo.city, geo.country].filter((s) => s && s !== 'Localhost' && s !== 'Local Network').join(', ');
            const now = new Date();
            const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
            const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const meta = [dateStr, timeStr, loc].filter(Boolean).join(' · ');
            await notificationService_1.NotificationService.createNotification({
                role: 'Super Admin',
                title: 'User Login Activity',
                message: `${input.fullName} logged in. ${meta}`,
                type: 'login_activity',
            });
        }
        catch (error) {
            console.error('Failed to record system login log:', error);
        }
    }
    static async getLoginLogs(query = {}) {
        const page = Math.max(1, Number(query.page) || 1);
        const limit = Math.min(200, Math.max(10, Number(query.limit) || 50));
        const skip = (page - 1) * limit;
        const search = (query.search || '').trim().toLowerCase();
        const whereClause = search
            ? {
                OR: [
                    { fullName: { contains: search } },
                    { email: { contains: search } },
                    { ipAddress: { contains: search } },
                    { city: { contains: search } },
                    { country: { contains: search } },
                    { role: { contains: search } },
                    { os: { contains: search } },
                    { browser: { contains: search } },
                    { deviceType: { contains: search } },
                ],
            }
            : {};
        const [logs, total] = await Promise.all([
            prisma_1.prisma.loginLog.findMany({
                where: whereClause,
                orderBy: { loginAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma_1.prisma.loginLog.count({ where: whereClause }),
        ]);
        return { logs, total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
    }
}
exports.SystemLogService = SystemLogService;
