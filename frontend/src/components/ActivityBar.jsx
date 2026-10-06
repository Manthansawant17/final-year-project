import React from 'react'
import useStore from '../store/useStore'
import {
  GitBranch, CheckSquare, Settings, BookOpen, User, ChevronDown
} from 'lucide-react'

const navItems = [
  { id: 'repositories', icon: GitBranch, label: 'Repositories' },
  { id: 'tasks', icon: CheckSquare, label: 'Tasks' },
  { id: 'docs', icon: BookOpen, label: 'Documentation' },
  { id: 'settings', icon: Settings, label: 'Settings' },
]

export default function ActivityBar() {
  const { sidebarSection, setSidebarSection } = useStore()

  return (
    <div className="w-14 flex flex-col items-center bg-ide-sidebar border-r border-ide-border py-2 gap-1 shrink-0">
      {/* User Avatar */}
      <div className="mb-3 w-8 h-8 rounded-full bg-ide-accent/30 flex items-center justify-center cursor-pointer hover:bg-ide-accent/50 transition-colors">
        <User size={16} className="text-ide-accent" />
      </div>

      <div className="w-8 border-b border-ide-border mb-2" />

      {navItems.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          title={label}
          onClick={() => setSidebarSection(id)}
          className={`
            w-10 h-10 flex items-center justify-center rounded-lg transition-all cursor-pointer
            ${sidebarSection === id
              ? 'bg-ide-accent/20 text-ide-accent'
              : 'text-ide-text hover:bg-ide-border hover:text-ide-text-bright'
            }
          `}
        >
          <Icon size={18} />
        </button>
      ))}

      {/* Bottom settings */}
      <div className="mt-auto">
        <button
          title="Settings"
          className="w-10 h-10 flex items-center justify-center rounded-lg text-ide-text hover:bg-ide-border hover:text-ide-text-bright transition-all cursor-pointer"
        >
          <Settings size={18} />
        </button>
      </div>
    </div>
  )
}
