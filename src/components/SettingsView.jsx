import { useEffect, useState } from "react";
import { THEMES, WALLPAPERS } from "../themes.js";
import { useAppState } from "../AppState.jsx";
import { useAppKit } from "@reown/appkit/react";
import { useAccount } from "wagmi";
import { formatModelLabel } from "../models.js";
import { Page, Card, Tabs, Row, Toggle, Ghost, Section, Field, Primary } from "./ui.jsx";

const TABS = [
  { id: "general", label: "General" },
  { id: "appearance", label: "Appearance" },
  { id: "models", label: "Models" },
  { id: "subscriptions", label: "Subscriptions" },
  { id: "imagegen", label: "ImageGen" },
  { id: "video", label: "Video" },
  { id: "privacy", label: "Privacy" },
  { id: "network", label: "Network" },
  { id: "advanced", label: "Advanced" },
];

const FONTS = [
  { id: "palm", label: "PALM", detail: "Default /root UI font" },
  { id: "inter", label: "Inter", detail: "Clean sans-serif alternative" },
  { id: "system", label: "System", detail: "Browser default sans-serif" },
];


export default function SettingsView({ theme, onTheme, wallpaperId, onWallpaper, initialTab, onPrompt }) {
  const { project, model, fontId, setFontId, notice, prefs, togglePref, setPrefs, videos, upsertVideo, deleteVideo } = useAppState();
  const { isConnected } = useAccount();
  const { open } = useAppKit();
  const [tab, setTab] = useState(initialTab || "appearance");
  const [imagePrompt, setImagePrompt] = useState("");
  const [videoId, setVideoId] = useState(videos[0]?.id || "");
  const flags = prefs;
  const toggle = (key) => togglePref(key);

  return (
    <Page wide>
      <Tabs tabs={TABS} value={tab} onChange={setTab} />

      {tab === "general" && (
        <Card>
          <Row label="Workspace" value={`${project.label} · ${project.remote}`} />
          <Row label="Default model" value={isConnected ? formatModelLabel(model) : "Connect a wallet"} />
          <Row label="Auto-Prompt" value="Rewrite asks into a brief">
            <Toggle on={flags.autoprompt} onClick={() => toggle("autoprompt")} />
          </Row>
          <Row label="Language" value="English" />
        </Card>
      )}

      {tab === "appearance" && (
        <>
          <Section title="Theme">
            <Card className="p-3.5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {THEMES.map((item) => {
                  const selected = item.id === theme.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onTheme(item.id);
                        notice(item.name + " theme.");
                      }}
                      className={`rounded-[12px] border p-2.5 text-left ${
                        selected ? "border-[var(--accent)] bg-[var(--panel)]" : "border-[var(--stroke)] hover:bg-[var(--hover)]"
                      }`}
                    >
                      <div
                        className="mb-2.5 h-[52px] overflow-hidden rounded-lg border border-[var(--stroke-soft)]"
                        style={{ background: item.vars["--shell"] }}
                      >
                        <div className="flex h-full">
                          <span className="w-8" style={{ background: item.vars["--sidebar"] }} />
                          <span className="flex flex-1 flex-col">
                            <span className="h-3" style={{ background: item.vars["--top"] }} />
                            <span className="m-1.5 flex-1 rounded-sm" style={{ background: item.vars["--panel"] }} />
                          </span>
                        </div>
                      </div>
                      <div className="text-[12.5px]">{item.name}</div>
                      <div className="mt-0.5 text-[11px] text-[var(--muted)]">{item.description}</div>
                    </button>
                  );
                })}
              </div>
            </Card>
          </Section>
          <Section title="Typography">
            <Card>
              {FONTS.map((item) => (
                <Row key={item.id} label={item.label} value={item.detail}>
                  <Ghost
                    active={fontId === item.id}
                    onClick={() => {
                      setFontId(item.id);
                      notice(item.label + " face.");
                    }}
                  >
                    {fontId === item.id ? "Active" : "Use"}
                  </Ghost>
                </Row>
              ))}
            </Card>
          </Section>
          <Section title="Wallpaper">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {WALLPAPERS.map((item) => {
                const selected = item.id === wallpaperId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onWallpaper(item.id);
                      notice(item.id === "none" ? "Wallpaper off." : item.name + " wallpaper.");
                    }}
                    className={`overflow-hidden rounded-xl border text-left ${
                      selected ? "border-[var(--accent)]" : "border-[var(--stroke)] hover:bg-[var(--hover)]"
                    }`}
                  >
                    <div
                      className="h-16 bg-[var(--panel)] bg-cover bg-center"
                      style={item.src ? { backgroundImage: `url('${item.src}')` } : undefined}
                    />
                    <div className="px-3 py-2 text-[12.5px]">{item.name}</div>
                  </button>
                );
              })}
            </div>
          </Section>
        </>
      )}

      {tab === "models" && (
        <Card>
          {isConnected ? (
            <Row label="GLM 5.2 cloud" value="The only model on this harness">
              <Ghost active>Active</Ghost>
            </Row>
          ) : (
            <Row label="Models" value="Connect a wallet to use GLM 5.2 cloud">
              <Primary onClick={() => open({ view: "Connect" })}>Connect wallet</Primary>
            </Row>
          )}
        </Card>
      )}

      {tab === "subscriptions" && (
        <Card>
          <Row label="Claude" value={flags.subClaude ? "Linked on this browser" : "Not linked"}>
            <Ghost onClick={() => { toggle("subClaude"); notice(flags.subClaude ? "Claude unlinked." : "Claude linked."); }}>
              {flags.subClaude ? "Unlink" : "Link"}
            </Ghost>
          </Row>
          <p className="px-4 pb-3 text-[12px] leading-5 text-[var(--muted)]">
            Uses the Claude Code login already on this PC. Linking here remembers the choice for this browser. The desktop harness still reads ~/.claude/.credentials.json.
          </p>
          <Row label="OpenAI (ChatGPT / Codex)" value={flags.subOpenAi ? "Linked on this browser" : "Not linked"}>
            <Ghost onClick={() => { toggle("subOpenAi"); notice(flags.subOpenAi ? "OpenAI unlinked." : "OpenAI linked."); }}>
              {flags.subOpenAi ? "Unlink" : "Link"}
            </Ghost>
          </Row>
          <p className="px-4 pb-3 text-[12px] leading-5 text-[var(--muted)]">Browser device login at auth.openai.com/codex/device. Finish that on the machine that runs the desktop harness.</p>
          <Row label="Grok (SuperGrok / X Premium+)" value={flags.subGrok ? "Linked on this browser" : "Not linked"}>
            <Ghost onClick={() => { toggle("subGrok"); notice(flags.subGrok ? "Grok unlinked." : "Grok linked."); }}>
              {flags.subGrok ? "Unlink" : "Link"}
            </Ghost>
          </Row>
          <p className="px-4 pb-3 text-[12px] leading-5 text-[var(--muted)]">Browser device login at auth.x.ai.</p>
        </Card>
      )}

      {tab === "imagegen" && (
        <>
          <Card>
            <Row label="ImageGen" value={flags.imageCheckpoint + " · " + (flags.imagegen ? "enabled" : "off")}>
              <Toggle on={flags.imagegen} onClick={() => toggle("imagegen")} />
            </Row>
            <Row label="Always expose image tools" value="generate_image on every turn">
              <Toggle on={flags.imageAlways} onClick={() => toggle("imageAlways")} />
            </Row>
          </Card>
          <Card className="mt-3 space-y-3 p-4">
            <Field label="API URL" value={flags.imageUrl} onChange={(value) => setPrefs({ imageUrl: value })} />
            <Field label="Checkpoint" value={flags.imageCheckpoint} onChange={(value) => setPrefs({ imageCheckpoint: value })} />
            <Field label="Size" value={flags.imageSize} onChange={(value) => setPrefs({ imageSize: value })} />
            <p className="text-[12px] leading-5 text-[var(--muted)]">
              Comfy runs on the desktop harness at that URL. This page stores the preference. Other checkpoints are not supported.
            </p>
            <Field label="Queue a prompt" value={imagePrompt} onChange={setImagePrompt} placeholder="A quiet alpine lake at dusk" />
            <Primary
              onClick={() => {
                const text = imagePrompt.trim();
                if (!text) {
                  notice("Write a prompt first.");
                  return;
                }
                onPrompt?.("Generate an image with " + flags.imageCheckpoint + " at " + flags.imageSize + ": " + text);
                notice("Prompt is in the composer.");
              }}
            >
              Send to Agent
            </Primary>
          </Card>
        </>
      )}

      {tab === "video" && (
        <>
          <Card>
            <Row label="Root Video" value="HTML compositions rendered to MP4 in Agent chat">
              <Toggle on={flags.video} onClick={() => toggle("video")} />
            </Row>
            <Row label="Runtime" value="Renders on the desktop harness" />
          </Card>
          <div className="mt-3 grid gap-3 lg:grid-cols-[220px_1fr]">
            <Card className="p-2">
              {videos.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setVideoId(item.id)}
                  className={`w-full rounded-lg px-2 py-2 text-left text-[13px] ${item.id === videoId ? "bg-[var(--sidebar-sel)]" : "hover:bg-[var(--hover)]"}`}
                >
                  {item.name}
                </button>
              ))}
              <div className="px-1 py-2">
                <Ghost
                  onClick={() => {
                    const id = "vid-" + Date.now();
                    upsertVideo({ id, name: "Untitled", html: "<section class=\"stage\"><h1>Untitled</h1></section>\n" });
                    setVideoId(id);
                  }}
                >
                  New
                </Ghost>
              </div>
            </Card>
            <VideoEditor id={videoId} videos={videos} upsertVideo={upsertVideo} deleteVideo={deleteVideo} onPrompt={onPrompt} notice={notice} />
          </div>
        </>
      )}

      {tab === "privacy" && (
        <Card>
          <Row label="Privacy Composer" value="Scan prompts before send">
            <Toggle on={flags.privacy} onClick={() => toggle("privacy")} />
          </Row>
          <Row label="Share traces" value={flags.telemetry ? "IP lookup on the Telemetry check" : "IP lookup off"}>
            <Toggle on={flags.telemetry} onClick={() => toggle("telemetry")} />
          </Row>
        </Card>
      )}

      {tab === "network" && (
        <Card>
          <Row label="Transport" value="HTTPS" />
          <Row label="Project name in header" value="Shown" />
          <Row label="Outbound" value="Only when you ship or call Farm / Ops" />
        </Card>
      )}

      {tab === "advanced" && (
        <>
          <Section title="API">
            <Card>
              <Row label="API base" value="https://api.useroot.sh" />
            </Card>
          </Section>
          <Section title="MCP servers">
            <Card>
              <Row label="filesystem" value="Connected" />
              <Row label="github" value="Connected" />
              <Row label="browser" value="Off">
                <Ghost onClick={() => notice("Browser MCP enabled.")}>Enable</Ghost>
              </Row>
            </Card>
          </Section>
          <Card>
            <Row label="Reset appearance" value="Theme, wallpaper, and font">
              <Ghost
                onClick={() => {
                  localStorage.removeItem("root-web-theme");
                  localStorage.removeItem("root-web-wallpaper");
                  localStorage.removeItem("root-web-font");
                  onTheme("default");
                  onWallpaper("none");
                  setFontId("palm");
                  notice("Appearance reset.");
                }}
              >
                Reset
              </Ghost>
            </Row>
          </Card>
        </>
      )}
    </Page>
  );
}

function VideoEditor({ id, videos, upsertVideo, deleteVideo, onPrompt, notice }) {
  const video = videos.find((item) => item.id === id) || videos[0];
  const [html, setHtml] = useState(video?.html || "");
  const [name, setName] = useState(video?.name || "");

  useEffect(() => {
    setHtml(video?.html || "");
    setName(video?.name || "");
  }, [video?.id]);

  if (!video) return <Card className="px-4 py-3 text-[13px] text-[var(--muted)]">No compositions yet.</Card>;

  return (
    <Card className="space-y-3 p-4">
      <Field label="Name" value={name} onChange={setName} />
      <textarea
        value={html}
        onChange={(event) => setHtml(event.target.value)}
        rows={12}
        spellCheck={false}
        className="w-full resize-y rounded-lg border border-[var(--stroke)] bg-[var(--input)] px-3 py-2 font-mono text-[12.5px] leading-5 outline-none"
      />
      <div className="flex flex-wrap gap-2">
        <Primary
          onClick={() => {
            upsertVideo({ ...video, name: name.trim() || video.name, html });
            notice("Composition saved.");
          }}
        >
          Save
        </Primary>
        <Ghost
          onClick={() => {
            onPrompt?.("Render the Root Video composition “" + (name.trim() || video.name) + "” to MP4.\n\n" + html);
            notice("Render request is in the composer.");
          }}
        >
          Ask Agent to render
        </Ghost>
        <Ghost
          onClick={() => {
            deleteVideo(video.id);
            notice("Composition removed.");
          }}
        >
          Delete
        </Ghost>
      </div>
    </Card>
  );
}
