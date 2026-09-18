"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HolidayService = void 0;
const prisma_1 = require("../lib/prisma");
class HolidayService {
    static async getHolidays(year = 2026, onlyPublished = false) {
        const where = { year };
        if (onlyPublished)
            where.isPublished = true;
        let items = await prisma_1.prisma.holiday.findMany({ where, orderBy: { date: 'asc' } });
        if (items.length === 0 && year === 2026) {
            await prisma_1.prisma.holiday.createMany({
                data: [
                    { date: '2026-10-19', name: 'Pooja Holiday 1', type: 'Optional', year: 2026, isPublished: true },
                    { date: '2026-10-20', name: 'Pooja Holiday 2', type: 'Optional', year: 2026, isPublished: true },
                    { date: '2026-12-25', name: 'Christmas', type: 'Mandatory', year: 2026, isPublished: true },
                ],
            });
            items = await prisma_1.prisma.holiday.findMany({ where, orderBy: { date: 'asc' } });
        }
        return items.map((h) => ({
            id: h.id, date: h.date, name: h.name, type: h.type,
            year: h.year, isPublished: h.isPublished,
        }));
    }
    static async createHoliday(role, data) {
        if (role !== 'Super Admin')
            throw new Error('Access Denied: Only Super Admins can configure the holiday calendar.');
        const dStr = data.date.trim();
        const existing = await prisma_1.prisma.holiday.findFirst({ where: { date: dStr } });
        if (existing)
            throw new Error(`A holiday on ${dStr} already exists (${existing.name}).`);
        const year = data.year || Number(dStr.slice(0, 4)) || 2026;
        const h = await prisma_1.prisma.holiday.create({
            data: {
                date: dStr, name: data.name.trim(), type: data.type || 'Mandatory',
                year, isPublished: true,
            },
        });
        return { id: h.id, date: h.date, name: h.name, type: h.type, year: h.year, isPublished: h.isPublished };
    }
    static async updateHoliday(role, id, data) {
        if (role !== 'Super Admin')
            throw new Error('Access Denied: Only Super Admins can update holidays.');
        const existing = await prisma_1.prisma.holiday.findUnique({ where: { id } });
        if (!existing)
            throw new Error(`Holiday with ID ${id} not found.`);
        const h = await prisma_1.prisma.holiday.update({
            where: { id },
            data: {
                ...(data.date && { date: data.date.trim(), year: Number(data.date.slice(0, 4)) || existing.year }),
                ...(data.name && { name: data.name.trim() }),
                ...(data.type && { type: data.type }),
                ...(data.isPublished !== undefined && { isPublished: data.isPublished }),
            },
        });
        return { id: h.id, date: h.date, name: h.name, type: h.type, year: h.year, isPublished: h.isPublished };
    }
    static async deleteHoliday(role, id) {
        if (role !== 'Super Admin')
            throw new Error('Access Denied: Only Super Admins can remove holidays.');
        await prisma_1.prisma.holiday.delete({ where: { id } });
        return { success: true };
    }
    static async publishYearlyCalendar(role, year) {
        if (role !== 'Super Admin')
            throw new Error('Access Denied: Only Super Admins can publish holiday calendars.');
        const result = await prisma_1.prisma.holiday.updateMany({ where: { year }, data: { isPublished: true } });
        return { success: true, count: result.count };
    }
}
exports.HolidayService = HolidayService;
