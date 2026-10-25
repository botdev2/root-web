import { useEffect, useState } from "react";
import { BRAIN_GROUPS, BRAIN_NODES, BRAIN_TOUR } from "../../features.js";
import { useAppState } from "../../AppState.jsx";
import { Page, Card, Ghost } from "../ui.jsx";

export default function ReasoningView() {
  const { brainEnabled, setBrainNode, resetBrain, notice } = useAppState();
  const [selected, setSelected] = useState("entry.send");
  const [tour, setTour] = useState(-1);
  const node = BRAIN_NODES.find((item) => item.id === selected) || BRAIN_NODES[0];

  useEffect(() => {
    if (tour < 0) return undefined;
    setSelected(BRAIN_TOUR[tour]);
    if (tour >= BRAIN_TOUR.length - 1) return undefined;
    const timer = window.setTimeout(() => setTour((value) => value + 1), 700);
    return () => window.clearTimeout(timer);
  }, [tour]);

  return (
    <Page wide>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Ghost onClick={() => notice("Brain saved.")}>Save brain</Ghost>
        <Ghost
          onClick={() => {
            resetBrain();
            setSelected("entry.send");
            setTour(-1);
            notice("Defaults restored.");
          }}
        >
          Reset defaults
        </Ghost>
        <Ghost
          active={tour >= 0}
          onClick={() => {
            setTour(0);
            notice("Playing the Intake → Output tour.");
          }}
        >
          Play tour
        </Ghost>
        <span className="text-[11px] text-[var(--muted)]">Optional stages change the agent path. Locked stages always run.</span>
      </div>
      <Card className="overflow-x-auto p-4">
        <div className="flex min-w-[760px] gap-3">
          {BRAIN_GROUPS.map((group) => (
            <div key={group} className="min-w-0 flex-1">
              <div className="mb-2 text-[10px] uppercase tracking-wide text-[var(--faint)]">{group}</div>
              <div className="space-y-2">
                {BRAIN_NODES.filter((item) => item.group === group).map((item) => {
                  const on = brainEnabled[item.id] !== false;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setTour(-1);
                        setSelected(item.id);
                      }}
                      className={`w-full rounded-xl border px-2.5 py-2 text-left ${
                        selected === item.id ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-[var(--stroke)] bg-[var(--panel)]"
                      } ${on ? "" : "opacity-45"}`}
                    >
                      <div className="text-[12.5px]">{item.label}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card className="mt-4 px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[15px]">{node.label}</div>
            <div className="mt-1 max-w-[62ch] text-[12.5px] leading-5 text-[var(--muted)]">{node.hint}</div>
            {node.setting && <div className="mt-1 text-[11px] text-[var(--faint)]">{node.setting}</div>}
          </div>
          {node.locked ? (
            <span className="text-[11px] text-[var(--faint)]">Locked on</span>
          ) : (
            <Ghost
              active={brainEnabled[node.id] !== false}
              onClick={() => {
                const next = brainEnabled[node.id] === false;
                setBrainNode(node.id, next);
                if (node.id === "loop.workflow" && next) setBrainNode("loop.simple", false);
                if (node.id === "loop.simple" && next) setBrainNode("loop.workflow", false);
                notice((next ? "On · " : "Off · ") + node.label);
              }}
            >
              {brainEnabled[node.id] === false ? "Off" : "On"}
            </Ghost>
          )}
        </div>
      </Card>
    </Page>
  );
}
