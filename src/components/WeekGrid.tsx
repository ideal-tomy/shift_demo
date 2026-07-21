import { Fragment, type ReactNode } from "react";
import { WEEKDAY_SHORT } from "../lib/weeks";
import type { TimeSlot } from "../types";

export type StaffCellKind = "empty" | "draft" | "submitted" | "confirmed";

export type ManagerCellInfo = {
  filled: number;
  need: number;
  short: boolean;
  alertDot: boolean;
  reveal?: boolean;
};

type StaffMode = {
  mode: "staff";
  week: string[];
  slots: TimeSlot[];
  cellKind: (date: string, slotId: string) => StaffCellKind;
  onCell: (date: string) => void;
};

type ManagerMode = {
  mode: "manager";
  week: string[];
  slots: TimeSlot[];
  cellInfo: (date: string, slotId: string) => ManagerCellInfo | null;
  onCell: (date: string, slotId: string) => void;
};

type Props = StaffMode | ManagerMode;

export function WeekGrid(props: Props) {
  const { week, slots } = props;

  return (
    <div className="weekGrid">
      <div />
      {week.map((date, i) => (
        <div key={date} className="weekHead" aria-label={`${WEEKDAY_SHORT[i]} ${date}`}>
          <span>{WEEKDAY_SHORT[i]}</span>
          <span className="tnum">{date.slice(8)}</span>
        </div>
      ))}
      {slots.map((slot) => (
        <Fragment key={slot.id}>
          <div className="weekLabel">{slot.label}</div>
          {week.map((date) => {
            if (props.mode === "staff") {
              const kind = props.cellKind(date, slot.id);
              return (
                <button
                  key={`${date}-${slot.id}`}
                  type="button"
                  className={`cell staffCell is-${kind}`}
                  onClick={() => props.onCell(date)}
                  aria-label={`${date} ${slot.label}`}
                >
                  {kind === "draft" ? (
                    <span className="mark">下</span>
                  ) : null}
                  {kind === "submitted" ? (
                    <span className="mark">希</span>
                  ) : null}
                  {kind === "confirmed" ? (
                    <span className="mark">確</span>
                  ) : null}
                </button>
              );
            }

            const info = props.cellInfo(date, slot.id);
            if (!info) return <div key={`${date}-${slot.id}`} />;
            if (info.reveal === false) {
              return (
                <div
                  key={`${date}-${slot.id}`}
                  className="cell isPending"
                  aria-hidden
                />
              );
            }
            return (
              <button
                key={`${date}-${slot.id}`}
                type="button"
                className={`cell${info.short ? " isShort" : ""}`}
                onClick={() => props.onCell(date, slot.id)}
              >
                <span className="count tnum">
                  {info.filled}/{info.need}
                </span>
                {info.short ? (
                  <span className="badge tnum">{info.need - info.filled}</span>
                ) : null}
                {info.alertDot ? <span className="dot" /> : null}
              </button>
            );
          })}
        </Fragment>
      ))}
    </div>
  );
}

export function WeekGridHint({ children }: { children: ReactNode }) {
  return <p className="note weekHint">{children}</p>;
}
