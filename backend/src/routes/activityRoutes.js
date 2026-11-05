const express = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const { checkMoveAccess } = require('../middleware/moveAuthMiddleware');
const { getMoveActivity } = require('../controllers/activityController');
const { ROLES } = require('../constants/roles');

// Nested under /moves/:moveId/activity
const moveActivityRouter = express.Router({ mergeParams: true });
moveActivityRouter.use(authenticate);

moveActivityRouter
  .route('/')
  .get(checkMoveAccess(ROLES.VIEWER), getMoveActivity);

module.exports = { moveActivityRouter };

