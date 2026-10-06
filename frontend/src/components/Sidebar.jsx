import React, { useState, useEffect } from 'react'
import useStore from '../store/useStore'
import {
  ChevronDown, ChevronRight, Folder, FolderOpen,
  FileCode, Settings, Plus, List, RefreshCw, Loader2, GitBranch
} from 'lucide-react'
import { githubAPI } from '../services/api'

// ── File Icon ─────────────────────────────────────────
function FileIcon({ name }) {
  const ext = name.split('.').pop()
  const iconMap = {
    java: <span className="text-[11px] font-bold text-ide-red">☕</span>,
    js: <span className="text-[11px] font-bold text-ide-yellow">JS</span>,
    jsx: <span className="text-[11px] font-bold text-ide-yellow">JSX</span>,
    ts: <span className="text-[11px] font-bold text-ide-blue">TS</span>,
    tsx: <span className="text-[11px] font-bold text-ide-blue">TSX</span>,
    py: <span className="text-[11px] font-bold text-ide-blue">PY</span>,
    json: <span className="text-[11px] text-ide-yellow">{'{}'}</span>,
    md: <span className="text-[11px] text-ide-text">MD</span>,
  }
  return iconMap[ext] || <FileCode size={13} className="text-ide-text" />
}

// ── Tree Node ─────────────────────────────────────────
function TreeNode({ node, depth = 0 }) {
  const { toggleFolder, setSelectedFile, selectedFile } = useStore()
  const isFolder = node.type === 'folder' || (node.children !== undefined)
  const isFile = node.type === 'file'
  const isSelected = selectedFile?.id === node.id

  const handleClick = () => {
    if (isFolder) toggleFolder(node.id)
    if (isFile) setSelectedFile(node)
  }

  return (
    <div>
      <div
        onClick={handleClick}
        style={{ paddingLeft: `${8 + depth * 12}px` }}
        className={`
          flex items-center gap-1.5 py-[3px] pr-2 cursor-pointer text-xs transition-colors group
          ${isSelected ? 'bg-ide-accent/20 text-ide-accent' : 'text-ide-text hover:bg-ide-border/60 hover:text-ide-text-bright'}
        `}
      >
        {isFolder ? (
          <>
            <span className="text-ide-text/60 shrink-0">
              {node.expanded
                ? <ChevronDown size={12} />
                : <ChevronRight size={12} />
              }
            </span>
            {node.type === 'settings'
              ? <Settings size={13} className="text-ide-yellow shrink-0" />
              : node.expanded
                ? <FolderOpen size={13} className="text-ide-yellow shrink-0" />
                : <Folder size={13} className="text-ide-yellow/80 shrink-0" />
            }
          </>
        ) : (
          <>
            <span className="w-3 shrink-0" />
            <span className="shrink-0"><FileIcon name={node.name} /></span>
          </>
        )}
        <span className="truncate leading-none">{node.name}</span>
      </div>

      {isFolder && node.expanded && node.children?.map((child) => (
        <TreeNode key={child.id} node={child} depth={depth + 1} />
      ))}
    </div>
  )
}

// ── PR List Panel ─────────────────────────────────────
function PRList({ repo, onClose }) {
  const [prs, setPrs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { setActiveEditorTab } = useStore()

  useEffect(() => {
    githubAPI.getPullRequests(repo)
      .then((res) => setPrs(res.data))
      .catch((e) => setError(e.response?.data?.error || 'Failed to load PRs'))
      .finally(() => setLoading(false))
  }, [repo])

  return (
    <div className="border-t border-ide-border">
      <div className="flex items-center justify-between px-3 py-1.5 bg-ide-bg/50">
        <span className="text-[10px] font-semibold text-ide-text uppercase tracking-wider">
          PRs — {repo}
        </span>
        <button onClick={onClose} className="text-[10px] text-ide-text hover:text-ide-text-bright cursor-pointer">✕</button>
      </div>
      {loading && <div className="flex justify-center py-3"><Loader2 size={14} className="animate-spin text-ide-accent" /></div>}
      {error && <p className="text-[10px] text-ide-red px-3 py-2">{error}</p>}
      {prs.map((pr) => (
        <div key={pr.number}
          onClick={() => setActiveEditorTab('pr-452')}
          className="px-3 py-2 border-b border-ide-border/50 cursor-pointer hover:bg-ide-border/40 transition-colors">
          <div className="flex items-center gap-1.5 mb-0.5">
            <GitBranch size={10} className="text-ide-purple shrink-0" />
            <span className="text-[10px] text-ide-blue font-mono">#{pr.number}</span>
            <span className={`text-[9px] px-1.5 py-px rounded-full font-medium ${
              pr.state === 'open' ? 'bg-ide-green/20 text-ide-green' : 'bg-ide-red/20 text-ide-red'
            }`}>{pr.state}</span>
          </div>
          <p className="text-[10px] text-ide-text-bright truncate">{pr.title}</p>
          <p className="text-[9px] text-ide-text/40 mt-0.5">by {pr.user}</p>
        </div>
      ))}
      {!loading && prs.length === 0 && !error && (
        <p className="text-[10px] text-ide-text/40 px-3 py-2">No open PRs</p>
      )}
    </div>
  )
}

// ── Main Sidebar ──────────────────────────────────────
export default function Sidebar() {
  const { repositories, sidebarSection } = useStore()
  const [remoteRepos, setRemoteRepos] = useState([])
  const [loadingRepos, setLoadingRepos] = useState(false)
  const [repoError, setRepoError] = useState('')
  const [selectedPRRepo, setSelectedPRRepo] = useState(null)

  const fetchRepos = async () => {
    setLoadingRepos(true)
    setRepoError('')
    try {
      const res = await githubAPI.getRepositories()
      setRemoteRepos(res.data)
    } catch (e) {
      // Not configured — just show local repos
      setRepoError(e.response?.data?.error || '')
    } finally {
      setLoadingRepos(false)
    }
  }

  // Try to load repos on mount
  useEffect(() => { fetchRepos() }, [])

  return (
    <div className="w-56 flex flex-col bg-ide-sidebar border-r border-ide-border shrink-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-ide-border shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold text-ide-text-bright uppercase tracking-wider">
            {sidebarSection === 'repositories' ? 'Repositories' : sidebarSection}
          </span>
          <ChevronDown size={11} className="text-ide-text/50" />
        </div>
        <div className="flex items-center gap-1">
          <button
            title="Refresh repos"
            onClick={fetchRepos}
            disabled={loadingRepos}
            className="p-1 rounded hover:bg-ide-border text-ide-text hover:text-ide-text-bright transition-colors cursor-pointer disabled:opacity-50"
          >
            {loadingRepos ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
          </button>
          <button className="p-1 rounded hover:bg-ide-border text-ide-text hover:text-ide-text-bright transition-colors cursor-pointer">
            <Plus size={12} />
          </button>
        </div>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto">
        {/* Local repos (from store) */}
        {repositories.map((repo) => (
          <div key={repo.id}>
            <div
              onClick={() => setSelectedPRRepo(selectedPRRepo === repo.name ? null : repo.name)}
              className="flex items-center gap-1.5 px-2 py-1.5 cursor-pointer text-xs text-ide-text-bright font-medium hover:bg-ide-border/60 transition-colors group"
            >
              <ChevronDown size={12} className="text-ide-text/50" />
              <Folder size={13} className="text-ide-yellow" />
              <span className="flex-1">{repo.name}</span>
            </div>
            {repo.expanded !== false && repo.children?.map((child) => (
              <TreeNode key={child.id} node={child} depth={1} />
            ))}
          </div>
        ))}

        {/* Remote GitHub repos */}
        {remoteRepos.length > 0 && (
          <div className="border-t border-ide-border mt-1">
            <div className="px-3 py-1.5">
              <span className="text-[10px] text-ide-text/40 uppercase tracking-wider font-semibold">
                GitHub Repos
              </span>
            </div>
            {remoteRepos.slice(0, 8).map((repo) => (
              <div
                key={repo.id}
                onClick={() => setSelectedPRRepo(selectedPRRepo === repo.name ? null : repo.name)}
                className={`flex items-center gap-1.5 px-3 py-1.5 cursor-pointer text-xs transition-colors
                  ${selectedPRRepo === repo.name
                    ? 'bg-ide-accent/15 text-ide-accent'
                    : 'text-ide-text hover:bg-ide-border/60 hover:text-ide-text-bright'
                  }`}
              >
                <GitBranch size={12} className="shrink-0" />
                <span className="truncate flex-1">{repo.name}</span>
                {repo.language && (
                  <span className="text-[9px] text-ide-text/40 shrink-0">{repo.language}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* PR List for selected repo */}
        {selectedPRRepo && (
          <PRList
            repo={selectedPRRepo}
            onClose={() => setSelectedPRRepo(null)}
          />
        )}
      </div>
    </div>
  )
}
