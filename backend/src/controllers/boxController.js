const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');
const boxService = require('../services/boxService');

const createBox = asyncHandler(async (req, res) => {
  const box = await boxService.createBox(req.params.moveId, req.user._id, req.body);
  return new ApiResponse(201, 'Box created successfully', box).send(res);
});

const getBoxes = asyncHandler(async (req, res) => {
  const result = await boxService.getMoveBoxes(req.params.moveId, req.query);
  return new ApiResponse(200, 'Boxes retrieved successfully', result).send(res);
});

const getBox = asyncHandler(async (req, res) => {
  const box = await boxService.getBoxById(req.params.boxId);
  return new ApiResponse(200, 'Box details retrieved', box).send(res);
});

const updateBox = asyncHandler(async (req, res) => {
  const updated = await boxService.updateBox(req.params.boxId, req.user._id, req.body);
  return new ApiResponse(200, 'Box updated successfully', updated).send(res);
});

const deleteBox = asyncHandler(async (req, res) => {
  const result = await boxService.deleteBox(req.params.boxId, req.user._id);
  return new ApiResponse(200, 'Box deleted successfully', result).send(res);
});

module.exports = { createBox, getBoxes, getBox, updateBox, deleteBox };

