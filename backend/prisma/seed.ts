import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/passwordUtils';

const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning database and seeding clean initial state...');

  // 1. Purge all operational and dummy data
  await prisma.dailyTimesheetEntry.deleteMany({});
  await prisma.timesheetRow.deleteMany({});
  await prisma.timesheet.deleteMany({});
  await prisma.leaveRequest.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.client.deleteMany({});
  await prisma.service.deleteMany({});
  await prisma.businessLine.deleteMany({});
  await prisma.holiday.deleteMany({});
  await prisma.leaveTypeConfig.deleteMany({});
  await prisma.exchangeRate.deleteMany({});
  await prisma.employee.deleteMany({});

  // 2. Create the Single Super Admin Employee
  const superAdmin = await prisma.employee.create({
    data: {
      employeeId: 'ODE0001',
      fullName: 'ckArunkumar',
      designation: 'Studio Director',
      department: 'Leadership',
      email: 'arun@orangyy.design',
      password: hashPassword('Sachin_99'),
      phone: '+91 9008152920',
      secondaryPhone: '',
      personalEmail: '',
      joiningDate: '01 Sep 2015',
      costRate: '₹8,000/hr',
      capacity: '40 hrs/week',
      status: 'Active',
      role: 'Super Admin',
      location: 'Delhi, India',
      education: [
        { degree: 'MBA', school: 'IIM Ahmedabad', year: '2012' },
      ],
      experience: [
        { company: 'Orangyy Design Studio', role: 'Founder & Director', period: '2015 - Present' },
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

  // 3. Seed Default Studio Leave Policy Configurations
  const defaultLeaveConfigs = [
    { code: 'CL', name: 'Casual Leave', annualQuota: 12, monthlyAccrual: 1.0, allowHalfDay: true, isPaid: true, year: 2026 },
    { code: 'SL', name: 'Sick Leave', annualQuota: 12, monthlyAccrual: 1.0, allowHalfDay: true, isPaid: true, year: 2026 },
    { code: 'EL', name: 'Earned Leave', annualQuota: 15, monthlyAccrual: 1.25, allowHalfDay: false, isPaid: true, year: 2026 },
    { code: 'WFH', name: 'Work From Home', annualQuota: 24, monthlyAccrual: 2.0, allowHalfDay: true, isPaid: true, year: 2026 },
    { code: 'COMP_OFF', name: 'Compensatory Off', annualQuota: 0, monthlyAccrual: 0, allowHalfDay: true, isPaid: true, year: 2026 },
    { code: 'OH', name: 'Optional Holiday', annualQuota: 2, monthlyAccrual: 0, allowHalfDay: false, isPaid: true, year: 2026 },
  ];

  for (const cfg of defaultLeaveConfigs) {
    await prisma.leaveTypeConfig.create({ data: cfg });
  }

  // 4. Seed Standard Base Currency Reference Rates
  const baseRates = [
    { currency: 'USD', rateToINR: 87.50, monthYear: '2026-09', isLocked: false, source: 'system' },
    { currency: 'EUR', rateToINR: 95.20, monthYear: '2026-09', isLocked: false, source: 'system' },
    { currency: 'GBP', rateToINR: 112.40, monthYear: '2026-09', isLocked: false, source: 'system' },
    { currency: 'AED', rateToINR: 23.80, monthYear: '2026-09', isLocked: false, source: 'system' },
    { currency: 'SGD', rateToINR: 65.50, monthYear: '2026-09', isLocked: false, source: 'system' },
    { currency: 'INR', rateToINR: 1.0, monthYear: '2026-09', isLocked: false, source: 'system' },
  ];

  for (const rate of baseRates) {
    await prisma.exchangeRate.create({ data: rate });
  }

  console.log(`✔ Clean state seeded: 1 Super Admin created (${superAdmin.fullName} - ${superAdmin.email})`);
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
