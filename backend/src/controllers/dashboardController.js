const dashboardService = require('../services/dashboardService');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * GET /api/v1/moves/:moveId/dashboard
 */
const getMoveDashboard = asyncHandler(async (req, res) => {
  const { moveId } = req.params;
  const dashboard = await dashboardService.getMoveDashboard(moveId);

  return new ApiResponse(200, 'Move readiness dashboard retrieved successfully', dashboard).send(res);
});

module.exports = {
  getMoveDashboard
};

