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
import taskRoutes from './routes/taskRoutes.js'
import docRoutes from './routes/docRoutes.js'
import { apiLimiter, aiLimiter, requestLogger } from './middleware/rateLimiter.js'
import { connectDB, isDBConnected } from './config/db.js'

// Connect to MongoDB
connectDB()

const app = express()
const httpServer = createServer(app)

const io = new SocketIO(httpServer, {
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:3000', methods: ['GET', 'POST'], credentials: true },
})

import { verifyAccessToken } from './services/authService.js'
import { findUserById } from './models/userStore.js'

io.use((socket, next) => {
  const token = socket.handshake.auth?.token
  if (token) {
    try {
      const payload = verifyAccessToken(token)
      socket.user = findUserById(payload.sub)
    } catch {}
  }
  next()
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
app.use('/api/tasks', taskRoutes)
app.use('/api/docs', docRoutes)

app.get('/api/health', (req, res) => res.json({
  status: 'ok',
  timestamp: new Date().toISOString(),
  database: isDBConnected() ? 'connected' : 'connecting_or_fallback',
  dbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/',
  aiProvider: 'Google Gemini',
  aiModel: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
  aiConfigured: !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes('your_'))),
  githubConfigured: !!(process.env.GITHUB_TOKEN && !process.env.GITHUB_TOKEN.includes('your_')),
  authEnabled: true
}))
app.use((req, res) => res.status(404).json({ error: `Route ${req.method} ${req.path} not found` }))
app.use((err, req, res, next) => { console.error('[Server Error]', err); res.status(500).json({ error: 'Internal server error', message: err.message }) })

const PORT = process.env.PORT || 5000
httpServer.listen(PORT, () => {
  const hasKey = !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes('your_')))
  console.log(`\n🚀 AI Developer Assistant Backend`)
  console.log(`   Running at:    http://localhost:${PORT}`)
  console.log(`   AI Provider:   Google Gemini (Free Tier Supported)`)
  console.log(`   AI Model:      ${process.env.GEMINI_MODEL || 'gemini-3.8-flash'}`)
  console.log(`   Gemini Key:    ${hasKey ? '✅ Set' : '⚠️  Not Set (Using smart developer simulation fallback)'}`)
  console.log(`   GitHub API:    ${process.env.GITHUB_TOKEN && !process.env.GITHUB_TOKEN.includes('your_') ? '✅ Connected' : '⚠️  Not Set'}`)
})

export { io }
export default app
