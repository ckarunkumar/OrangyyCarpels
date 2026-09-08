"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompOffService = void 0;
const prisma_1 = require("../lib/prisma");
class CompOffService {
    static async applyCompOff(user, data) {
        if (!data.workedDate || !data.hoursWorked || !data.reason.trim()) {
            throw new Error('Worked date, hours worked, and reason are required.');
        }
        const employee = await prisma_1.prisma.employee.findUnique({
            where: { employeeId: user.employeeId },
        });
        if (!employee)
            throw new Error(`Employee ${user.employeeId} not found.`);
        const targetStatus = user.role === 'Project Manager' ? 'Pending_SA' : 'Pending_PM';
        const existingList = Array.isArray(employee.compOffRequests)
            ? employee.compOffRequests
            : [];
        const newClaim = {
            id: Date.now(),
            employeeId: user.employeeId,
            employeeName: user.fullName || employee.fullName,
            workedDate: data.workedDate.trim(),
            hoursWorked: Number(data.hoursWorked) || 8,
            daysCredit: data.daysCredit || (Number(data.hoursWorked) >= 7 ? 1.0 : 0.5),
            reason: data.reason.trim(),
            status: targetStatus,
            pmApproval: user.role === 'Project Manager' ? 'Approved' : 'Pending',
            saApproval: 'Pending',
            createdAt: new Date().toISOString(),
        };
        const updatedList = [newClaim, ...existingList];
        await prisma_1.prisma.employee.update({
            where: { employeeId: user.employeeId },
            data: { compOffRequests: updatedList },
        });
        return newClaim;
    }
    static async getCompOffRequests(user) {
        if (user.role === 'Employee') {
            const employee = await prisma_1.prisma.employee.findUnique({
                where: { employeeId: user.employeeId },
                select: { compOffRequests: true, employeeId: true, fullName: true },
            });
            if (!employee || !Array.isArray(employee.compOffRequests))
                return [];
            return employee.compOffRequests.map((r) => ({
                ...r,
                employeeName: r.employeeName || employee.fullName,
            }));
        }
        // PM or Super Admin sees all requests across all employees
        const employees = await prisma_1.prisma.employee.findMany({
            select: { employeeId: true, fullName: true, compOffRequests: true },
        });
        const allClaims = [];
        for (const emp of employees) {
            if (Array.isArray(emp.compOffRequests)) {
                const claims = emp.compOffRequests.map((r) => ({
                    ...r,
                    employeeName: r.employeeName || emp.fullName,
                    employeeId: r.employeeId || emp.employeeId,
                }));
                allClaims.push(...claims);
            }
        }
        return allClaims.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    static async approveOrRejectCompOff(user, id, action) {
        if (user.role !== 'Project Manager' && user.role !== 'Super Admin') {
            throw new Error('Access Denied: Only PMs and Super Admins can review comp-off claims.');
        }
        // Find the employee holding this claim
        const employees = await prisma_1.prisma.employee.findMany({
            select: { employeeId: true, compOffRequests: true },
        });
        let targetEmployee = null;
        let targetIndex = -1;
        let targetClaim = null;
        for (const emp of employees) {
            if (Array.isArray(emp.compOffRequests)) {
                const list = emp.compOffRequests;
                const idx = list.findIndex((c) => String(c.id) === String(id));
                if (idx !== -1) {
                    targetEmployee = emp;
                    targetIndex = idx;
                    targetClaim = { ...list[idx] };
                    break;
                }
            }
        }
        if (!targetEmployee || !targetClaim) {
            throw new Error(`Comp-off request with ID ${id} not found.`);
        }
        const currentList = [...targetEmployee.compOffRequests];
        if (action === 'reject') {
            targetClaim.status = 'Rejected';
            if (user.role === 'Project Manager')
                targetClaim.pmApproval = 'Rejected';
            if (user.role === 'Super Admin')
                targetClaim.saApproval = 'Rejected';
            currentList[targetIndex] = targetClaim;
            await prisma_1.prisma.employee.update({
                where: { employeeId: targetEmployee.employeeId },
                data: { compOffRequests: currentList },
            });
            return targetClaim;
        }
        // Action is 'approve'
        let nextStatus = targetClaim.status;
        let pmStatus = targetClaim.pmApproval || 'Pending';
        let saStatus = targetClaim.saApproval || 'Pending';
        if (user.role === 'Project Manager') {
            pmStatus = 'Approved';
            nextStatus = 'Pending_SA';
        }
        else if (user.role === 'Super Admin') {
            saStatus = 'Approved';
            pmStatus = 'Approved';
            nextStatus = 'Approved';
        }
        targetClaim.status = nextStatus;
        targetClaim.pmApproval = pmStatus;
        targetClaim.saApproval = saStatus;
        currentList[targetIndex] = targetClaim;
        const updateData = { compOffRequests: currentList };
        if (nextStatus === 'Approved') {
            updateData.compOffBalance = { increment: targetClaim.daysCredit || 1.0 };
        }
        await prisma_1.prisma.employee.update({
            where: { employeeId: targetEmployee.employeeId },
            data: updateData,
        });
        return targetClaim;
    }
}
exports.CompOffService = CompOffService;
