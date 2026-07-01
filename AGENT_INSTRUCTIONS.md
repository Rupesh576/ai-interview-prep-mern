# Agent Instructions — Daily Upgrade Bot

## Project Overview
This is a MERN stack AI-powered interview preparation app.
- **Frontend:** React + Vite + Tailwind CSS (`client/src/`)
- **Backend:** Node.js + Express (`server/`)
- **Database:** MongoDB (Mongoose models in `server/models/`)
- **AI:** Gemini 2.5 Flash via OpenAI-compatible SDK (`server/services/openaiService.js`, also inline in `server/server.js`)
- **Auth:** JWT-based (`server/middleware/authMiddleware.js`, `server/utils/generateToken.js`)

## Your Daily Task
Each run, pick **one meaningful improvement** from the categories below. Do not attempt multiple large changes in a single run — focus and finish one thing well.

### Priority Areas (in order)
1. **New interview features** — question categories, difficulty levels, timer, hints, scoring
2. **UI/UX improvements** — better layouts, loading states, error messages, responsive design
3. **Code quality** — refactor repetitive code, improve error handling, add input validation
4. **Backend improvements** — new API endpoints, better response structures, performance
5. **Developer experience** — better console logs, cleaner component structure

### Example Changes (pick one per day, or invent your own)
- Add a difficulty selector (Easy / Medium / Hard) to interview sessions
- Add a progress bar or timer to the InterviewRoom page
- Add pagination to the Dashboard session history
- Improve error messages shown to users (make them human-friendly)
- Add a "copy to clipboard" button for interview feedback
- Refactor Dashboard.jsx to use smaller sub-components
- Add loading skeletons instead of blank screens while data loads
- Add a question category filter (frontend + backend)
- Improve mobile responsiveness of any page
- Add word count or character limit indicator to answer input
- Create a summary card on Dashboard showing total sessions, avg score
- Add tooltip or helper text to form fields

## Rules
- Make only **one focused change per run**
- The change must be **complete and working** — no half-finished code
- Never break existing functionality
- Never modify `.env` files
- Never delete existing routes or models — only add or improve
- Keep the same tech stack — no new frameworks or major dependencies without strong reason
- If adding a new dependency, run `npm install` in the correct folder (`client/` or `server/`)

## Git Instructions
After making and verifying your change:

1. Configure git identity:
```bash
git config user.email "agent@daily-upgrade-bot.com"
git config user.name "Daily Upgrade Bot"
```

2. Set the remote with your PAT (replace TOKEN and USERNAME):
```bash
git remote set-url origin https://USERNAME:TOKEN@github.com/USERNAME/REPO.git
```

3. Stage, commit, and push:
```bash
git add .
git commit -m "feat: <short description of what you changed>"
git push origin main
```

## Changelog Requirement
After every run, create or append to `CHANGELOG.md` in the root with this format:

```
## YYYY-MM-DD — <what changed>

**What:** <one paragraph describing exactly what was added or changed>

**Why:** <one paragraph explaining why this improves the app>

**Files changed:** list each file modified or created
```

## What Success Looks Like
- One real, working improvement is made
- Code is clean and consistent with existing style
- CHANGELOG.md is updated with what and why
- Changes are committed and pushed to GitHub
