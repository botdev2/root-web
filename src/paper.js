export const PAPER_SERIES = "Working paper";
export const PAPER_TITLE = "Identity, inference, and publication in /root and Ops";
export const PAPER_AUTHOR = "PALM";
export const PAPER_DATE = "17 November 2026";
export const PAPER_KEYWORDS = "local inference; agent harness; wallet identity; $PALM; Ops Hub";

export const PAPER_ABSTRACT =
  "This note describes /root and Ops as shipped on 17 November 2026. A typical commercial coding agent couples four services in a single seat: remote inference, an email account, card billing, and a GitHub identity. /root and Ops keep those functions distinct. The account is an Ethereum address, authenticated by a signed message that is not a transaction. /root is a harness: it submits a goal to a model, executes the model's tool calls, and records writes as git commits. On Windows the harness may call a local Ollama endpoint. On the web it calls Hamrin 1.0, whose prompts leave the browser. Ops supplies git (Hub), container hosting, and optional domain registration, all keyed to the same address. Hamrin is metered in credits derived from held or staked $PALM. Hosting is billed on Ops and is not part of that meter. The note states product rules. It is not legal advice. Quantities may change.";

export const PAPER = [
  {
    id: "introduction",
    num: "1",
    title: "Introduction",
    body: [
      "The object of study is the pair of products published as /root and Ops. /root is the operator-facing harness. Ops is the publication layer: a git service (Hub), a container host, and a registrar path. Both treat an Ethereum address as the sole account. There is no email sign-up, password, or product username.",
      "The design is a response to a coupling that is now standard in hosted coding agents. Inference, identity, payment, and source control are sold together. The operator cannot retain files without the host, cannot retain the host without a card, and cannot reach the model without an email. /root and Ops attempt to separate those layers so that a lost vendor relationship does not, by construction, take the account, the repository, and the meter with it. Separation is incomplete. The web path still uses a hosted model. Ops still sees the session. The chain still records the address. Section 9 returns to these remainders.",
      "The description below is of the public web harness at chat.useroot.sh, the Windows application, and Ops at ops.palmaierc.com, as configured on the date of this note.",
    ],
  },
  {
    id: "boundary",
    num: "2",
    title: "System boundary",
    body: [
      "A session begins when a wallet signs a message. The signature is the session token. It spends no gas. Subsequent chats, credits, Hub repositories, sites, and domain aim follow that address.",
      "/root accepts a goal in natural language. The selected model may emit tool calls: list, read, write, edit, delete, create a repository, run a command, or invoke git. The harness executes those calls against the open repository and returns the results. A write or edit is committed. The model is permitted to report a file change only when the tool result confirms it. The loop continues until the model stops or a step cap is reached.",
      "Ops is not a harness. Hub stores git for the wallet. A site is a container built from a Hub repository. A domain is a name Ops may purchase and that the wallet may point at a site. Publication from chat.useroot.sh does not require a GitHub login, a Coolify dashboard, or a registrar panel.",
    ],
    figure: "stack",
    table: {
      caption: "Table 1. Functions and their locations.",
      cols: ["Component", "Function", "Location"],
      rows: [
        ["/root (Windows)", "Harness; tools execute on the PC", "Local machine"],
        ["/root (web)", "Harness; tools execute against Hub", "chat.useroot.sh"],
        ["Hamrin 1.0", "Hosted model", "Leaves the browser"],
        ["Ollama", "Optional local model", "http://localhost:11434"],
        ["Ops Hub", "Git keyed to the wallet", "ops.palmaierc.com"],
        ["Ops host", "Build and run a container", "Ops"],
        ["Domain", "Name held by Ops; aimed by the wallet", "Public DNS"],
      ],
    },
  },
  {
    id: "identity",
    num: "3",
    title: "Identity",
    body: [
      "The account is the address. There is no second identifier. Loss of the private key is loss of the account; Ops does not offer email recovery. The marketing phrase “no account” refers to the absence of an email account, not to the absence of identity. The address is public on-chain, and Ops retains the session.",
      "A public page at chat.useroot.sh/id/<address> reports hold, stake, credit window, and public activity for that address. After signing in, the owner may open an authenticator at /id/<address>/authenticator.",
    ],
  },
  {
    id: "harnesses",
    num: "4",
    title: "Local and hosted harnesses",
    body: [
      "The Windows application runs chat and tools on the PC. Generation may be sent to Ollama at http://localhost:11434. Local weights do not require a third-party API key. That path is closed with respect to inference: the interface, the tools, and the model occupy machines the operator runs. Optional cloud tags on Ollama reintroduce a host, a bill, and an IP address. They should not be described as local.",
      "The web application at chat.useroot.sh is not a demonstration of the desktop product. It creates Hub repositories, commits files, and publishes to Ops. Its model is Hamrin 1.0. Prompts leave the browser. A wallet may keep ten cloud conversations; older conversations are dropped. The context window is 8,192 tokens. The web harness requires the wallet to be available for signing.",
    ],
    table: {
      caption: "Table 2. Local and hosted configurations.",
      cols: ["", "Windows", "Web"],
      rows: [
        ["Harness", "On the PC", "In the browser"],
        ["Default model", "Ollama (optional cloud)", "Hamrin 1.0"],
        ["Source control", "Local folder or remote", "Ops Hub"],
        ["Inference meter", "Electricity, or a cloud bill", "PALM credits"],
        ["Prompt path", "localhost, unless cloud is selected", "Leaves the tab"],
      ],
    },
  },
  {
    id: "loop",
    num: "5",
    title: "Control loop and modes",
    body: [
      "The unit of work is a turn. The operator states a goal. The model may request tools. The harness runs them against the open Hub repository and returns the output. Without tools the product is a chat window. With tools that cannot commit, it is a demonstration. /root commits.",
      "Three modes constrain what the harness will do. Agent may write, run commands, and commit. Ask reads and answers and does not edit. Plan produces steps and does not implement them. Auto-Prompt, when enabled, rewrites a loose request into a short brief before the model acts. A separate Web switch, when enabled, lets Hamrin search and fetch pages.",
      "Mode choice is a damage bound. Agent should not be used on a repository the operator cannot revert. Because every write is a commit, the history is the undo.",
    ],
    figure: "loop",
  },
  {
    id: "meter",
    num: "6",
    title: "Metering",
    body: [
      "Hamrin is metered in credits rather than a card attached to each token. Let H be $PALM held and S be $PALM staked. The 14-day window grant is floor((H + S) / 1,000). A new wallet receives 0.5 welcome credits once. Achievements may add extras. Welcome credit and extras do not reset with the window.",
      "When the window grant and the extras are exhausted, Hamrin stops until the window renews, more PALM is held or staked, or extras remain. Container hosting is not this meter. Ops bills it separately (section 7).",
    ],
  },
  {
    id: "publication",
    num: "7",
    title: "Repository, publication, and naming",
    body: [
      "Hub is git addressed by wallet. Most wallets may keep three repositories. Creation, clone, commit, and deletion are available from the web harness. There is no Hub username. GitHub may be used as an additional remote. It is not required to publish. Hub is smaller than GitHub; the trade is wallet ownership and a cap.",
      "Publication (“Ship”) has three steps: a compiling scaffold, a Hub repository, and a live URL. The default scaffold is Vite and React, with a Dockerfile that serves port 3000. Ops builds from the Hub repository when publish is posted with source “hub”. The in-product tour operates the same controls as a manual publish.",
      "Ops runs the container. The deploy key is read-only: Ops may fetch and may not push. Monthly hosting, as of this date, is Plot at $8, Grove at $24, and Canopy at $60. Ops may buy and hold a domain. The wallet selects the site the name points to. The registrant on the public record is Ops, not the operator. That arrangement conceals a legal name. It does not conceal the wallet that signed the session.",
    ],
    table: {
      caption: "Table 3. Ops hosting prices, November 2026.",
      cols: ["Plan", "Monthly price"],
      rows: [
        ["Plot", "$8"],
        ["Grove", "$24"],
        ["Canopy", "$60"],
      ],
    },
  },
  {
    id: "miles",
    num: "8",
    title: "Companion process",
    body: [
      "Miles is an optional companion in the web harness. It is given the open conversation and repository text. It has no camera. It retains a short memory of recent speech and location; the memory expires. On request it may click controls in the interface and submit a Hamrin prompt. It draws on the same credit balance. It is not a second account.",
    ],
  },
  {
    id: "limits",
    num: "9",
    title: "Limits and non-claims",
    body: [
      "Hard limits on the web path are ten cloud conversations per wallet, three Hub repositories per wallet unless Ops has removed the cap, 8,192 tokens of context, a finite credit window, and the requirement that the wallet be present to sign.",
      "The web harness is not local inference. Hamrin runs on a host, and the note does not claim that a third party cannot log a prompt. The system is not invisible: the chain records the address and Ops records the session. Hub is not a substitute for GitHub at GitHub's scale. Ops is not a lawyer, a bank, or a company. Hosting is not free. There is no recovery path for a discarded key.",
      "Where those remainders are unacceptable, the Windows path with local Ollama is the relevant configuration. Where the aim is to publish from a browser, the web path is the relevant configuration. The product is the separation of layers. The honesty is what remains coupled.",
    ],
  },
  {
    id: "procedure",
    num: "10",
    title: "Procedure",
    body: [
      "Open chat.useroot.sh, connect a wallet, and sign the session. From there, publish an application, open a Hub repository, or submit a prompt. Install Windows /root if generation should remain on the PC. Hosting, domains, Hub, and plans are administered at ops.palmaierc.com.",
      "Numbers in this note are the product rules as shipped on 17 November 2026. They can change. Nothing here is legal advice.",
    ],
  },
];
