import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

// Attach JWT from localStorage
api.interceptors.request.use(
  (config) => {
    try {
      const stored = JSON.parse(localStorage.getItem('auth-storage') || '{}')
      const token = stored?.state?.accessToken
      if (token) config.headers.Authorization = `Bearer ${token}`
    } catch {}
    return config
  },
  (error) => Promise.reject(error)
)

// Auto-refresh on 401 TOKEN_EXPIRED
let isRefreshing = false
let queue = []

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const orig = error.config
    if (error.response?.status === 401 && error.response?.data?.code === 'TOKEN_EXPIRED' && !orig._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => queue.push({ resolve, reject }))
          .then((token) => { orig.headers.Authorization = `Bearer ${token}`; return api(orig) })
      }
      orig._retry = true; isRefreshing = true
      try {
        const res = await api.post('/auth/refresh')
        const newToken = res.data.accessToken
        const stored = JSON.parse(localStorage.getItem('auth-storage') || '{}')
        if (stored.state) { stored.state.accessToken = newToken; localStorage.setItem('auth-storage', JSON.stringify(stored)) }
        queue.forEach(({ resolve }) => resolve(newToken)); queue = []
        orig.headers.Authorization = `Bearer ${newToken}`
        return api(orig)
      } catch (e) {
        queue.forEach(({ reject }) => reject(e)); queue = []
        localStorage.removeItem('auth-storage')
        window.location.href = '/login'
        return Promise.reject(e)
      } finally { isRefreshing = false }
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  refresh: () => api.post('/auth/refresh'),
  me: () => api.get('/auth/me'),
}

export const sendChatMessage = (message, history, model) => api.post('/ai/chat', { message, history, model })
export const analyzeDiff = (diff, model) => api.post('/ai/analyze-diff', { diff, model })
export const generatePRDescription = (changes, model) => api.post('/ai/generate-pr-description', { changes, model })

export const githubAPI = {
  getRepositories: () => api.get('/github/repositories'),
  getRepository: (repo) => api.get(`/github/repository/${repo}`),
  getPullRequests: (repo) => api.get(`/github/prs/${repo}`),
  getPRDiff: (repo, number) => api.get(`/github/prs/${repo}/${number}/diff`),
  getFile: (repo, path, ref) => api.get(`/github/file/${repo}?path=${encodeURIComponent(path)}&ref=${ref || 'main'}`),
  getTree: (repo, branch) => api.get(`/github/tree/${repo}?branch=${branch || 'main'}`),
  getCommits: (repo, branch) => api.get(`/github/commits/${repo}?branch=${branch || 'main'}`),
  getIssues: (repo, state) => api.get(`/github/issues/${repo}?state=${state || 'open'}`),
  createIssue: (repo, data) => api.post(`/github/issues/${repo}`, data),
  createPR: (data) => api.post('/github/create-pr', data),
}

export const taskAPI = {
  getTasks: () => api.get('/tasks'),
  createTask: (data) => api.post('/tasks', data),
  updateTask: (id, data) => api.put(`/tasks/${id}`, data),
  deleteTask: (id) => api.delete(`/tasks/${id}`),
}

export const projectAPI = {
  getProjectData: () => api.get('/tasks/project/data'),
  getProgress: () => api.get('/tasks/project/progress'),
  getIssues: () => api.get('/tasks/project/issues'),
  createIssue: (data) => api.post('/tasks/project/issues', data),
  updateIssue: (id, data) => api.put(`/tasks/project/issues/${id}`, data),
  deleteIssue: (id) => api.delete(`/tasks/project/issues/${id}`),
}

export const docAPI = {
  getDocs: (q) => api.get('/docs', { params: q ? { q } : {} }),
  getDoc: (id) => api.get(`/docs/${id}`),
  createDoc: (data) => api.post('/docs', data),
  updateDoc: (id, data) => api.put(`/docs/${id}`, data),
  deleteDoc: (id) => api.delete(`/docs/${id}`),
}

export const checkHealth = () => api.get('/health')
export default api

