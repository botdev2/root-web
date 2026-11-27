import { useState } from "react";
import { Page, Card, Row, Ghost, Section } from "../ui.jsx";
import { APP_CHANNEL, APP_VERSION } from "../../version.js";

const NOTES = [
  {
    version: "0.2.56",
    title: "$PALM marketplace · DAO escrow",
    body: "Marketplace is now a $PALM utility: platform-held escrow supervised by the PALM DAO. 1% fee splits 30% to supervisors and 70% to holder revshare. Disputes escalate to DAO settle.",
  },
  {
    version: "0.2.55",
    title: "/root desk update",
    body: "Wallet-native agent desk on chat.useroot.sh. Hamrin ships code to your Hub; Miles greets you by time of day; city themes use real 4K photos.",
  },
];

export default function UpdatesView() {
  const [status, setStatus] = useState("You’re on the latest build.");
  const shell = typeof document !== "undefined" && document.documentElement.dataset.shell === "mobile" ? "Mobile" : "Desktop";

  return (
    <Page>
      <Card>
        <Row label="Channel" value={APP_CHANNEL === "stable" ? "Stable" : APP_CHANNEL} />
        <Row label="Version" value={APP_VERSION} />
        <Row label="Shell" value={shell} />
        <Row label="Last check" value="just now" />
        <div className="px-4 py-3">
          <Ghost onClick={() => setStatus(`Checked the channel — still ${APP_VERSION} (${shell.toLowerCase()}).`)}>Check for updates</Ghost>
          <div className="mt-2 text-[12px] text-[var(--muted)]">{status}</div>
        </div>
      </Card>

      <Section title="Release notes">
        <Card>
          {NOTES.map((note) => (
            <div key={note.version} className="border-b border-[var(--stroke-soft)] px-4 py-4 last:border-b-0">
              <div className="text-[11px] tracking-[0.18em] text-[var(--faint)]">{note.version}</div>
              <div className="mt-1 text-[15px] text-[var(--ink)]">{note.title}</div>
              <p className="mt-2 text-[13px] leading-5 text-[var(--muted)]">{note.body}</p>
            </div>
          ))}
        </Card>
      </Section>
    </Page>
  );
}
