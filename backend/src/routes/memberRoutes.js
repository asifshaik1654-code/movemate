const express = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const { checkMoveAccess } = require('../middleware/moveAuthMiddleware');
const validate = require('../middleware/validateMiddleware');
const {
  inviteMemberSchema,
  updateMemberRoleSchema
} = require('../validators/memberValidators');
const {
  inviteMember,
  getMoveMembers,
  updateMemberRole,
  removeMember
} = require('../controllers/memberController');
const { ROLES } = require('../constants/roles');

// Nested under /moves/:moveId/members
const moveMemberRouter = express.Router({ mergeParams: true });

// All member endpoints require authentication
moveMemberRouter.use(authenticate);

moveMemberRouter
  .route('/')
  .get(checkMoveAccess(ROLES.VIEWER), getMoveMembers)
  .post(checkMoveAccess(ROLES.OWNER), validate(inviteMemberSchema), inviteMember);

moveMemberRouter
  .route('/:memberId')
  .patch(checkMoveAccess(ROLES.OWNER), validate(updateMemberRoleSchema), updateMemberRole)
  .delete(checkMoveAccess(ROLES.OWNER), removeMember);

module.exports = { moveMemberRouter };

