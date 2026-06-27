import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, UserPlus, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { registerUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await registerUser(name, email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-73px)] items-center justify-center bg-slate-950 px-6 py-12">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 shadow-xl backdrop-blur-lg">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Create Account</h2>
          <p className="mt-2 text-sm text-slate-400">Sign up to start practicing interviews with AI</p>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-200" htmlFor="name">
              Full Name
            </label>
            <div className="relative mt-2">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <User size={18} />
              </span>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="block w-full rounded-lg border border-white/10 bg-slate-900/60 py-3 pl-10 pr-4 text-white placeholder-slate-500 shadow-inner outline-none transition focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-200" htmlFor="email">
              Email Address
            </label>
            <div className="relative mt-2">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Mail size={18} />
              </span>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="block w-full rounded-lg border border-white/10 bg-slate-900/60 py-3 pl-10 pr-4 text-white placeholder-slate-500 shadow-inner outline-none transition focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-200" htmlFor="password">
              Password
            </label>
            <div className="relative mt-2">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Lock size={18} />
              </span>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                className="block w-full rounded-lg border border-white/10 bg-slate-900/60 py-3 pl-10 pr-4 text-white placeholder-slate-500 shadow-inner outline-none transition focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-400 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
            ) : (
              <>
                <UserPlus size={18} />
                Create Account
              </>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-cyan-400 hover:text-cyan-300 transition">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
