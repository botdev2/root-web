export const PAPER_SERIES = "Working paper";
export const PAPER_TITLE = "Remaining private with /root and Ops";
export const PAPER_AUTHOR = "PALM";
export const PAPER_DATE = "17 November 2026";
export const PAPER_KEYWORDS =
  "linkability; local inference; wallet identity; Ollama; $PALM; Ops Hub";

export const PAPER_ABSTRACT =
  "Commercial coding agents bind a legal person to each session. The seat is an email address, a payment instrument, a GitHub username, and a remote model that stores prompts. This note argues that /root and Ops are built to keep those bindings from coinciding, and to keep prompt content on the operator's machine when that is the requirement. Privacy, as used here, is a reduction in linkability between a legal identity and a body of work. It is not invisibility. The Windows harness can send generation to local Ollama, in which case prompts need not leave the host. Both the Windows and web harnesses authenticate by a signed Ethereum message rather than by email. Hamrin, the hosted model on chat.useroot.sh, is paid in held or staked $PALM rather than a card on file. Ops Hub is git addressed by wallet, so a GitHub username is optional. Ops may hold a domain as registrant, which removes a legal name from the public record while leaving the signing wallet in control. The web path still exposes prompts to a host and sessions to Ops. The local path does not. The operator chooses between them.";

export const PAPER = [
  {
    id: "introduction",
    num: "1",
    title: "Introduction",
    body: [
      "A coding session produces three kinds of record. The first is the content of the work: prompts, files, and commits. The second is the identity used to obtain a model, a repository, and a bill. The third is the network metadata of the session: address, time, and browser. Ordinary hosted agents collapse the first two into a single seat. The operator cannot reach the model without an email account, cannot keep the files without that account's host, and cannot pay without a cardholder file. The third record, the network, is collected as a matter of course.",
      "The design of /root and Ops starts from the opposite preference. Work should be possible without presenting a legal name to the product. Prompt text should remain on the machine unless the operator selects a hosted model. Payment for generation should not require a bank identity. Source control should not require a public username. These are engineering choices about which databases are allowed to contain the operator. They are not a claim that a determined observer cannot correlate a wallet, an IP address, and a published site.",
      "What follows is a description of that preference as implemented on 17 November 2026, at chat.useroot.sh, in the Windows application, and at ops.palmaierc.com. Quantities can change. The note is not legal advice.",
    ],
  },
  {
    id: "linkability",
    num: "2",
    title: "Privacy as linkability",
    body: [
      "It is useful to separate three questions that are often mixed. Does the prompt leave the machine. Must a legal name, email, or payment instrument be supplied in order to work. What does the network still show. /root is built to answer the first two. The third is an operating procedure (VPN, dedicated browser profile, a wallet that is not the operator's public treasury) and is not guaranteed by the software.",
      "The reason for the separation is practical. A product that promises invisibility is either lying or unused. A product that refuses an email account, a card, and a GitHub login still has a public chain address and, on the web path, a host that sees prompts. The honest object is therefore narrower: to stop the default commercial stack from assembling a dossier in which the same legal person, the same payment instrument, the same username, and the full text of the work sit in one vendor's database.",
    ],
    parts: [
      {
        id: "name",
        num: "2.1",
        title: "A legal name is not an input",
        body: [
          "Email is a durable identifier. It is recovered by phone, listed in breaches, and required by GitHub, model vendors, and card processors. Once it is the account, every later artifact is attachable to it. /root and Ops take an Ethereum address instead. The operator signs one message. The signature is the session. It is not a transaction and spends no gas. Chats, credits, Hub repositories, sites, and domain aim then follow that address. There is no product username and no password. If the key is lost, the account is lost. That is the cost of refusing a recovery email: the product cannot telephone the operator back into existence.",
        ],
      },
      {
        id: "prompts",
        num: "2.2",
        title: "Prompt text defaults to the machine",
        body: [
          "A remote model is a copy of the work in someone else's memory. For private drafting, that copy is the failure. The Windows harness talks to Ollama at http://localhost:11434. Local weights need no vendor API key. Interface, tools, and generation then occupy machines the operator runs. Optional cloud tags on Ollama exist; they reintroduce a host, a bill, and an IP, and they should be treated as a different configuration. The web harness at chat.useroot.sh uses Hamrin 1.0. On that path, prompts leave the browser. The philosophy is not that every /root session is local. It is that local is the default for private work, and that the hosted path is labelled as hosted.",
        ],
      },
      {
        id: "pay",
        num: "2.3",
        title: "Generation is not billed to a cardholder",
        body: [
          "A card on file links every token to a bank identity. Hamrin is metered in credits derived from $PALM that is held or staked. One thousand PALM yields one credit for a fourteen-day window. A new wallet receives 0.5 credits once. Achievements may add extras; those extras do not reset with the window. When the window and the extras are empty, Hamrin stops. Hosting is a separate Ops invoice. The point of the split is that inference can be paid without handing a processor the operator's name, and that a hosting bill cannot be confused with a token meter.",
        ],
      },
      {
        id: "git",
        num: "2.4",
        title: "Source history need not carry a username",
        body: [
          "GitHub's unit of identity is a public profile. Commits, issues, and stars accumulate against it. Hub is git addressed by wallet. Most wallets may keep three repositories. They can be created, cloned, committed, and deleted from the web harness. GitHub may still be attached as a remote if the operator wants that audience. It is not required in order to publish. The history then lives on an address rather than on a handle. The address is still public. What has been avoided is the second, named, social identity that GitHub requires as the price of a repo.",
        ],
      },
      {
        id: "whois",
        num: "2.5",
        title: "A site may be published without a personal registrant",
        body: [
          "WHOIS is a legal-name surface. Ops may buy and hold a domain, and the wallet selects the site the name points to. The registrant on the public record is Ops. That hides a person from the registrar. It does not hide the wallet that signed the session, and it does not hide the fact of the site. Privacy here is the difference between a passport on a domain record and a key that aims a name. An operator who needs the former to remain blank can use Ops. An operator who needs the latter to remain unknown cannot; the chain will show the address.",
        ],
      },
      {
        id: "network",
        num: "2.6",
        title: "The network is still a record",
        body: [
          "Nothing in /root or Ops conceals an IP address from a host the operator has chosen to call. Local Ollama, with the interface down, keeps prompt content off the network; the ISP may still see that a machine is on. The web harness, Hamrin, Ops, and any cloud Ollama tag see whatever the path exposes. A VPN, a dedicated browser profile, and a wallet reserved for this work are the ordinary responses. They are the operator's. The product does not perform them, and this note does not pretend that it does.",
        ],
      },
    ],
  },
  {
    id: "harness",
    num: "3",
    title: "The harness",
    body: [
      "/root is the operator-facing loop. The operator states a goal. The model may request tools: list, read, write, edit, delete, create a repository, run a command, git. The harness executes those calls against the open repository and returns the results. A write is a commit. The model may report a file change only when the tool result says the change occurred. The loop ends when the model stops or a step cap is reached.",
      "Three modes bound the damage the loop is allowed to do. Agent may write, run commands, and commit. Ask reads and answers. Plan produces steps and does not implement them. Auto-Prompt, if enabled, rewrites a loose request into a short brief before the model acts. A Web switch, if enabled, lets Hamrin search and fetch pages. Agent is the wrong mode on a repository that cannot be reverted. Because writes are commits, the history is the undo.",
      "Miles is an optional companion on the web path. It is given the open conversation and repository text, not a camera. It keeps a short, expiring memory of recent speech and location, and it may click the interface or submit a Hamrin prompt when asked. It spends the same credits. It is another client of the same account, not a second identity.",
    ],
    figure: "loop",
  },
  {
    id: "paths",
    num: "4",
    title: "Two configurations",
    body: [
      "Private work and published work are not the same configuration. On Windows, chat and tools run on the PC. Generation may stay on localhost. That is the configuration for drafts that should not be copied to a model host. On the web, the same style of harness creates Hub repositories, commits, and Ops deploys, and it calls Hamrin. That is the configuration for publishing from a browser. A wallet may keep ten cloud conversations; older ones are dropped. Context is 8,192 tokens. The wallet must be present to sign.",
      "Figure 1 is the common spine. A signed message admits the address to either harness. Hub is the git. Ops builds a container from Hub and, if asked, aims a name. The fork is only at inference: Ollama on the machine, or Hamrin in the browser.",
    ],
    figure: "stack",
    table: {
      caption: "Table 1. The two configurations.",
      cols: ["", "Windows", "Web"],
      rows: [
        ["Harness", "On the PC", "In the browser"],
        ["Model", "Ollama; cloud tags optional", "Hamrin 1.0"],
        ["Prompt content", "Local, unless a cloud tag is chosen", "Leaves the tab"],
        ["Git", "Local folder or remote", "Ops Hub"],
        ["Meter", "Electricity, or a cloud bill", "PALM credits"],
      ],
    },
  },
  {
    id: "ops",
    num: "5",
    title: "Publication",
    body: [
      "Ship is the publication sequence: a compiling scaffold, a Hub repository, a live URL. The default scaffold is Vite and React, with a Dockerfile that serves port 3000. Ops builds when publish is posted with source “hub”. The in-product tour presses the same controls as a manual publish. The deploy key is read-only, so Ops can fetch and cannot push.",
      "Hosting is billed on Ops, on a monthly plan. Plot is $8, Grove is $24, Canopy is $60. These figures are the prices on the date of this note. They are independent of Hamrin credits, which is the point of section 2.3: a box on the public internet is a different exposure from a prompt, and it is paid as such.",
    ],
    table: {
      caption: "Table 2. Ops hosting, November 2026.",
      cols: ["Plan", "Monthly price"],
      rows: [
        ["Plot", "$8"],
        ["Grove", "$24"],
        ["Canopy", "$60"],
      ],
    },
  },
  {
    id: "observable",
    num: "6",
    title: "What remains observable",
    body: [
      "The address is public. Anyone can read holdings, stake, and the public PALM page at chat.useroot.sh/id/<address>. After signing in, the owner can open an authenticator at /id/<address>/authenticator. Privacy of the person is not privacy of the key. An operator who reuses a treasury wallet for this work has already linked the work to whatever else that wallet has done.",
      "On the web path, Ops sees the session and Hamrin sees the prompt. Treating that path as equivalent to local Ollama is a mistake. The correct use of the web path is publication and convenience. The correct use of the Windows path, with local weights and, where needed, the network down, is drafting that should not be copied.",
      "A domain held by Ops still exists in DNS. The site is reachable. Logs on the box are Ops's. The gain is the missing legal name on the registrar record, not the missing site.",
    ],
    table: {
      caption: "Table 3. Web-path limits, November 2026.",
      cols: ["Constraint", "Rule"],
      rows: [
        ["Cloud conversations", "10 per wallet; older dropped"],
        ["Hub repositories", "3 per wallet, unless Ops removes the cap"],
        ["Context", "8,192 tokens"],
        ["Hamrin credits", "floor((held + staked) / 1,000) per 14 days, plus 0.5 welcome once, plus extras"],
        ["Signing", "Wallet must be present"],
      ],
    },
  },
  {
    id: "procedure",
    num: "7",
    title: "Procedure",
    body: [
      "For private drafting, install Windows /root, install Ollama, set the endpoint to http://localhost:11434, and work against local weights. Do not enable cloud tags for that session. If the machine must be online, the remaining exposure is network metadata, which is outside the product.",
      "For publication, open chat.useroot.sh, connect a wallet that is not the operator's public treasury, and sign the session. Create or open a Hub repository, or use Ship. Administer hosting, domains, and plans at ops.palmaierc.com.",
      "The distinction is the argument. Local Ollama is for work that should not be copied. The web harness is for work that must be published. Expecting Hamrin to be private because the account is a wallet is a category error.",
    ],
  },
];
