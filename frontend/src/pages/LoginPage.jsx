import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authAPI } from '../services/api'
import useAuthStore from '../store/authStore'
import { Lock, Mail, ArrowRight, Bot, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuthStore()

  const [formData, setFormData] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.email || !formData.password) {
      setError('Please provide both email and password.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const res = await authAPI.login({
        email: formData.email.trim(),
        password: formData.password,
      })
      login(res.data.user, res.data.accessToken)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ide-bg px-4 relative overflow-hidden">
      {/* Subtle ambient lighting */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-ide-accent/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-ide-purple/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-ide-panel border border-ide-border rounded-2xl p-8 shadow-2xl relative z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-ide-accent to-ide-purple flex items-center justify-center shadow-lg shadow-ide-accent/20 mb-3">
            <Bot size={26} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-ide-text-bright tracking-tight">AI Developer Assistant</h1>
          <p className="text-xs text-ide-text/60 mt-1">Sign in to your development workspace</p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-5 flex items-center gap-2 p-3 bg-ide-red/10 border border-ide-red/30 rounded-xl text-ide-red text-xs">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-ide-text/70 mb-1.5">Email Address</label>
            <div className="relative flex items-center">
              <Mail size={15} className="absolute left-3 text-ide-text/40 pointer-events-none" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="developer@example.com"
                className="w-full bg-ide-bg border border-ide-border rounded-xl pl-9 pr-3 py-2.5 text-xs text-ide-text-bright placeholder-ide-text/30 outline-none focus:border-ide-accent transition-colors"
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-ide-text/70 mb-1.5">Password</label>
            <div className="relative flex items-center">
              <Lock size={15} className="absolute left-3 text-ide-text/40 pointer-events-none" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full bg-ide-bg border border-ide-border rounded-xl pl-9 pr-3 py-2.5 text-xs text-ide-text-bright placeholder-ide-text/30 outline-none focus:border-ide-accent transition-colors"
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-ide-accent hover:bg-ide-accent-hover text-white py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-md shadow-ide-accent/20 cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
            <ArrowRight size={14} />
          </button>

          <button
            type="button"
            onClick={() => setFormData({ email: 'dev@example.com', password: 'password123' })}
            className="w-full py-1.5 bg-ide-border/40 hover:bg-ide-border text-ide-text hover:text-ide-text-bright rounded-xl text-[11px] font-medium transition-colors cursor-pointer text-center"
          >
            ⚡ Auto-fill Demo Account (dev@example.com)
          </button>
        </form>

        {/* Footer links */}
        <div className="mt-6 pt-5 border-t border-ide-border/60 flex items-center justify-between text-xs">
          <Link to="/" className="text-ide-text/50 hover:text-ide-text transition-colors">
            ← Continue as Guest
          </Link>
          <p className="text-ide-text/60">
            Don't have an account?{' '}
            <Link to="/signup" className="text-ide-accent hover:underline font-medium">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
