import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setAccessToken: (token) => set({ accessToken: token }),
      login: (user, accessToken) => set({ user, accessToken, isAuthenticated: true, isLoading: false }),
      logout: () => set({ user: null, accessToken: null, isAuthenticated: false }),
      setLoading: (isLoading) => set({ isLoading }),
      updateAccessToken: (accessToken) => set({ accessToken }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, accessToken: state.accessToken, isAuthenticated: state.isAuthenticated }),
    }
  )
)

export default useAuthStore
