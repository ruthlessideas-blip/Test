# One Focus (MVP)

A production-quality MVP for single-threaded execution across ideas, universes, worlds, and daily focus.

## Stack
- Next.js App Router + TypeScript
- Tailwind CSS
- Prisma + SQLite
- Jest (unit) + Playwright (e2e smoke)

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure env:
   ```bash
   cp .env.example .env
   ```
3. Run migrations + seed:
   ```bash
   npm run prisma:migrate -- --name init
   npm run prisma:seed
   ```
4. Start app:
   ```bash
   npm run dev
   ```

## Test
```bash
npm test
npm run test:e2e
```

## MVP Highlights
- One active world hard lock (auto-pause previous active)
- Exactly one daily step per active world/day
- Dreams are capture only, with promotion into world creation flow
- Prompt library with versioning and reset-to-default
- AI stub route (`POST /api/ai/generate`) with prompt run persistence and editable outputs
- Calm/Gold mode visibility controls
