import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useMove } from '../context/MoveContext';
import { movesApi } from '../api/movesApi';
import {
  CheckSquare,
  Box,
  Layers,
  CalendarCheck,
  DollarSign,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  ShieldAlert,
  Sparkles,
  Info
} from 'lucide-react';
import { StatCard } from '../components/common/StatCard';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Badge } from '../components/common/Badge';

export const DashboardPage = () => {
  const { activeMove, activeMoveId } = useMove();
  const [dashboard, setDashboard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      if (!activeMoveId) {
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        setError('');
        const res = await movesApi.getDashboard(activeMoveId);
        setDashboard(res.data);
      } catch (err) {
        setError(err.message || 'Failed to load readiness dashboard.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, [activeMoveId]);

  if (isLoading) return <LoadingSpinner size="lg" text="Calculating moving readiness score..." />;

  if (!activeMoveId) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800">No active moving plan selected</h3>
        <p className="text-sm text-slate-500 mt-1 mb-4">
          Please select or create a moving plan to view your readiness dashboard.
        </p>
        <Link
          to="/moves"
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white hover:bg-brand-700 transition"
        >
          Go to Moving Plans
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-700">
        <p className="font-bold">Error loading dashboard</p>
        <p className="text-xs mt-1">{error}</p>
      </div>
    );
  }

  const score = dashboard?.readinessScore || 0;
  const status = dashboard?.readinessStatus || 'Not Ready';
  const pillars = dashboard?.pillarBreakdown || {};

  const getStatusColor = (s) => {
    if (s === 'Moving Ready') return 'success';
    if (s === 'Almost Ready') return 'primary';
    if (s === 'In Progress') return 'warning';
    return 'danger';
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Moving Readiness Dashboard
            </h1>
            <Badge variant={getStatusColor(status)}>{status}</Badge>
          </div>
          <p className="text-sm text-slate-500">
            Real-time algorithmic readiness score calculated across your 4 moving pillars.
          </p>
        </div>

        <Link
          to="/tracking"
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition self-start"
        >
          Moving Day Tracker
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Actionable Alerts (if any) */}
      {dashboard?.alerts?.length > 0 && (
        <div className="space-y-2">
          {dashboard.alerts.map((alert, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 rounded-2xl p-3.5 text-xs font-semibold border ${
                alert.type === 'danger'
                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                  : alert.type === 'warning'
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-sky-50 text-sky-800 border-sky-200'
              }`}
            >
              {alert.type === 'danger' ? (
                <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
              ) : alert.type === 'warning' ? (
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
              ) : (
                <Info className="w-4 h-4 shrink-0 text-sky-600" />
              )}
              <span>{alert.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Main Readiness Gauge + Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Overall Readiness Gauge Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-1.5 text-xs font-bold text-brand-600 uppercase tracking-wider mb-4">
            <Sparkles className="w-4 h-4" />
            Overall Moving Readiness
          </div>

          {/* Visual Circular Gauge */}
          <div className="relative flex items-center justify-center my-2">
            <svg className="w-48 h-48 transform -rotate-90">
              <circle
                cx="96"
                cy="96"
                r="80"
                stroke="currentColor"
                strokeWidth="14"
                className="text-slate-100"
                fill="transparent"
              />
              <circle
                cx="96"
                cy="96"
                r="80"
                stroke="currentColor"
                strokeWidth="14"
                className={`${
                  score >= 90
                    ? 'text-emerald-500'
                    : score >= 70
                    ? 'text-brand-600'
                    : score >= 35
                    ? 'text-amber-500'
                    : 'text-rose-500'
                } transition-all duration-1000 ease-out`}
                strokeDasharray={2 * Math.PI * 80}
                strokeDashoffset={2 * Math.PI * 80 * (1 - score / 100)}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
                {score}%
              </span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">
                {status}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-500 max-w-xs mt-3">
            {score >= 90
              ? 'Outstanding! Your move is highly coordinated and ready for moving day.'
              : score >= 70
              ? 'Great progress! Focus on remaining packed items and service confirmations.'
              : score >= 35
              ? 'Packing in progress. Continue completing essential tasks and packing boxes.'
              : 'Early stage. Begin by adding rooms, creating essential tasks, and cataloging belongings.'}
          </p>
        </div>

        {/* Right: 4-Pillar Breakdown Bars */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">4-Pillar Score Breakdown</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Each pillar contributes a deterministic weight toward your total 100% score.
            </p>

            <div className="mt-6 space-y-5">
              {/* Pillar 1: Essential Tasks */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5 text-brand-600" />
                    Essential Tasks ({pillars.essentialTasks?.weightPercentage || 35}%)
                  </span>
                  <span className="font-semibold text-slate-600">
                    {pillars.essentialTasks?.scoreContribution || 0} / 35 pts ({pillars.essentialTasks?.progressPercentage || 0}%)
                  </span>
                </div>
                <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-brand-600 transition-all duration-700"
                    style={{ width: `${pillars.essentialTasks?.progressPercentage || 0}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                  <span>Completed: {pillars.essentialTasks?.completed || 0}</span>
                  <span>Total: {pillars.essentialTasks?.total || 0}</span>
                </div>
              </div>

              {/* Pillar 2: Box Packing */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Box className="w-3.5 h-3.5 text-amber-600" />
                    Box Packing Progress ({pillars.boxPacking?.weightPercentage || 30}%)
                  </span>
                  <span className="font-semibold text-slate-600">
                    {pillars.boxPacking?.scoreContribution || 0} / 30 pts ({pillars.boxPacking?.progressPercentage || 0}%)
                  </span>
                </div>
                <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-500 transition-all duration-700"
                    style={{ width: `${pillars.boxPacking?.progressPercentage || 0}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                  <span>Packed/Moved: {pillars.boxPacking?.packed || 0}</span>
                  <span>Total Boxes: {pillars.boxPacking?.total || 0}</span>
                </div>
              </div>

              {/* Pillar 3: Inventory Packing */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-purple-600" />
                    Room Inventory Packing ({pillars.inventoryPacking?.weightPercentage || 20}%)
                  </span>
                  <span className="font-semibold text-slate-600">
                    {pillars.inventoryPacking?.scoreContribution || 0} / 20 pts ({pillars.inventoryPacking?.progressPercentage || 0}%)
                  </span>
                </div>
                <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-purple-500 transition-all duration-700"
                    style={{ width: `${pillars.inventoryPacking?.progressPercentage || 0}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                  <span>Packed Items: {pillars.inventoryPacking?.packed || 0}</span>
                  <span>Total Items: {pillars.inventoryPacking?.total || 0}</span>
                </div>
              </div>

              {/* Pillar 4: Utility & Services */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <CalendarCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Utility & Service Bookings ({pillars.utilityServices?.weightPercentage || 15}%)
                  </span>
                  <span className="font-semibold text-slate-600">
                    {pillars.utilityServices?.scoreContribution || 0} / 15 pts ({pillars.utilityServices?.progressPercentage || 0}%)
                  </span>
                </div>
                <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                    style={{ width: `${pillars.utilityServices?.progressPercentage || 0}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                  <span>Confirmed/Done: {pillars.utilityServices?.confirmedOrCompleted || 0}</span>
                  <span>Total Bookings: {pillars.utilityServices?.total || 0}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Formula: W(essential) + W(boxes) + W(inventory) + W(services)</span>
            <span className="font-bold text-slate-700">Max Score: 100%</span>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Tasks Completed"
          value={`${dashboard?.taskStats?.completed || 0} / ${dashboard?.taskStats?.total || 0}`}
          subtitle={`${dashboard?.taskStats?.pending || 0} remaining (${dashboard?.taskStats?.overdue || 0} overdue)`}
          icon={CheckSquare}
          color="brand"
        />

        <StatCard
          title="Boxes Packed"
          value={`${dashboard?.boxStats?.byStatus?.Packed || 0} / ${dashboard?.boxStats?.total || 0}`}
          subtitle={`${dashboard?.boxStats?.fragileCount || 0} fragile, ${dashboard?.boxStats?.priorityCount || 0} priority`}
          icon={Box}
          color="amber"
        />

        <StatCard
          title="Belongings Catalog"
          value={`${dashboard?.inventoryStats?.packed || 0} / ${dashboard?.inventoryStats?.total || 0}`}
          subtitle={`Est. value: $${dashboard?.inventoryStats?.totalEstimatedValue || 0}`}
          icon={Layers}
          color="purple"
        />

        <StatCard
          title="Moving Budget"
          value={`$${dashboard?.budgetStats?.totalActualCost || 0}`}
          subtitle={`Est: $${dashboard?.budgetStats?.totalEstimatedCost || 0} (${dashboard?.budgetStats?.isOverBudget ? 'Over budget' : 'Under budget'})`}
          icon={DollarSign}
          color={dashboard?.budgetStats?.isOverBudget ? 'rose' : 'emerald'}
        />
      </div>
    </div>
  );
};

