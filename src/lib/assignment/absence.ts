import type { AbsenceCandidate, ShiftCell, Staff, Submission } from "../../types";
import { SLOT_HOURS } from "../../types";
import { findCell, hoursForStaff } from "./proposeDraft";

function hasWish(
  submissions: Submission[],
  staffId: string,
  date: string,
  slot: string,
): boolean {
  const sub = submissions.find((s) => s.staff_id === staffId);
  const day = sub?.days.find((d) => d.date === date);
  return Boolean(day?.slots.includes(slot));
}

export function findAbsenceCandidates(args: {
  absentStaffId: string;
  storeId: string;
  date: string;
  slot: string;
  role: string;
  staff: Staff[];
  shifts: ShiftCell[];
  submissions: Submission[];
  preferredIds?: string[];
}): { local: AbsenceCandidate[]; cross: AbsenceCandidate[] } {
  const {
    absentStaffId,
    storeId,
    date,
    slot,
    role,
    staff,
    shifts,
    submissions,
    preferredIds = [],
  } = args;

  const cell = findCell(shifts, storeId, date, slot);
  const assigned = new Set(cell?.assignments.map((a) => a.staff_id) ?? []);
  assigned.add(absentStaffId);

  const scoreOne = (s: Staff, crossStore: boolean): AbsenceCandidate => {
    const wish = hasWish(submissions, s.id, date, slot);
    const weekH = hoursForStaff(shifts, s.id);
    const prefBoost = preferredIds.includes(s.id) ? 20 : 0;
    const score =
      prefBoost +
      s.skill_level * 10 +
      (wish ? 15 : 0) +
      (weekH < s.weekly_hours_cap - 4 ? 8 : 0) -
      s.absence_rate +
      (crossStore ? -5 : 0);
    const extraCost = Math.round(
      s.hourly_wage * (SLOT_HOURS[slot] ?? 4) * (crossStore ? 1.1 : 1),
    );
    return {
      staff_id: s.id,
      score,
      reason: [
        wish ? "希望あり" : "希望外可",
        `skill${s.skill_level}`,
        `今週${weekH.toFixed(0)}h`,
      ].join("・"),
      extraCost,
      crossStore,
    };
  };

  const local = staff
    .filter((s) => s.store_id === storeId)
    .filter((s) => s.id !== absentStaffId)
    .filter((s) => s.roles.includes(role))
    .filter((s) => !assigned.has(s.id))
    .filter((s) => !(s.is_minor && slot === "late"))
    .map((s) => scoreOne(s, false))
    .sort((a, b) => b.score - a.score);

  const cross = staff
    .filter((s) => s.store_id !== storeId)
    .filter((s) => s.can_help_stores.includes(storeId))
    .filter((s) => s.roles.includes(role) || s.roles.includes("フロア"))
    .filter((s) => !assigned.has(s.id))
    .map((s) => {
      const c = scoreOne(s, true);
      const home = staff.find((x) => x.id === s.id);
      c.shuffleNote = home
        ? `${home.store_id === "st02" ? "関内店" : "他店"}の${home.name}を応援配置。自店ランチは1名減でも過去実績上、影響は軽微`
        : undefined;
      return c;
    })
    .sort((a, b) => b.score - a.score);

  return { local, cross };
}

export function countHelpPool(
  staff: Staff[],
  storeId: string,
  role: string,
): number {
  return staff.filter(
    (s) =>
      (s.store_id === storeId || s.can_help_stores.includes(storeId)) &&
      s.roles.includes(role),
  ).length;
}
