import { sendTurn } from "./glmChat.js";
import { MAX_REPOS, createHubProject, deleteHubFile, opsFetch, runHubCommand, writeHubFiles } from "./opsApi.js";

const FENCE = /```(?:ops|json)\s*([\s\S]*?)```/g;
const MAX_STEPS = 8;
const MAX_FILE = 80000;

const GUIDE = [
  "You can change Ops Hub repositories for this wallet.",
  "When you need to look, commit, or run a command, end the reply with one or more fences and no text after the last fence:",
  "```ops",
  '{"tool":"write_file","path":"server.js","content":"full file"}',
  "```",
  "Tools: list_repos. list_files. read_file with path. search_files with query. write_file with path and the full content, which commits on the Hub. edit_file with path, find, and replace. delete_file with path. create_repo with name and about. A wallet can keep 3 repositories. run_command with command and optional cwd. git_status. git_diff. git_log. git_branch.",
  "The shell is bash inside the open repository. npm install, npm run build, and node script.js work. A command stops after two minutes, and a server is not left running. After you create or edit files, run setup such as npm install yourself with run_command. Do not tell the user to run a command unless it failed.",
  "Paths are relative. No leading slash, no .., no dot folders. Repository names are lowercase letters, numbers, and hyphens.",
  "Use the open repository when there is one. Commit real changes instead of only describing them. If nothing should change, answer in prose and do not emit a fence.",
].join("\n");

export function parseOpsTools(text) {
  const tools = [];
  const cleaned = String(text || "")
    .replace(FENCE, (full, body) => {
      const calls = readCalls(body);
      if (!calls.length) return full;
      tools.push(...calls);
      return "";
    })
    .replace(/\[ops\][\s\S]*?\[\/ops\]\n?/g, "")
    .replace(/\[ops-result\][\s\S]*?\[\/ops-result\]\n?/g, "")
    .trim();
  return { tools, cleaned };
}

export function presentTurn(message) {
  if (!message) return null;
  if (message.pending) return message;
  const raw = String(message.text || "");
  const hidden = raw.replace(/\[ops\][\s\S]*?\[\/ops\]\n?/g, "").replace(/\[ops-result\][\s\S]*?\[\/ops-result\]\n?/g, "").trim();
  if (message.role === "user" && !hidden) return null;
  const { tools, cleaned } = parseOpsTools(hidden);
  if (message.trace?.length) {
    const text = cleaned.trim();
    if (!text && message.role !== "assistant") return null;
    return { ...message, text };
  }
  const notes = tools.map(describeTool).filter(Boolean);
  const text = [cleaned, ...notes].filter(Boolean).join("\n\n").trim();
  if (!text) return null;
  return { ...message, text };
}

export function thinkingTitle(mode, step) {
  if (mode === "plan") return step === 0 ? "Planning the approach" : "Refining the plan";
  if (mode === "ask") return step === 0 ? "Reading to answer" : "Gathering more context";
  return step === 0 ? "Thinking through the request" : "Thinking briefly";
}

export function automationDue(item, now = new Date()) {
  if (!item?.active || item.schedule === "Manual") return false;
  const last = item.lastRunAt ? new Date(item.lastRunAt) : null;
  if (item.schedule === "Hourly") return !last || now - last >= 55 * 60 * 1000;
  const [hh, mm] = String(item.hour || "09:00")
    .split(":")
    .map((part) => parseInt(part, 10) || 0);
  const minutesNow = now.getHours() * 60 + now.getMinutes();
  const minutesAt = hh * 60 + mm;
  if (Math.abs(minutesNow - minutesAt) > 1) return false;
  if (!last) return true;
  if (item.schedule === "Weekly") return now - last >= 6 * 24 * 60 * 60 * 1000;
  return last.toDateString() !== now.toDateString();
}

export async function runAgentTurn({
  address,
  conversationId = "",
  project,
  token,
  mode = "agent",
  text,
  brain = {},
  files = "",
  fileTree = {},
  autoprompt = false,
  title = "",
  allowTools = false,
  onStatus,
  onTrace,
  onProject,
  onWrote,
  onRefresh,
}) {
  let current = project || null;
  let tree = { ...(fileTree || {}) };
  let convo = conversationId || "";
  let prompt = allowTools ? wrapGuide(current, text) : text;
  let last = null;
  const actions = [];
  const startedAt = Date.now();
  const steps = [{ title: thinkingTitle(mode, 0), state: "active", kind: "spark", detail: "" }];
  const publish = () => onTrace?.({ steps: steps.map((step) => ({ ...step })), startedAt });
  publish();

  for (let step = 0; step < (allowTools ? MAX_STEPS : 1); step += 1) {
    if (step > 0) {
      finishActive(steps);
      steps.push({ title: thinkingTitle(mode, step), state: "active", kind: "spark", detail: "" });
      publish();
    }
    onStatus?.(steps[steps.length - 1].title);
    last = await send(address, {
      conversationId: convo,
      project: current,
      title,
      mode: allowTools ? "agent" : mode,
      text: prompt,
      brain,
      files,
      autoprompt: step === 0 && autoprompt,
    });
    convo = last.conversation?.id || convo;
    const thought = thoughtDetail(last);
    if (thought) {
      const active = [...steps].reverse().find((item) => item.kind === "spark" && item.state === "active") || steps[steps.length - 1];
      active.detail = thought;
      publish();
    }
    if (!allowTools) break;
    const { tools, cleaned } = parseOpsTools(last.text || "");
    if (!tools.length) break;
    finishActive(steps);
    steps.push({
      title: `Preparing ${tools.length} action${tools.length === 1 ? "" : "s"}`,
      state: "done",
      kind: "pipeline",
      detail: "",
    });
    publish();
    const executed = await executeTools({
      tools,
      token,
      project: current,
      tree,
      message: cleaned,
      onProject,
      onWrote,
      onRefresh,
      onTool: (event) => {
        if (event.phase === "start") {
          finishActive(steps);
          steps.push({ title: event.title, state: "active", kind: event.kind, detail: event.detail || "" });
        } else {
          const node = [...steps].reverse().find((item) => item.state === "active") || steps[steps.length - 1];
          node.state = event.ok === false ? "done" : "done";
          node.detail = event.detail || node.detail;
          if (event.ok === false) node.title = event.title || node.title;
        }
        publish();
      },
    });
    current = executed.project;
    tree = executed.tree;
    actions.push(...executed.actions);
    finishActive(steps);
    prompt = [
      "[ops-result]",
      JSON.stringify(executed.results),
      "[/ops-result]",
      "Continue. If more Hub changes or commands are required, emit ops fences. If you are done, say what changed, with repository and paths, and do not emit a fence.",
    ].join("\n");
    files = snapshot(tree);
  }

  finishActive(steps);
  const elapsedMs = Math.max(1000, Date.now() - startedAt);
  onTrace?.({ steps: steps.map((step) => ({ ...step, state: "done" })), startedAt, elapsedMs });
  return { result: last, project: current, actions, conversationId: convo, trace: steps.map((step) => ({ ...step, state: "done" })), startedAt, elapsedMs };
}

function send(address, { conversationId, project, title, mode, text, brain, files, autoprompt }) {
  return sendTurn(address, {
    conversationId,
    projectId: project?.id || "project",
    projectLabel: project?.label || "",
    projectRemote: project?.remote || "",
    title: title || project?.label || "Agent",
    mode,
    text,
    brain,
    files,
    autoprompt,
  });
}

function finishActive(steps) {
  for (const step of steps) {
    if (step.state === "active") step.state = "done";
  }
}

function thoughtDetail(result) {
  const turns = result?.conversation?.turns || [];
  const latest = [...turns].reverse().find((turn) => turn.role === "assistant" && turn.think);
  const text = String(result?.think || latest?.think || "").replace(/\s+/g, " ").trim();
  if (!text) return "";
  const sentence = text.split(/(?<=[.!?])\s/)[0] || text;
  return sentence.slice(0, 220);
}

async function executeTools({ tools, token, project, tree, message, onProject, onWrote, onRefresh, onTool }) {
  let current = project;
  let files = { ...tree };
  const writes = {};
  const results = [];
  const actions = [];

  const flush = async () => {
    const paths = Object.keys(writes);
    if (!paths.length) return;
    if (!token) throw new Error("Sign in to Ops from Projects + before files can be committed.");
    if (!current?.owner || !current?.label) throw new Error("Open or create a repository before writing files.");
    const payload = {};
    for (const path of paths) payload[path] = writes[path];
    await writeHubFiles({
      token,
      owner: current.owner,
      name: current.label,
      branch: current.branch || "",
      message: message || "Update from /root",
      files: payload,
    });
    onWrote?.(current, payload, message);
    actions.push(...paths.map((path) => `${current.owner}/${current.label} ${path}`));
    for (const path of paths) delete writes[path];
  };

  for (const call of tools) {
    const name = String(call?.tool || "");
    const label = toolTitle(call);
    onTool?.({ phase: "start", title: label.title, kind: label.kind, detail: label.detail });
    try {
      if (name === "list_repos") {
        results.push({ tool: name, ok: true, repos: await listRepos(token) });
      } else if (name === "list_files") {
        results.push({ tool: name, ok: true, files: Object.keys(files) });
      } else if (name === "read_file") {
        const path = safePath(call.path);
        results.push({ tool: name, ok: true, path, content: String(files[path] ?? "") });
      } else if (name === "search_files") {
        results.push({ tool: name, ok: true, matches: searchTree(files, call.query) });
      } else if (name === "write_file") {
        if (!current?.owner || !current?.label) throw new Error("Open or create a repository before writing files.");
        const path = safePath(call.path);
        const content = String(call.content ?? "").slice(0, MAX_FILE);
        files[path] = content;
        writes[path] = content;
        results.push({ tool: name, ok: true, path });
      } else if (name === "edit_file") {
        if (!current?.owner || !current?.label) throw new Error("Open or create a repository before writing files.");
        const path = safePath(call.path);
        const next = applyEdit(files[path], call.find, call.replace, path);
        files[path] = next;
        writes[path] = next;
        results.push({ tool: name, ok: true, path });
      } else if (name === "delete_file") {
        await flush();
        requireRepo(current);
        const path = safePath(call.path);
        await deleteHubFile({ token, owner: current.owner, name: current.label, branch: current.branch || "", path });
        delete files[path];
        onRefresh?.();
        results.push({ tool: name, ok: true, path });
        actions.push(`${current.owner}/${current.label} delete ${path}`);
      } else if (name === "run_command" || name === "git_status" || name === "git_diff" || name === "git_log" || name === "git_branch") {
        await flush();
        requireRepo(current);
        const command = gitCommand(name, call);
        const ran = await runHubCommand({
          token,
          owner: current.owner,
          name: current.label,
          branch: current.branch || "",
          command,
          cwd: name === "run_command" ? call.cwd || "" : "",
        });
        if (ran.committed?.length) onRefresh?.();
        const output = String(ran.output || "").slice(0, 4000);
        results.push({ tool: name, ok: ran.code === 0 && !ran.timedOut, code: ran.code, output, committed: ran.committed || [] });
        if (ran.code !== 0 || ran.timedOut) {
          onTool?.({ phase: "done", ok: false, title: label.title, detail: clip(output || "The command failed.") });
        } else {
          onTool?.({ phase: "done", ok: true, detail: clip(output) });
        }
      } else if (name === "create_repo") {
        await flush();
        const created = await makeRepo(token, call);
        current = created.project;
        files = { ...created.files };
        onProject?.(created.project, created.files);
        results.push({ tool: name, ok: true, repo: created.project.id, href: created.project.href });
        actions.push(created.project.id);
      } else {
        results.push({ tool: name || "unknown", ok: false, error: "Unknown tool." });
        onTool?.({ phase: "done", ok: false, title: label.title, detail: "Unknown tool." });
      }
    } catch (error) {
      const detail = error.message || "That action failed.";
      results.push({ tool: name, ok: false, error: detail });
      onTool?.({ phase: "done", ok: false, title: label.title, detail });
    }
    const last = results[results.length - 1];
    if (last && last.ok && name !== "run_command" && !name.startsWith("git_")) {
      onTool?.({ phase: "done", ok: true, detail: last.path ? last.path : "" });
    }
  }

  try {
    await flush();
  } catch (error) {
    results.push({ tool: "commit", ok: false, error: error.message || "The commit failed." });
  }

  return { project: current, tree: files, results, actions };
}

async function listRepos(token) {
  if (!token) throw new Error("Sign in to Ops from Projects + first.");
  const data = await opsFetch("/api/hub/repos", { token });
  return (data.repos || [])
    .filter((item) => item.space === "yours")
    .map((item) => `${item.owner}/${item.name}`);
}

async function makeRepo(token, call) {
  if (!token) throw new Error("Sign in with the connected wallet before creating a repository.");
  const owned = await listRepos(token);
  if (owned.length >= MAX_REPOS) throw new Error("A wallet can keep 3 repositories.");
  const name = safeRepoName(call.name);
  const about = String(call.about || "A /root project.").slice(0, 280);
  const readme = `# ${name}\n\n${about}\n`;
  const created = await createHubProject({ token, name, about, files: { "README.md": readme } });
  const repoName = created.name || name;
  const owner = created.owner;
  return {
    project: {
      id: `${owner}/${repoName}`,
      label: repoName,
      remote: `https://ops.palmaierc.com/hub/${owner}/${repoName}.git`,
      href: `https://ops.palmaierc.com/hub?repo=${encodeURIComponent(`${owner}/${repoName}`)}`,
      owner,
      branch: created.branch || "main",
      activityAt: new Date().toISOString(),
      sessions: [],
    },
    files: { "README.md": readme },
  };
}

function wrapGuide(project, text) {
  const open = project?.id ? `Open repository: ${project.id}` : "Open repository: none";
  return `[ops]\n${GUIDE}\n${open}\n[/ops]\n${text}`;
}

function snapshot(tree) {
  return Object.entries(tree || {})
    .map(([path, text]) => "### " + path + "\n" + String(text || "").slice(0, 1500))
    .join("\n\n")
    .slice(0, 6000);
}

function readCalls(body) {
  try {
    const value = JSON.parse(String(body || "").trim());
    const list = Array.isArray(value) ? value : [value];
    return list.filter((item) => item && typeof item.tool === "string");
  } catch {
    return [];
  }
}

function describeTool(call) {
  if (call.tool === "write_file" || call.tool === "edit_file") return `Commit \`${call.path}\` on Ops Hub.`;
  if (call.tool === "delete_file") return `Delete \`${call.path}\` on Ops Hub.`;
  if (call.tool === "run_command") return `Run \`${String(call.command || "").slice(0, 80)}\`.`;
  if (call.tool === "create_repo") return `Create repository \`${call.name}\` on Ops Hub.`;
  if (call.tool === "read_file") return `Read \`${call.path}\`.`;
  if (call.tool === "search_files") return `Search files for \`${call.query}\`.`;
  if (call.tool === "list_files") return "List repository files.";
  if (call.tool === "list_repos") return "List Ops Hub repositories.";
  return "";
}

function requireRepo(current) {
  if (!current?.owner || !current?.label) throw new Error("Open or create a repository before running a command.");
}

function gitCommand(name, call) {
  if (name === "git_status") return "git status --short";
  if (name === "git_diff") return "git diff --stat";
  if (name === "git_log") return "git log -12 --oneline";
  if (name === "git_branch") return "git branch";
  const command = String(call.command || "").trim();
  if (!command) throw new Error("run_command needs a command.");
  return command;
}

function searchTree(files, query) {
  const needle = String(query || "").trim();
  if (!needle) throw new Error("search_files needs a query.");
  const matches = [];
  const lower = needle.toLowerCase();
  for (const [path, content] of Object.entries(files || {})) {
    const lines = String(content || "").split("\n");
    for (let index = 0; index < lines.length; index += 1) {
      if (!lines[index].toLowerCase().includes(lower)) continue;
      matches.push({ path, line: index + 1, text: lines[index].trim().slice(0, 160) });
      if (matches.length >= 20) return matches;
    }
  }
  return matches;
}

function toolTitle(call) {
  const name = String(call?.tool || "");
  const file = String(call?.path || call?.name || "file");
  if (name === "run_command") return { title: `Run ${String(call.command || "command").slice(0, 72)}`, kind: "terminal", detail: "" };
  if (name === "write_file" || name === "edit_file") return { title: `Edit ${file}`, kind: "pencil", detail: "" };
  if (name === "delete_file") return { title: `Delete ${file}`, kind: "pencil", detail: "" };
  if (name === "read_file") return { title: `Read ${file}`, kind: "eye", detail: "" };
  if (name === "list_files" || name === "list_repos") return { title: name === "list_repos" ? "Explore repositories" : "Explore repository", kind: "folder", detail: "" };
  if (name === "search_files") return { title: `Search files for "${String(call.query || "").slice(0, 48)}"`, kind: "search", detail: "" };
  if (name === "create_repo") return { title: `Create ${call.name || "repository"}`, kind: "folder", detail: "" };
  if (name === "git_status") return { title: "Review repository status", kind: "check", detail: "" };
  if (name === "git_diff") return { title: "Review the diff", kind: "check", detail: "" };
  if (name === "git_log") return { title: "Review recent commits", kind: "check", detail: "" };
  if (name === "git_branch") return { title: "Review branches", kind: "check", detail: "" };
  return { title: name || "Run action", kind: "spark", detail: "" };
}

function clip(text) {
  const value = String(text || "").trim();
  if (!value) return "";
  return value.length > 180 ? `${value.slice(0, 180)}…` : value;
}

function statusLine(tools) {
  const write = tools.find((item) => item.tool === "write_file" || item.tool === "edit_file");
  if (write?.path) return `Committing ${write.path} to Ops Hub…`;
  const repo = tools.find((item) => item.tool === "create_repo");
  if (repo?.name) return `Creating ${repo.name} on Ops Hub…`;
  return "Checking the repository…";
}

function safePath(path) {
  const value = String(path || "")
    .replace(/\\/g, "/")
    .replace(/^\/+/, "");
  const parts = value.split("/");
  if (!value || value.length > 180 || parts.some((part) => !part || part === "." || part === ".." || part.startsWith("."))) {
    throw new Error("That path cannot be committed.");
  }
  return value;
}

function safeRepoName(name) {
  const value = String(name || "")
    .trim()
    .toLowerCase();
  if (!/^[a-z0-9][a-z0-9-]{0,38}[a-z0-9]$/.test(value)) {
    throw new Error("Repository names are lowercase letters, numbers, and hyphens.");
  }
  return value;
}

function applyEdit(source, find, replace, path) {
  const text = String(source ?? "");
  const needle = String(find ?? "");
  if (!needle) throw new Error("edit_file needs the text to replace.");
  const at = text.indexOf(needle);
  if (at < 0) throw new Error(`That text was not in ${path}.`);
  return (text.slice(0, at) + String(replace ?? "") + text.slice(at + needle.length)).slice(0, MAX_FILE);
}
