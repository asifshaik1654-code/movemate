const mongoose = require('mongoose');
const Room = require('../models/Room');
const Box = require('../models/Box');
const InventoryItem = require('../models/InventoryItem');
const { logActivity } = require('./activityService');
const ApiError = require('../utils/apiError');

/**
 * Create a room inside a move
 */
const createRoom = async (moveId, userId, roomData) => {
  const room = await Room.create({ moveId, ...roomData });

  await logActivity({
    moveId,
    userId,
    action: 'ROOM_CREATED',
    details: `Created room "${room.name}"`,
    entityType: 'Move',
    entityId: room._id
  });

  return room;
};

/**
 * List all rooms with packing progress
 */
const getMoveRooms = async (moveId) => {
  const rooms = await Room.find({ moveId }).sort('name');

  // For each room, calculate packing stats
  const enriched = await Promise.all(
    rooms.map(async (room) => {
      const [totalBoxes, packedBoxes, totalItems, packedItems] = await Promise.all([
        Box.countDocuments({ roomId: room._id }),
        Box.countDocuments({ roomId: room._id, status: { $in: ['Packed', 'Loaded', 'In Transit', 'Delivered'] } }),
        InventoryItem.countDocuments({ roomId: room._id }),
        InventoryItem.countDocuments({ roomId: room._id, isPacked: true })
      ]);

      const packingProgress =
        totalItems > 0 ? Math.round((packedItems / totalItems) * 100) : totalBoxes > 0 ? (packedBoxes > 0 ? 100 : 0) : 0;

      return {
        ...room.toJSON(),
        stats: { totalBoxes, packedBoxes, totalItems, packedItems, packingProgress }
      };
    })
  );

  return enriched;
};

/**
 * Get a single room with its packing stats
 */
const getRoomById = async (roomId) => {
  if (!mongoose.Types.ObjectId.isValid(roomId)) {
    throw new ApiError(400, 'Invalid Room ID format');
  }
  const room = await Room.findById(roomId);
  if (!room) throw new ApiError(404, 'Room not found');

  const [totalBoxes, packedBoxes, totalItems, packedItems] = await Promise.all([
    Box.countDocuments({ roomId: room._id }),
    Box.countDocuments({ roomId: room._id, status: { $in: ['Packed', 'Loaded', 'In Transit', 'Delivered'] } }),
    InventoryItem.countDocuments({ roomId: room._id }),
    InventoryItem.countDocuments({ roomId: room._id, isPacked: true })
  ]);

  const packingProgress =
    totalItems > 0 ? Math.round((packedItems / totalItems) * 100) : totalBoxes > 0 ? (packedBoxes > 0 ? 100 : 0) : 0;

  return {
    ...room.toJSON(),
    stats: { totalBoxes, packedBoxes, totalItems, packedItems, packingProgress }
  };
};

/**
 * Update a room
 */
const updateRoom = async (roomId, userId, updateData) => {
  if (!mongoose.Types.ObjectId.isValid(roomId)) {
    throw new ApiError(400, 'Invalid Room ID format');
  }

  const room = await Room.findByIdAndUpdate(roomId, { $set: updateData }, { new: true, runValidators: true });
  if (!room) throw new ApiError(404, 'Room not found');

  await logActivity({
    moveId: room.moveId,
    userId,
    action: 'ROOM_UPDATED',
    details: `Updated room "${room.name}"`,
    entityType: 'Move',
    entityId: room._id
  });

  return room;
};

/**
 * Delete a room (refuses if boxes are still assigned unless forced)
 */
const deleteRoom = async (roomId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(roomId)) {
    throw new ApiError(400, 'Invalid Room ID format');
  }

  const room = await Room.findById(roomId);
  if (!room) throw new ApiError(404, 'Room not found');

  const boxCount = await Box.countDocuments({ roomId });
  if (boxCount > 0) {
    throw new ApiError(
      409,
      `Cannot delete room "${room.name}" – it still has ${boxCount} box(es) assigned. Please remove or reassign them first.`
    );
  }

  // Remove orphaned inventory items in this room
  await InventoryItem.deleteMany({ roomId });
  await Room.findByIdAndDelete(roomId);

  await logActivity({
    moveId: room.moveId,
    userId,
    action: 'ROOM_DELETED',
    details: `Deleted room "${room.name}"`,
    entityType: 'Move',
    entityId: roomId
  });

  return { deleted: true, roomId };
};

module.exports = {
  createRoom,
  getMoveRooms,
  getRoomById,
  updateRoom,
  deleteRoom
};

