import type { Staff, Submission, ShiftCell } from "../types";

/** skill → 現場で通じる役職ラベル（時給・skill数値は出さない） */
export function titleLabel(s: Staff): string {
  if (s.roles.includes("キッチン") && !s.roles.includes("フロア")) {
    if (s.skill_level >= 5) return "キッチンリーダー";
    if (s.skill_level >= 4) return "キッチン主任";
    return "キッチン";
  }
  if (s.skill_level >= 5 && s.roles.includes("リーダー")) return "店長代理";
  if (s.skill_level >= 5) return "チーフマネージャー";
  if (s.skill_level >= 4) return "マネージャー";
  if (s.skill_level >= 3) return "サブマネージャー";
  if (s.roles.includes("フロア") || s.roles.includes("リーダー")) return "フロア";
  return "ホール";
}

export function contractBlurb(
  s: Staff,
  submission?: Submission,
): string {
  const parts: string[] = [];
  if (s.is_minor) parts.push("22時以降不可");
  if (s.weekly_hours_cap <= 20) parts.push("短時間");
  else if (s.weekly_hours_cap <= 28) parts.push(`週${s.weekly_hours_cap}h上限`);

  const slots = submission?.days.flatMap((d) => d.slots) ?? [];
  const dinner = slots.filter((x) => x === "dinner" || x === "late").length;
  const lunch = slots.filter((x) => x === "lunch").length;
  if (dinner > lunch + 1) parts.push("夜メイン");
  else if (lunch > dinner + 1) parts.push("ランチメイン");

  if (parts.length === 0) parts.push("週シフト応相談");
  return parts.join("・");
}

export function assignmentsThisWeek(
  shifts: ShiftCell[],
  staffId: string,
  slotLabels: Record<string, string>,
  storeNames: Record<string, string>,
): string[] {
  return shifts
    .filter((c) => c.assignments.some((a) => a.staff_id === staffId))
    .sort((a, b) => a.date.localeCompare(b.date) || a.slot.localeCompare(b.slot))
    .map((c) => {
      const role =
        c.assignments.find((a) => a.staff_id === staffId)?.role ?? "";
      return `${c.date.slice(5)} ${slotLabels[c.slot] ?? c.slot}・${storeNames[c.store_id] ?? c.store_id}（${role}）`;
    });
}
