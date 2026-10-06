// In-memory user store (replace with MongoDB/PostgreSQL in production)
const users = new Map()
const refreshTokenStore = new Set()

export function createUser({ id, email, password, name, avatar, provider, providerId }) {
  const user = {
    id, email,
    password: password || null,
    name,
    avatar: avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=7c6af7&color=fff`,
    provider: provider || 'local',
    providerId: providerId || null,
    createdAt: new Date().toISOString(),
    role: 'developer',
  }
  users.set(id, user)
  return user
}
export const findUserById = (id) => users.get(id) || null
export function findUserByEmail(email) {
  for (const u of users.values()) if (u.email === email) return u
  return null
}
export function findUserByProvider(provider, providerId) {
  for (const u of users.values()) if (u.provider === provider && u.providerId === String(providerId)) return u
  return null
}
export const updateUser = (id, updates) => { const u = users.get(id); if (!u) return null; const updated = {...u,...updates}; users.set(id,updated); return updated }
export const saveRefreshToken = (token) => refreshTokenStore.add(token)
export const isRefreshTokenValid = (token) => refreshTokenStore.has(token)
export const revokeRefreshToken = (token) => refreshTokenStore.delete(token)
export { users, refreshTokenStore as refreshTokens }
