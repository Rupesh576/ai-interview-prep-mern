import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Mail, Calendar, Award, Clock, BarChart2,
  CheckCircle2, Play, Edit3, Save, X, Loader, AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUserSessions } from '../services/sessionService';
import { updateProfile } from '../services/authService';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [sessions, setSessions] = useState([]);
  const [fetchingStats, setFetchingStats] = useState(true);
  const [statsError, setStatsError] = useState('');

  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(user?.name || '');
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState('');
  const [nameSaved, setNameSaved] = useState(false);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const data = await getUserSessions();
        setSessions(data.sessions || []);
      } catch {
        setStatsError('Could not load session stats.');
      } finally {
        setFetchingStats(false);
      }
    };
    fetchSessions();
  }, []);

  const handleSaveName = async () => {
    const trimmed = nameValue.trim();
    if (trimmed.length < 2) {
      setNameError('Name must be at least 2 characters.');
      return;
    }
    setSavingName(true);
    setNameError('');
    try {
      const data = await updateProfile(trimmed);
      updateUser(data.user);
      setEditingName(false);
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 3000);
    } catch (err) {
      setNameError(err.response?.data?.message || 'Failed to update name.');
    } finally {
      setSavingName(false);
    }
  };

  const handleCancelEdit = () => {
    setNameValue(user?.name || '');
    setNameError('');
    setEditingName(false);
  };

  // Derived stats
  const completed = sessions.filter(s => s.status === 'completed');
  const inProgress = sessions.filter(s => s.status === 'in-progress');
  const scores = completed.map(s => s.overallScore).filter(n => typeof n === 'number');
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
  const bestScore = scores.length > 0 ? Math.max(...scores) : null;
  const totalDuration = sessions.reduce((sum, s) => sum + (typeof s.duration === 'number' ? s.duration : 0), 0);

  const formatTotalDuration = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const scoreColor = (v) =>
    v === null ? 'text-slate-500' : v >= 80 ? 'text-emerald-400' : v >= 60 ? 'text-amber-400' : 'text-rose-400';

  // Difficulty breakdown
  const difficultyLevels = [
    { label: 'Beginner', barCls: 'bg-emerald-400', textCls: 'text-emerald-400' },
    { label: 'Intermediate', barCls: 'bg-amber-400', textCls: 'text-amber-400' },
    { label: 'Advanced', barCls: 'bg-rose-400', textCls: 'text-rose-400' },
  ].map(d => ({ ...d, count: sessions.filter(s => s.difficulty === d.label).length }));
  const maxDiffCount = Math.max(...difficultyLevels.map(d => d.count), 1);

  // Question type breakdown
  const typeConfig = {
    Technical: { barCls: 'bg-cyan-400', textCls: 'text-cyan-400' },
    Behavioral: { barCls: 'bg-violet-400', textCls: 'text-violet-400' },
    Mixed: { barCls: 'bg-amber-400', textCls: 'text-amber-400' },
    'System Design': { barCls: 'bg-indigo-400', textCls: 'text-indigo-400' },
  };
  const typeBreakdown = Object.entries(typeConfig)
    .map(([label, cfg]) => ({
      label,
      ...cfg,
      count: sessions.filter(s => (s.questionType || 'Technical') === label).length,
    }))
    .filter(t => t.count > 0);
  const maxTypeCount = Math.max(...typeBreakdown.map(t => t.count), 1);

  // Top roles (max 6)
  const roleCounts = {};
  sessions.forEach(s => { roleCounts[s.role] = (roleCounts[s.role] || 0) + 1; });
  const topRoles = Object.entries(roleCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);

  // User initials
  const initials = (user?.name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 text-white">

      {/* Profile header card */}
      <div className="mb-8 rounded-xl border border-white/10 bg-white/5 p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">

          {/* Avatar */}
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-500 text-2xl font-extrabold text-white shadow-lg shadow-cyan-500/20">
            {initials}
          </div>

          {/* Name / email / since */}
          <div className="flex-1 min-w-0">
            <div className="mb-2">
              {editingName ? (
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={nameValue}
                    onChange={e => { setNameValue(e.target.value); setNameError(''); }}
                    onKeyDown={e => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') handleCancelEdit(); }}
                    autoFocus
                    maxLength={60}
                    className="w-64 max-w-full rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-xl font-bold text-white outline-none focus:border-cyan-400 transition"
                  />
                  <button
                    onClick={handleSaveName}
                    disabled={savingName}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-400 px-3 py-1.5 text-sm font-bold text-slate-950 hover:bg-cyan-300 transition disabled:opacity-50"
                  >
                    {savingName ? <Loader size={14} className="animate-spin" /> : <Save size={14} />}
                    Save
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-400 hover:text-white transition"
                  >
                    <X size={14} />
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold">{user?.name}</h1>
                  <button
                    onClick={() => { setNameValue(user?.name || ''); setEditingName(true); }}
                    className="rounded-md p-1 text-slate-500 hover:text-slate-300 transition"
                    title="Edit display name"
                  >
                    <Edit3 size={15} />
                  </button>
                  {nameSaved && (
                    <span className="flex items-center gap-1 text-xs text-emerald-400">
                      <CheckCircle2 size={13} />
                      Name updated
                    </span>
                  )}
                </div>
              )}
              {nameError && (
                <p className="mt-1 flex items-center gap-1 text-xs text-rose-400">
                  <AlertCircle size={12} />
                  {nameError}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-slate-400">
              <span className="flex items-center gap-1.5">
                <Mail size={14} className="text-cyan-400 shrink-0" />
                {user?.email}
              </span>
              {user?.createdAt && (
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-cyan-400 shrink-0" />
                  Member since {new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                </span>
              )}
            </div>
          </div>

          {/* New interview CTA */}
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-400 px-5 py-2.5 text-sm font-bold text-slate-950 hover:bg-cyan-300 transition shadow-md shadow-cyan-400/20 shrink-0 self-start"
          >
            <Play size={15} />
            New Interview
          </button>
        </div>
      </div>

      {/* Stats */}
      {fetchingStats ? (
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-2">
              <div className="h-3 w-20 rounded bg-white/10" />
              <div className="h-8 w-14 rounded bg-white/10" />
            </div>
          ))}
        </div>
      ) : statsError ? (
        <div className="mb-8 flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-sm text-rose-400">
          <AlertCircle size={16} />
          {statsError}
        </div>
      ) : (
        <>
          {/* Primary stats row */}
          <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-5">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Total Sessions</p>
              <p className="text-3xl font-extrabold tabular-nums">{sessions.length}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-5">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Completed</p>
              <p className="text-3xl font-extrabold tabular-nums text-emerald-400">{completed.length}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-5">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Avg Score</p>
              <p className={`text-3xl font-extrabold tabular-nums ${scoreColor(avgScore)}`}>
                {avgScore === null ? '—' : `${avgScore}%`}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-5">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Best Score</p>
              <p className={`text-3xl font-extrabold tabular-nums ${scoreColor(bestScore)}`}>
                {bestScore === null ? '—' : `${bestScore}%`}
              </p>
            </div>
          </div>

          {/* Secondary stats row */}
          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-5">
              <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <Play size={11} className="text-cyan-400" />
                In Progress
              </p>
              <p className="text-3xl font-extrabold tabular-nums text-cyan-400">{inProgress.length}</p>
            </div>
            {totalDuration > 60 && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <Clock size={11} className="text-cyan-400" />
                  Practice Time
                </p>
                <p className="text-3xl font-extrabold tabular-nums">{formatTotalDuration(totalDuration)}</p>
              </div>
            )}
            {scores.length > 0 && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <Award size={11} className="text-cyan-400" />
                  Scored Sessions
                </p>
                <p className="text-3xl font-extrabold tabular-nums">{scores.length}</p>
              </div>
            )}
          </div>

          {/* Breakdowns */}
          {sessions.length > 0 && (
            <div className="mb-8 grid gap-6 sm:grid-cols-2">
              {/* Difficulty */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                <h3 className="mb-5 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-400">
                  <BarChart2 size={14} className="text-cyan-400" />
                  By Difficulty
                </h3>
                <div className="space-y-4">
                  {difficultyLevels.map(({ label, barCls, textCls, count }) => (
                    <div key={label} className="flex items-center gap-3">
                      <span className={`w-24 shrink-0 text-sm font-semibold ${textCls}`}>{label}</span>
                      <div className="relative flex-1 h-2 overflow-hidden rounded-full bg-white/10">
                        <div
                          className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out ${barCls}`}
                          style={{ width: `${Math.round((count / maxDiffCount) * 100)}%` }}
                        />
                      </div>
                      <span className="w-6 shrink-0 text-right text-xs font-semibold text-slate-400 tabular-nums">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Question type */}
              {typeBreakdown.length > 0 && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                  <h3 className="mb-5 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-400">
                    <BarChart2 size={14} className="text-cyan-400" />
                    By Question Type
                  </h3>
                  <div className="space-y-4">
                    {typeBreakdown.map(({ label, barCls, textCls, count }) => (
                      <div key={label} className="flex items-center gap-3">
                        <span className={`w-28 shrink-0 text-sm font-semibold ${textCls}`}>{label}</span>
                        <div className="relative flex-1 h-2 overflow-hidden rounded-full bg-white/10">
                          <div
                            className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out ${barCls}`}
                            style={{ width: `${Math.round((count / maxTypeCount) * 100)}%` }}
                          />
                        </div>
                        <span className="w-6 shrink-0 text-right text-xs font-semibold text-slate-400 tabular-nums">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Top roles */}
          {topRoles.length > 0 && (
            <div className="mb-8 rounded-xl border border-white/10 bg-white/5 p-6">
              <h3 className="mb-5 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-400">
                <User size={14} className="text-cyan-400" />
                Top Roles Practiced
              </h3>
              <div className="flex flex-wrap gap-3">
                {topRoles.map(([role, count]) => (
                  <div key={role} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                    <span className="text-sm font-semibold text-slate-200">{role}</span>
                    <span className="rounded-full bg-cyan-400/20 px-2 py-0.5 text-xs font-bold text-cyan-400 tabular-nums">
                      {count}×
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {sessions.length === 0 && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-12 text-center">
              <Play size={32} className="mx-auto mb-3 text-slate-600" />
              <p className="font-semibold text-slate-400">No sessions yet</p>
              <p className="mt-1 text-sm text-slate-500">Complete your first interview to see your stats here.</p>
              <button
                onClick={() => navigate('/')}
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-cyan-400 px-6 py-2.5 font-bold text-slate-950 hover:bg-cyan-300 transition"
              >
                <Play size={15} />
                Start First Interview
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Profile;
