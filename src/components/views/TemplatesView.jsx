import { useMemo, useState } from "react";
import { TEMPLATE_CATEGORIES, TEMPLATES, scaffoldTemplate } from "../../features.js";
import { useAppState } from "../../AppState.jsx";
import { Page, Card, Ghost } from "../ui.jsx";

export default function TemplatesView({ onCreate }) {
  const { notice } = useAppState();
  const [cat, setCat] = useState("All");
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TEMPLATES.filter((item) => {
      if (cat !== "All" && item.cat !== cat) return false;
      if (!q) return true;
      return (item.title + " " + item.subtitle + " " + item.stack).toLowerCase().includes(q);
    });
  }, [cat, query]);

  return (
    <Page wide>
      <div className="mb-1 text-[22px]">Templates</div>
      <p className="mb-4 text-[13px] text-[var(--muted)]">Create a repository from a starter stack.</p>
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search templates"
        className="mb-3 h-11 w-full rounded-2xl border border-[var(--stroke)] bg-[var(--input)] px-4 text-[14px] outline-none"
      />
      <div className="mb-4 flex flex-wrap gap-1">
        {TEMPLATE_CATEGORIES.map((name) => (
          <Ghost key={name} active={cat === name} onClick={() => setCat(name)}>
            {name}
          </Ghost>
        ))}
      </div>
      {rows.length === 0 && <Card className="px-4 py-3 text-[13px] text-[var(--muted)]">No templates match that search.</Card>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((item) => (
          <Card key={item.id} className="flex flex-col p-4">
            <div className="text-[11px] text-[var(--faint)]">{item.cat}</div>
            <div className="mt-1 text-[16px]">{item.title}</div>
            <div className="mt-1 text-[12.5px] text-[var(--muted)]">{item.subtitle}</div>
            <div className="mt-2 text-[12px] text-[var(--faint)]">{item.stack}</div>
            <div className="mt-4">
              <Ghost
                onClick={() => {
                  onCreate?.({ ...item, files: scaffoldTemplate(item) });
                  notice(item.title + " added to Projects.");
                }}
              >
                Create
              </Ghost>
            </div>
          </Card>
        ))}
      </div>
    </Page>
  );
}
