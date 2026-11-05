const Box = require('../models/Box');
const Room = require('../models/Room');
const Move = require('../models/Move');
const ApiError = require('../utils/apiError');

/**
 * Real-Time Moving Day Live Tracker
 */
const getMovingDayTracking = async (moveId) => {
  const move = await Move.findById(moveId);
  if (!move) throw new ApiError(404, 'Moving plan not found');

  const [boxes, rooms] = await Promise.all([
    Box.find({ moveId }).populate('roomId', 'name colorCode').sort('boxNumber'),
    Room.find({ moveId }).select('name colorCode')
  ]);

  const totalBoxes = boxes.length;
  let deliveredBoxes = 0;
  let missingBoxesCount = 0;

  const statusCounts = {
    'Not Started': 0,
    Packing: 0,
    Packed: 0,
    Loaded: 0,
    'In Transit': 0,
    Delivered: 0,
    Missing: 0
  };

  const stages = {
    atOrigin: [],    // Not Started, Packing, Packed
    inTransit: [],   // Loaded, In Transit
    delivered: [],   // Delivered
    missing: []      // Missing
  };

  const fragileBoxes = [];
  const priorityBoxes = [];

  boxes.forEach((box) => {
    if (statusCounts[box.status] !== undefined) statusCounts[box.status] += 1;

    const boxSummary = {
      _id: box._id,
      boxNumber: box.boxNumber,
      boxLabel: box.boxLabel,
      description: box.description,
      status: box.status,
      room: box.roomId ? { _id: box.roomId._id, name: box.roomId.name, colorCode: box.roomId.colorCode } : null,
      isFragile: box.isFragile,
      isPriority: box.isPriority
    };

    if (box.status === 'Delivered') {
      deliveredBoxes += 1;
      stages.delivered.push(boxSummary);
    } else if (box.status === 'Missing') {
      missingBoxesCount += 1;
      stages.missing.push(boxSummary);
    } else if (['Loaded', 'In Transit'].includes(box.status)) {
      stages.inTransit.push(boxSummary);
    } else {
      stages.atOrigin.push(boxSummary);
    }

    if (box.isFragile) fragileBoxes.push(boxSummary);
    if (box.isPriority) priorityBoxes.push(boxSummary);
  });

  const deliveryPercentage = totalBoxes > 0 ? Math.round((deliveredBoxes / totalBoxes) * 100) : 0;

  // Room-by-room delivery progress
  const roomDeliveryProgress = rooms.map((room) => {
    const roomBoxes = boxes.filter((b) => b.roomId && b.roomId._id.equals(room._id));
    const roomDelivered = roomBoxes.filter((b) => b.status === 'Delivered').length;
    return {
      _id: room._id,
      name: room.name,
      colorCode: room.colorCode,
      totalBoxes: roomBoxes.length,
      deliveredBoxes: roomDelivered,
      progressPercentage: roomBoxes.length > 0 ? Math.round((roomDelivered / roomBoxes.length) * 100) : 0
    };
  });

  return {
    move: {
      _id: move._id,
      title: move.title,
      moveDate: move.moveDate,
      status: move.status
    },
    totalBoxes,
    deliveredBoxes,
    deliveryPercentage,
    statusCounts,
    transitStages: {
      atOriginCount: stages.atOrigin.length,
      inTransitCount: stages.inTransit.length,
      deliveredCount: stages.delivered.length,
      missingCount: stages.missing.length
    },
    fragileBoxes,
    priorityBoxes,
    missingBoxes: stages.missing,
    roomDeliveryProgress
  };
};

module.exports = {
  getMovingDayTracking
};

