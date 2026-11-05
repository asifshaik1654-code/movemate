const mongoose = require('mongoose');
const InventoryItem = require('../models/InventoryItem');
const Room = require('../models/Room');
const Box = require('../models/Box');
const { logActivity } = require('./activityService');
const ApiError = require('../utils/apiError');

/**
 * Get the parent moveId for an inventory item (used by checkChildResourceAccess)
 */
const getItemMoveId = async (itemId) => {
  const item = await InventoryItem.findById(itemId).select('moveId');
  if (!item) throw new ApiError(404, 'Inventory item not found');
  return item.moveId;
};

/**
 * Get the parent moveId for a room (used by checkChildResourceAccess)
 */
const getRoomMoveId = async (roomId) => {
  const room = await Room.findById(roomId).select('moveId');
  if (!room) throw new ApiError(404, 'Room not found');
  return room.moveId;
};

/**
 * Add an inventory item to a room
 */
const createItem = async (roomId, userId, itemData) => {
  if (!mongoose.Types.ObjectId.isValid(roomId)) {
    throw new ApiError(400, 'Invalid Room ID format');
  }

  const room = await Room.findById(roomId);
  if (!room) throw new ApiError(404, 'Room not found');

  // Validate box if provided
  if (itemData.boxId) {
    if (!mongoose.Types.ObjectId.isValid(itemData.boxId)) {
      throw new ApiError(400, 'Invalid Box ID format');
    }
    const box = await Box.findOne({ _id: itemData.boxId, roomId });
    if (!box) {
      throw new ApiError(400, 'Box does not exist in this room. Items must be assigned to boxes within the same room.');
    }
  }

  const item = await InventoryItem.create({
    moveId: room.moveId,
    roomId,
    ...itemData
  });

  await logActivity({
    moveId: room.moveId,
    userId,
    action: 'ITEM_ADDED',
    details: `Added "${item.name}" (qty: ${item.quantity}) to room "${room.name}"`,
    entityType: 'Item',
    entityId: item._id
  });

  return item.populate([
    { path: 'roomId', select: 'name colorCode' },
    { path: 'boxId', select: 'boxLabel status' }
  ]);
};

/**
 * List items in a room with optional filters and search
 */
const getRoomItems = async (roomId, query = {}) => {
  if (!mongoose.Types.ObjectId.isValid(roomId)) {
    throw new ApiError(400, 'Invalid Room ID format');
  }

  const room = await Room.findById(roomId);
  if (!room) throw new ApiError(404, 'Room not found');

  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 50;
  const skip = (page - 1) * limit;

  const filter = { roomId };

  if (query.boxId) filter.boxId = query.boxId === 'none' ? null : query.boxId;
  if (query.isPacked !== undefined) filter.isPacked = query.isPacked;

  if (query.search) {
    filter.name = { $regex: query.search, $options: 'i' };
  }

  const [items, total, unpackedCount] = await Promise.all([
    InventoryItem.find(filter)
      .sort('name')
      .skip(skip)
      .limit(limit)
      .populate('boxId', 'boxLabel status'),
    InventoryItem.countDocuments(filter),
    InventoryItem.countDocuments({ roomId, isPacked: false })
  ]);

  return {
    room: { _id: room._id, name: room.name, colorCode: room.colorCode },
    items,
    metrics: { total, unpacked: unpackedCount },
    pagination: { total, page, limit, pages: Math.ceil(total / limit) || 1 }
  };
};

/**
 * Get a single inventory item by ID
 */
const getItemById = async (itemId) => {
  if (!mongoose.Types.ObjectId.isValid(itemId)) {
    throw new ApiError(400, 'Invalid Item ID format');
  }

  const item = await InventoryItem.findById(itemId)
    .populate('roomId', 'name colorCode')
    .populate('boxId', 'boxLabel status');

  if (!item) throw new ApiError(404, 'Inventory item not found');
  return item;
};

/**
 * Update an inventory item
 */
const updateItem = async (itemId, userId, updateData) => {
  if (!mongoose.Types.ObjectId.isValid(itemId)) {
    throw new ApiError(400, 'Invalid Item ID format');
  }

  const existing = await InventoryItem.findById(itemId);
  if (!existing) throw new ApiError(404, 'Inventory item not found');

  // If boxId is changing, validate the new box belongs to the same room
  if (updateData.boxId !== undefined && updateData.boxId !== null) {
    if (!mongoose.Types.ObjectId.isValid(updateData.boxId)) {
      throw new ApiError(400, 'Invalid Box ID format');
    }
    const box = await Box.findOne({ _id: updateData.boxId, roomId: existing.roomId });
    if (!box) {
      throw new ApiError(400, 'Box does not belong to this item\'s room');
    }
    // Auto-mark as packed when assigned to a box
    if (!updateData.hasOwnProperty('isPacked')) {
      updateData.isPacked = true;
    }
  }

  // If explicitly clearing the box, also clear packed status
  if (updateData.boxId === null && !updateData.hasOwnProperty('isPacked')) {
    updateData.isPacked = false;
  }

  const updatedItem = await InventoryItem.findByIdAndUpdate(
    itemId,
    { $set: updateData },
    { new: true, runValidators: true }
  ).populate([
    { path: 'roomId', select: 'name colorCode' },
    { path: 'boxId', select: 'boxLabel status' }
  ]);

  await logActivity({
    moveId: existing.moveId,
    userId,
    action: 'ITEM_UPDATED',
    details: `Updated item "${updatedItem.name}" (packed: ${updatedItem.isPacked})`,
    entityType: 'Item',
    entityId: itemId
  });

  return updatedItem;
};

/**
 * Delete an inventory item
 */
const deleteItem = async (itemId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(itemId)) {
    throw new ApiError(400, 'Invalid Item ID format');
  }

  const item = await InventoryItem.findById(itemId);
  if (!item) throw new ApiError(404, 'Inventory item not found');

  await InventoryItem.findByIdAndDelete(itemId);

  await logActivity({
    moveId: item.moveId,
    userId,
    action: 'ITEM_DELETED',
    details: `Deleted item "${item.name}"`,
    entityType: 'Item',
    entityId: itemId
  });

  return { deleted: true, itemId };
};

module.exports = {
  getItemMoveId,
  getRoomMoveId,
  createItem,
  getRoomItems,
  getItemById,
  updateItem,
  deleteItem
};

