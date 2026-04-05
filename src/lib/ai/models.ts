export const AI_PROVIDERS = {
  openai: {
    name: "OpenAI",
    models: [
      { id: "gpt-5.4", name: "GPT-5.4", description: "Flagship, best quality" },
      { id: "gpt-5.4-mini", name: "GPT-5.4 Mini", description: "Fast & affordable" },
      { id: "gpt-5.4-nano", name: "GPT-5.4 Nano", description: "Cheapest, lightest" },
      { id: "gpt-4o", name: "GPT-4o", description: "Previous gen, stable" },
    ],
  },
  anthropic: {
    name: "Anthropic",
    models: [
      { id: "claude-sonnet-4-6", name: "Claude Sonnet 4.6", description: "Best balance" },
      { id: "claude-opus-4-6", name: "Claude Opus 4.6", description: "Most capable" },
    ],
  },
} as const;
