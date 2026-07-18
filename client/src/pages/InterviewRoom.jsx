import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Save, CheckCircle, AlertCircle, Loader, Timer, Lightbulb } from 'lucide-react';
import { getSessionDetails, saveDraftAnswers, submitInterview, getQuestionHint } from '../services/sessionService';

const InterviewRoom = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({}); // { questionId: answerText }
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitProgressMsg, setSubmitProgressMsg] = useState('Submitting answers...');
  const [error, setError] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef(null);
  const [hints, setHints] = useState({}); // { questionId: hintText }
  const [hintLoading, setHintLoading] = useState({}); // { questionId: bool }
  const autoSaveTimerRef = useRef(null);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [autoSaving, setAutoSaving] = useState(false);

  // Fetch session details on mount
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const data = await getSessionDetails(id);
        if (data.session.status === 'completed') {
          // If already completed, redirect to feedback directly
          navigate(`/feedback/${id}`);
          return;
        }

        setSession(data.session);
        setQuestions(data.questions || []);
        
        // Populate answers from DB
        const answersMap = {};
        data.questions.forEach((q) => {
          answersMap[q._id] = q.userAnswer || '';
        });
        setAnswers(answersMap);
      } catch (err) {
        console.error("Failed to load interview room:", err);
        setError('Error loading interview session. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, [id, navigate]);

  // Rotator for submitting messages to keep user engaged during API evaluation
  useEffect(() => {
    if (!submitting) return;

    const messages = [
      'Sending answers to server...',
      'Starting AI evaluation engine...',
      'Reviewing candidate explanations...',
      'Cross-referencing technical keywords...',
      'Generating constructive feedback comments...',
      'Formulating suggested model answers...',
      'Calculating individual and overall scores...',
      'Finalizing report, this may take a moment...'
    ];

    let msgIdx = 0;
    const interval = setInterval(() => {
      msgIdx = (msgIdx + 1) % messages.length;
      setSubmitProgressMsg(messages[msgIdx]);
    }, 3000);

    return () => clearInterval(interval);
  }, [submitting]);

  // Start elapsed-time clock once the session is loaded; stop on unmount or submit
  useEffect(() => {
    if (!session) return;
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [session]);

  // Clean up auto-save timer on unmount
  useEffect(() => {
    return () => clearTimeout(autoSaveTimerRef.current);
  }, []);

  const formatElapsed = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleGetHint = async (qId) => {
    if (hints[qId] || hintLoading[qId]) return;
    setHintLoading((prev) => ({ ...prev, [qId]: true }));
    try {
      const data = await getQuestionHint(id, qId);
      setHints((prev) => ({ ...prev, [qId]: data.hint }));
    } catch (err) {
      console.error('Failed to load hint:', err);
      setHints((prev) => ({ ...prev, [qId]: 'Could not load a hint. Please try again.' }));
    } finally {
      setHintLoading((prev) => ({ ...prev, [qId]: false }));
    }
  };

  const doAutoSaveSnapshot = async (answersSnapshot) => {
    if (!session) return;
    setAutoSaving(true);
    try {
      const payload = Object.keys(answersSnapshot).map((qId) => ({
        questionId: qId,
        userAnswer: answersSnapshot[qId]
      }));
      await saveDraftAnswers(id, payload);
      setLastSavedAt(new Date());
    } catch {
      // Silent — don't interrupt the user with auto-save failures
    } finally {
      setAutoSaving(false);
    }
  };

  const handleAnswerChange = (qId, val) => {
    setAnswers((prev) => {
      const next = { ...prev, [qId]: val };
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setTimeout(() => doAutoSaveSnapshot(next), 2000);
      return next;
    });
  };

  const currentQuestion = questions[currentIdx];
  const answeredCount = questions.filter((q) => !!(answers[q._id] || '').trim()).length;

  const handleSaveDraft = async () => {
    if (!session || questions.length === 0) return;
    setSaving(true);
    setError('');

    // Format answers array as expected by API
    const answersPayload = Object.keys(answers).map((qId) => ({
      questionId: qId,
      userAnswer: answers[qId]
    }));

    try {
      await saveDraftAnswers(id, answersPayload);
    } catch (err) {
      console.error("Failed to save draft:", err);
      setError('Failed to save draft answers.');
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    await handleSaveDraft();
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    }
  };

  const handlePrev = async () => {
    await handleSaveDraft();
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
    }
  };

  const handleSubmitInterview = async () => {
    if (!window.confirm('Are you sure you want to end the interview and submit for evaluation?')) {
      return;
    }

    clearInterval(timerRef.current);
    clearTimeout(autoSaveTimerRef.current);
    setSubmitting(true);
    setError('');

    try {
      // First save final draft answers
      const answersPayload = Object.keys(answers).map((qId) => ({
        questionId: qId,
        userAnswer: answers[qId]
      }));
      await saveDraftAnswers(id, answersPayload);

      // Trigger AI evaluation (pass elapsed seconds so it can be stored)
      await submitInterview(id, elapsedSeconds);
      navigate(`/feedback/${id}`);
    } catch (err) {
      console.error("Failed to submit interview:", err);
      setError(err.response?.data?.message || err.message || 'Error occurred while evaluating interview.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center gap-3 text-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
        <p className="text-slate-400">Loading interview room...</p>
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center text-white">
        <AlertCircle size={48} className="mx-auto text-red-500 mb-4 animate-bounce" />
        <h2 className="text-xl font-bold">Failed to load session</h2>
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

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 text-white relative">
      {/* Submitting Loading Overlay */}
      {submitting && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-lg">
          <div className="relative mb-6 flex h-24 w-24 items-center justify-center">
            <div className="absolute inset-0 animate-ping rounded-full bg-cyan-400/20" />
            <div className="absolute inset-2 animate-pulse rounded-full bg-cyan-400/10 border border-cyan-400/30" />
            <Loader size={40} className="animate-spin text-cyan-400" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white mb-2">Analyzing Interview</h2>
          <p className="text-slate-400 animate-pulse text-center max-w-sm px-6">{submitProgressMsg}</p>
        </div>
      )}

      {/* Top Session Metadata */}
      <div className="mb-8 flex flex-col justify-between gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-center">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">Mock Interview Room</span>
          <h1 className="text-2xl font-bold tracking-tight mt-1">{session?.role}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
            <span>Difficulty: <strong className="text-slate-200">{session?.difficulty}</strong></span>
            <span>•</span>
            <span>Type: <strong className="text-slate-200">{session?.questionType || 'Technical'}</strong></span>
            <span>•</span>
            <span>Focus: <strong className="text-slate-200">{session?.techStack || 'General'}</strong></span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Timer size={12} className="text-cyan-400" />
              <strong className="text-slate-200 tabular-nums">{formatElapsed(elapsedSeconds)}</strong>
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveDraft}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2 text-sm font-semibold transition disabled:opacity-50"
            >
              {saving ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Save size={16} />
              )}
              {saving ? 'Saving...' : 'Save Draft'}
            </button>

            <button
              onClick={handleSubmitInterview}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-sm font-bold text-slate-950 transition shadow-md shadow-emerald-500/15"
            >
              <CheckCircle size={16} />
              Submit Interview
            </button>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 h-4">
            {autoSaving ? (
              <>
                <div className="h-3 w-3 animate-spin rounded-full border border-slate-500 border-t-transparent" />
                <span>Auto-saving…</span>
              </>
            ) : lastSavedAt ? (
              <>
                <CheckCircle size={11} className="text-emerald-500/70" />
                <span>Auto-saved {lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Questions progress dot timeline */}
      <div className="mb-8 flex items-center justify-between gap-2 overflow-x-auto py-2">
        {questions.map((q, idx) => {
          const isAnswered = !!(answers[q._id] || '').trim();
          const isActive = idx === currentIdx;

          return (
            <button
              key={q._id}
              onClick={async () => {
                await handleSaveDraft();
                setCurrentIdx(idx);
              }}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-bold transition ${
                isActive
                  ? 'bg-cyan-400 border-cyan-400 text-slate-950 shadow-md shadow-cyan-400/20'
                  : isAnswered
                  ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-400'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
              }`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      {/* Answered-questions progress bar */}
      {questions.length > 0 && (
        <div className="mb-8">
          <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
            <span>
              {answeredCount} of {questions.length} question{questions.length !== 1 ? 's' : ''} answered
            </span>
            <span className={`font-semibold tabular-nums ${answeredCount === questions.length ? 'text-emerald-400' : 'text-cyan-400'}`}>
              {Math.round((answeredCount / questions.length) * 100)}%
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out ${answeredCount === questions.length ? 'bg-emerald-400' : 'bg-cyan-400'}`}
              style={{ width: `${(answeredCount / questions.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Question Card */}
      {currentQuestion && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 md:p-8 shadow-xl">
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
            Question {currentIdx + 1} of {questions.length}
          </span>
          <h2 className="mt-3 text-xl font-semibold leading-relaxed text-slate-100 md:text-2xl">
            {currentQuestion.questionText}
          </h2>

          {/* Hint section */}
          <div className="mt-5">
            {hints[currentQuestion._id] ? (
              <div className="flex gap-3 rounded-lg border border-amber-400/20 bg-amber-400/5 p-4">
                <Lightbulb size={16} className="mt-0.5 shrink-0 text-amber-400" />
                <p className="text-sm text-amber-200/90 leading-relaxed">{hints[currentQuestion._id]}</p>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => handleGetHint(currentQuestion._id)}
                disabled={hintLoading[currentQuestion._id]}
                className="inline-flex items-center gap-2 rounded-lg border border-amber-400/20 bg-amber-400/5 hover:bg-amber-400/10 px-4 py-2 text-sm font-semibold text-amber-400 transition disabled:opacity-60 disabled:pointer-events-none"
              >
                {hintLoading[currentQuestion._id] ? (
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
                ) : (
                  <Lightbulb size={14} />
                )}
                {hintLoading[currentQuestion._id] ? 'Getting hint…' : 'Get a Hint'}
              </button>
            )}
          </div>

          <div className="mt-8">
            <label className="block text-sm font-semibold text-slate-300" htmlFor="answer-input">
              Your Answer
            </label>
            <textarea
              id="answer-input"
              rows={8}
              value={answers[currentQuestion._id] || ''}
              onChange={(e) => handleAnswerChange(currentQuestion._id, e.target.value)}
              placeholder="Type your structured answer here. Be as detailed as possible, explaining definitions, workflows, and edge cases where applicable..."
              className="mt-3 block w-full rounded-lg border border-white/10 bg-slate-900/60 p-4 text-white placeholder-slate-500 shadow-inner outline-none transition focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 resize-y"
            />
            {(() => {
              const answerText = answers[currentQuestion._id] || '';
              const wordCount = answerText.trim() ? answerText.trim().split(/\s+/).length : 0;
              const charCount = answerText.length;
              const quality =
                wordCount === 0   ? { label: 'Empty',      color: 'text-slate-500',   pill: 'border-slate-500/20 bg-slate-500/10 text-slate-500',   barW: '0%',    barColor: 'bg-slate-500' } :
                wordCount < 15    ? { label: 'Too Short',  color: 'text-rose-400',    pill: 'border-rose-400/20 bg-rose-400/10 text-rose-400',       barW: `${Math.round((wordCount / 15) * 25)}%`,  barColor: 'bg-rose-400' } :
                wordCount < 40    ? { label: 'Developing', color: 'text-amber-400',   pill: 'border-amber-400/20 bg-amber-400/10 text-amber-400',    barW: `${25 + Math.round(((wordCount - 15) / 25) * 25)}%`, barColor: 'bg-amber-400' } :
                wordCount < 80    ? { label: 'Good',       color: 'text-cyan-400',    pill: 'border-cyan-400/20 bg-cyan-400/10 text-cyan-400',       barW: `${50 + Math.round(((wordCount - 40) / 40) * 25)}%`, barColor: 'bg-cyan-400' } :
                                    { label: 'Detailed',   color: 'text-emerald-400', pill: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-400', barW: '100%', barColor: 'bg-emerald-400' };
              return (
                <div className="mt-2 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">
                      {wordCount} word{wordCount !== 1 ? 's' : ''} · {charCount} chars
                    </span>
                    <span className={`rounded-full border px-2.5 py-0.5 font-semibold ${quality.pill}`}>
                      {quality.label}
                    </span>
                  </div>
                  <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ease-out ${quality.barColor}`}
                      style={{ width: quality.barW }}
                    />
                  </div>
                  {wordCount > 0 && wordCount < 40 && (
                    <p className="text-xs text-slate-500">
                      Aim for at least 40 words for a strong answer.
                    </p>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Navigation Footer */}
      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={handlePrev}
          disabled={currentIdx === 0}
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-5 py-3 font-semibold text-slate-200 transition disabled:opacity-30 disabled:pointer-events-none"
        >
          <ArrowLeft size={18} />
          Previous
        </button>

        {currentIdx < questions.length - 1 ? (
          <button
            onClick={handleNext}
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-400 hover:bg-cyan-300 px-5 py-3 font-bold text-slate-950 transition shadow-md shadow-cyan-400/15"
          >
            Next Question
            <ArrowRight size={18} />
          </button>
        ) : (
          <button
            onClick={handleSubmitInterview}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 px-6 py-3 font-extrabold text-slate-950 transition shadow-lg shadow-emerald-500/15 animate-pulse hover:animate-none"
          >
            <CheckCircle size={18} />
            Complete Interview
          </button>
        )}
      </div>
    </div>
  );
};

export default InterviewRoom;
