export const PAPER_TITLE = "/root and Ops";
export const PAPER_DATE = "2026-11-17";

export const PAPER = [
  {
    id: "scope",
    title: "Scope",
    points: [
      "This paper states how /root and Ops work.",
      "It is not a pitch.",
      "It is not legal advice.",
      "Numbers below are product rules as shipped on 17 Nov 2026. They can change.",
    ],
  },
  {
    id: "split",
    title: "Two products, one key",
    points: [
      "/root is where you talk to a model and change files.",
      "Ops is where those files become a git repo, a running site, and a domain.",
      "Both treat an Ethereum address as the account.",
      "There is no email sign-up, no password, no username.",
    ],
  },
  {
    id: "identity",
    title: "Identity",
    points: [
      "Connect a wallet. Sign one message. That signature is the session.",
      "The message is not a transaction. It spends no gas.",
      "Chats, credits, Hub repos, sites, and domain control follow that address.",
      "If you lose the key, there is no recovery email.",
      "The address is public on-chain. “No account” means no email account, not no identity.",
    ],
  },
  {
    id: "windows",
    title: "/root on Windows",
    points: [
      "The desktop app is a local harness.",
      "Chat and tools run on the PC.",
      "Generation can go to local Ollama at http://localhost:11434.",
      "Local models do not need a third-party API key.",
      "Optional cloud models reintroduce a host, a bill, and an IP.",
    ],
  },
  {
    id: "web",
    title: "/root on the web",
    points: [
      "chat.useroot.sh is the web harness.",
      "It is not a mock of the desktop app. It ships real Hub commits and real Ops deploys.",
      "The hosted model is Hamrin 1.0.",
      "Prompts leave the browser. They are not local inference.",
      "A wallet keeps 10 cloud chats. Older ones are dropped.",
      "The context window is 8,192 tokens.",
    ],
  },
  {
    id: "modes",
    title: "Modes",
    points: [
      "Agent may write files, run commands, and commit.",
      "Ask only reads and answers.",
      "Plan writes steps and does not implement them.",
      "Auto-Prompt rewrites a loose ask into a short brief before the model acts.",
      "Web, when on, lets Hamrin search and fetch pages.",
    ],
  },
  {
    id: "credits",
    title: "Hamrin credits",
    points: [
      "Hamrin is metered in credits, not a card on file for each token.",
      "1,000 $PALM held or staked = 1 credit for a 14-day window.",
      "A new wallet gets 0.5 welcome credits once. They do not reset.",
      "Achievements can pay extra credits. Those do not reset.",
      "When the window and the extras are empty, Hamrin stops until the window resets or more PALM is held.",
    ],
  },
  {
    id: "loop",
    title: "What a turn does",
    points: [
      "You type a goal.",
      "The model may emit tool calls: list, read, write, edit, delete, create repo, run a command, git.",
      "The harness runs those tools against the open Hub repo.",
      "A write or edit is a commit.",
      "The model only gets to claim a file changed if the tool result says it did.",
    ],
  },
  {
    id: "hub",
    title: "Ops Hub",
    points: [
      "Hub is git keyed to the wallet.",
      "Most wallets may keep 3 repositories.",
      "You can create, clone, commit, and delete from chat.useroot.sh.",
      "GitHub is optional. It is not required to ship.",
      "There is no Hub username to pick.",
    ],
  },
  {
    id: "ship",
    title: "Ship",
    points: [
      "Ship is three steps: a compiling scaffold, a Hub repo, a live URL.",
      "The default scaffold is Vite + React, with a Dockerfile that serves port 3000.",
      "Publish posts to Ops with source “hub”. Ops builds from that repo.",
      "You do not log into GitHub, Coolify, or a host dashboard to do this.",
      "The flow is the real product, not a demo recording.",
    ],
  },
  {
    id: "hosting",
    title: "Hosting",
    points: [
      "Ops runs the container.",
      "Hosting is billed on Ops, not in Hamrin credits.",
      "Current monthly plans: Plot $8, Grove $24, Canopy $60.",
      "A deploy key is read-only. Ops can fetch code. It cannot push.",
    ],
  },
  {
    id: "domains",
    title: "Domains",
    points: [
      "Ops can buy and hold a name.",
      "The wallet controls which site the name points at.",
      "The registrant on the public record is Ops, not you.",
      "That hides a legal name. It does not hide the wallet that signed in.",
    ],
  },
  {
    id: "id",
    title: "Public ID",
    points: [
      "chat.useroot.sh/id/<address> is a public PALM ID page.",
      "It shows hold, stake, window, and public activity for that address.",
      "The owner can open an authenticator at /id/<address>/authenticator after signing in.",
    ],
  },
  {
    id: "miles",
    title: "Miles",
    points: [
      "Miles is the optional companion in the web harness.",
      "He reads the open chat and the repo text. He has no camera.",
      "He keeps a short memory of what you said and where you were. It expires.",
      "He can click the UI and type a Hamrin prompt when you ask him to.",
      "He spends the same credits. He is not a second account.",
    ],
  },
  {
    id: "limits",
    title: "Hard limits",
    points: [
      "10 cloud chats per wallet.",
      "3 Hub repos per wallet, unless a wallet is uncapped by Ops.",
      "8,192 tokens of context.",
      "Credits run out.",
      "The web harness needs the wallet online to sign.",
    ],
  },
  {
    id: "honest",
    title: "What this is not",
    points: [
      "Not local-only on the web. Hamrin runs on a host.",
      "Not invisible. The chain sees the address. Ops sees the session.",
      "Not a substitute for a lawyer, a bank, or a company.",
      "Not GitHub. Hub is smaller and wallet-owned.",
      "Not free hosting forever. Ops has a bill.",
      "Not a promise that a third party cannot log a prompt.",
    ],
  },
  {
    id: "use",
    title: "How to use it",
    points: [
      "Open chat.useroot.sh.",
      "Connect the wallet. Sign the session.",
      "Ship an app, or open a Hub repo, or type a prompt.",
      "Windows /root is the local path if you want generation on the PC.",
      "Ops is ops.palmaierc.com for hosting, domains, Hub, and plans.",
    ],
  },
];
