import type { RawPolicy } from "@willdesign-hr/types";
import { JP_LABOR } from "@willdesign-hr/types";

/** 正社員 — JP full-time employee. Deemed overtime 45h included. */
export const jpFulltimePolicy: RawPolicy = {
  overtime: {
    deemedHours: JP_LABOR.DEEMED_OVERTIME_HOURS,
  },
};
