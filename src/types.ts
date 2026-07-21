export type RoleName = "フロア" | "キッチン" | "リーダー";
export type DayType = "平日" | "金曜" | "土日";
export type ScaleMode = 1 | 3 | 8;
export type DemoRole = "staff" | "manager" | "owner";
export type ShiftStatus = "draft" | "proposed" | "confirmed";

export type Store = {
  id: string;
  name: string;
  area: string;
  size: string;
  scale_mode_only: boolean;
  has_late_slot: boolean;
};

export type TimeSlot = {
  id: string;
  label: string;
  time: string;
};

export type Staff = {
  id: string;
  name: string;
  store_id: string;
  roles: string[];
  skill_level: number;
  hourly_wage: number;
  is_minor: boolean;
  absence_rate: number;
  can_help_stores: string[];
  weekly_hours_cap: number;
  employment: string;
  note: string;
};

export type SubmissionDay = {
  date: string;
  slots: string[];
};

export type Submission = {
  staff_id: string;
  submitted_at: string;
  days: SubmissionDay[];
};

export type DemandTemplates = {
  store_id: string;
  templates: Record<string, Record<string, Record<string, number>>>;
};

export type Assignment = {
  staff_id: string;
  role: string;
};

export type ShiftCell = {
  store_id: string;
  date: string;
  slot: string;
  assignments: Assignment[];
  status: ShiftStatus;
};

export type NotificationItem = {
  staff_id: string;
  summary: string;
  status: "未読" | "確認済み";
};

export type LaborAlert = {
  level: "red" | "amber";
  staff_id: string;
  message: string;
};

export type AbsenceCandidate = {
  staff_id: string;
  score: number;
  reason: string;
  extraCost: number;
  crossStore: boolean;
  shuffleNote?: string;
};

export type ScenarioEvent = {
  id: string;
  type: string;
  date: string;
  slot: string;
  staff_id?: string;
  store_id: string;
  trigger?: string;
  expected_candidates?: string[];
  fallback?: string;
  insight?: string;
  advice?: string;
  closing_questions?: string[];
};

export type MinatoyaData = {
  week: string[];
  day_types: Record<string, DayType>;
  stores: Store[];
  roles: string[];
  time_slots: TimeSlot[];
  demand_templates: DemandTemplates[];
  staff: Staff[];
  submissions: Submission[];
  scale_mode_spec: {
    count_per_store: Record<string, number>;
    rules: Record<string, unknown>;
  };
  scenario_events: ScenarioEvent[];
  payroll_rules: Record<string, string>;
  labor_rules: {
    weekly_cap_default: number;
    break_required_over_hours: number;
    minor_latest: string;
    max_consecutive_days: number;
  };
};

export const SLOT_HOURS: Record<string, number> = {
  lunch: 4,
  dinner: 5,
  late: 2,
};

export const BASELINE_MONTH_HOURS = 22;
