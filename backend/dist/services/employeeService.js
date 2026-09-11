"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeeService = void 0;
const prisma_1 = require("../lib/prisma");
const passwordUtils_1 = require("../utils/passwordUtils");
class EmployeeService {
    static async getEmployees(role) {
        if (role === 'Employee')
            throw new Error('Access Denied: Employees cannot view the full registry.');
        const [employees, allProjects] = await Promise.all([
            prisma_1.prisma.employee.findMany(),
            prisma_1.prisma.project.findMany({ select: { id: true, name: true, status: true, managerId: true, assignedEmployees: true } }),
        ]);
        const todayStr = new Date().toISOString().slice(0, 10);
        return employees.map((emp) => {
            const isRelieved = Boolean(emp.relievingDate && emp.relievingDate <= todayStr);
            const edu = Array.isArray(emp.education) ? emp.education : [];
            const exp = Array.isArray(emp.experience) ? emp.experience : [];
            const empIdLower = emp.employeeId.toLowerCase();
            const empNameLower = emp.fullName.toLowerCase();
            const assignedProjs = allProjects.filter((p) => {
                const pMgrLower = (p.managerId || '').toLowerCase().trim();
                const assignedList = (p.assignedEmployees || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
                return pMgrLower === empIdLower || pMgrLower === empNameLower || assignedList.includes(empIdLower) || assignedList.includes(empNameLower);
            });
            return {
                id: emp.employeeId, employeeId: emp.employeeId,
                fullName: emp.fullName, dob: emp.dob || '', designation: emp.designation,
                department: emp.department, email: emp.email, personalEmail: emp.personalEmail || '',
                phone: emp.phone, secondaryPhone: emp.secondaryPhone || '', permanentAddress: emp.permanentAddress || '',
                gender: emp.gender || 'Not Specified',
                guardianName: emp.guardianName || '', motherName: emp.motherName || '', bloodGroup: emp.bloodGroup || '',
                linkedInUrl: emp.linkedInUrl || '', aadhaarNumber: emp.aadhaarNumber || '', panNumber: emp.panNumber || '',
                costRate: role === 'Super Admin' ? emp.costRate : 'RESTRICTED', capacity: emp.capacity,
                joiningDate: emp.joiningDate || '', relievingDate: emp.relievingDate || '',
                status: isRelieved ? 'Inactive' : emp.status,
                role: emp.role, location: emp.location, avatar: emp.avatar,
                education: edu.map((e) => ({ degree: e.degree || '', school: e.school || '', year: e.year || '' })),
                experience: exp.map((e) => ({ company: e.company || '', role: e.role || '', period: e.period || '' })),
                assignedProjectsCount: assignedProjs.length,
                assignedProjects: assignedProjs.map((p) => ({ id: p.id, name: p.name, status: p.status })),
            };
        });
    }
    static async getNextEmployeeId() {
        const employees = await prisma_1.prisma.employee.findMany({ select: { employeeId: true } });
        let maxNum = 0;
        for (const emp of employees) {
            const match = emp.employeeId.match(/^ODE(\d+)$/i);
            if (match) {
                const num = parseInt(match[1], 10);
                if (num > maxNum)
                    maxNum = num;
            }
        }
        const nextNum = maxNum + 1;
        return `ODE${String(nextNum).padStart(4, '0')}`;
    }
    static async createEmployee(role, data) {
        if (role !== 'Super Admin')
            throw new Error('Access Denied: Only Super Admins can create employee profiles.');
        let targetEmpId = data.employeeId?.trim();
        if (!targetEmpId) {
            targetEmpId = await EmployeeService.getNextEmployeeId();
        }
        const cleanEmail = data.email.trim().toLowerCase();
        if (await prisma_1.prisma.employee.findUnique({ where: { employeeId: targetEmpId } })) {
            throw new Error(`Emp ID "${targetEmpId}" already exists. Please enter a unique Emp ID.`);
        }
        if (await prisma_1.prisma.employee.findUnique({ where: { email: cleanEmail } })) {
            throw new Error(`Email address "${cleanEmail}" is already registered to another employee.`);
        }
        let finalHashedPassword = '';
        if (data.password && data.password.trim()) {
            const policy = (0, passwordUtils_1.validatePasswordPolicy)(data.password);
            if (!policy.isValid)
                throw new Error(policy.error);
            finalHashedPassword = (0, passwordUtils_1.hashPassword)(data.password.trim());
        }
        else {
            finalHashedPassword = (0, passwordUtils_1.hashPassword)((0, passwordUtils_1.generateDefaultPassword)());
        }
        const todayStr = new Date().toISOString().slice(0, 10);
        const relievingDate = data.relievingDate?.trim() || '';
        const isRelieved = Boolean(relievingDate && relievingDate <= todayStr);
        const emp = await prisma_1.prisma.employee.create({
            data: {
                employeeId: targetEmpId, fullName: data.fullName.trim(), dob: data.dob?.trim() || '',
                designation: data.designation?.trim() || 'Team Member', department: data.department?.trim() || 'General',
                email: cleanEmail, password: finalHashedPassword, personalEmail: data.personalEmail?.trim() || '', phone: data.phone.trim(),
                secondaryPhone: data.secondaryPhone?.trim() || '', permanentAddress: data.permanentAddress?.trim() || '',
                gender: data.gender || 'Not Specified',
                guardianName: data.guardianName?.trim() || '', motherName: data.motherName?.trim() || '',
                bloodGroup: data.bloodGroup?.trim() || '', linkedInUrl: data.linkedInUrl?.trim() || '',
                aadhaarNumber: data.aadhaarNumber?.trim() || '', panNumber: data.panNumber?.trim() || '',
                costRate: data.costRate || '₹0/hr', capacity: data.capacity || '40 hrs/week',
                joiningDate: data.joiningDate?.trim() || '', relievingDate,
                status: isRelieved ? 'Inactive' : (data.status || 'Active'), role: data.role || 'Employee',
                location: data.location || 'Remote', avatar: data.avatar || null,
                education: data.education || [],
                experience: data.experience || [],
            },
        });
        const edu = Array.isArray(emp.education) ? emp.education : [];
        const exp = Array.isArray(emp.experience) ? emp.experience : [];
        return {
            ...emp, id: emp.employeeId, dob: emp.dob || '', personalEmail: emp.personalEmail || '', secondaryPhone: emp.secondaryPhone || '',
            permanentAddress: emp.permanentAddress || '', gender: emp.gender || 'Not Specified',
            guardianName: emp.guardianName || '', motherName: emp.motherName || '',
            bloodGroup: emp.bloodGroup || '', linkedInUrl: emp.linkedInUrl || '', aadhaarNumber: emp.aadhaarNumber || '',
            panNumber: emp.panNumber || '', joiningDate: emp.joiningDate || '', relievingDate: emp.relievingDate || '',
            status: emp.status, role: emp.role,
            education: edu.map((e) => ({ degree: e.degree || '', school: e.school || '', year: e.year || '' })),
            experience: exp.map((e) => ({ company: e.company || '', role: e.role || '', period: e.period || '' })),
        };
    }
    static async updateEmployee(role, employeeId, data) {
        if (role !== 'Super Admin')
            throw new Error('Access Denied: Only Super Admins can update employee profiles.');
        const existing = await prisma_1.prisma.employee.findUnique({ where: { employeeId } });
        if (!existing)
            throw new Error(`Employee with ID ${employeeId} not found.`);
        if (data.email && data.email.trim().toLowerCase() !== existing.email) {
            const dup = await prisma_1.prisma.employee.findUnique({ where: { email: data.email.trim().toLowerCase() } });
            if (dup && dup.employeeId !== employeeId)
                throw new Error(`Email "${data.email}" is already registered to another employee.`);
        }
        let passwordUpdate = undefined;
        if (data.password && data.password.trim()) {
            const policy = (0, passwordUtils_1.validatePasswordPolicy)(data.password);
            if (!policy.isValid)
                throw new Error(policy.error);
            passwordUpdate = (0, passwordUtils_1.hashPassword)(data.password.trim());
        }
        const todayStr = new Date().toISOString().slice(0, 10);
        const targetRelieving = data.relievingDate !== undefined ? data.relievingDate?.trim() || '' : (existing.relievingDate || '');
        const isRelieved = Boolean(targetRelieving && targetRelieving <= todayStr);
        let targetStatus = data.status !== undefined ? data.status : existing.status;
        if (isRelieved)
            targetStatus = 'Inactive';
        const updated = await prisma_1.prisma.employee.update({
            where: { employeeId },
            data: {
                ...(data.fullName && { fullName: data.fullName.trim() }),
                ...(data.dob !== undefined && { dob: data.dob.trim() }),
                ...(data.designation && { designation: data.designation.trim() }),
                ...(data.department && { department: data.department.trim() }),
                ...(data.email && { email: data.email.trim().toLowerCase() }),
                ...(passwordUpdate && { password: passwordUpdate }),
                ...(data.personalEmail !== undefined && { personalEmail: data.personalEmail.trim() }),
                ...(data.phone && { phone: data.phone.trim() }),
                ...(data.secondaryPhone !== undefined && { secondaryPhone: data.secondaryPhone.trim() }),
                ...(data.permanentAddress !== undefined && { permanentAddress: data.permanentAddress.trim() }),
                ...(data.gender !== undefined && { gender: data.gender }),
                ...(data.guardianName !== undefined && { guardianName: data.guardianName.trim() }),
                ...(data.motherName !== undefined && { motherName: data.motherName.trim() }),
                ...(data.bloodGroup !== undefined && { bloodGroup: data.bloodGroup.trim() }),
                ...(data.linkedInUrl !== undefined && { linkedInUrl: data.linkedInUrl.trim() }),
                ...(data.aadhaarNumber !== undefined && { aadhaarNumber: data.aadhaarNumber.trim() }),
                ...(data.panNumber !== undefined && { panNumber: data.panNumber.trim() }),
                ...(data.costRate !== undefined && { costRate: data.costRate }),
                ...(data.capacity && { capacity: data.capacity }),
                ...(data.joiningDate !== undefined && { joiningDate: data.joiningDate.trim() }),
                ...(data.relievingDate !== undefined && { relievingDate: targetRelieving }),
                status: targetStatus,
                ...(data.role && { role: data.role }),
                ...(data.location && { location: data.location }),
                ...(data.avatar !== undefined && { avatar: data.avatar }),
                ...(data.education !== undefined && { education: data.education }),
                ...(data.experience !== undefined && { experience: data.experience }),
            },
        });
        const edu = Array.isArray(updated.education) ? updated.education : [];
        const exp = Array.isArray(updated.experience) ? updated.experience : [];
        return {
            ...updated, id: updated.employeeId, dob: updated.dob || '', personalEmail: updated.personalEmail || '', secondaryPhone: updated.secondaryPhone || '',
            permanentAddress: updated.permanentAddress || '', gender: updated.gender || 'Not Specified',
            guardianName: updated.guardianName || '', motherName: updated.motherName || '',
            bloodGroup: updated.bloodGroup || '', linkedInUrl: updated.linkedInUrl || '', aadhaarNumber: updated.aadhaarNumber || '',
            panNumber: updated.panNumber || '', joiningDate: updated.joiningDate || '', relievingDate: updated.relievingDate || '',
            status: updated.status, role: updated.role,
            education: edu.map((e) => ({ degree: e.degree || '', school: e.school || '', year: e.year || '' })),
            experience: exp.map((e) => ({ company: e.company || '', role: e.role || '', period: e.period || '' })),
        };
    }
}
exports.EmployeeService = EmployeeService;
