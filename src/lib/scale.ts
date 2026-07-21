import type { MinatoyaData, ScaleMode, Staff, Store, Submission } from "../types";

/** seed固定 LCG */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

const LAST = [
  "加藤",
  "吉田",
  "山田",
  "佐々木",
  "松本",
  "井上",
  "木村",
  "林",
  "斎藤",
  "清水",
  "山本",
  "中村",
  "小林",
  "池田",
  "橋本",
];
const FIRST = [
  "陽菜",
  "結衣",
  "颯太",
  "大翔",
  "美月",
  "湊",
  "蒼",
  "莉子",
  "悠真",
  "咲良",
  "樹",
  "心春",
  "陸",
  "彩",
  "蓮",
];

function pickName(rand: () => number, used: Set<string>): string {
  for (let i = 0; i < 80; i++) {
    const n = `${LAST[Math.floor(rand() * LAST.length)]} ${FIRST[Math.floor(rand() * FIRST.length)]}`;
    if (!used.has(n)) {
      used.add(n);
      return n;
    }
  }
  const n = `生成 ${Math.floor(rand() * 10000)}`;
  used.add(n);
  return n;
}

function skillFromDist(rand: () => number): number {
  const r = rand();
  if (r < 0.15) return 1;
  if (r < 0.45) return 2;
  if (r < 0.8) return 3;
  if (r < 0.95) return 4;
  return 5;
}

export function generateScaleStaff(
  data: MinatoyaData,
  activeStoreIds: string[],
): Staff[] {
  const base = data.staff.filter((s) => activeStoreIds.includes(s.store_id));
  const needGenerate = activeStoreIds.filter((id) =>
    data.stores.find((st) => st.id === id)?.scale_mode_only,
  );
  if (needGenerate.length === 0) return base;

  const rand = rng(42);
  const usedNames = new Set(data.staff.map((s) => s.name));
  const generated: Staff[] = [];
  let seq = 100;

  for (const storeId of needGenerate) {
    const count = data.scale_mode_spec.count_per_store[storeId] ?? 10;
    const store = data.stores.find((s) => s.id === storeId);
    const areaStores = data.stores
      .filter((s) => s.area === store?.area && s.id !== storeId)
      .map((s) => s.id);

    for (let i = 0; i < count; i++) {
      const isLeader = i === 0;
      const isKitchen = !isLeader && rand() < 0.4;
      const roles = isLeader
        ? ["フロア", "リーダー"]
        : isKitchen
          ? ["キッチン"]
          : ["フロア"];
      const wageBase = isLeader ? 1350 : isKitchen ? 1220 : 1120;
      const canHelp =
        rand() < 0.3
          ? areaStores.slice(0, 1 + Math.floor(rand() * Math.min(2, areaStores.length)))
          : [];
      generated.push({
        id: `stf${seq++}`,
        name: pickName(rand, usedNames),
        store_id: storeId,
        roles,
        skill_level: isLeader ? 5 : skillFromDist(rand),
        hourly_wage: wageBase + Math.floor(rand() * 80),
        is_minor: !isLeader && !isKitchen && rand() < 0.08,
        absence_rate: 1 + Math.floor(rand() * 18),
        can_help_stores: canHelp,
        weekly_hours_cap: isLeader ? 40 : 18 + Math.floor(rand() * 12),
        employment: isLeader ? "社員" : "アルバイト",
        note: "scale生成",
      });
    }
  }

  return [...base, ...generated];
}

export function filterStores(data: MinatoyaData, mode: ScaleMode): Store[] {
  if (mode === 1) {
    return data.stores.filter((s) => s.id === "st01");
  }
  if (mode === 3) {
    return data.stores.filter((s) => !s.scale_mode_only);
  }
  return data.stores;
}

export function synthesizeSubmissions(
  staff: Staff[],
  week: string[],
  existing: Submission[],
): Submission[] {
  const byId = new Map(existing.map((s) => [s.staff_id, s]));
  const rand = rng(42);
  const out: Submission[] = [];
  for (const st of staff) {
    const ex = byId.get(st.id);
    if (ex) {
      out.push(ex);
      continue;
    }
    if (rand() > 0.72) continue;
    const days = week
      .filter(() => rand() > 0.35)
      .map((date) => {
        const slots = ["lunch", "dinner", "late"].filter(() => rand() > 0.45);
        return { date, slots: slots.length ? slots : ["dinner"] };
      });
    out.push({
      staff_id: st.id,
      submitted_at: "2026-07-18",
      days,
    });
  }
  return out;
}
