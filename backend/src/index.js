import express from 'express'
import { createServer } from 'http'
import { Server as SocketIO } from 'socket.io'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import session from 'express-session'
import passport from 'passport'
import dotenv from 'dotenv'
dotenv.config()

// Load passport strategies (must be after dotenv.config)
import './config/passport.js'

import aiRoutes from './routes/aiRoutes.js'
import githubRoutes from './routes/githubRoutes.js'
import authRoutes from './routes/authRoutes.js'
import { apiLimiter, aiLimiter, requestLogger } from './middleware/rateLimiter.js'
import { verifyAccessToken } from './services/authService.js'
import { findUserById } from './models/userStore.js'

const app = express()
const httpServer = createServer(app)

const io = new SocketIO(httpServer, {
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:3000', methods: ['GET', 'POST'], credentials: true },
})

io.use((socket, next) => {
  const token = socket.handshake.auth?.token
  if (!token) return next(new Error('Authentication required'))
  try {
    const payload = verifyAccessToken(token)
    socket.user = findUserById(payload.sub)
    next()
  } catch { next(new Error('Invalid token')) }
})

io.on('connection', (socket) => {
  console.log(`🔌 ${socket.user?.name || 'Unknown'} connected: ${socket.id}`)
  socket.on('ai:stream', async ({ message, history }) => {
    socket.emit('ai:typing', true)
    try {
      const { chatWithAI } = await import('./services/aiService.js')
      const result = await chatWithAI(message, history)
      socket.emit('ai:response', result)
    } catch (err) { socket.emit('ai:error', { error: err.message }) }
    finally { socket.emit('ai:typing', false) }
  })
  socket.on('disconnect', () => console.log(`❌ ${socket.user?.name || 'Unknown'} disconnected`))
})

app.use(helmet({ crossOriginEmbedderPolicy: false }))
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', methods: ['GET','POST','PUT','DELETE','OPTIONS'], allowedHeaders: ['Content-Type','Authorization'], credentials: true }))
app.use(express.json({ limit: '10mb' }))
app.use(cookieParser())
app.use(session({ secret: process.env.SESSION_SECRET || 'session_secret', resave: false, saveUninitialized: false, cookie: { secure: process.env.NODE_ENV === 'production', maxAge: 60000 } }))
app.use(passport.initialize())
app.use(passport.session())
app.use(morgan('dev'))
app.use(requestLogger)

app.use('/api/', apiLimiter)
app.use('/api/ai/', aiLimiter)

app.use('/api/auth', authRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/github', githubRoutes)

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString(), aiConfigured: !!(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here'), githubConfigured: !!(process.env.GITHUB_TOKEN && process.env.GITHUB_TOKEN !== 'your_github_token_here'), authEnabled: true }))
app.use((req, res) => res.status(404).json({ error: `Route ${req.method} ${req.path} not found` }))
app.use((err, req, res, next) => { console.error('[Server Error]', err); res.status(500).json({ error: 'Internal server error', message: err.message }) })

const PORT = process.env.PORT || 5000
httpServer.listen(PORT, () => {
  console.log(`\n🚀 AI Developer Assistant Backend`)
  console.log(`   Running at:    http://localhost:${PORT}`)
  console.log(`   AI Model:      ${process.env.AI_MODEL || 'gpt-4o'}`)
  console.log(`   AI Key:        ${process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here' ? '✅ Set' : '❌ Not Set'}`)
  console.log(`   GitHub API:    ${process.env.GITHUB_TOKEN && process.env.GITHUB_TOKEN !== 'your_github_token_here' ? '✅ Connected' : '⚠️  Not Set'}`)
  console.log(`   GitHub OAuth:  ${process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_ID !== 'your_github_oauth_client_id' ? '✅ Set' : '⚠️  Not Configured'}`)
  console.log(`   Google OAuth:  ${process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID !== 'your_google_client_id' ? '✅ Set' : '⚠️  Not Configured'}\n`)
})

export { io }
export default app
