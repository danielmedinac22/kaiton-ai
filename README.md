# Kaiton

**Your personal AI running coach.** Open source, local-first, no cloud needed.

Clone it, add your API key, and you have a coach that builds periodized training plans, calculates your heart rate zones, analyzes your workouts, and adjusts your preparation — all from a chat interface.

> If it knows your resting HR and your race date, it can coach you.

---

## Why Kaiton

Most running apps are either too simple (just a stopwatch) or too complex (require subscriptions, cloud accounts, Garmin syncs, and a PhD in exercise science).

Kaiton sits in between: **one AI conversation** replaces spreadsheets, training books, and generic plans. It understands periodization (Base → Build → Specific → Taper), the 80/20 polarized training rule, Karvonen heart rate zones, and progressive overload. You just talk to it.

Everything runs on your machine. Your data stays in a local SQLite file. The only external call is to your AI provider (OpenAI or Anthropic).

---

## Quick Start

```bash
git clone https://github.com/danielmedinac22/kaiton-ai.git
cd kaiton-ai
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and complete the 4-step setup wizard.

**Requirements:** Node.js 18+ and an API key from [OpenAI](https://platform.openai.com) or [Anthropic](https://console.anthropic.com).

---

## What It Does

### AI Coach
Chat with a running coach that has your full context — profile, zones, recent workouts, current plan. It can generate plans, analyze trends, flag overtraining, and adjust your week on the fly.

### Periodized Training Plans
The coach builds multi-week plans with proper phase progression: aerobic base building, intensity introduction, race-specific work, and taper. Every workout has a target zone, RPE, and description.

### Heart Rate Zones
Automatic Karvonen formula calculation from your resting and max HR. Five zones from Recovery to VO2max, used throughout the plan and coaching.

### Strava Import
Connect your Strava account and browse your activity history. Import workouts **one by one** — you choose which ones count. No bulk sync flooding your database with 500 activities.

### Workout Logging
Manual entry with distance, duration, heart rate, RPE (1-10), and how you felt. Workouts link to your plan so the coach knows what you actually did vs. what was planned.

### Multi-Provider AI
Switch between OpenAI (GPT-5.4, GPT-5.4 Mini, GPT-5.4 Nano) and Anthropic (Claude Sonnet 4.6, Claude Opus 4.6) from settings. One click.

---

## Strava Setup (Optional)

To import workouts from Strava:

1. Create an API app at [strava.com/settings/api](https://www.strava.com/settings/api)
2. Set the callback URL to `http://localhost:3000/api/strava/callback`
3. Add to `.env.local`:
   ```
   STRAVA_CLIENT_ID=your_client_id
   STRAVA_CLIENT_SECRET=your_client_secret
   ```
4. Go to the **Strava** tab in History and click **Connect**

---

## Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 16, TypeScript |
| UI | Tailwind CSS, shadcn/ui |
| Database | SQLite (better-sqlite3), Drizzle ORM |
| AI | Vercel AI SDK 6 (OpenAI + Anthropic) |
| Design | "Obsidian Pulse" dark theme |

---

## Project Structure

```
src/
  app/
    (app)/              Dashboard, Coach chat, History
    onboarding/         4-step setup wizard
    api/chat/           AI coach streaming endpoint
    api/strava/         OAuth + activity fetching
  components/
    layout/             Navigation (sidebar + bottom bar)
    history/            Workout form, Strava browser, settings
    ui/                 shadcn/ui base components
  lib/
    ai/                 Provider factory, system prompt, 5 coach tools
    db/                 SQLite schema, auto-init, migrations
    training/           Karvonen zones, periodization
    strava.ts           OAuth, token refresh, activity mapping
```

---

## Contributing

PRs welcome. The architecture is intentionally simple — no ORMs with 47 config files, no state management libraries, no build pipelines. Read the code, change what you want.

If you add a feature, keep it local-first. No cloud dependencies.

---

## License

MIT
