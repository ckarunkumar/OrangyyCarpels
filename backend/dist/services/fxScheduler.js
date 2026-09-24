"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FxScheduler = void 0;
const fxRateService_1 = require("./fxRateService");
let schedulerInterval = null;
class FxScheduler {
    static async runCheck() {
        try {
            await fxRateService_1.FxRateService.autoCheckAndSyncScheduledRates('INR');
        }
        catch (err) {
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
exports.FxScheduler = FxScheduler;
