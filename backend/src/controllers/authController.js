import { registerUser, loginUser, generateTokens, verifyAndRotateRefreshToken, sanitizeUser } from '../services/authService.js'
import { revokeRefreshToken } from '../models/userStore.js'

const COOKIE_OPTS = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 7*24*60*60*1000 }

export async function register(req, res) {
  try {
    const { email, password, name } = req.body
    if (!email || !password || !name) return res.status(400).json({ error: 'email, password, and name are required' })
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' })
    const user = await registerUser({ email, password, name })
    const tokens = generateTokens(user)
    res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTS)
    return res.status(201).json({ user: sanitizeUser(user), accessToken: tokens.accessToken })
  } catch (err) {
    if (err.message.includes('already registered')) return res.status(409).json({ error: err.message })
    console.error('[Register]', err); return res.status(500).json({ error: 'Registration failed' })
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ error: 'email and password are required' })
    const user = await loginUser({ email, password })
    const tokens = generateTokens(user)
    res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTS)
    return res.json({ user: sanitizeUser(user), accessToken: tokens.accessToken })
  } catch (err) { return res.status(401).json({ error: err.message }) }
}

export function logout(req, res) {
  const rt = req.cookies?.refreshToken
  if (rt) revokeRefreshToken(rt)
  res.clearCookie('refreshToken')
  return res.json({ message: 'Logged out successfully' })
}

export function refresh(req, res) {
  try {
    const rt = req.cookies?.refreshToken || req.body?.refreshToken
    if (!rt) return res.status(401).json({ error: 'No refresh token' })
    const tokens = verifyAndRotateRefreshToken(rt)
    res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTS)
    return res.json({ accessToken: tokens.accessToken })
  } catch (err) {
    res.clearCookie('refreshToken')
    return res.status(401).json({ error: err.message })
  }
}

export const me = (req, res) => res.json({ user: sanitizeUser(req.user) })

export function oauthCallback(req, res) {
  try {
    const user = req.user
    if (!user) return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`)
    const tokens = generateTokens(user)
    res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTS)
    return res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${tokens.accessToken}&user=${encodeURIComponent(JSON.stringify(sanitizeUser(user)))}`)
  } catch (err) {
    console.error('[OAuth Callback]', err)
    return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`)
  }
}
