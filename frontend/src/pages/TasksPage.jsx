import React, { useState, useEffect } from 'react';
import { useMove } from '../context/MoveContext';
import { tasksApi } from '../api/tasksApi';
import { membersApi } from '../api/membersApi';
import { roomsApi } from '../api/roomsApi';
import {
  CheckSquare,
  Plus,
  Calendar,
  AlertCircle,
  Clock,
  Star,
  CheckCircle2,
  Trash2,
  Edit2,
  Loader2,
  Filter,
  User
} from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const TasksPage = () => {
  const { activeMoveId, canEdit } = useMove();
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [essentialFilter, setEssentialFilter] = useState(false);
  const [overdueFilter, setOverdueFilter] = useState(false);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [dueDate, setDueDate] = useState('');
  const [isEssential, setIsEssential] = useState(false);
  const [assignedTo, setAssignedTo] = useState('');
  const [roomId, setRoomId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchTasks = async () => {
    if (!activeMoveId) return;
    try {
      setIsLoading(true);
      setError('');
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (essentialFilter) params.isEssential = true;
      if (overdueFilter) params.overdue = true;

      const [resTasks, resMembers, resRooms] = await Promise.all([
        tasksApi.getMoveTasks(activeMoveId, params),
        membersApi.getMoveMembers(activeMoveId).catch(() => ({ data: [] })),
        roomsApi.getMoveRooms(activeMoveId).catch(() => ({ data: [] }))
      ]);

      setTasks(resTasks.data?.tasks || []);
      setMembers(resMembers.data || []);
      setRooms(resRooms.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load tasks.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [activeMoveId, statusFilter, priorityFilter, essentialFilter, overdueFilter]);

  const openCreateModal = () => {
    setEditingTask(null);
    setTitle('');
    setDescription('');
    setPriority('Medium');
    setDueDate('');
    setIsEssential(false);
    setAssignedTo('');
    setRoomId('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setTitle(task.title || '');
    setDescription(task.description || '');
    setPriority(task.priority || 'Medium');
    setDueDate(task.dueDate ? task.dueDate.substring(0, 10) : '');
    setIsEssential(task.isEssential || false);
    setAssignedTo(task.assignedTo?._id || '');
    setRoomId(task.roomId?._id || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleToggleComplete = async (task) => {
    if (!canEdit) return;
    const newStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
    try {
      await tasksApi.updateTask(task._id, { status: newStatus });
      fetchTasks();
    } catch (err) {
      alert(err.message || 'Failed to update task.');
    }
  };

  const handleSubmitTask = async (e) => {
    e.preventDefault();
    if (!canEdit) return;

    setIsSubmitting(true);
    setFormError('');

    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        priority,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        isEssential,
        assignedTo: assignedTo || null,
        roomId: roomId || null
      };

      if (editingTask) {
        await tasksApi.updateTask(editingTask._id, payload);
      } else {
        await tasksApi.createTask(activeMoveId, payload);
      }

      await fetchTasks();
      setIsModalOpen(false);
    } catch (err) {
      setFormError(err.message || 'Failed to save task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTask = async (taskId, taskTitle) => {
    if (!canEdit) return;
    if (!window.confirm(`Delete task "${taskTitle}"?`)) return;

    try {
      await tasksApi.deleteTask(taskId);
      fetchTasks();
    } catch (err) {
      alert(err.message || 'Failed to delete task.');
    }
  };

  const getPriorityBadge = (p) => {
    if (p === 'Urgent') return 'danger';
    if (p === 'High') return 'warning';
    if (p === 'Medium') return 'primary';
    return 'neutral';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Tasks & Checklist</h1>
          <p className="text-sm text-slate-500 mt-1">
            Track moving milestones, assign responsibilities, and prioritize critical cutovers.
          </p>
        </div>
        {canEdit && (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-brand-700 transition self-start"
          >
            <Plus className="w-4 h-4" />
            Add Task
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
          <Filter className="w-3.5 h-3.5" />
          Filter:
        </div>

        {/* Status */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>

        {/* Priority */}
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white focus:outline-none"
        >
          <option value="">All Priorities</option>
          <option value="Urgent">Urgent</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

        {/* Essential Toggle */}
        <button
          onClick={() => setEssentialFilter(!essentialFilter)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
            essentialFilter
              ? 'bg-amber-50 text-amber-700 border-amber-300'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Star className={`w-3.5 h-3.5 ${essentialFilter ? 'fill-amber-500' : ''}`} />
          Essential Only
        </button>

        {/* Overdue Toggle */}
        <button
          onClick={() => setOverdueFilter(!overdueFilter)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
            overdueFilter
              ? 'bg-rose-50 text-rose-700 border-rose-300'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          Overdue Only
        </button>
      </div>

      {/* Task List */}
      {isLoading ? (
        <LoadingSpinner text="Loading tasks..." />
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No tasks match your criteria"
          description={canEdit ? 'Add your first task to get the ball rolling!' : 'No tasks recorded yet.'}
          actionLabel={canEdit ? 'Create Task' : undefined}
          onAction={canEdit ? openCreateModal : undefined}
        />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 divide-y divide-slate-100 shadow-sm overflow-hidden">
          {tasks.map((task) => {
            const isCompleted = task.status === 'Completed';

            return (
              <div
                key={task._id}
                className={`p-4 sm:p-5 flex items-start justify-between gap-4 transition hover:bg-slate-50/50 ${
                  isCompleted ? 'bg-slate-50/40' : ''
                }`}
              >
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  {/* Checkbox */}
                  <button
                    onClick={() => handleToggleComplete(task)}
                    disabled={!canEdit}
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border transition ${
                      isCompleted
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-slate-300 bg-white hover:border-brand-500'
                    } ${!canEdit ? 'cursor-default opacity-70' : ''}`}
                  >
                    {isCompleted && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span
                        className={`text-sm font-bold truncate ${
                          isCompleted ? 'line-through text-slate-400' : 'text-slate-900'
                        }`}
                      >
                        {task.title}
                      </span>

                      {task.isEssential && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200">
                          <Star className="w-2.5 h-2.5 fill-amber-500" />
                          ESSENTIAL (35%)
                        </span>
                      )}

                      <Badge variant={getPriorityBadge(task.priority)}>
                        {task.priority}
                      </Badge>

                      {task.isOverdue && !isCompleted && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          OVERDUE
                        </span>
                      )}
                    </div>

                    {task.description && (
                      <p className="text-xs text-slate-500 mb-2 line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500">
                      {task.dueDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}

                      {task.assignedTo && (
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          Assigned to: <strong className="text-slate-700">{task.assignedTo.name}</strong>
                        </span>
                      )}

                      {task.roomId && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
                          Room: {task.roomId.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {canEdit && (
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button
                      onClick={() => openEditModal(task)}
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                      title="Edit task"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task._id, task.title)}
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                      title="Delete task"
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

      {/* Create / Edit Task Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTask ? 'Edit Task' : 'Create New Task'}
      >
        <form onSubmit={handleSubmitTask} className="space-y-4">
          {formError && (
            <div className="flex items-start gap-2.5 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Task Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Give 30-day notice to landlord"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Description <span className="text-slate-400 font-normal lowercase">(optional)</span>
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add extra context or instructions..."
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Assignee
              </label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.user?._id || m._id} value={m.user?._id || m._id}>
                    {m.user?.name} ({m.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Linked Room
              </label>
              <select
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                <option value="">None (Whole Move)</option>
                {rooms.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Essential Task checkbox */}
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isEssential}
                onChange={(e) => setIsEssential(e.target.checked)}
                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-xs font-bold text-amber-900">
                Mark as Essential Task (Directly boosts 35% Readiness Pillar)
              </span>
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
              {editingTask ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

