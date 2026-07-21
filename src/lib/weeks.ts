import type { DayType } from "../types";

const DAY_TYPES_CYCLE: DayType[] = [
  "平日",
  "平日",
  "平日",
  "平日",
  "金曜",
  "土日",
  "土日",
];

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function buildNextWeek(thisWeek: string[]): {
  week: string[];
  dayTypes: Record<string, DayType>;
} {
  const week = thisWeek.map((d) => addDays(d, 7));
  const dayTypes: Record<string, DayType> = {};
  week.forEach((d, i) => {
    dayTypes[d] = DAY_TYPES_CYCLE[i] ?? "平日";
  });
  return { week, dayTypes };
}

export const WEEKDAY_SHORT = ["月", "火", "水", "木", "金", "土", "日"];
