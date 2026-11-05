import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useMove } from '../../context/MoveContext';
import {
  Package,
  ChevronDown,
  LogOut,
  User,
  Plus,
  Menu,
  X
} from 'lucide-react';

export const Navbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const { moves, activeMove, activeMoveId, setActiveMoveId } = useMove();
  const [isPlanDropdownOpen, setIsPlanDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 sm:px-6 backdrop-blur">
      {/* Left: Mobile hamburger & Logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden rounded-lg p-2 text-slate-500 hover:bg-slate-100 focus:outline-none"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link to="/dashboard" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm shadow-brand-500/30">
            <Package className="w-5 h-5" />
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900 hidden sm:inline">
            Move<span className="text-brand-600">Mate</span>
          </span>
        </Link>
      </div>

      {/* Center: Plan Switcher */}
      <div className="relative">
        {moves.length > 0 ? (
          <div className="relative">
            <button
              onClick={() => setIsPlanDropdownOpen(!isPlanDropdownOpen)}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-1.5 text-xs sm:text-sm font-semibold text-slate-800 hover:bg-slate-100 transition max-w-[200px] sm:max-w-xs truncate"
            >
              <span className="truncate">{activeMove?.title || 'Select Moving Plan'}</span>
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
            </button>

            {isPlanDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsPlanDropdownOpen(false)}
                />
                <div className="absolute left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl z-20">
                  <div className="px-3 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Your Moving Plans
                  </div>
                  <div className="mt-1 max-h-56 overflow-y-auto space-y-1">
                    {moves.map((m) => (
                      <button
                        key={m._id}
                        onClick={() => {
                          setActiveMoveId(m._id);
                          setIsPlanDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-left text-xs sm:text-sm font-medium transition ${
                          m._id === activeMoveId
                            ? 'bg-brand-50 text-brand-700 font-semibold'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="truncate">{m.title}</span>
                        <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 uppercase">
                          {m.userRole || 'Owner'}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="mt-2 border-t border-slate-100 pt-2">
                    <button
                      onClick={() => {
                        setIsPlanDropdownOpen(false);
                        navigate('/moves');
                      }}
                      className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-brand-600 hover:bg-brand-50 transition"
                    >
                      <Plus className="w-4 h-4" />
                      Create New Plan
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <Link
            to="/moves"
            className="flex items-center gap-1.5 rounded-xl bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-600 hover:bg-brand-100 transition"
          >
            <Plus className="w-4 h-4" />
            Create Moving Plan
          </Link>
        )}
      </div>

      {/* Right: User menu */}
      <div className="relative">
        <button
          onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
          className="flex items-center gap-2 rounded-full p-1 sm:px-2.5 sm:py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-700 font-bold text-xs">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <span className="hidden md:inline text-xs font-semibold text-slate-800">
            {user?.name || 'Account'}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
        </button>

        {isUserDropdownOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsUserDropdownOpen(false)}
            />
            <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl z-20">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-800 truncate">{user?.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
              </div>

              <div className="mt-1 space-y-1">
                <Link
                  to="/moves"
                  onClick={() => setIsUserDropdownOpen(false)}
                  className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                >
                  <Package className="w-4 h-4 text-slate-400" />
                  My Moving Plans
                </Link>

                <button
                  onClick={() => {
                    setIsUserDropdownOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
                >
                  <LogOut className="w-4 h-4" />
                  Log Out
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
};

