import { Router } from 'express'
import passport from 'passport'
import { register, login, logout, refresh, me, oauthCallback } from '../controllers/authController.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
router.post('/register', register)
router.post('/login', login)
router.post('/logout', logout)
router.post('/refresh', refresh)
router.get('/me', requireAuth, me)
router.get('/github', (req, res, next) => {
  if (passport._strategies.github) passport.authenticate('github', { scope: ['user:email'] })(req, res, next)
  else res.status(503).json({ error: 'GitHub OAuth not configured. Add GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET to .env' })
})
router.get('/github/callback', (req, res, next) => {
  if (passport._strategies.github) passport.authenticate('github', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/login?error=github_failed` })(req, res, next)
  else res.redirect(`${process.env.FRONTEND_URL}/login?error=not_configured`)
}, oauthCallback)
router.get('/google', (req, res, next) => {
  if (passport._strategies.google) passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next)
  else res.status(503).json({ error: 'Google OAuth not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env' })
})
router.get('/google/callback', (req, res, next) => {
  if (passport._strategies.google) passport.authenticate('google', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_failed` })(req, res, next)
  else res.redirect(`${process.env.FRONTEND_URL}/login?error=not_configured`)
}, oauthCallback)
export default router
