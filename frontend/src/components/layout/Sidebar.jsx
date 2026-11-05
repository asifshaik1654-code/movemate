import React from 'react';
import { NavLink } from 'react-router-dom';
import { useMove } from '../../context/MoveContext';
import {
  LayoutDashboard,
  Truck,
  CheckSquare,
  Home,
  Box,
  Layers,
  DollarSign,
  CalendarCheck,
  Users,
  Clock,
  FolderKanban
} from 'lucide-react';

export const Sidebar = ({ isOpen, onClose }) => {
  const { activeMove, userRole } = useMove();

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Moving Day Tracker', path: '/tracking', icon: Truck },
    { label: 'Tasks & Checklist', path: '/tasks', icon: CheckSquare },
    { label: 'Rooms', path: '/rooms', icon: Home },
    { label: 'Boxes & QR Codes', path: '/boxes', icon: Box },
    { label: 'Inventory', path: '/inventory', icon: Layers },
    { label: 'Budget & Expenses', path: '/budget', icon: DollarSign },
    { label: 'Service Bookings', path: '/bookings', icon: CalendarCheck },
    { label: 'Team Members', path: '/members', icon: Users },
    { label: 'Activity Timeline', path: '/activity', icon: Clock }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-white border-r border-slate-200 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col justify-between p-4">
          <div>
            {/* Active move card banner */}
            {activeMove ? (
              <div className="mb-4 p-3 rounded-2xl bg-gradient-to-br from-brand-50 to-indigo-50/50 border border-brand-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600">
                    Active Moving Plan
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-brand-700 border border-brand-200 shadow-2xs">
                    {userRole}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 truncate">{activeMove.title}</h4>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                  {activeMove.destinationAddress || 'No destination set'}
                </p>
              </div>
            ) : (
              <div className="mb-4 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
                No active moving plan selected.
              </div>
            )}

            {/* Navigation links */}
            <div className="space-y-1">
              <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Management
              </div>
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => {
                      if (window.innerWidth < 1024) onClose();
                    }}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold transition ${
                        isActive
                          ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/20'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>

          {/* Footer link to My Moves */}
          <div className="border-t border-slate-100 pt-3">
            <NavLink
              to="/moves"
              onClick={() => {
                if (window.innerWidth < 1024) onClose();
              }}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold transition ${
                  isActive
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`
              }
            >
              <FolderKanban className="w-4 h-4 text-slate-400 shrink-0" />
              <span>All Moving Plans</span>
            </NavLink>
          </div>
        </div>
      </aside>
    </>
  );
};

