export const PLUGINS = [
  { id: "cloudflare-assistant", name: "Cloudflare", category: "Hosting", version: "0.1.0", comingSoon: true, flairs: ["Cloudflare", "Hosting", "Preview"], description: "Visual preview of Cloudflare hosting and edge tooling — Workers, Pages, DNS, and CDN. Functionality coming soon.", commits: [["cf1000", "Add Hosting category + Cloudflare visual plugin card"]] },
  { id: "one-prompt-pipeline", name: "One Prompt Pipeline", category: "Agent mode", version: "1.0.0", bundled: true, flairs: ["Mode", "Planning", "Progress"], description: "Checklist-first agent mode with visible progress under Thinking. Intermediate reasoning stays out of chat.", commits: [["opp1000", "Ship One Prompt Pipeline mode toggle"]] },
  { id: "codebase-memory", name: "Codebase Memory", category: "Coding", version: "1.0.0", bundled: true, flairs: ["MCP", "Memory"], description: "Repository memory and semantic lookup hooks for larger codebases.", commits: [["c4a91f2", "Wire codebase-memory MCP bridge"]] },
  { id: "automation-templates", name: "Automation Templates", category: "Automation", version: "1.0.0", bundled: true, flairs: ["Automation", "Templates"], description: "Template set for scheduled local agents, repository checks, summaries, and maintenance runs.", commits: [["7710609", "Add maintenance and summary templates"]] },
  { id: "avatar-personas-pack", name: "Avatar Personas Pack", category: "Companion", version: "0.1.0", comingSoon: true, flairs: ["Persona", "Avatar", "Preview"], description: "Additional companion avatars, voice styles, and personality presets.", commits: [["a91fe21", "Add overlay avatar asset hooks"]] },
  { id: "root-crypto", name: "Root Crypto", category: "Crypto", version: "1.1.0", bundled: true, flairs: ["Ethereum", "Wallet", "Uniswap"], description: "EVM wallet tools on Ethereum mainnet: balances, sends, Uniswap V2 swaps, and contract calls.", commits: [["rc1000", "Ship in-app EVM wallet + crypto_* chat tools"]] },
  { id: "powerpoint-assistant", name: "PowerPoint Assistant", category: "Office", version: "1.0.0", bundled: true, flairs: ["PowerPoint", "Slides"], description: "python-pptx tools for creating, editing, and inspecting presentations, plus slide browsing in Files.", commits: [["pp1000", "Ship python-pptx plugin + Files tab slide viewer"]] },
  { id: "pdf-assistant", name: "PDF Assistant", category: "Office", version: "1.0.0", bundled: true, flairs: ["PDF", "Reports"], description: "Merge, split, tables, redaction, forms, and report PDFs, plus page browsing in Files.", commits: [["pdf1000", "Ship PDF plugin + Files tab page viewer"]] },
  { id: "seo-assistant", name: "SEO Assistant", category: "Research", version: "1.1.1", bundled: true, flairs: ["SEO", "Sitemap"], description: "SEO workspace tools under .root/seo/. Hidden unless you ask for SEO. Does not replace search.", commits: [["seo1110", "Gate seo_* tools to explicit SEO turns only"]] },
  { id: "dev-container-assistant", name: "Dev Container Assistant", category: "DevOps", version: "1.0.0", bundled: true, flairs: ["Docker", "Containers"], description: "Docker dev environments under .root/containers/<name>/ with compose and exec tools.", commits: [["dc1000", "Ship workspace-local Docker dev container plugin"]] },
  { id: "media-transcription-assistant", name: "Media Transcription Assistant", category: "Media", version: "1.0.0", bundled: true, flairs: ["YouTube", "Transcription"], description: "Transcribe YouTube, X Spaces, and local media into timestamped markdown under .root/media/transcripts/.", commits: [["mt1000", "Ship Media Transcription Assistant for YouTube and X"]] },
  { id: "flowcharts-assistant", name: "Flowcharts", category: "Visual", version: "1.0.0", bundled: true, flairs: ["Diagrams", "Canvas"], description: "Draggable canvases under .root/flowcharts/, including ones built from study notes, with a Files viewer.", commits: [["fc1000", "Ship Flowcharts plugin + interactive canvas viewer"]] },
  { id: "root-video-assistant", name: "Root Video", category: "Media", version: "1.0.0", bundled: true, flairs: ["Video", "HTML", "Motion"], description: "HTML compositions rendered to MP4 in Agent chat. Models write the page; Root renders the video.", commits: [["rv1000", "Ship Root Video assistant + downloadable runtime"]] },
  { id: "powerbi-assistant", name: "Power BI Assistant", category: "Specialized agent", version: "1.6.0", bundled: true, flairs: ["Power BI", "DAX"], description: "Detect Power BI Desktop, connect to its open model, and work with DAX and report files.", commits: [["b95fe25", "MSOLAP health check + in-app repair"]] },
  { id: "github-assistant", name: "GitHub Assistant", category: "Specialized agent", version: "1.0.0", bundled: true, flairs: ["GitHub", "Git"], description: "GitHub sign-in, branch sync, commits, push, and the repository UI in the file inspector.", commits: [["c95fe25", "Ship GitHub sign-in, sync, and repository inspector UI"]] },
  { id: "opsec-assistant", name: "OpSec Assistant", category: "Security", version: "1.2.0", comingSoon: true, flairs: ["Preview"], description: "Temporarily disabled — not part of the core product.", commits: [["f95fe25", "Paused from the core product"]] },
  { id: "salesforce-dev-kit", name: "Salesforce Dev Kit", category: "Specialized agent", version: "0.1.0", comingSoon: true, flairs: ["Salesforce", "Apex", "Preview"], description: "Apex, LWC, and Salesforce metadata tooling for org-specific development.", commits: [["c91fe21", "Add metadata deploy checklist"]] },
  { id: "figma-handoff-kit", name: "Figma Design Handoff", category: "Design", version: "0.1.0", comingSoon: true, flairs: ["Figma", "Design", "Preview"], description: "Turn Figma frames into implementation notes, component inventories, and starter UI code.", commits: [["d91fe21", "Generate component inventory notes"]] },
  { id: "sql-analyst-pack", name: "SQL Analyst Pack", category: "Specialized agent", version: "0.1.0", comingSoon: true, flairs: ["SQL", "Database", "Preview"], description: "Schema exploration, query drafting, and explain-plan helpers for Postgres, SQL Server, and SQLite.", commits: [["e91fe21", "Add explain-plan helper prompts"]] },
];

export const PLUGIN_CATEGORIES = ["All", ...Array.from(new Set(PLUGINS.map((item) => item.category)))];

export function defaultPluginState() {
  return Object.fromEntries(PLUGINS.map((item) => [item.id, { installed: Boolean(item.bundled), enabled: Boolean(item.bundled) }]));
}

export const TEMPLATES = [
  { id: "website-astro-tw4", title: "Website", subtitle: "Marketing site with content pages", stack: "Astro · Tailwind CSS v4", cat: "Web", folder: "my-website", dev: "npm run dev", goal: "Polish the home hero (headline, subline, accent)." },
  { id: "webapp-vite-react-tw4", title: "Web App", subtitle: "SPA with a routing-ready layout", stack: "Vite · React · Tailwind CSS v4", cat: "Web", folder: "my-web-app", dev: "npm run dev", goal: "Brand the app shell: title, primary button, one sample card." },
  { id: "landing-astro-tw4", title: "Landing Page", subtitle: "Single-page launch site with hero and CTA", stack: "Astro · Tailwind CSS v4", cat: "Web", folder: "my-landing", dev: "npm run dev", goal: "Ship a polished hero and CTA." },
  { id: "dashboard-vite-react-tw4", title: "Dashboard", subtitle: "Admin-style UI shell with sidebar", stack: "Vite · React · Tailwind CSS v4", cat: "Web", folder: "my-dashboard", dev: "npm run dev", goal: "First screen: sidebar label, page title, and three stat cards." },
  { id: "blog-astro-tw4", title: "Blog", subtitle: "Markdown posts with a reading layout", stack: "Astro · Tailwind CSS v4", cat: "Web", folder: "my-blog", dev: "npm run dev", goal: "Brand the index and make the sample post feel publish-ready." },
  { id: "docs-astro-tw4", title: "Documentation", subtitle: "Docs site with sidebar navigation", stack: "Astro · Tailwind CSS v4", cat: "Web", folder: "my-docs", dev: "npm run dev", goal: "Brand the sidebar and write a getting-started page." },
  { id: "fullstack-vite-react-api", title: "Full Stack App", subtitle: "React frontend plus a small Node API", stack: "Vite · React · Tailwind v4 · Express", cat: "Full stack", folder: "my-fullstack-app", dev: "npm run server", goal: "Brand the status dashboard and keep /api/status wired." },
  { id: "api-hono-ts", title: "API Server", subtitle: "Typed HTTP API with a health route", stack: "Hono · TypeScript · Node", cat: "Backend", folder: "my-api", dev: "npm run dev", goal: "Prove a health response, then add one JSON route." },
  { id: "extension-vite-react-tw4", title: "Browser Extension", subtitle: "Manifest V3 popup scaffold", stack: "Vite · React · Tailwind CSS v4", cat: "Apps", folder: "my-extension", dev: "npm run build", goal: "Polish the popup so it looks install-ready." },
  { id: "cli-node-ts", title: "CLI Tool", subtitle: "Command-line app with TypeScript", stack: "Node · TypeScript", cat: "Apps", folder: "my-cli", dev: "npm run dev -- --help", goal: "Improve the welcome and help output." },
  { id: "python-fastapi", title: "Python API", subtitle: "FastAPI service with a sample route", stack: "Python · FastAPI · Uvicorn", cat: "Backend", folder: "my-python-api", dev: "uvicorn app.main:app --reload", goal: "Start the server and prove a sample route." },
  { id: "mobile-expo-farm", title: "Mobile App", subtitle: "Expo app — test on PALM Farm", stack: "Expo · React Native · PALM Farm", cat: "Mobile", folder: "my-mobile-app", dev: "npx expo start", goal: "Brand the home screen, then open Farm. Skip local emulator packs." },
];

export const TEMPLATE_CATEGORIES = ["All", "Web", "Full stack", "Backend", "Apps", "Mobile"];

export function scaffoldTemplate(template) {
  const readme = `# ${template.title}\n\n${template.subtitle}\n\nStack: ${template.stack}\n\nDev: \`${template.dev}\`\n\nFirst pass: ${template.goal}\n`;
  const pkg = `{\n  "name": "${template.folder}",\n  "private": true\n}\n`;
  if (template.cat === "Backend" && template.id === "python-fastapi") {
    return {
      "README.md": readme,
      "app/main.py": "from fastapi import FastAPI\n\napp = FastAPI()\n\n@app.get('/health')\ndef health():\n    return {'ok': True}\n",
    };
  }
  if (template.cat === "Mobile") {
    return {
      "README.md": readme,
      "package.json": pkg,
      "app.json": `{\n  "expo": { "name": "${template.title}", "slug": "${template.folder}" }\n}\n`,
      "src/App.tsx": "export default function App() {\n  return null;\n}\n",
    };
  }
  return {
    "README.md": readme,
    "package.json": pkg,
    "src/App.tsx": `export default function App() {\n  return <main>${template.title}</main>;\n}\n`,
  };
}

export const BRAIN_GROUPS = ["intake", "core", "loop", "turn", "tools", "guards", "output"];

export const BRAIN_NODES = [
  { id: "entry.send", label: "Send prompt", group: "intake", enabled: true, locked: true, hint: "The turn enters here." },
  { id: "mode.route", label: "Ask / Plan / Agent", group: "intake", enabled: true, locked: true, hint: "Mode picks how far the turn may go." },
  { id: "vision.resolve", label: "Vision fallback", group: "intake", enabled: true, locked: false, hint: "Images use a vision-capable model when the selected one cannot see." },
  { id: "autoprompt.rewrite", label: "Auto-Prompt", group: "intake", enabled: false, locked: false, hint: "Rewrite a loose ask into a brief before the system prompt.", setting: "AutoPromptEnabled" },
  { id: "prompt.build", label: "Build system prompt", group: "core", enabled: true, locked: true, hint: "Assemble rules, project, and mode." },
  { id: "context.expand", label: "Expanded context", group: "core", enabled: true, locked: false, hint: "Pull more of the repo into the window.", setting: "ExpandedContextServiceEnabled" },
  { id: "harness.resolve", label: "Harness Full/Compact", group: "core", enabled: true, locked: true, hint: "Full tool harness or the compact path." },
  { id: "loop.simple", label: "Simple agent loop", group: "loop", enabled: true, locked: false, hint: "Default loop: call, tools, repeat." },
  { id: "loop.workflow", label: "One-Prompt pipeline", group: "loop", enabled: false, locked: false, hint: "Checklist pipeline instead of the simple loop.", setting: "OnePromptPipelineEnabled" },
  { id: "phase.call", label: "Call model", group: "turn", enabled: true, locked: true, hint: "One model call." },
  { id: "think.extract", label: "Extract thinking", group: "turn", enabled: true, locked: false, hint: "Pull thinking out of the stream." },
  { id: "tools.native", label: "Native tool calling", group: "tools", enabled: true, locked: false, hint: "Prefer the model's native tool channel.", setting: "PreferNativeToolCalling" },
  { id: "tools.text_fallback", label: "Text tool fallback", group: "tools", enabled: true, locked: false, hint: "Accept tool calls written as text.", setting: "AllowTextToolFallback" },
  { id: "tools.parse", label: "Parse tool calls", group: "tools", enabled: true, locked: true, hint: "Turn the reply into calls." },
  { id: "tools.force_first", label: "Force tools first", group: "tools", enabled: true, locked: false, hint: "On repo tasks, call a tool before prose.", setting: "ForceToolFirstOnRepoTasks" },
  { id: "tools.approve", label: "Tool approval", group: "tools", enabled: false, locked: false, hint: "Ask before each tool runs.", setting: "RequireToolApprovalPerAction" },
  { id: "tools.execute", label: "Execute tools", group: "tools", enabled: true, locked: true, hint: "Run the parsed calls." },
  { id: "wiki.tools", label: "LLM wiki tools", group: "tools", enabled: true, locked: false, hint: "Read and write the project wiki.", setting: "EnableLlmWiki" },
  { id: "guard.explore", label: "Explore / stall guards", group: "guards", enabled: true, locked: false, hint: "Stop loops that only browse." },
  { id: "guard.force_final", label: "Force final answer", group: "guards", enabled: true, locked: false, hint: "End the turn with an answer." },
  { id: "answer.reflect", label: "Reflection passes", group: "output", enabled: false, locked: false, hint: "Extra pass before the answer is final.", setting: "ReflectionPasses" },
  { id: "answer.finalize", label: "Finalize answer", group: "output", enabled: true, locked: true, hint: "Lock the reply." },
  { id: "ui.stream", label: "Stream to UI", group: "output", enabled: true, locked: true, hint: "Chat shows the stream." },
];

export const BRAIN_TOUR = ["entry.send", "mode.route", "prompt.build", "harness.resolve", "loop.simple", "phase.call", "tools.parse", "tools.execute", "answer.finalize", "ui.stream"];

export const STEP_KINDS = ["navigate", "type", "click", "wait", "otp", "scrape", "pause"];

export const SEED_FLOWS = [
  {
    id: "sample-signup",
    name: "Signup + mail OTP",
    startUrl: "https://example.com/signup",
    mailUrl: "https://mail.example.com",
    steps: [
      { id: "s1", kind: "navigate", label: "Open signup", value: "{{start}}" },
      { id: "s2", kind: "type", label: "Email", value: "{{email}}" },
      { id: "s3", kind: "click", label: "Continue", value: "button[type=submit]" },
      { id: "s4", kind: "otp", label: "Read mail code", value: "pane B" },
      { id: "s5", kind: "type", label: "Paste code", value: "{{otp}}" },
    ],
    lastLog: "",
  },
];

export const SEED_SITES = [
  { id: "landing", name: "landing.palmaierc.com", status: "Live" },
  { id: "docs", name: "docs.palmaierc.com", status: "Live" },
  { id: "wiki", name: "wiki.palmaierc.com", status: "Probe" },
];

export const SEED_FILES = {
  "my-mobile-app": {
    "README.md": "# my-mobile-app\n\nExpo app. Preview on PALM Farm.\n",
    "package.json": "{\n  \"name\": \"my-mobile-app\",\n  \"private\": true,\n  \"dependencies\": {\n    \"expo\": \"^54.0.0\"\n  }\n}\n",
    "app.json": "{\n  \"expo\": {\n    \"name\": \"my-mobile-app\",\n    \"slug\": \"my-mobile-app\"\n  }\n}\n",
    "src/App.tsx": "export default function App() {\n  return null;\n}\n",
  },
  landing: {
    "README.md": "# landing\n\nAstro landing. Ship with Ops.\n",
    "package.json": "{\n  \"name\": \"landing\",\n  \"private\": true\n}\n",
    "src/pages/index.astro": "---\nconst title = 'Landing';\n---\n<h1>{title}</h1>\n",
  },
  wiki: {
    "README.md": "# wiki\n\nHelp pages for useroot.sh.\n",
    "docs/welcome.md": "# Welcome\n\nStart here.\n",
    "docs/keyboard.md": "# Keyboard\n\nCtrl+K opens the palette.\n",
  },
};

export const SEED_COMMITS = {
  "my-mobile-app": [
    { hash: "a1c3e2", msg: "Fix expo-asset crash", when: "now" },
    { hash: "9bb014", msg: "Scaffold Expo template", when: "2h" },
  ],
  landing: [
    { hash: "c4d812", msg: "Hero copy", when: "2h" },
    { hash: "11ab90", msg: "Initial Astro scaffold", when: "1d" },
  ],
  wiki: [{ hash: "ee9012", msg: "Port welcome page", when: "yesterday" }],
};

export const SEED_VIDEOS = [
  { id: "intro", name: "Intro card", html: "<section class=\"stage\"><h1>Intro</h1></section>\n" },
];

export const DEFAULT_PREFS = {
  privacy: true,
  autoprompt: false,
  telemetry: true,
  imagegen: false,
  imageAlways: false,
  imageUrl: "http://127.0.0.1:8188",
  imageSize: "1024 × 1024",
  imageCheckpoint: "FLUX.2 Klein 4B distilled",
  video: false,
  subClaude: false,
  subOpenAi: false,
  subGrok: false,
};

export const SEED_CHARTS = [
  { id: "onboarding", name: "onboarding", project: "my-mobile-app", nodes: ["Open", "Sign in", "First run"] },
  { id: "farm-push", name: "farm-push", project: "my-mobile-app", nodes: ["Build", "Upload", "Cloud phone"] },
  { id: "ops-deploy", name: "ops-deploy", project: "landing", nodes: ["Build dist", "Sign", "Live domain"] },
];
