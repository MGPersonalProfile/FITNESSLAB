const TZ = "Europe/Madrid";

/**
 * Today's date in Madrid time as YYYY-MM-DD.
 * Pass this explicitly into INSERTs so log_date is never UTC-shifted.
 */
export function todayMadrid(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** YYYY-MM-DD for a given Date in Madrid time. */
export function dateKeyMadrid(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/** Human-readable date label, e.g. "MIÉ · 15 MAY" */
export function formatDayLabel(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`);
  const weekday = new Intl.DateTimeFormat("es-ES", {
    timeZone: TZ,
    weekday: "short",
  })
    .format(d)
    .replace(".", "")
    .toUpperCase();
  const dayMonth = new Intl.DateTimeFormat("es-ES", {
    timeZone: TZ,
    day: "2-digit",
    month: "short",
  })
    .format(d)
    .replace(".", "")
    .toUpperCase();
  return `${weekday} · ${dayMonth}`;
}

/** "HOY", "AYER" or human date depending on offset. */
export function formatRelativeDay(iso: string): string {
  const today = todayMadrid();
  if (iso === today) return "HOY";
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (iso === dateKeyMadrid(yesterday)) return "AYER";
  return formatDayLabel(iso);
}

/** Time-of-day label from a timestamptz string, e.g. "13:42" */
export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

/** 3-letter weekday + day for streak/calendar tickers. */
export function shortDay(d: Date): string {
  return new Intl.DateTimeFormat("es-ES", {
    timeZone: TZ,
    weekday: "narrow",
  })
    .format(d)
    .toUpperCase();
}
