## 2026-07-23 — Add password strength indicator and show/hide toggle to auth pages

**What:** Enhanced the Register and Login pages with two password UX improvements. On the Register page, a real-time password strength meter now appears below the password field as soon as the user starts typing. The meter consists of four horizontal bar segments that fill left-to-right as the password grows stronger, color-coded by tier: **Weak** (1 segment, rose) for passwords under 8 characters with no variation, **Fair** (2 segments, amber) for passwords that meet basic length but lack uppercase or digits, **Good** (3 segments, cyan) for passwords with a solid mix of character types, and **Strong** (4 segments, emerald) for passwords that satisfy all five criteria (8+ chars, 12+ chars, uppercase, digit, special character). A short hint label below the bar tells the user exactly what to add next ("add uppercase or numbers", "add symbols for max strength"). On both the Register and Login pages, a small Eye/EyeOff toggle button now appears at the right edge of the password field so users can reveal their password to spot typos. The toggle uses `tabIndex={-1}` so it is skipped by keyboard tab-navigation and does not interfere with form submission. No new npm dependencies were added — the strength algorithm is pure JS and the icons come from the already-installed lucide-react package.

**Why:** New users who mistype their password during registration receive no helpful feedback today: they set a password they cannot see and get no signal about whether it meets any standard until they try to log in and fail. The show/hide toggle resolves the typo problem on both pages with a single click, and the strength meter on the Register page provides the missing feedback loop — a user who starts with "abc" can see the bar is rose/Weak and immediately understand why, then watch it climb to emerald/Strong as they improve the password. This directly addresses the "Improve error messages shown to users (make them human-friendly)" item and the "Add tooltip or helper text to form fields" item from the AGENT_INSTRUCTIONS example changes list, applied to the earliest point in the user journey (account creation and sign-in).

**Files changed:**
- `client/src/pages/Register.jsx` — added `Eye`, `EyeOff` icon imports; added `showPassword` state and toggle button; added `getPasswordStrength` helper function; added four-segment strength bar with color-coded label and contextual hint below the password field; changed password input `type` to toggle between `password` and `text`; changed `pr-4` to `pr-11` on the input to make room for the toggle button
- `client/src/pages/Login.jsx` — added `Eye`, `EyeOff` icon imports; added `showPassword` state and toggle button; changed password input `type` to toggle between `password` and `text`; changed `pr-4` to `pr-11` on the input to make room for the toggle button

---

## 2026-07-22 — Add skeleton loading state to InterviewRoom

**What:** Replaced the plain centered spinner on the InterviewRoom loading state with a full-page `InterviewRoomSkeleton` component that mirrors the actual page structure. The skeleton renders animated pulsing placeholder shapes for every visible section: the session metadata header (eyebrow label, title, difficulty/type/focus/timer row, Save Draft and Submit buttons), the dot-navigator row (five question-bubble placeholders), the answered-questions progress bar (label row + filled track), the question card (question-number label, two-line question text, hint button, textarea, word-count/quality row, quality bar), and the navigation footer (Prev and Next buttons). All shapes use Tailwind's `animate-pulse` on the root wrapper so the animation is coordinated and smooth. No new dependencies were added.

**Why:** Dashboard got proper skeleton loading on 2026-07-02 and FeedbackView on 2026-07-16, but InterviewRoom was still showing a bare spinner — an inconsistency across the three most-visited pages in the app. Skeleton screens are known to feel faster than spinners because they give the user a preview of the layout they are about to interact with, rather than an indefinite wait signal. Completing the skeleton set makes the app feel polished and consistent throughout. This addresses the "UI/UX improvements" priority area in AGENT_INSTRUCTIONS and required zero changes to the backend, routes, or any existing functionality.

**Files changed:**
- `client/src/pages/InterviewRoom.jsx` — added `InterviewRoomSkeleton` functional component above `InterviewRoom`; replaced the `if (loading)` spinner block with `return <InterviewRoomSkeleton />`

---

## 2026-07-21 — Add keyboard shortcuts for question navigation in InterviewRoom

**What:** Added keyboard-driven question navigation to the InterviewRoom page. Pressing the left (`←`) or right (`→`) arrow keys moves to the previous or next question respectively, and pressing any digit key `1`–`9` jumps directly to that question (e.g. `3` jumps to question 3). All three shortcuts are silently ignored while the user is actively typing in the answer textarea or any other input field, so normal text editing is unaffected. Navigation is also suppressed while the submission overlay is showing. A subtle, non-intrusive shortcut-hint strip — showing styled `<kbd>` keys and plain-language labels — appears between the dot navigator and the progress bar whenever a session has more than one question. The hint strip is dimmed so it doesn't compete visually with the question content. No new dependencies were required; the implementation uses a single `useRef` (kbRef) that is synchronised on every render so the event listener, registered only once at mount, always reads the latest `currentIdx`, `questionsLen`, and `submitting` values without stale-closure issues.

**Why:** Navigating between questions with the mouse or touch — clicking the dot navigator or the Next/Previous buttons — is precise but slow, especially for users who prefer to keep their hands on the keyboard while composing detailed written answers. Arrow-key navigation is a standard convention in multi-step form flows and survey tools; it lets users advance or retreat without reaching for the mouse. The digit-key shortcut allows experienced users to jump non-linearly (e.g. reviewing question 7 before finishing question 4) in a single keypress. Together these shortcuts make the interview experience faster and feel more like a real assessment tool. This directly addresses the "UI/UX improvements" priority area in AGENT_INSTRUCTIONS and required zero changes to the backend or any existing routes.

**Files changed:**
- `client/src/pages/InterviewRoom.jsx` — added `kbRef` useRef for stale-closure-free state access; added mount/unmount `useEffect` that registers a `keydown` listener handling `ArrowLeft`, `ArrowRight`, and digit `1–9`; added keyboard shortcut hint strip (`<kbd>` elements) between the dot-navigator and the progress bar

---

## 2026-07-20 — Add delete button for in-progress sessions on Dashboard

**What:** Added the ability to delete abandoned in-progress interview sessions from the Dashboard. A small rose-coloured trash-icon button now appears alongside the "Resume" button on every in-progress session card. Clicking it shows a browser confirmation dialog; confirming triggers a `DELETE /api/sessions/:id` request that removes the session document and all its associated question documents from MongoDB. While the deletion is in flight the icon is replaced by a small spinner and the button is disabled so it cannot be double-clicked. On success the card disappears from the list immediately without a full page reload. On failure an inline error banner is shown at the top of the Dashboard. The endpoint rejects any attempt to delete a completed session (HTTP 400) and requires ownership (HTTP 403), matching the security checks already present on every other session route.

**Why:** Users who start a session by accident, or who generate questions they no longer intend to answer, have no way to clean up their interview history. Over time, clutter from abandoned in-progress sessions dilutes the history panel and skews the "Total Interviews" stat card. A delete button gives users control over their history without touching completed sessions (which contain valuable scored feedback). The implementation follows the existing controller/route/service/UI pattern used throughout the codebase and required no new dependencies.

**Files changed:**
- `server/controllers/sessionController.js` — added `deleteSession` controller: verifies ownership, rejects completed sessions, deletes related `Question` documents via `deleteMany`, then deletes the session with `deleteOne`
- `server/routes/sessionRoutes.js` — imported `deleteSession`; added `.delete(deleteSession)` to the existing `/:id` route
- `client/src/services/sessionService.js` — added `deleteSession(sessionId)` helper that calls `api.delete`
- `client/src/pages/Dashboard.jsx` — imported `Trash2` icon and `deleteSession` service; added `deletingId` state; added `handleDeleteSession` async handler; added rose trash-icon button with spinner/disabled states to each in-progress session card

---

## 2026-07-19 — Add performance trend chart to Dashboard

**What:** Added a `PerformanceTrend` component to the Dashboard that renders an SVG line chart showing the user's score history across up to 8 recent completed sessions. The chart appears between the three summary stat cards (Total Interviews, Completed Sessions, Average Performance) and the New Session form / Interview History grid. It consists of: a header row with a cyan `TrendingUp` icon, a "Performance Trend" title, and three stats — Best score (emerald), Latest score (color-coded by range), and a directional arrow with signed diff versus the previous session (e.g. "↑ +12 vs prev" in emerald, or "↓ −8 vs prev" in rose); a full-width SVG chart with dashed horizontal reference lines at 25%, 50%, and 75%, a cyan semi-transparent area fill, a cyan trend line with rounded joins, and color-coded data-point circles (emerald ≥ 80%, amber 60–79%, rose < 60%) with monospaced score labels above each dot; and an X-axis row of date labels (e.g. "Jul 18") for each session. The component shows an animated pulse skeleton while sessions are loading and returns null when fewer than 2 completed sessions exist (no chart is shown to new users). All math is pure JS/SVG — no chart library dependencies were added.

**Why:** The existing stat cards tell users their aggregate averages but give no sense of trajectory: a user who has gone from 45% to 78% over five sessions has no way to see that improvement from the Dashboard today. The trend chart makes progress visible at a glance — an upward-sloping line with green dots is immediately motivating, and a flat or declining line prompts the user to identify what needs work. This directly addresses the "create a summary card on Dashboard showing total sessions, avg score" item in the AGENT_INSTRUCTIONS example changes list and extends it with a richer visual that also shows trend direction over time.

**Files changed:**
- `client/src/pages/Dashboard.jsx` — added `TrendingUp` to lucide-react imports; added `PerformanceTrend` functional component (loading skeleton variant + data-driven SVG chart variant); inserted `<PerformanceTrend sessions={sessions} loading={fetching} />` between the metrics grid and the main content grid

---

## 2026-07-18 — Upgrade answer quality indicator with word count and progress bar

**What:** Replaced the minimal "Character count: X / Minimum recommended: 15 chars" text below the answer textarea in InterviewRoom with a rich, real-time answer quality indicator. The new indicator shows a word count and character count label on the left and a color-coded quality badge on the right, updated instantly as the user types. Four quality tiers are defined: **Too Short** (< 15 words, rose), **Developing** (15–39 words, amber), **Good** (40–79 words, cyan), and **Detailed** (80+ words, emerald). A slim animated progress bar beneath the labels fills proportionally from 0 % up to 100 % as the answer grows through the tiers, giving immediate visual feedback on answer depth. When a non-empty answer is still in the Too Short or Developing tier, a brief tip — "Aim for at least 40 words for a strong answer." — appears below the bar to nudge the user toward a complete response. The existing character count is preserved as secondary info next to the word count.

**Why:** The previous character count was technically accurate but practically unhelpful — nobody thinks in characters when writing an answer. Word count maps directly to answer depth and is the natural measure for open-ended interview responses. The quality tier labels give the user an instant, jargon-free judgment ("Developing" vs "Good") without requiring them to count or calculate anything. The animated progress bar and color coding create an incentive loop: the user can see the bar fill toward emerald as they elaborate, which encourages more thorough answers and directly improves the quality of practice the app provides. This directly addresses the "Add word count or character limit indicator to answer input" item in the AGENT_INSTRUCTIONS example changes list.

**Files changed:**
- `client/src/pages/InterviewRoom.jsx` — replaced static char-count div with an IIFE-rendered quality indicator block: computes `wordCount` and `charCount` from the current answer, derives a `quality` object (label, pill class, bar width, bar colour) via a tiered ternary, renders word/char count label, colour-coded tier badge, animated progress bar, and an optional "aim for 40 words" coaching tip.

---

## 2026-07-17 — Add question type / category selector

**What:** Added a 2×2 "Question Type" pill selector to the Dashboard interview setup form, giving users control over the category of questions the AI generates. The four options are: **Technical** (code, architecture, and implementation questions — the existing default), **Behavioral** (situational questions asking about past experience, teamwork, and challenges in STAR format), **Mixed** (an interleaved blend of roughly half technical and half behavioral questions), and **System Design** (questions asking candidates to architect scalable systems and components). The selected type is stored as a new `questionType` field on the `InterviewSession` model, passed through the backend to the AI prompt and mock-question generator, and displayed in the metadata header of both the InterviewRoom and FeedbackView pages. The "Retry Same Settings" flow on FeedbackView now also restores the question type in the pre-fill. Non-Technical session cards on the Dashboard show a small violet badge (e.g. "Behavioral") so users can tell session types apart at a glance. Two new offline mock question banks — ten behavioral and ten system-design questions — were added to cover all four types when the Gemini API key is absent. Existing sessions without the field default to "Technical" everywhere it is displayed.

**Why:** Until now the app always generated the same style of technical questions regardless of what the user actually needed to practise. Many real-world interviews consist of a dedicated behavioral round or a system design round in addition to (or instead of) coding questions. Giving users a one-click category selector makes the tool useful across all major interview formats without requiring any extra setup. It directly addresses the "question categories" item listed first in the project's Priority #1 (New interview features). The change required zero new npm dependencies — the question type is threaded through the existing API, model, and service layers.

**Files changed:**
- `server/models/InterviewSession.js` — added optional `questionType` enum field (`Technical` | `Behavioral` | `Mixed` | `System Design`, default `Technical`)
- `server/controllers/sessionController.js` — destructure `questionType` from request body in `createSession`; validate against allowed enum; persist to session; pass to `generateQuestions`
- `server/services/openaiService.js` — added `behavioral` (10 questions) and `systemDesign` (10 questions) mock question banks; updated `generateMockQuestions` to accept `questionType` and serve the correct bank (with interleaving for Mixed); updated `generateQuestions` signature to accept `questionType` and inject a type-specific instruction into the AI prompt
- `client/src/pages/Dashboard.jsx` — added `questionType` state (seeded from prefill); added 2×2 question type pill selector in the form between Difficulty and Tech Stack; passed `questionType` in the `createSession` call; added violet badge on session cards for non-Technical sessions
- `client/src/pages/InterviewRoom.jsx` — added `flex-wrap` to metadata row; added "Type:" label showing the session's question type
- `client/src/pages/FeedbackView.jsx` — added `flex-wrap` to metadata row; added "Type:" label in the session header; added `questionType` to the `handleRetryInterview` prefill object

---

## 2026-07-16 — Add loading skeletons to FeedbackView

**What:** Replaced the bare spinner on the FeedbackView loading state with a full-page `FeedbackSkeleton` component that mirrors the actual page structure. The skeleton renders animated pulsing placeholder shapes for every section: the back-button link, the header (eyebrow label, title, metadata row), the two-column summary row (circular score gauge + AI summary card), the Score Breakdown card with three tier rows, the Coaching Insights card with a 3-column grid of tip placeholders, and four accordion rows for the question breakdown. All shapes use Tailwind's `animate-pulse` on the root wrapper so the animation is coordinated. No new dependencies were added.

**Why:** The Dashboard already has proper skeleton loading (added on 2026-07-02), but FeedbackView still showed a bare centered spinner — creating an inconsistent experience between the two most-visited pages. Skeleton screens are known to feel faster than spinners because they give the user a preview of the content structure rather than an indefinite wait signal. Matching the FeedbackView to the Dashboard pattern makes the app feel more polished and finished across all its pages.

**Files changed:**
- `client/src/pages/FeedbackView.jsx` — added `FeedbackSkeleton` functional component above `FeedbackView`; replaced the `if (loading)` spinner block with `return <FeedbackSkeleton />`

---

## 2026-07-15 — Add personalised Coaching Insights panel to FeedbackView

**What:** Added a "Coaching Insights" section to the FeedbackView page, placed between the Score Breakdown and the Individual Question Breakdown accordion. The section shows 1–3 compact, actionable tip cards derived entirely from the existing session data — no new API calls or backend changes needed. Three categories of tip are generated automatically: a score-based tip (emerald "Ready to level up" for ≥80%, cyan "Add structure and depth" for 60–79%, amber "Strengthen the fundamentals" for <60%), a rose-coloured blank-answer warning that appears whenever one or more questions were left unanswered (showing the exact count), and a violet short-answer tip that fires when the average answer is under 25 words (displaying the actual average). Each card shows a relevant Lucide icon, a bold title, and a one-sentence actionable description. The grid is responsive: 1 card stretches full-width, 2 cards use a 2-column layout, and 3 cards use a 3-column layout on large screens. The section is suppressed entirely if no questions exist.

**Why:** The existing feedback view gives users a score and AI-written comments per question, but no guidance on what to change in their next session. Coaching Insights bridges that gap by translating raw scores and patterns into specific next steps — "try Advanced difficulty", "stop leaving questions blank", "write longer answers" — making the feedback view more diagnostic and directly actionable. All derivation is client-side from data already loaded, so it adds value with zero server cost or new dependencies.

**Files changed:**
- `client/src/pages/FeedbackView.jsx` — added `TrendingUp`, `BookOpen`, `Target` icon imports; added `unansweredCount`, `avgWordCount`, and `coachingTips` array derivations after the existing `scoreTiers` block; added the Coaching Insights JSX section (header + responsive card grid) between the Score Breakdown and Individual Question Feedback sections

---

## 2026-07-14 — Track and display interview session duration

**What:** Added full-stack interview duration tracking. When a user submits an interview, the elapsed time (already counted by the existing InterviewRoom timer) is now sent to the server and persisted in the database. On the FeedbackView page, a timer icon and `MM:SS` duration label appear in the session metadata header alongside the role, difficulty, and date fields — but only when a duration was recorded, so older sessions without it are unaffected. In the Dashboard Interview History panel, each completed session card also shows the session duration in the date/questions metadata row, making it easy to compare how long different sessions took at a glance. A `formatDuration` helper converts raw seconds to a consistent `MM:SS` format in both views.

**Why:** The InterviewRoom already had a live elapsed-time counter, but that data evaporated the moment the user navigated away from the page. Persisting duration closes that gap and adds a meaningful dimension to session history: users can track whether they're getting faster on a role over time, spot sessions where they rushed or over-thought, and set personal time goals. The change required zero new dependencies and zero new routes — it piggybacks on the existing submit endpoint by accepting an optional `duration` field in the request body.

**Files changed:**
- `server/models/InterviewSession.js` — added optional `duration` field (Number, in seconds)
- `server/controllers/sessionController.js` — destructure `duration` from request body in `submitSession`; persist it to the session document when valid
- `client/src/services/sessionService.js` — updated `submitInterview` to accept and forward a `duration` argument
- `client/src/pages/InterviewRoom.jsx` — pass `elapsedSeconds` to `submitInterview` call
- `client/src/pages/FeedbackView.jsx` — added `Timer` icon import; added `formatDuration` helper; added conditional duration display in the header metadata row
- `client/src/pages/Dashboard.jsx` — added `Timer` icon import; added `formatDuration` helper; added conditional duration display in each session card's metadata row

---

## 2026-07-13 — Add debounced auto-save with status indicator to InterviewRoom

**What:** Added debounced auto-save to the answer textarea in the InterviewRoom page. Two seconds after a user stops typing, the current answers are automatically saved to the server via the existing `saveDraftAnswers` API — no manual click required. An auto-save status indicator appears below the Save Draft and Submit Interview buttons: it shows a small spinner with "Auto-saving…" while the request is in flight, then switches to a green checkmark with "Auto-saved HH:MM" once the save succeeds. The auto-save timer is cancelled immediately when the user clicks Submit Interview, preventing any race condition between the auto-save and the final submission save. On unmount the timer is also cleared via a cleanup effect. Failures are swallowed silently so they never distract the user mid-answer.

**Why:** Previously, draft answers were only persisted when the user explicitly clicked "Save Draft" or navigated between questions (which triggers a save). If a user typed a detailed answer for the current question and closed the tab or refreshed before moving on, that answer was lost. Debounced auto-save eliminates that risk with no extra user action required. The status indicator gives confidence that the work is safe without cluttering the UI — it occupies a fixed-height slot that is invisible until the first auto-save fires.

**Files changed:**
- `client/src/pages/InterviewRoom.jsx` — added `autoSaveTimerRef`, `lastSavedAt`, and `autoSaving` state; added `doAutoSaveSnapshot` async function; modified `handleAnswerChange` to schedule a 2-second debounced auto-save on every keystroke; added `clearTimeout(autoSaveTimerRef.current)` in `handleSubmitInterview`; added cleanup `useEffect`; added auto-save status row below the action buttons in the header

---

## 2026-07-09 — Add per-question score breakdown to FeedbackView

**What:** Added a "Score Breakdown" section to the FeedbackView page, placed between the overall summary row and the per-question accordion. It displays three tier rows — Excellent (8–10/10), Good (6–7/10), and Needs Work (0–5/10) — each with a labelled progress bar that fills proportionally to how many questions landed in that tier. A count label on the right shows "X of Y" for each tier. All three bars animate in with a 700 ms ease-out transition on first render. The section is only rendered when there is at least one question, so it never appears on empty sessions. No backend changes were required — the tier counts are computed client-side from the `questions` array already fetched by `getSessionDetails`.

**Why:** The existing radial score gauge tells the user their aggregate percentage but gives no sense of consistency: a score of 70 % could mean all questions hovered around 7/10, or it could mean half were excellent and half were poor. The breakdown strip resolves that ambiguity at a glance, showing the distribution before the user even opens the accordion. It directly improves the feedback view's analytical value without adding any new dependencies or API calls.

**Files changed:**
- `client/src/pages/FeedbackView.jsx` — added `excellentCount`, `goodCount`, `needsWorkCount` derived values; added `scoreTiers` array; added the Score Breakdown card JSX block between the summary grid and the question accordion

---

## 2026-07-07 — Add "Retry Same Settings" button to FeedbackView

**What:** Added a "Retry Same Settings" button to the actions footer on the FeedbackView page, placed between the existing "Copy Feedback Report" and "Practice Another Interview" buttons. Clicking it calls `navigate('/', { state: { prefill: {...} } })` with the completed session's role, difficulty, techStack, and questionsCount. On the Dashboard, `useLocation` now reads that router state on mount and uses it to pre-seed all four form fields — role input, difficulty pill selection, tech stack input, and questions-count select. When the form is pre-filled, a small cyan banner appears at the top of the form telling the user their settings have been restored so they can start immediately or adjust before generating a new interview.

**Why:** After finishing a session, the most natural next step is often to try the same role and difficulty again — either to improve on a weak score or to practise until consistent. Previously the user had to navigate back to the Dashboard and manually re-enter all their session parameters from scratch. The new button removes that friction entirely: one click restores the exact same configuration and drops them straight into the creation form ready to go. No backend changes were needed — the pre-fill is passed entirely through React Router's location state.

**Files changed:**
- `client/src/pages/FeedbackView.jsx` — added `RotateCcw` icon import; added `handleRetryInterview` function; added "Retry Same Settings" button in the actions footer
- `client/src/pages/Dashboard.jsx` — added `useLocation` import; added `prefill` constant derived from `location.state?.prefill`; initialised `role`, `difficulty`, `techStack`, and `questionsCount` state from prefill with fallbacks; added pre-fill notification banner inside the form card

---

## 2026-07-06 — Add AI-powered "Get a Hint" button to InterviewRoom questions

**What:** Added a "Get a Hint" button to each question card in the InterviewRoom. When a user is stuck on a question, they can click the amber-coloured "Get a Hint" button to request a brief, directional hint generated by the AI (or a keyword-based mock hint when the API key is not configured). The hint appears inline below the question text in a soft amber highlight box with a lightbulb icon, giving the user a nudge in the right direction without revealing the full answer. The button disables and shows a spinner while the hint is loading, and each question's hint is cached in component state so requesting it again on the same question does not trigger a second API call. On the backend, a new `POST /api/sessions/:id/hint` endpoint verifies session ownership, fetches the question from the database, calls the `generateHint` service function, and returns the hint text. The service function calls GPT-4o-mini with a system prompt instructing it to give a 2–3 sentence directional clue; on API failure or missing key it falls back to an extensive keyword-based hint library covering Virtual DOM, hooks, the event loop, JWT, REST, Redux, SOLID, and more, with a sensible generic fallback for any other question.

**Why:** Without hints, a user who is completely blank on a question has only two options: guess an answer or skip it — neither of which advances their learning. A hint that points to the core concept or prompts the user to think about trade-offs bridges that gap, making the mock interview more educational and less discouraging. This directly addresses the "hints" item in Priority Area #1 (New interview features) and adds real interactive value with no new npm dependencies.

**Files changed:**
- `server/services/openaiService.js` — added `generateMockHint` keyword library and exported `generateHint` async function (AI call + mock fallback)
- `server/controllers/sessionController.js` — added `getQuestionHint` controller; imported `generateHint` from the service
- `server/routes/sessionRoutes.js` — registered `POST /:id/hint` route wired to `getQuestionHint`; imported new controller export
- `client/src/services/sessionService.js` — added `getQuestionHint(sessionId, questionId)` API helper
- `client/src/pages/InterviewRoom.jsx` — added `Lightbulb` icon import; added `hints` and `hintLoading` state maps; added `handleGetHint` async handler; added hint button / hint display block inside the question card

---

## 2026-07-05 — Add search and filter controls to Dashboard interview history

**What:** Added a real-time search box and two filter pill rows to the Interview History panel on the Dashboard. The search input filters sessions by role or tech stack as the user types and includes a one-click clear button (×). The status filter pills let users show All, In Progress, or Completed sessions only. The difficulty filter pills let users narrow to Beginner, Intermediate, or Advanced sessions. All three filters compose — e.g. "Completed + Advanced" shows only completed advanced sessions. A "Clear" button appears whenever any filter is active. The pagination bar continues to work correctly and updates its "Showing X–Y of Z" counter to reflect the filtered count. When no sessions match the current filters, a friendly empty-state message with a "Clear filters" button is shown instead of a blank panel. The stat-card metrics (Total Interviews, Completed Sessions, Average Performance) are always computed over the full unfiltered session list so they remain accurate regardless of the active filter state. Filtering resets to page 1 automatically to avoid showing an out-of-range page.

**Why:** As a user accumulates sessions across many roles and difficulty levels, scrolling through a flat list (even with pagination) to find a specific session becomes tedious. Search and filter are the standard solution: they let users instantly locate sessions by role name, tech focus, status, or difficulty without any backend round-trips — all filtering is done client-side on the already-fetched session array. This directly addresses "question category filter" and "improve UI/UX" from the Priority Areas list and makes the history panel scale gracefully with usage.

**Files changed:**
- `client/src/pages/Dashboard.jsx` — added `Search` and `X` icon imports; added `searchQuery`, `statusFilter`, and `difficultyFilter` state; added a `useEffect` to reset `currentPage` to 1 on filter change; derived `filteredSessions` by composing all three filters; updated pagination to operate on `filteredSessions`; added `hasActiveFilters` flag and `clearFilters` helper; added the filter UI block (search input, status pills, difficulty pills, Clear button) inside the history panel header; added a "no match" empty state with a clear-filters shortcut; updated the pagination counter to reflect filtered vs. total counts.

---

## 2026-07-04 — Add answered-questions progress bar to InterviewRoom

**What:** Added a slim horizontal progress bar to the InterviewRoom page, placed between the dot-navigation row and the question card. The bar fills left-to-right as the user types answers, tracking the ratio of answered questions (non-empty answer text) to total questions. A label on the left shows "X of Y questions answered" and a percentage counter on the right updates in real time. When all questions have been answered the bar and percentage switch from cyan to emerald green, giving a clear visual cue that the session is ready to submit. The width transition uses a 500 ms ease-out so the fill animation is smooth rather than instant.

**Why:** The existing dot navigator gives per-question status but no at-a-glance sense of overall completion. A progress bar is the standard pattern for multi-step forms and lets users immediately see how far along they are without counting dots. The color change to green when all questions are answered also gently prompts the user to hit "Complete Interview" — reducing accidental early submissions with unanswered questions.

**Files changed:**
- `client/src/pages/InterviewRoom.jsx` — derived `answeredCount` from the `answers` state map; added answered-questions progress bar block (label, percentage, filled track div) between the dot navigator and the question card

---

## 2026-07-03 — Add pagination to Dashboard session history

**What:** Replaced the fixed-height scrollable container in the Interview History panel with proper client-side pagination. Sessions are now shown 5 per page. A pagination bar appears below the list whenever there are more than 5 sessions; it displays Prev and Next buttons, numbered page buttons (highlighted in cyan for the active page), and a "Showing X–Y of Z sessions" counter. The active page is clamped to `totalPages` so the display stays correct if sessions are added while the component is mounted. No backend changes were required — all sessions are already fetched in one request and sliced client-side.

**Why:** The previous approach used `max-h-[500px] overflow-y-auto` which hides older sessions behind an awkward scroll area inside the card. As a user's history grows, this becomes harder to scan. Pagination gives each page of results a clean, full-height layout, makes it easy to navigate to older sessions without scrolling inside a nested container, and is the standard UX pattern for history lists.

**Files changed:**
- `client/src/pages/Dashboard.jsx` — added `ChevronLeft` and `ChevronRight` icon imports; added `SESSIONS_PER_PAGE` constant; added `currentPage` state; derived `totalPages`, `safePage`, `pageStart`, and `paginatedSessions`; replaced the `max-h/overflow-y-auto` session list with a paginated list wrapped in a React fragment; added the pagination controls bar (Prev button, numbered page buttons, Next button, session count label) below the list

---

## 2026-07-02 — Add loading skeletons to Dashboard

**What:** Replaced the spinner loading state in the Dashboard with animated skeleton placeholders that match the structure of the real content. The Interview History panel now shows three `SessionCardSkeleton` components — pulsing placeholder shapes for the role title, difficulty badge, focus line, date/questions metadata, score area, and action button — while sessions are being fetched from the API. The three metric cards (Total Interviews, Completed Sessions, Average Performance) also show a pulsing rectangular skeleton block in place of the number until the data has loaded, preventing the jarring flash of "0" values.

**Why:** A blank spinner gives no hint of what content is coming and can feel slower than it actually is. Skeleton screens match the approximate layout of the final content so the page feels faster and more responsive. This directly addresses the "loading skeletons instead of blank screens" item in the project's Priority #2 (UI/UX improvements) list and required no new dependencies — Tailwind's built-in `animate-pulse` utility handles the animation.

**Files changed:**
- `client/src/pages/Dashboard.jsx` — added `SessionCardSkeleton` functional component above `Dashboard`; replaced the spinner `<div>` in the history panel with `[...Array(3)].map(...)` skeleton renders; replaced hard-coded metric values in all three stat cards with conditional skeleton blocks when `fetching === true`

---

## 2026-07-01 — Add live session timer to InterviewRoom

**What:** Added a live elapsed-time counter to the InterviewRoom page that starts automatically when the interview session loads and stops when the user submits the interview. The timer is displayed inline in the session metadata header alongside the difficulty and focus labels, formatted as MM:SS using monospaced digits for readability. It is driven by a `setInterval` stored in a `useRef` so it is properly cleaned up on unmount and cancelled immediately when the submit flow begins, preventing any state updates after navigation.

**Why:** Real interviews are time-bounded. Having a visible clock in the interview room gives users an accurate sense of how long they are spending on their mock session and builds the habit of pacing answers under realistic time pressure. It is a zero-cost, zero-dependency improvement that directly addresses the "timer" item in the project's Priority #1 (new interview features) list.

**Files changed:**
- `client/src/pages/InterviewRoom.jsx` — added `useRef` and `Timer` imports, `elapsedSeconds` state, `timerRef`, a new `useEffect` that starts/stops the interval on session load/unmount, a `formatElapsed` helper, timer display in the header metadata, and `clearInterval(timerRef.current)` at the start of `handleSubmitInterview`

---

## 2026-07-01 — Add "Copy Feedback Report" button to FeedbackView

**What:** Added a "Copy Feedback Report" button to the bottom of the FeedbackView page. Clicking the button formats the entire interview feedback session — including the overall score, rating label, AI summary, and a full per-question breakdown (user answer, AI feedback, and suggested answer) — into a clean plain-text report and copies it to the clipboard via the Web Clipboard API. The button shows a green "Copied!" confirmation state with a checkmark icon for 2.5 seconds after a successful copy, then resets. The icon switches between a `Copy` icon (idle) and `CheckCheck` icon (confirmed) using lucide-react.

**Why:** Users completing a mock interview session have no way to save or share their AI feedback outside the browser. A copy-to-clipboard button lets them paste the report into notes, a portfolio, a message to a mentor, or any personal tracking document — making the feedback immediately portable and useful beyond the session. This fills a gap that was explicitly called out in the project's priority list and adds zero new dependencies.

**Files changed:**
- `client/src/pages/FeedbackView.jsx` — added `Copy` and `CheckCheck` icon imports, `copied` state, `handleCopyFeedback` async function, and the copy button in the actions footer
