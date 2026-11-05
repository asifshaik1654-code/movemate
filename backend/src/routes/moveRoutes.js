const express = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const { checkMoveAccess } = require('../middleware/moveAuthMiddleware');
const validate = require('../middleware/validateMiddleware');
const {
  createMoveSchema,
  updateMoveSchema,
  moveQuerySchema
} = require('../validators/moveValidators');
const {
  createMove,
  getMoves,
  getMove,
  updateMove,
  deleteMove
} = require('../controllers/moveController');
const { moveTaskRouter } = require('./taskRoutes');
const { ROLES } = require('../constants/roles');

const router = express.Router();

// Mount nested task routes: /api/v1/moves/:moveId/tasks
router.use('/:moveId/tasks', moveTaskRouter);

// All move routes require authentication
router.use(authenticate);

router
  .route('/')
  .get(validate(moveQuerySchema, 'query'), getMoves)
  .post(validate(createMoveSchema), createMove);

router
  .route('/:moveId')
  .get(checkMoveAccess(ROLES.VIEWER), getMove)
  .patch(checkMoveAccess(ROLES.EDITOR), validate(updateMoveSchema), updateMove)
  .delete(checkMoveAccess(ROLES.OWNER), deleteMove);

module.exports = router;
