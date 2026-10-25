import { useEffect, useState } from "react";
import { useAppState } from "../../AppState.jsx";
import { formatBytes, runTelemetryCheck } from "../../telemetryCheck.js";
import { Page, Card, Ghost, Row, Section } from "../ui.jsx";

const TONE = {
  ok: "text-[var(--green)]",
  warn: "text-[var(--amber)]",
  bad: "text-[var(--rose)]",
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
          A check of this browser and this connection: cookies, tracker scripts, storage, and whether the network address is exposed.
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
              <Row label="Page" value={report.https ? "HTTPS" : "HTTP"} />
              <Row label="Secure context" value={report.secure ? "Yes" : "No"} />
              <Row label="Link" value={linkLine(report.link)} />
              <Row label="Public IP" value={ipLine(report)} />
              <Row label="Place" value={report.lookup?.place || (report.lookedUp ? "Lookup returned no place" : "Lookup skipped")} />
              <Row label="Network name" value={report.lookup?.isp || "—"} />
              <Row label="Flags" value={flagLine(report.lookup)} />
              <Row label="WebRTC public" value={report.publicAddresses.length ? report.publicAddresses.join(", ") : "No public address exposed"} />
              <Row label="WebRTC local" value={report.privateAddresses.length ? report.privateAddresses.join(", ") : "No local address exposed"} />
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

function linkLine(link) {
  if (!link?.type) return "Hidden by this browser";
  const parts = [link.type];
  if (link.rtt != null) parts.push(link.rtt + " ms");
  if (link.saveData) parts.push("data saver");
  return parts.join(" · ");
}

function ipLine(report) {
  if (!report.lookedUp) return "Off — Share traces is disabled in Settings";
  return report.lookup?.ip || "Lookup failed";
}

function flagLine(lookup) {
  if (!lookup) return "—";
  const flags = [];
  if (lookup.vpn) flags.push("VPN");
  if (lookup.proxy) flags.push("Proxy");
  if (lookup.tor) flags.push("Tor");
  if (lookup.hosting) flags.push("Datacenter");
  return flags.length ? flags.join(" · ") : "No proxy, VPN, or Tor flag";
}
