import rateLimit from 'express-rate-limit'

/**
 * General API rate limiter
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
})

/**
 * Stricter limiter for AI endpoints (cost control)
 */
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many AI requests. Please slow down.' },
})

/**
 * Request logger middleware
 */
export function requestLogger(req, res, next) {
  const start = Date.now()
  res.on('finish', () => {
    const duration = Date.now() - start
    const color = res.statusCode >= 400 ? '\x1b[31m' : '\x1b[32m'
    console.log(`${color}${req.method}\x1b[0m ${req.path} ${res.statusCode} ${duration}ms`)
  })
  next()
}
