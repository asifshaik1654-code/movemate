const activityService = require('../services/activityService');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * GET /api/v1/moves/:moveId/activity
 */
const getMoveActivity = asyncHandler(async (req, res) => {
  const { moveId } = req.params;
  const result = await activityService.getMoveActivity(moveId, req.query);

  return new ApiResponse(200, 'Activity timeline retrieved successfully', result).send(res);
});

module.exports = {
  getMoveActivity
};

