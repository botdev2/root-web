import { useState } from "react";
import { TEMPLATES } from "../../mock.js";
import { Page, Card, Ghost } from "../ui.jsx";

const CATS = ["All", "Web", "Backend", "Mobile"];

export default function TemplatesView({ onCreate }) {
  const [cat, setCat] = useState("All");
  const rows = TEMPLATES.filter((item) => cat === "All" || item.cat === cat);

  return (
    <Page wide>
      <div className="mb-4 flex flex-wrap gap-1">
        {CATS.map((name) => (
          <Ghost key={name} active={cat === name} onClick={() => setCat(name)}>
            {name}
          </Ghost>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((item) => (
          <Card key={item.id} className="p-4">
            <div className="text-[11px] text-[var(--faint)]">{item.cat}</div>
            <div className="mt-1 text-[16px]">{item.title}</div>
            <div className="mt-1 text-[12px] text-[var(--muted)]">{item.stack}</div>
            <div className="mt-4">
              <Ghost onClick={() => onCreate?.(item)}>Create</Ghost>
            </div>
          </Card>
        ))}
      </div>
    </Page>
  );
}
