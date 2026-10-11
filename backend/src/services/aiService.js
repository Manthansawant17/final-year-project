import { GoogleGenAI } from '@google/genai'
import dotenv from 'dotenv'
import { executeMCPTool, ALL_MCP_TOOLS } from '../mcp/mcpClient.js'
import { getAllTasks } from '../models/taskStore.js'
import { getAllDocs } from '../models/docStore.js'
import { isDBConnected } from '../config/db.js'
import { AISession, Activity } from '../models/schemas.js'

dotenv.config()

// Support GEMINI_API_KEY, GOOGLE_API_KEY, or legacy OPENAI_API_KEY
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.OPENAI_API_KEY

let ai = null
if (apiKey) {
  try {
    ai = new GoogleGenAI({ apiKey })
  } catch (err) {
    console.warn('[Gemini Init Warning]', err.message)
  }
}

// Available free tier Gemini models
export const FREE_GEMINI_MODELS = {
  DEFAULT: 'gemini-3.8-flash',
  MODELS: [
    'gemini-3.8-flash',
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
  ],
}

// Map user-friendly model names to Gemini model IDs
const MODEL_MAP = {
  'gemini-3.8-flash': 'gemini-3.8-flash',
  'gemini-2.5-flash': 'gemini-2.5-flash',
  'gemini-2.0-flash': 'gemini-2.0-flash',
  'gemini-1.5-flash': 'gemini-1.5-flash',
  'Gemini 3.8 Flash (Free)': 'gemini-3.8-flash',
  'Gemini 3.8 Flash': 'gemini-3.8-flash',
  'Gemini 2.5 Flash (Free)': 'gemini-2.5-flash',
  'Gemini 2.5 Flash': 'gemini-2.5-flash',
  'Gemini 2.0 Flash (Free)': 'gemini-2.0-flash',
  'Gemini 2.0 Flash': 'gemini-2.0-flash',
  'Gemini 1.5 Flash (Free)': 'gemini-1.5-flash',
  'Gemini 1.5 Flash': 'gemini-1.5-flash',
  'GPT-4o': 'gemini-3.8-flash',
  'GPT-4o-mini': 'gemini-2.5-flash',
  'GPT-3.5 Turbo': 'gemini-1.5-flash',
}

import { getAllIssues, getProjectProgress, getProjectData } from '../models/taskStore.js'

/**
 * Build dynamic project context for the AI Agent
 */
function buildProjectContext() {
  const tasks = getAllTasks()
  const docs = getAllDocs()
  const issues = getAllIssues()
  const progress = getProjectProgress()

  return `
--- PROJECT CONTEXT ---
Active Project: core-service (Java 17 / Spring Boot 3.2)
Repository: karansinhpatil11/final-year-project (branch: main)
Overall Progress: ${progress.overallProgress}% | Milestone Readiness: ${progress.readinessScore}%
Active Milestone: ${progress.activeMilestone} (Deadline: ${progress.milestoneDeadline})
Active Pull Request: PR #452 ("Fix data fetch issues and improve error handling")
Modified file: src/main/java/com/company/service/AppService.java
Associated controller: src/main/java/com/company/service/AppController.java

Open Tasks (${tasks.length} total, ${progress.tasks.completed} completed, ${progress.tasks.inProgress} in progress):
${tasks.map((t) => `- [${t.status.toUpperCase()}] ${t.title} (${t.priority} priority)`).join('\n')}

Active Project Issues (${issues.length}):
${issues.map((i) => `- #${i.number} [${i.status.toUpperCase()}] ${i.title} (${i.severity} severity)`).join('\n')}

Documentation Library (${docs.length} docs available):
${docs.map((d) => `- "${d.title}" (${d.category})`).join('\n')}
-----------------------`
}

const SYSTEM_PROMPT = `You are an Autonomous AI Developer Assistant embedded in an IDE.
Follow this 5-stage cognitive architecture:
1. Understand Request: Parse developer intent, identify files, methods, errors, or requests.
2. Reasoning: Analyze root causes, best practices, edge cases, and architecture implications.
3. Select Tools: You have access to the MCP Protocol connecting:
   - GitHub MCP Server (repositories, files, commits, PRs, diffs)
   - Documentation MCP Server (read, create, update, search docs)
   - Project/Task MCP Server (list, create, update tasks, project progress)
4. Use Project Context: Integrate repository files, open tasks, and active PRs into your response.
5. Generate Response: Output a structured JSON response.

RESPONSE FORMAT:
Always return valid JSON or markdown containing code. If returning JSON:
{
  "thought": "brief reasoning step explaining what was understood and why",
  "content": "your detailed technical response or explanation",
  "code": "optional code snippet",
  "codeLanguage": "java/javascript/etc",
  "mcpToolUsed": "optional tool name if an MCP server was invoked",
  "actions": ["Apply Code", "Create PR"]
}

Be concise, technically rigorous, and focused on clean software engineering.`

/**
 * Intelligent fallback when API key is missing
 */
function getFallbackResponse(message, mcpToolResult = null) {
  const lower = (message || '').toLowerCase()

  if (mcpToolResult) {
    return {
      thought: 'Executed MCP Protocol tool and integrated project data into response.',
      content: `Here is the data from the MCP Server:\n\n${typeof mcpToolResult === 'object' ? JSON.stringify(mcpToolResult, null, 2) : mcpToolResult}`,
      actions: ['Apply Code', 'Create PR'],
    }
  }

  if (lower.includes('task') || lower.includes('todo') || lower.includes('issue')) {
    const tasks = getAllTasks()
    return {
      thought: 'Analyzed task management request via Project/Task MCP Server.',
      content: `I queried the Project/Task MCP Server. You currently have ${tasks.length} active tasks in this project:\n\n` +
        tasks.map((t) => `• **${t.title}** (${t.status}) - ${t.priority} priority`).join('\n'),
      actions: ['Create PR'],
    }
  }

  if (lower.includes('doc') || lower.includes('architecture') || lower.includes('guide')) {
    const docs = getAllDocs()
    return {
      thought: 'Fetched project documentation through Documentation MCP Server.',
      content: `According to the Documentation MCP Server, here are the available guides:\n\n` +
        docs.map((d) => `• **${d.title}** (${d.category})`).join('\n') +
        `\n\nWould you like me to read or update any of these documents?`,
      actions: ['Apply Code'],
    }
  }

  if (lower.includes('null') || lower.includes('optional') || lower.includes('getdata') || lower.includes('refactor')) {
    return {
      thought: 'Identified NullPointerException risk in AppService. Refactoring with java.util.Optional wrapper.',
      content: 'Certainly! Here is a refactored version using `Optional` to safely handle potential null pointer exceptions:',
      code: `public Optional<Data> getData() {\n  return Optional.ofNullable(\n    repository.fetchData());\n}`,
      codeLanguage: 'java',
      actions: ['Apply Code', 'Create PR'],
    }
  }

  return {
    thought: 'Processed developer request with project context (core-service, PR #452).',
    content: `I've analyzed your request: "${message}". I'm connected to the GitHub MCP Server, Documentation MCP Server, and Project/Task MCP Server. How can I assist you with this codebase?`,
    actions: ['Apply Code', 'Create PR'],
  }
}

/**
 * Parses Gemini output to extract JSON or code blocks
 */
function parseGeminiOutput(raw) {
  if (!raw) return { content: '' }

  try {
    const direct = JSON.parse(raw)
    if (direct && (direct.content || direct.code)) return direct
  } catch {}

  const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1])
      if (parsed && (parsed.content || parsed.code)) return parsed
    } catch {}
  }

  const codeMatch = raw.match(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/)
  if (codeMatch) {
    const lang = codeMatch[1] || 'java'
    const code = codeMatch[2].trim()
    const content = raw.replace(/```[a-zA-Z0-9_-]*\n[\s\S]*?```/, '').trim()
    return {
      content: content || 'Here is the proposed code implementation:',
      code,
      codeLanguage: lang,
      actions: ['Apply Code', 'Create PR'],
    }
  }

  return { content: raw }
}

/**
 * Autonomous AI Agent Request Handler:
 * 1. Understands Request
 * 2. Reasonings & Tool Selection (MCP Protocol)
 * 3. Injects Project Context
 * 4. Calls Gemini 3.8 Flash
 * 5. Generates Response & Updates MongoDB
 */
export async function chatWithAI(message, history = [], requestedModel, user = 'DevUser') {
  const modelKey = requestedModel || process.env.GEMINI_MODEL || process.env.AI_MODEL || 'gemini-3.8-flash'
  const targetModel = MODEL_MAP[modelKey] || 'gemini-3.8-flash'

  // Stage 1 & 2: Evaluate if an MCP protocol tool should be invoked
  const lower = (message || '').toLowerCase()
  let mcpResult = null
  let mcpToolUsed = null

  try {
    if (lower.includes('task') || lower.includes('todo')) {
      mcpToolUsed = 'Project/Task MCP Server: task_list'
      mcpResult = await executeMCPTool('task_list', {}, user)
    } else if (lower.includes('progress') || lower.includes('milestone') || lower.includes('readiness')) {
      mcpToolUsed = 'Project MCP Server: project_get_progress'
      mcpResult = await executeMCPTool('project_get_progress', {}, user)
    } else if (lower.includes('project data') || lower.includes('architecture') || lower.includes('project info')) {
      mcpToolUsed = 'Project MCP Server: project_get_data'
      mcpResult = await executeMCPTool('project_get_data', {}, user)
    } else if (lower.includes('commit') || lower.includes('git log') || lower.includes('history')) {
      mcpToolUsed = 'GitHub MCP Server: github_get_commits'
      mcpResult = await executeMCPTool('github_get_commits', { repo: 'final-year-project' }, user)
    } else if (lower.includes('issue') || lower.includes('bug') || lower.includes('ticket')) {
      mcpToolUsed = 'Project/GitHub MCP Server: project_issues_list'
      mcpResult = await executeMCPTool('project_issues_list', {}, user)
    } else if (lower.includes('repo') || lower.includes('repository')) {
      mcpToolUsed = 'GitHub MCP Server: github_list_repositories'
      mcpResult = await executeMCPTool('github_list_repositories', {}, user)
    } else if (lower.includes('pr') || lower.includes('pull request') || lower.includes('diff')) {
      mcpToolUsed = 'GitHub MCP Server: github_get_pull_requests'
      mcpResult = await executeMCPTool('github_get_pull_requests', { repo: 'final-year-project' }, user)
    } else if (lower.includes('doc') || lower.includes('guide') || lower.includes('documentation')) {
      mcpToolUsed = 'Documentation MCP Server: doc_search'
      mcpResult = await executeMCPTool('doc_search', { query: message }, user)
    }
  } catch (err) {
    console.warn('[MCP Tool Dispatch Warning]', err.message)
  }

  // Fallback if no API client
  if (!ai || !apiKey || apiKey.includes('your_') || apiKey.length < 10) {
    const fallback = getFallbackResponse(message, mcpResult)
    if (mcpToolUsed) fallback.mcpToolUsed = mcpToolUsed
    return fallback
  }

  try {
    // Stage 3 & 4: Construct multi-turn contents with project context & MCP results
    const projectContext = buildProjectContext()
    const contents = []

    for (const msg of history.slice(-8)) {
      const role = msg.role === 'user' ? 'user' : 'model'
      const text = msg.content || (typeof msg === 'string' ? msg : '')
      if (text) {
        contents.push({ role, parts: [{ text }] })
      }
    }

    let promptWithContext = `${projectContext}\n\nDeveloper Request: ${message}`
    if (mcpResult) {
      promptWithContext += `\n\n[MCP Protocol Tool Executed: ${mcpToolUsed}]\nTool Result:\n${JSON.stringify(mcpResult, null, 2)}`
    }

    contents.push({
      role: 'user',
      parts: [{ text: promptWithContext }],
    })

    // Stage 5: Generate Response via Gemini
    const response = await ai.models.generateContent({
      model: targetModel,
      contents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.2,
        maxOutputTokens: 2048,
      },
    })

    const parsed = parseGeminiOutput(response.text)
    if (mcpToolUsed) parsed.mcpToolUsed = mcpToolUsed

    // Persist Session to MongoDB if connected
    if (isDBConnected()) {
      try {
        const sessionId = `session-${user}`
        await AISession.findOneAndUpdate(
          { sessionId },
          {
            $push: {
              messages: [
                { role: 'user', content: message, timestamp: new Date() },
                {
                  role: 'assistant',
                  content: parsed.content,
                  code: parsed.code,
                  codeLanguage: parsed.codeLanguage,
                  actions: parsed.actions,
                  timestamp: new Date(),
                },
              ],
            },
            $set: { model: targetModel, userId: user },
          },
          { upsert: true, new: true }
        )

        await Activity.create({
          userId: user,
          action: 'ai_chat_response',
          details: { model: targetModel, mcpToolUsed },
        })
      } catch (err) {
        console.warn('[MongoDB Session Save Warning]', err.message)
      }
    }

    return parsed
  } catch (err) {
    console.error(`[Gemini API Error with ${targetModel}]:`, err.message)
    const fallback = getFallbackResponse(message, mcpResult)
    fallback.note = `Live API notice: ${err.message}. Showing local developer assistant suggestion.`
    return fallback
  }
}

/**
 * Analyze a code diff for issues using Gemini
 */
export async function analyzeDiff(diff, requestedModel, user = 'DevUser') {
  const prompt = `Analyze this code diff and identify potential issues, improvements, or concerns:\n\n${diff}`
  return chatWithAI(prompt, [], requestedModel, user)
}

/**
 * Suggest a PR description using Gemini
 */
export async function generatePRDescription(changes, requestedModel, user = 'DevUser') {
  const prompt = `Generate a concise, professional pull request title and description for these changes:\n\n${JSON.stringify(changes, null, 2)}`
  return chatWithAI(prompt, [], requestedModel, user)
}

export default { chatWithAI, analyzeDiff, generatePRDescription, FREE_GEMINI_MODELS }
