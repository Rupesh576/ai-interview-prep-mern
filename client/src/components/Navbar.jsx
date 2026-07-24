import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Brain, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';


const Navbar = () => {
  const { user, logoutUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-500 text-white shadow-lg shadow-cyan-500/20">
            <Brain size={22} className="animate-pulse" />
          </div>
          <span className="bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-xl font-bold tracking-tight text-transparent">
            InterviewLab
          </span>
        </Link>

        {isAuthenticated ? (
          <div className="flex items-center gap-4">
            <Link
              to="/profile"
              className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 transition hover:border-white/20 hover:bg-white/10 md:flex"
            >
              <User size={16} className="text-cyan-400" />
              <span>{user?.name}</span>
            </Link>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-500 hover:text-white"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-300 transition hover:text-white"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 shadow-md shadow-cyan-400/20"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
