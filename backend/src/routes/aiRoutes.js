import { Router } from 'express'
import { chat, analyzeCodeDiff, generatePR } from '../controllers/aiController.js'
import { requireAuth } from '../middleware/auth.js'
const router = Router()
router.post('/chat', requireAuth, chat)
router.post('/analyze-diff', requireAuth, analyzeCodeDiff)
router.post('/generate-pr-description', requireAuth, generatePR)
export default router
