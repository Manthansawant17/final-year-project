import { chatWithAI, analyzeDiff, generatePRDescription } from '../services/aiService.js'
import { AISession, Activity } from '../models/schemas.js'
import { isDBConnected } from '../config/db.js'

/**
 * POST /api/ai/chat
 * Body: { message, history, model }
 */
export async function chat(req, res) {
  try {
    const { message, history = [], model } = req.body

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'message is required' })
    }

    const result = await chatWithAI(message, history, model)

    // Persist chat session to MongoDB
    if (isDBConnected()) {
      try {
        const userId = req.user?.id || req.user?.email || 'DevUser'
        const sessionId = `session-${userId}`
        await AISession.findOneAndUpdate(
          { sessionId },
          {
            $set: { userId, model: model || 'gemini-3.8-flash' },
            $push: {
              messages: {
                $each: [
                  { role: 'user', content: message, timestamp: new Date() },
                  {
                    role: 'assistant',
                    content: result.content || result.message || '',
                    code: result.code || '',
                    codeLanguage: result.codeLanguage || 'java',
                    actions: result.actions || [],
                    timestamp: new Date(),
                  },
                ],
              },
            },
          },
          { upsert: true, new: true }
        )

        await Activity.create({
          userId,
          action: 'ai_chat',
          details: { messageSnippet: message.slice(0, 80), model: model || 'gemini-3.8-flash' },
          timestamp: new Date(),
        })
      } catch (dbErr) {
        // Non-blocking log
      }
    }

    return res.json(result)
  } catch (err) {
    console.error('[AI Chat Error]', err.message)
    return res.status(500).json({ error: 'AI service unavailable', details: err.message })
  }
}

/**
 * POST /api/ai/analyze-diff
 * Body: { diff, model }
 */
export async function analyzeCodeDiff(req, res) {
  try {
    const { diff, model } = req.body
    if (!diff) return res.status(400).json({ error: 'diff is required' })

    const result = await analyzeDiff(diff, model)
    return res.json(result)
  } catch (err) {
    console.error('[Analyze Diff Error]', err.message)
    return res.status(500).json({ error: 'Analysis failed', details: err.message })
  }
}

/**
 * POST /api/ai/generate-pr-description
 * Body: { changes, model }
 */
export async function generatePR(req, res) {
  try {
    const { changes, model } = req.body
    if (!changes) return res.status(400).json({ error: 'changes are required' })

    const result = await generatePRDescription(changes, model)
    return res.json(result)
  } catch (err) {
    console.error('[Generate PR Error]', err.message)
    return res.status(500).json({ error: 'Generation failed', details: err.message })
  }
}
