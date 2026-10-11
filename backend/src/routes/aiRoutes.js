import { Router } from 'express'
import { chat, analyzeCodeDiff, generatePR } from '../controllers/aiController.js'
import { optionalAuth } from '../middleware/auth.js'

const router = Router()

// Allow both authenticated and guest developers to interact with the AI assistant
router.post('/chat', optionalAuth, chat)
router.post('/analyze-diff', optionalAuth, analyzeCodeDiff)
router.post('/generate-pr-description', optionalAuth, generatePR)

export default router
