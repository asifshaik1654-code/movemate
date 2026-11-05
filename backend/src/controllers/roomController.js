const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');
const roomService = require('../services/roomService');

const createRoom = asyncHandler(async (req, res) => {
  const room = await roomService.createRoom(req.params.moveId, req.user._id, req.body);
  return new ApiResponse(201, 'Room created successfully', room).send(res);
});

const getRooms = asyncHandler(async (req, res) => {
  const rooms = await roomService.getMoveRooms(req.params.moveId);
  return new ApiResponse(200, 'Rooms retrieved successfully', rooms).send(res);
});

const getRoom = asyncHandler(async (req, res) => {
  const room = await roomService.getRoomById(req.params.roomId);
  return new ApiResponse(200, 'Room details retrieved', room).send(res);
});

const updateRoom = asyncHandler(async (req, res) => {
  const updated = await roomService.updateRoom(req.params.roomId, req.user._id, req.body);
  return new ApiResponse(200, 'Room updated successfully', updated).send(res);
});

const deleteRoom = asyncHandler(async (req, res) => {
  const result = await roomService.deleteRoom(req.params.roomId, req.user._id);
  return new ApiResponse(200, 'Room deleted successfully', result).send(res);
});

module.exports = { createRoom, getRooms, getRoom, updateRoom, deleteRoom };

