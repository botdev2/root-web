import { useState } from "react";
import { Page, Card, Row, Ghost } from "../ui.jsx";

export default function UpdatesView() {
  const [status, setStatus] = useState("You’re on the latest build.");

  return (
    <Page>
      <Card>
        <Row label="Channel" value="Stable" />
        <Row label="Version" value="0.1.0" />
        <Row label="Last check" value="just now" />
        <div className="px-4 py-3">
          <Ghost onClick={() => setStatus("Checked the channel — still 0.1.0.")}>Check for updates</Ghost>
          <div className="mt-2 text-[12px] text-[var(--muted)]">{status}</div>
        </div>
      </Card>
    </Page>
  );
}
