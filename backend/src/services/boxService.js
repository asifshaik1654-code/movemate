const mongoose = require('mongoose');
const Box = require('../models/Box');
const Room = require('../models/Room');
const InventoryItem = require('../models/InventoryItem');
const { generateBoxQRCode } = require('../utils/qrCodeHelper');
const { logActivity } = require('./activityService');
const ApiError = require('../utils/apiError');

// Valid state machine transitions for box status
const ALLOWED_TRANSITIONS = {
  'Not Started': ['Packing', 'Missing'],
  Packing: ['Packed', 'Missing'],
  Packed: ['Loaded', 'Missing'],
  Loaded: ['In Transit', 'Missing'],
  'In Transit': ['Delivered', 'Missing'],
  Delivered: [],
  Missing: ['Delivered'] // Recovered
};

/**
 * Generate a unique box label for a move, e.g. BOX-KIT-003
 * @param {string} moveId
 * @param {string} roomName - e.g. "Kitchen"
 * @param {number} boxNumber
 */
const buildBoxLabel = (roomName, boxNumber) => {
  const abbr = roomName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 3)
    .padEnd(3, 'X');
  const num = String(boxNumber).padStart(3, '0');
  return `BOX-${abbr}-${num}`;
};

/**
 * Create a new box inside a move
 */
const createBox = async (moveId, userId, boxData) => {
  const { roomId, description, isFragile, isPriority } = boxData;

  if (!mongoose.Types.ObjectId.isValid(roomId)) {
    throw new ApiError(400, 'Invalid Room ID format');
  }

  const room = await Room.findOne({ _id: roomId, moveId });
  if (!room) {
    throw new ApiError(404, 'Room not found in this moving plan');
  }

  // Calculate next box number for this move (atomic-safe approach)
  const lastBox = await Box.findOne({ moveId }).sort('-boxNumber').select('boxNumber');
  const boxNumber = (lastBox?.boxNumber || 0) + 1;
  const boxLabel = buildBoxLabel(room.name, boxNumber);

  // Create box first to get its _id for QR payload
  const box = await Box.create({
    moveId,
    roomId,
    boxNumber,
    boxLabel,
    description: description || '',
    isFragile: isFragile || false,
    isPriority: isPriority || false,
    status: 'Not Started',
    qrCodeData: '' // placeholder, updated below
  });

  // Generate QR code with non-sensitive metadata only
  const qrCodeData = await generateBoxQRCode({
    boxLabel: box.boxLabel,
    moveId: moveId.toString(),
    boxId: box._id.toString()
  });

  box.qrCodeData = qrCodeData;
  await box.save();

  await logActivity({
    moveId,
    userId,
    action: 'BOX_CREATED',
    details: `Created box "${box.boxLabel}" in room "${room.name}"`,
    entityType: 'Box',
    entityId: box._id
  });

  return box.populate('roomId', 'name colorCode');
};

/**
 * Get boxes for a move with filtering, search, and pagination
 */
const getMoveBoxes = async (moveId, query = {}) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 50;
  const skip = (page - 1) * limit;

  const filter = { moveId };

  if (query.roomId) filter.roomId = query.roomId;
  if (query.status) filter.status = query.status;
  if (query.isFragile !== undefined) filter.isFragile = query.isFragile;
  if (query.isPriority !== undefined) filter.isPriority = query.isPriority;

  if (query.search) {
    filter.boxLabel = { $regex: query.search.toUpperCase(), $options: 'i' };
  }

  const [boxes, total] = await Promise.all([
    Box.find(filter).sort('boxNumber').skip(skip).limit(limit).populate('roomId', 'name colorCode'),
    Box.countDocuments(filter)
  ]);

  return {
    boxes,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) || 1 }
  };
};

/**
 * Get single box with its inventory items
 */
const getBoxById = async (boxId) => {
  if (!mongoose.Types.ObjectId.isValid(boxId)) {
    throw new ApiError(400, 'Invalid Box ID format');
  }

  const box = await Box.findById(boxId).populate('roomId', 'name colorCode');
  if (!box) throw new ApiError(404, 'Box not found');

  const items = await InventoryItem.find({ boxId: box._id }).sort('name');

  return { ...box.toJSON(), items };
};

/**
 * Get a box's parent moveId (used by checkChildResourceAccess)
 */
const getBoxMoveId = async (boxId) => {
  const box = await Box.findById(boxId).select('moveId');
  if (!box) throw new ApiError(404, 'Box not found');
  return box.moveId;
};

/**
 * Update a box — enforces state machine transitions for status changes
 */
const updateBox = async (boxId, userId, updateData) => {
  if (!mongoose.Types.ObjectId.isValid(boxId)) {
    throw new ApiError(400, 'Invalid Box ID format');
  }

  const box = await Box.findById(boxId).populate('roomId', 'name');
  if (!box) throw new ApiError(404, 'Box not found');

  // Enforce state machine for status
  if (updateData.status && updateData.status !== box.status) {
    const allowed = ALLOWED_TRANSITIONS[box.status] || [];
    if (!allowed.includes(updateData.status)) {
      throw new ApiError(
        400,
        `Cannot transition box from "${box.status}" to "${updateData.status}". ` +
          `Allowed next states: ${allowed.length ? allowed.join(', ') : 'none'}`
      );
    }
  }

  // If changing room, validate new room belongs to same move
  if (updateData.roomId && updateData.roomId !== box.roomId._id.toString()) {
    if (!mongoose.Types.ObjectId.isValid(updateData.roomId)) {
      throw new ApiError(400, 'Invalid Room ID format');
    }
    const newRoom = await Room.findOne({ _id: updateData.roomId, moveId: box.moveId });
    if (!newRoom) throw new ApiError(404, 'Target room not found in this moving plan');
  }

  const updatedBox = await Box.findByIdAndUpdate(
    boxId,
    { $set: updateData },
    { new: true, runValidators: true }
  ).populate('roomId', 'name colorCode');

  const action = updateData.status === 'Delivered' ? 'BOX_DELIVERED'
    : updateData.status === 'Missing' ? 'BOX_MISSING'
    : 'BOX_UPDATED';

  await logActivity({
    moveId: box.moveId,
    userId,
    action,
    details: `Box "${updatedBox.boxLabel}" status: ${updatedBox.status}`,
    entityType: 'Box',
    entityId: box._id
  });

  return updatedBox;
};

/**
 * Delete a box — disassociates inventory items from this box
 */
const deleteBox = async (boxId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(boxId)) {
    throw new ApiError(400, 'Invalid Box ID format');
  }

  const box = await Box.findById(boxId);
  if (!box) throw new ApiError(404, 'Box not found');

  // Disassociate items from this box (don't delete — they stay in the room)
  await InventoryItem.updateMany({ boxId }, { $set: { boxId: null, isPacked: false } });
  await Box.findByIdAndDelete(boxId);

  await logActivity({
    moveId: box.moveId,
    userId,
    action: 'BOX_DELETED',
    details: `Deleted box "${box.boxLabel}"`,
    entityType: 'Box',
    entityId: boxId
  });

  return { deleted: true, boxId };
};

module.exports = {
  createBox,
  getMoveBoxes,
  getBoxById,
  getBoxMoveId,
  updateBox,
  deleteBox
};

