import { useState } from "react";
import { Page, Card, Row, Ghost } from "../ui.jsx";
import { APP_CHANNEL, APP_VERSION } from "../../version.js";

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
    </Page>
  );
}
