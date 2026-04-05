import { AttendanceStates } from "@hr-attendance-app/types";
import type { AttendanceState } from "@hr-attendance-app/types";
import type { theme } from "../theme/theme";

export type ThemeColorKey = keyof typeof theme.colors;
type BadgeVariant = "success" | "info" | "warning";

export interface AttendanceStatusEntry {
  readonly labelKey: string;
  readonly color: ThemeColorKey;
  readonly variant: BadgeVariant;
}

export const ATTENDANCE_STATUS_CONFIG: Record<AttendanceState, AttendanceStatusEntry> = {
  [AttendanceStates.IDLE]: { labelKey: "dashboard.statusIdle", color: "textMuted", variant: "success" },
  [AttendanceStates.CLOCKED_IN]: { labelKey: "dashboard.statusWorking", color: "accent", variant: "info" },
  [AttendanceStates.ON_BREAK]: { labelKey: "dashboard.statusBreak", color: "warning", variant: "warning" },
};
