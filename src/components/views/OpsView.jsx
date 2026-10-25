import { useState } from "react";
import { useAppState } from "../../AppState.jsx";
import { Page, Card, Field, Ghost, Primary, Section } from "../ui.jsx";

const OPS = "https://ops.palmaierc.com";

export default function OpsView() {
  const { project, sites, deploys, addSite, removeSite, queueDeploy, markSiteLive, notice } = useAppState();
  const [repo, setRepo] = useState(project.remote);
  const [branch, setBranch] = useState("main");
  const [name, setName] = useState(project.label);
  const [domain, setDomain] = useState("");
  const [open, setOpen] = useState(false);
  const latest = deploys[0];

  return (
    <Page wide>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="text-[12px] text-[var(--muted)]">
          {latest ? latest.status + " · " + latest.name : "Wallet ready · nothing is spent on Start"}
        </div>
        <Ghost
          onClick={() => {
            setOpen(true);
            notice("Ops console open.");
          }}
        >
          {open ? "Console open" : "Open console"}
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
              <div className="flex flex-wrap gap-2">
                <Primary
                  onClick={() => {
                    const label = name.trim();
                    if (!label) {
                      notice("Name the site first.");
                      return;
                    }
                    queueDeploy({ name: label, repo, branch });
                    setOpen(true);
                    notice("Awaiting a signature on Ops.");
                  }}
                >
                  Start
                </Primary>
                {latest?.status === "awaiting signature" && (
                  <Ghost
                    onClick={() => {
                      markSiteLive(latest.name);
                      notice(latest.name + " marked live.");
                    }}
                  >
                    Mark live
                  </Ghost>
                )}
              </div>
            </Card>
          </Section>
          <Section title="Live domains">
            <Card className="mb-2 space-y-3 p-4">
              <Field label="Add domain" value={domain} onChange={setDomain} placeholder="app.example.com" />
              <Ghost
                onClick={() => {
                  addSite(domain);
                  setDomain("");
                  notice("Domain added.");
                }}
              >
                Add
              </Ghost>
            </Card>
            <div className="space-y-2">
              {sites.map((site) => (
                <Card key={site.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <div className="truncate text-[13px]">{site.name}</div>
                    <div className="text-[11px] text-[var(--green)]">{site.status}</div>
                  </div>
                  <Ghost onClick={() => removeSite(site.id)}>Remove</Ghost>
                </Card>
              ))}
            </div>
          </Section>
          {deploys.length > 0 && (
            <Section title="Deploys">
              <div className="space-y-2">
                {deploys.slice(0, 6).map((item) => (
                  <Card key={item.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[13px]">{item.name}</div>
                        <div className="text-[11px] text-[var(--faint)]">
                          {item.branch} · {item.when}
                        </div>
                      </div>
                      <span className="text-[11px] text-[var(--muted)]">{item.status}</span>
                    </div>
                    <pre className="mt-2 overflow-x-auto text-[12px] text-[var(--muted)]">{item.log}</pre>
                  </Card>
                ))}
              </div>
            </Section>
          )}
        </div>
        <Card className="flex min-h-[420px] flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--stroke-soft)] px-4 py-2 text-[12px] text-[var(--faint)]">
            <span>ops.palmaierc.com</span>
            <a href={OPS} target="_blank" rel="noreferrer" className="text-[var(--ink)]">
              New tab
            </a>
          </div>
          {open ? (
            <iframe title="Ops" src={OPS} className="min-h-[380px] w-full flex-1 bg-[var(--bg)]" />
          ) : (
            <div className="flex flex-1 items-center justify-center px-6 text-center text-[13px] text-[var(--muted)]">
              Open console to load the Ops pane. Start records a deploy and waits for the wallet signature there.
            </div>
          )}
        </Card>
      </div>
    </Page>
  );
}
