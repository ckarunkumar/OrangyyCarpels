import { prisma } from '../lib/prisma';
import { NotificationService } from './notificationService';

export interface TimesheetRow { id: number; client: string; project: string; task: string; hours: number[]; billable: boolean; }
export interface WeeklyTimesheet { weekStart: string; status: 'Draft' | 'Submitted' | 'PM_Approved' | 'Approved' | 'Locked'; rows: TimesheetRow[]; isMonthClosed?: boolean; }
export interface ProjectTimesheetItem { id: string; client: string; projectName: string; billingType: string; timeLogged: number; budgetHours: number; percentage: number; status: string; }
export interface DailyLogEntry {
  id?: number; sno: string; date: string; dayLabel: string; description: string; task: string;
  hours: number; isBillable?: boolean; isWeekend?: boolean; resourceName?: string;
  employeeId?: string; isOwner?: boolean; isReadOnly?: boolean; status?: string;
}

export class TimesheetService {
  static isMonthClosed(weekStart: string): boolean {
    const s = new Date(weekStart); const n = new Date();
    return (s.getFullYear() * 12 + s.getMonth()) < (n.getFullYear() * 12 + n.getMonth());
  }

  static async getEmployeeProjectsSummary(month: string = '2026-08', employeeId?: string): Promise<ProjectTimesheetItem[]> {
    const projects = await prisma.project.findMany({ where: { status: 'Active' }, include: { client: true, dailyEntries: { where: { date: { startsWith: month } } } } });
    return projects.map((p) => {
      const isHourly = p.billingType === 'T&M' || p.billingType === 'Hourly Rate (T&M)';
      const monthLogged = p.dailyEntries?.reduce((acc, d) => acc + d.hours, 0) || 0;
      const budget = p.budgetHours || 100;
      const percentage = isHourly ? Math.min(100, Math.round((monthLogged / budget) * 100)) : 0;
      const timesheetStatus = p.dailyEntries?.some((d) => d.status === 'Approved') ? 'Approved' :
                              p.dailyEntries?.some((d) => d.status === 'PM_Approved') ? 'PM_Approved' :
                              p.dailyEntries?.some((d) => d.status === 'Submitted') ? 'Submitted' : 'Draft';
      return { id: p.id, client: p.client?.name || p.clientId, projectName: p.name, billingType: p.billingType, timeLogged: monthLogged, budgetHours: budget, percentage, status: timesheetStatus };
    });
  }

  static async getProjectDailyEntries(projectId: string, month: string, employeeId?: string) {
    const [year, mStr] = month.split('-');
    const daysInMonth = new Date(Number(year), Number(mStr), 0).getDate();
    const [project, existing, employees, allBLs] = await Promise.all([
      prisma.project.findUnique({ where: { id: projectId } }),
      prisma.dailyTimesheetEntry.findMany({ where: { projectId, date: { startsWith: month } }, orderBy: { date: 'asc' } }),
      prisma.employee.findMany(),
      prisma.businessLine.findMany({ include: { services: true } }),
    ]);
    const blNames = (project?.businessLine || '').split(',').map((s) => s.trim()).filter(Boolean);
    const resolvedServices = allBLs.filter((b) => blNames.includes(b.name)).flatMap((b) => b.services.map((s) => s.name));
    const empMap = new Map<string, string>();
    const currentEmp = employeeId ? employees.find((e) => e.employeeId === employeeId) : null;
    const currentEmpCode = currentEmp?.employeeId || employeeId || '';
    const currentEmpName = currentEmp?.fullName || '';
    employees.forEach((e) => { empMap.set(e.employeeId, e.fullName); empMap.set(e.fullName, e.fullName); });

    const assignedNames = (project?.assignedEmployees || '').split(',').map((s) => s.trim()).filter(Boolean);
    const assignedList = assignedNames.length > 0 ? assignedNames : Array.from(new Set(existing.map((e) => empMap.get(e.employeeId || '') || e.employeeId).filter(Boolean))) as string[];
    const submittedSet = new Set<string>(); const draftSet = new Set<string>();
    existing.forEach((e) => {
      const name = empMap.get(e.employeeId || '') || e.employeeId || '';
      if (name) { if (e.status === 'Draft') draftSet.add(name); else submittedSet.add(name); }
    });
    const pendingResources = assignedList.filter((name) => !submittedSet.has(name) || draftSet.has(name));
    let status = 'Draft';
    if (existing.some((d) => d.status === 'Approved')) status = 'Approved';
    else if (existing.some((d) => d.status === 'PM_Approved')) status = 'PM_Approved';
    else if (assignedList.length > 1 && submittedSet.size > 0 && pendingResources.length > 0) status = 'Partially_Submitted';
    else if (existing.some((d) => d.status === 'Submitted')) status = 'Submitted';

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
        const myRec = dayRecords.find((e) => e.employeeId === currentEmpCode);
        if (myRec) {
          entries.push({ id: myRec.id, sno: dayStr, date, dayLabel, description: myRec.description || '', task: myRec.task || '', hours: myRec.hours || 0, isBillable: myRec.isBillable !== false, isWeekend, resourceName: currentEmpName || empMap.get(myRec.employeeId || '') || '', employeeId: myRec.employeeId || currentEmpCode, isOwner: true, isReadOnly: false, status: myRec.status });
        } else {
          entries.push({ sno: dayStr, date, dayLabel, description: '', task: '', hours: 0, isBillable: true, isWeekend, resourceName: currentEmpName, employeeId: currentEmpCode, isOwner: true, isReadOnly: false, status: 'Draft' });
        }
        dayRecords.filter((e) => e !== myRec && ((e.hours && e.hours > 0) || e.description || e.task || e.status !== 'Draft')).forEach((rec) => {
          entries.push({ id: rec.id, sno: dayStr, date, dayLabel, description: rec.description || '', task: rec.task || '', hours: rec.hours || 0, isBillable: rec.isBillable !== false, isWeekend, resourceName: empMap.get(rec.employeeId || '') || rec.employeeId || '', employeeId: rec.employeeId || '', isOwner: false, isReadOnly: true, status: rec.status });
        });
      } else if (dayRecords.length > 0) {
        dayRecords.forEach((rec) => entries.push({ id: rec.id, sno: dayStr, date, dayLabel, description: rec.description || '', task: rec.task || '', hours: rec.hours || 0, isBillable: rec.isBillable !== false, isWeekend, resourceName: empMap.get(rec.employeeId || '') || rec.employeeId || '', employeeId: rec.employeeId || '', isOwner: true, isReadOnly: false, status: rec.status }));
      } else {
        entries.push({ sno: dayStr, date, dayLabel, description: '', task: '', hours: 0, isBillable: true, isWeekend, resourceName: '', employeeId: '', isOwner: true, isReadOnly: false, status: 'Draft' });
      }
    }
    const finalServices = resolvedServices.length > 0 ? resolvedServices.join(', ') : (project?.service || '');
    return { entries, status, pendingResources, totalAssigned: assignedList.length, submittedCount: submittedSet.size, services: finalServices, businessLines: project?.businessLine || '' };
  }

  static async saveDailyEntries(projectId: string, month: string, employeeId: string | undefined, role: string, entries: DailyLogEntry[], targetStatus: string = 'Draft') {
    const employees = await prisma.employee.findMany();
    const currentEmp = employeeId ? employees.find((e) => e.employeeId === employeeId) : null;
    const currentEmpCode = currentEmp?.employeeId || employeeId;
    const whereClause: any = { projectId, date: { startsWith: month }, ...(currentEmpCode && { employeeId: currentEmpCode }) };
    const existing = await prisma.dailyTimesheetEntry.findMany({ where: whereClause });
    const isApproved = existing.some((d) => d.status === 'Approved');
    const isPMApproved = existing.some((d) => d.status === 'PM_Approved');
    const isSubmitted = existing.some((d) => d.status === 'Submitted');

    if (role === 'Employee' && (isSubmitted || isPMApproved || isApproved) && targetStatus === 'Draft') throw new Error('Cannot edit submitted or approved timesheet.');
    if (role === 'Project Manager' && (isPMApproved || isApproved) && targetStatus === 'Draft') throw new Error('PM cannot edit timesheet after PM approval or final lock.');
    if (role === 'Super Admin' && isApproved && targetStatus === 'Draft') throw new Error('Timesheet is locked. Please unlock/reopen to make edits.');

    const userEntries = currentEmpCode ? entries.filter((e) => e.isOwner !== false && (!e.employeeId || e.employeeId === currentEmpCode)) : entries;
    for (const e of userEntries) {
      const rec = e.id ? existing.find((x) => x.id === e.id) : existing.find((x) => x.date === e.date);
      if (rec) {
        await prisma.dailyTimesheetEntry.update({ where: { id: rec.id }, data: { description: e.description || '', task: e.task || '', hours: Number(e.hours) || 0, isBillable: e.isBillable !== false, status: targetStatus } });
      } else if ((e.hours && e.hours > 0) || e.description || e.task) {
        await prisma.dailyTimesheetEntry.create({ data: { projectId, date: e.date, dayLabel: e.dayLabel || '', sno: e.sno || '', weekStart: `${month}-01`, description: e.description || '', task: e.task || '', hours: Number(e.hours) || 0, isBillable: e.isBillable !== false, status: targetStatus, employeeId: currentEmpCode || '' } });
      }
    }
    if (targetStatus === 'Submitted') {
      const proj = await prisma.project.findUnique({ where: { id: projectId } });
      await NotificationService.createNotification({ role: 'Project Manager', title: `Timesheet Submitted: ${proj?.name || projectId}`, message: `Timesheet for project "${proj?.name || projectId}" (${month}) submitted for review.`, type: 'timesheet_submit', projectId });
    }
    await this.syncProjectLoggedHours(projectId);
    return { success: true };
  }

  static async approveTimesheet(projectId: string, month: string, employeeId: string | undefined, role: string) {
    if (role !== 'Project Manager' && role !== 'Super Admin') throw new Error('Only PM and SA can approve timesheets.');
    const sheetData = await this.getProjectDailyEntries(projectId, month);
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

