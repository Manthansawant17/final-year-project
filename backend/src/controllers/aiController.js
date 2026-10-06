import { chatWithAI, analyzeDiff, generatePRDescription } from '../services/aiService.js'

/**
 * POST /api/ai/chat
 * Body: { message, history }
 */
export async function chat(req, res) {
  try {
    const { message, history = [] } = req.body

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'message is required' })
    }

    const result = await chatWithAI(message, history)
    return res.json(result)
  } catch (err) {
    console.error('[AI Chat Error]', err.message)
    return res.status(500).json({ error: 'AI service unavailable', details: err.message })
  }
}

/**
 * POST /api/ai/analyze-diff
 * Body: { diff }
 */
export async function analyzeCodeDiff(req, res) {
  try {
    const { diff } = req.body
    if (!diff) return res.status(400).json({ error: 'diff is required' })

    const result = await analyzeDiff(diff)
    return res.json(result)
  } catch (err) {
    console.error('[Analyze Diff Error]', err.message)
    return res.status(500).json({ error: 'Analysis failed', details: err.message })
  }
}

/**
 * POST /api/ai/generate-pr-description
 * Body: { changes }
 */
export async function generatePR(req, res) {
  try {
    const { changes } = req.body
    if (!changes) return res.status(400).json({ error: 'changes are required' })

    const result = await generatePRDescription(changes)
    return res.json(result)
  } catch (err) {
    console.error('[Generate PR Error]', err.message)
    return res.status(500).json({ error: 'Generation failed', details: err.message })
  }
}
