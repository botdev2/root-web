import { formatCredits } from "../glmChat.js";

export const TOUR_PROMPT =
  "Build a one-page landing site for a coffee cart called Ember and Oat. Put it in index.html with a dark background, a warm amber accent, a big headline, three menu items with prices, and a footer. Commit it to this repository.";

export const TOUR_REPO = "my-first-repo";

function pickRepoName(live) {
  const taken = new Set((live.projects || []).map((name) => String(name).toLowerCase()));
  if (!taken.has(TOUR_REPO)) return TOUR_REPO;
  for (let n = 2; n < 50; n += 1) {
    const name = `${TOUR_REPO}-${n}`;
    if (!taken.has(name)) return name;
  }
  return `${TOUR_REPO}-${Date.now().toString(36).slice(-4)}`;
}

function committedFile(live) {
  const files = live.lastCommit?.files || [];
  return files.find((name) => /\.html?$/i.test(name)) || files.find((name) => !/^(agent\.md|rules\/)/.test(name)) || files[0] || "";
}

function esc(value) {
  return String(value).replace(/["\\]/g, "\\$&");
}

export function buildScript() {
  return [
    {
      id: "hello",
      chapter: "Welcome",
      title: "I'm your guide.",
      body:
        "I'll walk you through /root, then we'll build something real together: a repository of your own, a prompt, and your first committed file. Nothing here is a mock-up.",
      target: null,
      cta: "Show me",
    },
    {
      id: "sidebar",
      chapter: "The workspace",
      title: "Everything lives down this rail.",
      body: "Chats, repositories, and the tools around them. It's the same layout whether you're on a laptop or a phone.",
      target: '[data-tour="sidebar"]',
      pad: 0,
      enter: async (c) => c.controls.setNavOpen(true),
    },
    {
      id: "new-agent",
      chapter: "The workspace",
      title: "Every job starts with New Agent.",
      body: "A fresh conversation, with nothing carried over from the last one. Click it whenever you want a clean slate.",
      target: '[data-tour="nav-home"]',
    },
    {
      id: "chats",
      chapter: "The workspace",
      title: "Your chats follow your wallet.",
      body: "Conversations are kept for this wallet, up to ten. Reopen any of them, or delete one with the ×.",
      target: '[data-tour="chats-head"], [data-chat]',
      limit: 4,
    },
    {
      id: "projects",
      chapter: "The workspace",
      title: "Projects are real git repositories.",
      body: "Each one lives on the Ops Hub, signed to your wallet. You can keep three, and the + is how you make one. We'll use it in a minute.",
      target: '[data-tour="projects-head"]',
    },
    {
      id: "tools",
      chapter: "The workspace",
      title: "And a few tools around the edge.",
      body: "Automations run scheduled helpers. Reasoning shows how the agent thinks, one stage at a time. Ops handles hosting and domains. Notes keeps your daily goals.",
      target: '[data-tour="nav"]',
    },
    {
      id: "wallet",
      chapter: "Your wallet",
      title: (live) => (live.isConnected ? "Your wallet is your login." : "Connect your wallet."),
      body: (live) =>
        live.isConnected
          ? "There is no account and no password. This address is your identity here: chats, repositories, and credits all follow it."
          : "There is no account and no password. Your wallet is your login. Connect it from here and I'll wait for you.",
      target: '[data-tour="wallet"]',
      interactive: true,
      wait: { text: "Waiting for your wallet…", until: (live) => live.isConnected },
    },
    {
      id: "session",
      chapter: "Your wallet",
      title: "Sign once.",
      body: "Approve the free message in your wallet. It proves the address is yours and opens your Ops Hub session. It's not a transaction and it costs no gas.",
      target: '[data-tour="wallet"]',
      interactive: true,
      skipIf: (live) => !!live.opsToken,
      wait: { text: "Waiting for your signature…", until: (live) => !!live.opsToken },
    },
    {
      id: "credits",
      chapter: "Your wallet",
      title: "GLM 5.2 runs on credits.",
      body: (live) => {
        const credit = live.credit;
        if (!credit) return "Your balance shows up here once you're signed in. 1,000 $PALM held or staked is 1 credit, and the window resets every two weeks.";
        if (credit.allowance <= 0)
          return "This wallet holds no $PALM yet, so it has no credits. 1,000 $PALM held or staked is 1 credit, and the window resets every two weeks.";
        return `You have ${formatCredits(credit.remaining)} of ${formatCredits(credit.allowance)} credits this window. 1,000 $PALM held or staked is 1 credit, and the window resets every two weeks.`;
      },
      target: ['[data-tour="credits"]', '[data-tour="meters"]'],
    },
    {
      id: "composer",
      chapter: "The composer",
      title: "This is where you talk to the agent.",
      body: "Describe what you want in plain language. GLM 5.2 cloud does the thinking, and the agent works inside your repository.",
      target: '[data-tour="composer"]',
      place: "top",
      enter: async (c) => {
        c.controls.setNavOpen(false);
        c.controls.setFilesOpen(false);
      },
    },
    {
      id: "modes",
      chapter: "The composer",
      title: "Three modes, three levels of trust.",
      body: "Agent writes files and runs commands in your repository. Ask only reads and answers. Plan reads, then lays out numbered steps before touching anything.",
      target: '[data-tour="modes"]',
      place: "top",
    },
    {
      id: "pills",
      chapter: "The composer",
      title: "Sharpen it, attach to it, inspect it.",
      body: "Auto-Prompt has the agent restate your ask as a short brief before it answers. Attach adds files to the message. Files opens the inspector on your repository.",
      target: '[data-tour="autoprompt"], [data-tour="model"], [data-tour="attach"], [data-tour="files"]',
      place: "top",
    },
    {
      id: "meters",
      chapter: "The composer",
      title: "Two gauges and an export.",
      body: "The first ring is the context window, 8,192 tokens. The second is your credits. JSON downloads the whole conversation.",
      target: '[data-tour="meters"], [data-tour="json"]',
      place: "top",
    },
    {
      id: "repo-open",
      chapter: "Your first repository",
      title: (live) => (live.projects.length >= 3 ? "You already keep three repositories." : "Let's make your first repository."),
      body: (live) =>
        live.projects.length >= 3
          ? "Three is the limit for a wallet, so we'll build in the one you have open. Delete one from the sidebar any time to make room."
          : "Click +, give it a name, and it becomes a real git repository on the Ops Hub. I'll drive.",
      target: '[data-tour="add-project"]',
      enter: async (c) => {
        c.controls.setNavOpen(true);
        c.flags.repoName = "";
      },
      cta: (live) => (live.projects.length >= 3 ? "Use this one" : "Create it for me"),
      act: async (c) => {
        const live = c.live();
        if (live.projects.length >= 3) {
          c.flags.repoName = live.activeProject || live.projects[0] || "";
          return { goto: "repo-made" };
        }
        const plus = c.q('[data-tour="add-project"]');
        if (!plus) return "stay";
        await c.click(plus);
        const ready = await c.waitFor(() => c.q("[data-add-project]"), 5000);
        return ready ? undefined : "stay";
      },
    },
    {
      id: "repo-form",
      chapter: "Your first repository",
      title: "Name it.",
      body: "Lowercase letters, numbers, and hyphens. It starts with agent notes and a couple of house rules the agent follows from the first prompt.",
      target: "[data-add-project]",
      cta: "Create on Ops Hub",
      act: async (c) => {
        const live = c.live();
        const name = pickRepoName(live);
        const input = c.q('[data-tour="repo-name"]');
        const create = c.q('[data-tour="repo-create"]');
        if (!input || !create) return "stay";
        c.flags.repoName = name;
        if (!(await c.typeInto(input, name, { speed: 60 }))) return "stay";
        await c.sleep(450);
        await c.click(create);
        c.caption("Creating it on the Hub…");
        const made = await c.waitFor(() => c.live().projects.includes(name), 30000);
        if (!made) {
          const message = document.querySelector("[data-add-project] .text-\\[12\\.5px\\]")?.textContent || "";
          c.caption(message || "That didn't go through. Check the name and try again.");
          return "stay";
        }
        c.caption("");
        const done = await c.waitFor(() => c.q('[data-tour="repo-done"]'), 6000);
        if (done) {
          await c.sleep(1200);
          await c.click(done);
        }
        await c.sleep(500);
        return undefined;
      },
    },
    {
      id: "repo-made",
      chapter: "Your first repository",
      title: "It's live on the Hub.",
      body: (live, flags) =>
        `${flags.repoName || live.activeProject || "Your repository"} is a real git repository. The Hub link opens it in the browser, and the × deletes it if you ever want it gone.`,
      target: (live, flags) => `[data-project="${esc(flags.repoName || live.activeProject || "")}"]`,
      enter: async (c) => {
        c.controls.setNavOpen(true);
        c.controls.newChat();
        await c.sleep(300);
      },
    },
    {
      id: "prompt",
      chapter: "Your first prompt",
      title: "Now, the first prompt.",
      body: "Plain language is enough. Say what you want and where it should go. I've switched to Agent mode, because Agent is the one that can write files. Watch me type.",
      target: '[data-tour="composer"]',
      place: "top",
      enter: async (c) => {
        c.controls.setNavOpen(false);
        c.controls.setFilesOpen(false);
        c.controls.setMode("agent");
        c.controls.newChat();
        await c.sleep(700);
        const box = c.q('[data-tour="prompt"]');
        if (box) await c.typeInto(box, TOUR_PROMPT, { speed: 20 });
      },
      cta: "Send it",
      act: async (c) => {
        const live = c.live();
        if (live.credit && live.credit.remaining <= 0) {
          c.flags.blocked = "credits";
          return { goto: "blocked" };
        }
        c.flags.sawSending = false;
        const send = c.q('[data-tour="send"]');
        if (!send) return "stay";
        await c.sleep(400);
        await c.click(send);
        const started = await c.waitFor(() => c.flags.sawSending || c.live().sending, 5000);
        if (!started) {
          c.flags.blocked = "send";
          return { goto: "blocked" };
        }
        return undefined;
      },
    },
    {
      id: "watch",
      chapter: "Your first prompt",
      title: "Now watch it work.",
      body: "Every line in the trail is a real step: reading your repository, writing a file, committing it to the Hub. I'll wait right here.",
      target: '[data-tour="thread"]',
      place: "dock",
      wait: {
        text: "The agent is working…",
        settle: 1200,
        until: (live, flags) => flags.sawSending && !live.sending,
      },
    },
    {
      id: "committed",
      chapter: "The result",
      title: "Your first committed file.",
      body: (live) => {
        const file = committedFile(live);
        const repo = live.lastCommit?.project || live.activeProject || "your repository";
        return `${file || "A file"} is now in ${repo} on the Ops Hub. The agent wrote it and committed it with the real time. Green means it's new in that commit.`;
      },
      target: (live) => {
        const file = committedFile(live);
        return file ? [`[data-tour-file="${esc(file)}"]`, '[data-tour="inspector"]'] : '[data-tour="inspector"]';
      },
      skipIf: (live, flags) => !(live.lastCommit && live.lastCommit.at >= flags.startedAt),
      enter: async (c) => {
        c.controls.setNavOpen(false);
        c.controls.setFilesOpen(true);
        await c.waitFor(() => c.q('[data-tour="inspector"]'), 4000);
        await c.sleep(600);
      },
    },
    {
      id: "history",
      chapter: "The result",
      title: "Every change is a commit.",
      body: "The Git tab keeps the history. Each prompt that changes files lands as a commit, so you can always see what changed and when.",
      target: '[data-tour="inspector"]',
      skipIf: (live, flags) => !(live.lastCommit && live.lastCommit.at >= flags.startedAt),
      enter: async (c) => {
        const inspector = c.q('[data-tour="inspector"]');
        const tab = inspector && Array.from(inspector.querySelectorAll("button")).find((node) => node.textContent.trim() === "Git");
        if (tab) await c.click(tab);
      },
    },
    {
      id: "nocommit",
      chapter: "The result",
      title: "No file this time.",
      body: "The agent answered without writing a file. That happens. Ask again in Agent mode and name the file you want, like \"create index.html\".",
      target: '[data-tour="thread"]',
      place: "dock",
      skipIf: (live, flags) => !!flags.blocked || !!(live.lastCommit && live.lastCommit.at >= flags.startedAt),
    },
    {
      id: "blocked",
      chapter: "The result",
      title: (live, flags) => (flags.blocked === "credits" ? "Credits come first." : "That prompt didn't send."),
      body: (live, flags) =>
        flags.blocked === "credits"
          ? "This wallet has no GLM credits left in this window. Hold or stake $PALM, where 1,000 is 1 credit, or wait for the reset, then send your first prompt. Everything else in /root works as it is."
          : "Something stopped the message before it left. Check that your wallet is connected and a repository is open, then press send.",
      target: ['[data-tour="credits"]', '[data-tour="meters"]'],
      skipIf: (live, flags) => !flags.blocked,
    },
  ];
}
