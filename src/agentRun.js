import { sendTurn } from "./glmChat.js";
import { MAX_REPOS, createHubProject, opsFetch, writeHubFiles } from "./opsApi.js";

const FENCE = /```(?:ops|json)\s*([\s\S]*?)```/g;
const MAX_STEPS = 5;
const MAX_FILE = 80000;

const GUIDE = [
  "You can change Ops Hub repositories for this wallet.",
  "When you need to look or commit, end the reply with one or more fences and no text after the last fence:",
  "```ops",
  '{"tool":"write_file","path":"src/App.jsx","content":"full file"}',
  "```",
  "Tools: list_repos. list_files. read_file with path. write_file with path and the full content, which commits on the Hub. edit_file with path, find, and replace, which commits the first exact replacement. create_repo with name and about, which creates a Hub repository. A wallet can keep 3 repositories.",
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
  if (!message || message.pending) return message;
  const raw = String(message.text || "");
  const hidden = raw.replace(/\[ops\][\s\S]*?\[\/ops\]\n?/g, "").replace(/\[ops-result\][\s\S]*?\[\/ops-result\]\n?/g, "").trim();
  if (message.role === "user" && !hidden) return null;
  const { tools, cleaned } = parseOpsTools(hidden);
  const notes = tools.map(describeTool).filter(Boolean);
  const text = [cleaned, ...notes].filter(Boolean).join("\n\n").trim();
  if (!text) return null;
  return { ...message, text };
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
  onProject,
  onWrote,
}) {
  let current = project || null;
  let tree = { ...(fileTree || {}) };
  let convo = conversationId || "";
  let prompt = allowTools ? wrapGuide(current, text) : text;
  let last = null;
  const actions = [];

  for (let step = 0; step < (allowTools ? MAX_STEPS : 1); step += 1) {
    onStatus?.(step === 0 ? "GLM 5.2 cloud is writing…" : "Applying repository changes…");
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
    if (!allowTools) break;
    const { tools, cleaned } = parseOpsTools(last.text || "");
    if (!tools.length) break;
    onStatus?.(statusLine(tools));
    const executed = await executeTools({
      tools,
      token,
      project: current,
      tree,
      message: cleaned,
      onProject,
      onWrote,
    });
    current = executed.project;
    tree = executed.tree;
    actions.push(...executed.actions);
    prompt = [
      "[ops-result]",
      JSON.stringify(executed.results),
      "[/ops-result]",
      "Continue. If more Hub changes are required, emit ops fences. If you are done, say what changed, with repository and paths, and do not emit a fence.",
    ].join("\n");
    files = snapshot(tree);
  }

  return { result: last, project: current, actions, conversationId: convo };
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

async function executeTools({ tools, token, project, tree, message, onProject, onWrote }) {
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
      message: message || "Update from /root",
      files: payload,
    });
    onWrote?.(current, payload, message);
    actions.push(...paths.map((path) => `${current.owner}/${current.label} ${path}`));
    for (const path of paths) delete writes[path];
  };

  for (const call of tools) {
    const name = String(call?.tool || "");
    try {
      if (name === "list_repos") {
        results.push({ tool: name, ok: true, repos: await listRepos(token) });
      } else if (name === "list_files") {
        results.push({ tool: name, ok: true, files: Object.keys(files) });
      } else if (name === "read_file") {
        const path = safePath(call.path);
        results.push({ tool: name, ok: true, path, content: String(files[path] ?? "") });
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
      }
    } catch (error) {
      results.push({ tool: name, ok: false, error: error.message || "That action failed." });
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
  if (call.tool === "create_repo") return `Create repository \`${call.name}\` on Ops Hub.`;
  if (call.tool === "read_file") return `Read \`${call.path}\`.`;
  if (call.tool === "list_files") return "List repository files.";
  if (call.tool === "list_repos") return "List Ops Hub repositories.";
  return "";
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
