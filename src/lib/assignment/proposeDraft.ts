import type {
  Assignment,
  DemandTemplates,
  LaborAlert,
  ShiftCell,
  Staff,
  Submission,
  DayType,
} from "../../types";
import { SLOT_HOURS } from "../../types";

function cellKey(storeId: string, date: string, slot: string) {
  return `${storeId}|${date}|${slot}`;
}

export function getDemand(
  templates: DemandTemplates[],
  storeId: string,
  dayType: DayType,
  slot: string,
): Record<string, number> {
  const row = templates.find((t) => t.store_id === storeId);
  return row?.templates?.[dayType]?.[slot] ?? {};
}

export function requiredCount(demand: Record<string, number>): number {
  return Object.values(demand).reduce((a, b) => a + b, 0);
}

export function hoursForStaff(
  shifts: ShiftCell[],
  staffId: string,
  exclude?: { store_id: string; date: string; slot: string },
): number {
  let h = 0;
  for (const s of shifts) {
    if (
      exclude &&
      s.store_id === exclude.store_id &&
      s.date === exclude.date &&
      s.slot === exclude.slot
    ) {
      continue;
    }
    if (s.assignments.some((a) => a.staff_id === staffId)) {
      h += SLOT_HOURS[s.slot] ?? 4;
    }
  }
  return h;
}

function isAvailable(
  submissions: Submission[],
  staffId: string,
  date: string,
  slot: string,
): boolean {
  const sub = submissions.find((s) => s.staff_id === staffId);
  if (!sub) return false;
  const day = sub.days.find((d) => d.date === date);
  return Boolean(day?.slots.includes(slot));
}

function alreadyAssigned(
  shifts: ShiftCell[],
  staffId: string,
  date: string,
  slot: string,
): boolean {
  return shifts.some(
    (s) =>
      s.date === date &&
      s.slot === slot &&
      s.assignments.some((a) => a.staff_id === staffId),
  );
}

export type ProposeResult = {
  shifts: ShiftCell[];
  log: string[];
};

/** 決定的割当: 役割充足 → skill → 希望適合 → 人件費 → 労基 */
export function proposeDraft(args: {
  storeId: string;
  week: string[];
  dayTypes: Record<string, DayType>;
  templates: DemandTemplates[];
  staff: Staff[];
  submissions: Submission[];
  existing: ShiftCell[];
  status?: ShiftCell["status"];
}): ProposeResult {
  const {
    storeId,
    week,
    dayTypes,
    templates,
    staff,
    submissions,
    existing,
    status = "proposed",
  } = args;

  const storeStaff = staff.filter((s) => s.store_id === storeId);
  const other = existing.filter((s) => s.store_id !== storeId);
  const next: ShiftCell[] = [...other];
  const log: string[] = [];

  for (const date of week) {
    const dayType = dayTypes[date];
    const demandSlots = templates.find((t) => t.store_id === storeId)?.templates?.[
      dayType
    ];
    if (!demandSlots) continue;

    for (const slot of Object.keys(demandSlots)) {
      const demand = demandSlots[slot] ?? {};
      const assignments: Assignment[] = [];
      const used = new Set<string>();

      const roleOrder = Object.entries(demand).sort((a, b) => {
        if (a[0] === "リーダー") return -1;
        if (b[0] === "リーダー") return 1;
        return a[0].localeCompare(b[0], "ja");
      });

      for (const [role, needRaw] of roleOrder) {
        const need = Number(needRaw);
        const candidates = storeStaff
          .filter((s) => s.roles.includes(role))
          .filter((s) => !used.has(s.id))
          .filter((s) => !alreadyAssigned(next, s.id, date, slot))
          .filter((s) => !(s.is_minor && slot === "late"))
          .map((s) => {
            const wish = isAvailable(submissions, s.id, date, slot);
            const weekH = hoursForStaff(next, s.id) + (SLOT_HOURS[slot] ?? 4);
            const overCap = weekH > s.weekly_hours_cap;
            return { s, wish, weekH, overCap };
          })
          .sort((a, b) => {
            if (a.wish !== b.wish) return a.wish ? -1 : 1;
            if (a.overCap !== b.overCap) return a.overCap ? 1 : -1;
            if (b.s.skill_level !== a.s.skill_level)
              return b.s.skill_level - a.s.skill_level;
            return a.s.hourly_wage - b.s.hourly_wage;
          });

        let filled = 0;
        for (const c of candidates) {
          if (filled >= need) break;
          assignments.push({ staff_id: c.s.id, role });
          used.add(c.s.id);
          filled += 1;
        }

        if (filled < need) {
          log.push(
            `${date.slice(5)} ${slot}: ${role} ${filled}/${need}（不足を空欄のまま）`,
          );
        } else if (role === "キッチン" || role === "リーダー") {
          log.push(`${date.slice(5)} ${slot}: ${role}${need}名を充足`);
        }
      }

      next.push({
        store_id: storeId,
        date,
        slot,
        assignments,
        status,
      });
    }
  }

  if (log.length === 0) {
    log.push("必要人数テンプレに対し、仮シフトを生成しました");
  }

  return { shifts: next, log: log.slice(0, 6) };
}

/** 提出が増えたときの軽量仮案（対象店舗のみ draft） */
export function lightDraft(args: {
  storeId: string;
  week: string[];
  dayTypes: Record<string, DayType>;
  templates: DemandTemplates[];
  staff: Staff[];
  submissions: Submission[];
  existing: ShiftCell[];
}): ShiftCell[] {
  const confirmed = args.existing.filter(
    (s) => s.store_id === args.storeId && s.status === "confirmed",
  );
  if (confirmed.length > 0) return args.existing;

  const { shifts } = proposeDraft({ ...args, status: "draft" });
  return shifts;
}

export function findCell(
  shifts: ShiftCell[],
  storeId: string,
  date: string,
  slot: string,
): ShiftCell | undefined {
  return shifts.find(
    (s) =>
      s.store_id === storeId && s.date === date && s.slot === slot,
  );
}

export function upsertCell(
  shifts: ShiftCell[],
  cell: ShiftCell,
): ShiftCell[] {
  const key = cellKey(cell.store_id, cell.date, cell.slot);
  const rest = shifts.filter(
    (s) => cellKey(s.store_id, s.date, s.slot) !== key,
  );
  return [...rest, cell];
}

export function computeLaborAlerts(
  shifts: ShiftCell[],
  staff: Staff[],
): LaborAlert[] {
  const alerts: LaborAlert[] = [];
  for (const s of staff) {
    const h = hoursForStaff(shifts, s.id);
    const cap = s.weekly_hours_cap;
    if (h > cap) {
      alerts.push({
        level: "red",
        staff_id: s.id,
        message: `${s.name}: 今週${h.toFixed(1)}h — 上限${cap}hを超過`,
      });
    } else if (h >= cap - (SLOT_HOURS.dinner ?? 5)) {
      alerts.push({
        level: "amber",
        staff_id: s.id,
        message: `${s.name}: 今週${h.toFixed(1)}h — あと1シフトで上限接近`,
      });
    }

    for (const cell of shifts) {
      if (
        cell.slot === "late" &&
        s.is_minor &&
        cell.assignments.some((a) => a.staff_id === s.id)
      ) {
        alerts.push({
          level: "red",
          staff_id: s.id,
          message: `${s.name}: 未成年の22時以降勤務`,
        });
      }
    }
  }
  return alerts;
}

export function estimatePayroll(
  shifts: ShiftCell[],
  staff: Staff[],
  storeId?: string,
): number {
  const byId = new Map(staff.map((s) => [s.id, s]));
  let total = 0;
  for (const cell of shifts) {
    if (storeId && cell.store_id !== storeId) continue;
    for (const a of cell.assignments) {
      const st = byId.get(a.staff_id);
      if (!st) continue;
      const hours = SLOT_HOURS[cell.slot] ?? 4;
      const base = st.hourly_wage * hours;
      const night = cell.slot === "late" ? base * 0.25 : 0;
      total += base + night;
    }
  }
  return Math.round(total);
}

export function laborCostRate(
  payroll: number,
  assumedSales: number,
): number {
  if (assumedSales <= 0) return 0;
  return Math.round((payroll / assumedSales) * 1000) / 10;
}
