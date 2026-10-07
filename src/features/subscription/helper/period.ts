import type { DurationUnit } from "@/generated/prisma/enums";

/**
 * PRD §13: startDate is the approval date, endDate is startDate plus the plan
 * duration. Calendar units are added in UTC so a period never drifts by a day
 * because the server happens to run in a non-UTC timezone.
 */
function addDuration(
  start: Date,
  duration: number,
  unit: DurationUnit,
): Date {
  const end = new Date(start.getTime());

  switch (unit) {
    case "DAY":
      end.setUTCDate(end.getUTCDate() + duration);
      return end;
    case "MONTH":
      end.setUTCMonth(end.getUTCMonth() + duration);
      return end;
    case "YEAR":
      end.setUTCFullYear(end.getUTCFullYear() + duration);
      return end;
  }
}

/**
 * PRD §14: a renewal approved while the previous period is still running starts
 * after that period ends; otherwise it starts at approval time.
 */
export function computePeriod(
  approvedAt: Date,
  duration: number,
  unit: DurationUnit,
  previousEndDate: Date | null,
): { startDate: Date; endDate: Date } {
  const startsAfterCurrentPeriod =
    previousEndDate !== null && previousEndDate.getTime() > approvedAt.getTime();

  const startDate = startsAfterCurrentPeriod ? previousEndDate : approvedAt;

  return { startDate, endDate: addDuration(startDate, duration, unit) };
}
