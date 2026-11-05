/**
 * Guided tutorial episodes. They run on the same engine as the first-run tour
 * (components/Tour.jsx): spotlight, typed narration, a ghost cursor that drives
 * the real page, plus optional playable widgets (components/EpisodeWidgets.jsx).
 *
 * Nothing in an episode spends money or needs a wallet. The one live call is
 * the public domain search.
 */

async function showOps(c) {
  c.controls.setFilesOpen(false);
  c.controls.setNavOpen(false);
  c.controls.openView("ops");
  await c.waitFor(() => c.q('[data-tour="ops-links"]'), 4000);
  await c.sleep(350);
}

async function showHarness(c, { nav = false, files = false } = {}) {
  c.controls.setFilesOpen(false);
  c.controls.newChat();
  c.controls.setNavOpen(nav);
  await c.sleep(450);
  if (files) {
    c.controls.setFilesOpen(true);
    await c.waitFor(() => c.q('[data-tour="inspector"]'), 3000);
    await c.sleep(400);
  }
}

function buildOpsIntro() {
  return [
    {
      id: "hello",
      chapter: "Welcome",
      title: "Episode 1: Introduction to Ops.",
      body:
        "In about five minutes we'll walk the whole of ops.palmaierc.com, what it is, and how it plugs into this harness. There are a few little games on the way. Each one you finish earns a star, and none of them are required.",
      target: null,
      cta: "Roll the episode",
    },
    {
      id: "what",
      chapter: "The big idea",
      title: "Ops is where what you build goes to live.",
      body:
        "Three offers, one address. Hosting puts a site on a public link. Domains sells you a name without your name on it. Ops Hub is git that belongs to your wallet. There is no sign-up form, and ops.palmaierc.com is the public site for the same console you'll find under Ops in this app.",
      target: null,
    },
    {
      id: "road",
      chapter: "The big idea",
      title: "The whole road in one picture.",
      body:
        "Wallet, Harness, Hub, Hosting, Domains. The Harness is this app, where Hamrin and the agent write the code. Everything to its right is Ops. Tap every stop to light up the road.",
      target: null,
      widget: "pipeline",
    },
  ];
}

function buildOpsConsole() {
  return [
    {
      id: "console",
      chapter: "The console",
      title: "Four doors on one site.",
      body:
        "Hosting, Domains, Ops Hub and Plans each open their page on ops.palmaierc.com. The tab you're looking at is the same console, already holding your wallet.",
      target: '[data-tour="ops-links"]',
      enter: showOps,
    },
    {
      id: "gauges",
      chapter: "The console",
      title: "Three gauges at a glance.",
      body:
        "Hosting is a live probe of the Ops API, refreshed every 15 seconds. Wallet is the address you're signed in as. Plan shows your free 48 hours, then Plot, Grove or Canopy.",
      target: '[data-tour="ops-cards"]',
      enter: showOps,
    },
    {
      id: "signin",
      chapter: "The console",
      title: "Signing in, the Ops way.",
      body:
        "You sign a free message with your wallet. It proves the address is yours and costs nothing. The first time, you also add an authenticator code. Two factors, and neither one is an email. The session stays in this browser.",
      target: '[data-tour="ops-account"]',
      enter: showOps,
    },
  ];
}

function buildOpsHosting() {
  return [
    {
      id: "sites",
      chapter: "Hosting",
      title: "Every site you ship lands here.",
      body:
        "Each site shows its status, its public link, and any domain attached to it. Redeploy rebuilds from the same branch. One wallet can hold up to eight sites, and the plan you pick after the trial sets how many.",
      target: '[data-tour="ops-sites"]',
      enter: showOps,
    },
    {
      id: "publish",
      chapter: "Hosting",
      title: "Publish straight from GitHub.",
      body:
        "Paste a personal access token once. Ops uses it to install a read-only deploy key on that repository, then forgets the token. Pick a branch and a build pack, press Publish, and later pushes can rebuild it by themselves.",
      target: '[data-tour="ops-publish"]',
      enter: showOps,
    },
    {
      id: "packs",
      chapter: "Hosting",
      title: "Game one: match the build pack.",
      body:
        "Nixpacks works out a framework build by itself. Dockerfile follows your own recipe. Static serves plain files. Dist folder serves a build you already committed. Pick the right one for each repository.",
      target: null,
      widget: "buildpack",
    },
    {
      id: "plans",
      chapter: "Hosting",
      title: "Game two: find your plan.",
      body:
        "The first 48 hours are free. After that you choose a flat monthly plan, and Ops never meters traffic, builds or storage. Plot holds 2 sites, Grove 8, Canopy 20.",
      target: null,
      widget: "plans",
    },
  ];
}

function buildOpsDomains() {
  return [
    {
      id: "domains",
      chapter: "Domains",
      title: "Domains without your name on them.",
      body:
        "Ops is the registrant, so the public record shows Ops and not you. You search, add to a cart, and pay in USDC. I'll look a name up for you now.",
      target: '[data-tour="ops-domains"]',
      enter: showOps,
      cta: "Search for me",
      act: async (c) => {
        const input = c.q('[data-tour="ops-domain-input"]');
        const go = c.q('[data-tour="ops-domain-search"]');
        if (!input || !go) return undefined;
        input.scrollIntoView({ block: "center", behavior: "smooth" });
        await c.sleep(500);
        if (!(await c.typeInto(input, "palmstudio", { speed: 70 }))) return "stay";
        await c.click(go);
        c.caption("Asking the registrar…");
        const got = await c.waitFor(() => c.q('[data-tour="ops-domain-results"]'), 10000);
        c.caption(got ? "" : "The registrar didn't answer this time. On the live page the prices show up here.");
        await c.sleep(got ? 400 : 1600);
        return undefined;
      },
    },
    {
      id: "domain-results",
      chapter: "Domains",
      title: "Real prices, live.",
      body:
        "Green means a name is free, with its first-year price in USDC. A wallet sign-in is only needed at the moment you buy. To use a name you already own, add it in a site's Settings and point an A record at the address shown.",
      target: ['[data-tour="ops-domain-results"]', '[data-tour="ops-domains"]'],
    },
  ];
}

function buildOpsHub() {
  return [
    {
      id: "hub",
      chapter: "Ops Hub",
      title: "Git that belongs to an address.",
      body:
        "Repositories are filed under your wallet, so there's no username to make or lose. Yours lists the ones you own and Shared the ones others opened up. Each has a clone link, and Ops can build a repository straight from the Hub.",
      target: '[data-tour="ops-hub"]',
      enter: showOps,
    },
  ];
}

function buildOpsBridge() {
  return [
    {
      id: "bridge-projects",
      chapter: "The harness connection",
      title: "Every sidebar project is an Ops Hub repository.",
      body:
        "That's the first link. This list is read from the Hub for your wallet, and the + creates a repository there. Same address, same git, nothing to copy between tools. A wallet keeps up to three.",
      target: '[data-tour="projects-head"]',
      enter: (c) => showHarness(c, { nav: true }),
    },
    {
      id: "bridge-wallet",
      chapter: "The harness connection",
      title: "One wallet, both sides.",
      body:
        "Hamrin's credits and your Hub repositories follow the same address. Sign in once here and the harness and Ops both know who you are, without an account behind either.",
      target: '[data-tour="wallet"]',
      enter: (c) => showHarness(c, { nav: true }),
    },
    {
      id: "bridge-agent",
      chapter: "The harness connection",
      title: "The agent works inside that repository.",
      body:
        "In Agent mode Hamrin doesn't only talk. It writes files and runs git commands in your Hub repository through the same Ops API you just toured. Each prompt that changes files lands as a commit.",
      target: '[data-tour="composer"]',
      place: "top",
      enter: async (c) => {
        await showHarness(c);
        c.controls.setMode("agent");
      },
    },
    {
      id: "bridge-files",
      chapter: "The harness connection",
      title: "Files and Git read from the Hub.",
      body:
        "The inspector is a window onto that repository: its files on one tab and its commit history on the other. What you see here is exactly what Ops builds and serves.",
      target: '[data-tour="inspector"]',
      enter: (c) => showHarness(c, { files: true }),
    },
    {
      id: "ship",
      chapter: "The harness connection",
      title: "Game three: ship it.",
      body:
        "Prompt, commit, build, live. This one is a simulation, so nothing gets published, but every line is a real step in the real thing. Press Ship it.",
      target: null,
      widget: "ship",
      enter: async (c) => {
        c.controls.setFilesOpen(false);
        c.controls.setNavOpen(false);
      },
    },
    {
      id: "your-turn",
      chapter: "Your turn",
      title: "That's the loop.",
      body:
        "Build in a repository here. Open Ops, publish that repository with a build pack, and add a domain whenever you want one. Wallet in, site out, nobody asked who you are.",
      target: null,
      cta: "Finish",
    },
  ];
}

export const EPISODES = {
  "ops-1": {
    id: "ops-1",
    number: 1,
    title: "Introduction to Ops",
    label: "Episode 1 - Introduction to Ops",
    minutes: 5,
    meta: {
      word: "Ops",
      kicker: "Episode 1 · Introduction to Ops",
      lines: ["Hosting, domains, and git, on one wallet.", "And how it all plugs into this harness."],
      begin: "Start Episode 1",
      outroKicker: "Episode 1 complete",
      outroBig: "Ops, explained.",
      outroLine: (stars, total) =>
        `You've seen hosting, domains, and the Hub, and how the harness commits straight into them. ${stars} of ${total} stars. Nobody asked who you are.`,
    },
    chapters: [
      "The big idea",
      "The console",
      "Hosting",
      "Domains",
      "Ops Hub",
      "The harness connection",
    ],
    build: () => [
      ...buildOpsIntro(),
      ...buildOpsConsole(),
      ...buildOpsHosting(),
      ...buildOpsDomains(),
      ...buildOpsHub(),
      ...buildOpsBridge(),
    ],
  },
};

export function findEpisode(id) {
  return EPISODES[id] || null;
}
