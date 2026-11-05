import React, { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { useMove } from '../../context/MoveContext';
import { PlusCircle } from 'lucide-react';

export const AppLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { moves, isLoading } = useMove();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {/* If user has 0 moves and isn't loading, show a welcoming notice */}
            {!isLoading && moves.length === 0 && (
              <div className="mb-6 rounded-2xl border border-brand-200 bg-brand-50/80 p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-brand-900">
                      Welcome to MoveMate! Let's create your first moving plan.
                    </h3>
                    <p className="text-xs sm:text-sm text-brand-700 mt-1">
                      Start by adding your move dates and addresses to unlock the smart readiness dashboard, inventory packing, and moving day tracking.
                    </p>
                  </div>
                  <Link
                    to="/moves"
                    className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-brand-700 transition shrink-0"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Create First Move
                  </Link>
                </div>
              </div>
            )}

            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

