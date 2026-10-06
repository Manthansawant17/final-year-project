import * as githubService from '../services/githubService.js'
import dotenv from 'dotenv'

dotenv.config()

const OWNER = process.env.GITHUB_OWNER

/**
 * GET /api/github/repositories
 */
export async function listRepositories(req, res) {
  try {
    const repos = await githubService.getRepositories()
    return res.json(repos)
  } catch (err) {
    console.error('[GitHub Repos Error]', err.message)
    return res.status(500).json({ error: 'Failed to fetch repositories', details: err.message })
  }
}

/**
 * GET /api/github/prs/:repo
 */
export async function listPullRequests(req, res) {
  try {
    const { repo } = req.params
    const owner = req.query.owner || OWNER
    const prs = await githubService.getPullRequests(owner, repo)
    return res.json(prs)
  } catch (err) {
    console.error('[GitHub PRs Error]', err.message)
    return res.status(500).json({ error: 'Failed to fetch PRs', details: err.message })
  }
}

/**
 * GET /api/github/prs/:repo/:number/diff
 */
export async function getPRDiff(req, res) {
  try {
    const { repo, number } = req.params
    const owner = req.query.owner || OWNER
    const diff = await githubService.getPRDiff(owner, repo, number)
    return res.json({ diff })
  } catch (err) {
    console.error('[GitHub Diff Error]', err.message)
    return res.status(500).json({ error: 'Failed to fetch PR diff', details: err.message })
  }
}

/**
 * GET /api/github/file/:repo?path=...
 */
export async function getFile(req, res) {
  try {
    const { repo } = req.params
    const { path, ref = 'main', owner } = req.query
    if (!path) return res.status(400).json({ error: 'path query param is required' })
    const file = await githubService.getFileContent(owner || OWNER, repo, path, ref)
    return res.json(file)
  } catch (err) {
    console.error('[GitHub File Error]', err.message)
    return res.status(500).json({ error: 'Failed to fetch file', details: err.message })
  }
}

/**
 * POST /api/github/create-pr
 */
export async function createPR(req, res) {
  try {
    const { repo, title, body, head, base, owner } = req.body
    if (!repo || !title || !head) {
      return res.status(400).json({ error: 'repo, title, and head are required' })
    }
    const pr = await githubService.createPullRequest(owner || OWNER, repo, { title, body, head, base })
    return res.json(pr)
  } catch (err) {
    console.error('[GitHub Create PR Error]', err.message)
    return res.status(500).json({ error: 'Failed to create PR', details: err.message })
  }
}
