import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

const githubAPI = axios.create({
  baseURL: 'https://api.github.com',
  headers: {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github.v3+json',
    'X-GitHub-Api-Version': '2022-11-28',
  },
})

/**
 * List repositories for the authenticated user
 */
export async function getRepositories() {
  const { data } = await githubAPI.get('/user/repos', {
    params: { sort: 'updated', per_page: 30 },
  })
  return data.map((r) => ({
    id: r.id,
    name: r.name,
    full_name: r.full_name,
    description: r.description,
    language: r.language,
    stars: r.stargazers_count,
    updated_at: r.updated_at,
    default_branch: r.default_branch,
  }))
}

/**
 * Get open pull requests for a repo
 */
export async function getPullRequests(owner, repo) {
  const { data } = await githubAPI.get(`/repos/${owner}/${repo}/pulls`, {
    params: { state: 'open', per_page: 20 },
  })
  return data.map((pr) => ({
    number: pr.number,
    title: pr.title,
    state: pr.state,
    user: pr.user.login,
    created_at: pr.created_at,
    updated_at: pr.updated_at,
    body: pr.body,
  }))
}

/**
 * Get the diff for a specific PR
 */
export async function getPRDiff(owner, repo, prNumber) {
  const { data } = await githubAPI.get(`/repos/${owner}/${repo}/pulls/${prNumber}`, {
    headers: { Accept: 'application/vnd.github.v3.diff' },
  })
  return data
}

/**
 * Get file content from a repo
 */
export async function getFileContent(owner, repo, path, ref = 'main') {
  const { data } = await githubAPI.get(`/repos/${owner}/${repo}/contents/${path}`, {
    params: { ref },
  })
  const content = Buffer.from(data.content, 'base64').toString('utf-8')
  return { path, content, sha: data.sha }
}

/**
 * Create a pull request
 */
export async function createPullRequest(owner, repo, { title, body, head, base = 'main' }) {
  const { data } = await githubAPI.post(`/repos/${owner}/${repo}/pulls`, {
    title, body, head, base,
  })
  return { number: data.number, url: data.html_url, title: data.title }
}

export default { getRepositories, getPullRequests, getPRDiff, getFileContent, createPullRequest }
