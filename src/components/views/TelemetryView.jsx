import { useAppState } from "../../AppState.jsx";
import { Page, Card, Row, Section } from "../ui.jsx";

const EVENTS = [
  { t: "12:04", kind: "chat.send", detail: "qwen2.5 · 142 tokens" },
  { t: "12:03", kind: "farm.status", detail: "farm-api.palmaierc.com ok" },
  { t: "11:58", kind: "ops.probe", detail: "landing.palmaierc.com 200" },
  { t: "11:40", kind: "git.fetch", detail: "project fetch" },
];

export default function TelemetryView() {
  const { project } = useAppState();
  return (
    <Page>
      <Section title="Session privacy">
        <Card>
          <Row label="Transport" value="HTTPS" />
          <Row label="Identity" value="Signed in · browser session" />
          <Row label="Project name" value={project.label + " · shown in the header"} />
          <Row label="IP" value="Not collected" />
        </Card>
      </Section>
      <Section title="Transfer counts">
        <Card>
          <Row label="chat.send" value="18" />
          <Row label="farm.status" value="4" />
          <Row label="ops.probe" value="9" />
        </Card>
      </Section>
      <Section title="Recent events">
        <Card>
          {EVENTS.map((event) => (
            <Row
              key={event.t + event.kind}
              label={event.kind}
              value={`${event.t} · ${event.kind === "git.fetch" ? project.label : event.detail}`}
            />
          ))}
        </Card>
      </Section>
    </Page>
  );
}
