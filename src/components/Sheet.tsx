import type { ReactNode } from "react";

type Props = {
  title: string;
  note?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
};

export function Sheet({ title, note, onClose, children, footer }: Props) {
  return (
    <div
      className="sheetOverlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="sheet" role="dialog" aria-label={title}>
        <h3>{title}</h3>
        {note ? <p className="note">{note}</p> : null}
        <div className="sheetBody">{children}</div>
        {footer ?? (
          <button
            type="button"
            className="ghostBtn"
            style={{ width: "100%", marginTop: 12 }}
            onClick={onClose}
          >
            閉じる
          </button>
        )}
      </div>
    </div>
  );
}
