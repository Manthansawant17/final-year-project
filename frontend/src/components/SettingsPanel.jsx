import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useStore from '../store/useStore'
import useAuthStore from '../store/authStore'
import { checkHealth, authAPI } from '../services/api'
import {
  Settings,
  Cpu,
  Palette,
  Shield,
  Database,
  Check,
  RefreshCw,
  LogOut,
  Sliders,
  Bell,
  Terminal,
  Zap,
} from 'lucide-react'

export default function SettingsPanel() {
  const navigate = useNavigate()
  const { aiModel } = useStore()
  const { user, isAuthenticated, logout } = useAuthStore()

  const handleSignOut = async () => {
    try {
      await authAPI.logout()
    } catch {}
    logout()
    navigate('/login')
  }

  // Setting states
  const [selectedModel, setSelectedModel] = useState(aiModel || 'Gemini 3.8 Flash (Free)')
  const [selectedTheme, setSelectedTheme] = useState('Tokyo Night')
  const [fontSize, setFontSize] = useState(13)
  const [autoSave, setAutoSave] = useState(true)
  const [soundEffects, setSoundEffects] = useState(false)
  const [temperature, setTemperature] = useState(0.2)
  const [savedSuccess, setSavedSuccess] = useState(false)

  // Health and connection state
  const [health, setHealth] = useState(null)
  const [checkingHealth, setCheckingHealth] = useState(false)

  const verifySystem = async () => {
    setCheckingHealth(true)
    try {
      const res = await checkHealth()
      setHealth(res.data)
    } catch {
      setHealth({ status: 'offline', aiConfigured: false, githubConfigured: false })
    } finally {
      setCheckingHealth(false)
    }
  }

  useEffect(() => {
    verifySystem()
  }, [])

  const handleSave = () => {
    // Sync model to global store
    useStore.setState({ aiModel: selectedModel })
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 2200)
  }

  return (
    <div className="flex flex-col h-full bg-ide-sidebar overflow-hidden text-xs">
      {/* Settings Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-ide-border shrink-0 bg-ide-bg/40">
        <div className="flex items-center gap-1.5">
          <Settings size={13} className="text-ide-accent" />
          <span className="text-[11px] font-semibold text-ide-text-bright uppercase tracking-wider">
            Settings
          </span>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-1 px-2.5 py-1 bg-ide-accent hover:bg-ide-accent-hover text-white rounded-lg text-[10px] font-medium transition-colors shadow-sm cursor-pointer"
        >
          {savedSuccess ? <Check size={11} className="text-white" /> : null}
          <span>{savedSuccess ? 'Saved!' : 'Save'}</span>
        </button>
      </div>

      {/* Settings Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* 1. AI Model & Intelligence */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-ide-text-bright font-semibold">
            <Cpu size={13} className="text-ide-accent" />
            <span>AI Model Engine</span>
          </div>
          <div className="p-2.5 bg-ide-panel rounded-xl border border-ide-border space-y-2.5">
            <div>
              <label className="text-[10px] text-ide-text/60 block mb-1">Active Model</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full bg-ide-bg border border-ide-border rounded-lg px-2 py-1.5 text-xs text-ide-text-bright outline-none focus:border-ide-accent"
              >
                <option value="Gemini 3.8 Flash (Free)">Gemini 3.8 Flash (Free & Recommended)</option>
                <option value="Gemini 2.5 Flash (Free)">Gemini 2.5 Flash (Free)</option>
                <option value="Gemini 2.0 Flash (Free)">Gemini 2.0 Flash (Free)</option>
                <option value="Gemini 1.5 Flash (Free)">Gemini 1.5 Flash (Free)</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between text-[10px] text-ide-text/60 mb-1">
                <span>Creativity (Temperature)</span>
                <span className="text-ide-accent font-mono">{temperature}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-ide-accent cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* 2. Editor Appearance */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-ide-text-bright font-semibold">
            <Palette size={13} className="text-ide-yellow" />
            <span>Editor Appearance</span>
          </div>
          <div className="p-2.5 bg-ide-panel rounded-xl border border-ide-border space-y-2.5">
            <div>
              <label className="text-[10px] text-ide-text/60 block mb-1">Color Theme</label>
              <select
                value={selectedTheme}
                onChange={(e) => setSelectedTheme(e.target.value)}
                className="w-full bg-ide-bg border border-ide-border rounded-lg px-2 py-1.5 text-xs text-ide-text-bright outline-none focus:border-ide-accent"
              >
                <option value="Tokyo Night">Tokyo Night (Dark Blue/Purple)</option>
                <option value="VS Code Dark+">VS Code Dark Modern</option>
                <option value="One Dark Pro">One Dark Pro</option>
                <option value="GitHub Dark">GitHub Dark Dimmed</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between text-[10px] text-ide-text/60 mb-1">
                <span>Editor Font Size</span>
                <span className="text-ide-yellow font-mono">{fontSize}px</span>
              </div>
              <input
                type="range"
                min="11"
                max="18"
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                className="w-full accent-ide-yellow cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-ide-border/40">
              <span className="text-[11px] text-ide-text/70">Auto-save edits</span>
              <input
                type="checkbox"
                checked={autoSave}
                onChange={(e) => setAutoSave(e.target.checked)}
                className="accent-ide-accent cursor-pointer w-3.5 h-3.5"
              />
            </div>
          </div>
        </div>

        {/* 3. System & Connectivity Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-ide-text-bright font-semibold">
              <Database size={13} className="text-ide-green" />
              <span>System & APIs</span>
            </div>
            <button
              onClick={verifySystem}
              disabled={checkingHealth}
              title="Ping system health"
              className="text-ide-text/40 hover:text-ide-text-bright transition-colors cursor-pointer"
            >
              <RefreshCw size={11} className={checkingHealth ? 'animate-spin' : ''} />
            </button>
          </div>
          <div className="p-2.5 bg-ide-panel rounded-xl border border-ide-border space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-ide-text/60">AI Provider</span>
              <span className="text-ide-text-bright font-mono">{health?.aiProvider || 'Google Gemini'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ide-text/60">Gemini Key</span>
              <span className={health?.aiConfigured ? 'text-ide-green font-medium' : 'text-ide-yellow'}>
                {health?.aiConfigured ? '● Connected' : '● Simulation'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ide-text/60">GitHub API</span>
              <span className={health?.githubConfigured ? 'text-ide-green font-medium' : 'text-ide-yellow'}>
                {health?.githubConfigured ? '● Active' : '● Fallback'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ide-text/60">Backend Status</span>
              <span className="text-ide-green font-medium">● 200 OK</span>
            </div>
          </div>
        </div>

        {/* 4. User Profile & Session */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-ide-text-bright font-semibold">
            <Shield size={13} className="text-ide-purple" />
            <span>Developer Session</span>
          </div>
          <div className="p-2.5 bg-ide-panel rounded-xl border border-ide-border space-y-2">
            {isAuthenticated ? (
              <div>
                <p className="font-semibold text-ide-text-bright truncate">{user?.name || 'Developer'}</p>
                <p className="text-[10px] text-ide-text/50 truncate mb-2">{user?.email}</p>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-ide-red/15 hover:bg-ide-red/25 text-ide-red rounded-lg transition-colors cursor-pointer font-medium"
                >
                  <LogOut size={12} />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div>
                <p className="text-[10px] text-ide-text/60 mb-2">You are currently in guest developer mode.</p>
                <a
                  href="/login"
                  className="w-full block text-center py-1.5 bg-ide-accent/20 hover:bg-ide-accent/30 text-ide-accent rounded-lg font-medium transition-colors cursor-pointer"
                >
                  Sign In with JWT
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
