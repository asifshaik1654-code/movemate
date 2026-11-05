import React, { useState, useEffect } from 'react';
import { useMove } from '../context/MoveContext';
import { inventoryApi } from '../api/inventoryApi';
import { roomsApi } from '../api/roomsApi';
import { boxesApi } from '../api/boxesApi';
import {
  Layers,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Circle,
  Box,
  AlertTriangle,
  Edit2,
  Trash2,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const InventoryPage = () => {
  const { activeMoveId, canEdit } = useMove();
  const [items, setItems] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [boxes, setBoxes] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [packedFilter, setPackedFilter] = useState('');
  const [boxFilter, setBoxFilter] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form states
  const [formRoomId, setFormRoomId] = useState('');
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [estimatedValue, setEstimatedValue] = useState(0);
  const [isFragile, setIsFragile] = useState(false);
  const [formBoxId, setFormBoxId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchRoomsAndBoxes = async () => {
    if (!activeMoveId) return;
    try {
      const [resRooms, resBoxes] = await Promise.all([
        roomsApi.getMoveRooms(activeMoveId),
        boxesApi.getMoveBoxes(activeMoveId, { limit: 100 })
      ]);
      const roomList = resRooms.data || [];
      setRooms(roomList);
      setBoxes(resBoxes.data?.boxes || []);

      if (roomList.length > 0 && !selectedRoomId) {
        setSelectedRoomId(roomList[0]._id);
      }
    } catch (err) {
      setError(err.message || 'Failed to load rooms and boxes.');
    }
  };

  const fetchItems = async () => {
    if (!selectedRoomId) {
      setItems([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      const params = {};
      if (search) params.search = search;
      if (packedFilter) params.isPacked = packedFilter;
      if (boxFilter) params.boxId = boxFilter;

      const res = await inventoryApi.getRoomItems(selectedRoomId, params);
      setItems(res.data?.items || []);
    } catch (err) {
      setError(err.message || 'Failed to load inventory items.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoomsAndBoxes();
  }, [activeMoveId]);

  useEffect(() => {
    fetchItems();
  }, [selectedRoomId, search, packedFilter, boxFilter]);

  const openCreateModal = () => {
    setEditingItem(null);
    setFormRoomId(selectedRoomId || rooms[0]?._id || '');
    setName('');
    setQuantity(1);
    setEstimatedValue(0);
    setIsFragile(false);
    setFormBoxId('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormRoomId(selectedRoomId);
    setName(item.name || '');
    setQuantity(item.quantity || 1);
    setEstimatedValue(item.estimatedValue || 0);
    setIsFragile(item.isFragile || false);
    setFormBoxId(item.boxId?._id || item.boxId || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmitItem = async (e) => {
    e.preventDefault();
    if (!canEdit || !formRoomId) return;

    setIsSubmitting(true);
    setFormError('');

    try {
      const payload = {
        name: name.trim(),
        quantity: Number(quantity),
        estimatedValue: Number(estimatedValue),
        isFragile,
        boxId: formBoxId || null
      };

      if (editingItem) {
        await inventoryApi.updateItem(editingItem._id, payload);
      } else {
        await inventoryApi.createItem(formRoomId, payload);
      }

      await fetchItems();
      setIsModalOpen(false);
    } catch (err) {
      setFormError(err.message || 'Failed to save item.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePacked = async (item) => {
    if (!canEdit) return;
    try {
      await inventoryApi.updateItem(item._id, { isPacked: !item.isPacked });
      fetchItems();
    } catch (err) {
      alert(err.message || 'Failed to update packed state.');
    }
  };

  const handleDeleteItem = async (itemId, itemName) => {
    if (!canEdit) return;
    if (!window.confirm(`Delete item "${itemName}"?`)) return;

    try {
      await inventoryApi.deleteItem(itemId);
      fetchItems();
    } catch (err) {
      alert(err.message || 'Failed to delete item.');
    }
  };

  // Filter boxes belonging to current form room
  const availableRoomBoxes = boxes.filter(
    (b) => b.roomId && (b.roomId._id === formRoomId || b.roomId === formRoomId)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Room Inventory</h1>
          <p className="text-sm text-slate-500 mt-1">
            Catalog belongings room-by-room and assign them to physical packing boxes.
          </p>
        </div>
        {canEdit && (
          <button
            onClick={openCreateModal}
            disabled={rooms.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50 transition self-start"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        )}
      </div>

      {rooms.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No rooms created yet"
          description="Create a room first so you can organize your belongings into appropriate zones."
        />
      ) : (
        <>
          {/* Room Selector Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {rooms.map((room) => {
              const isSelected = room._id === selectedRoomId;
              return (
                <button
                  key={room._id}
                  onClick={() => setSelectedRoomId(room._id)}
                  className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-bold transition shrink-0 border ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: room.colorCode || '#6366f1' }}
                  />
                  <span>{room.name}</span>
                </button>
              );
            })}
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
              <Filter className="w-3.5 h-3.5" />
              Filter:
            </div>

            {/* Packed filter */}
            <select
              value={packedFilter}
              onChange={(e) => setPackedFilter(e.target.value)}
              className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white focus:outline-none"
            >
              <option value="">All Items</option>
              <option value="true">Packed Only</option>
              <option value="false">Unpacked Only</option>
            </select>

            {/* Search */}
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search items..."
                className="rounded-xl border border-slate-300 pl-8 pr-3 py-1.5 text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          {/* Items Table */}
          {isLoading ? (
            <LoadingSpinner text="Loading inventory..." />
          ) : items.length === 0 ? (
            <EmptyState
              icon={Layers}
              title="No items in this room"
              description={canEdit ? 'Add your first belonging to this room.' : 'No items recorded.'}
              actionLabel={canEdit ? 'Add Item' : undefined}
              onAction={canEdit ? openCreateModal : undefined}
            />
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-3.5 pl-6 pr-3">Packed</th>
                      <th className="py-3.5 px-3">Item Name</th>
                      <th className="py-3.5 px-3">Quantity</th>
                      <th className="py-3.5 px-3">Box Assignment</th>
                      <th className="py-3.5 px-3">Est. Value</th>
                      <th className="py-3.5 px-3">Attributes</th>
                      {canEdit && <th className="py-3.5 pl-3 pr-6 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {items.map((item) => (
                      <tr key={item._id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3.5 pl-6 pr-3">
                          <button
                            onClick={() => handleTogglePacked(item)}
                            disabled={!canEdit}
                            className={`flex h-5 w-5 items-center justify-center rounded-lg border transition ${
                              item.isPacked
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'border-slate-300 bg-white hover:border-brand-500'
                            }`}
                          >
                            {item.isPacked && <CheckCircle2 className="w-3.5 h-3.5" />}
                          </button>
                        </td>

                        <td className="py-3.5 px-3 font-bold text-slate-900">
                          {item.name}
                        </td>

                        <td className="py-3.5 px-3 font-semibold text-slate-600">
                          {item.quantity}
                        </td>

                        <td className="py-3.5 px-3">
                          {item.boxId ? (
                            <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md">
                              <Box className="w-3 h-3 text-amber-600" />
                              {item.boxId.boxLabel || 'Assigned Box'}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Unboxed</span>
                          )}
                        </td>

                        <td className="py-3.5 px-3 text-slate-600">
                          ${item.estimatedValue || 0}
                        </td>

                        <td className="py-3.5 px-3">
                          {item.isFragile && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              Fragile
                            </span>
                          )}
                        </td>

                        {canEdit && (
                          <td className="py-3.5 pl-3 pr-6 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => openEditModal(item)}
                                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                                title="Edit item"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item._id, item.name)}
                                className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                                title="Delete item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Item Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Item' : 'Add Item to Room'}
      >
        <form onSubmit={handleSubmitItem} className="space-y-4">
          {formError && (
            <div className="flex items-start gap-2.5 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Room
            </label>
            <select
              value={formRoomId}
              onChange={(e) => setFormRoomId(e.target.value)}
              disabled={!!editingItem}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:bg-slate-50"
            >
              {rooms.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Item Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Coffee Maker, Desk Lamp, Winter Coats"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Estimated Value ($)
              </label>
              <input
                type="number"
                min="0"
                value={estimatedValue}
                onChange={(e) => setEstimatedValue(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          {/* Box Assignment */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Assign to Box in this Room <span className="text-slate-400 font-normal lowercase">(auto marks packed)</span>
            </label>
            <select
              value={formBoxId}
              onChange={(e) => setFormBoxId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="">No Box (Unboxed)</option>
              {availableRoomBoxes.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.boxLabel} {b.description ? `- ${b.description}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-1">
            <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={isFragile}
                onChange={(e) => setIsFragile(e.target.checked)}
                className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
              />
              <span className="text-xs font-bold text-slate-700">Fragile Item</span>
            </label>
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
              {editingItem ? 'Update Item' : 'Add Item'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

