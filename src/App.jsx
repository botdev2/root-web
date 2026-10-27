import { useEffect, useMemo, useState } from "react";
import { useAppKit } from "@reown/appkit/react";
import { useAccount } from "wagmi";
import { listConversations, loadConversation, removeConversation, sendTurn } from "./glmChat.js";
import { createHubProject, hubCloneUrl, opsFetch, readOpsSession, writeOpsSession } from "./opsApi.js";
import { desktopSeedFiles, projectFolderName } from "./projectSeed.js";
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
import DayTasksToggle from "./components/DayTasksToggle.jsx";

const CHAT_VIEWS = new Set(["home", "chat"]);

export default function App() {
  const state = useAppState();
  const { seedFiles, setProjectId, mode, notice, project, projects: localProjects = [], dayTasksEnabled, setDayTasksEnabled, brainEnabled, files } = state || {};
  const [themeId, setThemeId] = useState(readSavedThemeId);
  const [wallpaperId, setWallpaperId] = useState(readSavedWallpaper);
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
  const [sending, setSending] = useState(false);
  const [cloudSessions, setCloudSessions] = useState([]);
  const [convoMax, setConvoMax] = useState(10);
  const [opsToken, setOpsToken] = useState(() => readOpsSession());
  const [opsProjects, setOpsProjects] = useState(null);
  const [opsProjectId, setOpsProjectId] = useState("");
  const [usagePercent, setUsagePercent] = useState(0);
  const { address, isConnected } = useAccount();
  const { open } = useAppKit();
  const [dayTasksIdle, setDayTasksIdle] = useState(false);
  const [editorFile, setEditorFile] = useState("README.md");
  const theme = useMemo(() => findTheme(themeId), [themeId]);

  useEffect(() => {
    applyTheme(theme, wallpaperId);
  }, [theme, wallpaperId]);

  useEffect(() => {
    if (dayTasksEnabled || view !== "home" || sessionId) {
      setDayTasksIdle(false);
      return;
    }
    let last = Date.now();
    const note = () => {
      last = Date.now();
      setDayTasksIdle(false);
    };
    const tick = window.setInterval(() => {
      if (Date.now() - last >= 10000) setDayTasksIdle(true);
    }, 1000);
    window.addEventListener("pointermove", note);
    window.addEventListener("keydown", note);
    window.addEventListener("pointerdown", note);
    return () => {
      window.clearInterval(tick);
      window.removeEventListener("pointermove", note);
      window.removeEventListener("keydown", note);
      window.removeEventListener("pointerdown", note);
    };
  }, [dayTasksEnabled, view, sessionId]);

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

  useEffect(() => {
    if (!isConnected || !address) {
      setCloudSessions([]);
      setLocal({});
      setSessionId(null);
      setSessionTitle("New Agent");
      setUsagePercent(0);
      return;
    }
    let cancelled = false;
    listConversations(address)
      .then((data) => {
        if (cancelled) return;
        setCloudSessions(data.conversations || []);
        setConvoMax(data.maxConversations || 10);
        if (data.dropped?.length) notice?.("Older cloud chats were removed. A wallet keeps " + (data.maxConversations || 10) + ".");
      })
      .catch((error) => {
        if (!cancelled) notice?.(error.message || "Conversations did not load.");
      });
    return () => {
      cancelled = true;
    };
  }, [isConnected, address]);

  useEffect(() => {
    const current = readOpsSession();
    setOpsToken((prev) => (prev === current ? prev : current));
  }, [view]);

  useEffect(() => {
    if (!opsToken) {
      setOpsProjects(null);
      return;
    }
    let cancelled = false;
    opsFetch("/api/hub/repos", { token: opsToken })
      .then((data) => {
        if (cancelled) return;
        const yours = (data.repos || []).filter((item) => item.space === "yours");
        setOpsProjects(
          yours.map((repo) => ({
            id: `${repo.owner}/${repo.name}`,
            label: repo.name,
            remote: hubCloneUrl(repo.owner, repo.name),
            owner: repo.owner,
            sessions: [],
          })),
        );
      })
      .catch((error) => {
        if (cancelled) return;
        if (error.status === 401) {
          writeOpsSession("");
          setOpsToken("");
          return;
        }
        notice?.(error.message || "Ops projects did not load.");
      });
    return () => {
      cancelled = true;
    };
  }, [opsToken]);

  const listedProjects = opsProjects
    ? [
        ...opsProjects,
        ...localProjects.filter(
          (item) =>
            cloudSessions.some((session) => session.projectId === item.id) &&
            !opsProjects.some((row) => row.id === item.id || row.label === item.label),
        ),
      ]
    : localProjects;
  const listedProjectId = opsProjects ? opsProjectId || opsProjects[0]?.id || listedProjects[0]?.id || "" : project?.id;
  const activeProject = listedProjects.find((item) => item.id === listedProjectId) || project;

  const createOpsProject = async ({ name, about, files: tree }) => {
    const token = opsToken || readOpsSession();
    if (!token) throw new Error("Sign in to Ops first.");
    const created = await createHubProject({ token, name, about, files: tree });
    const repoName = created.name || name;
    const row = {
      id: `${created.owner}/${repoName}`,
      label: repoName,
      remote: hubCloneUrl(created.owner, repoName),
      owner: created.owner,
      sessions: [],
    };
    setOpsProjects((prev) => [row, ...(prev || []).filter((item) => item.id !== row.id)]);
    setOpsProjectId(row.id);
    seedFiles?.(row.id, tree);
    setSessionId(null);
    setSessionTitle("New Agent");
    setView("home");
    setNavOpen(false);
    notice(repoName + " is on the Ops Hub.");
  };

  const openSession = async (id, title, nextView = "chat") => {
    setSessionId(id);
    setSessionTitle(title);
    setView(nextView);
    setNavOpen(false);
    if (!address || !/^[a-f0-9]{24}$/.test(id || "")) return;
    try {
      const data = await loadConversation(address, id);
      const turns = (data.conversation?.turns || []).map((turn) => ({
        role: turn.role,
        text: turn.text,
        think: turn.think || "",
      }));
      setLocal((prev) => ({ ...prev, [id]: turns }));
      const chars = turns.reduce((sum, turn) => sum + String(turn.text || "").length + String(turn.think || "").length, 0);
      setUsagePercent(Math.min(100, Math.round((Math.ceil(chars / 4) / 8192) * 100)));
    } catch (error) {
      notice(error.message || "That conversation did not load.");
    }
  };

  const fileSnapshot = () => {
    const tree = files?.[activeProject?.id];
    if (!tree || typeof tree !== "object") return "";
    return Object.entries(tree)
      .map(([path, text]) => "### " + path + "\n" + String(text || "").slice(0, 1500))
      .join("\n\n")
      .slice(0, 6000);
  };

  const send = async (text = draft) => {
    const value = text.trim();
    if (!value && attachments.length === 0) return;
    if (!isConnected || !address) {
      notice("Connect a wallet to use GLM 5.2 cloud.");
      open({ view: "Connect" });
      return;
    }
    if (sending) return;
    const known = /^[a-f0-9]{24}$/.test(sessionId || "");
    const id = known ? sessionId : "pending-" + Date.now();
    const title = sessionTitle === "New Agent" && value ? value.slice(0, 42) : sessionTitle;
    const replyId = "glm-" + Date.now();
    setSending(true);
    setLocal((prev) => ({
      ...prev,
      [id]: [
        ...(prev[id] || []),
        { role: "user", text: value || "Attached files", files: attachments.map((file) => file.name) },
        { id: replyId, role: "assistant", text: "GLM 5.2 cloud is writing…", pending: true },
      ],
    }));
    setSessionId(id);
    setSessionTitle(title);
    setDraft("");
    setAttachments([]);
    setView("chat");
    try {
      const result = await sendTurn(address, {
        conversationId: known ? sessionId : "",
        projectId: activeProject?.id || "project",
        projectLabel: activeProject?.label || "",
        projectRemote: activeProject?.remote || "",
        title,
        mode,
        text: value || "Attached files",
        brain: brainEnabled || {},
        files: fileSnapshot(),
        autoprompt: autoPrompt,
      });
      const cloudId = result.conversation?.id || id;
      const turns = (result.conversation?.turns || []).map((turn) => ({
        role: turn.role,
        text: turn.text,
        think: turn.think || "",
      }));
      setSessionId(cloudId);
      setLocal((prev) => {
        const next = { ...prev };
        for (const dropId of result.dropped || []) delete next[dropId];
        if (id !== cloudId) delete next[id];
        next[cloudId] = turns.length ? turns : (prev[id] || []).map((item) => (item.id === replyId ? { role: "assistant", text: result.text, think: result.think } : item));
        return next;
      });
      setUsagePercent(result.usage?.percent || 0);
      setCloudSessions((prev) => {
        const dropped = new Set(result.dropped || []);
        const row = {
          id: cloudId,
          projectId: result.conversation?.projectId || activeProject?.id || "project",
          title: result.conversation?.title || title,
          updatedAt: result.conversation?.updatedAt || new Date().toISOString(),
        };
        const max = result.maxConversations || convoMax;
        return [row, ...prev.filter((item) => item.id !== cloudId && !dropped.has(item.id))].slice(0, max);
      });
      if (result.maxConversations) setConvoMax(result.maxConversations);
      if (result.dropped?.length) notice("The oldest cloud chat was removed. A wallet keeps " + (result.maxConversations || 10) + ".");
    } catch (error) {
      setLocal((prev) => ({
        ...prev,
        [id]: (prev[id] || []).map((item) => (item.id === replyId ? { role: "assistant", text: error.message || "GLM 5.2 cloud did not answer." } : item)),
      }));
    } finally {
      setSending(false);
    }
  };

  const showComposer = CHAT_VIEWS.has(view);
  if (!state) return null;

  return (
    <div className="relative isolate h-full min-h-0 overflow-hidden">
      {wallpaperId !== "none" && <div className="wallpaper-layer" />}
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
              cloudSessions={cloudSessions}
              convoMax={convoMax}
              walletReady={isConnected && !!address}
              listedProjects={listedProjects}
              listedProjectId={listedProjectId}
              onPickProject={(id) => {
                setOpsProjectId(id);
                setProjectId?.(id);
              }}
              opsToken={opsToken}
              onOpsToken={setOpsToken}
              onCreateProject={createOpsProject}
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
                const id = sessionId;
                if (address && /^[a-f0-9]{24}$/.test(id || "")) {
                  removeConversation(address, id).catch(() => {});
                  setCloudSessions((prev) => prev.filter((item) => item.id !== id));
                }
                setLocal((prev) => {
                  const next = { ...prev };
                  if (id) delete next[id];
                  return next;
                });
                setDraft("");
                setAttachments([]);
                setUsagePercent(0);
                setView("home");
                setSessionId(null);
                setSessionTitle("New Agent");
                notice("Thread cleared.");
              }}
            />
            <div className="relative flex min-h-0 flex-1">
              <div className="relative flex min-w-0 flex-1 flex-col">
                {view === "home" && (
                  <HomeView
                    clockOn={dayTasksEnabled || dayTasksIdle}
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
                    wallpaperId={wallpaperId}
                    onWallpaper={setWallpaperId}
                    initialTab={settingsTab}
                    onPrompt={(text) => {
                      setSessionId(null);
                      setSessionTitle("New Agent");
                      setDraft(text);
                      setView("home");
                    }}
                  />
                )}
                {view === "automations" && <AutomationsView />}
                {view === "reasoning" && <ReasoningView />}
                {view === "crawler" && <CrawlerView />}
                {view === "ops" && <OpsView />}
                {view === "notes" && <NotesView />}
                {view === "plugins" && <PluginsView />}
                {view === "account" && <AccountView />}
                {view === "updates" && <UpdatesView />}
                {view === "telemetry" && <TelemetryView />}
                {view === "help" && <HelpView onOpen={openView} />}
                {view === "templates" && (
                  <TemplatesView
                    onCreate={async (item) => {
                      const checked = projectFolderName(item.folder);
                      if (checked.error) {
                        notice(checked.error);
                        return;
                      }
                      if (!opsToken && !readOpsSession()) {
                        notice("Sign in to Ops from Projects +. The folder is created on the Hub.");
                        return;
                      }
                      try {
                        await createOpsProject({
                          name: checked.name,
                          about: item.subtitle,
                          files: { ...desktopSeedFiles(checked.name), ...item.files },
                        });
                        setEditorFile("README.md");
                        setDraft(item.goal + " Stack: " + item.stack + ". Dev: " + item.dev);
                      } catch (error) {
                        notice(error.message);
                      }
                    }}
                  />
                )}
                {view === "editor" && (
                  <EditorView
                    file={editorFile}
                    onFile={setEditorFile}
                    onBack={() => {
                      setView("home");
                      setSessionTitle("New Agent");
                    }}
                  />
                )}
                {showComposer && (
                  <div className="relative">
                    <div className="flex items-center md:pointer-events-none md:absolute md:inset-y-0 md:left-0 md:z-20 md:items-end md:pb-[18px] md:pl-3.5">
                      <div className="pointer-events-auto">
                        <DayTasksToggle
                          enabled={dayTasksEnabled || (view === "home" && !sessionId && dayTasksIdle)}
                          onChange={(value) => {
                            setDayTasksIdle(false);
                            setDayTasksEnabled(value);
                          }}
                        />
                      </div>
                    </div>
                    <Composer
                    draft={draft}
                    setDraft={setDraft}
                    sending={sending}
                    usagePercent={usagePercent}
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
                  </div>
                )}
              </div>
              {filesOpen && (
                <FilesInspector
                  onClose={() => setFilesOpen(false)}
                  onOpenFile={(name) => {
                    setFilesOpen(false);
                    setEditorFile(name);
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
