import React, { useState, useEffect, useCallback } from 'react';
import { useMove } from '../context/MoveContext';
import { movesApi } from '../api/movesApi';
import {
  History,
  CheckCircle2,
  Package,
  Home,
  Layers,
  DollarSign,
  Truck,
  Users,
  Compass,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Filter,
  Clock,
  User as UserIcon
} from 'lucide-react';
import Badge from '../components/common/Badge';
import EmptyState from '../components/common/EmptyState';
import LoadingSpinner from '../components/common/LoadingSpinner';

const ENTITY_ICONS = {
  Move: Compass,
  Task: CheckCircle2,
  Room: Home,
  Box: Package,
  Inventory: Layers,
  Expense: DollarSign,
  Booking: Truck,
  Member: Users
};

const ENTITY_COLORS = {
  Move: 'bg-purple-100 text-purple-700 border-purple-200',
  Task: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Room: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  Box: 'bg-blue-100 text-blue-700 border-blue-200',
  Inventory: 'bg-teal-100 text-teal-700 border-teal-200',
  Expense: 'bg-amber-100 text-amber-700 border-amber-200',
  Booking: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  Member: 'bg-rose-100 text-rose-700 border-rose-200'
};

const ENTITY_TYPES = [
  'All',
  'Move',
  'Task',
  'Room',
  'Box',
  'Inventory',
  'Expense',
  'Booking',
  'Member'
];

export function ActivityPage() {
  const { activeMove, activeMoveId } = useMove();

  const [activities, setActivities] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, pages: 1 });
  const [selectedEntity, setSelectedEntity] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchActivity = useCallback(async (page = 1) => {
    if (!activeMoveId) {
      setActivities([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const params = {
        page,
        limit: 25
      };
      if (selectedEntity !== 'All') {
        params.entityType = selectedEntity;
      }

      const res = await movesApi.getActivity(activeMoveId, params);
      setActivities(res.data?.activities || []);
      setPagination(
        res.data?.pagination || { page: 1, limit: 25, total: 0, pages: 1 }
      );
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load activity timeline');
    } finally {
      setIsLoading(false);
    }
  }, [activeMoveId, selectedEntity]);

  useEffect(() => {
    fetchActivity(1);
  }, [fetchActivity]);

  const handlePrevPage = () => {
    if (pagination.page > 1) {
      fetchActivity(pagination.page - 1);
    }
  };

  const handleNextPage = () => {
    if (pagination.page < pagination.pages) {
      fetchActivity(pagination.page + 1);
    }
  };

  const formatActivityDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!activeMoveId) {
    return (
      <EmptyState
        icon={History}
        title="No Active Move Selected"
        description="Select or create a moving plan to view its real-time audit log and activity timeline."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <History className="w-7 h-7 text-brand-600" />
            Activity Timeline
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Audit history of every task, box, room, booking, and member change in{' '}
            <span className="font-semibold text-slate-700">{activeMove?.title}</span>.
          </p>
        </div>

        <button
          onClick={() => fetchActivity(pagination.page)}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Feed
        </button>
      </div>

      {/* Filter Chips */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2 overflow-x-auto">
        <Filter className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-1 shrink-0">
          Filter:
        </span>
        {ENTITY_TYPES.map((type) => {
          const isActive = selectedEntity === type;
          return (
            <button
              key={type}
              onClick={() => setSelectedEntity(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                isActive
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {type}
            </button>
          );
        })}
      </div>

      {/* Timeline Content */}
      {isLoading ? (
        <div className="py-16 flex justify-center">
          <LoadingSpinner size="lg" text="Loading timeline..." />
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      ) : activities.length === 0 ? (
        <EmptyState
          icon={History}
          title="No Activity Found"
          description={
            selectedEntity !== 'All'
              ? `No activity logs found for category "${selectedEntity}". Try selecting "All" to view all events.`
              : 'Actions taken on tasks, boxes, rooms, and collaborators will automatically be recorded here.'
          }
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="relative pl-6 border-l-2 border-slate-200 space-y-6">
            {activities.map((item) => {
              const IconComponent = ENTITY_ICONS[item.entityType] || History;
              const colorClass =
                ENTITY_COLORS[item.entityType] || 'bg-slate-100 text-slate-700 border-slate-200';
              const actorName = item.userId?.name || 'System';

              return (
                <div key={item._id} className="relative group">
                  {/* Timeline bullet icon */}
                  <div
                    className={`absolute -left-[37px] top-0 w-8 h-8 rounded-full border-2 flex items-center justify-center shadow-sm bg-white ${colorClass}`}
                  >
                    <IconComponent className="w-4 h-4" />
                  </div>

                  <div className="bg-slate-50 hover:bg-slate-100/70 rounded-xl p-4 border border-slate-200/80 transition space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-800">
                          {item.action?.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">
                          [{item.entityType}]
                        </span>
                      </div>

                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {formatActivityDate(item.createdAt)}
                      </span>
                    </div>

                    <p className="text-sm font-medium text-slate-800">
                      {item.details}
                    </p>

                    <div className="flex items-center gap-2 pt-1 text-xs text-slate-500">
                      <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Logged by <strong className="text-slate-700 font-semibold">{actorName}</strong>
                        {item.userId?.email ? ` (${item.userId.email})` : ''}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {pagination.pages > 1 && (
            <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
              <p className="text-xs text-slate-500">
                Showing page <strong className="font-semibold text-slate-800">{pagination.page}</strong> of{' '}
                <strong className="font-semibold text-slate-800">{pagination.pages}</strong> ({pagination.total} total events)
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevPage}
                  disabled={pagination.page <= 1}
                  className="px-3 py-1.5 border border-slate-200 text-xs font-medium rounded-lg text-slate-700 hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={pagination.page >= pagination.pages}
                  className="px-3 py-1.5 border border-slate-200 text-xs font-medium rounded-lg text-slate-700 hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ActivityPage;
