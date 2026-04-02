import type { RawPolicy } from "@willdesign-hr/types";
import { JP_LABOR } from "@willdesign-hr/types";

/** JP sales — deemed overtime 45h, commission tracking enabled. */
export const jpSalesPolicy: RawPolicy = {
  overtime: {
    deemedHours: JP_LABOR.DEEMED_OVERTIME_HOURS,
  },
  compensation: {
    commissionTracking: true,
  },
};
