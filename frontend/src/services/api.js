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

export const sendChatMessage = (message, history) => api.post('/ai/chat', { message, history })
export const analyzeDiff = (diff) => api.post('/ai/analyze-diff', { diff })
export const generatePRDescription = (changes) => api.post('/ai/generate-pr-description', { changes })

export const githubAPI = {
  getRepositories: () => api.get('/github/repositories'),
  getPullRequests: (repo) => api.get(`/github/prs/${repo}`),
  getPRDiff: (repo, number) => api.get(`/github/prs/${repo}/${number}/diff`),
  getFile: (repo, path, ref) => api.get(`/github/file/${repo}?path=${encodeURIComponent(path)}&ref=${ref || 'main'}`),
  createPR: (data) => api.post('/github/create-pr', data),
}

export const checkHealth = () => api.get('/health')
export default api
