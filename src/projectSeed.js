const SAFE = /^[a-z0-9][a-z0-9-]{0,38}[a-z0-9]$/;

export function projectFolderName(input) {
  let name = String(input || "").trim();
  for (const mark of '<>:"/\\|?*') name = name.split(mark).join("-");
  name = name.replace(/[\u0000-\u001f]/g, "-");
  name = name.trim().replace(/^[.\s]+|[.\s]+$/g, "");
  name = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  if (!SAFE.test(name)) return { name: "", error: "Use 2–40 letters, numbers, or hyphens." };
  return { name, error: "" };
}

export function desktopSeedFiles(repositoryName) {
  const name = repositoryName || "this repository";
  return {
    "agent.md": [
      "# Agent instructions",
      "",
      `Durable notes for **${name}** (kept short; /root updates this file).`,
      "",
      "## User preferences",
      "",
      "- None recorded yet.",
      "",
      "## Project conventions",
      "",
      "- None recorded yet.",
      "",
      "## Working notes",
      "",
      "- None recorded yet.",
      "",
    ].join("\n"),
    "rules/000-no-nextjs.md": [
      "# Never use Next.js",
      "",
      "Hard default for /root projects:",
      "",
      "- Do **not** create, scaffold, migrate to, or recommend **Next.js** (including `create-next-app`, the `next` package, or Next-specific App Router / Pages Router setups).",
      "- Prefer Vite + React, plain React, or another stack that fits the repo — unless this file is deleted or this rule is clearly overridden elsewhere.",
      "",
      "To allow Next.js: delete this file (`rules/000-no-nextjs.md`) or remove this rule from it.",
      "",
    ].join("\n"),
    "rules/001-no-emoji-graphics.md": [
      "# Never use emojis as graphics in web apps or sites",
      "",
      "Hard default for /root projects:",
      "",
      "- Do **not** use emoji characters as icons, illustrations, hero art, empty-state graphics, list markers, button ornaments, or other UI/visual design elements in web apps or websites.",
      "- Prefer real icons (SVG/icon sets), images, CSS shapes, or typography — not emoji as stand-ins for graphics.",
      "- This applies to HTML, CSS content, React/JSX UI, markdown rendered as site UI, and generated page content meant for end users.",
      "",
      "To allow emoji graphics: delete this file (`rules/001-no-emoji-graphics.md`) or remove this rule from it.",
      "",
    ].join("\n"),
  };
}
