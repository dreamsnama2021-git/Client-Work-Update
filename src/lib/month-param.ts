const MONTH_LABEL = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
});

/** Parses a `?month=YYYY-MM` query param into a first-of-month ISO date
 * (e.g. "2026-09-01"), defaulting to the current month. */
export function parseMonthParam(month: string | undefined): string {
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    return `${month}-01`;
  }
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

export function formatMonthLabel(monthIso: string): string {
  const [year, month] = monthIso.split("-").map(Number);
  return MONTH_LABEL.format(new Date(year, month - 1, 1));
}

export function adjacentMonths(monthIso: string) {
  const [year, month] = monthIso.split("-").map(Number);
  const current = new Date(year, month - 1, 1);

  const prev = new Date(current);
  prev.setMonth(prev.getMonth() - 1);
  const next = new Date(current);
  next.setMonth(next.getMonth() + 1);

  const toParam = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

  return { prev: toParam(prev), next: toParam(next) };
}
