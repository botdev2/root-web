import { useState } from "react";
import { useAppState } from "../../AppState.jsx";
import { Page, Card, Field, Ghost, Primary, Section } from "../ui.jsx";

const SITES = [
  { name: "landing.palmaierc.com", status: "Live" },
  { name: "docs.palmaierc.com", status: "Live" },
  { name: "wiki.palmaierc.com", status: "Probe" },
];

export default function OpsView() {
  const { project, notice } = useAppState();
  const [repo, setRepo] = useState(project.remote);
  const [branch, setBranch] = useState("main");
  const [name, setName] = useState(project.label);
  const [status, setStatus] = useState("Wallet ready · nothing is spent on Start");
  const [open, setOpen] = useState(false);

  return (
    <Page wide>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="text-[12px] text-[var(--muted)]">{status}</div>
        <Ghost
          onClick={() => {
            setOpen(true);
            setStatus("Opened ops.palmaierc.com in this pane.");
            notice("Ops console open.");
          }}
        >
          Open console
        </Ghost>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <Section title="Deploy">
            <Card className="space-y-3 p-4">
              <Field label="Project" value={repo} onChange={setRepo} />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Branch" value={branch} onChange={setBranch} />
                <Field label="Name" value={name} onChange={setName} />
              </div>
              <Primary
                onClick={() => {
                  setStatus("Signed · building dist · upload queued.");
                  notice("Ops start queued.");
                }}
              >
                Start
              </Primary>
            </Card>
          </Section>
          <Section title="Live domains">
            <div className="space-y-2">
              {SITES.map((site) => (
                <Card key={site.name} className="flex items-center justify-between px-4 py-3">
                  <div className="text-[13px]">{site.name}</div>
                  <span className="text-[11px] text-[var(--green)]">{site.status}</span>
                </Card>
              ))}
            </div>
          </Section>
        </div>
        <Card className="flex min-h-[320px] flex-col overflow-hidden">
          <div className="border-b border-[var(--stroke-soft)] px-4 py-2 text-[12px] text-[var(--faint)]">
            ops.palmaierc.com
          </div>
          <div className="flex flex-1 items-center justify-center text-[13px] text-[var(--muted)]">
            {open ? "Console · wallet already this session" : "Open console to embed the Ops pane"}
          </div>
        </Card>
      </div>
    </Page>
  );
}
