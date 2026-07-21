import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import raw from "../data/minatoya.json";
import {
  countHelpPool,
  findAbsenceCandidates,
} from "../lib/assignment/absence";
import {
  computeLaborAlerts,
  estimatePayroll,
  findCell,
  getDemand,
  laborCostRate,
  lightDraft,
  proposeDraft,
  requiredCount,
  upsertCell,
} from "../lib/assignment/proposeDraft";
import {
  filterStores,
  generateScaleStaff,
  synthesizeSubmissions,
} from "../lib/scale";
import { TIME_REWARDS } from "../lib/timeCounter";
import { buildNextWeek } from "../lib/weeks";
import type { ProposeReason } from "../components/ProposeReasonSheet";
import type {
  AbsenceCandidate,
  DemoRole,
  MinatoyaData,
  NotificationItem,
  ScaleMode,
  ShiftCell,
  Staff,
  Submission,
  SubmissionDay,
} from "../types";

const data = raw as MinatoyaData;
const nextWeekBuilt = buildNextWeek(data.week);

export type PlaceTarget = {
  store_id: string;
  date: string;
  slot: string;
  role: string;
  label: string;
};

type SelectedCell = {
  store_id: string;
  date: string;
  slot: string;
};

type DemoState = {
  role: DemoRole;
  setRole: (r: DemoRole) => void;
  scaleMode: ScaleMode;
  setScaleMode: (m: ScaleMode) => void;
  storeId: string;
  setStoreId: (id: string) => void;
  actingStaffId: string;
  setActingStaffId: (id: string) => void;
  stores: ReturnType<typeof filterStores>;
  staff: Staff[];
  submissions: Submission[];
  shifts: ShiftCell[];
  visibleShiftKeys: Set<string> | null;
  proposing: boolean;
  proposeReason: ProposeReason | null;
  reasonOpen: boolean;
  setReasonOpen: (v: boolean) => void;
  notifications: NotificationItem[];
  liveLog: string[];
  timeSavedMin: number;
  confirmedOnce: boolean;
  selectedCell: SelectedCell | null;
  setSelectedCell: (c: SelectedCell | null) => void;
  placeStaffId: string | null;
  setPlaceStaffId: (id: string | null) => void;
  placeTargets: PlaceTarget[];
  placeAt: (target: PlaceTarget) => void;
  absenceOpen: boolean;
  setAbsenceOpen: (v: boolean) => void;
  absenceResolved: boolean;
  shuffleMode: boolean;
  setShuffleMode: (v: boolean) => void;
  approachingId: string | null;
  addStoreName: string;
  setAddStoreName: (v: string) => void;
  customStores: { id: string; name: string; area: string }[];
  addCustomStore: () => void;
  wishDraft: SubmissionDay[];
  toggleWishDraft: (date: string, slot: string) => void;
  setWishDraftSlots: (date: string, slots: string[]) => void;
  commitWishDraft: () => void;
  draftCount: number;
  toast: string | null;
  showToast: (msg: string) => void;
  profileStaffId: string | null;
  openProfile: (id: string) => void;
  closeProfile: () => void;
  runPropose: () => void;
  confirmAndNotify: () => void;
  ackNotification: (staffId: string) => void;
  absenceCandidates: AbsenceCandidate[];
  applyAbsenceReplacement: (c: AbsenceCandidate) => void;
  helpPoolCount: number;
  laborAlerts: ReturnType<typeof computeLaborAlerts>;
  payroll: number;
  laborRate: number;
  week: string[];
  nextWeek: string[];
  dayTypes: MinatoyaData["day_types"];
  nextDayTypes: Record<string, MinatoyaData["day_types"][string]>;
  timeSlots: MinatoyaData["time_slots"];
  demandTemplates: MinatoyaData["demand_templates"];
  scenarioEvents: MinatoyaData["scenario_events"];
  submittedCount: number;
  staffTotal: number;
  ackCount: number;
  data: MinatoyaData;
  openAbsenceFromOwner: () => void;
};

const Ctx = createContext<DemoState | null>(null);

function cellKey(storeId: string, date: string, slot: string) {
  return `${storeId}|${date}|${slot}`;
}

function applyDraftDays(
  existing: SubmissionDay[],
  draft: SubmissionDay[],
): SubmissionDay[] {
  const map = new Map(existing.map((d) => [d.date, d.slots]));
  for (const d of draft) {
    if (d.slots.length === 0) map.delete(d.date);
    else map.set(d.date, d.slots);
  }
  return [...map.entries()].map(([date, slots]) => ({ date, slots }));
}

export function DemoProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<DemoRole>("manager");
  const [scaleMode, setScaleModeState] = useState<ScaleMode>(3);
  const [storeId, setStoreId] = useState("st01");
  const [actingStaffId, setActingStaffId] = useState("stf04");
  const [submissions, setSubmissions] = useState<Submission[]>(data.submissions);
  const [shifts, setShifts] = useState<ShiftCell[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [liveLog, setLiveLog] = useState<string[]>([]);
  const [timeSavedMin, setTimeSavedMin] = useState(0);
  const [confirmedOnce, setConfirmedOnce] = useState(false);
  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null);
  const [placeStaffId, setPlaceStaffId] = useState<string | null>(null);
  const [absenceOpen, setAbsenceOpen] = useState(false);
  const [absenceResolved, setAbsenceResolved] = useState(false);
  const [shuffleMode, setShuffleMode] = useState(false);
  const [approachingId, setApproachingId] = useState<string | null>(null);
  const [addStoreName, setAddStoreName] = useState("");
  const [customStores, setCustomStores] = useState<
    { id: string; name: string; area: string }[]
  >([]);
  const [extraStaff, setExtraStaff] = useState<Staff[]>([]);
  const [wishDraft, setWishDraft] = useState<SubmissionDay[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [profileStaffId, setProfileStaffId] = useState<string | null>(null);
  const [visibleShiftKeys, setVisibleShiftKeys] = useState<Set<string> | null>(
    null,
  );
  const [proposing, setProposing] = useState(false);
  const [proposeReason, setProposeReason] = useState<ProposeReason | null>(
    null,
  );
  const [reasonOpen, setReasonOpen] = useState(false);
  const toastTimer = useRef<number | null>(null);
  const proposeTimer = useRef<number[]>([]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2200);
  }, []);

  const openProfile = useCallback((id: string) => setProfileStaffId(id), []);
  const closeProfile = useCallback(() => setProfileStaffId(null), []);

  const baseStores = useMemo(
    () => filterStores(data, scaleMode),
    [scaleMode],
  );
  const stores = useMemo(
    () => [
      ...baseStores,
      ...customStores.map((s) => ({
        id: s.id,
        name: s.name,
        area: s.area,
        size: "small",
        scale_mode_only: false,
        has_late_slot: false,
      })),
    ],
    [baseStores, customStores],
  );

  const staff = useMemo(() => {
    const scaled = generateScaleStaff(
      data,
      stores.map((s) => s.id).filter((id) => !id.startsWith("custom")),
    );
    return [...scaled, ...extraStaff];
  }, [stores, extraStaff]);

  const staffInScope = useMemo(
    () => staff.filter((s) => stores.some((st) => st.id === s.store_id)),
    [staff, stores],
  );

  useEffect(() => {
    setWishDraft([]);
  }, [actingStaffId]);

  useEffect(
    () => () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
      proposeTimer.current.forEach((t) => window.clearTimeout(t));
    },
    [],
  );

  const setScaleMode = useCallback((m: ScaleMode) => {
    setScaleModeState(m);
    const nextStores = filterStores(data, m);
    setStoreId(nextStores[0]?.id ?? "st01");
    setShifts([]);
    setVisibleShiftKeys(null);
    setConfirmedOnce(false);
    setAbsenceResolved(false);
    setShuffleMode(false);
    setLiveLog([]);
    setProposeReason(null);
    const scaled = generateScaleStaff(
      data,
      nextStores.map((s) => s.id),
    );
    setSubmissions(synthesizeSubmissions(scaled, data.week, data.submissions));
  }, []);

  const setWishDraftSlots = useCallback((date: string, slots: string[]) => {
    setWishDraft((prev) => {
      const rest = prev.filter((d) => d.date !== date);
      if (slots.length === 0) return rest;
      return [...rest, { date, slots }];
    });
  }, []);

  const toggleWishDraft = useCallback((date: string, slot: string) => {
    setWishDraft((prev) => {
      const day = prev.find((d) => d.date === date);
      if (!day) return [...prev, { date, slots: [slot] }];
      const has = day.slots.includes(slot);
      const slots = has
        ? day.slots.filter((s) => s !== slot)
        : [...day.slots, slot];
      const rest = prev.filter((d) => d.date !== date);
      if (slots.length === 0) return rest;
      return [...rest, { date, slots }];
    });
  }, []);

  const draftCount = useMemo(
    () => wishDraft.reduce((n, d) => n + d.slots.length, 0),
    [wishDraft],
  );

  const commitWishDraft = useCallback(() => {
    if (wishDraft.length === 0) return;
    const staffId = actingStaffId;
    setSubmissions((prev) => {
      const existing = prev.find((s) => s.staff_id === staffId);
      let next: Submission[];
      if (!existing) {
        next = [
          ...prev,
          {
            staff_id: staffId,
            submitted_at: "2026-07-22",
            days: wishDraft,
          },
        ];
      } else {
        next = prev.map((s) =>
          s.staff_id === staffId
            ? { ...s, days: applyDraftDays(s.days, wishDraft) }
            : s,
        );
      }
      setShifts((cur) =>
        lightDraft({
          storeId,
          week: data.week,
          dayTypes: data.day_types,
          templates: data.demand_templates,
          staff,
          submissions: next,
          existing: cur,
        }),
      );
      return next;
    });
    setWishDraft([]);
    showToast("提出しました");
  }, [wishDraft, actingStaffId, storeId, staff, showToast]);

  const runPropose = useCallback(() => {
    proposeTimer.current.forEach((t) => window.clearTimeout(t));
    proposeTimer.current = [];

    const result = proposeDraft({
      storeId,
      week: data.week,
      dayTypes: data.day_types,
      templates: data.demand_templates,
      staff,
      submissions,
      existing: shifts,
      status: "proposed",
    });

    const storeCells = result.shifts
      .filter((s) => s.store_id === storeId)
      .sort((a, b) => a.date.localeCompare(b.date) || a.slot.localeCompare(b.slot));

    let filledSlots = 0;
    let shortSlots = 0;
    let wishFirst = 0;
    for (const cell of storeCells) {
      const demand = getDemand(
        data.demand_templates,
        storeId,
        data.day_types[cell.date],
        cell.slot,
      );
      const need = requiredCount(demand);
      const filled = cell.assignments.length;
      if (filled >= need && need > 0) filledSlots += 1;
      if (filled < need) shortSlots += 1;
      for (const a of cell.assignments) {
        const sub = submissions.find((s) => s.staff_id === a.staff_id);
        const day = sub?.days.find((d) => d.date === cell.date);
        if (day?.slots.includes(cell.slot)) wishFirst += 1;
      }
    }

    const reason: ProposeReason = {
      filledSlots,
      shortSlots,
      wishFirst,
      laborSafe: Math.max(0, filledSlots - shortSlots),
    };

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    setProposing(true);
    setConfirmedOnce(false);
    setProposeReason(reason);
    setLiveLog([]);

    if (reduce) {
      setShifts(result.shifts);
      setVisibleShiftKeys(null);
      setLiveLog(result.log);
      setProposing(false);
      setTimeSavedMin((m) => m + TIME_REWARDS.propose);
      return;
    }

    setShifts(result.shifts);
    setVisibleShiftKeys(new Set());
    storeCells.forEach((cell, i) => {
      const t = window.setTimeout(() => {
        setVisibleShiftKeys((prev) => {
          const next = new Set(prev ?? []);
          next.add(cellKey(cell.store_id, cell.date, cell.slot));
          return next;
        });
        if (i === storeCells.length - 1) {
          setVisibleShiftKeys(null);
          setLiveLog(result.log);
          setProposing(false);
          setTimeSavedMin((m) => m + TIME_REWARDS.propose);
        }
      }, 90 * (i + 1));
      proposeTimer.current.push(t);
    });

    if (storeCells.length === 0) {
      setVisibleShiftKeys(null);
      setLiveLog(result.log);
      setProposing(false);
      setTimeSavedMin((m) => m + TIME_REWARDS.propose);
    }
  }, [storeId, staff, submissions, shifts]);

  const placeTargets = useMemo((): PlaceTarget[] => {
    if (!selectedCell || !placeStaffId) return [];
    const person = staffInScope.find((s) => s.id === placeStaffId);
    if (!person) return [];
    const demand = getDemand(
      data.demand_templates,
      selectedCell.store_id,
      data.day_types[selectedCell.date] ?? "平日",
      selectedCell.slot,
    );
    const role =
      Object.keys(demand)[0] ??
      person.roles[0] ??
      "フロア";
    const slotLabel =
      data.time_slots.find((t) => t.id === selectedCell.slot)?.label ??
      selectedCell.slot;
    const storeName =
      stores.find((s) => s.id === selectedCell.store_id)?.name ??
      selectedCell.store_id;

    const targets: PlaceTarget[] = [
      {
        store_id: selectedCell.store_id,
        date: selectedCell.date,
        slot: selectedCell.slot,
        role,
        label: `この枠 ← ${selectedCell.date.slice(5)} ${slotLabel}・${storeName}`,
      },
    ];

    for (const date of data.week) {
      for (const slot of data.time_slots) {
        if (
          date === selectedCell.date &&
          slot.id === selectedCell.slot &&
          selectedCell.store_id === storeId
        ) {
          continue;
        }
        const dem = getDemand(
          data.demand_templates,
          storeId,
          data.day_types[date],
          slot.id,
        );
        const need = requiredCount(dem);
        if (need === 0) continue;
        const cell = findCell(shifts, storeId, date, slot.id);
        const filled = cell?.assignments.length ?? 0;
        if (filled >= need) continue;
        const r = Object.keys(dem)[0] ?? role;
        if (!person.roles.includes(r) && r !== "フロア") continue;
        targets.push({
          store_id: storeId,
          date,
          slot: slot.id,
          role: r,
          label: `同店空き ${date.slice(5)} ${slot.label}`,
        });
      }
    }

    for (const helpId of person.can_help_stores) {
      if (!stores.some((s) => s.id === helpId)) continue;
      const dem = getDemand(
        data.demand_templates,
        helpId,
        data.day_types[selectedCell.date] ?? "平日",
        selectedCell.slot,
      );
      const need = requiredCount(dem);
      if (need === 0) continue;
      const sn = stores.find((s) => s.id === helpId)?.name ?? helpId;
      targets.push({
        store_id: helpId,
        date: selectedCell.date,
        slot: selectedCell.slot,
        role: Object.keys(dem)[0] ?? role,
        label: `他店応援 ${sn}・同時間帯`,
      });
    }

    return targets.slice(0, 8);
  }, [
    selectedCell,
    placeStaffId,
    staffInScope,
    stores,
    storeId,
    shifts,
  ]);

  const placeAt = useCallback(
    (target: PlaceTarget) => {
      if (!placeStaffId) return;
      const cell =
        findCell(shifts, target.store_id, target.date, target.slot) ?? {
          store_id: target.store_id,
          date: target.date,
          slot: target.slot,
          assignments: [],
          status: "proposed" as const,
        };
      const withoutRole = cell.assignments.filter((a) => a.role !== target.role);
      const withoutPerson = withoutRole.filter(
        (a) => a.staff_id !== placeStaffId,
      );
      const nextCell: ShiftCell = {
        ...cell,
        status: cell.status === "confirmed" ? "proposed" : cell.status || "proposed",
        assignments: [
          ...withoutPerson,
          { staff_id: placeStaffId, role: target.role },
        ],
      };
      setShifts((s) => upsertCell(s, nextCell));
      setSelectedCell(null);
      setPlaceStaffId(null);
      showToast("配置しました");
    },
    [placeStaffId, shifts, showToast],
  );

  const confirmAndNotify = useCallback(() => {
    const storeShifts = shifts
      .filter((s) => s.store_id === storeId)
      .map((s) => ({ ...s, status: "confirmed" as const }));
    const rest = shifts.filter((s) => s.store_id !== storeId);
    setShifts([...rest, ...storeShifts]);

    const byStaff = new Map<string, string[]>();
    for (const cell of storeShifts) {
      for (const a of cell.assignments) {
        const lines = byStaff.get(a.staff_id) ?? [];
        lines.push(`${cell.date.slice(5)} ${cell.slot}（${a.role}）`);
        byStaff.set(a.staff_id, lines);
      }
    }
    setNotifications(
      [...byStaff.entries()].map(([staff_id, lines]) => ({
        staff_id,
        summary: lines.slice(0, 4).join("\n"),
        status: "未読" as const,
      })),
    );
    setConfirmedOnce(true);
    setTimeSavedMin((m) => m + TIME_REWARDS.confirm);
    showToast("通知を送りました");
  }, [shifts, storeId, showToast]);

  const ackNotification = useCallback(
    (staffId: string) => {
      setNotifications((prev) =>
        prev.map((n) =>
          n.staff_id === staffId ? { ...n, status: "確認済み" } : n,
        ),
      );
      showToast("確認しました");
    },
    [showToast],
  );

  const absenceEvent = data.scenario_events.find((e) => e.type === "absence");
  const absenceRole = useMemo(() => {
    if (!absenceEvent) return "フロア";
    const cell = findCell(
      shifts,
      absenceEvent.store_id,
      absenceEvent.date,
      absenceEvent.slot,
    );
    const a = cell?.assignments.find(
      (x) => x.staff_id === absenceEvent.staff_id,
    );
    return a?.role ?? "フロア";
  }, [absenceEvent, shifts]);

  const { local, cross } = useMemo(() => {
    if (!absenceEvent) return { local: [], cross: [] };
    return findAbsenceCandidates({
      absentStaffId: absenceEvent.staff_id ?? "",
      storeId: absenceEvent.store_id,
      date: absenceEvent.date,
      slot: absenceEvent.slot,
      role: absenceRole,
      staff,
      shifts,
      submissions,
      preferredIds: absenceEvent.expected_candidates,
    });
  }, [absenceEvent, absenceRole, staff, shifts, submissions]);

  const absenceCandidates = shuffleMode
    ? cross.slice(0, 3)
    : local.slice(0, 3);

  const applyAbsenceReplacement = useCallback(
    (c: AbsenceCandidate) => {
      if (!absenceEvent || approachingId) return;
      setApproachingId(c.staff_id);
      const ev = absenceEvent;
      const role = absenceRole;
      window.setTimeout(() => {
        showToast("打診を送信しました");
        window.setTimeout(() => {
          setShifts((prev) => {
            const cell = findCell(
              prev,
              ev.store_id,
              ev.date,
              ev.slot,
            );
            if (!cell) return prev;
            const assignments = cell.assignments
              .filter((a) => a.staff_id !== ev.staff_id)
              .concat([{ staff_id: c.staff_id, role }]);
            return upsertCell(prev, {
              ...cell,
              assignments,
              status: "confirmed",
            });
          });
          setAbsenceResolved(true);
          setAbsenceOpen(false);
          setApproachingId(null);
          setTimeSavedMin((m) => m + TIME_REWARDS.absence);
          if (c.crossStore) setShuffleMode(true);
          showToast("承諾・配置完了");
        }, 700);
      }, 600);
    },
    [absenceEvent, approachingId, absenceRole, showToast],
  );

  const openAbsenceFromOwner = useCallback(() => {
    setRole("manager");
    if (absenceEvent) setStoreId(absenceEvent.store_id);
    setShuffleMode(false);
    setAbsenceOpen(true);
  }, [absenceEvent]);

  const helpPoolCount = countHelpPool(staff, storeId, "フロア");
  const laborAlerts = useMemo(
    () => computeLaborAlerts(shifts, staff),
    [shifts, staff],
  );
  const payroll = useMemo(
    () => estimatePayroll(shifts, staff),
    [shifts, staff],
  );
  const laborRate = laborCostRate(payroll, 3200000);

  const addCustomStore = useCallback(() => {
    const name = addStoreName.trim();
    if (!name) return;
    const id = `custom${customStores.length + 1}`;
    setCustomStores((prev) => [...prev, { id, name, area: "横浜" }]);
    setExtraStaff((prev) => [
      ...prev,
      {
        id: `stf_c_${customStores.length + 1}`,
        name: `${name} リーダー`,
        store_id: id,
        roles: ["フロア", "リーダー"],
        skill_level: 4,
        hourly_wage: 1400,
        is_minor: false,
        absence_rate: 3,
        can_help_stores: ["st01"],
        weekly_hours_cap: 40,
        employment: "社員",
        note: "増設デモ",
      },
    ]);
    setAddStoreName("");
    setStoreId(id);
    showToast("店舗を追加しました");
  }, [addStoreName, customStores.length, showToast]);

  const submittedIds = new Set(submissions.map((s) => s.staff_id));

  const closeSelected = useCallback((c: SelectedCell | null) => {
    setSelectedCell(c);
    if (!c) setPlaceStaffId(null);
  }, []);

  const value: DemoState = {
    role,
    setRole,
    scaleMode,
    setScaleMode,
    storeId,
    setStoreId,
    actingStaffId,
    setActingStaffId,
    stores,
    staff: staffInScope,
    submissions,
    shifts,
    visibleShiftKeys,
    proposing,
    proposeReason,
    reasonOpen,
    setReasonOpen,
    notifications,
    liveLog,
    timeSavedMin,
    confirmedOnce,
    selectedCell,
    setSelectedCell: closeSelected,
    placeStaffId,
    setPlaceStaffId,
    placeTargets,
    placeAt,
    absenceOpen,
    setAbsenceOpen,
    absenceResolved,
    shuffleMode,
    setShuffleMode,
    approachingId,
    addStoreName,
    setAddStoreName,
    customStores,
    addCustomStore,
    wishDraft,
    toggleWishDraft,
    setWishDraftSlots,
    commitWishDraft,
    draftCount,
    toast,
    showToast,
    profileStaffId,
    openProfile,
    closeProfile,
    runPropose,
    confirmAndNotify,
    ackNotification,
    absenceCandidates,
    applyAbsenceReplacement,
    helpPoolCount,
    laborAlerts,
    payroll,
    laborRate,
    week: data.week,
    nextWeek: nextWeekBuilt.week,
    dayTypes: data.day_types,
    nextDayTypes: nextWeekBuilt.dayTypes,
    timeSlots: data.time_slots,
    demandTemplates: data.demand_templates,
    scenarioEvents: data.scenario_events,
    submittedCount: staffInScope.filter((s) => submittedIds.has(s.id)).length,
    staffTotal: staffInScope.length,
    ackCount: notifications.filter((n) => n.status === "確認済み").length,
    data,
    openAbsenceFromOwner,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDemo() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useDemo outside provider");
  return ctx;
}
