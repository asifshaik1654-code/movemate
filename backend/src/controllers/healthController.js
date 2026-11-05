const { getDBStatus } = require('../config/database');
const env = require('../config/env');
const ApiResponse = require('../utils/apiResponse');

/**
 * Health check controller
 * GET /api/v1/health
 */
const getHealth = (req, res) => {
  const dbStatus = getDBStatus();
  const uptime = process.uptime();

  const healthData = {
    status: dbStatus === 'connected' ? 'healthy' : 'degraded',
    uptimeSeconds: Math.floor(uptime),
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    version: '1.0.0',
    services: {
      api: 'up',
      database: dbStatus
    }
  };

  return new ApiResponse(200, 'MoveMate API is running', healthData).send(res);
};

module.exports = {
  getHealth
};
