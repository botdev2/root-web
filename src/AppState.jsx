import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { AUTOMATIONS, SEED_RUNS } from "./mock.js";
import { dayPartFromDate } from "./dayClock.js";

const AppState = createContext(null);

const FONTS = {
  palm: '"PALM", "Segoe UI Variable", "Segoe UI", sans-serif',
  inter: '"Segoe UI Variable", "Segoe UI", system-ui, sans-serif',
  system: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
};

const SEED_PROJECTS = [
  {
    id: "my-mobile-app",
    label: "my-mobile-app",
    remote: "github.com/you/my-mobile-app",
    sessions: [{ id: "farm", title: "Fixing expo-asset", when: "now" }],
  },
  {
    id: "landing",
    label: "landing",
    remote: "github.com/you/landing",
    sessions: [{ id: "ops", title: "Publish landing", when: "2h" }],
  },
  {
    id: "wiki",
    label: "wiki",
    remote: "github.com/you/wiki",
    sessions: [{ id: "wiki", title: "Wiki port", when: "yesterday" }],
  },
];

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
  const [projects, setProjects] = useState(SEED_PROJECTS);
  const [projectId, setProjectId] = useState("my-mobile-app");
  const [toast, setToast] = useState("");
  const [model, setModel] = useState(() => readStored("root-web-model", "glm-5.2:cloud"));
  const [mode, setMode] = useState(() => readStored("root-web-mode", "agent"));
  const [fontId, setFontId] = useState(() => readStored("root-web-font", "palm"));
  const [onboarding, setOnboarding] = useState(() =>
    readStored("root-web-onboarding", { visible: true, skills: true, repos: false, github: false }),
  );
  const [automations, setAutomations] = useState(AUTOMATIONS);
  const [runs, setRuns] = useState(SEED_RUNS);
  const [session, setSession] = useState(() => {
    const stored = readStored("root-web-session", null);
    return stored?.address ? stored : null;
  });
  const [dayTasksEnabled, setDayTasksEnabled] = useState(() => readStored("root-web-day-tasks", false));
  const [dayGoals, setDayGoals] = useState(() =>
    readStored("root-web-day-goals", [
      { id: "1", done: true, text: "Ship Farm widget", part: "morning" },
      { id: "2", done: false, text: "Theme the landing", part: "afternoon" },
      { id: "3", done: false, text: "Write X post", part: "evening" },
    ]),
  );

  const project = projects.find((item) => item.id === projectId) || projects[0];
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
      runAutomation: (item) => {
        const record = {
          id: "run-" + Date.now(),
          automationId: item.id,
          title: item.title,
          when: "just now",
          status: "ok",
          detail: "Wrote study notes and closed the run.",
          log: "start\nread project\nwrite notes\ndone",
        };
        setRuns((prev) => [record, ...prev]);
        setAutomations((prev) =>
          prev.map((row) => (row.id === item.id ? { ...row, lastRun: "just now" } : row)),
        );
        return record;
      },
    }),
    [projects, project, projectId, toast, model, mode, fontId, onboarding, doneCount, automations, runs, session, dayTasksEnabled, dayGoals],
  );

  return <AppState.Provider value={api}>{children}</AppState.Provider>;
}

export function useAppState() {
  return useContext(AppState);
}
