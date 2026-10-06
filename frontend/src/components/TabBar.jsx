import React from 'react'
import useStore from '../store/useStore'
import { X, GitPullRequest, FileCode, Terminal as TerminalIcon } from 'lucide-react'

function TabIcon({ tab }) {
  if (tab.id === 'terminal') return <TerminalIcon size={13} className="text-ide-green" />
  if (tab.id.startsWith('pr-')) return <GitPullRequest size={13} className="text-ide-blue" />
  return <FileCode size={13} className="text-ide-text" />
}

export default function TabBar() {
  const { openTabs, activeEditorTab, setActiveEditorTab, closeTab } = useStore()

  return (
    <div className="flex items-stretch bg-ide-sidebar border-b border-ide-border overflow-x-auto shrink-0" style={{ height: '35px' }}>
      {openTabs.map((tab) => {
        const isActive = tab.id === activeEditorTab
        return (
          <div
            key={tab.id}
            onClick={() => setActiveEditorTab(tab.id)}
            className={`
              flex items-center gap-2 px-4 text-xs cursor-pointer whitespace-nowrap border-r border-ide-border shrink-0 transition-all group relative
              ${isActive
                ? 'bg-ide-panel text-ide-text-bright'
                : 'text-ide-text hover:bg-ide-panel/50 hover:text-ide-text-bright'
              }
            `}
          >
            {/* Active tab top border indicator */}
            {isActive && (
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-ide-accent" />
            )}
            <TabIcon tab={tab} />
            <span>{tab.name}</span>
            {tab.closable && (
              <button
                onClick={(e) => { e.stopPropagation(); closeTab(tab.id) }}
                className="opacity-0 group-hover:opacity-100 hover:text-white transition-all rounded p-0.5 hover:bg-ide-border cursor-pointer"
              >
                <X size={10} />
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
