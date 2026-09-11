import { prisma } from '../lib/prisma';
import { NotificationService } from './notificationService';

export interface TimesheetRow { id: number; client: string; project: string; task: string; hours: number[]; billable: boolean; }
export interface WeeklyTimesheet { weekStart: string; status: 'Draft' | 'Submitted' | 'PM_Approved' | 'Approved' | 'Locked'; rows: TimesheetRow[]; isMonthClosed?: boolean; }
export interface ProjectTimesheetItem {
  id: string; client: string; projectName: string; billingType: string; timeLogged: number;
  budgetHours: number; percentage: number; status: string; myStatus?: string;
  submittedCount?: number; totalAssigned?: number;
}
export interface DailyLogEntry {
  id?: number; sno: string; date: string; dayLabel: string; description: string; task: string;
  hours: number; isBillable?: boolean; isWeekend?: boolean; resourceName?: string;
  employeeId?: string; isOwner?: boolean; isReadOnly?: boolean; status?: string;
}

function hasProjectAccess(proj: { assignedEmployees?: string | null; managerId?: string | null }, code?: string, name?: string, role: string = 'Employee'): boolean {
  if (role === 'Super Admin') return true;
  const cLower = (code || '').toLowerCase().trim();
  const nLower = (name || '').toLowerCase().trim();
  if (!cLower && !nLower) return false;
  const mgr = (proj.managerId || '').toLowerCase().trim();
  if (mgr && (mgr === cLower || mgr === nLower)) return true;
  const assigned = (proj.assignedEmployees || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  return Boolean((cLower && assigned.includes(cLower)) || (nLower && assigned.includes(nLower)));
}

export class TimesheetService {
  static isMonthClosed(weekStart: string): boolean {
    const s = new Date(weekStart); const n = new Date();
    return (s.getFullYear() * 12 + s.getMonth()) < (n.getFullYear() * 12 + n.getMonth());
  }

  static async getEmployeeProjectsSummary(month: string = '2026-08', employeeId?: string, role: string = 'Employee'): Promise<ProjectTimesheetItem[]> {
    const [projects, employees] = await Promise.all([
      prisma.project.findMany({ where: { status: 'Active' }, include: { client: true, dailyEntries: { where: { date: { startsWith: month } } } } }),
      prisma.employee.findMany(),
    ]);
    const empById = new Map<string, any>();
    employees.forEach((e) => { empById.set(e.employeeId.toLowerCase(), e); empById.set(e.fullName.toLowerCase(), e); });
    const curEmp = employeeId ? empById.get(employeeId.toLowerCase()) : null;
    const curCode = curEmp?.employeeId.toLowerCase() || (employeeId ? employeeId.toLowerCase() : '');
    const curName = curEmp?.fullName.toLowerCase() || '';

    const visibleProjects = projects.filter((p) => hasProjectAccess(p, curCode, curName, role));

    return visibleProjects.map((p) => {
      const isHourly = p.billingType === 'T&M' || p.billingType === 'Hourly Rate (T&M)';
      const monthLogged = p.dailyEntries?.reduce((acc, d) => acc + d.hours, 0) || 0;
      const budget = p.budgetHours || 100;
      const percentage = isHourly ? Math.min(100, Math.round((monthLogged / budget) * 100)) : 0;
      const rawAssigned = (p.assignedEmployees || '').split(',').map((s) => s.trim()).filter(Boolean);
      const assignedList = rawAssigned.length > 0 ? rawAssigned.map((a) => (empById.get(a.toLowerCase())?.employeeId || a).toLowerCase()) : [];
      const submittedSet = new Set<string>();

      (p.dailyEntries || []).forEach((d) => {
        const did = (d.employeeId || '').toLowerCase();
        const dEmp = empById.get(did);
        const resolvedId = dEmp?.employeeId.toLowerCase() || did;
        if (resolvedId && (d.status === 'Submitted' || d.status === 'PM_Approved' || d.status === 'Approved')) {
          submittedSet.add(resolvedId);
        }
      });

      const totalAssigned = Math.max(assignedList.length, 1);
      const submittedCount = submittedSet.size;
      let status = 'Draft';
      if (p.dailyEntries?.some((d) => d.status === 'Approved')) status = 'Approved';
      else if (p.dailyEntries?.some((d) => d.status === 'PM_Approved')) status = 'PM_Approved';
      else if (assignedList.length > 1 && submittedCount > 0 && submittedCount < assignedList.length) status = 'Partially_Submitted';
      else if (submittedCount >= totalAssigned && submittedCount > 0) status = 'Submitted';
      else if (p.dailyEntries?.some((d) => d.status === 'Submitted')) status = assignedList.length > 1 ? 'Partially_Submitted' : 'Submitted';

      let myStatus = status;
      if (curCode) {
        const myEntries = (p.dailyEntries || []).filter((d) => {
          const did = (d.employeeId || '').toLowerCase();
          return did === curCode || did === curName;
        });
        if (myEntries.some((d) => d.status === 'Approved')) myStatus = 'Approved';
        else if (myEntries.some((d) => d.status === 'PM_Approved')) myStatus = 'PM_Approved';
        else if (myEntries.some((d) => d.status === 'Submitted')) myStatus = 'Submitted';
        else myStatus = 'Draft';
      }

      return {
        id: p.id, client: p.client?.name || p.clientId, projectName: p.name,
        billingType: p.billingType, timeLogged: monthLogged, budgetHours: budget,
        percentage, status, myStatus, submittedCount, totalAssigned,
      };
    });
  }

  static async getProjectDailyEntries(projectId: string, month: string, employeeId?: string, role: string = 'Employee') {
    const [year, mStr] = month.split('-');
    const daysInMonth = new Date(Number(year), Number(mStr), 0).getDate();
    const [project, existing, employees, allBLs] = await Promise.all([
      prisma.project.findUnique({ where: { id: projectId } }),
      prisma.dailyTimesheetEntry.findMany({ where: { projectId, date: { startsWith: month } }, orderBy: { date: 'asc' } }),
      prisma.employee.findMany(),
      prisma.businessLine.findMany({ include: { services: true } }),
    ]);
    if (!project) throw new Error('Project not found.');

    const empById = new Map<string, any>();
    employees.forEach((e) => { empById.set(e.employeeId.toLowerCase(), e); empById.set(e.fullName.toLowerCase(), e); });
    const currentEmp = employeeId ? empById.get(employeeId.toLowerCase()) : null;
    const currentEmpCode = currentEmp?.employeeId || employeeId || '';
    const currentEmpName = currentEmp?.fullName || '';

    if (!hasProjectAccess(project, currentEmpCode, currentEmpName, role)) {
      throw new Error('Access Denied: You are not assigned to this project.');
    }

    const blNames = (project?.businessLine || '').split(',').map((s) => s.trim()).filter(Boolean);
    const resolvedServices = allBLs.filter((b) => blNames.includes(b.name)).flatMap((b) => b.services.map((s) => s.name));

    const rawAssigned = (project.assignedEmployees || '').split(',').map((s) => s.trim()).filter(Boolean);
    const assignedList: { id: string; name: string }[] = [];
    const seenIds = new Set<string>();

    rawAssigned.forEach((item) => {
      const match = empById.get(item.toLowerCase());
      const id = match?.employeeId || item;
      const name = match?.fullName || item;
      if (!seenIds.has(id.toLowerCase())) {
        seenIds.add(id.toLowerCase());
        assignedList.push({ id, name });
      }
    });

    if (assignedList.length === 0) {
      existing.forEach((e) => {
        const eid = e.employeeId || '';
        if (eid && !seenIds.has(eid.toLowerCase())) {
          seenIds.add(eid.toLowerCase());
          const match = empById.get(eid.toLowerCase());
          assignedList.push({ id: eid, name: match?.fullName || eid });
        }
      });
    }

    const submittedSet = new Set<string>();
    const pendingResources: string[] = [];

    assignedList.forEach((emp) => {
      const userEntries = existing.filter((e) => {
        const eid = (e.employeeId || '').toLowerCase();
        return eid === emp.id.toLowerCase() || eid === emp.name.toLowerCase();
      });
      const isSub = userEntries.some((e) => e.status === 'Submitted' || e.status === 'PM_Approved' || e.status === 'Approved') && !userEntries.some((e) => e.status === 'Draft');
      if (isSub) submittedSet.add(emp.id.toLowerCase());
      else pendingResources.push(emp.name);
    });

    const totalAssigned = Math.max(assignedList.length, 1);
    const submittedCount = submittedSet.size;
    let status = 'Draft';
    if (existing.some((d) => d.status === 'Approved')) status = 'Approved';
    else if (existing.some((d) => d.status === 'PM_Approved')) status = 'PM_Approved';
    else if (assignedList.length > 1 && submittedCount > 0 && submittedCount < assignedList.length) status = 'Partially_Submitted';
    else if (submittedCount >= totalAssigned && submittedCount > 0) status = 'Submitted';
    else if (existing.some((d) => d.status === 'Submitted')) status = assignedList.length > 1 ? 'Partially_Submitted' : 'Submitted';

    let myStatus = status;
    if (currentEmpCode) {
      const myEntries = existing.filter((e) => {
        const eid = (e.employeeId || '').toLowerCase();
        return eid === currentEmpCode.toLowerCase() || eid === currentEmpName.toLowerCase();
      });
      if (myEntries.some((e) => e.status === 'Approved')) myStatus = 'Approved';
      else if (myEntries.some((e) => e.status === 'PM_Approved')) myStatus = 'PM_Approved';
      else if (myEntries.some((e) => e.status === 'Submitted')) myStatus = 'Submitted';
      else myStatus = 'Draft';
    }

    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const entries: DailyLogEntry[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = String(day).padStart(2, '0');
      const date = `${month}-${dayStr}`;
      const dObj = new Date(Number(year), Number(mStr) - 1, day);
      const dayLabel = `${dayStr} ${dObj.toLocaleDateString('en-US', { month: 'short' })} (${daysOfWeek[dObj.getDay()]})`;
      const isWeekend = dObj.getDay() === 0 || dObj.getDay() === 6;
      const dayRecords = existing.filter((e) => e.date === date);

      if (currentEmpCode) {
        const myRec = dayRecords.find((e) => {
          const eid = (e.employeeId || '').toLowerCase();
          return eid === currentEmpCode.toLowerCase() || eid === currentEmpName.toLowerCase();
        });
        if (myRec) {
          entries.push({ id: myRec.id, sno: dayStr, date, dayLabel, description: myRec.description || '', task: myRec.task || '', hours: myRec.hours || 0, isBillable: myRec.isBillable !== false, isWeekend, resourceName: currentEmpName || empById.get(myRec.employeeId?.toLowerCase() || '')?.fullName || '', employeeId: myRec.employeeId || currentEmpCode, isOwner: true, isReadOnly: myStatus !== 'Draft', status: myRec.status });
        } else {
          entries.push({ sno: dayStr, date, dayLabel, description: '', task: '', hours: 0, isBillable: true, isWeekend, resourceName: currentEmpName, employeeId: currentEmpCode, isOwner: true, isReadOnly: myStatus !== 'Draft', status: 'Draft' });
        }
        dayRecords.filter((e) => e !== myRec && ((e.hours && e.hours > 0) || e.description || e.task || e.status !== 'Draft')).forEach((rec) => {
          entries.push({ id: rec.id, sno: dayStr, date, dayLabel, description: rec.description || '', task: rec.task || '', hours: rec.hours || 0, isBillable: rec.isBillable !== false, isWeekend, resourceName: empById.get(rec.employeeId?.toLowerCase() || '')?.fullName || rec.employeeId || '', employeeId: rec.employeeId || '', isOwner: false, isReadOnly: true, status: rec.status });
        });
      } else if (dayRecords.length > 0) {
        dayRecords.forEach((rec) => entries.push({ id: rec.id, sno: dayStr, date, dayLabel, description: rec.description || '', task: rec.task || '', hours: rec.hours || 0, isBillable: rec.isBillable !== false, isWeekend, resourceName: empById.get(rec.employeeId?.toLowerCase() || '')?.fullName || rec.employeeId || '', employeeId: rec.employeeId || '', isOwner: true, isReadOnly: false, status: rec.status }));
      } else {
        entries.push({ sno: dayStr, date, dayLabel, description: '', task: '', hours: 0, isBillable: true, isWeekend, resourceName: '', employeeId: '', isOwner: true, isReadOnly: false, status: 'Draft' });
      }
    }
    const finalServices = resolvedServices.length > 0 ? resolvedServices.join(', ') : (project?.service || '');
    return { entries, status, myStatus, pendingResources, totalAssigned, submittedCount, services: finalServices, businessLines: project?.businessLine || '' };
  }

  static async saveDailyEntries(projectId: string, month: string, employeeId: string | undefined, role: string, entries: DailyLogEntry[], targetStatus: string = 'Draft') {
    const proj = await prisma.project.findUnique({ where: { id: projectId } });
    if (!proj) throw new Error('Project not found.');

    const employees = await prisma.employee.findMany();
    const currentEmp = employeeId ? employees.find((e) => e.employeeId.toLowerCase() === employeeId.toLowerCase()) : null;
    const currentEmpCode = currentEmp?.employeeId || employeeId;
    const currentEmpName = currentEmp?.fullName || '';

    if (!hasProjectAccess(proj, currentEmpCode, currentEmpName, role)) {
      throw new Error('Access Denied: You are not assigned to this project.');
    }

    const whereClause: any = { projectId, date: { startsWith: month }, ...(currentEmpCode && { employeeId: currentEmpCode }) };
    const existing = await prisma.dailyTimesheetEntry.findMany({ where: whereClause });
    const isApproved = existing.some((d) => d.status === 'Approved');
    const isPMApproved = existing.some((d) => d.status === 'PM_Approved');
    const isSubmitted = existing.some((d) => d.status === 'Submitted');

    if (role === 'Employee' && (isSubmitted || isPMApproved || isApproved) && targetStatus === 'Draft') throw new Error('Cannot edit submitted or approved timesheet.');
    if (role === 'Employee' && (isSubmitted || isPMApproved || isApproved) && targetStatus === 'Submitted') throw new Error('Timesheet is already submitted for this month.');
    if (role === 'Project Manager' && (isPMApproved || isApproved) && targetStatus === 'Draft') throw new Error('PM cannot edit timesheet after approval or final lock.');
    if (role === 'Super Admin' && isApproved && targetStatus === 'Draft') throw new Error('Timesheet is locked. Please unlock/reopen to make edits.');

    const userEntries = currentEmpCode ? entries.filter((e) => e.isOwner !== false && (!e.employeeId || e.employeeId.toLowerCase() === currentEmpCode.toLowerCase())) : entries;
    for (const e of userEntries) {
      const rec = e.id ? existing.find((x) => x.id === e.id) : existing.find((x) => x.date === e.date);
      if (rec) {
        await prisma.dailyTimesheetEntry.update({ where: { id: rec.id }, data: { description: e.description || '', task: e.task || '', hours: Number(e.hours) || 0, isBillable: e.isBillable !== false, status: targetStatus } });
      } else if ((e.hours && e.hours > 0) || e.description || e.task || targetStatus === 'Submitted') {
        await prisma.dailyTimesheetEntry.create({ data: { projectId, date: e.date, dayLabel: e.dayLabel || '', sno: e.sno || '', weekStart: `${month}-01`, description: e.description || '', task: e.task || '', hours: Number(e.hours) || 0, isBillable: e.isBillable !== false, status: targetStatus, employeeId: currentEmpCode || '' } });
      }
    }
    if (targetStatus === 'Submitted') {
      const submitter = currentEmp?.fullName || currentEmpCode || 'Team Member';
      await NotificationService.createNotification({ role: 'Project Manager', title: `Timesheet Submitted: ${proj.name || projectId}`, message: `${submitter} submitted timesheet for project "${proj.name || projectId}" (${month}).`, type: 'timesheet_submit', projectId });
    }
    await this.syncProjectLoggedHours(projectId);
    return { success: true };
  }

  static async approveTimesheet(projectId: string, month: string, employeeId: string | undefined, role: string) {
    if (role !== 'Project Manager' && role !== 'Super Admin') throw new Error('Only PM and SA can approve timesheets.');
    const sheetData = await this.getProjectDailyEntries(projectId, month, employeeId, role);
    if (sheetData.status === 'Partially_Submitted') throw new Error(`Cannot approve timesheet. Waiting for submission from: ${sheetData.pendingResources.join(', ')}`);
    const nextStatus = role === 'Super Admin' ? 'Approved' : 'PM_Approved';
    await prisma.dailyTimesheetEntry.updateMany({ where: { projectId, date: { startsWith: month } }, data: { status: nextStatus } });
    const proj = await prisma.project.findUnique({ where: { id: projectId } });
    const nRole = nextStatus === 'PM_Approved' ? 'Super Admin' : 'Employee';
    await NotificationService.createNotification({ role: nRole, title: `Timesheet ${nextStatus}: ${proj?.name || projectId}`, message: `Timesheet for "${proj?.name || projectId}" (${month}) updated to ${nextStatus}.`, type: 'timesheet_approve', projectId });
    await this.syncProjectLoggedHours(projectId);
    return { success: true, status: nextStatus };
  }

  static async reopenTimesheet(projectId: string, month: string, employeeId: string | undefined, role: string) {
    if (role !== 'Project Manager' && role !== 'Super Admin') throw new Error('Only PM and SA can reopen timesheets.');
    await prisma.dailyTimesheetEntry.updateMany({ where: { projectId, date: { startsWith: month } }, data: { status: 'Draft' } });
    const proj = await prisma.project.findUnique({ where: { id: projectId } });
    await NotificationService.createNotification({ role: 'Employee', title: `Timesheet Reopened: ${proj?.name || projectId}`, message: `Timesheet for "${proj?.name || projectId}" (${month}) was reopened for rework by ${role}.`, type: 'timesheet_reopen', projectId });
    await this.syncProjectLoggedHours(projectId);
    return { success: true, status: 'Draft' };
  }

  static async syncProjectLoggedHours(projectId: string) {
    const agg = await prisma.dailyTimesheetEntry.aggregate({ where: { projectId }, _sum: { hours: true } });
    await prisma.project.update({ where: { id: projectId }, data: { loggedHours: agg._sum.hours || 0 } });
  }

  static async getWeeklySheet(weekStart: string): Promise<WeeklyTimesheet> {
    let sheet = await prisma.timesheet.findUnique({ where: { weekStart }, include: { rows: true } });
    if (!sheet) sheet = await prisma.timesheet.create({ data: { weekStart, status: 'Draft' }, include: { rows: true } });
    const isClosed = this.isMonthClosed(weekStart);
    return { weekStart: sheet.weekStart, status: (isClosed && sheet.status !== 'Approved' ? 'Locked' : sheet.status) as WeeklyTimesheet['status'], isMonthClosed: isClosed, rows: sheet.rows.map((r) => ({ id: r.id, client: r.client, project: r.project, task: r.task, billable: r.billable, hours: [r.mon, r.tue, r.wed, r.thu, r.fri, r.sat, r.sun] })) };
  }

  static async saveDraft(weekStart: string, role: string, rows: any[]) {
    try { return { success: true, data: await this.updateSheet(weekStart, rows) }; } catch (e: any) { return { success: false, error: e.message }; }
  }

  static async submitSheet(weekStart: string, role: string, rows: any[]) {
    try {
      const sheet = await this.updateSheet(weekStart, rows);
      await prisma.timesheet.update({ where: { weekStart }, data: { status: 'Submitted' } });
      return { success: true, data: { ...sheet, status: 'Submitted' as const } };
    } catch (e: any) { return { success: false, error: e.message }; }
  }

  static async approveOrRejectSheet(weekStart: string, role: string, action: 'approve' | 'reject') {
    if (role !== 'Project Manager' && role !== 'Super Admin') return { success: false, error: 'Unauthorized' };
    await prisma.timesheet.update({ where: { weekStart }, data: { status: action === 'approve' ? 'Approved' : 'Draft' } });
    return { success: true, data: await this.getWeeklySheet(weekStart) };
  }

  static async updateSheet(weekStart: string, rows: TimesheetRow[]) {
    if (this.isMonthClosed(weekStart)) throw new Error('Month closed. Timesheets are locked.');
    let sheet = await prisma.timesheet.findUnique({ where: { weekStart } });
    if (!sheet) sheet = await prisma.timesheet.create({ data: { weekStart, status: 'Draft' } });
    await prisma.timesheetRow.deleteMany({ where: { timesheetId: sheet.id } });
    await prisma.timesheetRow.createMany({ data: rows.map((r) => ({ timesheetId: sheet.id, client: r.client, project: r.project, task: r.task, billable: r.billable, mon: r.hours[0] || 0, tue: r.hours[1] || 0, wed: r.hours[2] || 0, thu: r.hours[3] || 0, fri: r.hours[4] || 0, sat: r.hours[5] || 0, sun: r.hours[6] || 0 })) });
    return this.getWeeklySheet(weekStart);
  }
}
