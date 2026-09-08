import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/passwordUtils';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  // Clear any existing values to ensure idempotence
  await prisma.employee.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.client.deleteMany({});
  await prisma.timesheetRow.deleteMany({});
  await prisma.timesheet.deleteMany({});

  // 1. Create employees
  const arun = await prisma.employee.create({
    data: {
      employeeId: 'AODE0001',
      fullName: 'ckArunkumar',
      designation: 'Studio Director',
      department: 'Leadership',
      email: 'arun@orangy.design',
      password: hashPassword('Arun@Orangyy2026_'),
      phone: '+91 9008152920',
      costRate: '₹8,000/hr',
      capacity: '40 hrs/week',
      status: 'Active',
      role: 'Super Admin',
      location: 'Delhi, India',
      education: [
        { degree: 'MBA', school: 'IIM Ahmedabad', year: '2012' },
      ],
      experience: [
        { company: 'Orangy Design Studio', role: 'Founder & Director', period: '2015 - Present' },
      ],
      casualQuota: 12,
      casualUsed: 0,
      sickQuota: 12,
      sickUsed: 0,
      earnedQuota: 15,
      earnedUsed: 0,
      compOffBalance: 0,
      optionalHolidaysQuota: 2,
      optionalHolidaysUsed: 0,
      wfhMonthlyLimit: 2,
      wfhUsedThisMonth: 0,
    },
  });

  const navaneetha = await prisma.employee.create({
    data: {
      employeeId: 'AODE0002',
      fullName: 'Navaneetha S',
      designation: 'Senior Project Manager',
      department: 'Project Management',
      email: 'navaneetha@orangy.design',
      password: hashPassword('Navan@Manager123!'),
      phone: '+91 9597101210',
      costRate: '₹4,500/hr',
      capacity: '40 hrs/week',
      status: 'Active',
      role: 'Project Manager',
      location: 'Delhi, India',
      education: [
        { degree: 'B.E. in Computer Science', school: 'NIT Trichy', year: '2014' },
      ],
      experience: [
        { company: 'Infosys', role: 'Project Coordinator', period: '2014 - 2018' },
      ],
      casualQuota: 12,
      casualUsed: 0,
      sickQuota: 12,
      sickUsed: 0,
      earnedQuota: 15,
      earnedUsed: 0,
      compOffBalance: 0,
      optionalHolidaysQuota: 2,
      optionalHolidaysUsed: 0,
      wfhMonthlyLimit: 2,
      wfhUsedThisMonth: 0,
    },
  });

  const alex = await prisma.employee.create({
    data: {
      employeeId: 'AODE0003',
      fullName: 'Alex Carter',
      designation: 'Senior Product Designer',
      department: 'Product Design',
      email: 'alex.carter@orangy.studio',
      password: hashPassword('Alex#Designer99*'),
      phone: '+91 98765 43210',
      costRate: '₹3,500/hr',
      capacity: '40 hrs/week',
      status: 'Active',
      role: 'Employee',
      education: [
        { degree: 'Master of Design (M.Des)', school: 'IDC, IIT Bombay', year: '2018' },
        { degree: 'Bachelor of Fine Arts', school: 'Delhi College of Art', year: '2016' },
      ],
      experience: [
        { company: 'Studio Karta', role: 'UI/UX Designer', period: '2018 - 2021' },
      ],
      casualQuota: 12,
      casualUsed: 0,
      sickQuota: 12,
      sickUsed: 0,
      earnedQuota: 15,
      earnedUsed: 0,
      compOffBalance: 0,
      optionalHolidaysQuota: 2,
      optionalHolidaysUsed: 0,
      wfhMonthlyLimit: 2,
      wfhUsedThisMonth: 0,
    },
  });

  const emma = await prisma.employee.create({
    data: {
      employeeId: 'AODE0004',
      fullName: 'Emma Watson',
      designation: 'UX Researcher',
      department: 'User Research',
      email: 'emma.watson@orangy.studio',
      password: hashPassword('Emma$Research2026%'),
      phone: '+91 99999 88888',
      costRate: '₹2,800/hr',
      capacity: '35 hrs/week',
      status: 'Active',
      role: 'Employee',
      education: [
        { degree: 'M.Sc in HCI', school: 'Georgia Tech', year: '2021' },
      ],
      experience: [
        { company: 'Google Inc.', role: 'Associate Researcher', period: '2021 - 2023' },
      ],
      casualQuota: 12,
      casualUsed: 0,
      sickQuota: 12,
      sickUsed: 0,
      earnedQuota: 15,
      earnedUsed: 0,
      compOffBalance: 0,
      optionalHolidaysQuota: 2,
      optionalHolidaysUsed: 0,
      wfhMonthlyLimit: 2,
      wfhUsedThisMonth: 0,
    },
  });

  console.log(`Seeded ${arun.fullName}, ${navaneetha.fullName}, ${alex.fullName}, and ${emma.fullName}`);

  // 2. Create clients & projects
  await prisma.client.create({
    data: {
      id: 'AODC0001',
      name: 'Acme Corp',
      displayName: 'Acme Corp',
      legalName: 'Acme Corporation Inc.',
      billingCurrency: 'USD ($)',
      status: 'Active',
      projects: {
        create: [
          {
            id: 'AODP0001',
            name: 'Website Redesign',
            billingType: 'T&M',
            rate: '$150/hr',
            budgetHours: 100,
            loggedHours: 78,
            status: 'Active',
            managerId: 'AODE0002',
            managerName: 'Navaneetha S',
            assignedEmployees: 'AODE0001,AODE0003,AODE0004',
            monthlyBudgets: [
              { monthYear: '2026-08', budgetHours: 100, isLocked: false, updatedAt: new Date().toISOString() },
            ],
            rateVersions: [
              { id: 1, projectId: 'AODP0001', billingType: 'T&M', rateAmount: 150, currency: 'USD ($)', effectiveStartDate: '2026-01-01', effectiveEndDate: '', notes: 'Initial agreement', createdAt: new Date().toISOString() },
            ],
          },
          {
            id: 'AODP0002',
            name: 'CMS Integration',
            billingType: 'Fixed PC',
            rate: '$12,000',
            budgetHours: 80,
            loggedHours: 15,
            status: 'Active',
            managerId: 'AODE0002',
            managerName: 'Navaneetha S',
            assignedEmployees: 'AODE0001,AODE0004',
            monthlyBudgets: [
              { monthYear: '2026-08', budgetHours: 80, isLocked: false, updatedAt: new Date().toISOString() },
            ],
            rateVersions: [
              { id: 2, projectId: 'AODP0002', billingType: 'Fixed PC', rateAmount: 12000, currency: 'USD ($)', effectiveStartDate: '2026-01-01', effectiveEndDate: '', notes: 'Initial agreement', createdAt: new Date().toISOString() },
            ],
          },
        ],
      },
    },
  });

  await prisma.client.create({
    data: {
      id: 'AODC0002',
      name: 'Hooli Inc',
      displayName: 'Hooli Inc',
      legalName: 'Hooli Technologies Pvt Ltd',
      billingCurrency: 'INR (₹)',
      status: 'Active',
      projects: {
        create: [
          {
            id: 'AODP0003',
            name: 'Mobile App V2',
            billingType: 'Fixed RC',
            rate: '₹3,50,000/mo',
            budgetHours: 200,
            loggedHours: 195,
            status: 'Active',
            managerId: 'AODE0002',
            managerName: 'Navaneetha S',
            assignedEmployees: 'AODE0003,AODE0004',
            monthlyBudgets: [
              { monthYear: '2026-08', budgetHours: 200, isLocked: false, updatedAt: new Date().toISOString() },
            ],
            rateVersions: [
              { id: 3, projectId: 'AODP0003', billingType: 'Fixed RC', rateAmount: 350000, currency: 'INR (₹)', effectiveStartDate: '2026-01-01', effectiveEndDate: '', notes: 'Initial monthly retainer', createdAt: new Date().toISOString() },
            ],
          },
        ],
      },
    },
  });

  console.log('Seeded Clients and Projects.');

  // 3. Create a starting timesheet
  const ts = await prisma.timesheet.create({
    data: {
      weekStart: '2026-08-17',
      status: 'Draft',
      rows: {
        create: [
          { client: 'Acme Corp', project: 'Website Redesign', task: 'Development', billable: true, mon: 8, tue: 8, wed: 8, thu: 4, fri: 0, sat: 0, sun: 0 },
          { client: 'Stark Ind', project: 'Brand Strategy', task: 'Visual Identity', billable: true, mon: 0, tue: 0, wed: 0, thu: 4, fri: 8, sat: 0, sun: 0 },
        ],
      },
    },
  });

  // 4. Create detailed daily entries matching the mockup
  await prisma.dailyTimesheetEntry.createMany({
    data: [
      { sno: '01', date: '2026-08-01', dayLabel: 'Aug 01, Mon', description: 'Designed a clean and engaging landing screen to create a strong first impression. Focused on clear visual hierarchy, intuitive navigation, and responsive layout.', task: 'Ideation', hours: 3, projectId: 'AODP0001', employeeId: 'AODE0001', weekStart: '2026-08-01', status: 'Draft' },
      { sno: '02', date: '2026-08-02', dayLabel: 'Aug 02, Tue', description: 'User Flow Mapping & Key Journeys', task: 'Design', hours: 2, projectId: 'AODP0001', employeeId: 'AODE0001', weekStart: '2026-08-01', status: 'Draft' },
      { sno: '03', date: '2026-08-03', dayLabel: 'Aug 03, Wed', description: 'Wireframing core dashboards', task: 'AI Design', hours: 4, projectId: 'AODP0001', employeeId: 'AODE0001', weekStart: '2026-08-01', status: 'Draft' },
      { sno: '04', date: '2026-08-04', dayLabel: 'Aug 04, Thu', description: 'Prototype Testing & Animation transitions', task: 'Ideation', hours: 5, projectId: 'AODP0001', employeeId: 'AODE0001', weekStart: '2026-08-01', status: 'Draft' },
      { sno: '05', date: '2026-08-05', dayLabel: 'Aug 05, Fri', description: 'UI Kit Development & Design Tokens', task: 'Ideation', hours: 3, projectId: 'AODP0001', employeeId: 'AODE0001', weekStart: '2026-08-01', status: 'Draft' },
      { sno: '06', date: '2026-08-06', dayLabel: 'Aug 06, Sat', description: '', task: '', hours: 0, projectId: 'AODP0001', employeeId: 'AODE0001', weekStart: '2026-08-01', status: 'Draft' },
      { sno: '07', date: '2026-08-07', dayLabel: 'Aug 07, Sun', description: '', task: '', hours: 0, projectId: 'AODP0001', employeeId: 'AODE0001', weekStart: '2026-08-01', status: 'Draft' },
      { sno: '08', date: '2026-08-08', dayLabel: 'Aug 08, Sat', description: 'Prototype Testing with PM review', task: 'Validation', hours: 2, projectId: 'AODP0001', employeeId: 'AODE0001', weekStart: '2026-08-01', status: 'Draft' },
      { sno: '09', date: '2026-08-09', dayLabel: 'Aug 09, Sun', description: 'User Feedback Session Notes synthesis', task: 'Analysis', hours: 4, projectId: 'AODP0001', employeeId: 'AODE0001', weekStart: '2026-08-01', status: 'Draft' },
      { sno: '10', date: '2026-08-10', dayLabel: 'Aug 10, Mon', description: 'Final Design Review with Director', task: 'Approval', hours: 1, projectId: 'AODP0001', employeeId: 'AODE0001', weekStart: '2026-08-01', status: 'Draft' },
    ],
  });

  console.log(`Seeded Timesheet: ${ts.weekStart}`);
  console.log('Seeding finished successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
