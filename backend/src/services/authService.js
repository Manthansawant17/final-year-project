import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import dotenv from 'dotenv'
import { createUser, findUserByEmail, findUserById, saveRefreshToken, isRefreshTokenValid, revokeRefreshToken } from '../models/userStore.js'
import { User } from '../models/schemas.js'
import { isDBConnected } from '../config/db.js'

dotenv.config()

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret'
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback_refresh'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m'
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d'

export const hashPassword = (pw) => bcrypt.hash(pw, 12)
export const comparePassword = (pw, hash) => bcrypt.compare(pw, hash)

export function generateTokens(user) {
  const payload = { sub: user.id, email: user.email, role: user.role }
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
  const refreshToken = jwt.sign({ sub: user.id }, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN })
  saveRefreshToken(refreshToken)
  return { accessToken, refreshToken }
}

export const verifyAccessToken = (token) => jwt.verify(token, JWT_SECRET)

export async function verifyAndRotateRefreshToken(token) {
  if (!isRefreshTokenValid(token)) throw new Error('Refresh token revoked')
  const payload = jwt.verify(token, JWT_REFRESH_SECRET)
  revokeRefreshToken(token)
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
          providerId: dbUser.providerId || null,
        }
        createUser(user)
      }
    } catch (e) {}
  }
  if (!user) throw new Error('User not found')
  return generateTokens(user)
}

export async function registerUser({ email, password, name }) {
  const cleanEmail = email.trim().toLowerCase()
  const cleanName = name.trim()

  if (isDBConnected()) {
    try {
      const existingDb = await User.findOne({ email: cleanEmail })
      if (existingDb) throw new Error('Email already registered')
    } catch (e) {
      if (e.message.includes('already registered')) throw e
    }
  }

  if (findUserByEmail(cleanEmail)) throw new Error('Email already registered')

  const hashed = await hashPassword(password)
  let dbUser = null

  if (isDBConnected()) {
    try {
      dbUser = await User.create({
        name: cleanName,
        email: cleanEmail,
        password: hashed,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=7c6af7&color=fff`,
        role: 'developer',
        provider: 'local',
      })
    } catch (err) {
      if (err.code === 11000) throw new Error('Email already registered')
      console.error('Failed to create user in MongoDB:', err)
    }
  }

  const userId = dbUser?._id ? dbUser._id.toString() : uuidv4()
  const user = createUser({
    id: userId,
    email: cleanEmail,
    password: hashed,
    name: cleanName,
    avatar: dbUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=7c6af7&color=fff`,
    role: 'developer',
    provider: 'local',
  })

  return user
}

export async function loginUser({ email, password }) {
  const cleanEmail = email.trim().toLowerCase()
  let user = null

  if (isDBConnected()) {
    try {
      const dbUser = await User.findOne({ email: cleanEmail }).lean()
      if (dbUser) {
        user = {
          id: dbUser._id.toString(),
          name: dbUser.name,
          email: dbUser.email,
          password: dbUser.password,
          avatar: dbUser.avatar,
          role: dbUser.role || 'developer',
          provider: dbUser.provider || 'local',
          providerId: dbUser.providerId || null,
          createdAt: dbUser.createdAt ? new Date(dbUser.createdAt).toISOString() : new Date().toISOString(),
        }
        createUser(user)
      }
    } catch (err) {
      console.error('Error fetching user from MongoDB during login:', err)
    }
  }

  if (!user) {
    user = findUserByEmail(cleanEmail)
  }

  if (!user) throw new Error('Invalid email or password')
  if (!user.password) throw new Error('This account uses OAuth. Please sign in with GitHub or Google.')

  const isMatch = await comparePassword(password, user.password)
  if (!isMatch) throw new Error('Invalid email or password')
  return user
}

export function sanitizeUser(user) {
  if (!user) return null
  const { password, ...safe } = user
  return safe
}

// Pre-seed a demo developer account so login works out of the box
(async () => {
  try {
    const hashed = await hashPassword('password123')
    createUser({
      id: 'demo-dev-1',
      email: 'dev@example.com',
      password: hashed,
      name: 'DevUser',
      avatar: 'https://ui-avatars.com/api/?name=DevUser&background=7c6af7&color=fff',
    })

    setTimeout(async () => {
      try {
        if (isDBConnected()) {
          const existing = await User.findOne({ email: 'dev@example.com' })
          if (!existing) {
            await User.create({
              name: 'DevUser',
              email: 'dev@example.com',
              password: hashed,
              avatar: 'https://ui-avatars.com/api/?name=DevUser&background=7c6af7&color=fff',
              role: 'developer',
              provider: 'local',
            })
            console.log('📦 Seeded demo user in MongoDB: dev@example.com')
          }
        }
      } catch (err) {}
    }, 2000)
  } catch (e) {
    console.error('Failed to seed demo user', e)
  }
})()
