import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";

export function getAIModel(provider: string, apiKey: string, model: string) {
  if (provider === "anthropic") {
    const anthropic = createAnthropic({ apiKey });
    return anthropic(model);
  }

  const openai = createOpenAI({ apiKey });
  return openai(model);
}
