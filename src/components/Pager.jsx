import { useEffect, useRef, useState } from "react";

// Slices a list into pages. `resetKey` sends you back to page one (a new search, say).
export function usePaged(items, size, { resetKey = "", startIndex = 0 } = {}) {
  const [page, setPage] = useState(() => Math.max(0, Math.floor(startIndex / size)));
  const pages = Math.max(1, Math.ceil(items.length / size));
  const seen = useRef(resetKey);

  useEffect(() => {
    if (seen.current === resetKey) return;
    seen.current = resetKey;
    setPage(0);
  }, [resetKey]);

  const current = Math.min(page, pages - 1);
  return {
    page: current,
    pages,
    total: items.length,
    size,
    setPage,
    slice: items.slice(current * size, current * size + size),
  };
}

function pageList(page, pages) {
  if (pages <= 7) return Array.from({ length: pages }, (_, index) => index);
  const list = new Set([0, pages - 1, page, page - 1, page + 1]);
  const sorted = [...list].filter((value) => value >= 0 && value < pages).sort((a, b) => a - b);
  const out = [];
  sorted.forEach((value, index) => {
    if (index > 0 && value - sorted[index - 1] > 1) out.push("gap");
    out.push(value);
  });
  return out;
}

export default function Pager({ paged, label = "items", compact = false }) {
  const { page, pages, total, size, setPage } = paged;
  if (total === 0) return null;
  if (pages <= 1) {
    return compact ? null : (
      <div className="mt-2.5 text-[11px] text-[var(--faint)]">
        {total} {label}
      </div>
    );
  }
  const from = page * size + 1;
  const to = Math.min(total, (page + 1) * size);
  const button = "flex h-7 min-w-7 items-center justify-center rounded-lg border px-2 text-[12px] transition-colors";
  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2" role="navigation" aria-label={`${label} pages`}>
      <div className="text-[11px] text-[var(--faint)]">
        {from}–{to} of {total} {label}
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page === 0}
          onClick={() => setPage(page - 1)}
          className={`${button} border-[var(--stroke)] text-[var(--muted)] hover:bg-[var(--hover)] disabled:opacity-35 disabled:hover:bg-transparent`}
          aria-label="Previous page"
        >
          ‹
        </button>
        {pageList(page, pages).map((value, index) =>
          value === "gap" ? (
            <span key={`gap-${index}`} className="px-1 text-[12px] text-[var(--faint)]">
              …
            </span>
          ) : (
            <button
              key={value}
              type="button"
              onClick={() => setPage(value)}
              aria-current={value === page ? "page" : undefined}
              className={`${button} ${
                value === page
                  ? "border-[var(--accent)] bg-[var(--panel)] text-[var(--ink)]"
                  : "border-[var(--stroke)] text-[var(--muted)] hover:bg-[var(--hover)]"
              }`}
            >
              {value + 1}
            </button>
          ),
        )}
        <button
          type="button"
          disabled={page >= pages - 1}
          onClick={() => setPage(page + 1)}
          className={`${button} border-[var(--stroke)] text-[var(--muted)] hover:bg-[var(--hover)] disabled:opacity-35 disabled:hover:bg-transparent`}
          aria-label="Next page"
        >
          ›
        </button>
      </div>
    </div>
  );
}
