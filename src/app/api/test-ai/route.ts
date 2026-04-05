import { NextResponse } from "next/server";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";

export async function POST(request: Request) {
  try {
    const { provider, apiKey, model } = await request.json();

    if (!apiKey) {
      return NextResponse.json({ error: "API key es requerida" }, { status: 400 });
    }

    let aiModel;
    if (provider === "anthropic") {
      const anthropic = createAnthropic({ apiKey });
      aiModel = anthropic(model || "claude-sonnet-4-6");
    } else {
      const openai = createOpenAI({ apiKey });
      aiModel = openai(model || "gpt-5.4-mini");
    }

    const { text } = await generateText({
      model: aiModel,
      prompt: "Respond with exactly: OK",
      maxOutputTokens: 10,
    });

    return NextResponse.json({ ok: true, response: text });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
