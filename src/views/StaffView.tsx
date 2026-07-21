import { useMemo, useState } from "react";
import { Sheet } from "../components/Sheet";
import { WeekGrid, type StaffCellKind } from "../components/WeekGrid";
import { useDemo } from "../state/DemoStore";

type WeekMode = "this" | "next";

export function StaffView() {
  const d = useDemo();
  const [weekMode, setWeekMode] = useState<WeekMode>("this");
  const [editDate, setEditDate] = useState<string | null>(null);

  const me = d.staff.find((s) => s.id === d.actingStaffId);
  const mySub = d.submissions.find((s) => s.staff_id === d.actingStaffId);
  const myNote = d.notifications.find((n) => n.staff_id === d.actingStaffId);

  const storeStaff = useMemo(() => {
    const list = d.staff.filter((s) => s.store_id === (me?.store_id ?? d.homeStoreId));
    return [...list].sort((a, b) => {
      if (a.id === d.protagonistId) return -1;
      if (b.id === d.protagonistId) return 1;
      return 0;
    });
  }, [d.staff, me?.store_id, d.homeStoreId, d.protagonistId]);

  const activeWeek = weekMode === "this" ? d.week : d.nextWeek;
  const store = d.stores.find((s) => s.id === me?.store_id);
  const slots = d.timeSlots.filter(
    (s) => store?.has_late_slot || s.id !== "late",
  );
  const isProtagonist = d.actingStaffId === d.protagonistId;

  const cellKind = (date: string, slotId: string): StaffCellKind => {
    const confirmed = d.shifts.some(
      (c) =>
        c.status === "confirmed" &&
        c.date === date &&
        c.slot === slotId &&
        c.assignments.some((a) => a.staff_id === d.actingStaffId),
    );
    if (confirmed) return "confirmed";
    if (d.wishDraft.find((x) => x.date === date)?.slots.includes(slotId)) {
      return "draft";
    }
    if (mySub?.days.find((x) => x.date === date)?.slots.includes(slotId)) {
      return "submitted";
    }
    return "empty";
  };

  const openEdit = (date: string) => {
    setEditDate(date);
  };

  const editSlots =
    editDate == null
      ? []
      : (d.wishDraft.find((x) => x.date === editDate)?.slots ??
        mySub?.days.find((x) => x.date === editDate)?.slots ??
        []);

  const toggleEditSlot = (slotId: string) => {
    if (!editDate) return;
    if (!d.wishDraft.some((x) => x.date === editDate)) {
      const base =
        mySub?.days.find((x) => x.date === editDate)?.slots ?? [];
      const next = base.includes(slotId)
        ? base.filter((s) => s !== slotId)
        : [...base, slotId];
      d.setWishDraftSlots(editDate, next);
      return;
    }
    d.toggleWishDraft(editDate, slotId);
  };
  return (
    <div className="viewBody hasBottomBar">
      <div className="stickyHead staffSticky">
        <div className="staffBelong">
          <span className="belongLabel">所属: {store?.name ?? "—"}</span>
          {isProtagonist ? (
            <span className="heroBadge">デモ主人公</span>
          ) : null}
        </div>
        <select
          className="selectCtrl grow"
          value={d.actingStaffId}
          onChange={(e) => d.setActingStaffId(e.target.value)}
          aria-label="スタッフ"
        >
          {storeStaff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.id === d.protagonistId ? `${s.name}（主人公）` : s.name}
            </option>
          ))}
        </select>
        <div className="chipRow compact">
          <button
            type="button"
            className={`chip${weekMode === "this" ? " active" : ""}`}
            onClick={() => setWeekMode("this")}
          >
            今週
          </button>
          <button
            type="button"
            className={`chip${weekMode === "next" ? " active" : ""}`}
            onClick={() => setWeekMode("next")}
          >
            翌週
          </button>
        </div>
      </div>

      <p className="note storeAlignHint">
        店長タブでは同じ店（{store?.name ?? "横浜西口店"}）を選ぶと名簿が一致します
      </p>

      <WeekGrid
        mode="staff"
        week={activeWeek}
        slots={slots}
        cellKind={cellKind}
        onCell={openEdit}
      />
      <p className="note weekHint">枠をタップして希望を下書き → 提出</p>

      {myNote ? (
        <div style={{ marginTop: 16 }}>
          <div className="lineCard">
            <div className="meta">確定シフト</div>
            <div className="body">{myNote.summary}</div>
          </div>
          {myNote.status === "未読" ? (
            <button
              type="button"
              className="primaryBtn"
              style={{ width: "100%", marginTop: 8 }}
              onClick={() => d.ackNotification(d.actingStaffId)}
            >
              確認しました
            </button>
          ) : (
            <p className="note">確認済み</p>
          )}
        </div>
      ) : null}

      <div className="bottomBar">
        <button
          type="button"
          className="primaryBtn"
          disabled={d.draftCount === 0}
          onClick={d.commitWishDraft}
        >
          提出する
          {d.draftCount > 0 ? (
            <span className="ctaBadge tnum">{d.draftCount}</span>
          ) : null}
        </button>
      </div>

      {editDate ? (
        <Sheet
          title={`${editDate.slice(5)} の希望`}
          onClose={() => setEditDate(null)}
          footer={
            <button
              type="button"
              className="primaryBtn"
              style={{ width: "100%", marginTop: 12 }}
              onClick={() => setEditDate(null)}
            >
              完了
            </button>
          }
        >
          <div className="slotPick">
            {slots.map((slot) => {
              const on = editSlots.includes(slot.id);
              return (
                <button
                  key={slot.id}
                  type="button"
                  className={on ? "on" : undefined}
                  onClick={() => toggleEditSlot(slot.id)}
                >
                  {slot.label}
                  {on ? " ✓" : ""}
                </button>
              );
            })}
          </div>
        </Sheet>
      ) : null}
    </div>
  );
}
