/**
 * Instant Miles intents — no model round-trip.
 * Returns { say, action } when the request is clear enough to drive the UI.
 */

const THEMES = [
  ["nvidia", /\bnvidia\b/i],
  ["palm-market", /\b(?:palm\s*)?market(?:\s*mode)?\b/i],
  ["default", /\bdefault\b/i],
  ["serenity", /\bserenity\b/i],
  ["obsidian", /\bobsidian\b/i],
  ["ember", /\bember\b/i],
  ["aurora-reykjavik", /\b(?:aurora\s*)?reykjav[ií]k\b|\baurora\s+reyk/i],
  ["aurora", /\baurora\b/i],
  ["snowy-helsinki", /\b(?:snowy\s*)?helsinki\b|\bsnowy\s+helsinki\b/i],
  ["sunny-sf", /\b(?:sunny\s*)?(?:sf|san\s*francisco)\b/i],
  ["rainy-london", /\b(?:rainy\s*)?london\b/i],
  ["midnight-nyc", /\b(?:midnight\s*)?(?:nyc|new\s*york)\b/i],
  ["neon-tokyo", /\b(?:neon\s*)?tokyo\b/i],
  ["golden-dubai", /\b(?:golden\s*)?dubai\b/i],
  ["misty-kyoto", /\b(?:misty\s*)?kyoto\b/i],
  ["blue-lisbon", /\b(?:blue\s*)?lisbon\b/i],
  ["humid-singapore", /\b(?:humid\s*)?singapore\b/i],
  ["late-paris", /\b(?:late\s*)?paris\b/i],
  ["foggy-seattle", /\b(?:foggy\s*)?seattle\b/i],
];

function say(text, action) {
  return { say: text, action };
}

export function milesIntent(raw) {
  const text = String(raw || "").replace(/\s+/g, " ").trim();
  if (!text || text.length > 280) return null;
  const lower = text.toLowerCase();

  if (/\b(hotkeys?|keyboard|shortcuts?)\b/.test(lower)) {
    return say("Here's the hotkey list.", { hotkeys: true });
  }
  if (/\b(command\s*palette|palette|ctrl\+?k)\b/.test(lower)) {
    return say("Opening the palette.", { palette: true });
  }
  if (/\b(new\s+(agent|chat)|start\s+over|fresh\s+chat)\b/.test(lower)) {
    return say("New Agent.", { newChat: true, view: "home" });
  }
  if (/\b(ship(\s+an?\s+app)?|go\s+live|publish)\b/.test(lower)) {
    if (/\b(demo|tour|show\s+me|walk\s*me)\b/.test(lower)) {
      return say("Watch the ship demo.", { tour: "ship-demo" });
    }
    return say("Ship flow.", { ship: true });
  }
  if (/\b(open\s+)?files?\b|\binspector\b|\brepo\s+files\b/.test(lower)) {
    return say("Files.", { files: true, click: "files" });
  }
  if (/\b(market\s*mode|trading\s*desk)\b/.test(lower)) {
    return say("Market Mode.", { market: true });
  }
  if (/\b(open\s+)?markets?\b/.test(lower) && !/\bmode\b/.test(lower)) {
    return say("Markets.", { view: "markets" });
  }
  if (/\b(settings|appearance|themes?)\b/.test(lower) && !/\bto\b/.test(lower)) {
    return say("Settings.", { view: "settings" });
  }
  if (/\b(help|how\s+does\s+this\s+work)\b/.test(lower)) {
    return say("Help.", { view: "help" });
  }
  if (/\b(ops|hosting|hub)\b/.test(lower)) {
    return say("Ops.", { view: "ops" });
  }
  if (/\b(billing|credits)\b/.test(lower)) {
    return say("Billing.", { view: "billing", click: "credits" });
  }
  if (/\b(account|wallet|profile)\b/.test(lower)) {
    return say("Account.", { view: "account", click: "wallet" });
  }
  if (/\b(paper|philosophy)\b/.test(lower)) {
    return say("Opening the paper.", { paper: true });
  }
  if (/\b(home|dashboard)\b/.test(lower)) {
    return say("Home.", { view: "home" });
  }
  if (/\b(notes?|day\s*tasks?|reminders?)\b/.test(lower) && /\b(open|show|my|list|what)\b/.test(lower)) {
    return say("Opening notes.", { view: "notes" });
  }
  const remindMatch = text.match(
    /^(?:(?:please|hey|miles)[,:]?\s*)?remind\s+me\s+(?:to\s+)?(.+?)(?:\s+(?:at|in|this)\s+(morning|afternoon|evening|night))?$/i,
  );
  if (remindMatch) {
    const task = remindMatch[1].trim().replace(/[.?!]+$/, "");
    const part = (remindMatch[2] || "").toLowerCase();
    if (task.length >= 2) {
      return say(part ? `I'll remind you ${part}.` : "I'll remind you.", {
        view: "notes",
        note: { text: task, part: part || undefined, milesRemind: true },
      });
    }
  }

  if (/\b(agent\s+mode|switch\s+to\s+agent|go\s+agent)\b/.test(lower) || /\bmode\s+agent\b/.test(lower)) {
    return say("Agent mode.", { mode: "agent", click: "agent" });
  }
  if (/\b(ask\s+mode|switch\s+to\s+ask|read[\s-]?only)\b/.test(lower) || /\bmode\s+ask\b/.test(lower)) {
    return say("Ask mode.", { mode: "ask", click: "ask" });
  }
  if (/\b(plan\s+mode|switch\s+to\s+plan)\b/.test(lower) || /\bmode\s+plan\b/.test(lower)) {
    return say("Plan mode.", { mode: "plan", click: "plan" });
  }

  for (const [id, re] of THEMES) {
    if (re.test(text) && /\b(theme|look|wallpaper|switch|use|set|make)\b/.test(lower)) {
      return say(`Theme · ${id}.`, { theme: id });
    }
  }
  if (/\bnvidia\b/.test(lower)) {
    return say("NVIDIA theme with Jensen.", { theme: "nvidia" });
  }
  for (const [id, re] of THEMES) {
    if (!re.test(text)) continue;
    if (!/helsinki|sf|francisco|london|nyc|york|tokyo|reykjav|dubai|kyoto|lisbon|singapore|paris|seattle/.test(lower)) continue;
    return say(`Theme · ${id.replace(/-/g, " ")}.`, { theme: id });
  }

  const promptMatch = text.match(
    /^(?:(?:please|hey|miles)[,:]?\s*)?(?:(?:write|type|fill|draft|prompt|ask\s+hamrin(?:\s+to)?|tell\s+hamrin(?:\s+to)?)\s+)(.+)$/i,
  );
  if (promptMatch) {
    const prompt = promptMatch[1].trim();
    if (prompt.length >= 4) {
      const send = !/\b(don'?t\s+send|just\s+type|fill\s+only)\b/i.test(text);
      return say(send ? "Sending that to Hamrin." : "Filling the composer.", {
        view: "home",
        mode: "agent",
        prompt,
        send,
        click: "prompt",
      });
    }
  }

  if (/\b(tour|tutorial|walk\s*me\s*through|show\s+me\s+around)\b/.test(lower)) {
    return say("Starting the tour.", { tour: true });
  }

  return null;
}
