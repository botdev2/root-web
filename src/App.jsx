import { useEffect, useMemo, useRef, useState } from "react";
import { useAppKit } from "@reown/appkit/react";
import { useAccount, useSignMessage } from "wagmi";
import { listConversations, loadConversation, removeConversation, sendTurn } from "./glmChat.js";
import { MAX_REPOS, claimOpsSession, createHubProject, hubCloneUrl, hubRepoUrl, opsFetch, readOpsSession, reposForWallet, signOpsSession, walletKey, writeOpsSession } from "./opsApi.js";
import { automationDue, runAgentTurn } from "./agentRun.js";
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
import AvatarOverlay from "./components/AvatarOverlay.jsx";
import FilesInspector from "./components/FilesInspector.jsx";
import CommandPalette from "./components/CommandPalette.jsx";
import GettingStarted from "./components/GettingStarted.jsx";
import Toast from "./components/Toast.jsx";
import AutomationsView from "./components/views/AutomationsView.jsx";
import ReasoningView from "./components/views/ReasoningView.jsx";
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
  const { seedFiles, replaceFiles, recordCommit, finishAutomationRun, setProjectId, mode, notice, dayTasksEnabled, setDayTasksEnabled, brainEnabled, files, automations } = state || {};
  const [themeId, setThemeId] = useState(readSavedThemeId);
  const [wallpaperId, setWallpaperId] = useState(readSavedWallpaper);
  const [view, setView] = useState(() => {
    try {
      const id = new URLSearchParams(window.location.search).get("view") || "home";
      return id === "crawler" ? "home" : id;
    } catch {
      return "home";
    }
  });
  const [sessionId, setSessionId] = useState(null);
  const [sessionTitle, setSessionTitle] = useState("New Agent");
  const [draft, setDraft] = useState("");
  const [local, setLocal] = useState({});
  const [filesOpen, setFilesOpen] = useState(false);
  const [avatarOn, setAvatarOn] = useState(() => {
    try {
      return localStorage.getItem("root-web-avatar-on") !== "0";
    } catch {
      return true;
    }
  });
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
  const [opsToken, setOpsToken] = useState("");
  const [opsProjects, setOpsProjects] = useState(null);
  const [opsProjectId, setOpsProjectId] = useState("");
  const [usagePercent, setUsagePercent] = useState(0);
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { open } = useAppKit();
  const opsSignAttempt = useRef("");
  const signOpsRef = useRef(signMessageAsync);
  signOpsRef.current = signMessageAsync;
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
        setCloudSessions((data.conversations || []).filter((item) => item.projectId !== "__avatar__"));
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
    if (!isConnected || !address) {
      setOpsToken("");
      setOpsProjects(null);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      try {
        const held = await claimOpsSession(address);
        if (cancelled) return;
        if (held) {
          setOpsToken(held);
          return;
        }
      } catch (error) {
        if (!cancelled) notice?.(error.message || "Ops did not confirm this wallet.");
        return;
      }
      if (cancelled || opsSignAttempt.current === address.toLowerCase()) return;
      opsSignAttempt.current = address.toLowerCase();
      try {
        const session = await signOpsSession(address, (args) => signOpsRef.current(args));
        if (!cancelled && session?.token) setOpsToken(session.token);
      } catch (error) {
        if (!cancelled) notice?.(error.message || "Wallet sign-in was declined.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isConnected, address]);

  useEffect(() => {
    if (!opsToken || !address) {
      setOpsProjects(null);
      return undefined;
    }
    let cancelled = false;
    opsFetch("/api/hub/repos", { token: opsToken })
      .then((data) => {
        if (cancelled) return;
        const yours = reposForWallet(data.repos, address).filter((item) => item.space === "yours");
        setOpsProjects(
          yours.map((repo) => ({
            id: `${repo.owner}/${repo.name}`,
            label: repo.name,
            remote: hubCloneUrl(repo.owner, repo.name),
            href: hubRepoUrl(repo.owner, repo.name),
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
  }, [opsToken, address]);

  const listedProjects = opsProjects || [];
  const listedProjectId = opsProjectId || opsProjects?.[0]?.id || "";
  const activeProject = listedProjects.find((item) => item.id === listedProjectId) || null;

  useEffect(() => {
    const owner = activeProject?.owner;
    const name = activeProject?.label;
    const id = activeProject?.id;
    if (!opsToken || !owner || !name || !id || owner !== walletKey(address)) return undefined;
    let cancelled = false;
    opsFetch(`/api/hub/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`, { token: opsToken })
      .then((detail) => {
        if (cancelled) return;
        const tree = {};
        for (const file of detail.files || []) {
          if (!file?.path) continue;
          tree[file.path] = typeof file.content === "string" ? file.content : "";
        }
        replaceFiles?.(id, tree);
      })
      .catch((error) => {
        if (!cancelled && error.status !== 401) notice?.(error.message || "Repository files did not load.");
      });
    return () => {
      cancelled = true;
    };
  }, [opsToken, address, activeProject?.id, activeProject?.owner, activeProject?.label]);

  const createOpsProject = async ({ name, about, files: tree }) => {
    const token = readOpsSession(address);
    if (!token || token !== opsToken) throw new Error("Sign in with the connected wallet.");
    if ((opsProjects || []).length >= MAX_REPOS) throw new Error("A wallet can keep 3 repositories.");
    const created = await createHubProject({ token, name, about, files: tree });
    if (created.owner !== walletKey(address)) throw new Error("Ops created that repository for a different wallet.");
    const repoName = created.name || name;
    const row = {
      id: `${created.owner}/${repoName}`,
      label: repoName,
      remote: hubCloneUrl(created.owner, repoName),
      href: hubRepoUrl(created.owner, repoName),
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
    return row;
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
      const outcome = await runAgentTurn({
        address,
        conversationId: known ? sessionId : "",
        project: activeProject,
        token: readOpsSession(address),
        mode,
        allowTools: mode === "agent",
        text: value || "Attached files",
        brain: brainEnabled || {},
        files: fileSnapshot(),
        fileTree: files?.[activeProject?.id] || {},
        autoprompt: autoPrompt,
        title,
        onStatus: (status) => {
          setLocal((prev) => ({
            ...prev,
            [id]: (prev[id] || []).map((item) => (item.id === replyId ? { ...item, text: status } : item)),
          }));
        },
        onProject: (projectRow, tree) => {
          setOpsProjects((prev) => [projectRow, ...(prev || []).filter((item) => item.id !== projectRow.id)]);
          setOpsProjectId(projectRow.id);
          seedFiles?.(projectRow.id, tree);
        },
        onWrote: (projectRow, payload, message) => {
          seedFiles?.(projectRow.id, payload);
          recordCommit?.(projectRow.id, String(message || "Update from /root").slice(0, 72));
        },
      });
      const result = outcome.result;
      if (!result) throw new Error("GLM 5.2 cloud did not answer.");
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

  const runLock = useRef(new Set());
  const scheduleRef = useRef(() => {});

  const rememberRepo = (projectRow, tree) => {
    if (!projectRow?.owner || projectRow.owner !== walletKey(address)) return;
    setOpsProjects((prev) => [projectRow, ...(prev || []).filter((item) => item.id !== projectRow.id)]);
    setOpsProjectId(projectRow.id);
    if (tree) seedFiles?.(projectRow.id, tree);
  };

  const runSavedAutomation = async (item, { openChat = false } = {}) => {
    if (!isConnected || !address) throw new Error("Connect a wallet to use GLM 5.2 cloud.");
    const token = readOpsSession(address);
    if (!token) throw new Error("Sign in with the connected wallet so the changes can be committed.");
    if (runLock.current.has(item.id)) return null;
    runLock.current.add(item.id);
    const repo = listedProjects.find((row) => row.id === item.project) || activeProject;
    const title = item.title || "Automation";
    try {
      const outcome = await runAgentTurn({
        address,
        conversationId: item.conversationId || "",
        project: repo,
        token,
        mode: "agent",
        allowTools: true,
        title,
        text: item.instructions || title,
        brain: brainEnabled || {},
        files: repo?.id && files?.[repo.id]
          ? Object.entries(files[repo.id]).map(([path, text]) => "### " + path + "\n" + String(text || "").slice(0, 1500)).join("\n\n").slice(0, 6000)
          : "",
        fileTree: (repo?.id && files?.[repo.id]) || {},
        autoprompt: false,
        onProject: (projectRow, tree) => rememberRepo(projectRow, tree),
        onWrote: (projectRow, payload, message) => {
          seedFiles?.(projectRow.id, payload);
          recordCommit?.(projectRow.id, String(message || title).slice(0, 72));
        },
      });
      const wrote = outcome.actions || [];
      finishAutomationRun?.(item, {
        ok: true,
        detail: wrote.length ? "Committed " + wrote.slice(0, 4).join(", ") : "Finished with no file changes",
        log: [title, repo?.id || "no repository", ...wrote].join("\n"),
        conversationId: outcome.conversationId,
      });
      const result = outcome.result;
      const cloudId = result?.conversation?.id || outcome.conversationId;
      if (cloudId) {
        const turns = (result?.conversation?.turns || []).map((turn) => ({
          role: turn.role,
          text: turn.text,
          think: turn.think || "",
        }));
        if (turns.length) setLocal((prev) => ({ ...prev, [cloudId]: turns }));
        setCloudSessions((prev) => {
          const row = {
            id: cloudId,
            projectId: result?.conversation?.projectId || repo?.id || "project",
            title: result?.conversation?.title || title,
            updatedAt: result?.conversation?.updatedAt || new Date().toISOString(),
          };
          return [row, ...prev.filter((entry) => entry.id !== cloudId)].slice(0, convoMax);
        });
        if (openChat) {
          setSessionId(cloudId);
          setSessionTitle(title);
          setView("chat");
        }
      }
      return outcome;
    } catch (error) {
      finishAutomationRun?.(item, { ok: false, detail: error.message || "The run failed.", log: error.message || "The run failed." });
      throw error;
    } finally {
      runLock.current.delete(item.id);
    }
  };

  scheduleRef.current = async () => {
    if (document.visibilityState === "hidden" || !isConnected || !address) return;
    for (const item of automations || []) {
      if (!automationDue(item) || runLock.current.has(item.id)) continue;
      try {
        await runSavedAutomation(item, { openChat: false });
      } catch {
        /* the run record stores the failure */
      }
    }
  };

  useEffect(() => {
    if (!isConnected || !address || !opsToken) return undefined;
    const timer = window.setInterval(() => scheduleRef.current(), 30000);
    return () => window.clearInterval(timer);
  }, [isConnected, address, opsToken]);

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
              avatarOn={avatarOn}
              onAvatar={() => {
                setAvatarOn((value) => {
                  const next = !value;
                  try {
                    localStorage.setItem("root-web-avatar-on", next ? "1" : "0");
                  } catch {
                    /* ignore */
                  }
                  return next;
                });
              }}
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
              project={activeProject}
              filesOpen={filesOpen}
              onMenu={() => {
                setFilesOpen(false);
                setNavOpen((open) => !open);
              }}
              onHelp={() => openView("help")}
              avatarOn={avatarOn}
              onAvatar={() => {
                setAvatarOn((value) => {
                  const next = !value;
                  try {
                    localStorage.setItem("root-web-avatar-on", next ? "1" : "0");
                  } catch {
                    /* ignore */
                  }
                  return next;
                });
              }}
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
                    project={activeProject}
                    clockOn={dayTasksEnabled || dayTasksIdle}
                    onTemplates={() => openView("templates")}
                    onChip={(chip) => send(chip)}
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
                {view === "automations" && (
                  <AutomationsView hubProjects={listedProjects} activeProjectId={activeProject?.id || ""} onRun={runSavedAutomation} />
                )}
                {view === "reasoning" && <ReasoningView />}
                {view === "ops" && <OpsView token={opsToken} onToken={setOpsToken} />}
                {view === "notes" && <NotesView />}
                {view === "plugins" && <PluginsView token={opsToken} onToken={setOpsToken} />}
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
                      if (!readOpsSession(address)) {
                        notice("Sign in with the connected wallet. The folder is created on the Hub.");
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
                    project={activeProject}
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
                  project={activeProject}
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
      <AvatarOverlay open={avatarOn} onClose={() => {
        setAvatarOn(false);
        try {
          localStorage.setItem("root-web-avatar-on", "0");
        } catch {
          /* ignore */
        }
      }} view={view} projectLabel={activeProject?.label || ""} />
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
