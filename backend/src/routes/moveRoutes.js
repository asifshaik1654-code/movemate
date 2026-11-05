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
const { moveRoomRouter } = require('./roomRoutes');
const { moveBoxRouter } = require('./boxRoutes');
const { moveMemberRouter } = require('./memberRoutes');
const { ROLES } = require('../constants/roles');

const router = express.Router();

// Mount nested sub-routers BEFORE the authenticate middleware
// (each sub-router applies its own authenticate internally)
router.use('/:moveId/tasks', moveTaskRouter);
router.use('/:moveId/rooms', moveRoomRouter);
router.use('/:moveId/boxes', moveBoxRouter);
router.use('/:moveId/members', moveMemberRouter);

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
