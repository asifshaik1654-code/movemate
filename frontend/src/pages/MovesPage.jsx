import React, { useState } from 'react';
import { useMove } from '../context/MoveContext';
import { movesApi } from '../api/movesApi';
import {
  FolderKanban,
  Plus,
  Calendar,
  MapPin,
  CheckCircle2,
  Trash2,
  Edit2,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';

export const MovesPage = () => {
  const { moves, activeMoveId, setActiveMoveId, refreshMoves } = useMove();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMove, setEditingMove] = useState(null);

  // Form states
  const [title, setTitle] = useState('');
  const [currentAddress, setCurrentAddress] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [moveDate, setMoveDate] = useState('');
  const [status, setStatus] = useState('Planning');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const openCreateModal = () => {
    setTitle('');
    setCurrentAddress('');
    setDestinationAddress('');
    setMoveDate('');
    setStatus('Planning');
    setError('');
    setIsCreateModalOpen(true);
  };

  const openEditModal = (move) => {
    setEditingMove(move);
    setTitle(move.title || '');
    setCurrentAddress(move.currentAddress || '');
    setDestinationAddress(move.destinationAddress || '');
    setMoveDate(move.moveDate ? move.moveDate.substring(0, 10) : '');
    setStatus(move.status || 'Planning');
    setError('');
    setIsEditModalOpen(true);
  };

  const handleCreateMove = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const payload = {
        title: title.trim(),
        currentAddress: currentAddress.trim(),
        destinationAddress: destinationAddress.trim(),
        moveDate: new Date(moveDate).toISOString(),
        status
      };
      const res = await movesApi.createMove(payload);
      await refreshMoves();
      if (res.data?._id) {
        setActiveMoveId(res.data._id);
      }
      setIsCreateModalOpen(false);
    } catch (err) {
      setError(err.message || 'Failed to create moving plan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateMove = async (e) => {
    e.preventDefault();
    if (!editingMove) return;

    setIsSubmitting(true);
    setError('');

    try {
      const payload = {
        title: title.trim(),
        currentAddress: currentAddress.trim(),
        destinationAddress: destinationAddress.trim(),
        moveDate: new Date(moveDate).toISOString(),
        status
      };
      await movesApi.updateMove(editingMove._id, payload);
      await refreshMoves();
      setIsEditModalOpen(false);
    } catch (err) {
      setError(err.message || 'Failed to update moving plan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMove = async (moveId, moveTitle) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${moveTitle}"? All linked tasks, boxes, and items will be deleted.`)) {
      return;
    }

    try {
      await movesApi.deleteMove(moveId);
      await refreshMoves();
    } catch (err) {
      alert(err.message || 'Failed to delete move.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Moving Plans</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your personal relocations or collaborate on shared household moves.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-brand-500/20 hover:bg-brand-700 transition self-start"
        >
          <Plus className="w-4 h-4" />
          New Moving Plan
        </button>
      </div>

      {/* Moves List */}
      {moves.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No moving plans yet"
          description="Create your first moving plan to track your packing, utilities, and deadlines."
          actionLabel="Create Moving Plan"
          onAction={openCreateModal}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {moves.map((move) => {
            const isActive = move._id === activeMoveId;
            const isOwner = move.userRole === 'Owner';
            const canEdit = isOwner || move.userRole === 'Editor';

            return (
              <div
                key={move._id}
                className={`flex flex-col justify-between rounded-3xl p-6 bg-white border transition shadow-sm hover:shadow-md ${
                  isActive ? 'border-brand-500 ring-2 ring-brand-500/10' : 'border-slate-200/80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      Role: {move.userRole || 'Owner'}
                    </span>
                    <Badge
                      variant={
                        move.status === 'Completed'
                          ? 'success'
                          : move.status === 'Moving Day'
                          ? 'warning'
                          : 'primary'
                      }
                    >
                      {move.status}
                    </Badge>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 line-clamp-1">{move.title}</h3>

                  <div className="mt-4 space-y-2 text-xs text-slate-600">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-slate-700">From: </span>
                        <span>{move.currentAddress || 'Not set'}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-slate-700">To: </span>
                        <span>{move.destinationAddress || 'Not set'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>
                        {move.moveDate
                          ? new Date(move.moveDate).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })
                          : 'No date set'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => setActiveMoveId(move._id)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-xl transition ${
                      isActive
                        ? 'bg-brand-50 text-brand-700 cursor-default'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {isActive ? 'Active Plan' : 'Select Plan'}
                  </button>

                  <div className="flex items-center gap-1">
                    {canEdit && (
                      <button
                        onClick={() => openEditModal(move)}
                        title="Edit plan"
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                    {isOwner && (
                      <button
                        onClick={() => handleDeleteMove(move._id, move.title)}
                        title="Delete plan"
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Move Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Moving Plan"
      >
        <form onSubmit={handleCreateMove} className="space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Move Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Downtown to Sunny Suburbs"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Current Address
              </label>
              <input
                type="text"
                required
                value={currentAddress}
                onChange={(e) => setCurrentAddress(e.target.value)}
                placeholder="123 Old Street"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Destination Address
              </label>
              <input
                type="text"
                required
                value={destinationAddress}
                onChange={(e) => setDestinationAddress(e.target.value)}
                placeholder="456 New Avenue"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Moving Date
              </label>
              <input
                type="date"
                required
                value={moveDate}
                onChange={(e) => setMoveDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Initial Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                <option value="Planning">Planning</option>
                <option value="In Progress">In Progress</option>
                <option value="Moving Day">Moving Day</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 transition"
            >
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              Create Plan
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Move Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Moving Plan"
      >
        <form onSubmit={handleUpdateMove} className="space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Move Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Current Address
              </label>
              <input
                type="text"
                required
                value={currentAddress}
                onChange={(e) => setCurrentAddress(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Destination Address
              </label>
              <input
                type="text"
                required
                value={destinationAddress}
                onChange={(e) => setDestinationAddress(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Moving Date
              </label>
              <input
                type="date"
                required
                value={moveDate}
                onChange={(e) => setMoveDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                <option value="Planning">Planning</option>
                <option value="In Progress">In Progress</option>
                <option value="Moving Day">Moving Day</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 transition"
            >
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              Save Changes
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

