import React, { useState, useEffect } from 'react';
import { useMove } from '../context/MoveContext';
import { expensesApi } from '../api/expensesApi';
import {
  DollarSign,
  Plus,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Clock,
  Filter,
  Edit2,
  Trash2,
  Loader2,
  AlertCircle,
  Receipt
} from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import { StatCard } from '../components/common/StatCard';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

const CATEGORIES = [
  'Movers',
  'Packing Supplies',
  'Truck Rental',
  'Storage',
  'Cleaning',
  'Utilities',
  'Food & Travel',
  'Other'
];

export const BudgetPage = () => {
  const { activeMoveId, canEdit } = useMove();
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('');
  const [paidFilter, setPaidFilter] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  // Form states
  const [category, setCategory] = useState('Movers');
  const [title, setTitle] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [actualCost, setActualCost] = useState('');
  const [isPaid, setIsPaid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchExpenses = async () => {
    if (!activeMoveId) return;
    try {
      setIsLoading(true);
      setError('');
      const params = {};
      if (categoryFilter) params.category = categoryFilter;
      if (paidFilter) params.isPaid = paidFilter;

      const res = await expensesApi.getMoveExpenses(activeMoveId, params);
      setExpenses(res.data?.expenses || []);
      setSummary(res.data?.summary || null);
    } catch (err) {
      setError(err.message || 'Failed to load expenses.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [activeMoveId, categoryFilter, paidFilter]);

  const openCreateModal = () => {
    setEditingExpense(null);
    setCategory('Movers');
    setTitle('');
    setEstimatedCost('');
    setActualCost('');
    setIsPaid(false);
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (exp) => {
    setEditingExpense(exp);
    setCategory(exp.category || 'Movers');
    setTitle(exp.title || '');
    setEstimatedCost(exp.estimatedCost || 0);
    setActualCost(exp.actualCost || 0);
    setIsPaid(exp.isPaid || false);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmitExpense = async (e) => {
    e.preventDefault();
    if (!canEdit) return;

    setIsSubmitting(true);
    setFormError('');

    try {
      const payload = {
        category,
        title: title.trim(),
        estimatedCost: Number(estimatedCost),
        actualCost: Number(actualCost || 0),
        isPaid
      };

      if (editingExpense) {
        await expensesApi.updateExpense(editingExpense._id, payload);
      } else {
        await expensesApi.createExpense(activeMoveId, payload);
      }

      await fetchExpenses();
      setIsModalOpen(false);
    } catch (err) {
      setFormError(err.message || 'Failed to save expense.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePaid = async (exp) => {
    if (!canEdit) return;
    try {
      await expensesApi.updateExpense(exp._id, { isPaid: !exp.isPaid });
      fetchExpenses();
    } catch (err) {
      alert(err.message || 'Failed to update payment status.');
    }
  };

  const handleDeleteExpense = async (expId, expTitle) => {
    if (!canEdit) return;
    if (!window.confirm(`Delete expense "${expTitle}"?`)) return;

    try {
      await expensesApi.deleteExpense(expId);
      fetchExpenses();
    } catch (err) {
      alert(err.message || 'Failed to delete expense.');
    }
  };

  const variance = summary?.variance || 0;
  const isOverBudget = summary?.isOverBudget;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Budget & Expenses</h1>
          <p className="text-sm text-slate-500 mt-1">
            Track estimated vs. actual expenses across categories and prevent unexpected moving day overruns.
          </p>
        </div>
        {canEdit && (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-brand-700 transition self-start"
          >
            <Plus className="w-4 h-4" />
            Add Expense
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Estimated"
          value={`$${summary?.totalEstimatedCost || 0}`}
          subtitle="Planned baseline"
          icon={DollarSign}
          color="brand"
        />

        <StatCard
          title="Total Actual"
          value={`$${summary?.totalActualCost || 0}`}
          subtitle="Spent to date"
          icon={Receipt}
          color="sky"
        />

        <StatCard
          title="Budget Variance"
          value={`${isOverBudget ? '+' : ''}$${variance}`}
          subtitle={isOverBudget ? 'Over original estimate' : 'Under or equal to estimate'}
          icon={isOverBudget ? TrendingUp : TrendingDown}
          color={isOverBudget ? 'rose' : 'emerald'}
        />

        <StatCard
          title="Paid vs Unpaid"
          value={`$${summary?.totalPaid || 0}`}
          subtitle={`Unpaid: $${summary?.totalUnpaid || 0}`}
          icon={CheckCircle2}
          color="purple"
        />
      </div>

      {/* Category Breakdown Progress */}
      {summary?.categoryBreakdown && Object.keys(summary.categoryBreakdown).length > 0 && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Category Breakdown</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(summary.categoryBreakdown).map(([cat, data]) => (
              <div key={cat} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex justify-between items-center text-xs font-bold text-slate-800 mb-1">
                  <span>{cat}</span>
                  <span>${data.actual || 0}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Est: ${data.estimated || 0}</span>
                  <span>{data.count} item{data.count > 1 ? 's' : ''}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
          <Filter className="w-3.5 h-3.5" />
          Filter:
        </div>

        {/* Category */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white focus:outline-none"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        {/* Paid status */}
        <select
          value={paidFilter}
          onChange={(e) => setPaidFilter(e.target.value)}
          className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="true">Paid</option>
          <option value="false">Unpaid</option>
        </select>
      </div>

      {/* Expense Table */}
      {isLoading ? (
        <LoadingSpinner text="Loading expenses..." />
      ) : expenses.length === 0 ? (
        <EmptyState
          icon={DollarSign}
          title="No expenses logged"
          description={canEdit ? 'Log moving quotes, supplies, and booking fees to track your budget.' : 'No expenses recorded yet.'}
          actionLabel={canEdit ? 'Add Expense' : undefined}
          onAction={canEdit ? openCreateModal : undefined}
        />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 pl-6 pr-3">Paid</th>
                  <th className="py-3.5 px-3">Title</th>
                  <th className="py-3.5 px-3">Category</th>
                  <th className="py-3.5 px-3">Estimated</th>
                  <th className="py-3.5 px-3">Actual Cost</th>
                  <th className="py-3.5 px-3">Variance</th>
                  {canEdit && <th className="py-3.5 pl-3 pr-6 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {expenses.map((exp) => {
                  const itemVariance = (exp.actualCost || 0) - (exp.estimatedCost || 0);

                  return (
                    <tr key={exp._id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 pl-6 pr-3">
                        <button
                          onClick={() => handleTogglePaid(exp)}
                          disabled={!canEdit}
                          className={`flex h-5 w-5 items-center justify-center rounded-lg border transition ${
                            exp.isPaid
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-slate-300 bg-white hover:border-brand-500'
                          }`}
                        >
                          {exp.isPaid && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </button>
                      </td>

                      <td className="py-3.5 px-3 font-bold text-slate-900">
                        {exp.title}
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold text-[11px]">
                          {exp.category}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-slate-500">
                        ${exp.estimatedCost}
                      </td>

                      <td className="py-3.5 px-3 font-bold text-slate-900">
                        ${exp.actualCost || 0}
                      </td>

                      <td className="py-3.5 px-3">
                        <span
                          className={`font-semibold ${
                            itemVariance > 0
                              ? 'text-rose-600'
                              : itemVariance < 0
                              ? 'text-emerald-600'
                              : 'text-slate-400'
                          }`}
                        >
                          {itemVariance > 0 ? `+$${itemVariance}` : itemVariance < 0 ? `-$${Math.abs(itemVariance)}` : '$0'}
                        </span>
                      </td>

                      {canEdit && (
                        <td className="py-3.5 pl-3 pr-6 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEditModal(exp)}
                              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                              title="Edit expense"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteExpense(exp._id, exp.title)}
                              className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                              title="Delete expense"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Expense Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingExpense ? 'Edit Expense' : 'Add New Expense'}
      >
        <form onSubmit={handleSubmitExpense} className="space-y-4">
          {formError && (
            <div className="flex items-start gap-2.5 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Title / Vendor Description
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. U-Haul Truck Deposit, Packing Boxes from Home Depot"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Estimated Cost ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Actual Cost ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={actualCost}
                onChange={(e) => setActualCost(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          <div className="pt-1">
            <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={isPaid}
                onChange={(e) => setIsPaid(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-xs font-bold text-slate-700">Already Paid</span>
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
              {editingExpense ? 'Update Expense' : 'Add Expense'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

