"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaveService = void 0;
const prisma_1 = require("../lib/prisma");
class LeaveService {
    static async getBalance(employeeId, year = 2026) {
        const emp = await prisma_1.prisma.employee.findUnique({ where: { employeeId } });
        const casualQuota = emp?.casualQuota ?? 12;
        const casualUsed = emp?.casualUsed ?? 0;
        const sickQuota = emp?.sickQuota ?? 12;
        const sickUsed = emp?.sickUsed ?? 0;
        const earnedQuota = emp?.earnedQuota ?? 15;
        const earnedUsed = emp?.earnedUsed ?? 0;
        const compOffBalance = emp?.compOffBalance ?? 0;
        const optionalHolidaysQuota = emp?.optionalHolidaysQuota ?? 2;
        const optionalHolidaysUsed = emp?.optionalHolidaysUsed ?? 0;
        const wfhMonthlyLimit = emp?.wfhMonthlyLimit ?? 2;
        const wfhUsedThisMonth = emp?.wfhUsedThisMonth ?? 0;
        return {
            employeeId: emp?.employeeId || employeeId, year: emp?.leaveYear || year,
            casualQuota, casualUsed, casualRemaining: Math.max(0, casualQuota - casualUsed),
            sickQuota, sickUsed, sickRemaining: Math.max(0, sickQuota - sickUsed),
            earnedQuota, earnedUsed, earnedRemaining: Math.max(0, earnedQuota - earnedUsed),
            compOffBalance, optionalHolidaysQuota, optionalHolidaysUsed,
            optionalHolidaysRemaining: Math.max(0, optionalHolidaysQuota - optionalHolidaysUsed),
            wfhMonthlyLimit, wfhUsedThisMonth, wfhRemainingThisMonth: Math.max(0, wfhMonthlyLimit - wfhUsedThisMonth),
        };
    }
    static async applyLeave(user, data) {
        const empId = user.employeeId;
        const year = Number(data.startDate.slice(0, 4)) || 2026;
        const balance = await this.getBalance(empId, year);
        const isHalfDay = !!data.isHalfDay;
        const daysCount = isHalfDay ? 0.5 : 1.0;
        if (data.leaveType === 'Optional Holiday' && balance.optionalHolidaysRemaining < 1)
            throw new Error(`You have exhausted your annual Optional Holiday quota.`);
        if (data.leaveType === 'Work From Home' && balance.wfhRemainingThisMonth < 1)
            throw new Error(`You have reached your monthly WFH limit (${balance.wfhMonthlyLimit} days/month).`);
        if (data.leaveType === 'Comp-off' && balance.compOffBalance < daysCount)
            throw new Error(`Insufficient Comp-off balance (${balance.compOffBalance} days available).`);
        const targetStatus = user.role === 'Project Manager' ? 'Pending_SA' : 'Pending_PM';
        return prisma_1.prisma.leaveRequest.create({
            data: {
                employeeId: empId, employeeName: user.fullName, leaveType: data.leaveType,
                startDate: data.startDate, endDate: isHalfDay ? data.startDate : data.endDate,
                isHalfDay, halfDaySession: isHalfDay ? data.halfDaySession || 'First Half' : null,
                daysCount, reason: data.reason.trim(), status: targetStatus,
                pmApproval: user.role === 'Project Manager' ? 'Approved' : 'Pending', saApproval: 'Pending',
            },
        });
    }
    static async getLeaveRequests(user, scope = 'mine') {
        const where = scope === 'mine' ? { employeeId: user.employeeId } : user.role === 'Employee' ? { id: -1 } : { employeeId: { not: user.employeeId } };
        return prisma_1.prisma.leaveRequest.findMany({ where, orderBy: { appliedAt: 'desc' } });
    }
    static async updateLeave(user, id, data) {
        const existing = await prisma_1.prisma.leaveRequest.findUnique({ where: { id } });
        if (!existing)
            throw new Error('Leave request not found');
        if (user.role === 'Employee' && existing.employeeId.toLowerCase() !== user.employeeId.toLowerCase())
            throw new Error('Unauthorized');
        const isHalfDay = !!data.isHalfDay;
        const daysCount = isHalfDay ? 0.5 : 1.0;
        const targetStatus = user.role === 'Project Manager' ? 'Pending_SA' : 'Pending_PM';
        // If it was Approved, revert previous balance before putting it back into Pending
        if (existing.status === 'Approved')
            await this.adjustQuota(existing.employeeId, existing.leaveType, existing.daysCount, 'decrement');
        return prisma_1.prisma.leaveRequest.update({
            where: { id },
            data: {
                leaveType: data.leaveType, startDate: data.startDate, endDate: isHalfDay ? data.startDate : data.endDate,
                isHalfDay, halfDaySession: isHalfDay ? data.halfDaySession || 'First Half' : null,
                daysCount, reason: (data.reason || '').trim(), status: targetStatus,
                pmApproval: user.role === 'Project Manager' ? 'Approved' : 'Pending', saApproval: 'Pending', rejectionReason: null,
            },
        });
    }
    static async cancelLeave(user, id) {
        const existing = await prisma_1.prisma.leaveRequest.findUnique({ where: { id } });
        if (!existing)
            throw new Error('Leave request not found');
        if (user.role === 'Employee' && existing.employeeId.toLowerCase() !== user.employeeId.toLowerCase())
            throw new Error('Unauthorized');
        if (existing.status === 'Approved')
            await this.adjustQuota(existing.employeeId, existing.leaveType, existing.daysCount, 'decrement');
        return prisma_1.prisma.leaveRequest.update({ where: { id }, data: { status: 'Cancelled' } });
    }
    static async deleteLeave(user, id) {
        const existing = await prisma_1.prisma.leaveRequest.findUnique({ where: { id } });
        if (!existing)
            throw new Error('Leave request not found');
        if (user.role === 'Employee' && existing.employeeId.toLowerCase() !== user.employeeId.toLowerCase())
            throw new Error('Unauthorized');
        if (existing.status === 'Approved')
            await this.adjustQuota(existing.employeeId, existing.leaveType, existing.daysCount, 'decrement');
        return prisma_1.prisma.leaveRequest.delete({ where: { id } });
    }
    static async approveOrRejectLeave(user, id, action, remarks) {
        if (user.role !== 'Project Manager' && user.role !== 'Super Admin')
            throw new Error('Unauthorized');
        const existing = await prisma_1.prisma.leaveRequest.findUnique({ where: { id } });
        if (!existing)
            throw new Error('Leave request not found');
        if (action === 'reject') {
            if (existing.status === 'Approved')
                await this.adjustQuota(existing.employeeId, existing.leaveType, existing.daysCount, 'decrement');
            return prisma_1.prisma.leaveRequest.update({
                where: { id },
                data: {
                    status: 'Declined', rejectionReason: remarks || 'Declined',
                    pmApproval: user.role === 'Project Manager' ? 'Rejected' : existing.pmApproval,
                    saApproval: user.role === 'Super Admin' ? 'Rejected' : existing.saApproval,
                },
            });
        }
        // Approve action: if not already approved, deduct quota
        if (existing.status !== 'Approved')
            await this.adjustQuota(existing.employeeId, existing.leaveType, existing.daysCount, 'increment');
        return prisma_1.prisma.leaveRequest.update({
            where: { id },
            data: { status: 'Approved', pmApproval: 'Approved', saApproval: user.role === 'Super Admin' ? 'Approved' : existing.saApproval, approverName: user.fullName, rejectionReason: null },
        });
    }
    static async adjustQuota(employeeId, leaveType, daysCount, mode) {
        const change = mode === 'increment' ? daysCount : -daysCount;
        if (leaveType === 'Casual Leave')
            await prisma_1.prisma.employee.update({ where: { employeeId }, data: { casualUsed: { increment: change } } });
        else if (leaveType === 'Sick Leave')
            await prisma_1.prisma.employee.update({ where: { employeeId }, data: { sickUsed: { increment: change } } });
        else if (leaveType === 'Earned Leave')
            await prisma_1.prisma.employee.update({ where: { employeeId }, data: { earnedUsed: { increment: change } } });
        else if (leaveType === 'Comp-off')
            await prisma_1.prisma.employee.update({ where: { employeeId }, data: { compOffBalance: { decrement: change } } });
        else if (leaveType === 'Optional Holiday')
            await prisma_1.prisma.employee.update({ where: { employeeId }, data: { optionalHolidaysUsed: { increment: mode === 'increment' ? 1 : -1 } } });
        else if (leaveType === 'Work From Home')
            await prisma_1.prisma.employee.update({ where: { employeeId }, data: { wfhUsedThisMonth: { increment: mode === 'increment' ? 1 : -1 } } });
    }
    static async getAttendanceMatrix(monthYear = '2026-08') {
        const [employees, approvedLeaves, holidays] = await Promise.all([
            prisma_1.prisma.employee.findMany({ select: { employeeId: true, fullName: true, designation: true, role: true, department: true } }),
            prisma_1.prisma.leaveRequest.findMany({ where: { status: 'Approved', startDate: { startsWith: monthYear } } }),
            prisma_1.prisma.holiday.findMany({ where: { isPublished: true, date: { startsWith: monthYear } } }),
        ]);
        return { monthYear, employees, approvedLeaves, holidays };
    }
    static async getLeaveConfigs(year = 2026) {
        let configs = await prisma_1.prisma.leaveTypeConfig.findMany({ where: { year } });
        if (configs.length === 0) {
            await prisma_1.prisma.leaveTypeConfig.createMany({
                data: [
                    { code: 'CL', name: 'Casual Leave', annualQuota: 12, monthlyAccrual: 1.0, year },
                    { code: 'SL', name: 'Sick Leave', annualQuota: 12, monthlyAccrual: 1.0, year },
                    { code: 'EL', name: 'Earned Leave', annualQuota: 15, monthlyAccrual: 1.25, year },
                    { code: 'WFH', name: 'Work From Home', annualQuota: 24, monthlyAccrual: 2.0, year },
                    { code: 'OH', name: 'Optional Holiday', annualQuota: 2, monthlyAccrual: 0, year },
                ],
            });
            configs = await prisma_1.prisma.leaveTypeConfig.findMany({ where: { year } });
        }
        return configs;
    }
    static async createLeaveConfig(role, data) {
        if (role !== 'Super Admin')
            throw new Error('Access Denied: Only Super Admins can add leave types.');
        const year = data.year || 2026;
        const name = data.name.trim();
        const code = (data.code?.trim() || name.slice(0, 3)).toUpperCase();
        const existing = await prisma_1.prisma.leaveTypeConfig.findFirst({ where: { year, OR: [{ code }, { name }] } });
        if (existing)
            throw new Error(`Leave type "${name}" or code "${code}" already exists for ${year}.`);
        return prisma_1.prisma.leaveTypeConfig.create({
            data: { name, code, monthlyAccrual: Number(data.monthlyAccrual) || 1.0, annualQuota: Number(data.annualQuota) || 12, allowHalfDay: data.allowHalfDay ?? true, maxCarryForward: Number(data.maxCarryForward) || 0, year },
        });
    }
    static async updateLeaveConfig(role, id, data) {
        if (role !== 'Super Admin')
            throw new Error('Access Denied');
        return prisma_1.prisma.leaveTypeConfig.update({ where: { id }, data });
    }
    static async deleteLeaveConfig(role, id) {
        if (role !== 'Super Admin')
            throw new Error('Access Denied: Only Super Admins can delete leave types.');
        await prisma_1.prisma.leaveTypeConfig.delete({ where: { id } });
        return { success: true };
    }
}
exports.LeaveService = LeaveService;
