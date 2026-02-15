/**
 * Request Logger Middleware
 *
 * Logs method, URL, status code, and response time for every request.
 * Uses structured JSON format for easy parsing in production.
 */

const requestLogger = (req, res, next) => {
  const start = Date.now();

  // Capture response finish
  res.on('finish', () => {
    const duration = Date.now() - start;
    const log = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    };

    // Use warn level for 4xx/5xx
    if (res.statusCode >= 400) {
      console.warn('[request]', JSON.stringify(log));
    } else {
      console.info('[request]', JSON.stringify(log));
    }
  });

  next();
};

module.exports = { requestLogger };
