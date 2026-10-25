import { useMemo, useState } from "react";
import { PLUGIN_CATEGORIES, PLUGINS } from "../../features.js";
import { useAppState } from "../../AppState.jsx";
import { Page, Card, Ghost, Primary, Tabs } from "../ui.jsx";

export default function PluginsView() {
  const { pluginState, setPlugin, notice } = useAppState();
  const [tab, setTab] = useState("shop");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [detailId, setDetailId] = useState(null);

  const installedCount = PLUGINS.filter((item) => pluginState[item.id]?.installed).length;

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PLUGINS.filter((item) => {
      const state = pluginState[item.id] || {};
      if (tab === "shop" && (item.bundled || state.installed) && !item.comingSoon) return false;
      if (tab === "installed" && !state.installed) return false;
      if (category !== "All" && item.category !== category) return false;
      if (!q) return true;
      return (item.name + " " + item.description + " " + item.flairs.join(" ")).toLowerCase().includes(q);
    });
  }, [tab, query, category, pluginState]);

  const detail = PLUGINS.find((item) => item.id === detailId);

  if (detail) {
    const state = pluginState[detail.id] || {};
    return (
      <Page>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[22px]">{detail.name}</div>
            <div className="text-[12px] text-[var(--faint)]">
              {detail.category} · {detail.version}
              {detail.bundled ? " · bundled" : ""}
            </div>
          </div>
          <Ghost onClick={() => setDetailId(null)}>Back</Ghost>
        </div>
        <Card className="space-y-3 p-4">
          <p className="text-[13.5px] leading-6 text-[var(--muted)]">{detail.description}</p>
          <div className="flex flex-wrap gap-1.5">
            {detail.flairs.map((flair) => (
              <span key={flair} className="rounded-full border border-[var(--stroke)] px-2 py-0.5 text-[11px] text-[var(--muted)]">
                {flair}
              </span>
            ))}
          </div>
          <div className="space-y-1 text-[12px] text-[var(--faint)]">
            {detail.commits.map(([hash, msg]) => (
              <div key={hash}>
                {hash} · {msg}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {detail.comingSoon ? (
              <span className="text-[12px] text-[var(--faint)]">Coming soon</span>
            ) : state.installed ? (
              <>
                <Ghost
                  active={state.enabled}
                  onClick={() => {
                    setPlugin(detail.id, { enabled: !state.enabled });
                    notice(state.enabled ? detail.name + " disabled." : detail.name + " enabled.");
                  }}
                >
                  {state.enabled ? "Enabled" : "Disabled"}
                </Ghost>
                {!detail.bundled && (
                  <Ghost
                    onClick={() => {
                      setPlugin(detail.id, { installed: false, enabled: false });
                      notice(detail.name + " removed.");
                      setDetailId(null);
                    }}
                  >
                    Remove
                  </Ghost>
                )}
              </>
            ) : (
              <Primary
                onClick={() => {
                  setPlugin(detail.id, { installed: true, enabled: true });
                  notice(detail.name + " installed.");
                }}
              >
                Install
              </Primary>
            )}
          </div>
        </Card>
      </Page>
    );
  }

  return (
    <Page>
      <div className="mb-1 text-[22px]">Plugins</div>
      <p className="mb-4 text-[13px] text-[var(--muted)]">Install and manage local /root capability packs.</p>
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search plugins"
        className="mb-3 h-10 w-full rounded-[10px] border border-[var(--stroke)] bg-[var(--input)] px-3 text-[13px] outline-none"
      />
      <div className="mb-3 flex flex-wrap gap-1">
        {PLUGIN_CATEGORIES.map((name) => (
          <Ghost key={name} active={category === name} onClick={() => setCategory(name)}>
            {name}
          </Ghost>
        ))}
      </div>
      <Tabs
        tabs={[
          { id: "shop", label: "Shop" },
          { id: "installed", label: "Installed · " + installedCount },
        ]}
        value={tab}
        onChange={setTab}
      />
      {rows.length === 0 && <Card className="px-4 py-3 text-[13px] text-[var(--muted)]">Nothing in this filter.</Card>}
      <div className="grid gap-2 sm:grid-cols-2">
        {rows.map((item) => {
          const state = pluginState[item.id] || {};
          return (
            <Card key={item.id} className="flex flex-col justify-between p-4">
              <button type="button" onClick={() => setDetailId(item.id)} className="text-left">
                <div className="text-[14px]">{item.name}</div>
                <div className="mt-0.5 text-[11px] text-[var(--faint)]">{item.category}</div>
                <div className="mt-1 text-[12px] text-[var(--muted)]">{item.description}</div>
              </button>
              <div className="mt-3">
                {item.comingSoon ? (
                  <span className="text-[12px] text-[var(--faint)]">Coming soon</span>
                ) : state.installed ? (
                  <Ghost onClick={() => setDetailId(item.id)}>{state.enabled ? "Installed" : "Disabled"}</Ghost>
                ) : (
                  <Primary
                    onClick={() => {
                      setPlugin(item.id, { installed: true, enabled: true });
                      notice(item.name + " installed.");
                    }}
                  >
                    Install
                  </Primary>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </Page>
  );
}
