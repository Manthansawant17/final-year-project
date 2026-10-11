import * as githubService from '../services/githubService.js'
import { isDBConnected } from '../config/db.js'
import { Activity } from '../models/schemas.js'

/**
 * GitHub MCP Server Implementation
 * Protocol endpoints:
 * - list_repositories()
 * - get_pull_requests(owner, repo)
 * - get_pull_request_diff(owner, repo, number)
 * - get_file_content(owner, repo, path)
 * - create_pull_request(repo, title, body, head, base)
 */

export const GITHUB_TOOLS = [
  {
    name: 'github_list_repositories',
    description: 'List user and organization GitHub repositories',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'github_get_repository',
    description: 'Get details and metadata of a specific repository',
    parameters: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
      },
      required: ['repo'],
    },
  },
  {
    name: 'github_get_pull_requests',
    description: 'Get open pull requests for a specific repository',
    parameters: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
      },
      required: ['repo'],
    },
  },
  {
    name: 'github_get_diff',
    description: 'Retrieve git diff for a specific pull request',
    parameters: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        prNumber: { type: 'number', description: 'Pull request number' },
      },
      required: ['repo', 'prNumber'],
    },
  },
  {
    name: 'github_get_file',
    description: 'Read file content from repository',
    parameters: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        path: { type: 'string', description: 'File path inside repository' },
      },
      required: ['repo', 'path'],
    },
  },
  {
    name: 'github_get_tree',
    description: 'Get full repository file tree hierarchy',
    parameters: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        branch: { type: 'string', description: 'Target branch (default: main)' },
      },
      required: ['repo'],
    },
  },
  {
    name: 'github_create_pr',
    description: 'Create a new pull request on GitHub',
    parameters: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        title: { type: 'string', description: 'PR title' },
        body: { type: 'string', description: 'PR description body' },
        head: { type: 'string', description: 'Feature branch' },
        base: { type: 'string', description: 'Target branch (default: main)' },
      },
      required: ['repo', 'title', 'head'],
    },
  },
  {
    name: 'github_get_commits',
    description: 'Get recent commit history for a repository',
    parameters: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        branch: { type: 'string', description: 'Target branch (default: main)' },
      },
      required: ['repo'],
    },
  },
  {
    name: 'github_get_issues',
    description: 'Get issues for a repository',
    parameters: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        state: { type: 'string', enum: ['open', 'closed', 'all'], description: 'Issue state' },
      },
      required: ['repo'],
    },
  },
  {
    name: 'github_create_issue',
    description: 'Create a new issue on GitHub',
    parameters: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        title: { type: 'string', description: 'Issue title' },
        body: { type: 'string', description: 'Issue body description' },
        labels: { type: 'array', items: { type: 'string' }, description: 'Issue labels' },
      },
      required: ['repo', 'title'],
    },
  },
]

export async function handleGitHubMCP(toolName, args, user = 'DevUser') {
  let result = null

  switch (toolName) {
    case 'github_list_repositories':
      result = await githubService.getRepositories()
      break

    case 'github_get_repository':
      result = await githubService.getRepository(args.owner || process.env.GITHUB_OWNER, args.repo)
      break

    case 'github_get_pull_requests':
      result = await githubService.getPullRequests(args.owner || process.env.GITHUB_OWNER, args.repo)
      break

    case 'github_get_diff':
      result = await githubService.getPRDiff(args.owner || process.env.GITHUB_OWNER, args.repo, args.prNumber)
      break

    case 'github_get_file':
      result = await githubService.getFileContent(args.owner || process.env.GITHUB_OWNER, args.repo, args.path, args.ref)
      break

    case 'github_get_tree':
      result = await githubService.getRepoTree(args.owner || process.env.GITHUB_OWNER, args.repo, args.branch)
      break

    case 'github_create_pr':
      result = await githubService.createPullRequest(args.owner || process.env.GITHUB_OWNER, args.repo, args)
      break

    case 'github_get_commits':
      result = await githubService.getCommits(args.owner || process.env.GITHUB_OWNER, args.repo, args.branch)
      break

    case 'github_get_issues':
      result = await githubService.getIssues(args.owner || process.env.GITHUB_OWNER, args.repo, args.state)
      break

    case 'github_create_issue':
      result = await githubService.createIssue(args.owner || process.env.GITHUB_OWNER, args.repo, args)
      break

    default:
      throw new Error(`Unknown GitHub MCP tool: ${toolName}`)
  }

  // Record activity in MongoDB if connected
  if (isDBConnected()) {
    try {
      await Activity.create({
        userId: user,
        action: `mcp_github_${toolName}`,
        details: { args, resultPreview: typeof result === 'string' ? result.slice(0, 100) : 'success' },
      })
    } catch {}
  }

  return result
}

export default { GITHUB_TOOLS, handleGitHubMCP }
