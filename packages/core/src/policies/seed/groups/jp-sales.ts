import type { RawPolicy } from "@willdesign-hr/types";

/** JP sales — deemed overtime 45h, commission tracking enabled. */
export const jpSalesPolicy: RawPolicy = {
  overtime: {
    deemedHours: 45,
  },
  compensation: {
    commissionTracking: true,
  },
};
