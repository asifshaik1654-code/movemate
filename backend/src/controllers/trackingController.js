const trackingService = require('../services/trackingService');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * GET /api/v1/moves/:moveId/tracking
 */
const getMovingDayTracking = asyncHandler(async (req, res) => {
  const { moveId } = req.params;
  const tracking = await trackingService.getMovingDayTracking(moveId);

  return new ApiResponse(200, 'Moving day tracking data retrieved successfully', tracking).send(res);
});

module.exports = {
  getMovingDayTracking
};

