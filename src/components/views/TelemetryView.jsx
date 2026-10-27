import { useEffect, useState } from "react";
import { useAppState } from "../../AppState.jsx";
import { formatBytes, runTelemetryCheck } from "../../telemetryCheck.js";
import { Page, Card, Ghost, Row, Section } from "../ui.jsx";

const TONE = {
  ok: "text-[var(--green)]",
  warn: "text-[var(--amber)]",
  bad: "text-[var(--rose)]",
  note: "text-[var(--faint)]",
};

const MARK = {
  ok: "Pass",
  warn: "Attention",
  bad: "Fail",
  note: "Note",
};

export default function TelemetryView() {
  const { prefs } = useAppState();
  const [report, setReport] = useState(null);
  const [running, setRunning] = useState(false);

  const run = async () => {
    setRunning(true);
    try {
      setReport(await runTelemetryCheck({ lookupNetwork: prefs.telemetry !== false }));
    } finally {
      setRunning(false);
    }
  };

  useEffect(() => {
    run();
    // Re-check when the IP lookup preference changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefs.telemetry]);

  return (
    <Page>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-[62ch] text-[13px] leading-5 text-[var(--muted)]">
          A check of this browser, then a full pass over the connection: TLS, response headers, mixed content, WebRTC candidates, and the address path.
        </p>
        <Ghost onClick={run}>{running ? "Checking…" : "Check again"}</Ghost>
      </div>

      {!report && <Card className="px-4 py-3 text-[13px] text-[var(--muted)]">Checking this browser…</Card>}

      {report && (
        <>
          <div className="mb-6 grid gap-3 sm:grid-cols-2">
            <Card className="p-4">
              <div className="text-[11px] text-[var(--faint)]">Browser</div>
              <div className={`mt-1 text-[22px] ${TONE[report.browser.tone]}`}>{report.browser.title}</div>
              <p className="mt-2 text-[12.5px] leading-5 text-[var(--muted)]">{report.browser.detail}</p>
            </Card>
            <Card className="p-4">
              <div className="text-[11px] text-[var(--faint)]">Network</div>
              <div className={`mt-1 text-[22px] ${TONE[report.network.tone]}`}>{report.network.title}</div>
              <p className="mt-2 text-[12.5px] leading-5 text-[var(--muted)]">{report.network.detail}</p>
            </Card>
          </div>

          <Section title="Cookies">
            <Card>
              <Row label="Readable cookies" value={report.cookiesEnabled ? String(report.cookies.length) : "Cookies are disabled"} />
              <Row label="Tracker cookies" value={report.trackerCookies.length ? report.trackerCookies.join(", ") : "None on this site"} />
              <Row
                label="Scope"
                value="A page can only read cookies for this site. Tracker names in that jar, and tracker hosts this page called, are what show up here."
              />
            </Card>
          </Section>

          <Section title="Storage">
            <Card>
              <Row label="Local storage" value={`${report.localKeys} keys · ${formatBytes(report.localBytes)}`} />
              <Row label="Session storage" value={`${report.sessionKeys} keys · ${formatBytes(report.sessionBytes)}`} />
              <Row
                label="Site data"
                value={report.usage?.usage != null ? formatBytes(report.usage.usage) + " used" : "Unavailable"}
              />
              <Row label="Service workers" value={String(report.workers)} />
            </Card>
          </Section>

          <Section title="Trackers">
            <Card>
              <Row label="Scripts" value={report.globals.length ? report.globals.join(", ") : "No known tracker globals"} />
              <Row label="Tracker hosts" value={report.trackerHosts.length ? report.trackerHosts.join(", ") : "None loaded"} />
              <Row label="Other hosts" value={otherHosts(report) || "None"} />
              <Row label="Global Privacy Control" value={report.gpc ? "On" : "Off"} />
              <Row label="Do Not Track" value={report.dnt ? "On" : "Off"} />
            </Card>
          </Section>

          <Section title="Network">
            <Card>
              {(report.network.findings || []).map((item) => (
                <div key={item.title} className="border-b border-[var(--stroke-soft)] px-4 py-3 last:border-b-0">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[13px]">{item.title}</div>
                    <div className={`text-[11px] ${TONE[item.tone] || TONE.note}`}>{MARK[item.tone] || "Note"}</div>
                  </div>
                  <p className="mt-1 text-[12px] leading-5 text-[var(--muted)]">{item.detail}</p>
                </div>
              ))}
            </Card>
          </Section>
        </>
      )}
    </Page>
  );
}

function otherHosts(report) {
  return report.hosts.filter((host) => !report.trackerHosts.includes(host)).slice(0, 8).join(", ");
}
