import type { RawPolicy } from "@willdesign-hr/types";
import { JP_LABOR } from "@willdesign-hr/types";

/** 契約社員 — JP contract employee. Deemed overtime 45h. */
export const jpContractPolicy: RawPolicy = {
  overtime: {
    deemedHours: JP_LABOR.DEEMED_OVERTIME_HOURS,
  },
  probation: {
    durationMonths: 3,
    leaveAllowed: false,
    noticePeriodDays: 30,
  },
};
