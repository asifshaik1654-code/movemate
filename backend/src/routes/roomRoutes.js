const express = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const { checkMoveAccess, checkChildResourceAccess } = require('../middleware/moveAuthMiddleware');
const validate = require('../middleware/validateMiddleware');
const { createRoomSchema, updateRoomSchema } = require('../validators/roomValidators');
const { createRoom, getRooms, getRoom, updateRoom, deleteRoom } = require('../controllers/roomController');
const { getRoomMoveId } = require('../services/inventoryService');
const { ROLES } = require('../constants/roles');

// Nested under /moves/:moveId/rooms
const moveRoomRouter = express.Router({ mergeParams: true });
moveRoomRouter.use(authenticate);
moveRoomRouter
  .route('/')
  .get(checkMoveAccess(ROLES.VIEWER), getRooms)
  .post(checkMoveAccess(ROLES.EDITOR), validate(createRoomSchema), createRoom);

// Direct room operations: /rooms/:roomId
const directRoomRouter = express.Router();
directRoomRouter.use(authenticate);
directRoomRouter
  .route('/:roomId')
  .get(checkChildResourceAccess('roomId', getRoomMoveId, 'Room', ROLES.VIEWER), getRoom)
  .patch(checkChildResourceAccess('roomId', getRoomMoveId, 'Room', ROLES.EDITOR), validate(updateRoomSchema), updateRoom)
  .delete(checkChildResourceAccess('roomId', getRoomMoveId, 'Room', ROLES.EDITOR), deleteRoom);

module.exports = { moveRoomRouter, directRoomRouter };

