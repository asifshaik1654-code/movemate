import React, { useState, useEffect } from 'react';
import { useMove } from '../context/MoveContext';
import { movesApi } from '../api/movesApi';
import {
  Truck,
  Package,
  Home,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  Star,
  RefreshCw
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { StatCard } from '../components/common/StatCard';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const TrackingPage = () => {
  const { activeMoveId } = useMove();
  const [tracking, setTracking] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTracking = async () => {
    if (!activeMoveId) return;
    try {
      setIsLoading(true);
      setError('');
      const res = await movesApi.getTracking(activeMoveId);
      setTracking(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load moving day tracking data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTracking();
  }, [activeMoveId]);

  if (isLoading) return <LoadingSpinner size="lg" text="Connecting to moving day live tracker..." />;

  if (!tracking) {
    return (
      <EmptyState
        icon={Truck}
        title="No tracking data available"
        description="Select a moving plan to view moving day logistics."
      />
    );
  }

  const deliveryPct = tracking.deliveryPercentage || 0;
  const stages = tracking.transitStages || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Moving Day Tracker</h1>
            <Badge variant="primary">Real-Time Logistics</Badge>
          </div>
          <p className="text-sm text-slate-500">
            Monitor container progression across transit stages and ensure all items reach their destination.
          </p>
        </div>

        <button
          onClick={fetchTracking}
          className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition self-start"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Status
        </button>
      </div>

      {/* Missing Box Emergency Alert (if any) */}
      {tracking.missingBoxes?.length > 0 && (
        <div className="rounded-3xl bg-rose-50 border-2 border-rose-300 p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-rose-100 text-rose-700 shrink-0">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-rose-900">
                Action Required: {tracking.missingBoxes.length} Container Flagged as Missing!
              </h3>
              <p className="text-xs text-rose-700 mt-1">
                The following boxes were marked missing during transit or delivery check-in. Inspect the moving truck or staging area immediately:
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {tracking.missingBoxes.map((mb) => (
                  <span
                    key={mb._id}
                    className="font-mono text-xs font-bold px-3 py-1 rounded-xl bg-white border border-rose-200 text-rose-800 shadow-2xs"
                  >
                    {mb.boxLabel} {mb.room?.name ? `(${mb.room.name})` : ''}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Delivery Progress Bar Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">
              Transit Pipeline
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">
              Overall Delivery Completion
            </h2>
          </div>
          <span className="text-3xl font-black text-slate-900">{deliveryPct}%</span>
        </div>

        {/* Progress Bar */}
        <div className="h-4 w-full rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-700"
            style={{ width: `${deliveryPct}%` }}
          />
        </div>

        {/* Stages Pipeline */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">At Origin</div>
            <div className="text-2xl font-black text-slate-800 mt-1">{stages.atOriginCount || 0}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Packed / Waiting</div>
          </div>

          <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200/70">
            <div className="text-[11px] font-bold text-sky-600 uppercase tracking-wider">In Transit</div>
            <div className="text-2xl font-black text-sky-900 mt-1">{stages.inTransitCount || 0}</div>
            <div className="text-[11px] text-sky-600 mt-0.5">Loaded on Truck</div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/70">
            <div className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Delivered</div>
            <div className="text-2xl font-black text-emerald-900 mt-1">{stages.deliveredCount || 0}</div>
            <div className="text-[11px] text-emerald-600 mt-0.5">Safe at New Home</div>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200/70">
            <div className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Missing</div>
            <div className="text-2xl font-black text-rose-900 mt-1">{stages.missingCount || 0}</div>
            <div className="text-[11px] text-rose-600 mt-0.5">Needs Recovery</div>
          </div>
        </div>
      </div>

      {/* Two Column Section: Fragile Highlights & Room Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fragile & Priority Containers */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                Fragile Containers ({tracking.fragileBoxes?.length || 0})
              </h3>
              <span className="text-xs text-slate-400">Handle with extra care</span>
            </div>

            {tracking.fragileBoxes?.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-6 text-center">
                No boxes marked fragile in this move.
              </p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {tracking.fragileBoxes.map((fb) => (
                  <div
                    key={fb._id}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">{fb.boxLabel}</span>
                        <span className="text-slate-500">• {fb.room?.name || 'No Room'}</span>
                      </div>
                      {fb.description && (
                        <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-xs">
                          {fb.description}
                        </p>
                      )}
                    </div>
                    <Badge variant={fb.status === 'Delivered' ? 'success' : 'warning'}>
                      {fb.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
            Priority boxes: <strong>{tracking.priorityBoxes?.length || 0}</strong> designated for immediate unpacking
          </div>
        </div>

        {/* Room-by-Room Delivery Progress */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Home className="w-4 h-4 text-brand-600" />
              Room Delivery Progress
            </h3>
            <span className="text-xs text-slate-400">Destination check-in</span>
          </div>

          {tracking.roomDeliveryProgress?.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-6 text-center">
              No rooms created yet.
            </p>
          ) : (
            <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
              {tracking.roomDeliveryProgress.map((rm) => (
                <div key={rm._id}>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <div className="flex items-center gap-2 font-bold text-slate-800">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: rm.colorCode || '#6366f1' }}
                      />
                      <span>{rm.name}</span>
                    </div>
                    <span className="font-semibold text-slate-500">
                      {rm.deliveredBoxes} / {rm.totalBoxes} delivered ({rm.progressPercentage}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${rm.progressPercentage}%`,
                        backgroundColor: rm.colorCode || '#6366f1'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

