import React, { useState, useEffect } from 'react';
import { useMove } from '../context/MoveContext';
import { boxesApi } from '../api/boxesApi';
import { roomsApi } from '../api/roomsApi';
import {
  Box as BoxIcon,
  Plus,
  QrCode,
  AlertTriangle,
  Star,
  Printer,
  Trash2,
  Edit2,
  Loader2,
  AlertCircle,
  Filter,
  CheckCircle2,
  Layers
} from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

const BOX_STATUSES = [
  'Not Started',
  'Packing',
  'Packed',
  'Loaded',
  'In Transit',
  'Delivered',
  'Missing'
];

export const BoxesPage = () => {
  const { activeMoveId, canEdit } = useMove();
  const [boxes, setBoxes] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [roomFilter, setRoomFilter] = useState('');
  const [search, setSearch] = useState('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedBoxForQR, setSelectedBoxForQR] = useState(null);
  const [boxDetail, setBoxDetail] = useState(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Form states
  const [roomId, setRoomId] = useState('');
  const [description, setDescription] = useState('');
  const [isFragile, setIsFragile] = useState(false);
  const [isPriority, setIsPriority] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchBoxes = async () => {
    if (!activeMoveId) return;
    try {
      setIsLoading(true);
      setError('');
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (roomFilter) params.roomId = roomFilter;
      if (search) params.search = search;

      const [resBoxes, resRooms] = await Promise.all([
        boxesApi.getMoveBoxes(activeMoveId, params),
        roomsApi.getMoveRooms(activeMoveId).catch(() => ({ data: [] }))
      ]);

      setBoxes(resBoxes.data?.boxes || []);
      setRooms(resRooms.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load boxes.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBoxes();
  }, [activeMoveId, statusFilter, roomFilter, search]);

  const openCreateModal = () => {
    setRoomId(rooms[0]?._id || '');
    setDescription('');
    setIsFragile(false);
    setIsPriority(false);
    setFormError('');
    setIsCreateModalOpen(true);
  };

  const handleCreateBox = async (e) => {
    e.preventDefault();
    if (!canEdit || !roomId) return;

    setIsSubmitting(true);
    setFormError('');

    try {
      await boxesApi.createBox(activeMoveId, {
        roomId,
        description: description.trim(),
        isFragile,
        isPriority
      });
      await fetchBoxes();
      setIsCreateModalOpen(false);
    } catch (err) {
      setFormError(err.message || 'Failed to create box.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (boxId, newStatus) => {
    if (!canEdit) return;
    try {
      await boxesApi.updateBox(boxId, { status: newStatus });
      fetchBoxes();
    } catch (err) {
      alert(err.message || 'Status transition not allowed.');
    }
  };

  const handleDeleteBox = async (boxId, boxLabel) => {
    if (!canEdit) return;
    if (!window.confirm(`Delete box "${boxLabel}"? Any contained items will be preserved and unlinked.`)) {
      return;
    }

    try {
      await boxesApi.deleteBox(boxId);
      fetchBoxes();
    } catch (err) {
      alert(err.message || 'Failed to delete box.');
    }
  };

  const handleOpenQRModal = async (box) => {
    setSelectedBoxForQR(box);
    setIsLoadingDetail(true);
    try {
      const res = await boxesApi.getBox(box._id);
      setBoxDetail(res.data);
    } catch {
      setBoxDetail(box);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handlePrintQR = () => {
    const printContent = document.getElementById('qr-printable-area');
    const win = window.open('', '', 'width=600,height=600');
    win.document.write(`
      <html>
        <head>
          <title>Print Label - ${selectedBoxForQR?.boxLabel}</title>
          <style>
            body { font-family: sans-serif; text-align: center; padding: 20px; }
            .label { font-size: 24px; font-weight: bold; margin-bottom: 8px; }
            .room { font-size: 16px; color: #475569; margin-bottom: 16px; }
            img { width: 220px; height: 220px; margin: 0 auto; }
            .warning { font-size: 14px; color: #dc2626; font-weight: bold; margin-top: 10px; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  const getStatusBadge = (s) => {
    if (s === 'Delivered') return 'success';
    if (s === 'Missing') return 'danger';
    if (s === 'Loaded' || s === 'In Transit') return 'info';
    if (s === 'Packed') return 'purple';
    if (s === 'Packing') return 'warning';
    return 'neutral';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Boxes & QR Codes</h1>
          <p className="text-sm text-slate-500 mt-1">
            Track containers with unique labels, scannable QR codes, and real-time state machine progression.
          </p>
        </div>
        {canEdit && (
          <button
            onClick={openCreateModal}
            disabled={rooms.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50 transition self-start"
          >
            <Plus className="w-4 h-4" />
            Add Box
          </button>
        )}
      </div>

      {rooms.length === 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800">
          <strong>Tip:</strong> Create at least one Room in the Rooms section before adding boxes.
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
          <Filter className="w-3.5 h-3.5" />
          Filter:
        </div>

        {/* Room filter */}
        <select
          value={roomFilter}
          onChange={(e) => setRoomFilter(e.target.value)}
          className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white focus:outline-none"
        >
          <option value="">All Rooms</option>
          {rooms.map((r) => (
            <option key={r._id} value={r._id}>
              {r.name}
            </option>
          ))}
        </select>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white focus:outline-none"
        >
          <option value="">All Statuses</option>
          {BOX_STATUSES.map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>

        {/* Label search */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by label (e.g. KIT-001)..."
          className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none"
        />
      </div>

      {/* Boxes Grid */}
      {isLoading ? (
        <LoadingSpinner text="Loading boxes..." />
      ) : boxes.length === 0 ? (
        <EmptyState
          icon={BoxIcon}
          title="No boxes match your criteria"
          description={canEdit ? 'Add boxes to pack room belongings and generate printable QR labels.' : 'No boxes defined yet.'}
          actionLabel={canEdit && rooms.length > 0 ? 'Create Box' : undefined}
          onAction={canEdit ? openCreateModal : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {boxes.map((box) => (
            <div
              key={box._id}
              className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-xl">
                      {box.boxLabel}
                    </span>
                    {box.isPriority && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                        <Star className="w-2.5 h-2.5 fill-amber-500" />
                        PRIORITY
                      </span>
                    )}
                    {box.isFragile && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        FRAGILE
                      </span>
                    )}
                  </div>

                  <Badge variant={getStatusBadge(box.status)}>{box.status}</Badge>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 mb-2">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: box.roomId?.colorCode || '#6366f1' }}
                  />
                  <span>Room: {box.roomId?.name || 'Unassigned'}</span>
                </div>

                {box.description ? (
                  <p className="text-xs text-slate-500 line-clamp-2 mt-2">{box.description}</p>
                ) : (
                  <p className="text-xs text-slate-400 italic mt-2">No description provided</p>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 space-y-3">
                {/* Status Selector */}
                {canEdit && (
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Update Box Status
                    </label>
                    <select
                      value={box.status}
                      onChange={(e) => handleStatusChange(box._id, e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-800 bg-slate-50 focus:outline-none"
                    >
                      {BOX_STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* QR Code and Actions */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => handleOpenQRModal(box)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-700 bg-brand-50 px-3 py-1.5 rounded-xl transition"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    View & Print QR
                  </button>

                  {canEdit && (
                    <button
                      onClick={() => handleDeleteBox(box._id, box.boxLabel)}
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                      title="Delete box"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Box Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add New Moving Box"
      >
        <form onSubmit={handleCreateBox} className="space-y-4">
          {formError && (
            <div className="flex items-start gap-2.5 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Select Room
            </label>
            <select
              required
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              {rooms.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.name} ({r.floor || 'No floor'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Description / Contents Summary
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Pots, pans, baking trays, kitchen utensils"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={isFragile}
                onChange={(e) => setIsFragile(e.target.checked)}
                className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
              />
              <span className="text-xs font-bold text-slate-700">Fragile Contents</span>
            </label>

            <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={isPriority}
                onChange={(e) => setIsPriority(e.target.checked)}
                className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
              />
              <span className="text-xs font-bold text-slate-700">High-Priority (Open First)</span>
            </label>
          </div>

          <p className="text-[11px] text-slate-400 italic">
            * Unique box labels (e.g. BOX-KIT-001) and printable Base64 QR codes are generated automatically upon creation.
          </p>

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
              Create Box & Generate QR
            </button>
          </div>
        </form>
      </Modal>

      {/* QR Code & Box Details Modal */}
      <Modal
        isOpen={!!selectedBoxForQR}
        onClose={() => setSelectedBoxForQR(null)}
        title={`Box Label & QR Code: ${selectedBoxForQR?.boxLabel || ''}`}
      >
        {selectedBoxForQR && (
          <div className="space-y-4 text-center">
            {/* Printable container */}
            <div id="qr-printable-area" className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center">
              <h2 className="label text-2xl font-black font-mono text-slate-900 tracking-wider">
                {selectedBoxForQR.boxLabel}
              </h2>
              <p className="room text-sm font-semibold text-slate-600 mt-1">
                Room: {selectedBoxForQR.roomId?.name || 'Unassigned'}
              </p>

              {selectedBoxForQR.qrCodeData ? (
                <img
                  src={selectedBoxForQR.qrCodeData}
                  alt={`QR Code for ${selectedBoxForQR.boxLabel}`}
                  className="w-48 h-48 my-3 rounded-xl border border-slate-200 shadow-xs bg-white p-2"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center bg-slate-200 text-slate-500 rounded-xl my-3 text-xs">
                  No QR Code
                </div>
              )}

              {selectedBoxForQR.isFragile && (
                <p className="warning text-sm font-black text-rose-600 uppercase tracking-widest mt-1">
                  ⚠️ HANDLE WITH CARE – FRAGILE
                </p>
              )}

              {selectedBoxForQR.description && (
                <p className="text-xs text-slate-500 max-w-sm mt-2 italic">
                  "{selectedBoxForQR.description}"
                </p>
              )}
            </div>

            {/* List of items inside box */}
            <div className="text-left bg-white p-4 rounded-2xl border border-slate-200">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-brand-600" />
                Items Packed in This Box ({boxDetail?.items?.length || 0})
              </h4>

              {isLoadingDetail ? (
                <div className="py-2 text-xs text-slate-400">Loading box items...</div>
              ) : boxDetail?.items?.length > 0 ? (
                <ul className="text-xs text-slate-600 space-y-1 max-h-36 overflow-y-auto">
                  {boxDetail.items.map((it) => (
                    <li key={it._id} className="flex justify-between py-1 border-b border-slate-50">
                      <span className="font-medium text-slate-800">{it.name}</span>
                      <span className="text-slate-400">Qty: {it.quantity}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  No items assigned to this box yet. Assign belongings in the Inventory tab.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedBoxForQR(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handlePrintQR}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Box Label
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

