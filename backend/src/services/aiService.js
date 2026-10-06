import OpenAI from 'openai'
import dotenv from 'dotenv'

dotenv.config()

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const SYSTEM_PROMPT = `You are an expert AI Developer Assistant embedded in a developer IDE.
You help developers with:
- Code refactoring and optimization
- Bug detection and fixing  
- Code reviews and PR analysis
- Writing unit tests
- Explaining code logic
- GitHub PR management

When you provide code, respond with a JSON object containing:
{
  "content": "your explanation text",
  "code": "optional code block",
  "codeLanguage": "java/javascript/python/etc",
  "actions": ["Apply Code", "Create PR"] // optional action buttons
}

Always be concise, technical, and helpful.`

/**
 * Send a message to OpenAI and get a response
 */
export async function chatWithAI(message, history = []) {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.slice(-10), // Keep last 10 messages for context
    { role: 'user', content: message },
  ]

  const response = await openai.chat.completions.create({
    model: process.env.AI_MODEL || 'gpt-4o',
    messages,
    max_tokens: 1500,
    temperature: 0.3,
  })

  const raw = response.choices[0].message.content

  // Try to parse as JSON, fallback to plain text
  try {
    const parsed = JSON.parse(raw)
    return parsed
  } catch {
    return { content: raw }
  }
}

/**
 * Analyze a code diff for issues
 */
export async function analyzeDiff(diff) {
  const prompt = `Analyze this code diff and identify potential issues, improvements, or concerns:\n\n${diff}`
  return chatWithAI(prompt)
}

/**
 * Suggest a PR description
 */
export async function generatePRDescription(changes) {
  const prompt = `Generate a concise, professional pull request title and description for these changes:\n\n${JSON.stringify(changes, null, 2)}`
  return chatWithAI(prompt)
}

export default { chatWithAI, analyzeDiff, generatePRDescription }
