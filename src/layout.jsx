import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "./components/Icons.jsx";

// Where things live. Saved on this browser only.
const KEY = "root-web-layout";

// Zones that share a pool of items. An item can be dropped into any zone of its group.
const GROUPS = {
  "sidebar-links": ["nav", "footer"],
  "sidebar-lists": ["lists"],
  header: ["header"],
  composer: ["composer"],
};

const PANELS = {
  sidebar: { label: "Sidebar", options: ["left", "right"] },
  header: { label: "Header", options: ["top", "bottom"] },
  composer: { label: "Composer", options: ["bottom", "top"] },
};

const BASE = { sidebar: "left", header: "top", composer: "bottom", order: {}, place: {}, hidden: [] };

function clean(raw) {
  const next = { ...BASE, order: {}, place: {}, hidden: [] };
  if (!raw || typeof raw !== "object") return next;
  for (const key of Object.keys(PANELS)) {
    if (PANELS[key].options.includes(raw[key])) next[key] = raw[key];
  }
  if (raw.order && typeof raw.order === "object") {
    for (const [zone, ids] of Object.entries(raw.order)) {
      if (Array.isArray(ids)) next.order[zone] = ids.filter((id) => typeof id === "string");
    }
  }
  if (raw.place && typeof raw.place === "object") {
    for (const [id, zone] of Object.entries(raw.place)) {
      if (typeof zone === "string") next.place[id] = zone;
    }
  }
  if (Array.isArray(raw.hidden)) next.hidden = raw.hidden.filter((id) => typeof id === "string");
  return next;
}

function read() {
  try {
    return clean(JSON.parse(localStorage.getItem(KEY)));
  } catch {
    return clean(null);
  }
}

function isDefault(layout) {
  return (
    layout.sidebar === "left" &&
    layout.header === "top" &&
    layout.composer === "bottom" &&
    !Object.keys(layout.order).length &&
    !Object.keys(layout.place).length &&
    !layout.hidden.length
  );
}

const LayoutContext = createContext(null);

export function LayoutProvider({ children }) {
  const [layout, setLayout] = useState(read);
  const [editing, setEditing] = useState(false);
  const [drag, setDragState] = useState(null);
  const dragRef = useRef(null);

  useEffect(() => {
    try {
      if (isDefault(layout)) localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, JSON.stringify(layout));
    } catch {
      /* ignore quota */
    }
  }, [layout]);

  useEffect(() => {
    if (!editing) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") setEditing(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editing]);

  const setDrag = useCallback((value) => {
    dragRef.current = value;
    // Mounting the dock targets inside dragstart can cancel the drag in Chromium, so wait a tick.
    window.setTimeout(() => setDragState(dragRef.current), 0);
  }, []);

  const move = useCallback((id, zone, ids, targetId, after) => {
    setLayout((prev) => {
      const rest = ids.filter((item) => item !== id);
      let at = targetId ? rest.indexOf(targetId) : -1;
      at = at < 0 ? rest.length : at + (after ? 1 : 0);
      rest.splice(at, 0, id);
      return { ...prev, place: { ...prev.place, [id]: zone }, order: { ...prev.order, [zone]: rest } };
    });
  }, []);

  const toggleHidden = useCallback((id) => {
    setLayout((prev) => ({ ...prev, hidden: prev.hidden.includes(id) ? prev.hidden.filter((item) => item !== id) : [...prev.hidden, id] }));
  }, []);

  const setDock = useCallback((panel, value) => {
    if (!PANELS[panel]?.options.includes(value)) return;
    setLayout((prev) => ({ ...prev, [panel]: value }));
  }, []);

  const reset = useCallback(() => {
    setLayout(clean(null));
  }, []);

  const value = useMemo(
    () => ({ layout, editing, setEditing, drag, dragRef, setDrag, move, toggleHidden, setDock, reset, custom: !isDefault(layout) }),
    [layout, editing, drag, setDrag, move, toggleHidden, setDock, reset],
  );
  return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>;
}

export function useLayout() {
  const value = useContext(LayoutContext);
  if (!value) {
    return { layout: clean(null), editing: false, setEditing() {}, drag: null, dragRef: { current: null }, setDrag() {}, move() {}, toggleHidden() {}, setDock() {}, reset() {}, custom: false };
  }
  return value;
}

function pastMiddle(event, horizontal) {
  const box = event.currentTarget.getBoundingClientRect();
  return horizontal ? event.clientX > box.left + box.width / 2 : event.clientY > box.top + box.height / 2;
}

/**
 * Renders the items of one zone in the saved order. While arranging, every item can be
 * dragged to a new spot (also into the other zones of its group) or hidden.
 *
 * pool: [{ id, home, node, label, locked, className }] in default order.
 */
export function Zone({ zone, group, pool, dir = "v", className = "", tour, innerRef }) {
  const Tag = "div";
  const { layout, editing, dragRef, setDrag, move, toggleHidden } = useLayout();
  const [over, setOver] = useState(null);
  const zones = GROUPS[group] || [zone];
  const zoneOf = (item) => {
    const placed = layout.place[item.id];
    return placed && zones.includes(placed) ? placed : item.home;
  };
  const rank = layout.order[zone] || [];
  const mine = pool
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => zoneOf(item) === zone)
    .sort((left, right) => {
      const a = rank.indexOf(left.item.id);
      const b = rank.indexOf(right.item.id);
      const ka = a < 0 ? 10000 + left.index : a;
      const kb = b < 0 ? 10000 + right.index : b;
      return ka - kb;
    })
    .map(({ item }) => item);
  const ids = mine.map((item) => item.id);
  const horizontal = dir === "h";

  const accepts = () => {
    const current = dragRef.current;
    return editing && current && current.kind === "item" && current.group === group;
  };

  const drop = (event, targetId, after) => {
    if (!accepts()) return;
    event.preventDefault();
    event.stopPropagation();
    move(dragRef.current.id, zone, ids, targetId, after);
    setOver(null);
    setDrag(null);
  };

  const shown = editing ? mine : mine.filter((item) => !layout.hidden.includes(item.id));

  return (
    <Tag
      ref={innerRef}
      data-tour={tour}
      className={`${className} ${editing ? "lay-zone" : ""}`}
      onDragOver={(event) => {
        if (!accepts()) return;
        event.preventDefault();
      }}
      onDragEnter={(event) => {
        if (accepts()) {
          event.preventDefault();
          setOver((prev) => prev || { id: null, after: true });
        }
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOver(null);
      }}
      onDrop={(event) => drop(event, null, true)}
    >
      {shown.map((item) => {
        const hidden = layout.hidden.includes(item.id);
        const mark = over && over.id === item.id ? (over.after ? "after" : "before") : "";
        return (
          <div
            key={item.id}
            className={`${item.className || ""} ${editing ? `lay-item ${hidden ? "lay-hidden" : ""} ${horizontal ? "lay-h" : "lay-v"}` : ""}`}
            onDragOver={(event) => {
              if (!accepts() || dragRef.current.id === item.id) return;
              event.preventDefault();
              event.stopPropagation();
              const after = pastMiddle(event, horizontal);
              if (!over || over.id !== item.id || over.after !== after) setOver({ id: item.id, after });
            }}
            onDrop={(event) => {
              if (accepts() && dragRef.current.id === item.id) {
                event.preventDefault();
                event.stopPropagation();
                setOver(null);
                setDrag(null);
                return;
              }
              drop(event, item.id, pastMiddle(event, horizontal));
            }}
          >
            <div className={editing ? "lay-inert" : "contents"}>{item.node}</div>
            {editing && (
              <>
                <div
                  className="lay-grab"
                  draggable
                  title={`Drag ${item.label || item.id}`}
                  onDragStart={(event) => {
                    event.dataTransfer.effectAllowed = "move";
                    try {
                      event.dataTransfer.setData("text/plain", item.id);
                      const holder = event.currentTarget.parentElement;
                      const box = holder.getBoundingClientRect();
                      event.dataTransfer.setDragImage(holder, event.clientX - box.left, event.clientY - box.top);
                    } catch {
                      /* ignore */
                    }
                    setDrag({ kind: "item", id: item.id, group });
                  }}
                  onDragEnd={() => {
                    setOver(null);
                    setDrag(null);
                  }}
                />
                {!item.locked && (
                  <button
                    type="button"
                    className="lay-eye"
                    title={hidden ? `Show ${item.label || item.id}` : `Hide ${item.label || item.id}`}
                    onClick={() => toggleHidden(item.id)}
                  >
                    <Icon name={hidden ? "eye-off" : "eye"} size={11} />
                  </button>
                )}
                {mark && <span className={`lay-mark ${horizontal ? "lay-mark-h" : "lay-mark-v"} lay-${mark}`} />}
              </>
            )}
          </div>
        );
      })}
      {editing && over && over.id === null && <span className="lay-tail" />}
      {editing && shown.length === 0 && <div className="lay-empty">Drop here</div>}
    </Tag>
  );
}

/** A handle on a panel (sidebar, header, composer). Drag it to the edge it should dock to. */
export function PanelGrip({ panel, className = "" }) {
  const { editing, setDrag, layout } = useLayout();
  if (!editing) return null;
  return (
    <div
      draggable
      title={`Drag the ${PANELS[panel].label.toLowerCase()} to another edge`}
      className={`lay-panel-grip ${className}`}
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "move";
        try {
          event.dataTransfer.setData("text/plain", panel);
        } catch {
          /* ignore */
        }
        setDrag({ kind: "panel", panel });
      }}
      onDragEnd={() => setDrag(null)}
    >
      <Icon name="grip" size={12} />
      {PANELS[panel].label} · {layout[panel]}
    </div>
  );
}

/** Full-screen drop targets that appear while a panel is being dragged. */
export function DockTargets() {
  const { drag, setDock, setDrag } = useLayout();
  const [hot, setHot] = useState("");
  if (!drag || drag.kind !== "panel") return null;
  const options = PANELS[drag.panel].options;
  const vertical = drag.panel === "sidebar";
  const names = { left: "Dock on the left", right: "Dock on the right", top: "Dock at the top", bottom: "Dock at the bottom" };
  const ordered = vertical ? ["left", "right"] : ["top", "bottom"];
  return (
    <div className={`lay-dock ${vertical ? "lay-dock-h" : "lay-dock-v"}`}>
      {ordered
        .filter((side) => options.includes(side))
        .map((side) => (
          <div
            key={side}
            className={`lay-dock-cell ${hot === side ? "lay-dock-hot" : ""}`}
            onDragOver={(event) => {
              event.preventDefault();
              setHot(side);
            }}
            onDragLeave={() => setHot((value) => (value === side ? "" : value))}
            onDrop={(event) => {
              event.preventDefault();
              setDock(drag.panel, side);
              setHot("");
              setDrag(null);
            }}
          >
            <span>{names[side]}</span>
          </div>
        ))}
    </div>
  );
}

export function LayoutBar() {
  const { editing, setEditing, reset, custom } = useLayout();
  if (!editing) return null;
  return (
    <div className="lay-bar" role="toolbar" aria-label="Arrange the interface">
      <div className="min-w-0">
        <div className="text-[13px] text-[var(--ink)]">Arranging the interface</div>
        <div className="text-[11.5px] text-[var(--muted)]">Drag items to move them, use the eye to hide, drag a panel tag to dock it on another edge.</div>
      </div>
      <button type="button" className="lay-btn" disabled={!custom} onClick={reset}>
        Reset
      </button>
      <button type="button" className="lay-btn lay-btn-main" onClick={() => setEditing(false)}>
        Done
      </button>
    </div>
  );
}
