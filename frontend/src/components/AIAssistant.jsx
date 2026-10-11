import React, { useRef, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import useStore from '../store/useStore'
import { Send, Bot, User, Copy, Check, MoreVertical, Zap, RefreshCw, Trash2, ChevronDown } from 'lucide-react'
import { sendChatMessage, analyzeDiff } from '../services/api'

// Lazy socket connection (only when authenticated)
let socket = null

function getSocket(accessToken) {
  if (!socket && accessToken) {
    socket = io('http://localhost:5000', {
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
    })
  }
  return socket
}

// ── Code Block Component ─────────────────────────────
function CodeBlock({ code, language }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mt-2 rounded-lg overflow-hidden border border-ide-border">
      <div className="flex items-center justify-between px-3 py-1.5 bg-ide-bg/80 border-b border-ide-border">
        <span className="text-[10px] text-ide-text/50 font-mono uppercase">{language || 'code'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[10px] text-ide-text hover:text-ide-text-bright transition-colors cursor-pointer"
        >
          {copied ? <Check size={10} className="text-ide-green" /> : <Copy size={10} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="p-3 text-xs font-mono text-ide-text-bright bg-ide-bg overflow-x-auto leading-relaxed">
        {code}
      </pre>
    </div>
  )
}

// ── Message Component ─────────────────────────────────
function ChatMessage({ message, onApplyCode }) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex gap-2.5 slide-in ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs mt-0.5
        ${isUser ? 'bg-ide-accent/30' : 'bg-ide-purple/30'}`}>
        {isUser
          ? <User size={13} className="text-ide-accent" />
          : <Bot size={13} className="text-ide-purple" />
        }
      </div>

      <div className={`flex-1 max-w-[85%] flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`rounded-xl px-3 py-2.5 text-xs leading-relaxed
          ${isUser
            ? 'bg-ide-accent/20 border border-ide-accent/30 text-ide-text-bright rounded-tr-sm'
            : 'bg-ide-border/60 text-ide-text-bright rounded-tl-sm'
          }`}>
          {message.mcpToolUsed && (
            <div className="flex items-center gap-1 mb-1.5 px-2 py-0.5 bg-ide-accent/15 border border-ide-accent/30 rounded text-[9px] text-ide-accent w-fit font-mono">
              <span>⚡ MCP: {message.mcpToolUsed}</span>
            </div>
          )}
          {message.thought && (
            <div className="mb-2 p-2 bg-ide-bg/80 border-l-2 border-ide-purple rounded text-[11px] text-ide-text/70 italic leading-relaxed">
              <span className="font-semibold text-[10px] text-ide-purple not-italic uppercase tracking-wider block mb-0.5">🧠 Reasoning</span>
              {message.thought}
            </div>
          )}
          <p className="whitespace-pre-wrap">{message.content}</p>
          {message.code && (
            <CodeBlock code={message.code} language={message.codeLanguage} />
          )}
        </div>

        {/* Action Buttons */}
        {message.actions && message.actions.length > 0 && (
          <div className="flex gap-2 mt-1 flex-wrap">
            {message.actions.map((action) => (
              <button
                key={action}
                onClick={() => onApplyCode?.(action, message)}
                className="btn-primary text-xs px-3 py-1.5 rounded-lg"
              >
                {action}
              </button>
            ))}
          </div>
        )}

        <span className="text-[10px] text-ide-text/30 px-1">
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  )
}

// ── Typing Indicator ──────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex gap-2.5 slide-in">
      <div className="w-7 h-7 rounded-full bg-ide-purple/30 flex items-center justify-center shrink-0">
        <Bot size={13} className="text-ide-purple" />
      </div>
      <div className="bg-ide-border/60 rounded-xl rounded-tl-sm px-4 py-3">
        <div className="flex gap-1 items-center">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-ide-text/60 animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Model Selector (Google Gemini Free Tier) ──────────
const MODELS = [
  'Gemini 3.8 Flash (Free)',
  'Gemini 2.5 Flash (Free)',
  'Gemini 2.0 Flash (Free)',
  'Gemini 1.5 Flash (Free)',
]

function ModelSelector({ model, onChange }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-[10px] text-ide-text/50 hover:text-ide-text-bright transition-colors cursor-pointer"
        title="Google Gemini Free Tier Model"
      >
        <Zap size={9} className="text-ide-yellow" />
        {model}
        <ChevronDown size={9} />
      </button>
      {open && (
        <div className="absolute bottom-full right-0 mb-1 w-44 bg-ide-panel border border-ide-border rounded-lg shadow-xl z-50 py-1 slide-in">
          <div className="px-3 py-1 text-[9px] uppercase tracking-wider text-ide-text/40 border-b border-ide-border mb-1">
            Free Models
          </div>
          {MODELS.map((m) => (
            <button key={m} onClick={() => { onChange(m); setOpen(false) }}
              className={`w-full text-left px-3 py-1.5 text-xs transition-colors cursor-pointer ${
                model === m ? 'text-ide-accent bg-ide-accent/10 font-medium' : 'text-ide-text hover:bg-ide-border/60 hover:text-ide-text-bright'
              }`}>
              {m}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main Component ────────────────────────────────────
export default function AIAssistant() {
  const {
    chatMessages, chatInput, setChatInput,
    isAiTyping, addChatMessage, setAiTyping,
    aiModel, mcpConnected, currentPR,
  } = useStore()

  const [localModel, setLocalModel] = useState(aiModel)
  const messagesEndRef = useRef(null)

  // Get auth token
  const getToken = () => {
    try {
      const stored = JSON.parse(localStorage.getItem('auth-storage') || '{}')
      return stored?.state?.accessToken
    } catch { return null }
  }

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, isAiTyping])

  const handleSend = async () => {
    const message = chatInput.trim()
    if (!message || isAiTyping) return

    setChatInput('')
    addChatMessage({ role: 'user', content: message })
    setAiTyping(true)

    try {
      const history = chatMessages.slice(-10).map((m) => ({ role: m.role, content: m.content }))
      const res = await sendChatMessage(message, history, localModel)
      addChatMessage({
        role: 'assistant',
        content: res.data.content || res.data,
        thought: res.data.thought,
        mcpToolUsed: res.data.mcpToolUsed,
        code: res.data.code,
        codeLanguage: res.data.codeLanguage,
        actions: res.data.actions,
      })
    } catch (err) {
      const errMsg = err.response?.status === 401
        ? 'Please sign in to use the AI assistant.'
        : err.response?.data?.error || 'Could not reach AI service. Check backend connection.'
      addChatMessage({ role: 'assistant', content: errMsg })
    } finally {
      setAiTyping(false)
    }
  }

  const handleAnalyzeDiff = async () => {
    setAiTyping(true)
    addChatMessage({ role: 'user', content: 'Analyze the current PR diff for issues and improvements.' })
    try {
      const diff = `${currentPR.diffOld}\n---\n${currentPR.diffNew}`
      const res = await analyzeDiff(diff, localModel)
      addChatMessage({
        role: 'assistant',
        content: res.data.content || res.data,
        code: res.data.code,
        codeLanguage: res.data.codeLanguage,
        actions: res.data.actions,
      })
    } catch (err) {
      addChatMessage({ role: 'assistant', content: 'Failed to analyze diff: ' + (err.response?.data?.error || err.message) })
    } finally {
      setAiTyping(false)
    }
  }

  const handleApplyCode = (action, message) => {
    if (action === 'Apply Code' && message.code) {
      navigator.clipboard.writeText(message.code)
      // Open or switch to AppService editor tab
      useStore.getState().setActiveEditorTab('AppService')
      addChatMessage({
        role: 'assistant',
        content: '✅ Code copied to clipboard and switched to `AppService.java`! You can paste the refactored method directly into your code.',
      })
    } else if (action === 'Create PR') {
      addChatMessage({ role: 'user', content: 'Create a PR with these changes.' })
      // Switch to PR Diff tab and notify
      useStore.getState().setActiveEditorTab('pr-452')
      addChatMessage({
        role: 'assistant',
        content: '🚀 Pull Request `#452` ("Fix data fetch issues and improve error handling") is ready! Switched to GitHub Diff view to inspect side-by-side changes before merging.',
      })
    }
  }

  const clearChat = () => {
    useStore.getState().chatMessages.length > 0 &&
      window.confirm('Clear all messages?') &&
      useStore.setState({ chatMessages: [] })
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full bg-ide-panel border-l border-ide-border" style={{ width: '290px', minWidth: '290px' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-ide-border shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-ide-accent to-ide-purple flex items-center justify-center">
            <Bot size={13} className="text-white" />
          </div>
          <span className="text-sm font-semibold text-ide-text-bright">AI Assistant</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            title="Analyze current PR diff"
            onClick={handleAnalyzeDiff}
            disabled={isAiTyping}
            className="p-1.5 rounded-lg hover:bg-ide-border text-ide-text hover:text-ide-text-bright transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={13} />
          </button>
          <button
            title="Clear chat"
            onClick={clearChat}
            className="p-1.5 rounded-lg hover:bg-ide-border text-ide-text hover:text-ide-text-bright transition-colors cursor-pointer"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {chatMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-8">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-ide-accent to-ide-purple flex items-center justify-center shadow-lg shadow-ide-accent/20">
              <Bot size={22} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-ide-text-bright mb-1">AI Developer Assistant</p>
              <p className="text-xs text-ide-text/50 max-w-[180px]">
                Ask me to refactor code, review PRs, fix bugs, or write tests
              </p>
            </div>
            <button
              onClick={handleAnalyzeDiff}
              className="text-xs text-ide-accent hover:underline cursor-pointer"
            >
              Analyze current PR diff →
            </button>
          </div>
        )}

        {chatMessages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} onApplyCode={handleApplyCode} />
        ))}

        {isAiTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-ide-border shrink-0">
        <div className="flex items-end gap-2 bg-ide-bg rounded-xl border border-ide-border focus-within:border-ide-accent/50 transition-colors px-3 py-2">
          <textarea
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your code... (Enter to send)"
            rows={1}
            className="flex-1 bg-transparent text-xs text-ide-text-bright placeholder-ide-text/40 resize-none outline-none leading-relaxed"
            style={{ maxHeight: '80px' }}
          />
          <button
            onClick={handleSend}
            disabled={!chatInput.trim() || isAiTyping}
            className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer
              ${chatInput.trim() && !isAiTyping
                ? 'bg-ide-accent hover:bg-ide-accent-hover text-white'
                : 'bg-ide-border text-ide-text/40 cursor-not-allowed'
              }`}
          >
            <Send size={13} />
          </button>
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full pulse-dot ${mcpConnected ? 'bg-ide-green' : 'bg-ide-red'}`} />
            <span className="text-[10px] text-ide-text/40">
              {mcpConnected ? 'MCP: GitHub Connected' : 'MCP: Disconnected'}
            </span>
          </div>
          <ModelSelector model={localModel} onChange={setLocalModel} />
        </div>
      </div>
    </div>
  )
}
