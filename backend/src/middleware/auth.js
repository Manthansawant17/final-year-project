import { verifyAccessToken } from '../services/authService.js'
import { findUserById, createUser } from '../models/userStore.js'
import { User } from '../models/schemas.js'
import { isDBConnected } from '../config/db.js'

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization
    if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token provided' })
    const payload = verifyAccessToken(header.slice(7))
    let user = findUserById(payload.sub)
    if (!user && isDBConnected()) {
      try {
        const dbUser = await User.findById(payload.sub).lean()
        if (dbUser) {
          user = {
            id: dbUser._id.toString(),
            name: dbUser.name,
            email: dbUser.email,
            password: dbUser.password,
            avatar: dbUser.avatar,
            role: dbUser.role || 'developer',
            provider: dbUser.provider || 'local',
          }
          createUser(user)
        }
      } catch (err) {}
    }
    if (!user) return res.status(401).json({ error: 'User not found' })
    req.user = user
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' })
    return res.status(401).json({ error: 'Invalid token' })
  }
}

export async function optionalAuth(req, res, next) {
  try {
    const header = req.headers.authorization
    if (header?.startsWith('Bearer ')) {
      const payload = verifyAccessToken(header.slice(7))
      let user = findUserById(payload.sub)
      if (!user && isDBConnected()) {
        try {
          const dbUser = await User.findById(payload.sub).lean()
          if (dbUser) {
            user = {
              id: dbUser._id.toString(),
              name: dbUser.name,
              email: dbUser.email,
              password: dbUser.password,
              avatar: dbUser.avatar,
              role: dbUser.role || 'developer',
              provider: dbUser.provider || 'local',
            }
            createUser(user)
          }
        } catch (err) {}
      }
      req.user = user
    }
  } catch {}
  next()
}
