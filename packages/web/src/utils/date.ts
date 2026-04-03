import i18n from "../i18n/index";

const LOCALE_MAP: Record<string, string> = {
  en: "en-US",
  ja: "ja-JP",
  ne: "ne-NP",
};

function getLocale(): string {
  return LOCALE_MAP[i18n.language] ?? "en-US";
}

/** "Apr 3, 2026" or "2026年4月3日" */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(getLocale(), {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** "April 3, 2026" or "2026年4月3日" — full month name */
export function formatDateLong(iso: string): string {
  return new Date(iso).toLocaleDateString(getLocale(), {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** "9:00 AM" or "9:00" */
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(getLocale(), {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** "Apr 3, 2026, 9:00 AM" */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(getLocale(), {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** "2026-04" → "April 2026" or "2026年4月" */
export function formatYearMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString(getLocale(), {
    year: "numeric",
    month: "long",
  });
}

// ─── Input conversion: local form values → ISO for API ───

/** Local date input "2026-04-03" → ISO UTC string "2026-04-03T00:00:00.000Z" */
export function localDateToIso(localDate: string): string {
  return new Date(localDate + "T00:00:00").toISOString();
}

/** Local datetime-local input "2026-04-03T09:30" → ISO UTC string */
export function localDateTimeToIso(localDateTime: string): string {
  return new Date(localDateTime).toISOString();
}

/** Local month input "2026-04" → ISO start-of-month UTC */
export function localMonthToIso(yearMonth: string): string {
  return new Date(yearMonth + "-01T00:00:00").toISOString();
}

// ─── API response → local form values ───

/** ISO string → "2026-04-03" for <input type="date"> */
export function isoToLocalDate(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** ISO string → "2026-04-03T09:30" for <input type="datetime-local"> */
export function isoToLocalDateTime(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${mo}-${day}T${h}:${mi}`;
}

/** ISO string → "2026-04" for <input type="month"> */
export function isoToLocalMonth(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// ─── Display helpers ───

/** Relative time: "2 hours ago", "in 3 days" */
export function formatRelative(iso: string): string {
  const rtf = new Intl.RelativeTimeFormat(getLocale(), { numeric: "auto" });
  const diffMs = new Date(iso).getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / 60_000);
  const diffHours = Math.round(diffMs / 3_600_000);
  const diffDays = Math.round(diffMs / 86_400_000);

  if (Math.abs(diffMinutes) < 60) return rtf.format(diffMinutes, "minute");
  if (Math.abs(diffHours) < 24) return rtf.format(diffHours, "hour");
  return rtf.format(diffDays, "day");
}
