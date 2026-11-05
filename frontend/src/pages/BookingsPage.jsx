import React, { useState, useEffect } from 'react';
import { useMove } from '../context/MoveContext';
import { bookingsApi } from '../api/bookingsApi';
import {
  CalendarCheck,
  Plus,
  Calendar,
  Phone,
  FileText,
  DollarSign,
  Edit2,
  Trash2,
  Loader2,
  AlertCircle,
  Truck,
  Zap,
  Wifi,
  Droplets,
  Flame,
  Sparkles,
  Key
} from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import { StatCard } from '../components/common/StatCard';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

const SERVICE_TYPES = [
  'Moving Company',
  'Electricity Transfer',
  'Water Service',
  'Internet / Cable',
  'Gas Connection',
  'Cleaning Service',
  'Locksmith',
  'Other'
];

const SERVICE_STATUSES = ['Inquired', 'Booked', 'Confirmed', 'Completed', 'Cancelled'];

export const BookingsPage = () => {
  const { activeMoveId, canEdit } = useMove();
  const [bookings, setBookings] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);

  // Form states
  const [serviceType, setServiceType] = useState('Electricity Transfer');
  const [providerName, setProviderName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [status, setStatus] = useState('Booked');
  const [confirmationNumber, setConfirmationNumber] = useState('');
  const [cost, setCost] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchBookings = async () => {
    if (!activeMoveId) return;
    try {
      setIsLoading(true);
      setError('');
      const res = await bookingsApi.getMoveBookings(activeMoveId);
      setBookings(res.data?.bookings || []);
      setSummary(res.data?.summary || null);
    } catch (err) {
      setError(err.message || 'Failed to load bookings.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [activeMoveId]);

  const openCreateModal = () => {
    setEditingBooking(null);
    setServiceType('Electricity Transfer');
    setProviderName('');
    setContactPhone('');
    setScheduledDate('');
    setStatus('Booked');
    setConfirmationNumber('');
    setCost('');
    setNotes('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (bk) => {
    setEditingBooking(bk);
    setServiceType(bk.serviceType || 'Electricity Transfer');
    setProviderName(bk.providerName || '');
    setContactPhone(bk.contactPhone || '');
    setScheduledDate(bk.scheduledDate ? bk.scheduledDate.substring(0, 10) : '');
    setStatus(bk.status || 'Booked');
    setConfirmationNumber(bk.confirmationNumber || '');
    setCost(bk.cost || '');
    setNotes(bk.notes || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    if (!canEdit) return;

    setIsSubmitting(true);
    setFormError('');

    try {
      const payload = {
        serviceType,
        providerName: providerName.trim(),
        contactPhone: contactPhone.trim(),
        scheduledDate: new Date(scheduledDate).toISOString(),
        status,
        confirmationNumber: confirmationNumber.trim(),
        cost: Number(cost || 0),
        notes: notes.trim()
      };

      if (editingBooking) {
        await bookingsApi.updateBooking(editingBooking._id, payload);
      } else {
        await bookingsApi.createBooking(activeMoveId, payload);
      }

      await fetchBookings();
      setIsModalOpen(false);
    } catch (err) {
      setFormError(err.message || 'Failed to save booking.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBooking = async (id, title) => {
    if (!canEdit) return;
    if (!window.confirm(`Delete service booking "${title}"?`)) return;

    try {
      await bookingsApi.deleteBooking(id);
      fetchBookings();
    } catch (err) {
      alert(err.message || 'Failed to delete booking.');
    }
  };

  const getServiceIcon = (type) => {
    if (type === 'Moving Company') return Truck;
    if (type === 'Electricity Transfer') return Zap;
    if (type === 'Internet / Cable') return Wifi;
    if (type === 'Water Service') return Droplets;
    if (type === 'Gas Connection') return Flame;
    if (type === 'Cleaning Service') return Sparkles;
    if (type === 'Locksmith') return Key;
    return CalendarCheck;
  };

  const getStatusBadge = (st) => {
    if (st === 'Completed') return 'success';
    if (st === 'Confirmed') return 'primary';
    if (st === 'Booked') return 'info';
    if (st === 'Cancelled') return 'danger';
    return 'neutral';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Service Bookings</h1>
          <p className="text-sm text-slate-500 mt-1">
            Coordinate mover logistics, utility transfers, and cleaning cutovers before move day.
          </p>
        </div>
        {canEdit && (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-brand-700 transition self-start"
          >
            <Plus className="w-4 h-4" />
            Add Booking
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Bookings"
          value={summary?.totalBookings || 0}
          subtitle="Utilities and movers"
          icon={CalendarCheck}
          color="brand"
        />

        <StatCard
          title="Confirmed or Done"
          value={`${summary?.confirmedOrCompleted || 0} / ${summary?.totalBookings || 0}`}
          subtitle="Directly boosts 15% Readiness Pillar"
          icon={Calendar}
          color="emerald"
        />

        <StatCard
          title="Total Service Cost"
          value={`$${summary?.totalCost || 0}`}
          subtitle="Scheduled utility & mover fees"
          icon={DollarSign}
          color="purple"
        />
      </div>

      {/* Bookings List */}
      {isLoading ? (
        <LoadingSpinner text="Loading service bookings..." />
      ) : bookings.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="No service bookings scheduled"
          description={canEdit ? 'Log mover dates and utility transfers to ensure lights and internet work on move-in day.' : 'No service bookings recorded yet.'}
          actionLabel={canEdit ? 'Schedule Booking' : undefined}
          onAction={canEdit ? openCreateModal : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookings.map((bk) => {
            const Icon = getServiceIcon(bk.serviceType);

            return (
              <div
                key={bk._id}
                className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-brand-50 text-brand-600">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-800">{bk.serviceType}</span>
                    </div>

                    <Badge variant={getStatusBadge(bk.status)}>{bk.status}</Badge>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 line-clamp-1">{bk.providerName}</h3>

                  <div className="mt-4 space-y-2 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>
                        Scheduled: <strong>{new Date(bk.scheduledDate).toLocaleDateString()}</strong>
                      </span>
                    </div>

                    {bk.contactPhone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>{bk.contactPhone}</span>
                      </div>
                    )}

                    {bk.confirmationNumber && (
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="font-mono text-[11px] font-bold bg-slate-50 px-1.5 py-0.5 rounded">
                          Ref: {bk.confirmationNumber}
                        </span>
                      </div>
                    )}

                    {bk.cost > 0 && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Fee: ${bk.cost}</span>
                      </div>
                    )}

                    {bk.notes && (
                      <p className="text-[11px] text-slate-400 italic pt-1 line-clamp-2">
                        "{bk.notes}"
                      </p>
                    )}
                  </div>
                </div>

                {canEdit && (
                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-1">
                    <button
                      onClick={() => openEditModal(bk)}
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                      title="Edit booking"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteBooking(bk._id, bk.providerName)}
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                      title="Delete booking"
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

      {/* Booking Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBooking ? 'Edit Booking' : 'Add Service Booking'}
      >
        <form onSubmit={handleSubmitBooking} className="space-y-4">
          {formError && (
            <div className="flex items-start gap-2.5 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Service Type
              </label>
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                {SERVICE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Booking Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                {SERVICE_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Provider / Company Name
            </label>
            <input
              type="text"
              required
              value={providerName}
              onChange={(e) => setProviderName(e.target.value)}
              placeholder="e.g. Pacific Gas & Electric, Speedy Movers LLC"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Scheduled Date
              </label>
              <input
                type="date"
                required
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Cost ($) <span className="text-slate-400 font-normal lowercase">(optional)</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Contact Phone
              </label>
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="1-800-555-0199"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Confirmation #
              </label>
              <input
                type="text"
                value={confirmationNumber}
                onChange={(e) => setConfirmationNumber(e.target.value)}
                placeholder="e.g. PG-88231"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Notes / Instructions
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Technician arrives between 8 AM and 12 PM, meter in backyard"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
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
              {editingBooking ? 'Update Booking' : 'Save Booking'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

