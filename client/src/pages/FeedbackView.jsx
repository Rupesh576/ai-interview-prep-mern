import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Award, ArrowLeft, ArrowRight, ClipboardCheck, Sparkles, MessageCircle, AlertCircle, ChevronDown, ChevronUp, Copy, CheckCheck, RotateCcw, Timer, TrendingUp, BookOpen, Target, PenLine, CheckCircle, Download } from 'lucide-react';
import { getSessionDetails, updateSessionNotes, getUserSessions } from '../services/sessionService';

const FeedbackSkeleton = () => (
  <div className="mx-auto max-w-4xl px-6 py-10 text-white animate-pulse">
    {/* Back button */}
    <div className="mb-6 h-4 w-36 rounded bg-white/10" />

    {/* Header */}
    <div className="mb-8 border-b border-white/10 pb-6 space-y-3">
      <div className="h-3 w-32 rounded bg-white/10" />
      <div className="h-8 w-72 rounded bg-white/10" />
      <div className="flex items-center gap-3 flex-wrap">
        <div className="h-3 w-28 rounded bg-white/10" />
        <div className="h-2 w-1 rounded bg-white/10" />
        <div className="h-3 w-32 rounded bg-white/10" />
        <div className="h-2 w-1 rounded bg-white/10" />
        <div className="h-3 w-24 rounded bg-white/10" />
      </div>
    </div>

    {/* Summary row: score gauge + AI summary */}
    <div className="mb-10 grid gap-6 md:grid-cols-12">
      <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-white/5 p-6 md:col-span-4 gap-4">
        <div className="h-32 w-32 rounded-full bg-white/10" />
        <div className="h-6 w-28 rounded-full bg-white/10" />
      </div>
      <div className="flex flex-col justify-center rounded-xl border border-white/10 bg-white/5 p-6 md:col-span-8 space-y-3">
        <div className="h-4 w-44 rounded bg-white/10" />
        <div className="h-3 w-full rounded bg-white/10" />
        <div className="h-3 w-5/6 rounded bg-white/10" />
        <div className="h-3 w-4/5 rounded bg-white/10" />
        <div className="h-3 w-3/5 rounded bg-white/10" />
      </div>
    </div>

    {/* Score breakdown */}
    <div className="mb-10 rounded-xl border border-white/10 bg-white/5 p-6 space-y-4">
      <div className="h-3 w-36 rounded bg-white/10" />
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <div className="h-4 w-32 rounded bg-white/10" />
          <div className="flex-1 h-2 rounded-full bg-white/10" />
          <div className="h-3 w-16 rounded bg-white/10" />
        </div>
      ))}
    </div>

    {/* Coaching insights placeholder */}
    <div className="mb-10 rounded-xl border border-white/10 bg-white/5 p-6 space-y-4">
      <div className="h-3 w-40 rounded bg-white/10" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-lg border border-white/10 p-4 space-y-2">
            <div className="h-4 w-32 rounded bg-white/10" />
            <div className="h-3 w-full rounded bg-white/10" />
            <div className="h-3 w-4/5 rounded bg-white/10" />
          </div>
        ))}
      </div>
    </div>

    {/* Question accordion skeletons */}
    <div className="space-y-4">
      <div className="h-6 w-52 rounded bg-white/10" />
      {[...Array(4)].map((_, i) => (
        <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-5 flex items-center justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="h-3 w-20 rounded bg-white/10" />
            <div className="h-4 w-3/4 rounded bg-white/10" />
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div className="h-5 w-10 rounded bg-white/10" />
            <div className="h-4 w-4 rounded bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

const FeedbackView = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedQuestionId, setExpandedQuestionId] = useState(null);
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);
  const [otherSessions, setOtherSessions] = useState([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const data = await getSessionDetails(id);
        setSession(data.session);
        setQuestions(data.questions || []);
        setNotes(data.session.notes || '');
        
        // Auto-expand the first question
        if (data.questions && data.questions.length > 0) {
          setExpandedQuestionId(data.questions[0]._id);
        }
      } catch (err) {
        console.error("Failed to load feedback view:", err);
        setError('Error loading feedback details. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, [id]);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    const load = async () => {
      try {
        const data = await getUserSessions();
        if (!cancelled) {
          setOtherSessions(
            (data.sessions || []).filter(
              (s) => s._id !== id && s.status === 'completed' && typeof s.overallScore === 'number'
            )
          );
        }
      } catch {
        // silent — comparison panel simply won't render
      } finally {
        if (!cancelled) setHistoryLoaded(true);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [session, id]);

  const toggleExpand = (qId) => {
    setExpandedQuestionId(expandedQuestionId === qId ? null : qId);
  };

  const handleSaveNotes = async () => {
    if (savingNotes) return;
    setSavingNotes(true);
    setNotesSaved(false);
    try {
      await updateSessionNotes(id, notes);
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save notes:', err);
    } finally {
      setSavingNotes(false);
    }
  };

  const handleRetryInterview = () => {
    navigate('/', {
      state: {
        prefill: {
          role: session.role,
          difficulty: session.difficulty,
          techStack: session.techStack || '',
          questionsCount: session.questionsCount || 5,
          questionType: session.questionType || 'Technical'
        }
      }
    });
  };

  const buildReportText = () => {
    const lines = [];
    lines.push('AI Interview Feedback Report');
    lines.push('='.repeat(40));
    lines.push(`Role: ${session.role}`);
    lines.push(`Difficulty: ${session.difficulty}  |  Focus: ${session.techStack || 'General'}`);
    lines.push(`Date: ${new Date(session.createdAt).toLocaleDateString()}`);
    lines.push(`Overall Score: ${score}/100 — ${ratingLabel}`);
    lines.push('');
    lines.push('AI SUMMARY');
    lines.push('-'.repeat(40));
    lines.push(session.feedbackSummary || 'No summary available.');
    if (notes.trim()) {
      lines.push('');
      lines.push('PERSONAL NOTES');
      lines.push('-'.repeat(40));
      lines.push(notes.trim());
    }
    lines.push('');
    lines.push('QUESTION BREAKDOWN');
    lines.push('-'.repeat(40));
    questions.forEach((q, idx) => {
      lines.push('');
      lines.push(`Q${idx + 1}: ${q.questionText}`);
      lines.push(`Score: ${q.score || 0}/10`);
      lines.push('');
      lines.push('Your Answer:');
      lines.push(q.userAnswer || 'No answer provided.');
      lines.push('');
      lines.push('AI Feedback:');
      lines.push(q.feedback || 'No feedback generated.');
      if (q.suggestedAnswer) {
        lines.push('');
        lines.push('Suggested Answer:');
        lines.push(q.suggestedAnswer);
      }
      lines.push('');
    });
    return lines.join('\n');
  };

  const handleCopyFeedback = async () => {
    try {
      await navigator.clipboard.writeText(buildReportText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy feedback to clipboard:', err);
    }
  };

  const handleDownloadFeedback = () => {
    const text = buildReportText();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const dateStr = new Date(session.createdAt).toISOString().slice(0, 10);
    const safeRole = session.role.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const filename = `interview-feedback-${safeRole}-${dateStr}.txt`;
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2500);
  };

  if (loading) {
    return <FeedbackSkeleton />;
  }

  if (error || !session) {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center text-white">
        <AlertCircle size={48} className="mx-auto text-red-500 mb-4 animate-bounce" />
        <h2 className="text-xl font-bold">Failed to load feedback</h2>
        <p className="mt-2 text-sm text-slate-400">{error}</p>
        <button
          onClick={() => navigate('/')}
          className="mt-6 rounded-lg bg-cyan-400 px-6 py-2.5 font-bold text-slate-950 hover:bg-cyan-300 transition"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const score = session.overallScore || 0;

  const formatDuration = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Custom styling attributes based on score ranges
  let scoreColorClass = 'text-rose-400 border-rose-500/20 bg-rose-500/5';
  let ratingLabel = 'Needs Practice';
  let badgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/20';

  if (score >= 80) {
    scoreColorClass = 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5';
    ratingLabel = 'Excellent Performance';
    badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  } else if (score >= 60) {
    scoreColorClass = 'text-amber-400 border-amber-500/20 bg-amber-500/5';
    ratingLabel = 'Solid Effort';
    badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  }

  // Per-question score tiers
  const excellentCount = questions.filter(q => (q.score || 0) >= 8).length;
  const goodCount = questions.filter(q => (q.score || 0) >= 6 && (q.score || 0) < 8).length;
  const needsWorkCount = questions.filter(q => (q.score || 0) < 6).length;

  const scoreTiers = [
    { label: 'Excellent', range: '8–10', count: excellentCount, barColor: 'bg-emerald-400', textColor: 'text-emerald-400' },
    { label: 'Good', range: '6–7', count: goodCount, barColor: 'bg-amber-400', textColor: 'text-amber-400' },
    { label: 'Needs Work', range: '0–5', count: needsWorkCount, barColor: 'bg-rose-400', textColor: 'text-rose-400' },
  ];

  // Comparison stats derived from other completed sessions
  const prevSession = otherSessions.length > 0
    ? [...otherSessions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
    : null;
  const prevScore = prevSession ? prevSession.overallScore : null;
  const allOtherScores = otherSessions.map((s) => s.overallScore);
  const avgOtherScore = allOtherScores.length > 0
    ? Math.round(allOtherScores.reduce((a, b) => a + b, 0) / allOtherScores.length)
    : null;
  const bestOtherScore = allOtherScores.length > 0 ? Math.max(...allOtherScores) : null;
  const isNewBest = score > 0 && (bestOtherScore === null || score > bestOtherScore);
  const displayBest = isNewBest ? score : bestOtherScore;
  const scoreVsLast = prevScore !== null ? score - prevScore : null;
  const scoreVsAvg = avgOtherScore !== null ? score - avgOtherScore : null;

  // Coaching insights: derive personalised tips from session data
  const unansweredCount = questions.filter(q => !q.userAnswer || !q.userAnswer.trim()).length;
  const avgWordCount = questions.length > 0
    ? Math.round(
        questions.reduce((sum, q) => sum + (q.userAnswer || '').trim().split(/\s+/).filter(Boolean).length, 0)
        / questions.length
      )
    : 0;

  const coachingTips = [];

  if (score >= 80) {
    coachingTips.push({
      Icon: TrendingUp,
      iconCls: 'text-emerald-400',
      cardCls: 'border-emerald-400/20 bg-emerald-500/5',
      title: 'Ready to level up',
      body: `Strong result at ${score}%. ${session.difficulty !== 'Advanced'
        ? `Try ${session.difficulty === 'Beginner' ? 'Intermediate' : 'Advanced'} difficulty in your next session to keep challenging yourself.`
        : 'Add a niche or specialised tech stack next time to keep the challenge high.'}`
    });
  } else if (score >= 60) {
    coachingTips.push({
      Icon: Target,
      iconCls: 'text-cyan-400',
      cardCls: 'border-cyan-400/20 bg-cyan-400/5',
      title: 'Add structure and depth',
      body: 'Your answers show solid fundamentals. Lift your score by applying a define → explain → example pattern and mentioning trade-offs where relevant.'
    });
  } else {
    coachingTips.push({
      Icon: BookOpen,
      iconCls: 'text-amber-400',
      cardCls: 'border-amber-400/20 bg-amber-500/5',
      title: 'Strengthen the fundamentals',
      body: 'Review core concepts before your next session. Hands-on practice — small projects or official docs — makes a bigger difference than re-reading notes.'
    });
  }

  if (unansweredCount > 0) {
    coachingTips.push({
      Icon: AlertCircle,
      iconCls: 'text-rose-400',
      cardCls: 'border-rose-400/20 bg-rose-500/5',
      title: `${unansweredCount} blank answer${unansweredCount > 1 ? 's' : ''}`,
      body: 'Never skip a question — a partial answer that shows your reasoning scores better than silence. Attempt every question even with limited knowledge.'
    });
  }

  if (coachingTips.length < 3 && avgWordCount > 0 && avgWordCount < 25) {
    coachingTips.push({
      Icon: MessageCircle,
      iconCls: 'text-violet-400',
      cardCls: 'border-violet-400/20 bg-violet-500/5',
      title: `Short answers (avg. ${avgWordCount} words)`,
      body: 'Aim for 50–100 words per answer: state the concept, explain how it works, then give a concrete example. More depth signals expertise to the evaluator.'
    });
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 text-white">
      {/* Back to Dashboard Link */}
      <button
        onClick={() => navigate('/')}
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white transition"
      >
        <ArrowLeft size={16} />
        Back to Dashboard
      </button>

      {/* Header Info */}
      <div className="mb-8 border-b border-white/10 pb-6">
        <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">AI Performance Review</span>
        <h1 className="text-3xl font-bold tracking-tight mt-1">{session.role} Interview</h1>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
          <span>Difficulty: <strong className="text-slate-200">{session.difficulty}</strong></span>
          <span>•</span>
          <span>Type: <strong className="text-slate-200">{session.questionType || 'Technical'}</strong></span>
          <span>•</span>
          <span>Focus: <strong className="text-slate-200">{session.techStack || 'General'}</strong></span>
          <span>•</span>
          <span>Date: <strong className="text-slate-200">{new Date(session.createdAt).toLocaleDateString()}</strong></span>
          {session.duration > 0 && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Timer size={11} className="text-cyan-400" />
                <strong className="text-slate-200 tabular-nums">{formatDuration(session.duration)}</strong>
              </span>
            </>
          )}
        </div>
      </div>

      {/* Summary Section */}
      <div className="mb-10 grid gap-6 md:grid-cols-12">
        {/* Radial Score Gauge Card */}
        <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-white/5 p-6 text-center md:col-span-4">
          <div className="relative flex h-32 w-32 items-center justify-center">
            <svg className="absolute inset-0 transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                className="stroke-white/10 fill-none"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                className={`fill-none transition-all duration-1000 ${
                  score >= 80 ? 'stroke-emerald-400' : score >= 60 ? 'stroke-amber-400' : 'stroke-rose-400'
                }`}
                strokeWidth="8"
                strokeDasharray="251.2"
                strokeDashoffset={251.2 - (251.2 * score) / 100}
                strokeLinecap="round"
              />
            </svg>
            <div className="text-center">
              <span className="text-3xl font-extrabold">{score}</span>
              <span className="text-slate-500 text-xs block">out of 100</span>
            </div>
          </div>
          <span className={`mt-4 rounded-full border px-3 py-1 text-xs font-bold tracking-wide ${badgeColor}`}>
            {ratingLabel}
          </span>
        </div>

        {/* AI Constructive Summary Card */}
        <div className="flex flex-col justify-center rounded-xl border border-white/10 bg-white/5 p-6 md:col-span-8">
          <div className="flex items-center gap-2 text-cyan-400">
            <Sparkles size={18} />
            <h3 className="text-md font-bold uppercase tracking-wider">AI feedback summary</h3>
          </div>
          <p className="mt-3 text-slate-300 leading-relaxed text-sm md:text-base">
            {session.feedbackSummary || "Analyzing your performance... We evaluate clarity, accuracy, completeness, and keyword usage. Review individual questions below."}
          </p>
        </div>
      </div>

      {/* Session Comparison Panel */}
      {historyLoaded && otherSessions.length > 0 && (
        <div className="mb-10 rounded-xl border border-white/10 bg-white/5 p-6">
          <div className="mb-5 flex items-center gap-2">
            <TrendingUp size={16} className="text-cyan-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Your Progress</h3>
            <span className="text-xs text-slate-600">
              {otherSessions.length} session{otherSessions.length !== 1 ? 's' : ''} compared
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {scoreVsLast !== null && (
              <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-center">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  vs. Last Session
                </p>
                <p
                  className={`text-3xl font-extrabold tabular-nums leading-none ${
                    scoreVsLast > 0 ? 'text-emerald-400' : scoreVsLast < 0 ? 'text-rose-400' : 'text-slate-400'
                  }`}
                >
                  {scoreVsLast > 0 ? `+${scoreVsLast}` : scoreVsLast === 0 ? '—' : `${scoreVsLast}`}
                </p>
                <p className="mt-1.5 text-xs text-slate-500">was {prevScore}%</p>
              </div>
            )}

            {scoreVsAvg !== null && (
              <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-center">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  vs. Your Average
                </p>
                <p
                  className={`text-3xl font-extrabold tabular-nums leading-none ${
                    scoreVsAvg > 0 ? 'text-emerald-400' : scoreVsAvg < 0 ? 'text-rose-400' : 'text-slate-400'
                  }`}
                >
                  {scoreVsAvg > 0 ? `+${scoreVsAvg}` : scoreVsAvg === 0 ? '—' : `${scoreVsAvg}`}
                </p>
                <p className="mt-1.5 text-xs text-slate-500">avg. {avgOtherScore}%</p>
              </div>
            )}

            {displayBest !== null && (
              <div
                className={`rounded-lg border p-4 text-center ${
                  isNewBest ? 'border-emerald-400/30 bg-emerald-500/5' : 'border-white/10 bg-white/5'
                }`}
              >
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Personal Best
                </p>
                <p
                  className={`text-3xl font-extrabold tabular-nums leading-none ${
                    isNewBest ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {displayBest}%
                </p>
                {isNewBest ? (
                  <p className="mt-1.5 text-xs font-semibold text-emerald-500">New record!</p>
                ) : (
                  <p className="mt-1.5 text-xs text-slate-500">your best</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Per-Question Score Breakdown */}
      {questions.length > 0 && (
        <div className="mb-10 rounded-xl border border-white/10 bg-white/5 p-6">
          <h3 className="mb-5 text-sm font-bold uppercase tracking-wider text-slate-400">
            Score Breakdown
          </h3>
          <div className="space-y-4">
            {scoreTiers.map(({ label, range, count, barColor, textColor }) => (
              <div key={label} className="flex items-center gap-4">
                <div className="flex w-32 shrink-0 items-center justify-between gap-2">
                  <span className={`text-sm font-semibold ${textColor}`}>{label}</span>
                  <span className="text-xs text-slate-500 tabular-nums">{range}/10</span>
                </div>
                <div className="relative flex-1 h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out ${barColor}`}
                    style={{ width: `${(count / questions.length) * 100}%` }}
                  />
                </div>
                <span className="w-20 shrink-0 text-right text-xs font-semibold text-slate-400 tabular-nums">
                  {count} of {questions.length}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Coaching Insights */}
      {coachingTips.length > 0 && (
        <div className="mb-10 rounded-xl border border-white/10 bg-white/5 p-6">
          <div className="mb-5 flex items-center gap-2">
            <Award size={16} className="text-cyan-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Coaching Insights
            </h3>
          </div>
          <div className={`grid gap-4 ${coachingTips.length === 1 ? 'grid-cols-1' : coachingTips.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
            {coachingTips.map(({ Icon, iconCls, cardCls, title, body }) => (
              <div key={title} className={`rounded-lg border p-4 ${cardCls}`}>
                <div className="mb-2 flex items-center gap-2">
                  <Icon size={15} className={iconCls} />
                  <span className="text-sm font-semibold text-slate-200">{title}</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Personal Notes */}
      <div className="mb-10 rounded-xl border border-white/10 bg-white/5 p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <PenLine size={16} className="text-violet-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Personal Notes</h3>
          </div>
          <span className={`text-xs tabular-nums ${notes.length > 1800 ? 'text-rose-400' : 'text-slate-600'}`}>
            {notes.length} / 2000
          </span>
        </div>
        <textarea
          value={notes}
          onChange={(e) => { setNotes(e.target.value.slice(0, 2000)); setNotesSaved(false); }}
          placeholder="Jot down what you learned, what tripped you up, or what to review before your next session…"
          rows={4}
          className="w-full resize-none rounded-lg border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-300 placeholder-slate-600 outline-none focus:border-violet-400/40 focus:ring-1 focus:ring-violet-400/20 transition"
        />
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-xs text-slate-600">Notes are private to you and saved with this session.</p>
          <button
            onClick={handleSaveNotes}
            disabled={savingNotes}
            className={`inline-flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-bold transition ${
              notesSaved
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'bg-violet-500/15 text-violet-300 border border-violet-400/20 hover:bg-violet-500/25'
            } disabled:opacity-60`}
          >
            {savingNotes ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />
                Saving…
              </>
            ) : notesSaved ? (
              <>
                <CheckCircle size={14} />
                Saved
              </>
            ) : (
              <>
                <PenLine size={14} />
                Save Notes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Individual Question Feedback Section */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <ClipboardCheck size={20} className="text-cyan-400" />
          Question Breakdown ({questions.length})
        </h2>

        <div className="space-y-4">
          {questions.map((q, idx) => {
            const isExpanded = expandedQuestionId === q._id;
            const qScore = q.score || 0;

            let scoreColor = 'text-rose-400';
            if (qScore >= 8) scoreColor = 'text-emerald-400';
            else if (qScore >= 6) scoreColor = 'text-amber-400';

            return (
              <div
                key={q._id}
                className={`rounded-xl border transition-all duration-200 ${
                  isExpanded ? 'border-white/20 bg-white/5' : 'border-white/10 bg-white/5/60 hover:bg-white/5'
                }`}
              >
                {/* Accordion Trigger Header */}
                <button
                  onClick={() => toggleExpand(q._id)}
                  className="flex w-full items-center justify-between gap-4 p-5 text-left outline-none"
                >
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-slate-400">Question {idx + 1}</span>
                    <h3 className="font-semibold text-slate-100 line-clamp-2 pr-2">{q.questionText}</h3>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <span className={`font-bold ${scoreColor}`}>{qScore}</span>
                      <span className="text-slate-500 text-xs">/10</span>
                    </div>
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </button>

                {/* Accordion Content Panel */}
                {isExpanded && (
                  <div className="border-t border-white/10 p-5 space-y-6">
                    {/* User Answer */}
                    <div className="space-y-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Your Answer:</span>
                      <div className="rounded-lg bg-slate-950 p-4 border border-white/5 text-sm text-slate-300 leading-relaxed font-mono whitespace-pre-wrap">
                        {q.userAnswer ? q.userAnswer : <em className="text-slate-500">No answer provided.</em>}
                      </div>
                    </div>

                    {/* AI Feedback */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-cyan-400">
                        <MessageCircle size={14} />
                        <span>AI Feedback:</span>
                      </div>
                      <p className="text-slate-300 text-sm leading-relaxed pl-1">
                        {q.feedback || "No feedback generated for this question."}
                      </p>
                    </div>

                    {/* Suggested Answer */}
                    {q.suggestedAnswer && (
                      <div className="space-y-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block">Suggested Model Answer:</span>
                        <div className="rounded-lg bg-emerald-950/20 border border-emerald-500/10 p-4 text-sm text-slate-300 leading-relaxed">
                          {q.suggestedAnswer}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions footer */}
      <div className="mt-12 flex flex-wrap gap-4 items-center justify-center">
        <button
          onClick={handleCopyFeedback}
          className={`inline-flex items-center gap-2 rounded-lg border px-6 py-3 font-bold transition ${
            copied
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
              : 'border-white/10 bg-white/5 hover:bg-white/10 text-slate-200'
          }`}
        >
          {copied ? (
            <>
              <CheckCheck size={16} />
              Copied!
            </>
          ) : (
            <>
              <Copy size={16} />
              Copy Feedback Report
            </>
          )}
        </button>

        <button
          onClick={handleDownloadFeedback}
          className={`inline-flex items-center gap-2 rounded-lg border px-6 py-3 font-bold transition ${
            downloaded
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
              : 'border-white/10 bg-white/5 hover:bg-white/10 text-slate-200'
          }`}
        >
          {downloaded ? (
            <>
              <CheckCheck size={16} />
              Downloaded!
            </>
          ) : (
            <>
              <Download size={16} />
              Download Report
            </>
          )}
        </button>

        <button
          onClick={handleRetryInterview}
          className="inline-flex items-center gap-2 rounded-lg border border-cyan-400/30 bg-cyan-400/10 hover:bg-cyan-400/20 px-6 py-3 font-bold text-cyan-400 transition"
        >
          <RotateCcw size={16} />
          Retry Same Settings
        </button>

        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 rounded-lg bg-cyan-400 hover:bg-cyan-300 px-6 py-3 font-bold text-slate-950 transition shadow-md shadow-cyan-400/15"
        >
          Practice Another Interview
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default FeedbackView;
