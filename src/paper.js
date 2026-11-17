export const PAPER_NO = "PALM · 01";
export const PAPER_TITLE = "The key is the account";
export const PAPER_KICKER = "/root and Ops";
export const PAPER_DATE = "17 November 2026";
export const PAPER_READ = "12 min";

export const PAPER_ABSTRACT =
  "Coding agents glued four things together: a model, an email, a card, and GitHub. /root and Ops cut the glue. The account is an Ethereum address. The harness talks to a model and writes files. Ops is git, a running box, and a name. Local if you install Windows /root. Hosted if you open a browser. Hamrin is paid in PALM you hold. Hosting is a separate bill. Nothing here is invisible.";

export const PAPER_CLAIM =
  "You do not rent a seat. You sign a key. The files, the site, and the meter follow that key.";

export const PAPER = [
  {
    id: "claim",
    n: "01",
    title: "The claim",
    body: [
      "A commercial coding agent sells a seat. The seat is an email, a payment method, a GitHub login, and a model behind someone else’s wall. You cannot keep the files without the host. You cannot keep the host without the card. You cannot talk to the model without the email.",
      "/root and Ops unbundle that. The account is a key you already have. The harness is software that calls a model and runs tools. Ops is where those files become a repository, a container, and a domain. GitHub is optional. Email is not used.",
      "That is the philosophy. Not privacy theater. Not a pitch. A split: identity is cryptographic, generation is metered, hosting is billed, git is keyed to the same address.",
    ],
  },
  {
    id: "split",
    n: "02",
    title: "Two products",
    body: [
      "/root is the harness. You type a goal. A model may list, read, write, edit, delete, run a command, or commit. The harness executes those calls against the open repo. A write is a commit. The model may only claim a file changed if the tool result says it did.",
      "Ops is the plant. Hub is git for that wallet. A site is a container Ops builds from Hub. A domain is a name Ops can buy and point. You do not log into Coolify, a registrar panel, or GitHub to ship from chat.useroot.sh.",
    ],
    figure: "stack",
    table: {
      caption: "Who does what",
      cols: ["Layer", "Job", "Where"],
      rows: [
        ["/root Windows", "Local harness. Tools on the PC.", "Your machine"],
        ["/root web", "Hosted harness. Same tools, Hub-backed.", "chat.useroot.sh"],
        ["Hamrin 1.0", "The hosted model.", "Leaves the browser"],
        ["Ops Hub", "Git keyed to the wallet.", "ops.palmaierc.com"],
        ["Ops host", "Build and run the container.", "Ops"],
        ["Domain", "Name Ops holds. Wallet aims it.", "Public DNS"],
      ],
    },
  },
  {
    id: "identity",
    n: "03",
    title: "The address",
    body: [
      "Connect a wallet. Sign one message. That signature is the session. It is not a transaction. It spends no gas.",
      "Chats, credits, Hub repos, sites, and domain control follow the address. There is no username to pick. There is no password. There is no recovery email. Lose the key, lose the account.",
      "“No account” means no email account. The address is public on-chain. Ops sees the session. A public page at chat.useroot.sh/id/<address> shows hold, stake, window, and activity. The owner can open an authenticator at /id/<address>/authenticator after signing in.",
    ],
    quote: "The chain sees the address. Ops sees the session. Private is not invisible.",
  },
  {
    id: "local",
    n: "04",
    title: "Local /root",
    body: [
      "The Windows app is a local harness. Chat and tools run on the PC. Generation can go to Ollama at http://localhost:11434. Local weights do not need a third-party API key.",
      "That is the closed path: UI, tools, and model on machines you run. Optional cloud models reintroduce a host, a bill, and an IP. Use them if you need them. Do not pretend they are local.",
    ],
  },
  {
    id: "web",
    n: "05",
    title: "Hosted /root",
    body: [
      "chat.useroot.sh is not a mock of the desktop app. It creates Hub repos, commits files, and publishes to Ops. The hosted model is Hamrin 1.0. Prompts leave the browser. This is not local inference.",
      "A wallet keeps ten cloud chats. Older ones are dropped. Context is 8,192 tokens. The web harness needs the wallet online to sign.",
    ],
    table: {
      caption: "Local vs hosted",
      cols: ["", "Windows", "Web"],
      rows: [
        ["Harness", "On the PC", "In the browser"],
        ["Model", "Ollama, optional cloud", "Hamrin 1.0"],
        ["Git", "Local folder or remote", "Ops Hub"],
        ["Meter", "Electricity, or a cloud bill", "PALM credits"],
        ["Prompt path", "localhost, unless you pick cloud", "Leaves the tab"],
      ],
    },
  },
  {
    id: "modes",
    n: "06",
    title: "Modes",
    body: [
      "Agent may write, run, and commit. Ask only reads and answers. Plan writes steps and does not implement them. Auto-Prompt rewrites a loose ask into a short brief before the model acts. Web, when on, lets Hamrin search and fetch pages.",
      "Pick the mode that matches the damage you are willing to allow. Do not run Agent on a repo you cannot revert. Every write is a commit. That is the undo.",
    ],
    modes: [
      { name: "Agent", color: "#6fbf8a", line: "Write, run, commit." },
      { name: "Ask", color: "#efe8dc", line: "Read. Answer. No edits." },
      { name: "Plan", color: "#c4a574", line: "Steps. No implementation." },
    ],
  },
  {
    id: "loop",
    n: "07",
    title: "A turn",
    body: [
      "You type a goal. The model may emit tool calls. The harness runs them against the open Hub repo and returns the results. The loop continues until the model stops or the step cap is hit.",
      "The point of the harness is that last sentence. A model without tools is a chat window. A model with tools that cannot commit is a demo. /root commits.",
    ],
    figure: "loop",
  },
  {
    id: "credits",
    n: "08",
    title: "The meter",
    body: [
      "Hamrin is metered in credits, not a card on file for each token. 1,000 $PALM held or staked equals 1 credit for a 14-day window. A new wallet gets 0.5 welcome credits once. Achievements can pay extras. Welcome and extras do not reset with the window.",
      "When the window and the extras are empty, Hamrin stops. Hold more PALM, wait for the window, or spend extras. Hosting is not this meter. Ops bills the box separately.",
    ],
    figure: "credit",
    quote: "1,000 $PALM held or staked = 1 credit / 14 days.",
  },
  {
    id: "hub",
    n: "09",
    title: "Hub",
    body: [
      "Hub is git keyed to the wallet. Most wallets may keep three repositories. You can create, clone, commit, and delete from the web harness. There is no Hub username.",
      "GitHub can still be a remote if you want it. It is not required to ship. Hub is smaller than GitHub. That is the trade: wallet-owned, capped, enough to publish.",
    ],
  },
  {
    id: "ship",
    n: "10",
    title: "Ship",
    body: [
      "Ship is three steps: a compiling scaffold, a Hub repo, a live URL. The default scaffold is Vite and React, with a Dockerfile that serves port 3000. Publish posts to Ops with source “hub”. Ops builds from that repo.",
      "The tour clicks the same buttons you click. It is not a recording of a product that lives somewhere else.",
    ],
    figure: "ship",
  },
  {
    id: "hosting",
    n: "11",
    title: "The box and the name",
    body: [
      "Ops runs the container. A deploy key is read-only: Ops can fetch code and cannot push. Current monthly plans: Plot $8, Grove $24, Canopy $60.",
      "Ops can buy and hold a name. The wallet controls which site the name points at. The registrant on the public record is Ops, not you. That hides a legal name. It does not hide the wallet that signed in.",
    ],
    table: {
      caption: "Hosting, November 2026",
      cols: ["Plan", "Month", "For"],
      rows: [
        ["Plot", "$8", "A small site"],
        ["Grove", "$24", "More CPU and disk"],
        ["Canopy", "$60", "Heavier apps"],
      ],
    },
  },
  {
    id: "miles",
    n: "12",
    title: "Miles",
    body: [
      "Miles is the optional companion in the web harness. He reads the open chat and the repo text. He has no camera. He keeps a short memory of what you said and where you were. It expires.",
      "He can click the UI and type a Hamrin prompt when you ask him to. He spends the same credits. He is not a second account.",
    ],
  },
  {
    id: "not",
    n: "13",
    title: "What this is not",
    body: [
      "Not local-only on the web. Hamrin runs on a host. Not a promise that a third party cannot log a prompt. Not GitHub. Not a lawyer, a bank, or a company. Not free hosting. Ops has a bill. Not a recovery process for a lost key.",
      "The product is the unbundling. The honesty is the remainder: a host still exists, a chain still records the address, a registrar still lists Ops. Use the Windows path if those remainders are the problem. Use the web path if you want to ship from a tab.",
    ],
    nots: [
      "Local inference in the browser",
      "Invisible",
      "A GitHub replacement at GitHub scale",
      "A legal person",
      "Free compute forever",
      "A way back in without the key",
    ],
  },
  {
    id: "use",
    n: "14",
    title: "Use",
    body: [
      "Open chat.useroot.sh. Connect the wallet. Sign the session. Ship an app, open a Hub repo, or type a prompt.",
      "Install Windows /root if you want generation on the PC. Ops is ops.palmaierc.com for hosting, domains, Hub, and plans. Numbers in this paper are the rules as shipped on 17 November 2026. They can change. This is not legal advice.",
    ],
  },
];
