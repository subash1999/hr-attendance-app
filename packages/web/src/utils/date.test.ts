import { describe, it, expect } from "vitest";
import {
  formatDate, formatDateLong, formatTime, formatDateTime, formatYearMonth, formatRelative,
  localDateToIso, localDateTimeToIso, localMonthToIso,
  isoToLocalDate, isoToLocalDateTime, isoToLocalMonth,
} from "./date";

describe("date utils", () => {
  describe("formatDate", () => {
    it("formats ISO date to short localized string", () => {
      const result = formatDate("2026-04-03T09:00:00Z");
      expect(result).toContain("2026");
      expect(result).toContain("3");
    });
  });

  describe("formatDateLong", () => {
    it("formats ISO date with full month name", () => {
      const result = formatDateLong("2026-04-03T09:00:00Z");
      expect(result).toContain("2026");
      expect(result).toMatch(/April|4月/);
    });
  });

  describe("formatTime", () => {
    it("formats time portion of ISO string", () => {
      const result = formatTime("2026-04-03T09:30:00Z");
      expect(result).toMatch(/\d{1,2}:\d{2}/);
    });
  });

  describe("formatDateTime", () => {
    it("formats both date and time", () => {
      const result = formatDateTime("2026-04-03T09:00:00Z");
      expect(result).toContain("2026");
      expect(result).toMatch(/\d{1,2}:\d{2}/);
    });
  });

  describe("formatYearMonth", () => {
    it("formats year-month string to localized display", () => {
      const result = formatYearMonth("2026-04");
      expect(result).toContain("2026");
      expect(result).toMatch(/April|4月/);
    });
  });

  describe("localDateToIso", () => {
    it("converts local date string to ISO UTC", () => {
      const iso = localDateToIso("2026-04-03");
      expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
    });
  });

  describe("localDateTimeToIso", () => {
    it("converts local datetime-local string to ISO UTC", () => {
      const iso = localDateTimeToIso("2026-04-03T09:30");
      expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
    });
  });

  describe("localMonthToIso", () => {
    it("converts month input to ISO UTC", () => {
      const iso = localMonthToIso("2026-04");
      expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
    });
  });

  describe("isoToLocalDate", () => {
    it("converts ISO to YYYY-MM-DD for date input", () => {
      const local = isoToLocalDate(new Date(2026, 3, 3).toISOString());
      expect(local).toBe("2026-04-03");
    });
  });

  describe("isoToLocalDateTime", () => {
    it("converts ISO to datetime-local format", () => {
      const local = isoToLocalDateTime(new Date(2026, 3, 3, 9, 30).toISOString());
      expect(local).toBe("2026-04-03T09:30");
    });
  });

  describe("isoToLocalMonth", () => {
    it("converts ISO to YYYY-MM for month input", () => {
      const local = isoToLocalMonth(new Date(2026, 3, 3).toISOString());
      expect(local).toBe("2026-04");
    });
  });

  describe("formatRelative", () => {
    it("returns relative time string", () => {
      const oneHourAgo = new Date(Date.now() - 3_600_000).toISOString();
      const result = formatRelative(oneHourAgo);
      expect(result).toMatch(/hour|時間/);
    });

    it("handles future dates", () => {
      const tomorrow = new Date(Date.now() + 86_400_000).toISOString();
      const result = formatRelative(tomorrow);
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
