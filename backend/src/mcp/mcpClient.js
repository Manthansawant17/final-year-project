import { GITHUB_TOOLS, handleGitHubMCP } from './githubMCPServer.js'
import { DOC_TOOLS, handleDocMCP } from './docMCPServer.js'
import { TASK_TOOLS, handleTaskMCP } from './taskMCPServer.js'
import { isDBConnected } from '../config/db.js'
import { Activity } from '../models/schemas.js'

/**
 * Unified MCP Protocol Client
 * Dispatches protocol messages across:
 * 1. GitHub MCP Server
 * 2. Documentation MCP Server
 * 3. Project / Task MCP Server
 */

export const ALL_MCP_TOOLS = [
  ...GITHUB_TOOLS,
  ...DOC_TOOLS,
  ...TASK_TOOLS,
]

export async function executeMCPTool(toolName, args = {}, user = 'DevUser') {
  console.log(`📡 [MCP Protocol] Invoking ${toolName} with args:`, JSON.stringify(args))

  // Record dispatch activity
  if (isDBConnected()) {
    try {
      await Activity.create({
        userId: user,
        action: `mcp_protocol_invoke`,
        details: { toolName, args },
      })
    } catch {}
  }

  // 1. Check GitHub MCP Server
  if (toolName.startsWith('github_') || toolName.includes('repo') || toolName.includes('pr_') || toolName.includes('commit')) {
    return handleGitHubMCP(toolName, args, user)
  }

  // 2. Check Documentation MCP Server
  if (toolName.startsWith('doc_') || toolName.includes('doc')) {
    return handleDocMCP(toolName, args, user)
  }

  // 3. Check Task / Project MCP Server
  if (
    toolName.startsWith('task_') ||
    toolName.startsWith('project_') ||
    toolName.includes('task') ||
    toolName.includes('issue') ||
    toolName.includes('progress')
  ) {
    return handleTaskMCP(toolName, args, user)
  }

  throw new Error(`MCP Tool '${toolName}' not found on any registered MCP server.`)
}

export default { ALL_MCP_TOOLS, executeMCPTool }
