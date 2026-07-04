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
