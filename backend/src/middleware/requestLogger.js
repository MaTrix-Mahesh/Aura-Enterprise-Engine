/**
 * Request latency and access logger middleware for Aura Enterprise Engine.
 * Measures response elapsed time and logs clean, sanitized diagnostic info.
 */
export function requestLogger(req, res, next) {
  const startHrTime = process.hrtime.bigint();

  res.on('finish', () => {
    const endHrTime = process.hrtime.bigint();
    const durationMs = Number(endHrTime - startHrTime) / 1_000_000;
    const formattedDuration = durationMs < 1 ? `${durationMs.toFixed(2)}ms` : `${Math.round(durationMs)}ms`;

    const method = req.method;
    const url = req.originalUrl || req.url;
    const statusCode = res.statusCode;

    console.log(`[HTTP] ${method} ${url} ${statusCode} - ${formattedDuration}`);
  });

  next();
}

export default requestLogger;
