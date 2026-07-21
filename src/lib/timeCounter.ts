import { BASELINE_MONTH_HOURS } from "../types";

export function formatHoursPair(savedMinutes: number): {
  before: string;
  after: string;
  savedHours: number;
} {
  const savedHours = Math.round((savedMinutes / 60) * 10) / 10;
  const after = Math.max(0, Math.round((BASELINE_MONTH_HOURS - savedHours) * 10) / 10);
  return {
    before: String(BASELINE_MONTH_HOURS),
    after: String(after),
    savedHours,
  };
}

export const TIME_REWARDS = {
  propose: 90,
  confirm: 45,
  absence: 40,
} as const;
