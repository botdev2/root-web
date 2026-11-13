import { desktopSeedFiles } from "./projectSeed.js";

export const SHIP_KINDS = [
  {
    id: "landing",
    title: "Landing",
    detail: "Hero, pitch, one button.",
    headline: "This page compiled.",
    lede: "A Vite + React site with a Dockerfile. Ops builds it from the Hub repo. No GitHub.",
  },
  {
    id: "webapp",
    title: "Web app",
    detail: "Shell and a home screen.",
    headline: "Your app is running.",
    lede: "A Vite + React shell that builds in Docker. Edit it from /root chat, then push again.",
  },
  {
    id: "dashboard",
    title: "Dashboard",
    detail: "Stats and a short list.",
    headline: "Numbers you can ship.",
    lede: "A Vite + React dashboard scaffold. Ops compiles it from the Hub. Stay on this page.",
  },
];

export function shipFiles(name, kindId) {
  const kind = SHIP_KINDS.find((item) => item.id === kindId) || SHIP_KINDS[0];
  return { ...desktopSeedFiles(name), ...compileReadyFiles(name, kind) };
}

export function compileReadyFiles(name, kind) {
  const title = kind?.title || "Landing";
  const headline = kind?.headline || "This page compiled.";
  const lede = kind?.lede || "A Vite + React site that Ops can build.";
  const slug = String(name || "app").replace(/[^a-z0-9-]/gi, "-").toLowerCase() || "app";
  const css = pageCss();
  return {
    "README.md": [
      `# ${slug}`,
      "",
      `${title} scaffold that compiles.`,
      "",
      "```",
      "npm install",
      "npm run dev",
      "npm run build",
      "```",
      "",
      "Ops builds the Dockerfile (port 3000) from this Hub repo. Stay on chat.useroot.sh — the wallet is the account.",
      "",
    ].join("\n"),
    "package.json": JSON.stringify(
      {
        name: slug,
        private: true,
        type: "module",
        scripts: {
          dev: "vite",
          build: "vite build",
          preview: "vite preview --host 0.0.0.0 --port 3000",
        },
        dependencies: {
          react: "^19.0.0",
          "react-dom": "^19.0.0",
        },
        devDependencies: {
          "@vitejs/plugin-react": "^4.3.4",
          vite: "^6.0.3",
        },
      },
      null,
      2,
    ) + "\n",
    "vite.config.js": [
      'import { defineConfig } from "vite";',
      'import react from "@vitejs/plugin-react";',
      "",
      "export default defineConfig({",
      "  plugins: [react()],",
      "  server: { host: true, port: 5173 },",
      "  preview: { host: true, port: 3000 },",
      "});",
      "",
    ].join("\n"),
    "index.html": [
      "<!doctype html>",
      '<html lang="en">',
      "  <head>",
      '    <meta charset="UTF-8" />',
      '    <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
      `    <title>${escapeHtml(slug)}</title>`,
      "  </head>",
      "  <body>",
      '    <div id="root"></div>',
      '    <script type="module" src="/src/main.jsx"></script>',
      "  </body>",
      "</html>",
      "",
    ].join("\n"),
    "src/main.jsx": [
      'import { StrictMode } from "react";',
      'import { createRoot } from "react-dom/client";',
      'import App from "./App.jsx";',
      'import "./index.css";',
      "",
      'createRoot(document.getElementById("root")).render(',
      "  <StrictMode>",
      "    <App />",
      "  </StrictMode>,",
      ");",
      "",
    ].join("\n"),
    "src/App.jsx": appSource({ slug, title, headline, lede, kindId: kind?.id || "landing" }),
    "src/index.css": css,
    Dockerfile: [
      "FROM node:22-alpine",
      "WORKDIR /app",
      "COPY package.json ./",
      "RUN npm install",
      "COPY . .",
      "RUN npm run build",
      "RUN npm install -g serve@14",
      "ENV PORT=3000",
      "EXPOSE 3000",
      'CMD ["serve", "-s", "dist", "-l", "3000"]',
      "",
    ].join("\n"),
    ".dockerignore": "node_modules\ndist\n.git\n",
  };
}

function appSource({ slug, title, headline, lede, kindId }) {
  if (kindId === "dashboard") {
    return [
      "const STATS = [",
      '  { label: "Build", value: "ok" },',
      '  { label: "Repo", value: "Hub" },',
      '  { label: "Host", value: "Ops" },',
      "];",
      "",
      "export default function App() {",
      "  return (",
      '    <main className="page">',
      "      <header>",
      `        <div className="mark">${escapeJsx(title)}</div>`,
      `        <div className="name">${escapeJsx(slug)}</div>`,
      "      </header>",
      '      <section className="hero">',
      '        <p className="kicker">Live from Ops Hub</p>',
      `        <h1>${escapeJsx(headline)}</h1>`,
      `        <p className="lede">${escapeJsx(lede)}</p>`,
      "      </section>",
      '      <section className="grid">',
      "        {STATS.map((row) => (",
      '          <article key={row.label} className="card">',
      "            <div className=\"label\">{row.label}</div>",
      "            <div className=\"value\">{row.value}</div>",
      "          </article>",
      "        ))}",
      "      </section>",
      "    </main>",
      "  );",
      "}",
      "",
    ].join("\n");
  }
  if (kindId === "webapp") {
    return [
      "export default function App() {",
      "  return (",
      '    <main className="page">',
      "      <header>",
      `        <div className="mark">${escapeJsx(title)}</div>`,
      `        <div className="name">${escapeJsx(slug)}</div>`,
      "      </header>",
      '      <section className="hero">',
      '        <p className="kicker">Home</p>',
      `        <h1>${escapeJsx(headline)}</h1>`,
      `        <p className="lede">${escapeJsx(lede)}</p>`,
      '        <a className="cta" href="https://chat.useroot.sh">Edit in /root</a>',
      "      </section>",
      "    </main>",
      "  );",
      "}",
      "",
    ].join("\n");
  }
  return [
    "export default function App() {",
    "  return (",
    '    <main className="page">',
    "      <header>",
    `        <div className="mark">${escapeJsx(title)}</div>`,
    `        <div className="name">${escapeJsx(slug)}</div>`,
    "      </header>",
    '      <section className="hero">',
    '        <p className="kicker">Live from Ops Hub</p>',
    `        <h1>${escapeJsx(headline)}</h1>`,
    `        <p className="lede">${escapeJsx(lede)}</p>`,
    '        <a className="cta" href="https://chat.useroot.sh">Open /root</a>',
    "      </section>",
    "    </main>",
    "  );",
    "}",
    "",
  ].join("\n");
}

function pageCss() {
  return [
    ":root {",
    "  color-scheme: dark;",
    "  --bg: #0c0d10;",
    "  --ink: #f4f1ea;",
    "  --muted: #9a9488;",
    "  --line: #2a2c32;",
    "  --panel: #16181d;",
    "  --accent: #c9b48a;",
    "}",
    "* { box-sizing: border-box; }",
    "html, body, #root { margin: 0; min-height: 100%; }",
    "body { font-family: ui-sans-serif, system-ui, sans-serif; background: var(--bg); color: var(--ink); }",
    ".page { min-height: 100dvh; padding: 28px 22px 64px; max-width: 880px; margin: 0 auto; }",
    "header { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; }",
    ".mark { font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--muted); }",
    ".name { font-size: 13px; color: var(--muted); }",
    ".hero { margin-top: 18vh; }",
    ".kicker { margin: 0 0 10px; font-size: 12px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--accent); }",
    "h1 { margin: 0; font-size: clamp(36px, 7vw, 64px); font-weight: 560; letter-spacing: -0.04em; line-height: 1.02; }",
    ".lede { max-width: 42ch; margin: 18px 0 28px; font-size: 17px; line-height: 1.55; color: var(--muted); }",
    ".cta { display: inline-flex; height: 44px; align-items: center; padding: 0 18px; border-radius: 999px; background: var(--ink); color: var(--bg); text-decoration: none; font-size: 14px; }",
    ".grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin-top: 36px; }",
    ".card { padding: 16px; border: 1px solid var(--line); border-radius: 16px; background: var(--panel); }",
    ".label { font-size: 12px; color: var(--muted); }",
    ".value { margin-top: 6px; font-size: 22px; }",
    "",
  ].join("\n");
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeJsx(value) {
  return String(value || "").replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\{/g, "&#123;");
}
