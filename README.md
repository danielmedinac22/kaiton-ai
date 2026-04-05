# Kaiton

Your personal AI running coach. Open source, runs locally, no cloud needed.

Add your API key (OpenAI or Anthropic) and get a personalized training plan with periodized workouts, heart rate zones, and intelligent coaching.

## Quick Start

```bash
git clone https://github.com/yourusername/kaiton.git
cd kaiton
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and complete the setup wizard.

## Features

- **AI Coach** — Chat with an intelligent running coach that understands periodization, heart rate zones, and progressive overload
- **Training Plans** — Auto-generated plans with Base, Build, Specific, and Taper phases
- **Heart Rate Zones** — Karvonen formula calculation from your resting and max HR
- **Workout Logging** — Track runs with distance, duration, RPE, and heart rate
- **Multi-provider** — Works with OpenAI (GPT-4o) or Anthropic (Claude Sonnet)
- **Local-first** — All data stored in SQLite on your machine. Nothing leaves your computer except AI API calls.

## Stack

- Next.js 16 + TypeScript
- Tailwind CSS + shadcn/ui
- SQLite (better-sqlite3) + Drizzle ORM
- Vercel AI SDK 6 (OpenAI + Anthropic)

## Requirements

- Node.js 18+
- An API key from [OpenAI](https://platform.openai.com) or [Anthropic](https://console.anthropic.com)

## Project Structure

```
src/
  app/              # Pages and API routes
    (app)/          # Main app (dashboard, coach, history)
    onboarding/     # First-run setup wizard
    api/chat/       # AI coach streaming endpoint
  components/       # React components
    ui/             # shadcn/ui base components
    layout/         # Navigation (sidebar + bottom bar)
  lib/
    db/             # SQLite schema and connection
    ai/             # Provider factory, system prompt, tools
    training/       # Zone calculations, periodization
data/               # Local SQLite database (gitignored)
```

## License

MIT
