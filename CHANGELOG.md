## 2026-08-01 — Add question type filter to Dashboard interview history

**What:** Added a question type filter pill row to the Interview History panel on the Dashboard. Users can now narrow their session history to a specific question category: **Any Type** (default, shows all sessions), **Technical**, **Behavioral**, **Mixed**, or **System Design**. The filter row appears below the existing status and difficulty pill rows, using violet-coloured active pills to visually distinguish the type filter from the cyan status/difficulty pills and the amber starred filter. The question type filter composes with all other filters — search, status, difficulty, and sort — so every combination works correctly (e.g., "Completed + Advanced + Behavioral" shows only completed advanced behavioral sessions). Selecting a type filter resets pagination to page 1, matching the behaviour of every other filter control. The new filter is included in `hasActiveFilters` so the "Clear" button appears whenever it is active, and `clearFilters` resets it to "Any Type" alongside the other controls. Sessions created before the question type field was introduced (before 2026-07-17) default to "Technical" in the filter logic, matching the existing display behaviour elsewhere in the app. No new npm dependencies and no backend changes were required — all filtering is done client-side on the already-fetched session array.

**Why:** The session history panel already had search, status, difficulty, sort, and starring — but no way to isolate sessions by question category. As users accumulate sessions across Technical, Behavioral, Mixed, and System Design types, finding all their behavioral sessions to review STAR-method practice requires scrolling or remembering which sessions were which type. The question type filter closes that gap directly: one click on "Behavioral" shows only behavioral sessions, and the type badge already visible on each card confirms the match at a glance. The violet colour for the active type pill is deliberately distinct from the cyan difficulty/status pills, making it easy to see at a glance which dimensions are currently filtered. This addresses the "Add a question category filter" item listed in the AGENT_INSTRUCTIONS example changes and is the natural completion of the filter system that was introduced incrementally across earlier runs.

**Files changed:**
- `client/src/pages/Dashboard.jsx` — added `questionTypeFilter` state (default `'all'`); added `questionTypeFilter` to the `useEffect` dependency array that resets `currentPage`; updated `filteredSessions` derivation to include `matchesType` check (`(s.questionType || 'Technical') === questionTypeFilter` when not `'all'`); updated `hasActiveFilters` to include `questionTypeFilter !== 'all'`; updated `clearFilters` to reset `questionTypeFilter`; added question type filter pill row (5 options: Any Type, Technical, Behavioral, Mixed, System Design) in the filter area, below the status/difficulty row, with violet active styling and the "Clear" button moved into this row's end

---

## 2026-07-31 — Add "Download Report" button to FeedbackView

**What:** Added a "Download Report" button to the actions footer of the FeedbackView page, placed between the existing "Copy Feedback Report" and "Retry Same Settings" buttons. Clicking it generates the same plain-text feedback report that the clipboard button already produces — role, difficulty, focus, date, overall score, AI summary, personal notes (if any), and the full per-question breakdown with user answers, AI feedback, and suggested answers — and triggers a browser file download rather than a clipboard write. The file is saved as a `.txt` file with a descriptive, URL-safe filename: `interview-feedback-<role>-<date>.txt` (e.g. `interview-feedback-senior-frontend-engineer-2026-07-31.txt`). The button shows a green "Downloaded!" confirmation with a checkmark icon for 2.5 seconds after the download is triggered, then resets — matching the same visual feedback pattern used by the "Copied!" state. The existing clipboard logic was refactored: a shared `buildReportText()` helper function generates the report text, and both `handleCopyFeedback` and `handleDownloadFeedback` call it, so the two export paths stay in sync automatically with no duplication. No new npm dependencies were required — the download is implemented with the standard Web Blob API (`new Blob`, `URL.createObjectURL`, a dynamically created anchor element with a `download` attribute).

**Why:** The clipboard copy button is useful for pasting feedback into notes, messages, or another app immediately after a session — but clipboard contents are ephemeral and get replaced the moment the user copies something else. Many users will want to keep a permanent record of their feedback: build a personal archive of past sessions, submit it to a mentor for review, attach it to a job-application journal, or refer back to it days or weeks later without having to re-open the app. A file download solves exactly that: the `.txt` file lands in the user's downloads folder and stays there indefinitely. By reusing the same `buildReportText()` logic as the copy button, the download is guaranteed to always produce identical output — there is no divergence between what you copy and what you download. This addresses the "UI/UX improvements" priority area from AGENT_INSTRUCTIONS and the "Add a 'copy to clipboard' button" spirit extended to persistent storage.

**Files changed:**
- `client/src/pages/FeedbackView.jsx` — added `Download` to lucide-react imports; added `downloaded` state variable; extracted report-text generation into a `buildReportText()` helper; refactored `handleCopyFeedback` to call `buildReportText()`; added `handleDownloadFeedback` function (Blob creation, `URL.createObjectURL`, anchor click, `URL.revokeObjectURL`, downloaded state feedback); added "Download Report" button JSX in the actions footer with idle/downloaded visual states

---

## 2026-07-30 — Add "Your Progress" session comparison panel to FeedbackView

**What:** Added a "Your Progress" panel to the FeedbackView page, placed between the AI feedback summary and the Score Breakdown section. The panel contains three stat tiles: **vs. Last Session** (the numeric difference between the current score and the most-recent prior completed session, coloured emerald if improved, rose if declined, and neutral if unchanged), **vs. Your Average** (the difference between the current score and the mean score across all other completed sessions), and **Personal Best** (the highest score ever achieved — highlighted in emerald with a "New record!" label if the current session beats it, amber otherwise). Each tile shows the relevant base value in small text below the headline number (e.g. "was 67%" or "avg. 63%"). A subtitle in the panel header shows how many sessions were used for comparison. The panel only renders after the history request completes, so it never blocks the primary feedback content. It does not render at all when the user has no other completed sessions (i.e. on their first completed session). No new npm dependencies were required and no backend changes were needed — the data comes from the existing `GET /api/sessions` endpoint, which is already used by the Dashboard.

**Why:** After completing an interview, users want immediate context: "did I do better this time?" is the first question that comes to mind after seeing a score. Without comparison data, a score of 72% is just a number — it could be a personal best or a significant drop, and there is no way to know from the FeedbackView page alone. The "Your Progress" panel answers all three natural comparison questions in one place: how this session stacks up against the last one (short-term trend), against the overall average (general level), and against the personal best (peak achievement). Surfacing a "New record!" label when the user achieves a new high score adds a small but meaningful moment of positive reinforcement that rewards effort. This addresses the "New interview features — scoring" priority area from AGENT_INSTRUCTIONS.

**Files changed:**
- `client/src/pages/FeedbackView.jsx` — imported `getUserSessions` from sessionService; added `otherSessions` and `historyLoaded` state; added a second `useEffect` (keyed on `session` and `id`) that fires after the main session loads, fetches all completed sessions excluding the current one, and stores them with a cancellation guard; added `prevSession`, `prevScore`, `allOtherScores`, `avgOtherScore`, `bestOtherScore`, `isNewBest`, `displayBest`, `scoreVsLast`, `scoreVsAvg` derived values; added the "Your Progress" panel JSX between the Summary Section and Per-Question Score Breakdown

---

## 2026-07-29 — Add personal notes to completed interview sessions

**What:** Added a "Personal Notes" card to the FeedbackView page, placed between the Coaching Insights panel and the Question Breakdown accordion. The card contains a resizable textarea (max 2000 characters) pre-seeded from any previously saved notes, a live character counter that turns rose-coloured when approaching the limit, a placeholder prompt ("Jot down what you learned, what tripped you up, or what to review before your next session…"), and a "Save Notes" button. The button shows a spinning loader while the PATCH request is in flight, then switches to a green "Saved" confirmation for three seconds before resetting — the same pattern used by the star button. Notes are stored in a new `notes` field on the `InterviewSession` Mongoose model (String, optional, max 2000 chars, default `''`), persisted via a new `PATCH /api/sessions/:id/notes` endpoint. The notes text is also included in the "Copy Feedback Report" clipboard export: when non-empty, a "PERSONAL NOTES" section is inserted between the AI summary and the question breakdown in the plain-text report. On the Dashboard, any session card that has at least one character of notes now shows a small violet `FileText` icon next to the role title (alongside the existing amber star), so users can see at a glance which sessions they have annotated. No new npm dependencies were required.

**Why:** After completing a session, users have access to AI feedback per question but no way to record their own thoughts alongside it — "I blanked on closures because I forgot lexical scope", "need to re-read the CAP theorem", "my STAR story for teamwork was too vague". Personal notes fill that gap: they sit next to the AI evaluation in the same view and survive page reloads, so the session becomes a complete learning record rather than just an AI report. The violet FileText badge on the Dashboard gives immediate visual feedback that a session has been annotated, making it easier to return to sessions that already have context. This addresses the "code quality / developer experience" and "UI/UX improvements" priority areas and required only one new Mongoose field, one new backend route, and one new frontend card.

**Files changed:**
- `server/models/InterviewSession.js` — added `notes: { type: String, default: '', maxlength: 2000 }` field
- `server/controllers/sessionController.js` — added `updateSessionNotes` controller: validates notes is a string, verifies ownership, slices to 2000 chars, saves, returns `{ success, notes }`
- `server/routes/sessionRoutes.js` — imported `updateSessionNotes`; added `router.route('/:id/notes').patch(updateSessionNotes)`
- `client/src/services/sessionService.js` — added `updateSessionNotes(sessionId, notes)` that calls `api.patch`
- `client/src/pages/FeedbackView.jsx` — added `PenLine`, `CheckCircle` to lucide-react imports; imported `updateSessionNotes` from service; added `notes`, `savingNotes`, `notesSaved` state; seeded `notes` from `data.session.notes` in `useEffect`; added `handleSaveNotes` async handler; added Personal Notes card JSX (textarea, char counter, save button with spinner/saved states) between Coaching Insights and Question Breakdown; updated `handleCopyFeedback` to include a PERSONAL NOTES section when notes are non-empty
- `client/src/pages/Dashboard.jsx` — added `FileText` to lucide-react imports; added violet `FileText` icon badge next to role title on session cards that have non-empty notes

---

## 2026-07-28 — Add sort controls to Dashboard session history

**What:** Added a sort dropdown to the Interview History panel on the Dashboard, placed inline with the search box on the same row. Users can now order their session list by six criteria: **Newest first** (default, newest session at the top — the existing behaviour), **Oldest first** (chronological order), **Score: high → low** (best-performing sessions surface at the top; in-progress sessions with no score appear last), **Score: low → high** (lowest scores first — useful for finding sessions to revisit; in-progress sessions appear last), **Role: A → Z**, and **Role: Z → A** (alphabetical by job role name). The sort is applied after all existing filters (search query, status, difficulty, and starred), so every combination of filter + sort works correctly. Changing the sort resets pagination to page 1, matching the same behaviour as all other filter controls. The sort state is tracked in a `sortBy` React state variable (default `'date-desc'`); the sorted list is derived client-side from the already-fetched sessions array, so no new API calls or backend changes were needed. The dropdown is styled as a compact pill that matches the dark-card design language — a translucent background, `border-white/10`, and a small `ArrowUpDown` icon to its left as a visual affordance. The `select` element uses `bg-transparent` so it blends into the container; the `text-slate-300` value colour makes the selected option readable without competing with the main content.

**Why:** The Dashboard already had search by role/tech-stack and filter pills for status, difficulty, and starred — but no way to control the order in which sessions appear. For users with a long history this is a meaningful gap: someone who wants to find their best-ever session has to scan through the list or rely on memory, and someone reviewing a low-scoring attempt has no quick way to surface it. Sort by score is the most direct answer to both cases. Sort by oldest-first supports a different workflow — reviewing progress in chronological order — and sort by role makes it easy to group similar sessions visually when the search query is cleared. Adding sort as a single dropdown (rather than split A→Z / Z→A buttons) keeps the filter bar compact and puts all ordering options in one predictable place. This addresses the "UI/UX improvements" priority area from AGENT_INSTRUCTIONS and required zero backend changes and zero new npm dependencies.

**Files changed:**
- `client/src/pages/Dashboard.jsx` — added `ArrowUpDown` to the lucide-react import; added `sortBy` state (default `'date-desc'`); added `sortBy` to the `useEffect` dependencies that reset `currentPage` to 1; added `sortedSessions` derivation (a `[...filteredSessions].sort(...)` with a switch over the six sort keys); updated pagination to operate on `sortedSessions`; updated the "Showing X–Y of Z" counter to reference `sortedSessions.length`; wrapped the search box in a `flex` row and added the sort dropdown (icon + `<select>`) as a sibling element

---

## 2026-07-27 — Add session starring with Starred filter to Dashboard

**What:** Added a star/bookmark system to interview sessions. Every session card in the Dashboard now shows a small star icon button on the right side of the card (between the session metadata and the action buttons). Clicking the star toggles it filled amber (starred) or unfilled (unstarred); the state is persisted to the database immediately via a new `PATCH /api/sessions/:id/star` endpoint, so the star survives page reloads and cross-device visits. A small filled amber star also appears inline next to the session role title on any starred card, making starred sessions easy to spot while browsing the full history list. The status filter pill row — which already had "All", "In Progress", and "Completed" — now includes a fourth option: **★ Starred** (styled in amber when active). Selecting it shows only starred sessions regardless of their status or difficulty. If the Starred filter is active but no sessions have been starred yet, a dedicated empty state message is shown ("No starred sessions yet — click the star icon…") instead of the generic "no filters match" message. The `starred` field is added to the `InterviewSession` Mongoose model as an optional Boolean defaulting to `false`, so all existing sessions silently inherit the un-starred default without a migration. No new npm dependencies were required.

**Why:** As users accumulate a long history of sessions, finding specific ones to review becomes harder even with search and filters. Starring addresses a natural workflow: a user who did a particularly challenging session — perhaps their first Advanced System Design attempt, or a session where they scored unexpectedly well — has no way today to mark it for quick return. The star button gives them a one-click bookmark that persists, and the Starred filter lets them jump straight to their curated list without scrolling or searching. This is the same "favorites" pattern used throughout productivity tools (GitHub stars, Notion favorites, Trello watching) and integrates cleanly into the existing filter system without any new pages or routes.

**Files changed:**
- `server/models/InterviewSession.js` — added `starred: { type: Boolean, default: false }` field
- `server/controllers/sessionController.js` — added `toggleStarSession` controller: verifies ownership, flips `session.starred`, saves, returns `{ success, starred }`
- `server/routes/sessionRoutes.js` — imported `toggleStarSession`; added `router.route('/:id/star').patch(toggleStarSession)`
- `client/src/services/sessionService.js` — added `toggleStarSession(sessionId)` that calls `api.patch`
- `client/src/pages/Dashboard.jsx` — added `Star` to lucide-react imports; imported `toggleStarSession` from service; added `starringId` state; added `handleToggleStar` async handler; added star button to each session card; added filled star badge next to role name on starred cards; added `'starred'` to the status filter pill array (amber styling when active); updated `filteredSessions` to handle `statusFilter === 'starred'`; added star-specific empty-state block when the Starred filter returns no results

---

## 2026-07-26 — Add Practice Streak Counter with 30-day activity grid to Dashboard

**What:** Added a `StreakCounter` component to the Dashboard, placed between the three summary stat cards and the Performance Trend chart. The widget has three sections. The left side shows a Flame icon (orange when a streak is active, muted grey when no streak) alongside the current streak number in large bold text and a contextual sub-label ("Good start — come back tomorrow!" for a 1-day streak, "You're on a roll!" for longer, and "Practice today to start your streak!" when no streak is active). The right side shows two compact stat tiles: **Best** (amber, the longest consecutive-day streak ever recorded in the account) and **Days** (cyan, the total number of unique calendar days on which at least one session was started, including in-progress sessions). Below the header row, a **30-day activity dot grid** renders one square per calendar day for the last 30 days — cyan filled squares for days with at least one session, dim bordered squares for days with no activity. The dot for today has a cyan ring so users can immediately orient themselves. Each dot shows a tooltip on hover (e.g. "Jul 25 — practiced"). The component renders an animated skeleton while sessions are loading and returns `null` when the user has no sessions at all (never shows an empty zero-state to brand-new users). Streak calculation uses the ISO date string of each session's `createdAt` field, so the "start of day" boundary is consistent regardless of the viewer's timezone. The current streak counts today as active if today already has a session; otherwise it checks from yesterday, so the streak does not reset the moment midnight passes before the user has had a chance to practice. The full component is ~110 lines of pure JSX/JS with no new dependencies.

**Why:** Users who practise daily have no visible reward for that consistency — the Dashboard showed their cumulative totals and trend chart but gave no indication of how many days in a row they had kept up the habit. A streak counter is one of the most proven motivational mechanics in learning apps (Duolingo, GitHub contributions, LeetCode streaks): it creates a concrete daily goal ("don't break the streak") that keeps users coming back even on low-motivation days. The 30-day activity grid makes past consistency visible at a glance — a dense grid of cyan dots is immediately satisfying and encouraging; a sparse grid signals where practice has lapsed. Together the streak count, best streak, total days, and activity grid give users a richer sense of their practice habits than the score-based trend chart alone. This addresses the "New interview features — scoring" item from Priority Area #1 in AGENT_INSTRUCTIONS (interpreted as gamification/engagement features), required zero backend changes and zero new npm dependencies, and is fully consistent with the existing card-and-panel visual style of the Dashboard.

**Files changed:**
- `client/src/pages/Dashboard.jsx` — added `Flame` to the lucide-react import; added `StreakCounter` functional component (loading skeleton variant + data-driven variant with streak calculation, longest-streak derivation, and 30-day activity dot grid); inserted `<StreakCounter sessions={sessions} loading={fetching} />` between the metrics grid and the PerformanceTrend chart

---

## 2026-07-25 — Add contextual helper text and estimated duration to the New Interview form

**What:** Added informative helper text and a live estimated session duration to the New Interview form on the Dashboard. Each selector now shows a brief description of the currently selected option: clicking **Beginner** reveals "Entry-level questions covering core concepts. Ideal for students or early-career candidates.", **Intermediate** shows a mid-level explanation, and **Advanced** explains that senior-level trade-off questions are included. Similarly, each **Question Type** pill — Technical, Behavioral, Mixed, and System Design — displays a one-sentence summary below the selector grid describing what kind of questions the AI will generate. The **Tech Stack** field gained a helper line ("Comma-separated topics — the AI tailors every question to your stack.") and its label now visually distinguishes the `(Optional)` qualifier in a lighter shade. Most notably, the previously empty second column of the questions-count row is now filled with an **Est. Duration** display: a clock icon and a time range that updates instantly as the user changes the questions count (`3 → ~5–8 min`, `5 → ~8–12 min`, `7 → ~12–18 min`, `10 → ~18–25 min`), giving users an at-a-glance sense of how long their session will take before they start. No new dependencies were required — descriptions are plain JS objects and the duration display reuses the already-imported `Clock` lucide-react icon.

**Why:** New users — and returning users choosing an unfamiliar question type — have no way to know what they're committing to before clicking "Generate AI Interview". Someone choosing "Behavioral" might not know it uses the STAR format; someone picking "Advanced" might not realise the questions probe architectural trade-offs rather than basic syntax. And no user can tell whether they have time for a 10-question session without already knowing the app's pacing. The helper text resolves all three gaps without adding any modals, popovers, or new UI patterns — just descriptive text that appears in context, exactly where the user is looking. This directly addresses the "Add tooltip or helper text to form fields" item listed in the AGENT_INSTRUCTIONS example changes and makes every option self-documenting.

**Files changed:**
- `client/src/pages/Dashboard.jsx` — added `DIFFICULTY_DESCRIPTIONS`, `QUESTION_TYPE_DESCRIPTIONS`, and `ESTIMATED_TIME` constant objects above the component; added conditional `<p>` description below the difficulty pill grid; added conditional `<p>` description below the question type pill grid; added helper text below the tech stack input; added `Est. Duration` display in the second column of the questions-count grid row

---

## 2026-07-24 — Add User Profile page with stats and editable display name

**What:** Added a `/profile` page that gives each user a dedicated overview of their account and interview history. The page has three main sections. The **profile header** shows the user's initials in a gradient avatar circle, their display name with an inline pencil-icon edit button (saves via `PUT /api/auth/profile`), their email (read-only), and the month/year they joined. Pressing Enter or clicking Save commits the change, Escape cancels it; a "Name updated" confirmation appears inline for 3 seconds on success. The **stats panels** display two rows of stat cards: the primary row shows Total Sessions, Completed, Average Score (color-coded by tier), and Best Score; the secondary row shows In Progress, total Practice Time (summed from `duration` fields, hidden when zero), and Scored Sessions count. Below the stat cards, two horizontal bar charts show sessions grouped by **Difficulty** (Beginner / Intermediate / Advanced) and **Question Type** (Technical / Behavioral / Mixed / System Design), each bar scaled proportionally to the largest bucket. A **Top Roles Practiced** panel lists up to 6 roles as pill chips with a session-count badge on each. An empty-state card with a "Start First Interview" shortcut appears when the user has no sessions. On the backend, a new `PUT /api/auth/profile` endpoint accepts a `name` field, validates it (min 2 chars, Mongoose validators), and returns the updated user object. The `updateUser` helper was added to `AuthContext` so the Navbar's username chip and any other consumer of `user.name` update immediately after a save without a page reload. The Navbar's username chip was also changed from a plain `<div>` to a `<Link to="/profile">` so users can reach the new page with one click.

**Why:** Until now there was no way to update a display name after registration — a user who misspelled their name at sign-up was stuck with it permanently. There was also no single place to see a career-level summary of practice activity: the Dashboard shows a session list and a score trend, but gives no breakdown by difficulty or question type, no total practice time, and no indication of which roles you've drilled most. The Profile page fills both gaps with zero new dependencies, one new backend route, and a client-side data derivation that reuses the existing `GET /api/sessions` response. It directly addresses the "UI/UX improvements" and "developer experience" priority areas and provides the account-management foundation for future features (avatar upload, password change, etc.).

**Files changed:**
- `server/controllers/authController.js` — added `updateProfile` export: validates `name`, calls `findByIdAndUpdate` with `runValidators: true`, returns updated user fields
- `server/routes/authRoutes.js` — imported `updateProfile`; added `router.put('/profile', protect, updateProfile)`
- `client/src/services/authService.js` — added `updateProfile(name)` that calls `api.put('/auth/profile', { name })`
- `client/src/context/AuthContext.jsx` — added `updateUser(fields)` method that merges fields into local user state; exposed in context value
- `client/src/pages/Profile.jsx` — new page: profile header with avatar initials, inline name editor, email/join date; primary and secondary stat card rows; difficulty and question-type bar charts; top-roles pill panel; empty state
- `client/src/App.jsx` — imported `Profile`; added `<Route path="/profile">` wrapped in `ProtectedRoute`
- `client/src/components/Navbar.jsx` — changed username chip from `<div>` to `<Link to="/profile">` with hover style

---

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
