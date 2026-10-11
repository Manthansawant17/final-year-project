import React from 'react'
import ActivityBar from '../components/ActivityBar'
import Sidebar from '../components/Sidebar'
import TabBar from '../components/TabBar'
import DiffViewer from '../components/DiffViewer'
import AIAssistant from '../components/AIAssistant'
import useStore from '../store/useStore'
import { Globe, RefreshCw } from 'lucide-react'

import CodeEditor from '../components/CodeEditor'

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

  if (activeEditorTab === 'pr-452') {
    return <DiffViewer />
  }

  // Render file editor for selected file tabs
  return <CodeEditor tabId={activeEditorTab} />
}

export default function IDELayout() {
  const { setActiveEditorTab, openTabs } = useStore()
  const [fullscreen, setFullscreen] = React.useState(false)

  const handleRefresh = () => {
    window.location.reload()
  }

  const handleBack = () => {
    const idx = openTabs.findIndex((t) => t.id === useStore.getState().activeEditorTab)
    if (idx > 0) setActiveEditorTab(openTabs[idx - 1].id)
  }

  const handleForward = () => {
    const idx = openTabs.findIndex((t) => t.id === useStore.getState().activeEditorTab)
    if (idx < openTabs.length - 1 && idx >= 0) setActiveEditorTab(openTabs[idx + 1].id)
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.()
      setFullscreen(true)
    } else {
      document.exitFullscreen?.()
      setFullscreen(false)
    }
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-ide-bg">
      {/* Top Title Bar */}
      <div className="flex items-center justify-between px-4 h-9 bg-ide-sidebar border-b border-ide-border shrink-0 select-none">
        <div className="flex items-center gap-2">
          {/* Traffic lights with functionality */}
          <div className="flex gap-1.5 items-center">
            <button
              onClick={() => window.close()}
              title="Close workspace"
              className="w-3 h-3 rounded-full bg-[#ff5f57] hover:brightness-110 cursor-pointer"
            />
            <button
              onClick={() => setActiveEditorTab('terminal')}
              title="Minimize to Terminal"
              className="w-3 h-3 rounded-full bg-[#ffbd2e] hover:brightness-110 cursor-pointer"
            />
            <button
              onClick={toggleFullscreen}
              title="Toggle Fullscreen"
              className="w-3 h-3 rounded-full bg-[#28c840] hover:brightness-110 cursor-pointer"
            />
          </div>
          <button
            onClick={handleBack}
            title="Previous Tab"
            className="text-ide-text hover:text-ide-text-bright transition-colors ml-3 cursor-pointer text-xs"
          >
            ◁
          </button>
          <button
            onClick={handleForward}
            title="Next Tab"
            className="text-ide-text hover:text-ide-text-bright transition-colors cursor-pointer text-xs"
          >
            ▷
          </button>
        </div>

        {/* URL / Workspace bar */}
        <div className="flex items-center gap-2 bg-ide-bg border border-ide-border rounded-md px-3 py-1 flex-1 mx-6 max-w-sm">
          <Globe size={11} className="text-ide-text/50 shrink-0" />
          <span className="text-xs text-ide-text/70 truncate">developer-studio://core-service/pr-452</span>
          <button
            onClick={handleRefresh}
            title="Reload IDE"
            className="ml-auto text-ide-text/50 hover:text-ide-text-bright cursor-pointer"
          >
            <RefreshCw size={11} className="shrink-0" />
          </button>
        </div>

        <div className="flex items-center gap-3 text-ide-text/50">
          <button
            onClick={() => setActiveEditorTab('pr-452')}
            title="Open PR Diff"
            className="text-xs hover:text-ide-text-bright cursor-pointer"
          >
            ⊕ Diff
          </button>
          <button
            onClick={() => setActiveEditorTab('terminal')}
            title="Open Terminal"
            className="text-xs hover:text-ide-text-bright cursor-pointer"
          >
            ⊘ Terminal
          </button>
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
