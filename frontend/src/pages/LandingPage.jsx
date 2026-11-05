import React from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  ArrowRight,
  ShieldCheck,
  QrCode,
  Truck,
  CheckCircle2,
  Users,
  DollarSign,
  Layers,
  Sparkles
} from 'lucide-react';

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm shadow-brand-500/30">
              <Package className="w-5 h-5" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-slate-900">
              Move<span className="text-brand-600">Mate</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 transition"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-sm shadow-brand-500/20 transition"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 border border-brand-200/60 text-brand-700 text-xs font-bold uppercase tracking-wider mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              Intelligent Home Moving Coordinator
            </div>

            <h1 className="text-4xl sm:text-6xl font-black text-slate-950 tracking-tight max-w-4xl mx-auto leading-tight">
              Take the stress out of moving with a <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-indigo-600">Smart Moving OS</span>
            </h1>

            <p className="mt-6 text-base sm:text-xl text-slate-600 max-w-2xl mx-auto font-normal">
              Organize room-by-room packing, print scannable box QR codes, coordinate utility cutovers, track moving expenses, and watch your moving readiness score soar.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Link
                to="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-base font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-lg shadow-brand-500/25 transition"
              >
                Start Your Moving Plan Free
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 rounded-2xl text-base font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition"
              >
                Sign In to Existing Move
              </Link>
            </div>
          </div>
        </section>

        {/* Core Pillars Feature Grid */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Everything you need for an orderly move
            </h2>
            <p className="text-sm sm:text-base text-slate-500 mt-2">
              Replace messy spreadsheets and lost notebooks with a deterministic moving platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mb-5">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">4-Pillar Readiness Index</h3>
              <p className="text-sm text-slate-500 mt-2">
                Real-time algorithmic score weighing essential tasks, box packing, room inventory, and utility bookings.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-5">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Printable Box QR Codes</h3>
              <p className="text-sm text-slate-500 mt-2">
                Generate secure QR labels for every box. Scan to instantly reveal contents, room placement, and fragility flags.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Moving Day Live Tracker</h3>
              <p className="text-sm text-slate-500 mt-2">
                State machine tracking every container from Packed to Loaded, In Transit, and Delivered with Missing box alerts.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mb-5">
                <DollarSign className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Budget & Expense Variance</h3>
              <p className="text-sm text-slate-500 mt-2">
                Monitor estimated vs. actual costs across movers, truck rentals, packing materials, and utility fees.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-5">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Team Collaboration</h3>
              <p className="text-sm text-slate-500 mt-2">
                Invite roommates, family, or partners with Editor or Viewer roles and track individual task completion metrics.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-5">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Room-by-Room Inventory</h3>
              <p className="text-sm text-slate-500 mt-2">
                Catalog your belongings, assign items to specific boxes, and never misplace your essential kitchenware again.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
            <Package className="w-4 h-4 text-brand-600" />
            MoveMate – Built for College Portfolio & Beyond
          </div>
          <div className="text-xs text-slate-400">
            &copy; {new Date().getFullYear()} MoveMate. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

