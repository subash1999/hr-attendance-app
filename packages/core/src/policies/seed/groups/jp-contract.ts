import type { RawPolicy } from "@willdesign-hr/types";

/** 契約社員 — JP contract employee. Deemed overtime 45h. */
export const jpContractPolicy: RawPolicy = {
  overtime: {
    deemedHours: 45,
  },
  probation: {
    durationMonths: 3,
    leaveAllowed: false,
    noticePeriodDays: 30,
  },
};
