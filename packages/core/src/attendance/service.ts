import type { AttendanceAction, AttendanceEvent, AttendanceSource, AttendanceStateRecord, AttendanceLock, AttendanceLockScope, Result, WorkLocation } from "@hr-attendance-app/types";
import type { AuditSource } from "@hr-attendance-app/types";
import { AuditActions, ATTENDANCE, AttendanceLockScopes, ErrorMessages, KeyPatterns, KeyPrefixes, HOURS, dateToIso, dateToDateStr, isoToDateStr, isoToYearMonth, addDays, nowIso, nowMs } from "@hr-attendance-app/types";
import type { AttendanceRepository, AuditRepository, AttendanceLockRepository, EmployeeRepository } from "../repositories/index.js";
import { validateTransition } from "./state-machine.js";
import { calculateDailyHours } from "./hours-calculator.js";
import type { HoursBreakdown } from "./hours-calculator.js";

export interface ProcessEventInput {
  readonly employeeId: string;
  readonly action: AttendanceAction;
  readonly timestamp: Date;
  readonly source: AttendanceSource;
  readonly actorId: string;
  readonly workLocation?: WorkLocation;
  readonly isEmergency?: boolean;
}

export interface CreateAttendanceLockInput {
  readonly scope: AttendanceLockScope;
  readonly yearMonth: string;
  readonly groupId?: string;
  readonly employeeId?: string;
  readonly lockedBy: string;
}

export class AttendanceService {
  constructor(
    private readonly attendanceRepo: AttendanceRepository,
    private readonly auditRepo: AuditRepository,
    private readonly lockRepo: AttendanceLockRepository,
    private readonly employeeRepo: EmployeeRepository,
  ) {}

  async getState(employeeId: string): Promise<AttendanceStateRecord> {
    return this.attendanceRepo.getState(employeeId);
  }

  async getEventsForDate(employeeId: string, date: string): Promise<readonly AttendanceEvent[]> {
    return this.attendanceRepo.getEventsForDate(employeeId, date);
  }

  async getEventsForMonth(employeeId: string, yearMonth: string): Promise<readonly AttendanceEvent[]> {
    return this.attendanceRepo.getEventsForMonth(employeeId, yearMonth);
  }

  async getSummary(employeeId: string, date: string): Promise<{
    hoursToday: number;
    hoursWeek: number;
    hoursMonth: number;
    breakMinutesToday: number;
    requiredDaily: number;
    requiredWeekly: number;
    requiredMonthly: number;
  }> {
    const yearMonth = isoToYearMonth(date + "T00:00:00Z");
    const monthEvents = await this.attendanceRepo.getEventsForMonth(employeeId, yearMonth);

    // Group month events by date
    const dailyMap = new Map<string, AttendanceEvent[]>();
    for (const evt of monthEvents) {
      const evtDate = isoToDateStr(evt.timestamp);
      const list = dailyMap.get(evtDate) ?? [];
      list.push(evt);
      dailyMap.set(evtDate, list);
    }

    // Today's hours (with open-session elapsed time)
    const todayEvents = dailyMap.get(date) ?? [];
    const todayBreakdown = calculateDailyHours(todayEvents, 0);
    const hoursToday = this.addOpenSessionHours(todayBreakdown);
    const breakMinutesToday = Math.round(todayBreakdown.breakHours * 60);

    // Week date range (Monday to Sunday containing `date`)
    const dateObj = new Date(date + "T00:00:00Z");
    const dayOfWeek = dateObj.getUTCDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const mondayStr = isoToDateStr(addDays(dateObj, mondayOffset).toISOString());
    const sundayStr = isoToDateStr(addDays(dateObj, mondayOffset + 6).toISOString());

    // Accumulate week + month from the grouped map
    let hoursWeek = 0;
    let hoursMonth = 0;
    for (const [dayDate, dayEvents] of dailyMap) {
      const dayHours = dayDate === date
        ? hoursToday
        : calculateDailyHours(dayEvents, 0).workedHours;
      hoursMonth += dayHours;
      // Include days up to today within the week range
      if (dayDate >= mondayStr && dayDate <= sundayStr && dayDate <= date) {
        hoursWeek += dayHours;
      }
    }

    return {
      hoursToday: Math.round(hoursToday * 100) / 100,
      hoursWeek: Math.round(hoursWeek * 100) / 100,
      hoursMonth: Math.round(hoursMonth * 100) / 100,
      breakMinutesToday,
      requiredDaily: HOURS.DAILY_MINIMUM,
      requiredWeekly: HOURS.WEEKLY_MINIMUM,
      requiredMonthly: HOURS.MONTHLY_FULL_TIME,
    };
  }

  /** Add elapsed time from an open (unclosed) session to worked hours. */
  private addOpenSessionHours(breakdown: HoursBreakdown): number {
    let hours = breakdown.workedHours;
    const openSession = breakdown.sessions.find((s) => !s.clockOut);
    if (openSession) {
      const clockInMs = new Date(openSession.clockIn).getTime();
      const currentMs = nowMs();
      const openBreakMs = openSession.breaks
        .filter((b) => !b.end)
        .reduce((acc, b) => acc + (currentMs - new Date(b.start).getTime()), 0);
      const closedBreakMs = openSession.breaks
        .filter((b) => b.end)
        .reduce((acc, b) => acc + (new Date(b.end!).getTime() - new Date(b.start).getTime()), 0);
      const elapsedMs = currentMs - clockInMs - openBreakMs - closedBreakMs;
      hours += Math.round((elapsedMs / 3_600_000) * 100) / 100;
    }
    return hours;
  }

  async getTeamStates(employeeIds: readonly string[]): Promise<readonly AttendanceStateRecord[]> {
    return Promise.all(employeeIds.map((id) => this.attendanceRepo.getState(id)));
  }

  async editEvent(
    eventId: string,
    employeeId: string,
    updates: { timestamp?: string; action?: string; reason: string },
    actorId: string,
    source: AuditSource,
  ): Promise<Result<AttendanceEvent, string>> {
    const event = await this.attendanceRepo.getEventById(eventId, employeeId);
    if (!event) return { success: false, error: "Event not found" };

    const yearMonth = isoToYearMonth(event.timestamp);
    const locks = await this.lockRepo.findByYearMonth(yearMonth);
    if (locks.length > 0) {
      return { success: false, error: ErrorMessages.PERIOD_LOCKED };
    }

    const updatedEvent: AttendanceEvent = {
      ...event,
      ...(updates.timestamp ? { timestamp: updates.timestamp } : {}),
      ...(updates.action ? { action: updates.action as AttendanceEvent["action"] } : {}),
    };

    await this.attendanceRepo.saveEvent(updatedEvent);
    await this.auditRepo.append({
      id: KeyPatterns.audit(eventId),
      targetId: employeeId,
      targetType: KeyPrefixes.ATTENDANCE,
      action: AuditActions.UPDATE,
      actorId,
      source,
      before: { id: event.id, action: event.action, timestamp: event.timestamp, source: event.source },
      after: { id: updatedEvent.id, action: updatedEvent.action, timestamp: updatedEvent.timestamp, editReason: updates.reason },
      timestamp: nowIso(),
    });

    return { success: true, data: updatedEvent };
  }

  async createLock(input: CreateAttendanceLockInput): Promise<Result<AttendanceLock, string>> {
    let sk: string;
    if (input.scope === AttendanceLockScopes.COMPANY) {
      sk = KeyPatterns.lockSkCompany;
    } else if (input.scope === AttendanceLockScopes.GROUP) {
      sk = KeyPatterns.lockSkGroup(input.groupId!);
    } else {
      sk = KeyPatterns.lockSkEmployee(input.employeeId!);
    }

    const lock: AttendanceLock = {
      id: `${KeyPatterns.lock(input.yearMonth)}#${sk}`,
      scope: input.scope,
      yearMonth: input.yearMonth,
      groupId: input.groupId,
      employeeId: input.employeeId,
      lockedBy: input.lockedBy,
      lockedAt: nowIso(),
    };

    try {
      const saved = await this.lockRepo.save(lock);
      return { success: true, data: saved };
    } catch (err) {
      if (err instanceof Error && err.message.includes("ConditionalCheckFailed")) {
        return { success: false, error: ErrorMessages.LOCK_ALREADY_EXISTS };
      }
      throw err;
    }
  }

  async removeLock(yearMonth: string, scope: AttendanceLockScope, targetId?: string): Promise<void> {
    await this.lockRepo.delete(yearMonth, scope, targetId);
  }

  async getLocksForMonth(yearMonth: string): Promise<readonly AttendanceLock[]> {
    return this.lockRepo.findByYearMonth(yearMonth);
  }

  async processEvent(input: ProcessEventInput): Promise<Result<AttendanceEvent, string>> {
    // Lock enforcement — check most specific scope first
    const lockCheckResult = await this.checkLocks(input.employeeId, input.timestamp);
    if (lockCheckResult) return lockCheckResult;

    const state = await this.attendanceRepo.getState(input.employeeId);

    // Idempotency + temporal ordering check
    if (state.lastEventTimestamp) {
      const lastTime = new Date(state.lastEventTimestamp).getTime();
      const newTime = input.timestamp.getTime();
      const delta = newTime - lastTime;

      if (delta < 0) {
        return { success: false, error: ErrorMessages.EVENT_BEFORE_LAST };
      }

      if (delta < ATTENDANCE.IDEMPOTENCY_WINDOW_MS) {
        return { success: false, error: ErrorMessages.TOO_FAST };
      }
    }

    // Validate transition
    const transition = validateTransition(
      state.state,
      input.action,
      state.lastEventTimestamp ?? dateToIso(input.timestamp),
    );

    if (!transition.success) {
      return { success: false, error: transition.error };
    }

    // Build event
    const event: AttendanceEvent = {
      id: KeyPatterns.attendanceEvent(dateToDateStr(input.timestamp), dateToIso(input.timestamp)),
      employeeId: input.employeeId,
      action: input.action,
      timestamp: dateToIso(input.timestamp),
      source: input.source,
      workLocation: input.workLocation,
      isEmergency: input.isEmergency,
    };

    // Persist event + state + audit
    await this.attendanceRepo.saveEvent(event);
    await this.attendanceRepo.saveState(input.employeeId, {
      employeeId: input.employeeId,
      state: transition.newState,
      lastEventId: event.id,
      lastEventTimestamp: event.timestamp,
    });
    await this.auditRepo.append({
      id: KeyPatterns.audit(event.id),
      targetId: input.employeeId,
      targetType: KeyPrefixes.ATTENDANCE,
      action: AuditActions.UPDATE,
      actorId: input.actorId,
      source: input.source,
      before: { state: state.state, action: input.action },
      after: { state: transition.newState },
      timestamp: event.timestamp,
    });

    return { success: true, data: event };
  }

  private async checkLocks(employeeId: string, timestamp: Date): Promise<Result<never, string> | null> {
    const yearMonth = isoToYearMonth(dateToIso(timestamp));
    const locks = await this.lockRepo.findByYearMonth(yearMonth);
    if (locks.length === 0) return null;

    // Employee-scope: most specific, blocks individual even if company/group unlocked
    const employeeLock = locks.find(
      l => l.scope === AttendanceLockScopes.EMPLOYEE && l.employeeId === employeeId,
    );
    if (employeeLock) {
      return { success: false, error: ErrorMessages.PERIOD_LOCKED };
    }

    // Group-scope: blocks by employment type
    const groupLocks = locks.filter(l => l.scope === AttendanceLockScopes.GROUP);
    if (groupLocks.length > 0) {
      const employee = await this.employeeRepo.findById(employeeId);
      if (employee) {
        const matchingGroupLock = groupLocks.find(l => l.groupId === employee.employmentType);
        if (matchingGroupLock) {
          return { success: false, error: ErrorMessages.PERIOD_LOCKED };
        }
      }
    }

    // Company-scope: broadest, blocks everyone
    const companyLock = locks.find(l => l.scope === AttendanceLockScopes.COMPANY);
    if (companyLock) {
      return { success: false, error: ErrorMessages.PERIOD_LOCKED };
    }

    return null;
  }
}
