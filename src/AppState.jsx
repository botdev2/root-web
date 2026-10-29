import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { dayPartFromDate } from "./dayClock.js";
import { BRAIN_NODES, DEFAULT_PREFS, defaultPluginState } from "./features.js";

const SAMPLE_PROJECTS = new Set(["my-mobile-app", "landing", "wiki"]);
const SAMPLE_AUTOMATIONS = new Set(["nightly", "readme", "lint"]);
const SAMPLE_RUNS = new Set(["r1", "r2", "r3"]);
const SAMPLE_FLOWS = new Set(["sample-signup"]);
const SAMPLE_SITES = new Set(["landing", "docs", "wiki"]);
const SAMPLE_VIDEOS = new Set(["intro"]);
const SAMPLE_CHARTS = new Set(["onboarding", "farm-push", "ops-deploy"]);
const SAMPLE_GOALS = new Set(["Ship Farm widget", "Theme the landing", "Write X post"]);

function withoutIds(list, ids) {
  if (!Array.isArray(list)) return [];
  return list.filter((item) => item && !ids.has(item.id));
}

function withoutSampleFiles(map) {
  if (!map || typeof map !== "object" || Array.isArray(map)) return {};
  const next = { ...map };
  for (const id of SAMPLE_PROJECTS) delete next[id];
  return next;
}

function readGoals() {
  const rows = readStored("root-web-day-goals", []);
  if (!Array.isArray(rows)) return [];
  return rows.filter((item) => item && !SAMPLE_GOALS.has(item.text));
}

const AppState = createContext(null);

const FONTS = {
  palm: '"PALM", "Segoe UI Variable", "Segoe UI", sans-serif',
  inter: '"Segoe UI Variable", "Segoe UI", system-ui, sans-serif',
  system: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
};

function readStored(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeStored(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota */
  }
}

export function AppStateProvider({ children }) {
  const [projects, setProjects] = useState(() => withoutIds(readStored("root-web-projects", []), SAMPLE_PROJECTS));
  const [projectId, setProjectId] = useState(() => {
    const stored = readStored("root-web-project", "");
    return SAMPLE_PROJECTS.has(stored) ? "" : stored || "";
  });
  const [toast, setToast] = useState("");
  const [model, setModelState] = useState("glm-5.2:cloud");
  const setModel = (id) => {
    if (id === "glm-5.2:cloud") setModelState("glm-5.2:cloud");
  };
  const [mode, setMode] = useState(() => readStored("root-web-mode", "agent"));
  const [fontId, setFontId] = useState(() => readStored("root-web-font", "palm"));
  const [onboarding, setOnboarding] = useState(() =>
    readStored("root-web-onboarding", { visible: true, skills: true, repos: false, github: false }),
  );
  const [automations, setAutomations] = useState(() => withoutIds(readStored("root-web-automations", []), SAMPLE_AUTOMATIONS));
  const [runs, setRuns] = useState(() => withoutIds(readStored("root-web-runs", []), SAMPLE_RUNS));
  const [session, setSession] = useState(() => {
    const stored = readStored("root-web-session", null);
    return stored?.address ? stored : null;
  });
  const [dayTasksEnabled, setDayTasksEnabled] = useState(() => readStored("root-web-day-tasks", false));
  const [dayGoals, setDayGoals] = useState(readGoals);
  const [pluginState, setPluginState] = useState(() => ({ ...defaultPluginState(), ...readStored("root-web-plugins", {}) }));
  const [brainEnabled, setBrainEnabled] = useState(() => {
    const stored = readStored("root-web-brain", null);
    const base = Object.fromEntries(BRAIN_NODES.map((node) => [node.id, node.enabled]));
    return stored ? { ...base, ...stored } : base;
  });
  const [flows, setFlows] = useState(() => withoutIds(readStored("root-web-flows", []), SAMPLE_FLOWS));
  const [sites, setSites] = useState(() => withoutIds(readStored("root-web-ops-sites", []), SAMPLE_SITES));
  const [deploys, setDeploys] = useState(() => readStored("root-web-ops-deploys", []));
  const [files, setFiles] = useState(() => withoutSampleFiles(readStored("root-web-files", {})));
  const [fileInfo, setFileInfo] = useState({});
  const [commits, setCommits] = useState(() => withoutSampleFiles(readStored("root-web-commits", {})));
  const [charts, setCharts] = useState(() => withoutIds(readStored("root-web-charts", []), SAMPLE_CHARTS));
  const [videos, setVideos] = useState(() => withoutIds(readStored("root-web-videos", []), SAMPLE_VIDEOS));
  const [prefs, setPrefs] = useState(() => ({ ...DEFAULT_PREFS, ...readStored("root-web-prefs", {}) }));

  const project = projects.find((item) => item.id === projectId) || projects[0] || { id: "", label: "", sessions: [] };
  const doneCount = Number(onboarding.skills) + Number(onboarding.repos) + Number(onboarding.github);

  useEffect(() => {
    writeStored("root-web-model", model);
  }, [model]);

  useEffect(() => {
    writeStored("root-web-mode", mode);
  }, [mode]);

  useEffect(() => {
    writeStored("root-web-font", fontId);
    const stack = FONTS[fontId] || FONTS.palm;
    document.documentElement.style.setProperty("--ui-font", stack);
    document.body.style.fontFamily = stack;
  }, [fontId]);

  useEffect(() => {
    writeStored("root-web-onboarding", onboarding);
  }, [onboarding]);

  useEffect(() => {
    writeStored("root-web-session", session);
  }, [session]);

  useEffect(() => {
    writeStored("root-web-day-tasks", dayTasksEnabled);
  }, [dayTasksEnabled]);

  useEffect(() => {
    writeStored("root-web-day-goals", dayGoals);
  }, [dayGoals]);

  useEffect(() => {
    writeStored("root-web-automations", automations);
  }, [automations]);

  useEffect(() => {
    writeStored("root-web-runs", runs);
  }, [runs]);

  useEffect(() => {
    writeStored("root-web-projects", projects);
  }, [projects]);

  useEffect(() => {
    writeStored("root-web-project", projectId);
  }, [projectId]);

  useEffect(() => {
    writeStored("root-web-plugins", pluginState);
  }, [pluginState]);

  useEffect(() => {
    writeStored("root-web-brain", brainEnabled);
  }, [brainEnabled]);

  useEffect(() => {
    writeStored("root-web-flows", flows);
  }, [flows]);

  useEffect(() => {
    writeStored("root-web-ops-sites", sites);
  }, [sites]);

  useEffect(() => {
    writeStored("root-web-ops-deploys", deploys);
  }, [deploys]);

  useEffect(() => {
    writeStored("root-web-files", files);
  }, [files]);

  useEffect(() => {
    writeStored("root-web-commits", commits);
  }, [commits]);

  useEffect(() => {
    writeStored("root-web-charts", charts);
  }, [charts]);

  useEffect(() => {
    writeStored("root-web-videos", videos);
  }, [videos]);

  useEffect(() => {
    writeStored("root-web-prefs", prefs);
  }, [prefs]);

  const api = useMemo(
    () => ({
      projects,
      project,
      projectId,
      toast,
      model,
      mode,
      fontId,
      onboarding,
      doneCount,
      automations,
      runs,
      pluginState,
      brainEnabled,
      flows,
      sites,
      deploys,
      files,
      fileInfo,
      commits,
      charts,
      videos,
      prefs,
      session,
      signedIn: Boolean(session),
      dayTasksEnabled,
      setDayTasksEnabled,
      dayGoals,
      setModel,
      setMode,
      setFontId,
      setProjectId,
      signIn: (profile) => {
        setSession({
          name: profile?.name || "you",
          source: profile?.source || "wallet",
          address: profile?.address || "",
          at: Date.now(),
        });
      },
      signOut: () => setSession(null),
      toggleDayGoal: (id) => {
        setDayGoals((prev) => prev.map((row) => (row.id === id ? { ...row, done: !row.done } : row)));
      },
      addDayGoal: (text, part) => {
        const label = String(text || "").trim();
        if (!label) return;
        setDayGoals((prev) => [...prev, { id: String(Date.now()), done: false, text: label, part: part || dayPartFromDate() }]);
      },
      notice: (text) => {
        setToast(text);
        window.clearTimeout(window.__rootToast);
        window.__rootToast = window.setTimeout(() => setToast(""), 3200);
      },
      dismissOnboarding: () => setOnboarding((prev) => ({ ...prev, visible: false })),
      completeOnboarding: (key) =>
        setOnboarding((prev) => ({ ...prev, [key]: true, visible: key === "github" ? false : prev.visible })),
      setPrefs: (patch) => setPrefs((prev) => ({ ...prev, ...patch })),
      togglePref: (key) => setPrefs((prev) => ({ ...prev, [key]: !prev[key] })),
      setBrainNode: (id, enabled) => setBrainEnabled((prev) => ({ ...prev, [id]: enabled })),
      resetBrain: () => setBrainEnabled(Object.fromEntries(BRAIN_NODES.map((node) => [node.id, node.enabled]))),
      setPlugin: (id, patch) => setPluginState((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } })),
      upsertFlow: (flow) =>
        setFlows((prev) => {
          const index = prev.findIndex((row) => row.id === flow.id);
          if (index < 0) return [flow, ...prev];
          const next = prev.slice();
          next[index] = flow;
          return next;
        }),
      deleteFlow: (id) => setFlows((prev) => prev.filter((row) => row.id !== id)),
      addSite: (name) => {
        const label = String(name || "").trim();
        if (!label) return;
        setSites((prev) => [{ id: "site-" + Date.now(), name: label, status: "Probe" }, ...prev]);
      },
      removeSite: (id) => setSites((prev) => prev.filter((row) => row.id !== id)),
      queueDeploy: (item) => {
        const record = {
          id: "dep-" + Date.now(),
          name: item.name,
          repo: item.repo,
          branch: item.branch,
          when: "just now",
          status: "awaiting signature",
          log: "wallet ready\nbuild dist\nupload waits on ops.palmaierc.com",
        };
        setDeploys((prev) => [record, ...prev]);
        return record;
      },
      markSiteLive: (name) => {
        setSites((prev) => prev.map((row) => (row.name === name ? { ...row, status: "Live" } : row)));
        setDeploys((prev) => prev.map((row, index) => (index === 0 && row.name === name ? { ...row, status: "live", log: row.log + "\nlive" } : row)));
      },
      writeFile: (projectKey, path, text) => {
        setFiles((prev) => ({ ...prev, [projectKey]: { ...(prev[projectKey] || {}), [path]: text } }));
      },
      deleteFile: (projectKey, path) => {
        setFiles((prev) => {
          const tree = { ...(prev[projectKey] || {}) };
          delete tree[path];
          return { ...prev, [projectKey]: tree };
        });
      },
      seedFiles: (projectKey, tree) => {
        setFiles((prev) => ({ ...prev, [projectKey]: { ...(prev[projectKey] || {}), ...tree } }));
      },
      replaceFiles: (projectKey, tree) => {
        setFiles((prev) => ({ ...prev, [projectKey]: tree && typeof tree === "object" ? tree : {} }));
      },
      replaceFileInfo: (projectKey, info) => {
        setFileInfo((prev) => ({ ...prev, [projectKey]: info && typeof info === "object" ? info : {} }));
      },
      noteFile: (projectKey, path, info) => {
        if (!projectKey || !path) return;
        setFileInfo((prev) => ({
          ...prev,
          [projectKey]: { ...(prev[projectKey] || {}), [path]: info },
        }));
      },
      replaceCommits: (projectKey, rows) => {
        setCommits((prev) => ({ ...prev, [projectKey]: Array.isArray(rows) ? rows : [] }));
      },
      recordCommit: (projectKey, msg) => {
        const hash = Math.random().toString(16).slice(2, 8);
        setCommits((prev) => ({ ...prev, [projectKey]: [{ hash, msg, when: new Date().toISOString() }, ...(prev[projectKey] || [])] }));
      },
      upsertChart: (chart) =>
        setCharts((prev) => {
          const index = prev.findIndex((row) => row.id === chart.id);
          if (index < 0) return [chart, ...prev];
          const next = prev.slice();
          next[index] = chart;
          return next;
        }),
      deleteChart: (id) => setCharts((prev) => prev.filter((row) => row.id !== id)),
      upsertVideo: (video) =>
        setVideos((prev) => {
          const index = prev.findIndex((row) => row.id === video.id);
          if (index < 0) return [video, ...prev];
          const next = prev.slice();
          next[index] = video;
          return next;
        }),
      deleteVideo: (id) => setVideos((prev) => prev.filter((row) => row.id !== id)),
      addProject: (item) => {
        const id = item.id || String(item.label || item.title || "project").toLowerCase().replace(/\s+/g, "-");
        setProjects((prev) => {
          if (prev.some((row) => row.id === id)) return prev;
          return [
            {
              id,
              label: item.label || item.title,
              remote: "github.com/you/" + id,
              sessions: [{ id: "draft-" + id, title: "New Agent", when: "now" }],
            },
            ...prev,
          ];
        });
        setProjectId(id);
        setOnboarding((prev) => ({ ...prev, repos: true }));
      },
      addSession: (session) => {
        setProjects((prev) =>
          prev.map((row) =>
            row.id === projectId ? { ...row, sessions: [{ ...session, when: "now" }, ...row.sessions] } : row,
          ),
        );
      },
      upsertAutomation: (item) => {
        setAutomations((prev) => {
          const index = prev.findIndex((row) => row.id === item.id);
          if (index < 0) return [item, ...prev];
          const next = prev.slice();
          next[index] = item;
          return next;
        });
      },
      toggleAutomation: (id) => {
        setAutomations((prev) => prev.map((row) => (row.id === id ? { ...row, active: !row.active } : row)));
      },
      deleteAutomation: (id) => {
        setAutomations((prev) => prev.filter((row) => row.id !== id));
      },
      finishAutomationRun: (item, outcome) => {
        const record = {
          id: "run-" + Date.now(),
          automationId: item.id,
          title: item.title,
          when: "just now",
          status: outcome?.ok ? "ok" : "fail",
          detail: outcome?.detail || "The run did not finish.",
          log: outcome?.log || "",
        };
        setRuns((prev) => [record, ...prev]);
        setAutomations((prev) =>
          prev.map((row) =>
            row.id === item.id
              ? {
                  ...row,
                  lastRun: "just now",
                  lastRunAt: new Date().toISOString(),
                  conversationId: outcome?.conversationId || row.conversationId || "",
                }
              : row,
          ),
        );
        return record;
      },
    }),
    [projects, project, projectId, toast, model, mode, fontId, onboarding, doneCount, automations, runs, session, dayTasksEnabled, dayGoals, pluginState, brainEnabled, flows, sites, deploys, files, fileInfo, commits, charts, videos, prefs],
  );

  return <AppState.Provider value={api}>{children}</AppState.Provider>;
}

export function useAppState() {
  return useContext(AppState);
}
