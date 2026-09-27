import { FxRateService } from './fxRateService';

let schedulerInterval: NodeJS.Timeout | null = null;

export class FxScheduler {
  static async runCheck() {
    try {
      await FxRateService.autoCheckAndSyncScheduledRates('INR');
    } catch (err) {
      console.error('[FxScheduler] Error checking scheduled exchange rates:', err);
    }
  }

  static start() {
    // Run immediately on server startup
    this.runCheck();

    // Check hourly for any due calendar day slots (1st, 15th, or Month-End)
    if (!schedulerInterval) {
      schedulerInterval = setInterval(() => {
        this.runCheck();
      }, 60 * 60 * 1000);
    }
  }

  static stop() {
    if (schedulerInterval) {
      clearInterval(schedulerInterval);
      schedulerInterval = null;
    }
  }
}
