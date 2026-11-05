const express = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const { checkMoveAccess, checkChildResourceAccess } = require('../middleware/moveAuthMiddleware');
const validate = require('../middleware/validateMiddleware');
const { createBoxSchema, updateBoxSchema, boxQuerySchema } = require('../validators/boxValidators');
const { createBox, getBoxes, getBox, updateBox, deleteBox } = require('../controllers/boxController');
const { getBoxMoveId } = require('../services/boxService');
const { ROLES } = require('../constants/roles');

// Nested under /moves/:moveId/boxes
const moveBoxRouter = express.Router({ mergeParams: true });
moveBoxRouter.use(authenticate);
moveBoxRouter
  .route('/')
  .get(checkMoveAccess(ROLES.VIEWER), validate(boxQuerySchema, 'query'), getBoxes)
  .post(checkMoveAccess(ROLES.EDITOR), validate(createBoxSchema), createBox);

// Direct box operations: /boxes/:boxId
const directBoxRouter = express.Router();
directBoxRouter.use(authenticate);
directBoxRouter
  .route('/:boxId')
  .get(checkChildResourceAccess('boxId', getBoxMoveId, 'Box', ROLES.VIEWER), getBox)
  .patch(checkChildResourceAccess('boxId', getBoxMoveId, 'Box', ROLES.EDITOR), validate(updateBoxSchema), updateBox)
  .delete(checkChildResourceAccess('boxId', getBoxMoveId, 'Box', ROLES.EDITOR), deleteBox);

module.exports = { moveBoxRouter, directBoxRouter };

