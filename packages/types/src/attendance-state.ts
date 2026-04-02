import type { AttendanceState } from "./attendance.js";

export interface AttendanceStateRecord {
  readonly employeeId: string;
  readonly state: AttendanceState;
  readonly lastEventId: string | null;
  readonly lastEventTimestamp: string | null;
}
