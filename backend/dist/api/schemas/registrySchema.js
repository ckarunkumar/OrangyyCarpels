"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProjectSchema = exports.createProjectSchema = exports.updateClientSchema = exports.createClientSchema = exports.updateEmployeeSchema = exports.createEmployeeSchema = exports.getRegistrySchema = void 0;
exports.getRegistrySchema = {
    querystring: {
        type: 'object',
        properties: { clientId: { type: 'string' } },
    },
};
const employeeProps = {
    employeeId: { type: 'string' },
    fullName: { type: 'string', minLength: 1 },
    dob: { type: 'string' },
    designation: { type: 'string' },
    department: { type: 'string' },
    email: { type: 'string', format: 'email' },
    personalEmail: { type: 'string' },
    phone: { type: 'string', minLength: 5 },
    secondaryPhone: { type: 'string' },
    permanentAddress: { type: 'string' },
    guardianName: { type: 'string' },
    motherName: { type: 'string' },
    bloodGroup: { type: 'string' },
    linkedInUrl: { type: 'string' },
    aadhaarNumber: { type: 'string' },
    panNumber: { type: 'string' },
    costRate: { type: 'string' },
    capacity: { type: 'string' },
    joiningDate: { type: 'string' },
    relievingDate: { type: 'string' },
    status: { type: 'string', enum: ['Active', 'Inactive'] },
    role: { type: 'string', enum: ['Super Admin', 'Project Manager', 'Employee'] },
    avatar: { type: ['string', 'null'] },
    password: { type: 'string' },
    bankName: { type: 'string' },
    branchName: { type: 'string' },
    ifscCode: { type: 'string' },
    accountNumber: { type: 'string' },
    accountHolderName: { type: 'string' },
    accountType: { type: 'string' },
    upiId: { type: 'string' },
};
exports.createEmployeeSchema = {
    body: {
        type: 'object',
        required: ['fullName', 'email', 'phone'],
        properties: employeeProps,
    },
};
exports.updateEmployeeSchema = {
    params: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'string' } },
    },
    body: {
        type: 'object',
        properties: employeeProps,
    },
};
exports.createClientSchema = {
    body: {
        type: 'object',
        required: ['name', 'billingCurrency'],
        properties: {
            id: { type: 'string' },
            name: { type: 'string', minLength: 1 },
            legalName: { type: 'string' },
            displayName: { type: 'string' },
            contactPerson: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' },
            accountsPerson: { type: 'string' },
            accountsEmail: { type: 'string' },
            accountsPhone: { type: 'string' },
            address: { type: 'string' },
            country: { type: 'string' },
            cinNumber: { type: 'string' },
            gstNumber: { type: 'string' },
            panNumber: { type: 'string' },
            msmeNumber: { type: 'string' },
            billingCurrency: { type: 'string', minLength: 1 },
            defaultBillingType: { type: 'string', enum: ['T&M', 'Resources Cost (Fix)', 'Project Cost (Fix)', 'Fixed RC', 'Fixed PC', 'Hourly Rate (T&M)', 'Monthly Resource Cost (Fixed)', 'Project Cost (Fixed)'] },
            dueTime: { type: 'string', enum: ['15 days', '30 days', '45 days', '60 days', '90 days'] },
            status: { type: 'string', enum: ['Active', 'Inactive'] },
        },
    },
};
exports.updateClientSchema = {
    params: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'string' } },
    },
    body: {
        type: 'object',
        properties: {
            name: { type: 'string', minLength: 1 },
            legalName: { type: 'string' },
            displayName: { type: 'string' },
            contactPerson: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' },
            accountsPerson: { type: 'string' },
            accountsEmail: { type: 'string' },
            accountsPhone: { type: 'string' },
            address: { type: 'string' },
            country: { type: 'string' },
            cinNumber: { type: 'string' },
            gstNumber: { type: 'string' },
            panNumber: { type: 'string' },
            msmeNumber: { type: 'string' },
            billingCurrency: { type: 'string', minLength: 1 },
            defaultBillingType: { type: 'string', enum: ['T&M', 'Resources Cost (Fix)', 'Project Cost (Fix)', 'Fixed RC', 'Fixed PC', 'Hourly Rate (T&M)', 'Monthly Resource Cost (Fixed)', 'Project Cost (Fixed)'] },
            dueTime: { type: 'string', enum: ['15 days', '30 days', '45 days', '60 days', '90 days'] },
            status: { type: 'string', enum: ['Active', 'Inactive'] },
        },
    },
};
exports.createProjectSchema = {
    body: {
        type: 'object',
        required: ['clientId', 'name', 'billingType', 'rate', 'startDate'],
        properties: {
            id: { type: 'string' },
            clientId: { type: 'string', minLength: 1 },
            name: { type: 'string', minLength: 1 },
            billingType: { type: 'string', enum: ['T&M', 'Resources Cost (Fix)', 'Project Cost (Fix)', 'Fixed RC', 'Fixed PC', 'Hourly Rate (T&M)', 'Monthly Resource Cost (Fixed)', 'Project Cost (Fixed)'] },
            rate: { type: 'string', minLength: 1 },
            businessLine: { type: 'string' },
            service: { type: 'string' },
            startDate: { type: 'string' },
            endDate: { type: 'string' },
            budgetHours: { type: 'number', minimum: 0 },
            budgetType: { type: 'string', enum: ['Monthly', 'Total Project'] },
            status: { type: 'string', enum: ['Active', 'Inactive'] },
            managerId: { type: 'string' },
            managerName: { type: 'string' },
            clientContactPersonId: { type: ['string', 'null'] },
            clientContactPersonName: { type: 'string' },
            assignedEmployees: { type: 'array', items: { type: 'string' } },
            monthlyBudgets: {
                type: 'array',
                items: {
                    type: 'object',
                    required: ['monthYear', 'budgetHours'],
                    properties: {
                        monthYear: { type: 'string' },
                        budgetHours: { type: 'number', minimum: 0 },
                        isLocked: { type: 'boolean' },
                    },
                },
            },
        },
    },
};
exports.updateProjectSchema = {
    params: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'string' } },
    },
    body: {
        type: 'object',
        properties: {
            name: { type: 'string', minLength: 1 },
            billingType: { type: 'string', enum: ['T&M', 'Resources Cost (Fix)', 'Project Cost (Fix)', 'Fixed RC', 'Fixed PC', 'Hourly Rate (T&M)', 'Monthly Resource Cost (Fixed)', 'Project Cost (Fixed)'] },
            rate: { type: 'string', minLength: 1 },
            businessLine: { type: 'string' },
            service: { type: 'string' },
            startDate: { type: 'string' },
            endDate: { type: 'string' },
            budgetHours: { type: 'number', minimum: 0 },
            budgetType: { type: 'string', enum: ['Monthly', 'Total Project'] },
            status: { type: 'string', enum: ['Active', 'Inactive'] },
            managerId: { type: 'string' },
            managerName: { type: 'string' },
            clientContactPersonId: { type: ['string', 'null'] },
            clientContactPersonName: { type: 'string' },
            assignedEmployees: { type: 'array', items: { type: 'string' } },
            monthlyBudgets: {
                type: 'array',
                items: {
                    type: 'object',
                    required: ['monthYear', 'budgetHours'],
                    properties: {
                        monthYear: { type: 'string' },
                        budgetHours: { type: 'number', minimum: 0 },
                        isLocked: { type: 'boolean' },
                    },
                },
            },
        },
    },
};
