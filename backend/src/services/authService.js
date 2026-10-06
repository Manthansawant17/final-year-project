import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import dotenv from 'dotenv'
import { createUser, findUserByEmail, findUserById, saveRefreshToken, isRefreshTokenValid, revokeRefreshToken } from '../models/userStore.js'
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

export function verifyAndRotateRefreshToken(token) {
  if (!isRefreshTokenValid(token)) throw new Error('Refresh token revoked')
  const payload = jwt.verify(token, JWT_REFRESH_SECRET)
  revokeRefreshToken(token)
  const user = findUserById(payload.sub)
  if (!user) throw new Error('User not found')
  return generateTokens(user)
}

export async function registerUser({ email, password, name }) {
  if (findUserByEmail(email)) throw new Error('Email already registered')
  const hashed = await hashPassword(password)
  return createUser({ id: uuidv4(), email, password: hashed, name })
}

export async function loginUser({ email, password }) {
  const user = findUserByEmail(email)
  if (!user) throw new Error('Invalid email or password')
  if (!user.password) throw new Error('This account uses OAuth. Please sign in with GitHub or Google.')
  if (!await comparePassword(password, user.password)) throw new Error('Invalid email or password')
  return user
}

export function sanitizeUser(user) {
  if (!user) return null
  const { password, ...safe } = user
  return safe
}
