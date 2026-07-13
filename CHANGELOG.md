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
