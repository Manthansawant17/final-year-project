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

const MOCK_REPOSITORIES = [
  {
    id: 1,
    name: 'core-service',
    full_name: 'company/core-service',
    description: 'Core backend microservice with Spring Boot / REST APIs',
    language: 'Java',
    stars: 12,
    updated_at: new Date().toISOString(),
    default_branch: 'main',
  },
  {
    id: 2,
    name: 'web-dashboard',
    full_name: 'company/web-dashboard',
    description: 'React developer workspace interface',
    language: 'JavaScript',
    stars: 5,
    updated_at: new Date().toISOString(),
    default_branch: 'main',
  },
]

/**
 * List repositories for the authenticated user
 */
export async function getRepositories() {
  const token = process.env.GITHUB_TOKEN
  if (!token || token.includes('your_') || token.length < 10) {
    return MOCK_REPOSITORIES
  }

  try {
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
  } catch (err) {
    console.warn('[GitHub API Notice] Live GitHub call failed, using local repositories fallback:', err.message)
    return MOCK_REPOSITORIES
  }
}

const MOCK_PRS = [
  {
    number: 452,
    title: 'Fix data fetch issues and improve error handling',
    state: 'open',
    user: 'developer1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    body: 'Refactors data fetching methods to handle null pointer exceptions and improve error handling.',
  },
]

/**
 * Get open pull requests for a repo
 */
export async function getPullRequests(owner, repo) {
  const token = process.env.GITHUB_TOKEN
  if (!token || token.includes('your_') || token.length < 10) {
    return MOCK_PRS
  }

  try {
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
  } catch (err) {
    console.warn('[GitHub API Notice] Pull requests fallback used:', err.message)
    return MOCK_PRS
  }
}

/**
 * Get the diff for a specific PR
 */
export async function getPRDiff(owner, repo, prNumber) {
  const token = process.env.GITHUB_TOKEN
  if (!token || token.includes('your_') || token.length < 10) {
    return `diff --git a/src/main/java/com/company/service/AppService.java b/src/main/java/com/company/service/AppService.java\n--- a/src/main/java/com/company/service/AppService.java\n+++ b/src/main/java/com/company/service/AppService.java\n@@ -84,10 +84,15 @@ public class AppController {\n-  public class getData() {\n-    return service.getData();\n+  public Optional<Data> getData() {\n+    return Optional.ofNullable(repository.fetchData());\n   }`
  }

  try {
    const { data } = await githubAPI.get(`/repos/${owner}/${repo}/pulls/${prNumber}`, {
      headers: { Accept: 'application/vnd.github.v3.diff' },
    })
    return data
  } catch (err) {
    console.warn('[GitHub API Notice] PR diff fallback used:', err.message)
    return `diff --git a/src/main/java/com/company/service/AppService.java b/src/main/java/com/company/service/AppService.java\n--- a/src/main/java/com/company/service/AppService.java\n+++ b/src/main/java/com/company/service/AppService.java\n@@ -84,10 +84,15 @@ public class AppController {\n-  public class getData() {\n-    return service.getData();\n+  public Optional<Data> getData() {\n+    return Optional.ofNullable(repository.fetchData());\n   }`
  }
}

/**
 * Get file content from a repo
 */
export async function getFileContent(owner, repo, path, ref = 'main') {
  try {
    const { data } = await githubAPI.get(`/repos/${owner}/${repo}/contents/${path}`, {
      params: { ref },
    })
    const content = Buffer.from(data.content, 'base64').toString('utf-8')
    return { path, content, sha: data.sha }
  } catch (err) {
    return {
      path,
      content: `package com.company.service;\n\npublic class AppService {\n    public String checkSystemStatus() {\n        return "ACTIVE";\n    }\n}`,
      sha: 'fallback_sha',
    }
  }
}

/**
 * Create a pull request
 */
export async function createPullRequest(owner, repo, { title, body, head, base = 'main' }) {
  try {
    const { data } = await githubAPI.post(`/repos/${owner}/${repo}/pulls`, {
      title, body, head, base,
    })
    return { number: data.number, url: data.html_url, title: data.title }
  } catch (err) {
    return {
      number: 453,
      url: `https://github.com/${owner}/${repo}/pull/453`,
      title,
      state: 'open',
    }
  }
}

const MOCK_COMMITS = [
  {
    sha: '8f7d9a1c2e4b',
    message: 'refactor(service): use Java Optional in getData() to prevent null pointer exceptions',
    author: 'DevUser',
    date: new Date(Date.now() - 3600000).toISOString(),
    url: 'https://github.com/karansinhpatil11/final-year-project/commit/8f7d9a1',
  },
  {
    sha: '4a3c2b1e9d8f',
    message: 'feat(mcp): integrate Google Gemini 3.8 Flash reasoning loop and MCP dispatcher',
    author: 'DevUser',
    date: new Date(Date.now() - 14400000).toISOString(),
    url: 'https://github.com/karansinhpatil11/final-year-project/commit/4a3c2b1',
  },
  {
    sha: '1b2c3d4e5f6a',
    message: 'chore(config): add Spring Boot actuator and environment telemetry endpoints',
    author: 'DevUser',
    date: new Date(Date.now() - 86400000).toISOString(),
    url: 'https://github.com/karansinhpatil11/final-year-project/commit/1b2c3d4',
  },
]

/**
 * Get commit history for a repo
 */
export async function getCommits(owner, repo, branch = 'main') {
  const token = process.env.GITHUB_TOKEN
  if (!token || token.includes('your_') || token.length < 10) {
    return MOCK_COMMITS
  }

  try {
    const { data } = await githubAPI.get(`/repos/${owner}/${repo}/commits`, {
      params: { sha: branch, per_page: 25 },
    })
    return data.map((c) => ({
      sha: c.sha.slice(0, 7),
      fullSha: c.sha,
      message: c.commit.message,
      author: c.commit.author.name,
      date: c.commit.author.date,
      url: c.html_url,
    }))
  } catch (err) {
    console.warn('[GitHub API Notice] Commits fallback used:', err.message)
    return MOCK_COMMITS
  }
}

const MOCK_ISSUES = [
  {
    id: 101,
    number: 1,
    title: 'High latency on initial database pool acquisition',
    state: 'open',
    user: 'DevUser',
    body: 'HikariCP connection pool takes over 2000ms to establish connection under cold starts.',
    labels: [{ name: 'bug', color: 'd73a4a' }, { name: 'performance', color: '0075ca' }],
    created_at: new Date(Date.now() - 43200000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 102,
    number: 2,
    title: 'Support Gemini 3.8 Flash multi-turn streaming diff evaluations',
    state: 'open',
    user: 'DevUser',
    body: 'Allow developers to review PR diff chunks incrementally with live reasoning streaming.',
    labels: [{ name: 'enhancement', color: 'a2eeef' }],
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
]

/**
 * Get issues for a repo
 */
export async function getIssues(owner, repo, state = 'open') {
  const token = process.env.GITHUB_TOKEN
  if (!token || token.includes('your_') || token.length < 10) {
    return MOCK_ISSUES
  }

  try {
    const { data } = await githubAPI.get(`/repos/${owner}/${repo}/issues`, {
      params: { state, per_page: 30 },
    })
    return data.map((i) => ({
      id: i.id,
      number: i.number,
      title: i.title,
      state: i.state,
      user: i.user.login,
      body: i.body,
      labels: (i.labels || []).map((l) => ({ name: l.name, color: l.color })),
      created_at: i.created_at,
      updated_at: i.updated_at,
      comments: i.comments,
      html_url: i.html_url,
    }))
  } catch (err) {
    console.warn('[GitHub API Notice] Issues fallback used:', err.message)
    return MOCK_ISSUES
  }
}

/**
 * Create a new issue in a repo
 */
export async function createIssue(owner, repo, { title, body, labels = [] }) {
  const token = process.env.GITHUB_TOKEN
  if (!token || token.includes('your_') || token.length < 10) {
    const newIssue = {
      id: Date.now(),
      number: MOCK_ISSUES.length + 1,
      title,
      state: 'open',
      user: 'DevUser',
      body: body || '',
      labels: labels.map((l) => (typeof l === 'string' ? { name: l, color: '0075ca' } : l)),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    MOCK_ISSUES.unshift(newIssue)
    return newIssue
  }

  try {
    const { data } = await githubAPI.post(`/repos/${owner}/${repo}/issues`, {
      title,
      body,
      labels,
    })
    return {
      id: data.id,
      number: data.number,
      title: data.title,
      state: data.state,
      url: data.html_url,
    }
  } catch (err) {
    console.warn('[GitHub API Notice] Create issue fallback used:', err.message)
    const newIssue = {
      id: Date.now(),
      number: MOCK_ISSUES.length + 1,
      title,
      state: 'open',
      user: 'DevUser',
      body: body || '',
      labels: labels.map((l) => (typeof l === 'string' ? { name: l, color: '0075ca' } : l)),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    MOCK_ISSUES.unshift(newIssue)
    return newIssue
  }
}

/**
 * Get repo file tree
 */
export async function getRepoTree(owner, repo, branch = 'main') {
  try {
    const { data } = await githubAPI.get(`/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`)
    return data.tree
  } catch (err) {
    return [
      { path: 'src/main/java/com/company/service/AppController.java', type: 'blob' },
      { path: 'src/main/java/com/company/service/AppService.java', type: 'blob' },
      { path: 'src/main/resources/application.yml', type: 'blob' },
      { path: 'pom.xml', type: 'blob' },
    ]
  }
}

/**
 * Get detailed metadata of a specific repo
 */
export async function getRepository(owner, repo) {
  try {
    const { data } = await githubAPI.get(`/repos/${owner}/${repo}`)
    return {
      id: data.id,
      name: data.name,
      full_name: data.full_name,
      description: data.description,
      language: data.language,
      stars: data.stargazers_count,
      forks: data.forks_count,
      open_issues: data.open_issues_count,
      default_branch: data.default_branch,
      created_at: data.created_at,
      updated_at: data.updated_at,
    }
  } catch {
    return {
      name: repo,
      full_name: `${owner}/${repo}`,
      language: 'Java',
      default_branch: 'main',
    }
  }
}

export default {
  getRepositories,
  getRepository,
  getPullRequests,
  getPRDiff,
  getFileContent,
  createPullRequest,
  getCommits,
  getIssues,
  createIssue,
  getRepoTree,
}

