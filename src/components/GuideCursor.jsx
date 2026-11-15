import { createPortal } from "react-dom";

export default function GuideCursor({ cursor }) {
  if (!cursor?.show && !cursor?.rect) return null;
  return createPortal(
    <div className="guide-root" aria-hidden="true">
      {cursor.rect && (
        <div
          className="guide-ring"
          style={{
            left: cursor.rect.left,
            top: cursor.rect.top,
            width: cursor.rect.width,
            height: cursor.rect.height,
            borderRadius: cursor.rect.radius || 12,
          }}
        />
      )}
      <div className="guide-cursor" style={{ left: cursor.x, top: cursor.y, opacity: cursor.show ? 1 : 0 }}>
        {cursor.tap > 0 && <span key={cursor.tap} className="tour-tap" />}
        <svg width="22" height="26" viewBox="0 0 22 26" fill="none">
          <path d="M2 2v19l5.2-4.6 3.4 7.4 3.4-1.6-3.4-7.2H18L2 2z" fill="#fff" stroke="#141210" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
      </div>
    </div>,
    document.body,
  );
}
