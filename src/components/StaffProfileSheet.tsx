import {
  assignmentsThisWeek,
  contractBlurb,
  titleLabel,
} from "../lib/staffLabels";
import { useDemo } from "../state/DemoStore";
import { Sheet } from "./Sheet";

export function StaffProfileSheet() {
  const d = useDemo();
  if (!d.profileStaffId) return null;

  const s = d.staff.find((x) => x.id === d.profileStaffId) ??
    d.data.staff.find((x) => x.id === d.profileStaffId);
  if (!s) return null;

  const store = d.stores.find((x) => x.id === s.store_id);
  const sub = d.submissions.find((x) => x.staff_id === s.id);
  const slotLabels = Object.fromEntries(
    d.timeSlots.map((t) => [t.id, t.label]),
  );
  const storeNames = Object.fromEntries(d.stores.map((x) => [x.id, x.name]));
  const lines = assignmentsThisWeek(d.shifts, s.id, slotLabels, storeNames);

  return (
    <Sheet title={s.name} onClose={d.closeProfile}>
      <div className="profileBlock">
        <p className="profileTitle">{titleLabel(s)}</p>
        <p className="note">
          {s.employment}・{store?.name ?? s.store_id}
        </p>
        <p className="profileContract">{contractBlurb(s, sub)}</p>
      </div>
      <h4 className="profileSection">今週の配置</h4>
      {lines.length === 0 ? (
        <p className="note">まだ配置なし</p>
      ) : (
        <ul className="profileList">
          {lines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}
      {d.laborAlerts
        .filter((a) => a.staff_id === s.id)
        .slice(0, 3)
        .map((a) => (
          <p key={a.message} className={`note alertInline ${a.level}`}>
            {a.message}
          </p>
        ))}
    </Sheet>
  );
}
