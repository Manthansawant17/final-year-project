import { verifyAccessToken } from '../services/authService.js'
import { findUserById } from '../models/userStore.js'

export function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization
    if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token provided' })
    const payload = verifyAccessToken(header.slice(7))
    const user = findUserById(payload.sub)
    if (!user) return res.status(401).json({ error: 'User not found' })
    req.user = user
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' })
    return res.status(401).json({ error: 'Invalid token' })
  }
}

export function optionalAuth(req, res, next) {
  try {
    const header = req.headers.authorization
    if (header?.startsWith('Bearer ')) {
      const payload = verifyAccessToken(header.slice(7))
      req.user = findUserById(payload.sub)
    }
  } catch {}
  next()
}
