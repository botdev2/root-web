import { WIDGETS } from "./widgets.jsx";
import { curvePath, px, py, POOL } from "./poolMath.js";

/**
 * Whiteboard classes. Each episode is a list of scenes, each scene a list of
 * steps. A step is one thing the teacher says plus the shapes drawn while
 * saying it. Steps can also be a hand-up question (`ask`) or a hands-on
 * widget (`widget`). Everything is drawn on a 1000 x 560 board.
 */

const T = (x, y, s, o = {}) => ({ t: "text", x, y, s, ...o });
const B = (x, y, w, h, label, o = {}) => ({ t: "box", x, y, w, h, label, ...o });
const A = (x1, y1, x2, y2, o = {}) => ({ t: "arrow", x1, y1, x2, y2, ...o });
const L = (x1, y1, x2, y2, o = {}) => ({ t: "line", x1, y1, x2, y2, ...o });
const R = (x, y, rx, ry, o = {}) => ({ t: "ring", x, y, rx, ry, ...o });
const U = (x, y, w, o = {}) => ({ t: "under", x, y, w, ...o });
const I = (n, x, y, size = 64, o = {}) => ({ t: "icon", n, x, y, size, ...o });
const K = (x, y, o = {}) => ({ t: "tick", x, y, ...o });
const X = (x, y, o = {}) => ({ t: "cross", x, y, ...o });
const N = (x, y, w, h, lines, o = {}) => ({ t: "note", x, y, w, h, lines, ...o });
const P = (d, o = {}) => ({ t: "path", d, ...o });
const D = (x, y, o = {}) => ({ t: "dot", x, y, ...o });

const mid = { anchor: "middle" };

/* ================================================================= 2 */

const ep2 = {
  id: "defi-2",
  number: 2,
  title: "Building Products in DeFi",
  label: "Episode 2 - Building Products in DeFi",
  minutes: 5,
  blurb: "Contracts, wallets and front ends, a real token stack, and a pool you can push around.",
  homework: {
    text: "Homework: ask the agent for a read-only page that shows a token's price. No signing needed.",
    cta: "Open a chat",
    view: "home",
  },
  scenes: [
    {
      title: "DeFi = finance as code",
      steps: [
        {
          say: "Welcome back, class. Today's lesson is building products in DeFi. That's short for decentralized finance: money tools that run as code on a blockchain, instead of inside a bank.",
          draw: [
            I("bank", 170, 215, 100),
            X(170, 215, { size: 120 }),
            T(170, 325, "no bank", { ...mid, color: "red", size: 36 }),
            A(280, 235, 450, 235, { color: "blue" }),
            B(470, 130, 380, 200, "code on a chain", { color: "blue" }),
            I("gear", 660, 200, 64, { color: "blue" }),
          ],
        },
        {
          say: "No branch, no office hours, no account manager. If you have a wallet and the rules allow it, you can use it at three in the morning from anywhere on earth.",
          draw: [
            I("person", 150, 450, 64),
            I("person", 250, 450, 64, { color: "green" }),
            I("person", 350, 450, 64, { color: "orange" }),
            T(250, 535, "anyone, any hour", { ...mid, size: 30 }),
            A(300, 400, 520, 345, { color: "green" }),
          ],
        },
        {
          say: "For a builder, that changes the job. You don't ask anyone for permission. You write the thing people use, and the chain does the settling.",
          draw: [N(560, 395, 380, 110, ["no permission needed.", "just ship it."], { color: "blue" })],
        },
        {
          say: "It also means mistakes are public and often permanent. So we'll build boldly, and we'll build carefully. That balance is the whole course.",
          draw: [R(660, 235, 215, 125, { color: "red", dashed: true })],
        },
      ],
    },
    {
      title: "Three moving parts",
      steps: [
        {
          say: "Every DeFi product is made of the same three parts. First, a contract: code on the chain that holds the rules and holds the money.",
          draw: [
            B(50, 150, 270, 150, "contract", { color: "blue" }),
            I("lock", 185, 205, 58, { color: "blue" }),
            T(185, 335, "holds the rules + money", { ...mid, size: 25 }),
          ],
        },
        {
          say: "Second, a wallet. That's the key that signs. Nothing moves unless the owner's wallet approves it, which is exactly why nobody needs an account.",
          draw: [
            A(322, 225, 362, 225),
            B(365, 150, 270, 150, "wallet", { color: "green" }),
            I("key", 500, 205, 58, { color: "green" }),
            T(500, 335, "signs. no signature, no move", { ...mid, size: 25 }),
          ],
        },
        {
          say: "Third, a front end. A page that shows people what the contract can do and asks their wallet to sign. Contracts get the headlines, but this is the part users actually meet.",
          draw: [
            A(637, 225, 677, 225),
            B(680, 150, 270, 150, "front end", { color: "orange" }),
            I("site", 815, 205, 58, { color: "orange" }),
            T(815, 352, "what people click", { ...mid, size: 25 }),
          ],
        },
        {
          say: "And this is your lane. The contracts you'll lean on are usually already live. Describe the page to the agent in /root, commit it to your Ops Hub repository, and publish it on Ops.",
          draw: [
            R(815, 225, 165, 88, { color: "red" }),
            T(815, 405, "your lane", { ...mid, color: "red", size: 40 }),
            I("robot", 190, 480, 66, { color: "purple" }),
            A(235, 480, 395, 480, { color: "purple" }),
            I("repo", 440, 480, 66),
            A(485, 480, 645, 480),
            I("site", 690, 480, 66, { color: "orange" }),
            T(190, 540, "agent", { ...mid, size: 24 }),
            T(440, 540, "Ops Hub", { ...mid, size: 24 }),
            T(690, 540, "Ops", { ...mid, size: 24 }),
          ],
        },
      ],
    },
    {
      title: "A real stack: $PALM",
      steps: [
        {
          say: "Here's a real one to study. $PALM is a token, and everything around it is a product that somebody decided to build.",
          draw: [B(380, 225, 240, 110, "$PALM", { color: "purple", size: 46 })],
        },
        {
          say: "A staking contract lets holders lock tokens. Markets on Uniswap and MEXC let people trade. And inside /root, every thousand $PALM you hold or stake counts as one credit.",
          draw: [
            B(50, 110, 270, 90, "staking contract", { color: "blue", size: 32 }),
            A(322, 170, 395, 235, { color: "blue" }),
            B(680, 110, 270, 90, "Uniswap + MEXC", { color: "green", size: 32 }),
            A(678, 170, 610, 235, { color: "green" }),
            B(50, 395, 270, 90, "credits in /root", { color: "orange", size: 32 }),
            A(322, 400, 395, 340, { color: "orange" }),
            T(185, 520, "1,000 held or staked = 1", { ...mid, size: 24 }),
          ],
        },
        {
          say: "And a Telegram bot reads the chain and announces each stake as it happens. Four spokes, one token, and none of them had to ask the others for permission.",
          draw: [
            B(680, 395, 270, 90, "Telegram bot", { color: "purple", size: 32 }),
            A(678, 400, 610, 340, { color: "purple" }),
            T(815, 520, "announces every stake", { ...mid, size: 24 }),
          ],
        },
        {
          ask: {
            id: "rules",
            label: "Where the rules live",
            q: "Where do the rules of a DeFi product live?",
            options: ["In a company database", "In a smart contract on the chain", "Inside the front end page"],
            answer: 1,
            say: "Hands up. Where do the rules of a DeFi product live?",
            explain: "Right. The front end only asks. The contract decides, and nobody can quietly change the answer.",
            hint: "Think about who could edit it. A page or a database can be changed by whoever runs it.",
          },
        },
      ],
    },
    {
      title: "Pools and slippage",
      steps: [
        {
          say: "Now the money. Most trading runs on pools: two piles of tokens and one rule. Multiply the piles together and the answer never changes. X times Y equals K.",
          draw: [
            L(120, 470, 120, 130),
            L(120, 470, 910, 470),
            T(40, 150, "tokens", { size: 26, rot: -90 }),
            T(790, 520, "ETH in the pool", { size: 26 }),
            T(570, 160, "x * y = k", { size: 60, color: "purple" }),
          ],
        },
        {
          say: "Buy from one pile and it gets scarcer, so its price climbs along this curve. That climb is called slippage, and it bites hardest when the pool is small.",
          draw: [P(curvePath(), { color: "purple", dur: 1800, w: 4.5 })],
        },
        {
          widget: "swap",
          say: "Your turn. Slide to buy, and push the price up by twenty percent with a single trade. Watch how fast a small pool moves.",
        },
        {
          say: "That's why serious products care about depth, the amount of money sitting in a pool. Deep pools barely flinch. Thin ones lurch, and bots love a lurch.",
          draw: [T(560, 400, "deep pool = calm", { color: "green", size: 34 }), T(560, 445, "thin pool = lurch", { color: "red", size: 34 })],
        },
      ],
    },
    {
      title: "Ship it carefully",
      steps: [
        {
          say: "Software that touches money earns a slower build. Rule one: read every transaction the page asks a wallet to sign, line by line. If you can't explain it, don't ship it.",
          draw: [T(110, 170, "1. read what you sign", { size: 42 }), I("eye", 830, 160, 80, { color: "blue" }), K(65, 170)],
        },
        {
          say: "Rule two: start with dust. Test with tiny amounts before anyone puts real value through it. A bug that costs a cent is a lesson. The same bug at scale is a headline.",
          draw: [T(110, 265, "2. start with dust", { size: 42 }), I("coin", 830, 255, 80, { color: "orange" }), K(65, 265)],
        },
        {
          say: "Rule three: keys never go in a repository. Not private, not just for testing, not ever. Git remembers everything, including the thing you deleted a minute later.",
          draw: [T(110, 360, "3. keys stay out of git", { size: 42 }), I("key", 830, 350, 80, { color: "red" }), X(830, 350, { size: 100 }), K(65, 360)],
        },
        {
          ask: {
            id: "keys",
            label: "Burn leaked keys",
            q: "A teammate pasted a private key into the repo \"just for testing\". What now?",
            options: ["Nothing, the repo is private", "Delete the file and move on", "Treat the key as burned and move funds to a new one"],
            answer: 2,
            say: "Pop quiz. A teammate pasted a private key into the repo, just for testing. What now?",
            explain: "Exactly. Once a key has been in git history, it's out. Rotate it, move the funds, and carry on.",
            hint: "Deleting the file doesn't delete the history. Anyone who cloned it still has the key.",
          },
        },
        {
          say: "Rule four: publish, then watch. Put the page on Ops, and check it after every change. Keeping it healthy is next week's class. For now, you have homework.",
          draw: [T(110, 455, "4. publish, then watch", { size: 42 }), I("site", 830, 445, 80, { color: "green" }), K(65, 455)],
        },
      ],
    },
  ],
};

/* ================================================================= 3 */

const ep3 = {
  id: "workflows-3",
  number: 3,
  title: "Workflows and Maintenance",
  label: "Episode 3 - Workflows and Maintenance",
  minutes: 5,
  blurb: "The build, ship, watch, fix loop. Commits as an undo button, scheduled helpers, and logs.",
  homework: {
    text: "Homework: open Automations and make a helper that reviews yesterday's commits.",
    cta: "Open Automations",
    view: "automations",
  },
  scenes: [
    {
      title: "A product is a promise",
      steps: [
        {
          say: "Welcome back. Last week we built something. This week we keep it alive. Shipping is day one. Maintenance is every day after, and it's where most products quietly win or die.",
          draw: [B(310, 120, 190, 80, "build", { color: "blue" }), A(505, 150, 690, 235, { color: "blue" }), B(700, 230, 190, 80, "ship", { color: "orange" })],
        },
        {
          say: "Once it's live, you watch it. Something will always drift: a dependency, a number, a name that expired. Then you fix it, and the loop turns again.",
          draw: [
            A(745, 320, 580, 425, { color: "green" }),
            B(400, 420, 190, 80, "watch", { color: "green" }),
            A(395, 450, 255, 350, { color: "red" }),
            B(110, 270, 190, 80, "fix", { color: "red" }),
            A(205, 262, 340, 170, { color: "purple" }),
          ],
        },
        {
          say: "Good workflows make that loop boring. Boring is the goal. If every step is a habit, a bad day costs you minutes instead of a weekend.",
          draw: [T(500, 320, "repeat", { ...mid, color: "red", size: 52 }), U(430, 340, 140, { color: "red" })],
        },
      ],
    },
    {
      title: "Every change is a commit",
      steps: [
        {
          say: "Here's your first safety net. In /root, every prompt that changes files lands as a commit on your Ops Hub repository. A commit is a saved snapshot with a time and a note.",
          draw: [
            L(70, 300, 930, 300, { w: 4 }),
            D(180, 300, { color: "blue" }),
            T(180, 345, "c1", { ...mid, size: 32 }),
            D(360, 300, { color: "blue" }),
            T(360, 345, "c2", { ...mid, size: 32 }),
          ],
        },
        {
          say: "Now imagine commit three goes wrong. The page is blank, and a customer is waiting. This is the moment that separates calm people from stressed ones.",
          draw: [D(540, 300, { color: "red", r: 12 }), T(540, 345, "c3", { ...mid, size: 32, color: "red" }), I("bug", 540, 230, 64, { color: "red" }), T(625, 238, "oops", { ...mid, color: "red", size: 36 })],
        },
        {
          say: "Calm people go back. You revert to the last good snapshot, then make a small fix on top. History isn't a record of shame. It's an undo button that never runs out.",
          draw: [
            P("M540 285 Q450 185 365 285", { color: "green", dur: 1200 }),
            T(430, 160, "revert to c2", { ...mid, color: "green", size: 34 }),
            D(720, 300, { color: "green" }),
            T(720, 345, "c4: the fix", { ...mid, size: 30, color: "green" }),
            I("repo", 810, 440, 66),
            T(810, 515, "your Ops Hub repo keeps it all", { ...mid, size: 24 }),
          ],
        },
        {
          ask: {
            id: "revert",
            label: "Revert, don't panic",
            q: "Commit three broke the site. What's the best first move?",
            options: ["Delete the repository and start again", "Go back to the last good commit", "Wait and hope it fixes itself"],
            answer: 1,
            say: "Hands up. Commit three broke the site. What's the best first move?",
            explain: "Yes. Restore the last good state first, then find the cause calmly.",
            hint: "You want the site working again quickly, without losing anything you might need.",
          },
        },
      ],
    },
    {
      title: "Let the robots do the dull part",
      steps: [
        {
          say: "Some chores should never depend on you remembering. That's what Automations are for: scheduled helpers that run a set of instructions against one of your projects.",
          draw: [I("clock", 150, 215, 90, { color: "blue" }), T(150, 295, "a schedule", { ...mid, size: 30 })],
        },
        {
          say: "You choose when: by hand, hourly, daily or weekly, and at what time. And you write the instructions in plain language, just like a prompt.",
          draw: [A(215, 215, 330, 215, { color: "blue" }), I("robot", 400, 215, 90, { color: "purple" }), T(400, 295, "your instructions", { ...mid, size: 30 })],
        },
        {
          say: "Each run is a normal agent run. If it changes files, the change lands as a commit on the Hub, so you can read exactly what the helper did and undo it if you disagree.",
          draw: [A(470, 215, 600, 215, { color: "purple" }), I("repo", 670, 215, 90), T(670, 295, "lands as a commit", { ...mid, size: 30 }), N(780, 140, 190, 70, ["code review", "security"], { size: 22, color: "purple" })],
        },
        {
          widget: "cadence",
          say: "Your turn. You want a nightly review of yesterday's commits. Pick the cadence that's enough, and watch the week fill up with runs.",
        },
      ],
    },
    {
      title: "Redeploy and read the logs",
      steps: [
        {
          say: "Now the site itself. On ops.palmaierc.com, every project has six pages. Overview shows the public link and the status. Deployments is where a GitHub site changes branch or ships a commit.",
          draw: [
            B(45, 130, 270, 110, "Overview", { color: "blue", sub: "link + status" }),
            B(365, 130, 270, 110, "Deployments", { color: "orange", sub: "branch + commits" }),
            B(685, 130, 270, 110, "Logs", { color: "green", sub: "what happened" }),
          ],
        },
        {
          say: "Variables are settings for one site, like an API address. Usage is its CPU, memory and disk. And Settings holds the description, a custom domain, and the delete button.",
          draw: [
            B(45, 285, 270, 110, "Variables", { color: "purple", sub: "per-site settings" }),
            B(365, 285, 270, 110, "Usage", { color: "blue", sub: "cpu, memory, disk" }),
            B(685, 285, 270, 110, "Settings", { color: "red", sub: "domain + delete" }),
          ],
        },
        {
          say: "When something looks wrong, go to Logs first. It has two tabs. Deployment tells you what happened while the site was published. Console shows what the running site is printing right now.",
          draw: [R(820, 185, 160, 90, { color: "green" }), N(300, 430, 380, 100, ["blank page?", "logs first."], { color: "green", size: 30 }), A(670, 470, 790, 280, { color: "green" })],
        },
        {
          ask: {
            id: "logs",
            label: "Logs first",
            q: "The live page is blank after a deploy. Where do you look first?",
            options: ["Usage", "Logs: Deployment, then Console", "Settings"],
            answer: 1,
            say: "Pop quiz. The live page is blank after a deploy. Where do you look first?",
            explain: "Right. Deployment logs show a failed build, and Console shows an error in the running site.",
            hint: "You need to see what the build and the running site actually said.",
          },
        },
      ],
    },
    {
      title: "The weekly checklist",
      steps: [
        {
          say: "Finally, make it a ritual. Once a week, read the Git tab and ask: do I understand every change that landed? Surprises in history are the earliest warning you'll get.",
          draw: [T(110, 170, "read the Git history", { size: 40 }), K(65, 170), I("branch", 830, 160, 74, { color: "blue" })],
        },
        {
          say: "Check the logs, even when nothing looks broken. Update the packages your site depends on, and read what changed. Old dependencies are where problems hide.",
          draw: [T(110, 265, "skim the logs", { size: 40 }), K(65, 265), I("book", 830, 255, 74, { color: "green" }), T(110, 345, "update dependencies", { size: 40 }), K(65, 345), I("gear", 830, 345, 74, { color: "purple" })],
        },
        {
          say: "Look at your domain's renewal date, and at your plan. A flat monthly plan means the bill never surprises you, but an expired name will. Set a reminder, then you're done.",
          draw: [T(110, 435, "renew the domain", { size: 40 }), K(65, 435), I("clock", 830, 435, 74, { color: "orange" }), T(110, 515, "check the plan", { size: 40 }), K(65, 515)],
        },
      ],
    },
  ],
};

/* ================================================================= 4 */

const ep4 = {
  id: "privacy-4",
  number: 4,
  title: "Privacy & Compliance Aspect",
  label: "Episode 4 - Privacy & Compliance Aspect",
  minutes: 5,
  blurb: "What Ops hides, what it can't, how to check your own connection, and the grown-up part.",
  homework: {
    text: "Homework: run the Telemetry check and read every line it reports.",
    cta: "Open Telemetry",
    view: "telemetry",
  },
  scenes: [
    {
      title: "Private is not invisible",
      steps: [
        {
          say: "Welcome back. Today is the lesson people skip and then regret: privacy and compliance. First, a distinction. Private does not mean invisible.",
          draw: [I("eye", 500, 230, 170, { color: "blue" }), T(500, 380, "private is not invisible", { ...mid, size: 44, color: "blue" })],
        },
        {
          say: "Some things really are hidden by design. There is no account with an email and a password. The name on a domain registration is Ops, not you. And the GitHub token you paste is used once, then forgotten.",
          draw: [
            T(40, 450, "hidden by design", { size: 34, color: "green" }),
            U(40, 462, 250, { color: "green" }),
            T(40, 505, "account + email", { size: 28 }),
            T(300, 505, "domain registrant", { size: 28 }),
            T(580, 505, "your GitHub token", { size: 28 }),
          ],
        },
        {
          say: "But other things stay visible. The chain remembers every transaction forever. Your connection has an address. And a public site is, well, public.",
          draw: [T(40, 160, "still visible", { size: 34, color: "red" }), U(40, 172, 190, { color: "red" }), T(40, 205, "the chain", { size: 28 }), T(220, 205, "your IP address", { size: 28 }), T(660, 205, "the public site", { size: 28 })],
        },
      ],
    },
    {
      title: "What Ops never asks for",
      steps: [
        {
          say: "Let's be concrete about what Ops doesn't want from you. No email address. No password to leak. No name on the account.",
          draw: [
            I("mail", 170, 190, 90),
            X(170, 190, { size: 110 }),
            T(170, 285, "email", { ...mid, size: 34 }),
            I("lock", 500, 190, 90),
            X(500, 190, { size: 110 }),
            T(500, 285, "password", { ...mid, size: 34 }),
            I("person", 830, 190, 90),
            X(830, 190, { size: 110 }),
            T(830, 285, "name", { ...mid, size: 34 }),
          ],
        },
        {
          say: "Instead, you sign one free message with a wallet. That signature proves the address is yours, it isn't a payment, and the first time you add an authenticator code on top.",
          draw: [I("wallet", 170, 430, 84, { color: "green" }), A(240, 430, 370, 430, { color: "green" }), T(520, 442, "one signature", { ...mid, size: 38, color: "green" }), K(690, 425, { size: 44 })],
        },
        {
          say: "When you publish from GitHub, the token is used once to install a read-only deploy key, and then it is gone. A key that can only read is the smallest door Ops could ask for.",
          draw: [T(110, 520, "token", { size: 32 }), A(200, 512, 330, 512), T(340, 520, "read-only key", { size: 32, color: "green" }), A(560, 512, 690, 512), T(700, 520, "token forgotten", { size: 32, color: "red" })],
        },
      ],
    },
    {
      title: "Sort the leaks",
      steps: [
        {
          draw: [
            T(170, 135, "Ops handles it", { ...mid, size: 36, color: "green" }),
            T(500, 135, "You handle it", { ...mid, size: 36, color: "orange" }),
            T(830, 135, "Always public", { ...mid, size: 36, color: "red" }),
            L(335, 110, 335, 360, { color: "ink", dashed: true }),
            L(665, 110, 665, 360, { color: "ink", dashed: true }),
          ],
          say: "Time for a sorting game. Seven things that can identify you. For each one, decide whether Ops handles it, you handle it, or it's simply public.",
        },
        {
          widget: "leak",
          say: "Take them one at a time. If you're unsure, ask who controls the thing. That usually gives the answer.",
        },
      ],
    },
    {
      title: "Check your own connection",
      steps: [
        {
          say: "Ops can't hide the road your browser travels. Your browser talks to a network, the network talks to Ops, and somewhere in the middle your address is visible.",
          draw: [
            B(40, 150, 200, 90, "browser", { color: "blue" }),
            A(245, 195, 330, 195),
            B(335, 150, 200, 90, "network", { color: "ink" }),
            A(540, 195, 625, 195),
            B(630, 150, 160, 90, "Ops", { color: "green" }),
            I("shield", 880, 200, 56, { color: "purple" }),
            T(880, 150, "VPN?", { ...mid, size: 28, color: "purple" }),
          ],
        },
        {
          say: "The Telemetry tab in /root audits that road. It checks the connection's encryption, the response headers, mixed content, and whether your browser leaks an address through WebRTC.",
          draw: [
            T(80, 330, "TLS + encryption", { size: 34 }),
            K(32, 330),
            T(80, 385, "response headers", { size: 34 }),
            K(32, 385),
            T(80, 440, "mixed content", { size: 34 }),
            K(32, 440),
            T(80, 495, "WebRTC leaks", { size: 34 }),
            K(32, 495),
            I("eye", 700, 410, 120, { color: "blue" }),
          ],
        },
        {
          say: "It also lists cookies and known trackers. Run it before you do anything sensitive, and again after you change your setup, because what you can see, you can fix.",
          draw: [T(700, 530, "run it before, and after", { ...mid, size: 30, color: "blue" })],
        },
      ],
    },
    {
      title: "Compliance: the grown-up part",
      steps: [
        {
          say: "Now the part that isn't optional. Private is not the same as above the law. Privacy protects your data and your safety. It does not move your legal duties anywhere else.",
          draw: [I("scale", 500, 215, 150, { color: "purple" }), T(500, 380, "private is not above the law", { ...mid, size: 42, color: "purple" })],
        },
        {
          say: "If you earn money, think about taxes on it. Check the rules on sanctions and on what you're allowed to sell where you live. Be honest in anything you say about a token, and respect the licences of the code you ship.",
          draw: [
            T(80, 440, "taxes on income", { size: 32 }),
            K(32, 440, { size: 28 }),
            T(80, 490, "sanctions + local rules", { size: 32 }),
            K(32, 490, { size: 28 }),
            T(520, 440, "honest claims", { size: 32 }),
            K(472, 440, { size: 28 }),
            T(520, 490, "code licences", { size: 32 }),
            K(472, 490, { size: 28 }),
          ],
        },
        {
          say: "Keep records: dated commits and on-chain receipts are a good start. And this is education, not legal advice. When real money is involved, talk to a professional where you live.",
          draw: [N(640, 130, 320, 90, ["not legal advice.", "ask a professional."], { color: "red", size: 28 })],
        },
        {
          ask: {
            id: "tax",
            label: "Taxes are yours",
            q: "You sell access to your app for USDC. Who thinks about the taxes?",
            options: ["Ops does, automatically", "You do", "Nobody, it's on a chain"],
            answer: 1,
            say: "Hands up. You sell access to your app for USDC. Who thinks about the taxes?",
            explain: "You do. A chain is a public ledger, not an exemption.",
            hint: "A wallet signature doesn't change where you live or what the rules there say.",
          },
        },
        {
          ask: {
            id: "public",
            label: "Public repo hygiene",
            q: "Which of these is safe to put in a public repository?",
            options: ["An API key", "A wallet seed phrase", "The site's HTML"],
            answer: 2,
            say: "One more. Which of these is safe to put in a public repository?",
            explain: "The HTML. It's meant to be seen. Keys and seed phrases never belong in git.",
            hint: "Which of them is something the whole world is already supposed to see?",
          },
        },
      ],
    },
  ],
};

/* ================================================================= 5 */

const ep5 = {
  id: "revenue-5",
  number: 5,
  title: "Managing Revenue Streams",
  label: "Episode 5 - Managing Revenue Streams",
  minutes: 5,
  blurb: "Four kinds of stream, how Ops Pay settles a payment, and a revenue mixer to play with.",
  homework: {
    text: "Homework: write down your product's streams and its flat monthly costs. Then compare.",
    cta: "Open Billing",
    view: "billing",
  },
  scenes: [
    {
      title: "Revenue is a pipe",
      steps: [
        {
          say: "Last class of the course. Let's talk about money coming in. Think of revenue as a pipe, not a pot. A stream is money that arrives for a reason, on a schedule you can name.",
          draw: [
            I("person", 110, 190, 64),
            I("person", 110, 280, 64, { color: "green" }),
            I("person", 110, 370, 64, { color: "orange" }),
            A(170, 200, 330, 270),
            A(170, 280, 330, 285),
            A(170, 370, 330, 300),
          ],
        },
        {
          say: "Everything flows through your wallet. If you can't say why a payment arrived, you don't have a stream. You have a lucky afternoon, and those don't pay rent.",
          draw: [
            L(335, 255, 700, 255, { w: 5 }),
            L(335, 315, 700, 315, { w: 5 }),
            A(450, 285, 640, 285, { color: "blue" }),
            I("wallet", 820, 285, 110, { color: "green" }),
          ],
        },
        {
          say: "So before we build anything more, we list our streams. Naming a stream is the first step to growing it, and the first step to noticing when one dries up.",
          draw: [T(500, 470, "name every stream", { ...mid, size: 44, color: "red" }), U(330, 488, 340, { color: "red" })],
        },
      ],
    },
    {
      title: "Four kinds of stream",
      steps: [
        {
          say: "Number one: recurring. A customer pays a flat amount each month. It's predictable, and it's exactly how Ops itself charges, with Plot, Grove and Canopy.",
          draw: [B(30, 140, 220, 240, "recurring", { color: "blue", size: 34, sub: "a monthly plan", subSize: 24 }), I("clock", 140, 205, 62, { color: "blue" })],
        },
        {
          say: "Number two: one-off sales. Somebody pays once for something, in USDC for example. Lumpy, but great for products people only need one time.",
          draw: [B(265, 140, 220, 240, "one-off", { color: "orange", size: 34, sub: "a single sale", subSize: 24 }), I("coin", 375, 205, 62, { color: "orange" })],
        },
        {
          say: "Number three: fees. You take a small cut of activity that flows through your product. Classic pools charge about a third of a percent on each trade, paid to whoever supplied the liquidity.",
          draw: [B(500, 140, 220, 240, "fees", { color: "green", size: 34, sub: "a small cut", subSize: 24 }), I("chart", 610, 205, 62, { color: "green" })],
        },
        {
          say: "Number four: shares. Money is paid onward to people who hold or stake. PALM's own distribution wallet works this way: funds arrive, then are paid out in steps you can watch on Etherscan.",
          draw: [B(735, 140, 235, 240, "shares", { color: "purple", size: 34, sub: "paid to holders", subSize: 24 }), I("scale", 852, 205, 62, { color: "purple" })],
        },
        {
          say: "Most healthy products mix two or three of these. Recurring for the base, one-off for the bursts, and fees or shares when the product itself moves money.",
          draw: [N(300, 420, 400, 100, ["mix two or three.", "never rely on one."], { color: "purple", size: 30 })],
        },
      ],
    },
    {
      title: "Getting paid: Ops Pay",
      steps: [
        {
          say: "So how does a payment actually arrive? Ops has a small system for it, called Ops Pay. It starts with an agent registered with a signed wallet.",
          draw: [I("person", 120, 180, 70), T(120, 250, "payer", { ...mid, size: 30 }), A(185, 180, 330, 180), B(340, 120, 330, 120, "route", { color: "blue", sub: "a price + a reference", subSize: 24 })],
        },
        {
          say: "To get paid, you open a route for a price, with a reference such as plot. The payer sends USDC, or ETH of the same value, straight to the receiving wallet. No middleman holds the money.",
          draw: [A(675, 180, 780, 180, { color: "blue" }), I("wallet", 850, 180, 96, { color: "green" }), T(850, 250, "your wallet", { ...mid, size: 30 }), T(500, 325, "USDC, or ETH of the same value", { ...mid, size: 32, color: "orange" })],
        },
        {
          say: "The route settles when the transfer lands on Ethereum. Until then, nothing starts. Ops won't record a plan until the money for that price has actually arrived.",
          draw: [L(120, 400, 880, 400, { w: 4 }), D(200, 400, { color: "ink" }), T(200, 445, "route opened", { ...mid, size: 28 }), D(540, 400, { color: "orange" }), T(540, 445, "payment sent", { ...mid, size: 28 }), D(840, 400, { color: "green", r: 13 }), T(840, 445, "settled", { ...mid, size: 28, color: "green" })],
        },
        {
          ask: {
            id: "settle",
            label: "When it settles",
            q: "When does a subscription period start with Ops Pay?",
            options: ["When the route is opened", "When the route settles on Ethereum", "When the customer says they paid"],
            answer: 1,
            say: "Hands up. When does a subscription period start with Ops Pay?",
            explain: "When the route settles. The transfer is the proof, not the promise.",
            hint: "Which of these can't be faked? Money that has actually landed.",
          },
        },
      ],
    },
    {
      title: "The revenue mixer",
      steps: [
        {
          widget: "revenue",
          say: "Time to play with the numbers. Drag subscribers, price, one-off sales and the number of sites you host. Aim to leave two hundred dollars a month after hosting.",
        },
        {
          say: "Notice what stays still. Hosting on Ops is a flat monthly plan, so your costs don't jump when something goes viral. Predictable costs make revenue easier to plan around.",
          draw: [],
        },
      ],
    },
    {
      title: "Keep the books",
      steps: [
        {
          say: "Last lesson of the course: keep the books. Revenue you can't see is revenue you can't manage. A chain helps, because every payment is a public receipt you can look up.",
          draw: [T(110, 170, "match every receipt to a reason", { size: 38 }), K(65, 170), I("book", 880, 160, 70, { color: "blue" })],
        },
        {
          say: "Use separate wallets. One to receive money, one to spend from. If something goes wrong with the spending wallet, your income isn't sitting in it.",
          draw: [T(110, 265, "one wallet to receive, one to spend", { size: 38 }), K(65, 265), I("wallet", 880, 255, 70, { color: "green" })],
        },
        {
          say: "Review weekly, and set some aside for tax before you feel rich. Then, whenever you ask whether to build more or to maintain what's there, let these numbers settle the argument.",
          draw: [T(110, 360, "review every week", { size: 38 }), K(65, 360), T(110, 455, "set tax aside early", { size: 38 }), K(65, 455), I("clock", 880, 360, 70, { color: "orange" })],
        },
        {
          ask: {
            id: "flat",
            label: "Why flat helps",
            q: "Why is flat monthly hosting handy for a small product?",
            options: ["Costs don't move when a page goes viral", "It makes the site faster", "It removes the need for backups"],
            answer: 0,
            say: "Final question. Why is flat monthly hosting handy for a small product?",
            explain: "Right. A viral day can't blow up the bill, so your margin stays predictable.",
            hint: "Think about the bill on your best day ever.",
          },
        },
        {
          say: "That's the course. You can build in DeFi, keep it healthy, protect your privacy honestly, and manage what comes in. Class dismissed. Go make something worth maintaining.",
          draw: [T(700, 525, "class dismissed", { ...mid, size: 56, color: "red" }), U(500, 545, 400, { color: "red" })],
        },
      ],
    },
  ],
};

export const CLASSROOMS = { [ep2.id]: ep2, [ep3.id]: ep3, [ep4.id]: ep4, [ep5.id]: ep5 };
export const CLASS_ORDER = [ep2.id, ep3.id, ep4.id, ep5.id];

export function findClassroom(id) {
  return CLASSROOMS[id] || null;
}

/** The stars an episode can award: one per question and one per widget. */
export function starsOf(episode) {
  const out = [];
  for (const scene of episode.scenes) {
    for (const step of scene.steps) {
      if (step.ask) out.push({ id: step.ask.id, label: step.ask.label });
      if (step.widget) out.push({ id: step.widget, label: WIDGETS[step.widget]?.label || step.widget });
    }
  }
  return out;
}

export { px, py, POOL };
