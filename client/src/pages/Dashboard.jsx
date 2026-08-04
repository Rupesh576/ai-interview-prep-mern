import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Play, Award, ClipboardList, BookOpen, Clock, AlertCircle, ChevronLeft, ChevronRight, Search, X, RotateCcw, Timer, TrendingUp, Trash2, Flame, Star, ArrowUpDown, FileText, Download, Target, Sparkles } from 'lucide-react';
import { createSession, getUserSessions, deleteSession, toggleStarSession } from '../services/sessionService';

const SessionCardSkeleton = () => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border border-white/5 bg-white/5 p-4 animate-pulse">
    <div className="space-y-2 flex-1">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="h-5 w-36 rounded bg-white/10" />
        <div className="h-4 w-20 rounded-full bg-white/10" />
      </div>
      <div className="h-3 w-44 rounded bg-white/10" />
      <div className="flex items-center gap-3">
        <div className="h-3 w-24 rounded bg-white/10" />
        <div className="h-3 w-4 rounded bg-white/10" />
        <div className="h-3 w-16 rounded bg-white/10" />
      </div>
    </div>
    <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
      <div className="flex flex-col items-end gap-1">
        <div className="h-3 w-8 rounded bg-white/10" />
        <div className="h-6 w-10 rounded bg-white/10" />
      </div>
      <div className="h-9 w-24 rounded-lg bg-white/10" />
    </div>
  </div>
);

const PerformanceTrend = ({ sessions, loading }) => {
  if (loading) {
    return (
      <div className="mb-10 rounded-xl border border-white/10 bg-white/5 p-6 animate-pulse">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="h-4 w-44 rounded bg-white/10" />
          <div className="h-4 w-52 rounded bg-white/10" />
        </div>
        <div className="h-20 w-full rounded bg-white/10" />
        <div className="mt-2 flex gap-1">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-3 flex-1 rounded bg-white/10" />
          ))}
        </div>
      </div>
    );
  }

  const data = sessions
    .filter((s) => s.status === 'completed' && typeof s.overallScore === 'number')
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .slice(-8);

  if (data.length < 2) return null;

  const n = data.length;
  const VW = 800;
  const VH = 100;
  const PX = 28;
  const PY = 14;
  const cW = VW - PX * 2;
  const cH = VH - PY * 2;

  const ptX = (i) => (PX + (i / (n - 1)) * cW).toFixed(1);
  const ptY = (score) => (PY + cH - (score / 100) * cH).toFixed(1);

  const linePts = data
    .map((s, i) => `${i === 0 ? 'M' : 'L'}${ptX(i)},${ptY(s.overallScore)}`)
    .join(' ');
  const areaFill = `${linePts} L${ptX(n - 1)},${VH - PY} L${ptX(0)},${VH - PY}Z`;

  const latest = data[n - 1].overallScore;
  const prev = data[n - 2].overallScore;
  const diff = latest - prev;
  const best = Math.max(...data.map((s) => s.overallScore));

  const dotColor = (score) =>
    score >= 80 ? '#34d399' : score >= 60 ? '#fbbf24' : '#f87171';
  const latestCls =
    latest >= 80 ? 'text-emerald-400' : latest >= 60 ? 'text-amber-400' : 'text-rose-400';

  return (
    <div className="mb-10 rounded-xl border border-white/10 bg-white/5 p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <TrendingUp size={16} className="text-cyan-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            Performance Trend
          </h3>
          <span className="text-xs text-slate-600">last {n} sessions</span>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <span className="text-slate-500">
            Best <strong className="ml-1 text-emerald-400">{best}%</strong>
          </span>
          <span className="text-slate-500">
            Latest <strong className={`ml-1 ${latestCls}`}>{latest}%</strong>
          </span>
          {diff !== 0 && (
            <span
              className={`font-semibold tabular-nums ${
                diff > 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {diff > 0 ? `↑ +${diff}` : `↓ ${diff}`} vs prev
            </span>
          )}
        </div>
      </div>

      <svg
        viewBox={`0 0 ${VW} ${VH}`}
        className="w-full h-auto"
        preserveAspectRatio="xMidYMid meet"
        aria-label="Performance trend chart"
      >
        {/* Horizontal reference lines at 25%, 50%, 75% */}
        {[25, 50, 75].map((v) => (
          <line
            key={v}
            x1={PX}
            y1={ptY(v)}
            x2={VW - PX}
            y2={ptY(v)}
            stroke="white"
            strokeOpacity="0.07"
            strokeWidth="1"
            strokeDasharray="5 5"
          />
        ))}

        {/* Area fill beneath the trend line */}
        <path d={areaFill} fill="rgba(34,211,238,0.06)" />

        {/* Trend line */}
        <path
          d={linePts}
          fill="none"
          stroke="rgba(34,211,238,0.5)"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Data-point circles */}
        {data.map((s, i) => (
          <circle
            key={i}
            cx={ptX(i)}
            cy={ptY(s.overallScore)}
            r="6"
            fill={dotColor(s.overallScore)}
            stroke="#0f172a"
            strokeWidth="2.5"
          />
        ))}

        {/* Score labels above each dot */}
        {data.map((s, i) => (
          <text
            key={`lbl-${i}`}
            x={ptX(i)}
            y={Number(ptY(s.overallScore)) - 10}
            textAnchor="middle"
            fill="rgba(255,255,255,0.55)"
            fontSize="10"
            fontWeight="600"
            fontFamily="ui-monospace, monospace"
          >
            {s.overallScore}
          </text>
        ))}
      </svg>

      {/* X-axis date labels */}
      <div className="mt-2 flex">
        {data.map((s, i) => (
          <div
            key={i}
            className="flex-1 truncate text-center text-xs text-slate-600 px-0.5"
          >
            {new Date(s.createdAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

const StreakCounter = ({ sessions, loading }) => {
  if (loading) {
    return (
      <div className="mb-10 rounded-xl border border-white/10 bg-white/5 p-6 animate-pulse">
        <div className="flex flex-wrap items-center justify-between gap-6 mb-5">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-white/10" />
            <div className="space-y-2">
              <div className="h-8 w-20 rounded bg-white/10" />
              <div className="h-3 w-36 rounded bg-white/10" />
            </div>
          </div>
          <div className="flex gap-3">
            <div className="h-14 w-20 rounded-lg bg-white/10" />
            <div className="h-14 w-20 rounded-lg bg-white/10" />
          </div>
        </div>
        <div className="h-3 w-24 rounded bg-white/10 mb-2" />
        <div className="flex gap-1">
          {[...Array(30)].map((_, i) => (
            <div key={i} className="h-5 w-5 rounded-sm bg-white/10 flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  // Collect unique session dates as YYYY-MM-DD strings
  const sessionDaySet = new Set();
  sessions.forEach((s) => {
    sessionDaySet.add(new Date(s.createdAt).toISOString().split('T')[0]);
  });

  if (sessionDaySet.size === 0) return null;

  // Current streak: count consecutive days ending today (or yesterday if today is empty)
  const todayStr = new Date().toISOString().split('T')[0];
  const checkDate = new Date(todayStr + 'T00:00:00');
  if (!sessionDaySet.has(todayStr)) checkDate.setDate(checkDate.getDate() - 1);
  let currentStreak = 0;
  while (sessionDaySet.has(checkDate.toISOString().split('T')[0])) {
    currentStreak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  // Longest streak ever
  const sortedDays = [...sessionDaySet].sort();
  let longestStreak = 0;
  let tempStreak = 0;
  for (let i = 0; i < sortedDays.length; i++) {
    if (i === 0) {
      tempStreak = 1;
    } else {
      const diffDays = Math.round(
        (new Date(sortedDays[i] + 'T00:00:00') - new Date(sortedDays[i - 1] + 'T00:00:00')) /
          (1000 * 60 * 60 * 24)
      );
      tempStreak = diffDays === 1 ? tempStreak + 1 : 1;
    }
    longestStreak = Math.max(longestStreak, tempStreak);
  }

  // 30-day activity dot grid (index 0 = 29 days ago, index 29 = today)
  const todayDate = new Date(todayStr + 'T00:00:00');
  const thirtyDays = Array.from({ length: 30 }, (_, offset) => {
    const d = new Date(todayDate);
    d.setDate(d.getDate() - (29 - offset));
    const dayStr = d.toISOString().split('T')[0];
    return {
      dayStr,
      hasSession: sessionDaySet.has(dayStr),
      isToday: offset === 29,
      label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    };
  });

  const streakActive = currentStreak > 0;

  return (
    <div className="mb-10 rounded-xl border border-white/10 bg-white/5 p-6">
      <div className="flex flex-wrap items-center justify-between gap-6 mb-5">
        {/* Flame icon + streak count */}
        <div className="flex items-center gap-4">
          <div
            className={`rounded-xl p-2.5 ${
              streakActive ? 'bg-orange-400/15 text-orange-400' : 'bg-white/5 text-slate-600'
            }`}
          >
            <Flame size={24} />
          </div>
          <div>
            <div className="flex items-end gap-1.5">
              <span
                className={`text-4xl font-bold tabular-nums leading-none ${
                  streakActive ? 'text-white' : 'text-slate-500'
                }`}
              >
                {currentStreak}
              </span>
              <span className="text-slate-400 font-semibold text-sm mb-0.5">day streak</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {streakActive
                ? currentStreak === 1
                  ? 'Good start — come back tomorrow!'
                  : "You're on a roll! Keep practising daily."
                : 'Practice today to start your streak!'}
            </p>
          </div>
        </div>

        {/* Best and total unique days */}
        <div className="flex gap-3">
          <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-center min-w-[72px]">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Best</p>
            <p className="mt-0.5 text-2xl font-bold tabular-nums text-amber-400">{longestStreak}</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-center min-w-[72px]">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Days</p>
            <p className="mt-0.5 text-2xl font-bold tabular-nums text-cyan-400">{sessionDaySet.size}</p>
          </div>
        </div>
      </div>

      {/* 30-day activity dot grid */}
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-600">Last 30 days</p>
      <div className="flex gap-1 flex-wrap">
        {thirtyDays.map(({ dayStr, hasSession, isToday, label }) => (
          <div
            key={dayStr}
            title={`${label}${hasSession ? ' — practiced' : ''}`}
            className={`h-5 w-5 flex-shrink-0 rounded-sm transition-colors ${
              hasSession
                ? 'bg-cyan-500 shadow-sm shadow-cyan-500/40'
                : 'border border-white/5 bg-white/5'
            } ${isToday ? 'ring-1 ring-cyan-400 ring-offset-1 ring-offset-slate-900/50' : ''}`}
          />
        ))}
      </div>
      <div className="mt-2 flex select-none justify-between text-xs text-slate-700">
        <span>30 days ago</span>
        <span>Today</span>
      </div>
    </div>
  );
};

const GoalTracker = ({ sessions, loading }) => {
  const [goalScore, setGoalScore] = useState(() => {
    const stored = localStorage.getItem('interviewGoalScore');
    return stored ? parseInt(stored, 10) : null;
  });
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState('');

  if (loading) {
    return (
      <div className="mb-10 rounded-xl border border-white/10 bg-white/5 p-6 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-white/10" />
            <div className="h-3 w-28 rounded bg-white/10" />
          </div>
          <div className="h-3 w-10 rounded bg-white/10" />
        </div>
        <div className="flex items-end gap-4 mb-3">
          <div className="space-y-1.5">
            <div className="h-2.5 w-24 rounded bg-white/10" />
            <div className="h-7 w-16 rounded bg-white/10" />
          </div>
          <div className="h-5 w-6 rounded bg-white/10 mb-1" />
          <div className="space-y-1.5">
            <div className="h-2.5 w-16 rounded bg-white/10" />
            <div className="h-7 w-16 rounded bg-white/10" />
          </div>
        </div>
        <div className="h-2 w-full rounded-full bg-white/10" />
      </div>
    );
  }

  const completedSessions = sessions.filter(
    (s) => s.status === 'completed' && typeof s.overallScore === 'number'
  );
  const avgScore =
    completedSessions.length > 0
      ? Math.round(
          completedSessions.reduce((acc, s) => acc + s.overallScore, 0) /
            completedSessions.length
        )
      : null;

  const handleSetGoal = () => {
    const val = parseInt(inputVal, 10);
    if (isNaN(val) || val < 1 || val > 100) return;
    setGoalScore(val);
    localStorage.setItem('interviewGoalScore', String(val));
    setEditing(false);
    setInputVal('');
  };

  const handleClearGoal = () => {
    setGoalScore(null);
    localStorage.removeItem('interviewGoalScore');
    setEditing(false);
    setInputVal('');
  };

  const goalReached = goalScore !== null && avgScore !== null && avgScore >= goalScore;
  const progress =
    goalScore !== null && avgScore !== null
      ? Math.min(100, Math.round((avgScore / goalScore) * 100))
      : 0;
  const pointsAway = goalScore !== null && avgScore !== null ? goalScore - avgScore : null;

  // Suggest a raised goal that is a multiple of 5
  const suggestedNextGoal =
    goalScore !== null
      ? Math.min(100, goalScore + (5 - (goalScore % 5 === 0 ? 5 : goalScore % 5)))
      : null;

  if (goalScore === null && !editing) {
    return (
      <div className="mb-10 rounded-xl border border-dashed border-white/10 bg-white/5 p-5 flex flex-wrap items-center gap-4">
        <div className="rounded-xl bg-cyan-400/10 p-2.5 text-cyan-400 shrink-0">
          <Target size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-300">Set a practice goal</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Define a target average score to stay motivated and track your progress.
          </p>
        </div>
        <button
          onClick={() => setEditing(true)}
          className="shrink-0 rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-bold text-cyan-400 hover:bg-cyan-400/20 transition"
        >
          Set Goal
        </button>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="mb-10 rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-5 flex flex-wrap items-start gap-4">
        <div className="rounded-xl bg-cyan-400/10 p-2.5 text-cyan-400 shrink-0 mt-0.5">
          <Target size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-300 mb-3">
            Enter your target average score (1–100)
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="number"
              min="1"
              max="100"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSetGoal();
                if (e.key === 'Escape') { setEditing(false); setInputVal(''); }
              }}
              placeholder={goalScore !== null ? String(goalScore) : 'e.g. 75'}
              autoFocus
              className="w-28 rounded-lg border border-cyan-400/30 bg-slate-900/60 py-2 px-3 text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
            />
            <span className="text-slate-500 text-sm">%</span>
            <button
              onClick={handleSetGoal}
              className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-cyan-300 transition"
            >
              Save
            </button>
            <button
              onClick={() => { setEditing(false); setInputVal(''); }}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-400 hover:bg-white/10 transition"
            >
              Cancel
            </button>
            {goalScore !== null && (
              <button
                onClick={handleClearGoal}
                className="text-xs text-slate-500 hover:text-rose-400 transition ml-1"
              >
                Remove goal
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`mb-10 rounded-xl border p-6 ${
        goalReached ? 'border-emerald-400/30 bg-emerald-500/5' : 'border-white/10 bg-white/5'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Target size={16} className={goalReached ? 'text-emerald-400' : 'text-cyan-400'} />
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Practice Goal</h3>
          {goalReached && (
            <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-500/20">
              Goal Reached!
            </span>
          )}
        </div>
        <button
          onClick={() => { setInputVal(String(goalScore)); setEditing(true); }}
          className="text-xs text-slate-500 hover:text-slate-300 transition"
        >
          Edit goal
        </button>
      </div>

      <div className="flex flex-wrap items-end gap-4 mb-3">
        <div>
          <p className="text-xs text-slate-500 mb-0.5">Current average</p>
          <p
            className={`text-2xl font-extrabold tabular-nums leading-none ${
              avgScore === null
                ? 'text-slate-500'
                : avgScore >= 80
                ? 'text-emerald-400'
                : avgScore >= 60
                ? 'text-amber-400'
                : 'text-rose-400'
            }`}
          >
            {avgScore !== null ? `${avgScore}%` : '—'}
          </p>
        </div>
        <span className="text-slate-600 text-lg font-bold mb-0.5">→</span>
        <div>
          <p className="text-xs text-slate-500 mb-0.5">Your goal</p>
          <p
            className={`text-2xl font-extrabold tabular-nums leading-none ${
              goalReached ? 'text-emerald-400' : 'text-cyan-400'
            }`}
          >
            {goalScore}%
          </p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-xs text-slate-500 mb-0.5">Progress</p>
          <p
            className={`text-xl font-bold tabular-nums leading-none ${
              goalReached ? 'text-emerald-400' : 'text-slate-300'
            }`}
          >
            {avgScore !== null ? `${progress}%` : '—'}
          </p>
        </div>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${
            goalReached ? 'bg-emerald-400' : 'bg-cyan-400'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {goalReached ? (
        <p className="mt-2 text-xs text-emerald-500">
          You've hit your target!
          {suggestedNextGoal !== null && suggestedNextGoal > goalScore
            ? ` Try raising your goal to ${suggestedNextGoal}% to keep improving.`
            : ' Outstanding — you\'ve reached the maximum!'}
        </p>
      ) : pointsAway !== null && pointsAway > 0 ? (
        <p className="mt-2 text-xs text-slate-500">
          {pointsAway} point{pointsAway !== 1 ? 's' : ''} away — keep practising!
        </p>
      ) : avgScore === null ? (
        <p className="mt-2 text-xs text-slate-500">
          Complete an interview session to start tracking progress toward your goal.
        </p>
      ) : null}
    </div>
  );
};

const SmartRecommendations = ({ sessions, loading, onApply }) => {
  if (loading) {
    return (
      <div className="mb-10 rounded-xl border border-white/10 bg-white/5 p-6 animate-pulse">
        <div className="mb-5 h-4 w-52 rounded bg-white/10" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-lg border border-white/10 p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="h-8 w-8 rounded-lg bg-white/10" />
                <div className="h-4 w-16 rounded-full bg-white/10" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-36 rounded bg-white/10" />
                <div className="h-3 w-full rounded bg-white/10" />
                <div className="h-3 w-4/5 rounded bg-white/10" />
              </div>
              <div className="h-8 w-28 rounded-lg bg-white/10" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const completed = sessions
    .filter((s) => s.status === 'completed' && typeof s.overallScore === 'number')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (completed.length < 2) return null;

  const recs = [];

  // Difficulty progression recommendation
  const latestDiff = completed[0].difficulty;
  const sameLevel = completed.filter((s) => s.difficulty === latestDiff).slice(0, 5);
  if (sameLevel.length >= 2) {
    const avg = Math.round(sameLevel.reduce((a, s) => a + s.overallScore, 0) / sameLevel.length);
    if (avg >= 76 && latestDiff !== 'Advanced') {
      const next = latestDiff === 'Beginner' ? 'Intermediate' : 'Advanced';
      recs.push({
        color: 'emerald',
        Icon: TrendingUp,
        badge: 'Level Up',
        title: `Try ${next} difficulty`,
        reason: `Your last ${sameLevel.length} ${latestDiff} session${sameLevel.length !== 1 ? 's' : ''} averaged ${avg}% — you're ready for a bigger challenge.`,
        settings: { role: completed[0].role, difficulty: next, questionType: completed[0].questionType || 'Technical' },
      });
    } else if (avg < 55 && latestDiff !== 'Beginner') {
      const lower = latestDiff === 'Advanced' ? 'Intermediate' : 'Beginner';
      recs.push({
        color: 'amber',
        Icon: BookOpen,
        badge: 'Foundation',
        title: `Practice at ${lower}`,
        reason: `Your recent ${latestDiff} session${sameLevel.length !== 1 ? 's' : ''} averaged ${avg}% — consolidating at ${lower} level will sharpen your fundamentals.`,
        settings: { role: completed[0].role, difficulty: lower, questionType: completed[0].questionType || 'Technical' },
      });
    }
  }

  // Question-type diversity recommendation
  const recent5 = completed.slice(0, 5);
  const typeSet = new Set(recent5.map((s) => s.questionType || 'Technical'));
  if (typeSet.size === 1 && recent5.length >= 3) {
    const currentType = [...typeSet][0];
    const suggest =
      currentType === 'Technical'     ? 'Behavioral'    :
      currentType === 'Behavioral'    ? 'Technical'     :
      currentType === 'System Design' ? 'Technical'     : 'System Design';
    recs.push({
      color: 'violet',
      Icon: Award,
      badge: 'Branch Out',
      title: `Try ${suggest} questions`,
      reason: `Your last ${recent5.length} sessions were all ${currentType}. Mixing in ${suggest} rounds out your interview readiness.`,
      settings: { role: completed[0].role, difficulty: completed[0].difficulty, questionType: suggest },
    });
  }

  // Explore-a-new-role recommendation (surfaced when fewer than 2 recs so far)
  if (recs.length < 2) {
    const roleCounts = {};
    completed.forEach((s) => { roleCounts[s.role] = (roleCounts[s.role] || 0) + 1; });
    const sortedRoles = Object.entries(roleCounts).sort((a, b) => b[1] - a[1]);
    if (sortedRoles.length === 1 && sortedRoles[0][1] >= 4) {
      const known = sortedRoles[0][0];
      const altRoles = ['Backend Engineer', 'Full Stack Developer', 'Data Engineer', 'DevOps Engineer', 'ML Engineer', 'Product Manager'];
      const suggestRole = altRoles.find((r) => r.toLowerCase() !== known.toLowerCase()) || 'Backend Engineer';
      recs.push({
        color: 'cyan',
        Icon: Target,
        badge: 'New Territory',
        title: `Explore ${suggestRole}`,
        reason: `You've done ${sortedRoles[0][1]} sessions as "${known}". Practising a different role broadens your job opportunities.`,
        settings: { role: suggestRole, difficulty: completed[0].difficulty, questionType: completed[0].questionType || 'Technical' },
      });
    }
  }

  if (recs.length === 0) return null;

  const palette = {
    emerald: {
      card:  'border-emerald-400/20 bg-emerald-400/5',
      icon:  'bg-emerald-400/15 text-emerald-400',
      badge: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-400',
      btn:   'border-emerald-400/30 bg-emerald-400/5 text-emerald-400 hover:bg-emerald-400/15',
    },
    amber: {
      card:  'border-amber-400/20 bg-amber-400/5',
      icon:  'bg-amber-400/15 text-amber-400',
      badge: 'border-amber-400/30 bg-amber-400/10 text-amber-400',
      btn:   'border-amber-400/30 bg-amber-400/5 text-amber-400 hover:bg-amber-400/15',
    },
    violet: {
      card:  'border-violet-400/20 bg-violet-400/5',
      icon:  'bg-violet-400/15 text-violet-400',
      badge: 'border-violet-400/30 bg-violet-400/10 text-violet-400',
      btn:   'border-violet-400/30 bg-violet-400/5 text-violet-400 hover:bg-violet-400/15',
    },
    cyan: {
      card:  'border-cyan-400/20 bg-cyan-400/5',
      icon:  'bg-cyan-400/15 text-cyan-400',
      badge: 'border-cyan-400/30 bg-cyan-400/10 text-cyan-400',
      btn:   'border-cyan-400/30 bg-cyan-400/5 text-cyan-400 hover:bg-cyan-400/15',
    },
  };

  const colsCls =
    recs.length === 1 ? '' :
    recs.length === 2 ? 'sm:grid-cols-2' :
                        'sm:grid-cols-2 lg:grid-cols-3';

  return (
    <div className="mb-10 rounded-xl border border-white/10 bg-white/5 p-6">
      <div className="mb-5 flex items-center gap-2">
        <Sparkles size={16} className="text-cyan-400" />
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
          What to Practice Next
        </h3>
        <span className="text-xs text-slate-600">based on your history</span>
      </div>
      <div className={`grid gap-4 ${colsCls}`}>
        {recs.map((rec, i) => {
          const p = palette[rec.color];
          return (
            <div key={i} className={`flex flex-col gap-3 rounded-lg border p-4 ${p.card}`}>
              <div className="flex items-start justify-between gap-2">
                <div className={`rounded-lg p-2 ${p.icon}`}>
                  <rec.Icon size={16} />
                </div>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${p.badge}`}>
                  {rec.badge}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-200">{rec.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">{rec.reason}</p>
              </div>
              <button
                type="button"
                onClick={() => onApply(rec.settings)}
                className={`inline-flex items-center gap-1.5 self-start rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${p.btn}`}
              >
                <Play size={10} fill="currentColor" />
                Use These Settings
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const SESSIONS_PER_PAGE = 5;

const DIFFICULTY_DESCRIPTIONS = {
  Beginner: 'Entry-level questions covering core concepts. Ideal for students or early-career candidates.',
  Intermediate: 'Mid-level questions requiring solid practical knowledge. Suited for 2–4 years of experience.',
  Advanced: 'Senior-level questions probing deep expertise, architectural trade-offs, and system design.',
};

const QUESTION_TYPE_DESCRIPTIONS = {
  Technical: 'Algorithms, data structures, coding patterns, and implementation challenges.',
  Behavioral: 'Situational questions about past experience, leadership, and collaboration (STAR format).',
  Mixed: 'An interleaved blend of roughly half technical and half behavioral questions.',
  'System Design': 'Architecture, scalability, API design, and distributed systems for senior roles.',
};

const ESTIMATED_TIME = {
  '3': '~5–8 min',
  '5': '~8–12 min',
  '7': '~12–18 min',
  '10': '~18–25 min',
};

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const prefill = location.state?.prefill;

  const [sessions, setSessions] = useState([]);
  const [role, setRole] = useState(prefill?.role || 'Frontend Engineer');
  const [difficulty, setDifficulty] = useState(prefill?.difficulty || 'Intermediate');
  const [questionType, setQuestionType] = useState(prefill?.questionType || 'Technical');
  const [techStack, setTechStack] = useState(prefill?.techStack || '');
  const [questionsCount, setQuestionsCount] = useState(String(prefill?.questionsCount || '5'));
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [questionTypeFilter, setQuestionTypeFilter] = useState('all');
  const [deletingId, setDeletingId] = useState(null);
  const [starringId, setStarringId] = useState(null);
  const [sortBy, setSortBy] = useState('date-desc');
  const [recommendationApplied, setRecommendationApplied] = useState(false);

  useEffect(() => {
    const loadSessions = async () => {
      try {
        const data = await getUserSessions();
        setSessions(data.sessions || []);
      } catch (err) {
        console.error("Failed to load interview sessions:", err);
        setError('Could not retrieve interview sessions.');
      } finally {
        setFetching(false);
      }
    };
    loadSessions();
  }, []);

  const handleStartInterview = async (e) => {
    e.preventDefault();
    if (!role.trim()) {
      setError('Please specify a job role');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await createSession({
        role,
        difficulty,
        techStack,
        questionsCount: parseInt(questionsCount, 10),
        questionType
      });
      navigate(`/interview/${data.session._id}`);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Could not start interview session');
    } finally {
      setLoading(false);
    }
  };

  // Reset page to 1 when any filter or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, difficultyFilter, questionTypeFilter, sortBy]);

  // Helper metrics (always over full sessions, not filtered)
  const completedInterviews = sessions.filter(s => s.status === 'completed');
  const totalCompleted = completedInterviews.length;
  const averageScore = totalCompleted > 0
    ? Math.round(completedInterviews.reduce((acc, curr) => acc + (curr.overallScore || 0), 0) / totalCompleted)
    : 0;

  // Filtered sessions
  const filteredSessions = sessions.filter((s) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || s.role.toLowerCase().includes(q) || (s.techStack || '').toLowerCase().includes(q);
    const matchesStatus =
      statusFilter === 'all' ? true :
      statusFilter === 'starred' ? !!s.starred :
      s.status === statusFilter;
    const matchesDifficulty = difficultyFilter === 'all' || s.difficulty === difficultyFilter;
    const matchesType = questionTypeFilter === 'all' || (s.questionType || 'Technical') === questionTypeFilter;
    return matchesSearch && matchesStatus && matchesDifficulty && matchesType;
  });

  // Sort filtered sessions
  const sortedSessions = [...filteredSessions].sort((a, b) => {
    switch (sortBy) {
      case 'date-asc':   return new Date(a.createdAt) - new Date(b.createdAt);
      case 'date-desc':  return new Date(b.createdAt) - new Date(a.createdAt);
      case 'score-desc': return (b.overallScore ?? -1) - (a.overallScore ?? -1);
      case 'score-asc':  return (a.overallScore ?? 101) - (b.overallScore ?? 101);
      case 'role-asc':   return a.role.localeCompare(b.role);
      case 'role-desc':  return b.role.localeCompare(a.role);
      default:           return 0;
    }
  });

  // Pagination (over sorted + filtered results)
  const totalPages = Math.max(1, Math.ceil(sortedSessions.length / SESSIONS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * SESSIONS_PER_PAGE;
  const paginatedSessions = sortedSessions.slice(pageStart, pageStart + SESSIONS_PER_PAGE);

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || difficultyFilter !== 'all' || questionTypeFilter !== 'all';

  const formatDuration = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setDifficultyFilter('all');
    setQuestionTypeFilter('all');
  };

  const handleExportCSV = () => {
    const rows = sessions.map((s) => ({
      Date: new Date(s.createdAt).toLocaleDateString(),
      Role: s.role,
      Difficulty: s.difficulty,
      Type: s.questionType || 'Technical',
      'Tech Stack': s.techStack || '',
      Status: s.status === 'completed' ? 'Completed' : 'In Progress',
      Score: s.status === 'completed' && typeof s.overallScore === 'number' ? `${s.overallScore}%` : '',
      Duration: s.duration > 0 ? formatDuration(s.duration) : '',
      Questions: s.questionsCount,
      Starred: s.starred ? 'Yes' : 'No',
      Notes: s.notes ? s.notes.replace(/[\r\n]+/g, ' ') : '',
    }));

    const headers = Object.keys(rows[0]);
    const escape = (val) => {
      const str = String(val ?? '');
      return str.includes(',') || str.includes('"') || str.includes('\n')
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    };
    const csv = [headers.join(','), ...rows.map((r) => headers.map((h) => escape(r[h])).join(','))].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interview-history-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm('Delete this in-progress session? This cannot be undone.')) return;
    setDeletingId(sessionId);
    try {
      await deleteSession(sessionId);
      setSessions((prev) => prev.filter((s) => s._id !== sessionId));
    } catch (err) {
      console.error('Failed to delete session:', err);
      setError(err.response?.data?.message || 'Could not delete session. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleStar = async (sessionId) => {
    setStarringId(sessionId);
    try {
      const data = await toggleStarSession(sessionId);
      setSessions((prev) =>
        prev.map((s) => (s._id === sessionId ? { ...s, starred: data.starred } : s))
      );
    } catch (err) {
      console.error('Failed to toggle star:', err);
    } finally {
      setStarringId(null);
    }
  };

  const handleApplyRecommendation = ({ role: r, difficulty: d, questionType: qt }) => {
    setRole(r);
    setDifficulty(d);
    setQuestionType(qt);
    setRecommendationApplied(true);
    setTimeout(() => setRecommendationApplied(false), 3500);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 text-white">
      {/* Header Section */}
      <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Dashboard</h1>
          <p className="mt-2 text-slate-400">Setup and manage your AI mock interview sessions</p>
        </div>
      </div>

      {error && (
        <div className="mb-8 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Metrics Section */}
      <div className="mb-10 grid gap-6 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-400">Total Interviews</span>
            <div className="rounded-lg bg-cyan-400/10 p-2 text-cyan-400">
              <ClipboardList size={20} />
            </div>
          </div>
          {fetching ? (
            <div className="mt-4 h-9 w-12 rounded-lg bg-white/10 animate-pulse" />
          ) : (
            <p className="mt-4 text-3xl font-bold">{sessions.length}</p>
          )}
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-6 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-400">Completed Sessions</span>
            <div className="rounded-lg bg-emerald-400/10 p-2 text-emerald-400">
              <BookOpen size={20} />
            </div>
          </div>
          {fetching ? (
            <div className="mt-4 h-9 w-12 rounded-lg bg-white/10 animate-pulse" />
          ) : (
            <p className="mt-4 text-3xl font-bold">{totalCompleted}</p>
          )}
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-6 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-400">Average Performance</span>
            <div className="rounded-lg bg-amber-400/10 p-2 text-amber-400">
              <Award size={20} />
            </div>
          </div>
          {fetching ? (
            <div className="mt-4 h-9 w-16 rounded-lg bg-white/10 animate-pulse" />
          ) : (
            <p className="mt-4 text-3xl font-bold">{averageScore}%</p>
          )}
        </div>
      </div>

      {/* Practice Goal Tracker */}
      <GoalTracker sessions={sessions} loading={fetching} />

      {/* Practice Streak Counter */}
      <StreakCounter sessions={sessions} loading={fetching} />

      {/* Performance Trend Chart */}
      <PerformanceTrend sessions={sessions} loading={fetching} />

      {/* Smart Practice Recommendations */}
      <SmartRecommendations sessions={sessions} loading={fetching} onApply={handleApplyRecommendation} />

      {/* Main Grid: Form and History */}
      <div className="grid gap-8 lg:grid-cols-12">
        {/* New Session Form */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 shadow-lg lg:col-span-5 h-fit">
          <h2 className="text-xl font-bold tracking-tight mb-6">New Mock Interview</h2>
          
          {prefill && (
            <div className="mb-5 flex items-center gap-2 rounded-lg border border-cyan-400/20 bg-cyan-400/5 px-4 py-3 text-xs text-cyan-400">
              <RotateCcw size={13} className="shrink-0" />
              <span>Settings pre-filled from your last session — edit or start as-is.</span>
            </div>
          )}

          {recommendationApplied && (
            <div className="mb-5 flex items-center gap-2 rounded-lg border border-violet-400/20 bg-violet-400/5 px-4 py-3 text-xs text-violet-400">
              <Sparkles size={13} className="shrink-0" />
              <span>Recommendation applied — review the settings and click Generate.</span>
            </div>
          )}

          <form onSubmit={handleStartInterview} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-300" htmlFor="role">
                Job Role / Title
              </label>
              <input
                id="role"
                type="text"
                required
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Frontend Engineer, React Developer"
                className="mt-2 block w-full rounded-lg border border-white/10 bg-slate-900/60 py-3 px-4 text-white placeholder-slate-500 shadow-inner outline-none transition focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Difficulty Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['Beginner', 'Intermediate', 'Advanced'].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setDifficulty(level)}
                    className={`rounded-lg py-2.5 text-sm font-semibold border transition ${
                      difficulty === level
                        ? 'bg-cyan-400 border-cyan-400 text-slate-950 shadow-md shadow-cyan-400/15'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
              {difficulty && (
                <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                  {DIFFICULTY_DESCRIPTIONS[difficulty]}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Question Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['Technical', 'Behavioral', 'Mixed', 'System Design'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setQuestionType(type)}
                    className={`rounded-lg py-2.5 text-sm font-semibold border transition ${
                      questionType === type
                        ? 'bg-cyan-400 border-cyan-400 text-slate-950 shadow-md shadow-cyan-400/15'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
              {questionType && (
                <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                  {QUESTION_TYPE_DESCRIPTIONS[questionType]}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300" htmlFor="techStack">
                Tech Stack / Key Topics <span className="font-normal text-slate-500">(Optional)</span>
              </label>
              <input
                id="techStack"
                type="text"
                value={techStack}
                onChange={(e) => setTechStack(e.target.value)}
                placeholder="e.g. React, Redux, Node.js, System Design"
                className="mt-2 block w-full rounded-lg border border-white/10 bg-slate-900/60 py-3 px-4 text-white placeholder-slate-500 shadow-inner outline-none transition focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
              />
              <p className="mt-1.5 text-xs text-slate-500">
                Comma-separated topics — the AI tailors every question to your stack.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300" htmlFor="questionsCount">
                  No. of Questions
                </label>
                <select
                  id="questionsCount"
                  value={questionsCount}
                  onChange={(e) => setQuestionsCount(e.target.value)}
                  className="mt-2 block w-full rounded-lg border border-white/10 bg-slate-900/60 py-3 px-4 text-white shadow-inner outline-none transition focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 cursor-pointer"
                >
                  <option value="3">3 Questions</option>
                  <option value="5">5 Questions</option>
                  <option value="7">7 Questions</option>
                  <option value="10">10 Questions</option>
                </select>
              </div>
              <div className="flex flex-col justify-end">
                <p className="text-xs font-semibold text-slate-400 mb-2">Est. Duration</p>
                <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-slate-900/60 py-3 px-4 text-sm text-slate-300">
                  <Clock size={14} className="text-cyan-400 shrink-0" />
                  <span className="tabular-nums font-semibold">
                    {ESTIMATED_TIME[questionsCount] || '~10–15 min'}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-400 py-3.5 font-bold text-slate-950 hover:bg-cyan-300 transition shadow-lg shadow-cyan-400/15 disabled:opacity-50"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
              ) : (
                <>
                  <Play size={18} fill="currentColor" />
                  Generate AI Interview
                </>
              )}
            </button>
          </form>
        </div>

        {/* Interview Sessions History */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 shadow-lg lg:col-span-7">
          <div className="mb-6 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold tracking-tight">Interview History</h2>
              {!fetching && sessions.length > 0 && (
                <button
                  onClick={handleExportCSV}
                  title="Export all sessions as CSV"
                  className="flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:bg-white/10 hover:text-white transition"
                >
                  <Download size={13} />
                  Export CSV
                </button>
              )}
            </div>

            {/* Search + filters */}
            {!fetching && sessions.length > 0 && (
              <div className="flex flex-col gap-3">
                {/* Search box + Sort control row */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                      <Search size={15} />
                    </span>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by role or tech stack…"
                      className="w-full rounded-lg border border-white/10 bg-slate-900/60 py-2 pl-9 pr-9 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-white transition"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {/* Sort dropdown */}
                  <div className="flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 bg-slate-900/60 px-2.5 py-2 text-xs text-slate-400">
                    <ArrowUpDown size={12} className="shrink-0" />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="bg-transparent text-slate-300 outline-none cursor-pointer"
                      aria-label="Sort sessions"
                    >
                      <option value="date-desc">Newest first</option>
                      <option value="date-asc">Oldest first</option>
                      <option value="score-desc">Score: high → low</option>
                      <option value="score-asc">Score: low → high</option>
                      <option value="role-asc">Role: A → Z</option>
                      <option value="role-desc">Role: Z → A</option>
                    </select>
                  </div>
                </div>

                {/* Filter pills row */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Status filter */}
                  <div className="flex items-center gap-1 text-xs">
                    {[['all', 'All'], ['in-progress', 'In Progress'], ['completed', 'Completed'], ['starred', '★ Starred']].map(([val, label]) => (
                      <button
                        key={val}
                        onClick={() => setStatusFilter(val)}
                        className={`rounded-full px-3 py-1 font-semibold border transition ${
                          statusFilter === val
                            ? val === 'starred'
                              ? 'bg-amber-400 border-amber-400 text-slate-950'
                              : 'bg-cyan-400 border-cyan-400 text-slate-950'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  <span className="text-white/20 text-xs hidden sm:block">|</span>

                  {/* Difficulty filter */}
                  <div className="flex items-center gap-1 text-xs">
                    {[['all', 'Any Level'], ['Beginner', 'Beginner'], ['Intermediate', 'Intermediate'], ['Advanced', 'Advanced']].map(([val, label]) => (
                      <button
                        key={val}
                        onClick={() => setDifficultyFilter(val)}
                        className={`rounded-full px-3 py-1 font-semibold border transition ${
                          difficultyFilter === val
                            ? 'bg-cyan-400 border-cyan-400 text-slate-950'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Question type filter row */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex flex-wrap items-center gap-1 text-xs">
                    {[['all', 'Any Type'], ['Technical', 'Technical'], ['Behavioral', 'Behavioral'], ['Mixed', 'Mixed'], ['System Design', 'System Design']].map(([val, label]) => (
                      <button
                        key={val}
                        onClick={() => setQuestionTypeFilter(val)}
                        className={`rounded-full px-3 py-1 font-semibold border transition ${
                          questionTypeFilter === val
                            ? 'bg-violet-400 border-violet-400 text-slate-950'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* Clear all filters — moved here to end of last filter row */}
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="ml-auto flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/10 transition"
                    >
                      <X size={11} />
                      Clear
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {fetching ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => <SessionCardSkeleton key={i} />)}
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-white/10 p-6 text-center">
              <ClipboardList size={40} className="text-slate-500 mb-3" />
              <h3 className="text-lg font-bold text-slate-200">No mock interviews yet</h3>
              <p className="mt-1 text-sm text-slate-400 max-w-xs mx-auto">
                Select your parameters and click "Generate AI Interview" to practice your skills.
              </p>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center rounded-lg border border-dashed border-white/10 p-6 text-center">
              {statusFilter === 'starred' ? (
                <>
                  <Star size={32} className="text-slate-500 mb-3" />
                  <h3 className="text-base font-bold text-slate-200">No starred sessions yet</h3>
                  <p className="mt-1 text-xs text-slate-500">Click the star icon on any session to bookmark it for quick access.</p>
                  <button
                    onClick={clearFilters}
                    className="mt-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-1.5 text-sm font-semibold text-slate-300 transition"
                  >
                    Show all sessions
                  </button>
                </>
              ) : (
                <>
                  <Search size={32} className="text-slate-500 mb-3" />
                  <h3 className="text-base font-bold text-slate-200">No sessions match your filters</h3>
                  <button
                    onClick={clearFilters}
                    className="mt-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-1.5 text-sm font-semibold text-slate-300 transition"
                  >
                    Clear filters
                  </button>
                </>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {paginatedSessions.map((session) => (
                  <div
                    key={session._id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border border-white/5 bg-white/5 p-4 transition hover:bg-white/10"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-slate-100">{session.role}</h4>
                        {session.starred && (
                          <Star size={12} className="text-amber-400 shrink-0" fill="currentColor" />
                        )}
                        {session.notes && session.notes.trim() && (
                          <FileText size={12} className="text-violet-400 shrink-0" title="Has personal notes" />
                        )}
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          session.difficulty === 'Beginner' ? 'bg-blue-400/10 text-blue-400 border border-blue-400/20' :
                          session.difficulty === 'Intermediate' ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20' :
                          'bg-rose-400/10 text-rose-400 border border-rose-400/20'
                        }`}>
                          {session.difficulty}
                        </span>
                        {session.questionType && session.questionType !== 'Technical' && (
                          <span className="rounded-full px-2 py-0.5 text-xs font-semibold bg-violet-400/10 text-violet-400 border border-violet-400/20">
                            {session.questionType}
                          </span>
                        )}
                      </div>
                      {session.techStack && (
                        <p className="text-xs text-slate-400">Focus: {session.techStack}</p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {new Date(session.createdAt).toLocaleDateString()}
                        </span>
                        <span>•</span>
                        <span>{session.questionsCount} Questions</span>
                        {session.duration > 0 && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Timer size={11} className="text-cyan-400/60" />
                              {formatDuration(session.duration)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 self-end sm:self-center">
                      {/* Star toggle button — always visible */}
                      <button
                        onClick={() => handleToggleStar(session._id)}
                        disabled={starringId === session._id}
                        title={session.starred ? 'Remove star' : 'Star this session'}
                        className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border transition disabled:opacity-50 disabled:pointer-events-none ${
                          session.starred
                            ? 'border-amber-400/40 bg-amber-400/10 text-amber-400 hover:bg-amber-400/20'
                            : 'border-white/10 bg-white/5 text-slate-500 hover:text-amber-400 hover:border-amber-400/30 hover:bg-amber-400/5'
                        }`}
                      >
                        {starringId === session._id ? (
                          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                          <Star size={14} fill={session.starred ? 'currentColor' : 'none'} />
                        )}
                      </button>

                      {session.status === 'completed' ? (
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-xs text-slate-400">Score</p>
                            <span className={`text-lg font-extrabold ${
                              session.overallScore >= 80 ? 'text-emerald-400' :
                              session.overallScore >= 60 ? 'text-amber-400' :
                              'text-rose-400'
                            }`}>
                              {session.overallScore}%
                            </span>
                          </div>
                          <button
                            onClick={() => navigate(`/feedback/${session._id}`)}
                            className="rounded-lg bg-white/10 hover:bg-white/20 px-4 py-2 text-sm font-semibold transition"
                          >
                            Feedback
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-cyan-400/10 px-2.5 py-1 text-xs font-semibold text-cyan-400 border border-cyan-400/20">
                            In Progress
                          </span>
                          <button
                            onClick={() => navigate(`/interview/${session._id}`)}
                            className="rounded-lg bg-cyan-400 text-slate-950 hover:bg-cyan-300 px-4 py-2 text-sm font-bold transition shadow-md shadow-cyan-400/10"
                          >
                            Resume
                          </button>
                          <button
                            onClick={() => handleDeleteSession(session._id)}
                            disabled={deletingId === session._id}
                            title="Delete session"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-rose-500/20 bg-rose-500/5 text-rose-400 hover:bg-rose-500/15 transition disabled:opacity-50 disabled:pointer-events-none"
                          >
                            {deletingId === session._id ? (
                              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-rose-400 border-t-transparent" />
                            ) : (
                              <Trash2 size={14} />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
                  <span className="text-xs text-slate-500">
                    Showing {pageStart + 1}–{Math.min(pageStart + SESSIONS_PER_PAGE, sortedSessions.length)} of {sortedSessions.length}{hasActiveFilters ? ` of ${sessions.length}` : ''} sessions
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={safePage === 1}
                      className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-1.5 text-sm font-semibold text-slate-300 transition disabled:opacity-30 disabled:pointer-events-none"
                    >
                      <ChevronLeft size={14} />
                      Prev
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`h-8 w-8 rounded-lg text-sm font-bold transition ${
                            page === safePage
                              ? 'bg-cyan-400 text-slate-950'
                              : 'border border-white/10 bg-white/5 hover:bg-white/10 text-slate-400'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={safePage === totalPages}
                      className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-1.5 text-sm font-semibold text-slate-300 transition disabled:opacity-30 disabled:pointer-events-none"
                    >
                      Next
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
