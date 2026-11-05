const memberService = require('../services/memberService');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Invite a collaborator to a moving plan
 * POST /api/v1/moves/:moveId/members
 */
const inviteMember = asyncHandler(async (req, res) => {
  const { moveId } = req.params;
  const member = await memberService.inviteMember(moveId, req.user._id, req.body);

  return new ApiResponse(201, 'Member invited successfully', member).send(res);
});

/**
 * List all members of a moving plan with their task completion metrics
 * GET /api/v1/moves/:moveId/members
 */
const getMoveMembers = asyncHandler(async (req, res) => {
  const { moveId } = req.params;
  const members = await memberService.getMoveMembers(moveId);

  return new ApiResponse(200, 'Move members retrieved successfully', members).send(res);
});

/**
 * Update a member's role
 * PATCH /api/v1/moves/:moveId/members/:memberId
 */
const updateMemberRole = asyncHandler(async (req, res) => {
  const { moveId, memberId } = req.params;
  const member = await memberService.updateMemberRole(moveId, memberId, req.user._id, req.body.role);

  return new ApiResponse(200, 'Member role updated successfully', member).send(res);
});

/**
 * Remove a member from a moving plan
 * DELETE /api/v1/moves/:moveId/members/:memberId
 */
const removeMember = asyncHandler(async (req, res) => {
  const { moveId, memberId } = req.params;
  const result = await memberService.removeMember(moveId, memberId, req.user._id);

  return new ApiResponse(200, 'Member removed from moving plan', result).send(res);
});

module.exports = {
  inviteMember,
  getMoveMembers,
  updateMemberRole,
  removeMember
};
