# AGENTS.md

## Project summary

Build a premium, bilingual salon queue management system for customers, reception staff and barbers.

## Stack and run command

- Frontend: React + Vite + TypeScript + Tailwind CSS
- Backend: Node.js + Express
- Storage: SQLite
- Real-time: Socket.IO
- Start frontend and backend together: `npm run dev`
- Frontend deployment target: Vercel
- Backend deployment targets: Render or Railway
- Use environment variables for service URLs and secrets; never hard-code localhost URLs or PINs

## Read docs first

Before implementation work, read:

1. `docs/01-brief.md`
2. `docs/02-screens.md`
3. `docs/03-flows-rules.md`

Rules in `docs/03-flows-rules.md` are the source of truth for queue behavior. Business-rule logic must be implemented in one shared backend module.

## Working rules

- Complete one screen or feature per task; do not implement or restyle other screens in the same task.
- Do not touch unrelated screens, files or features.
- Keep all status transitions and queue calculations in the one shared backend rules module.
- Never trust totals, wait times, tokens or queue position from the client.
- Keep all visible labels in the English/Gujarati language file and provide an EN/GU toggle.
- Do not add any of the explicit don't-build features.
- After each task, report:
  - changed files
  - how to test the change
