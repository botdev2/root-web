import { useEffect, useMemo, useState } from "react";
import { applyTheme, findTheme, readSavedThemeId, readSavedWallpaper } from "./themes.js";
import { useAppState } from "./AppState.jsx";
import TitleBar from "./components/TitleBar.jsx";
import Sidebar from "./components/Sidebar.jsx";
import HeaderBar from "./components/HeaderBar.jsx";
import HomeView from "./components/HomeView.jsx";
import ChatView from "./components/ChatView.jsx";
import SettingsView from "./components/SettingsView.jsx";
import Composer from "./components/Composer.jsx";
import FilesInspector from "./components/FilesInspector.jsx";
import CommandPalette from "./components/CommandPalette.jsx";
import GettingStarted from "./components/GettingStarted.jsx";
import Toast from "./components/Toast.jsx";
import AutomationsView from "./components/views/AutomationsView.jsx";
import ReasoningView from "./components/views/ReasoningView.jsx";
import CrawlerView from "./components/views/CrawlerView.jsx";
import OpsView from "./components/views/OpsView.jsx";
import NotesView from "./components/views/NotesView.jsx";
import AccountView from "./components/views/AccountView.jsx";
import UpdatesView from "./components/views/UpdatesView.jsx";
import TelemetryView from "./components/views/TelemetryView.jsx";
import HelpView from "./components/views/HelpView.jsx";
import TemplatesView from "./components/views/TemplatesView.jsx";
import EditorView from "./components/views/EditorView.jsx";
import PluginsView from "./components/views/PluginsView.jsx";
import SignupOverlay from "./components/SignupOverlay.jsx";
import WalletSync from "./components/WalletSync.jsx";
import UnderConstruction from "./components/UnderConstruction.jsx";

const CHAT_VIEWS = new Set(["home", "chat"]);

function replyFor({ mode, autoPrompt, project, text }) {
  if (mode === "ask") {
    return "Ask mode stays read-only on " + project.label + ". I’ll answer from the tree without writing files.";
  }
  if (mode === "plan") {
    return "Plan for " + project.label + ": 1) inspect the workspace 2) draft the change 3) wait for your approval before Agent writes.";
  }
  if (autoPrompt) {
    return "Auto-Prompt turned that into a brief. First step on " + project.label + ": open the entry point and confirm the current behavior.";
  }
  const hint = text?.trim() ? " — “" + text.trim().slice(0, 72) + "”" : "";
  return "On " + project.label + hint + ". I’ll read the workspace, then propose the smallest change that moves it forward.";
}

export default function App() {
  const state = useAppState();
  const { addProject, addSession, mode, notice, project } = state || {};
  const [themeId, setThemeId] = useState(readSavedThemeId);
  const [wallpaperOn, setWallpaperOn] = useState(readSavedWallpaper);
  const [view, setView] = useState(() => {
    try {
      return new URLSearchParams(window.location.search).get("view") || "home";
    } catch {
      return "home";
    }
  });
  const [sessionId, setSessionId] = useState(null);
  const [sessionTitle, setSessionTitle] = useState("New Agent");
  const [draft, setDraft] = useState("");
  const [local, setLocal] = useState({});
  const [filesOpen, setFilesOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [autoPrompt, setAutoPrompt] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState("appearance");
  const [attachments, setAttachments] = useState([]);
  const [unlockOpen, setUnlockOpen] = useState(false);
  const theme = useMemo(() => findTheme(themeId), [themeId]);

  useEffect(() => {
    applyTheme(theme, wallpaperOn);
  }, [theme, wallpaperOn]);

  useEffect(() => {
    const onKey = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen(true);
      }
      if (event.key === "Escape") {
        setPaletteOpen(false);
        setNavOpen(false);
        setFilesOpen(false);
        setConnectOpen(false);
        setUnlockOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const openView = (id) => {
    setView(id);
    setNavOpen(false);
    if (id === "settings") setSettingsTab("appearance");
  };

  const openSession = (id, title, nextView = "chat") => {
    setSessionId(id);
    setSessionTitle(title);
    setView(nextView);
    setNavOpen(false);
  };

  const send = (text = draft) => {
    const value = text.trim();
    if (!value && attachments.length === 0) return;
    const id = sessionId || "draft-" + Date.now();
    const title = sessionTitle === "New Agent" && value ? value.slice(0, 42) : sessionTitle;
    setLocal((prev) => ({
      ...prev,
      [id]: [
        ...(prev[id] || []),
        { role: "user", text: value || "Attached files", files: attachments.map((file) => file.name) },
        {
          role: "assistant",
          text: replyFor({ mode, autoPrompt, project, text: value }),
          tools: mode === "agent" ? [{ name: "project.read", detail: project.label }] : [],
        },
      ],
    }));
    if (!sessionId) {
      addSession({ id, title });
      setSessionId(id);
      setSessionTitle(title);
    }
    setDraft("");
    setAttachments([]);
    setView("chat");
  };

  const showComposer = CHAT_VIEWS.has(view);
  if (!state) return null;

  return (
    <div className="relative isolate h-full min-h-0 overflow-hidden">
      {wallpaperOn && <div className="wallpaper-layer" />}
      <div className="shell relative z-[1] flex h-full min-h-0 flex-col text-[var(--ink)]">
        <TitleBar />
        <div className="relative flex min-h-0 flex-1">
          {navOpen && (
            <button
              type="button"
              className="absolute inset-0 z-20 bg-[color-mix(in_srgb,#000_40%,transparent)] md:hidden"
              aria-label="Close menu"
              onClick={() => setNavOpen(false)}
            />
          )}
          <div
            className={`absolute inset-y-0 left-0 z-30 transition-transform duration-200 md:static md:z-auto md:translate-x-0 ${
              navOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
            }`}
          >
            <Sidebar
              view={view}
              sessionId={sessionId}
              onView={openView}
              onSearch={() => setPaletteOpen(true)}
              onNavigate={() => setNavOpen(false)}
              onConnect={() => setConnectOpen(true)}
              onAddProject={() => openView("templates")}
              onNewChat={() => {
                setView("home");
                setSessionId(null);
                setSessionTitle("New Agent");
              }}
              onSession={(id, title) => openSession(id, title)}
            />
          </div>
          <main className="flex min-w-0 flex-1 flex-col">
            <HeaderBar
              view={view}
              sessionTitle={sessionTitle}
              filesOpen={filesOpen}
              onMenu={() => {
                setFilesOpen(false);
                setNavOpen((open) => !open);
              }}
              onHelp={() => openView("help")}
              onUnlock={() => setUnlockOpen(true)}
              onFiles={() => {
                setNavOpen(false);
                setFilesOpen((open) => !open);
              }}
              onClear={() => {
                setLocal({});
                setDraft("");
                setAttachments([]);
                setView("home");
                setSessionId(null);
                setSessionTitle("New Agent");
                notice("Thread cleared.");
              }}
            />
            <div className="relative flex min-h-0 flex-1">
              <div className="flex min-w-0 flex-1 flex-col">
                {view === "home" && (
                  <HomeView
                    onTemplates={() => openView("templates")}
                    onChip={(chip) => send(chip)}
                    onResume={(item) => openSession(item.sessionId, item.sessionTitle)}
                  />
                )}
                {view === "chat" && <ChatView sessionId={sessionId} extras={local[sessionId] || []} />}
                {view === "settings" && (
                  <SettingsView
                    key={settingsTab}
                    theme={theme}
                    onTheme={setThemeId}
                    wallpaperOn={wallpaperOn}
                    onWallpaper={setWallpaperOn}
                    initialTab={settingsTab}
                  />
                )}
                {view === "automations" && (
                  <UnderConstruction>
                    <AutomationsView />
                  </UnderConstruction>
                )}
                {view === "reasoning" && (
                  <UnderConstruction>
                    <ReasoningView />
                  </UnderConstruction>
                )}
                {view === "crawler" && (
                  <UnderConstruction>
                    <CrawlerView />
                  </UnderConstruction>
                )}
                {view === "ops" && (
                  <UnderConstruction>
                    <OpsView />
                  </UnderConstruction>
                )}
                {view === "notes" && <NotesView />}
                {view === "plugins" && (
                  <UnderConstruction>
                    <PluginsView />
                  </UnderConstruction>
                )}
                {view === "account" && <AccountView />}
                {view === "updates" && <UpdatesView />}
                {view === "telemetry" && <TelemetryView />}
                {view === "help" && <HelpView onOpen={openView} />}
                {view === "templates" && (
                  <UnderConstruction>
                    <TemplatesView
                      onCreate={(item) => {
                        addProject({ id: item.id, label: item.title, title: item.title });
                        setSessionTitle("New Agent");
                        setSessionId(null);
                        setView("home");
                        setDraft("Scaffold a " + item.title + " using " + item.stack + ".");
                        notice(item.title + " added to Projects.");
                      }}
                    />
                  </UnderConstruction>
                )}
                {view === "editor" && (
                  <UnderConstruction>
                    <EditorView
                      file={sessionTitle}
                      onBack={() => {
                        setView("home");
                        setSessionTitle("New Agent");
                      }}
                    />
                  </UnderConstruction>
                )}
                {showComposer && (
                  <Composer
                    draft={draft}
                    setDraft={setDraft}
                    onSend={() => send()}
                    autoPrompt={autoPrompt}
                    onAutoPrompt={() => setAutoPrompt((value) => !value)}
                    attachments={attachments}
                    onAttach={(files) => setAttachments((prev) => [...prev, ...files])}
                    onRemoveAttach={(name) => setAttachments((prev) => prev.filter((file) => file.name !== name))}
                    onFiles={() => setFilesOpen((open) => !open)}
                    onOpenSettings={() => {
                      setSettingsTab("models");
                      openView("settings");
                    }}
                  />
                )}
              </div>
              {filesOpen && (
                <FilesInspector
                  onClose={() => setFilesOpen(false)}
                  onOpenFile={(name) => {
                    setFilesOpen(false);
                    setSessionTitle(name);
                    setView("editor");
                  }}
                />
              )}
            </div>
          </main>
        </div>
      </div>
      {paletteOpen && (
        <CommandPalette
          onClose={() => setPaletteOpen(false)}
          onPick={(id) => {
            setPaletteOpen(false);
            openView(id);
            if (id === "home") {
              setSessionId(null);
              setSessionTitle("New Agent");
            }
          }}
        />
      )}
      {connectOpen && <GettingStarted onClose={() => setConnectOpen(false)} />}
      <Toast />
      <WalletSync />
      {unlockOpen && <SignupOverlay onClose={() => setUnlockOpen(false)} />}
    </div>
  );
}
