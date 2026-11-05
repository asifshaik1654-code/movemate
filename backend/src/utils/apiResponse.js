/**
 * Standardized API success response helper
 * Follows the MoveMate API response specification:
 * {
 *   "success": true,
 *   "message": "...",
 *   "data": { ... }
 * }
 */
class ApiResponse {
  constructor(statusCode, message = 'Success', data = null) {
    this.statusCode = statusCode;
    this.success = true;
    this.message = message;
    if (data !== null) {
      this.data = data;
    }
  }

  send(res) {
    return res.status(this.statusCode).json({
      success: this.success,
      message: this.message,
      data: this.data !== undefined ? this.data : {}
    });
  }
}

module.exports = ApiResponse;

