import React, { useState, useEffect } from 'react';
import { useMove } from '../context/MoveContext';
import { roomsApi } from '../api/roomsApi';
import {
  Home,
  Plus,
  Box,
  Layers,
  Edit2,
  Trash2,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const RoomsPage = () => {
  const { activeMoveId, canEdit } = useMove();
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [floor, setFloor] = useState('');
  const [colorCode, setColorCode] = useState('#3b82f6');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchRooms = async () => {
    if (!activeMoveId) return;
    try {
      setIsLoading(true);
      setError('');
      const res = await roomsApi.getMoveRooms(activeMoveId);
      setRooms(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load rooms.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [activeMoveId]);

  const openCreateModal = () => {
    setEditingRoom(null);
    setName('');
    setFloor('Ground Floor');
    setColorCode('#3b82f6');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (room) => {
    setEditingRoom(room);
    setName(room.name || '');
    setFloor(room.floor || '');
    setColorCode(room.colorCode || '#3b82f6');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmitRoom = async (e) => {
    e.preventDefault();
    if (!canEdit) return;

    setIsSubmitting(true);
    setFormError('');

    try {
      const payload = {
        name: name.trim(),
        floor: floor.trim(),
        colorCode
      };

      if (editingRoom) {
        await roomsApi.updateRoom(editingRoom._id, payload);
      } else {
        await roomsApi.createRoom(activeMoveId, payload);
      }

      await fetchRooms();
      setIsModalOpen(false);
    } catch (err) {
      setFormError(err.message || 'Failed to save room.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRoom = async (roomId, roomName) => {
    if (!canEdit) return;
    if (!window.confirm(`Delete room "${roomName}"?`)) return;

    try {
      await roomsApi.deleteRoom(roomId);
      await fetchRooms();
    } catch (err) {
      alert(err.message || 'Cannot delete room.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Rooms & Spaces</h1>
          <p className="text-sm text-slate-500 mt-1">
            Organize packing by zones, assign color codes, and track container distribution.
          </p>
        </div>
        {canEdit && (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-brand-700 transition self-start"
          >
            <Plus className="w-4 h-4" />
            Add Room
          </button>
        )}
      </div>

      {/* Room Grid */}
      {isLoading ? (
        <LoadingSpinner text="Loading rooms..." />
      ) : rooms.length === 0 ? (
        <EmptyState
          icon={Home}
          title="No rooms created yet"
          description={canEdit ? 'Add your rooms (Living Room, Kitchen, Bedrooms) to organize boxes and items.' : 'No rooms defined yet.'}
          actionLabel={canEdit ? 'Add First Room' : undefined}
          onAction={canEdit ? openCreateModal : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => {
            const stats = room.stats || {};
            const progress = stats.packingProgress || 0;

            return (
              <div
                key={room._id}
                className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-4 h-4 rounded-full shrink-0 shadow-xs"
                        style={{ backgroundColor: room.colorCode || '#3b82f6' }}
                      />
                      <h3 className="text-lg font-bold text-slate-900 truncate">{room.name}</h3>
                    </div>

                    {room.floor && (
                      <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        {room.floor}
                      </span>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="font-semibold text-slate-500">Packing Progress</span>
                      <span className="font-bold text-slate-800">{progress}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${progress}%`,
                          backgroundColor: room.colorCode || '#3b82f6'
                        }}
                      />
                    </div>
                  </div>

                  {/* Mini Stats */}
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-50 rounded-xl p-2.5 flex items-center gap-2">
                      <Box className="w-4 h-4 text-amber-500 shrink-0" />
                      <div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Boxes</div>
                        <div className="font-bold text-slate-800">
                          {stats.packedBoxes || 0} / {stats.totalBoxes || 0}
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-2.5 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-purple-500 shrink-0" />
                      <div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Items</div>
                        <div className="font-bold text-slate-800">
                          {stats.packedItems || 0} / {stats.totalItems || 0}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                {canEdit && (
                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-1">
                    <button
                      onClick={() => openEditModal(room)}
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                      title="Edit room"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteRoom(room._id, room.name)}
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                      title="Delete room"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Room Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRoom ? 'Edit Room' : 'Add New Room'}
      >
        <form onSubmit={handleSubmitRoom} className="space-y-4">
          {formError && (
            <div className="flex items-start gap-2.5 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Room Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Master Bedroom, Kitchen, Garage"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Floor / Zone
            </label>
            <input
              type="text"
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
              placeholder="e.g. Ground Floor, 2nd Floor, Basement"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Color Tag
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={colorCode}
                onChange={(e) => setColorCode(e.target.value)}
                className="h-10 w-14 rounded-xl border border-slate-300 cursor-pointer bg-white p-1"
              />
              <span className="text-xs font-mono text-slate-600 uppercase font-semibold">
                {colorCode}
              </span>
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
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
              {editingRoom ? 'Update Room' : 'Create Room'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

