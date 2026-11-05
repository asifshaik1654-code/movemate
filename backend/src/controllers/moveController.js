const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');
const moveService = require('../services/moveService');

/**
 * POST /api/v1/moves
 */
const createMove = asyncHandler(async (req, res) => {
  const move = await moveService.createMove(req.user._id, req.body);
  return new ApiResponse(201, 'Moving plan created successfully', move).send(res);
});

/**
 * GET /api/v1/moves
 */
const getMoves = asyncHandler(async (req, res) => {
  const result = await moveService.getUserMoves(req.user._id, req.query);
  return new ApiResponse(200, 'Moving plans retrieved successfully', result).send(res);
});

/**
 * GET /api/v1/moves/:moveId
 */
const getMove = asyncHandler(async (req, res) => {
  const move = await moveService.getMoveById(req.params.moveId);
  return new ApiResponse(200, 'Moving plan details retrieved', move).send(res);
});

/**
 * PATCH /api/v1/moves/:moveId
 */
const updateMove = asyncHandler(async (req, res) => {
  const updatedMove = await moveService.updateMove(req.params.moveId, req.user._id, req.body);
  return new ApiResponse(200, 'Moving plan updated successfully', updatedMove).send(res);
});

/**
 * DELETE /api/v1/moves/:moveId
 */
const deleteMove = asyncHandler(async (req, res) => {
  const result = await moveService.deleteMove(req.params.moveId, req.user._id);
  return new ApiResponse(200, 'Moving plan and associated data deleted successfully', result).send(res);
});

module.exports = {
  createMove,
  getMoves,
  getMove,
  updateMove,
  deleteMove
};

