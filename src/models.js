export const SUB_PREFIX = "sub:";

export const SUBSCRIPTION_PROVIDERS = [
  {
    id: "claude",
    label: "Claude",
    models: [
      { api: "claude-opus-4-5", name: "Opus 4.5" },
      { api: "claude-sonnet-4-5", name: "Sonnet 4.5" },
      { api: "claude-haiku-4-5", name: "Haiku 4.5" },
      { api: "claude-sonnet-4", name: "Sonnet 4" },
      { api: "claude-opus-4", name: "Opus 4" },
    ],
  },
  {
    id: "openai",
    label: "OpenAI",
    models: [
      { api: "gpt-5.1-codex", name: "GPT-5.1 Codex" },
      { api: "gpt-5.1", name: "GPT-5.1" },
      { api: "gpt-5.1-codex-mini", name: "GPT-5.1 Codex Mini" },
      { api: "o3", name: "o3" },
      { api: "o4-mini", name: "o4-mini" },
    ],
  },
  {
    id: "grok",
    label: "Grok",
    models: [
      { api: "grok-4", name: "Grok 4" },
      { api: "grok-4-fast-reasoning", name: "Grok 4 Fast" },
      { api: "grok-3", name: "Grok 3" },
    ],
  },
];

export const CATALOG_MODELS = [
  { id: "gemma4:31b-cloud", name: "Gemma 4 31B cloud", billing: "Free", grade: "A" },
  { id: "minimax-m3:cloud", name: "MiniMax M3 cloud", billing: "Free", grade: "B" },
  { id: "deepseek-v4-flash:0731-cloud", name: "DeepSeek V4 Flash cloud", billing: "Free", grade: "B" },
  { id: "ornith-1.5:9b", name: "Ornith 1.5 9B", billing: "Free", grade: "B" },
  { id: "ornith-1.5:35b", name: "Ornith 1.5 35B", billing: "Free", grade: "A" },
  { id: "glm-5.2:cloud", name: "GLM 5.2 cloud", billing: "Ollama cloud", grade: "A" },
  { id: "kimi-k3:cloud", name: "Kimi K3 cloud", billing: "Credits based", grade: "A" },
  { id: "richardyoung/llama-3.2-3b-instruct-abliterated", name: "Llama 3.2 3B abliterated", billing: "Free", grade: "D" },
  { id: "huihui-qwen3.6-abliterated:q2_k", name: "Qwen 3.6 35B Q2_K", billing: "Free", grade: "B" },
];

export const DEFAULT_MODEL = "glm-5.2:cloud";
export const PRICING_LEGEND = "Free · Your subscription · Ollama cloud · Credits based";

export function subId(provider, api) {
  return SUB_PREFIX + provider + "/" + api;
}

export function isSubscriptionModel(id) {
  return String(id || "").startsWith(SUB_PREFIX);
}

export function formatModelLabel(id) {
  const found = CATALOG_MODELS.find((item) => item.id === id);
  if (found) return found.name;
  for (const provider of SUBSCRIPTION_PROVIDERS) {
    for (const model of provider.models) {
      if (subId(provider.id, model.api) === id) return model.name + " · " + provider.label;
    }
  }
  return id;
}

export function formatModelShort(id) {
  const found = CATALOG_MODELS.find((item) => item.id === id);
  if (found) return found.name;
  for (const provider of SUBSCRIPTION_PROVIDERS) {
    for (const model of provider.models) {
      if (subId(provider.id, model.api) === id) return model.name;
    }
  }
  return String(id || "").split("/").pop() || id;
}

export function matchesModelSearch(id, label, query) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return true;
  return String(id).toLowerCase().includes(q) || String(label).toLowerCase().includes(q);
}

export const ALL_MODEL_IDS = [
  ...SUBSCRIPTION_PROVIDERS.flatMap((provider) => provider.models.map((model) => subId(provider.id, model.api))),
  ...CATALOG_MODELS.map((item) => item.id),
];
