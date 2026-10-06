import React from 'react'
import ActivityBar from '../components/ActivityBar'
import Sidebar from '../components/Sidebar'
import TabBar from '../components/TabBar'
import DiffViewer from '../components/DiffViewer'
import AIAssistant from '../components/AIAssistant'
import useStore from '../store/useStore'
import { Globe, RefreshCw } from 'lucide-react'

function EditorArea() {
  const { activeEditorTab } = useStore()

  if (activeEditorTab === 'terminal') {
    return (
      <div className="flex-1 bg-ide-bg p-4 font-mono text-xs text-ide-green overflow-auto">
        <p className="text-ide-text/60 mb-2">─── Terminal ───────────────────────────</p>
        <p><span className="text-ide-accent">user@dev</span>:<span className="text-ide-blue">~/core-service</span>$ git status</p>
        <p className="mt-1 text-ide-text">On branch feature/fix-data-fetch</p>
        <p className="text-ide-text">Changes not staged for commit:</p>
        <p className="text-ide-red">  modified:   src/main/java/com/company/service/AppService.java</p>
        <p className="mt-1"><span className="text-ide-accent">user@dev</span>:<span className="text-ide-blue">~/core-service</span>$ <span className="animate-pulse">█</span></p>
      </div>
    )
  }

  // Default: show PR diff
  return <DiffViewer />
}

export default function IDELayout() {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-ide-bg">
      {/* Top Title Bar */}
      <div className="flex items-center justify-between px-4 h-9 bg-ide-sidebar border-b border-ide-border shrink-0">
        <div className="flex items-center gap-2">
          {/* Traffic lights (decorative) */}
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
            <div className="w-3 h-3 rounded-full bg-[#28c840]" />
          </div>
          <button className="text-ide-text hover:text-ide-text-bright transition-colors ml-3 cursor-pointer">◁</button>
          <button className="text-ide-text hover:text-ide-text-bright transition-colors cursor-pointer">▷</button>
        </div>

        {/* URL bar */}
        <div className="flex items-center gap-2 bg-ide-bg border border-ide-border rounded-md px-3 py-1 flex-1 mx-6 max-w-sm">
          <Globe size={11} className="text-ide-text/50 shrink-0" />
          <span className="text-xs text-ide-text/70 truncate">developer UI.com</span>
          <RefreshCw size={11} className="text-ide-text/50 ml-auto shrink-0 cursor-pointer hover:text-ide-text-bright" />
        </div>

        <div className="flex items-center gap-2 text-ide-text/50">
          <span className="text-sm">⊕</span>
          <span className="text-sm">⊘</span>
          <span className="text-sm">⊡</span>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Activity Bar */}
        <ActivityBar />

        {/* Sidebar File Tree */}
        <Sidebar />

        {/* Editor + Tabs */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <TabBar />
          <div className="flex-1 overflow-hidden">
            <EditorArea />
          </div>
        </div>

        {/* AI Assistant Panel */}
        <AIAssistant />
      </div>
    </div>
  )
}
