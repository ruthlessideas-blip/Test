# Assumptions

- The MVP uses server actions for most mutations to keep implementation simple and production-ready with App Router conventions.
- Prompt template scoping resolves in priority order: world override, universe override, then global default.
- "Today one step" uniqueness is enforced per active world per date via a composite unique constraint and upsert behavior.
- "Activate world" can silently pause any previous active world; confirmation UI is represented by explicit activate action on non-active worlds.
- AI is deterministic stubbed logic and does not require external API keys.
- Gold mode reveals additional depth sections and AI panels, while Calm mode keeps pages minimal.
