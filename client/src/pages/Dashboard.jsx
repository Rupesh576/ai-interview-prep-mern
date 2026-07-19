import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Play, Award, ClipboardList, BookOpen, Clock, AlertCircle, ChevronLeft, ChevronRight, Search, X, RotateCcw, Timer, TrendingUp } from 'lucide-react';
import { createSession, getUserSessions } from '../services/sessionService';

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

const SESSIONS_PER_PAGE = 5;

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

  // Reset page to 1 when any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, difficultyFilter]);

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
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    const matchesDifficulty = difficultyFilter === 'all' || s.difficulty === difficultyFilter;
    return matchesSearch && matchesStatus && matchesDifficulty;
  });

  // Pagination (over filtered results)
  const totalPages = Math.max(1, Math.ceil(filteredSessions.length / SESSIONS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * SESSIONS_PER_PAGE;
  const paginatedSessions = filteredSessions.slice(pageStart, pageStart + SESSIONS_PER_PAGE);

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || difficultyFilter !== 'all';

  const formatDuration = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setDifficultyFilter('all');
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

      {/* Performance Trend Chart */}
      <PerformanceTrend sessions={sessions} loading={fetching} />

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
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300" htmlFor="techStack">
                Tech Stack / Key Topics (Optional)
              </label>
              <input
                id="techStack"
                type="text"
                value={techStack}
                onChange={(e) => setTechStack(e.target.value)}
                placeholder="e.g. React, Redux, Node.js, System Design"
                className="mt-2 block w-full rounded-lg border border-white/10 bg-slate-900/60 py-3 px-4 text-white placeholder-slate-500 shadow-inner outline-none transition focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
              />
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
            <h2 className="text-xl font-bold tracking-tight">Interview History</h2>

            {/* Search + filters */}
            {!fetching && sessions.length > 0 && (
              <div className="flex flex-col gap-3">
                {/* Search box */}
                <div className="relative">
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

                {/* Filter pills row */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Status filter */}
                  <div className="flex items-center gap-1 text-xs">
                    {[['all', 'All'], ['in-progress', 'In Progress'], ['completed', 'Completed']].map(([val, label]) => (
                      <button
                        key={val}
                        onClick={() => setStatusFilter(val)}
                        className={`rounded-full px-3 py-1 font-semibold border transition ${
                          statusFilter === val
                            ? 'bg-cyan-400 border-cyan-400 text-slate-950'
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

                  {/* Clear all filters */}
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
              <Search size={32} className="text-slate-500 mb-3" />
              <h3 className="text-base font-bold text-slate-200">No sessions match your filters</h3>
              <button
                onClick={clearFilters}
                className="mt-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-1.5 text-sm font-semibold text-slate-300 transition"
              >
                Clear filters
              </button>
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
                        <div className="flex items-center gap-3">
                          <span className="rounded-full bg-cyan-400/10 px-2.5 py-1 text-xs font-semibold text-cyan-400 border border-cyan-400/20">
                            In Progress
                          </span>
                          <button
                            onClick={() => navigate(`/interview/${session._id}`)}
                            className="rounded-lg bg-cyan-400 text-slate-950 hover:bg-cyan-300 px-4 py-2 text-sm font-bold transition shadow-md shadow-cyan-400/10"
                          >
                            Resume
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
                    Showing {pageStart + 1}–{Math.min(pageStart + SESSIONS_PER_PAGE, filteredSessions.length)} of {filteredSessions.length}{hasActiveFilters ? ` of ${sessions.length}` : ''} sessions
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
