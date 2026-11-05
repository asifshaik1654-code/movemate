const express = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const { checkChildResourceAccess } = require('../middleware/moveAuthMiddleware');
const validate = require('../middleware/validateMiddleware');
const { createItemSchema, updateItemSchema, itemQuerySchema } = require('../validators/inventoryValidators');
const { createItem, getItems, getItem, updateItem, deleteItem } = require('../controllers/inventoryController');
const { getItemMoveId, getRoomMoveId } = require('../services/inventoryService');
const { ROLES } = require('../constants/roles');

// Nested under /rooms/:roomId/items
const roomItemRouter = express.Router({ mergeParams: true });
roomItemRouter.use(authenticate);
roomItemRouter
  .route('/')
  .get(checkChildResourceAccess('roomId', getRoomMoveId, 'Room', ROLES.VIEWER), validate(itemQuerySchema, 'query'), getItems)
  .post(checkChildResourceAccess('roomId', getRoomMoveId, 'Room', ROLES.EDITOR), validate(createItemSchema), createItem);

// Direct item operations: /items/:itemId
const directItemRouter = express.Router();
directItemRouter.use(authenticate);
directItemRouter
  .route('/:itemId')
  .get(checkChildResourceAccess('itemId', getItemMoveId, 'Item', ROLES.VIEWER), getItem)
  .patch(checkChildResourceAccess('itemId', getItemMoveId, 'Item', ROLES.EDITOR), validate(updateItemSchema), updateItem)
  .delete(checkChildResourceAccess('itemId', getItemMoveId, 'Item', ROLES.EDITOR), deleteItem);

module.exports = { roomItemRouter, directItemRouter };

