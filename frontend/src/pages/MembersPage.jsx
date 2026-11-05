import React, { useState, useEffect, useCallback } from 'react';
import { useMove } from '../context/MoveContext';
import { useAuth } from '../context/AuthContext';
import { membersApi } from '../api/membersApi';
import {
  Users,
  UserPlus,
  Shield,
  ShieldAlert,
  Eye,
  Edit3,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Mail,
  Phone,
  RefreshCw
} from 'lucide-react';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import EmptyState from '../components/common/EmptyState';
import LoadingSpinner from '../components/common/LoadingSpinner';

export function MembersPage() {
  const { activeMove, activeMoveId, isOwner, userRole } = useMove();
  const { user: currentUser } = useAuth();

  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Invite Modal
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Editor');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Delete Confirmation Modal
  const [memberToDelete, setMemberToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Role Change state
  const [updatingMemberId, setUpdatingMemberId] = useState(null);

  const fetchMembers = useCallback(async () => {
    if (!activeMoveId) {
      setMembers([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const res = await membersApi.getMoveMembers(activeMoveId);
      setMembers(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load team members');
    } finally {
      setIsLoading(false);
    }
  }, [activeMoveId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      setFormError('Please enter a valid email address.');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);
      await membersApi.inviteMember(activeMoveId, {
        email: inviteEmail.trim().toLowerCase(),
        role: inviteRole
      });
      setIsInviteOpen(false);
      setInviteEmail('');
      setInviteRole('Editor');
      fetchMembers();
    } catch (err) {
      setFormError(
        err.response?.data?.message ||
          'Failed to invite member. Make sure the user has an existing MoveMate account.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = async (member, newRole) => {
    if (member.role === newRole) return;
    try {
      setUpdatingMemberId(member._id);
      await membersApi.updateMemberRole(activeMoveId, member._id, newRole);
      fetchMembers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to change member role.');
    } finally {
      setUpdatingMemberId(null);
    }
  };

  const handleDeleteMember = async () => {
    if (!memberToDelete) return;
    try {
      setIsDeleting(true);
      await membersApi.removeMember(activeMoveId, memberToDelete._id);
      setMemberToDelete(null);
      fetchMembers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove collaborator.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!activeMoveId) {
    return (
      <EmptyState
        icon={Users}
        title="No Active Move Selected"
        description="Select or create a moving plan from the top bar to collaborate with team members."
      />
    );
  }

  // Statistics calculation
  const totalMembers = members.length;
  const editorCount = members.filter((m) => m.role === 'Editor').length;
  const viewerCount = members.filter((m) => m.role === 'Viewer').length;
  const totalAssignedTasks = members.reduce(
    (sum, m) => sum + (m.taskStats?.totalTasks || 0),
    0
  );
  const totalCompletedTasks = members.reduce(
    (sum, m) => sum + (m.taskStats?.completedTasks || 0),
    0
  );
  const teamCompletionRate =
    totalAssignedTasks > 0
      ? Math.round((totalCompletedTasks / totalAssignedTasks) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-7 h-7 text-brand-600" />
            Team & Collaborators
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Invite family, friends, or moving professionals to coordinate tasks and inventory for{' '}
            <span className="font-semibold text-slate-700">{activeMove?.title}</span>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchMembers}
            disabled={isLoading}
            className="p-2 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition"
            title="Refresh members"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {isOwner ? (
            <button
              onClick={() => {
                setFormError(null);
                setInviteEmail('');
                setInviteRole('Editor');
                setIsInviteOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg shadow-sm transition"
            >
              <UserPlus className="w-4 h-4" />
              Invite Collaborator
            </button>
          ) : (
            <span className="text-xs px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg border border-slate-200 font-medium">
              Role: <strong className="text-brand-600">{userRole}</strong> (Only Owner can invite)
            </span>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Team</p>
            <p className="text-xl font-bold text-slate-900">{totalMembers}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Edit3 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Editors</p>
            <p className="text-xl font-bold text-slate-900">{editorCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Viewers</p>
            <p className="text-xl font-bold text-slate-900">{viewerCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Task Velocity</p>
            <p className="text-xl font-bold text-emerald-600">{teamCompletionRate}%</p>
          </div>
        </div>
      </div>

      {/* Permissions Helper Banner */}
      <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4 text-xs text-blue-800 flex items-start gap-3">
        <Shield className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-blue-900">Collaboration Permissions Overview</p>
          <p>
            • <strong className="font-medium text-slate-800">Owner:</strong> Complete management, invitation controls, budget, and deletion.
          </p>
          <p>
            • <strong className="font-medium text-slate-800">Editor:</strong> Full packing & checklist workflow (create/edit rooms, boxes, items, tasks).
          </p>
          <p>
            • <strong className="font-medium text-slate-800">Viewer:</strong> Read-only access to moving status, labels, inventory, and timeline.
          </p>
        </div>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="py-16 flex justify-center">
          <LoadingSpinner size="lg" text="Loading team members..." />
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      ) : members.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No Collaborators Yet"
          description="Moving is easier with help! Invite your family members, roommates, or helpers by email to divide tasks and pack faster."
          actionText={isOwner ? "Invite First Collaborator" : undefined}
          onAction={isOwner ? () => setIsInviteOpen(true) : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {members.map((member) => {
            const user = member.user || {};
            const isTargetOwner = member.role === 'Owner';
            const isCurrentCardUser = currentUser?._id === user._id;
            const stats = member.taskStats || {
              totalTasks: 0,
              completedTasks: 0,
              pendingTasks: 0,
              overdueTasks: 0,
              completionRate: 0
            };

            return (
              <div
                key={member._id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between hover:border-slate-300 transition"
              >
                <div>
                  {/* Member Card Top */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-500 text-white font-bold flex items-center justify-center text-lg shadow-sm">
                        {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900">{user.name || 'Anonymous User'}</h3>
                          {isCurrentCardUser && (
                            <span className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-full border border-slate-200">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          {user.email || 'No email provided'}
                        </p>
                        {user.phone && (
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            {user.phone}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Role Pill */}
                    <div>
                      {member.role === 'Owner' && <Badge variant="purple">Plan Owner</Badge>}
                      {member.role === 'Editor' && <Badge variant="blue">Editor</Badge>}
                      {member.role === 'Viewer' && <Badge variant="gray">Viewer</Badge>}
                    </div>
                  </div>

                  {/* Task Completion Metrics */}
                  <div className="mt-5 p-3.5 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-medium text-slate-700">Assigned Tasks Progress</span>
                      <span className="font-bold text-brand-600">
                        {stats.completedTasks} / {stats.totalTasks} ({stats.completionRate}%)
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-brand-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${stats.completionRate}%` }}
                      />
                    </div>

                    {/* Breakdown counts */}
                    <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        {stats.completedTasks} done
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-500" />
                        {stats.pendingTasks} pending
                      </span>
                      {stats.overdueTasks > 0 ? (
                        <span className="flex items-center gap-1 font-semibold text-red-600">
                          <AlertCircle className="w-3 h-3 text-red-500" />
                          {stats.overdueTasks} overdue
                        </span>
                      ) : (
                        <span className="text-slate-400">0 overdue</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Controls (Only visible to Plan Owner for non-owner members) */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span>
                    {member.invitedBy ? `Invited by ${member.invitedBy.name}` : 'Move Creator'}
                  </span>

                  {isOwner && !isTargetOwner && (
                    <div className="flex items-center gap-2">
                      {/* Role Switcher */}
                      <select
                        value={member.role}
                        disabled={updatingMemberId === member._id}
                        onChange={(e) => handleRoleChange(member, e.target.value)}
                        className="bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-700 font-medium hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-50"
                      >
                        <option value="Editor">Editor</option>
                        <option value="Viewer">Viewer</option>
                      </select>

                      {/* Remove Button */}
                      <button
                        onClick={() => setMemberToDelete(member)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded transition"
                        title="Remove collaborator"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Invite Member Modal */}
      <Modal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        title="Invite Collaborator"
      >
        <form onSubmit={handleInviteSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Registered Email Address *
            </label>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="friend@movemate.com"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Note: The collaborator must have already registered a MoveMate account with this email.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Role & Permissions *
            </label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="Editor">Editor — Can create and edit tasks, rooms, boxes & items</option>
              <option value="Viewer">Viewer — Read-only access to moving status & timeline</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsInviteOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg shadow-sm transition disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              Send Invitation
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Member Confirmation Modal */}
      <Modal
        isOpen={Boolean(memberToDelete)}
        onClose={() => setMemberToDelete(null)}
        title="Remove Collaborator"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Are you sure you want to remove{' '}
            <strong className="text-slate-900 font-semibold">
              {memberToDelete?.user?.name || memberToDelete?.user?.email}
            </strong>{' '}
            from this moving plan?
          </p>
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            Any tasks assigned to this collaborator will automatically be unassigned.
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setMemberToDelete(null)}
              className="px-4 py-2 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteMember}
              disabled={isDeleting}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg shadow-sm transition disabled:opacity-50 flex items-center gap-2"
            >
              {isDeleting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              Yes, Remove Collaborator
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default MembersPage;
