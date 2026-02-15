/**
 * Rate Limiter Middleware
 *
 * Limits each IP to 100 requests per 15-minute window.
 * Returns a structured JSON error on limit exceeded.
 */

const rateLimit = require('express-rate-limit');

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 100;

const rateLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests' },
  handler: (_req, res, _next, options) => {
    res.status(options.statusCode).json(options.message);
  },
});

module.exports = { rateLimiter };
