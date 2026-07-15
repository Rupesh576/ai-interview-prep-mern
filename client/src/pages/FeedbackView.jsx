import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Award, ArrowLeft, ArrowRight, ClipboardCheck, Sparkles, MessageCircle, AlertCircle, ChevronDown, ChevronUp, Copy, CheckCheck, RotateCcw, Timer, TrendingUp, BookOpen, Target } from 'lucide-react';
import { getSessionDetails } from '../services/sessionService';

const FeedbackView = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedQuestionId, setExpandedQuestionId] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const data = await getSessionDetails(id);
        setSession(data.session);
        setQuestions(data.questions || []);
        
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

  const toggleExpand = (qId) => {
    setExpandedQuestionId(expandedQuestionId === qId ? null : qId);
  };

  const handleRetryInterview = () => {
    navigate('/', {
      state: {
        prefill: {
          role: session.role,
          difficulty: session.difficulty,
          techStack: session.techStack || '',
          questionsCount: session.questionsCount || 5
        }
      }
    });
  };

  const handleCopyFeedback = async () => {
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

    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy feedback to clipboard:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center gap-3 text-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
        <p className="text-slate-400">Loading interview feedback...</p>
      </div>
    );
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
        <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
          <span>Difficulty: <strong className="text-slate-200">{session.difficulty}</strong></span>
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
