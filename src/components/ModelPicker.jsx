import { useMemo, useState } from "react";
import {
  CATALOG_MODELS,
  PRICING_LEGEND,
  SUBSCRIPTION_PROVIDERS,
  formatModelShort,
  matchesModelSearch,
  subId,
} from "../models.js";

const GRADE_COLOR = {
  A: "text-[#3dd68c]",
  B: "text-[#e8c54a]",
  C: "text-[#f08a3e]",
  D: "text-[#e85d6a]",
};

export default function ModelPicker({ model, onPick, onClose, onOpenSettings }) {
  const [query, setQuery] = useState("");
  const [openGroups, setOpenGroups] = useState({ claude: true, openai: true, grok: true });

  const catalog = useMemo(
    () => CATALOG_MODELS.filter((item) => matchesModelSearch(item.id, item.name, query)),
    [query],
  );

  return (
    <div className="frost-panel absolute bottom-10 left-0 z-30 w-[min(380px,calc(100vw-2rem))] overflow-hidden rounded-[14px] border border-[var(--stroke)] p-2.5 shadow-xl">
      <div className="px-1 pb-2 text-[11px] text-[var(--faint)]">{PRICING_LEGEND}</div>
      <input
        autoFocus
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search models"
        className="mb-1.5 h-9 w-full rounded-[10px] border border-[var(--stroke)] bg-[var(--input)] px-3 text-[13px] outline-none"
      />
      <div className="scroll-thin max-h-[320px] overflow-y-auto">
        {SUBSCRIPTION_PROVIDERS.map((provider) => {
          const rows = provider.models.filter((item) =>
            matchesModelSearch(subId(provider.id, item.api), item.name + " " + provider.label, query),
          );
          if (rows.length === 0) return null;
          const expanded = query.trim() || openGroups[provider.id];
          return (
            <div key={provider.id}>
              <button
                type="button"
                onClick={() => setOpenGroups((prev) => ({ ...prev, [provider.id]: !prev[provider.id] }))}
                className="flex h-8 w-full items-center justify-between px-2 text-left text-[12px] text-[var(--muted)]"
              >
                <span>{provider.label}</span>
                <span className="text-[10px] text-[var(--faint)]">{expanded ? "▾" : "▸"}</span>
              </button>
              {expanded &&
                rows.map((item) => {
                  const id = subId(provider.id, item.api);
                  return (
                    <ModelRow
                      key={id}
                      id={id}
                      title={item.name}
                      detail={provider.label}
                      billing="Your subscription"
                      grade="A"
                      selected={model === id}
                      onPick={onPick}
                    />
                  );
                })}
            </div>
          );
        })}
        {catalog.map((item) => {
          const colon = item.id.lastIndexOf(":");
          const slash = item.id.lastIndexOf("/");
          const leaf = slash >= 0 ? item.id.slice(slash + 1) : item.id;
          const split = leaf.lastIndexOf(":");
          return (
            <ModelRow
              key={item.id}
              id={item.id}
              title={split > 0 ? leaf.slice(0, split) : item.name}
              detail={split > 0 ? leaf.slice(split + 1) : colon > 0 ? item.id.slice(colon + 1) : ""}
              billing={item.billing}
              grade={item.grade}
              selected={model === item.id}
              onPick={onPick}
            />
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => {
          onClose?.();
          onOpenSettings?.();
        }}
        className="mt-1 flex h-9 w-full items-center border-t border-[var(--stroke-soft)] px-2 text-left text-[12px] text-[var(--muted)] hover:bg-[var(--hover)]"
      >
        All models…
      </button>
    </div>
  );
}

function ModelRow({ id, title, detail, billing, grade, selected, onPick }) {
  return (
    <button
      type="button"
      onClick={() => onPick(id)}
      className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left hover:bg-[var(--hover)] ${
        selected ? "bg-[var(--hover)]" : ""
      }`}
    >
      {grade && <span className={`w-3 text-[11px] ${GRADE_COLOR[grade] || "text-[var(--faint)]"}`}>{grade}</span>}
      <span className="min-w-0 flex-1 truncate text-[13.5px]">{title}</span>
      {detail ? <span className="hidden truncate text-[12px] text-[var(--muted)] sm:inline">{detail}</span> : null}
      <span className="hidden shrink-0 text-[11px] text-[var(--faint)] md:inline">{billing}</span>
      {selected ? <span className="text-[12px] text-[var(--ink)]">✓</span> : null}
    </button>
  );
}

export function ModelPillLabel({ model }) {
  return formatModelShort(model);
}
