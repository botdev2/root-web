import { useState } from "react";
import { useAppState } from "../../AppState.jsx";
import { Page, Card, Ghost } from "../ui.jsx";
import { Icon } from "../Icons.jsx";

const FLOWS = ["sample-solcard-setup", "mail-otp", "kyc-capture"];

export default function CrawlerView() {
  const { notice } = useAppState();
  const [recording, setRecording] = useState(false);
  const [urlA, setUrlA] = useState("https://example.com/signup");
  const [urlB, setUrlB] = useState("https://mail.example.com");
  const [flow, setFlow] = useState(FLOWS[0]);
  const [playing, setPlaying] = useState(false);

  return (
    <Page wide>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Ghost
          active={recording}
          onClick={() => {
            setRecording((value) => !value);
            setPlaying(false);
            notice(recording ? "Recording stopped." : "Recording pane A.");
          }}
        >
          <span className="inline-flex items-center gap-1.5">
            <Icon name="record" size={10} />
            {recording ? "Recording…" : "Record"}
          </span>
        </Ghost>
        <Ghost
          active={playing}
          onClick={() => {
            setPlaying(true);
            setRecording(false);
            notice("Playing " + flow);
          }}
        >
          <span className="inline-flex items-center gap-1.5">
            <Icon name="play" size={10} />
            Play {flow}
          </span>
        </Ghost>
        {FLOWS.map((name) => (
          <Ghost key={name} active={flow === name} onClick={() => setFlow(name)}>
            {name}
          </Ghost>
        ))}
      </div>
      <div className="grid min-h-[360px] gap-3 lg:grid-cols-2">
        <Pane label="Pane A" url={urlA} onUrl={setUrlA} live={recording} playing={playing} />
        <Pane label="Pane B · mail" url={urlB} onUrl={setUrlB} live={false} playing={false} />
      </div>
    </Page>
  );
}

function Pane({ label, url, onUrl, live, playing }) {
  return (
    <Card className="flex min-h-[280px] flex-col overflow-hidden">
      <div className="flex items-center gap-2 border-b border-[var(--stroke-soft)] px-3 py-2">
        <span className="shrink-0 text-[11px] text-[var(--faint)]">{label}</span>
        <input
          value={url}
          onChange={(event) => onUrl(event.target.value)}
          className="h-8 min-w-0 flex-1 rounded-md border border-[var(--stroke)] bg-[var(--input)] px-2 text-[12px] outline-none"
        />
      </div>
      <div className="flex flex-1 items-center justify-center bg-[color-mix(in_srgb,var(--code)_70%,transparent)] text-[12px] text-[var(--faint)]">
        {live ? "Capturing clicks and fills…" : playing ? "Replaying flow…" : "Browser pane"}
      </div>
    </Card>
  );
}
