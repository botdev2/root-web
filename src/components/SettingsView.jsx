import { useState } from "react";
import { THEMES } from "../themes.js";
import { useAppState } from "../AppState.jsx";
import { Page, Card, Tabs, Row, Toggle, Ghost, Section } from "./ui.jsx";

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

const MODELS = [
  { name: "qwen2.5:14b", state: "Active" },
  { name: "qwen2.5:7b", state: "Installed" },
  { name: "llama3.1:8b", state: "Catalog" },
];

export default function SettingsView({ theme, onTheme, wallpaperOn, onWallpaper, initialTab }) {
  const { project, model, setModel, fontId, setFontId, notice } = useAppState();
  const [tab, setTab] = useState(initialTab || "appearance");
  const [flags, setFlags] = useState({
    privacy: true,
    autoprompt: false,
    telemetry: true,
    imagegen: false,
    imageAlways: false,
    video: false,
    subClaude: false,
    subGpt: false,
  });
  const toggle = (key) => setFlags((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <Page wide>
      <Tabs tabs={TABS} value={tab} onChange={setTab} />

      {tab === "general" && (
        <Card>
          <Row label="Workspace" value={`${project.label} · ${project.remote}`} />
          <Row label="Default model" value={model} />
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
            <Card className="overflow-hidden">
              <div
                className="h-28 bg-cover bg-center"
                style={{
                  backgroundImage: theme.wallpaper ? "url('/serenity-wallpaper.jpg')" : "url('/wallpaper.png')",
                }}
              />
              <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-[13px]">{theme.wallpaper ? "Serenity lakeside" : "Storm ocean"}</div>
                  <div className="mt-0.5 text-[11px] text-[var(--muted)]">
                    Storm ocean by default. Serenity family swaps to the lakeside still.
                  </div>
                </div>
                <Ghost
                  active={wallpaperOn}
                  onClick={() => {
                    onWallpaper(!wallpaperOn);
                    notice(wallpaperOn ? "Wallpaper off." : "Wallpaper on.");
                  }}
                >
                  {wallpaperOn ? "On" : "Off"}
                </Ghost>
              </div>
            </Card>
          </Section>
        </>
      )}

      {tab === "models" && (
        <Card>
          {MODELS.map((item) => (
            <Row key={item.name} label={item.name} value={item.name === model ? "Active" : item.state}>
              {item.state === "Catalog" && item.name !== model ? (
                <Ghost
                  onClick={() => {
                    setModel(item.name);
                    notice(item.name + " pulled.");
                  }}
                >
                  Pull
                </Ghost>
              ) : (
                <Ghost
                  active={item.name === model}
                  onClick={() => {
                    setModel(item.name);
                    notice(item.name + " is the default.");
                  }}
                >
                  {item.name === model ? "Active" : "Use"}
                </Ghost>
              )}
            </Row>
          ))}
          <Row label="Uncensored catalog" value="Off" />
        </Card>
      )}

      {tab === "subscriptions" && (
        <Card>
          <Row label="Claude" value="Anthropic · not connected">
            <Toggle on={flags.subClaude} onClick={() => toggle("subClaude")} />
          </Row>
          <Row label="GPT" value="OpenAI · not connected">
            <Toggle on={flags.subGpt} onClick={() => toggle("subGpt")} />
          </Row>
        </Card>
      )}

      {tab === "imagegen" && (
        <Card>
          <Row label="ImageGen" value="FLUX.2 Klein 4B · Comfy on port 8188">
            <Toggle on={flags.imagegen} onClick={() => toggle("imagegen")} />
          </Row>
          <Row label="Default size" value="1024 × 1024" />
          <Row label="Always expose image tools" value="generate_image on every turn">
            <Toggle on={flags.imageAlways} onClick={() => toggle("imageAlways")} />
          </Row>
          <div className="px-4 py-3">
            <Ghost
              onClick={() => {
                toggle("imagegen");
                notice(flags.imagegen ? "ImageGen stopped." : "Comfy started on 8188.");
              }}
            >
              {flags.imagegen ? "Stop ComfyUI" : "Start ComfyUI"}
            </Ghost>
          </div>
        </Card>
      )}

      {tab === "video" && (
        <Card>
          <Row label="Root Video" value="HTML → MP4 in Agent chat">
            <Toggle on={flags.video} onClick={() => toggle("video")} />
          </Row>
          <Row label="Runtime" value="Installed" />
          <Row label="Last render" value="none" />
        </Card>
      )}

      {tab === "privacy" && (
        <Card>
          <Row label="Privacy Composer" value="Scan prompts before send">
            <Toggle on={flags.privacy} onClick={() => toggle("privacy")} />
          </Row>
          <Row label="Share traces" value="Stay on this device">
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
                  onTheme("midnight");
                  onWallpaper(true);
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
