export const getBillingSummarySchema = {
  querystring: {
    type: 'object',
    properties: {
      fy: { type: 'string' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        totalRevenueINR: { type: 'number' },
        tmRevenueINR: { type: 'number' },
        monthlyFixedRevenueINR: { type: 'number' },
        projectFixedRevenueINR: { type: 'number' },
        totalHoursLogged: { type: 'number' },
        activeProjectsCount: { type: 'number' },
        activeMonthYear: { type: 'string' },
        exchangeRates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              currency: { type: 'string' },
              rateToINR: { type: 'number' },
              monthYear: { type: 'string' },
              isLocked: { type: 'boolean' },
              source: { type: 'string' },
            },
          },
        },
        projects: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              projectId: { type: 'string' },
              projectName: { type: 'string' },
              clientId: { type: 'string' },
              clientName: { type: 'string' },
              billingType: { type: 'string' },
              currency: { type: 'string' },
              rateAmount: { type: 'number' },
              rateFormatted: { type: 'string' },
              budgetHours: { type: 'number' },
              loggedHours: { type: 'number' },
              nativeAmountBilled: { type: 'number' },
              exchangeRateToINR: { type: 'number' },
              inrAmountBilled: { type: 'number' },
              status: { type: 'string' },
              effectiveStartDate: { type: 'string' },
            },
          },
        },
      },
    },
  },
};

export const addRateVersionSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' },
    },
  },
  body: {
    type: 'object',
    required: ['billingType', 'rateAmount', 'currency', 'effectiveStartDate'],
    properties: {
      billingType: { type: 'string', enum: ['T&M', 'Fixed RC', 'Fixed PC', 'Hourly Rate (T&M)', 'Monthly Resource Cost (Fixed)', 'Monthly Res Cost (Fixed)', 'Project Cost (Fixed)'] },
      rateAmount: { type: 'number', minimum: 0 },
      currency: { type: 'string', minLength: 1 },
      effectiveStartDate: { type: 'string', minLength: 4 },
      effectiveEndDate: { type: 'string' },
      notes: { type: 'string' },
    },
  },
};
