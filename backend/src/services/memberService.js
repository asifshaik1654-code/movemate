const mongoose = require('mongoose');
const Move = require('../models/Move');
const MoveMember = require('../models/MoveMember');
const User = require('../models/User');
const Task = require('../models/Task');
const { ROLES } = require('../constants/roles');
const { logActivity } = require('./activityService');
const ApiError = require('../utils/apiError');

/**
 * Invite a registered user to join a moving plan
 * @param {string} moveId - The move ID
 * @param {string} currentUserId - The user sending the invitation (Owner)
 * @param {Object} inviteData - { email, role }
 */
const inviteMember = async (moveId, currentUserId, inviteData) => {
  const { email, role = ROLES.EDITOR } = inviteData;

  const move = await Move.findById(moveId);
  if (!move) {
    throw new ApiError(404, 'Moving plan not found');
  }

  // Find user by registered email
  const targetUser = await User.findOne({ email: email.toLowerCase() });
  if (!targetUser) {
    throw new ApiError(
      404,
      `No registered MoveMate account found for "${email}". The collaborator must register an account first before being invited.`
    );
  }

  // Prevent inviting the owner
  if (move.userId.equals(targetUser._id)) {
    throw new ApiError(400, 'The owner cannot be invited as a collaborator to their own moving plan.');
  }

  // Prevent duplicate membership
  const existingMember = await MoveMember.findOne({ moveId, userId: targetUser._id });
  if (existingMember) {
    throw new ApiError(409, `"${targetUser.name}" (${email}) is already a member of this moving plan.`);
  }

  // Create member record
  const member = await MoveMember.create({
    moveId,
    userId: targetUser._id,
    role,
    invitedBy: currentUserId
  });

  // Log activity
  await logActivity({
    moveId,
    userId: currentUserId,
    action: 'MEMBER_INVITED',
    details: `Invited "${targetUser.name}" (${targetUser.email}) with role: ${role}`,
    entityType: 'Member',
    entityId: member._id
  });

  return MoveMember.findById(member._id)
    .populate('userId', 'name email phone')
    .populate('invitedBy', 'name email');
};

/**
 * List all members of a move with assigned task completion statistics
 * @param {string} moveId - The move ID
 */
const getMoveMembers = async (moveId) => {
  const move = await Move.findById(moveId);
  if (!move) {
    throw new ApiError(404, 'Moving plan not found');
  }

  const members = await MoveMember.find({ moveId })
    .populate('userId', 'name email phone')
    .populate('invitedBy', 'name email')
    .sort('createdAt');

  const now = new Date();

  // Enrich each member with their assigned task completion metrics
  const enrichedMembers = await Promise.all(
    members.map(async (member) => {
      if (!member.userId) return null;

      const [totalTasks, completedTasks, pendingTasks, overdueTasks] = await Promise.all([
        Task.countDocuments({ moveId, assignedTo: member.userId._id }),
        Task.countDocuments({ moveId, assignedTo: member.userId._id, status: 'Completed' }),
        Task.countDocuments({ moveId, assignedTo: member.userId._id, status: { $ne: 'Completed' } }),
        Task.countDocuments({
          moveId,
          assignedTo: member.userId._id,
          status: { $ne: 'Completed' },
          dueDate: { $lt: now }
        })
      ]);

      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      return {
        _id: member._id,
        moveId: member.moveId,
        user: member.userId,
        role: member.role,
        invitedBy: member.invitedBy,
        createdAt: member.createdAt,
        updatedAt: member.updatedAt,
        taskStats: {
          totalTasks,
          completedTasks,
          pendingTasks,
          overdueTasks,
          completionRate
        }
      };
    })
  );

  return enrichedMembers.filter(Boolean);
};

/**
 * Update a member's role (Editor <-> Viewer)
 * Protects the owner from role modifications.
 * @param {string} moveId - The move ID
 * @param {string} memberId - The MoveMember document ID
 * @param {string} currentUserId - The user performing the update
 * @param {string} newRole - 'Editor' or 'Viewer'
 */
const updateMemberRole = async (moveId, memberId, currentUserId, newRole) => {
  if (!mongoose.Types.ObjectId.isValid(memberId)) {
    throw new ApiError(400, 'Invalid Member ID format');
  }

  const member = await MoveMember.findOne({ _id: memberId, moveId }).populate('userId', 'name email');
  if (!member) {
    throw new ApiError(404, 'Member record not found in this moving plan');
  }

  // Guard: Protect owner from role change
  if (member.role === ROLES.OWNER) {
    throw new ApiError(400, 'Cannot change the role of the moving plan owner.');
  }

  const previousRole = member.role;
  member.role = newRole;
  await member.save();

  // Log activity
  await logActivity({
    moveId,
    userId: currentUserId,
    action: 'MEMBER_ROLE_UPDATED',
    details: `Changed role of "${member.userId.name}" from ${previousRole} to ${newRole}`,
    entityType: 'Member',
    entityId: member._id
  });

  return MoveMember.findById(member._id)
    .populate('userId', 'name email phone')
    .populate('invitedBy', 'name email');
};

/**
 * Remove a member from the moving plan
 * Protects the owner from removal. Automatically unassigns tasks belonging to this member.
 * @param {string} moveId - The move ID
 * @param {string} memberId - The MoveMember document ID
 * @param {string} currentUserId - The user performing the removal
 */
const removeMember = async (moveId, memberId, currentUserId) => {
  if (!mongoose.Types.ObjectId.isValid(memberId)) {
    throw new ApiError(400, 'Invalid Member ID format');
  }

  const member = await MoveMember.findOne({ _id: memberId, moveId }).populate('userId', 'name email');
  if (!member) {
    throw new ApiError(404, 'Member record not found in this moving plan');
  }

  // Guard: Protect owner from removal
  if (member.role === ROLES.OWNER) {
    throw new ApiError(400, 'Cannot remove the owner of the moving plan.');
  }

  const removedUserId = member.userId._id;
  const removedUserName = member.userId.name;

  // Unassign any tasks assigned to this member in this move
  await Task.updateMany(
    { moveId, assignedTo: removedUserId },
    { $set: { assignedTo: null } }
  );

  // Remove the member record
  await MoveMember.findByIdAndDelete(memberId);

  // Log activity
  await logActivity({
    moveId,
    userId: currentUserId,
    action: 'MEMBER_REMOVED',
    details: `Removed collaborator "${removedUserName}" from the moving plan`,
    entityType: 'Member',
    entityId: memberId
  });

  return {
    removed: true,
    memberId,
    userName: removedUserName
  };
};

module.exports = {
  inviteMember,
  getMoveMembers,
  updateMemberRole,
  removeMember
};

