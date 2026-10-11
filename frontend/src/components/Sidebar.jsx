import React, { useState, useEffect } from 'react'
import useStore from '../store/useStore'
import {
  ChevronDown, ChevronRight, Folder, FolderOpen, FolderClosed,
  FileCode, Settings, Plus, RefreshCw, Loader2, GitBranch,
  GitCommit, AlertCircle, Check, Minimize2, ExternalLink
} from 'lucide-react'
import { githubAPI } from '../services/api'

// ── File Icon ─────────────────────────────────────────
function FileIcon({ name }) {
  const ext = name.split('.').pop()
  const iconMap = {
    java: <span className="text-[12px] font-bold text-amber-400 select-none leading-none">☕</span>,
    js: <span className="text-[10px] font-bold text-ide-yellow select-none">JS</span>,
    jsx: <span className="text-[10px] font-bold text-ide-yellow select-none">JSX</span>,
    ts: <span className="text-[10px] font-bold text-ide-blue select-none">TS</span>,
    tsx: <span className="text-[10px] font-bold text-ide-blue select-none">TSX</span>,
    py: <span className="text-[10px] font-bold text-ide-blue select-none">PY</span>,
    json: <span className="text-[10px] text-ide-yellow select-none">{'{}'}</span>,
    yml: <span className="text-[10px] text-ide-purple select-none">⚙</span>,
    yaml: <span className="text-[10px] text-ide-purple select-none">⚙</span>,
    xml: <span className="text-[10px] text-ide-red select-none">XML</span>,
    md: <span className="text-[10px] text-ide-text select-none">MD</span>,
  }
  return iconMap[ext] || <FileCode size={13} className="text-ide-text" />
}

// ── Tree Node ─────────────────────────────────────────
function TreeNode({ node, depth = 0 }) {
  const { toggleFolder, setSelectedFile, selectedFile, openTabs, setActiveEditorTab } = useStore()
  const isFolder = node.type === 'folder' || (node.children !== undefined)
  const isFile = node.type === 'file'
  const isSelected = selectedFile?.id === node.id

  const handleClick = () => {
    if (isFolder) toggleFolder(node.id)
    if (isFile) {
      setSelectedFile(node)
      // Open or switch to editor tab
      const tabId = node.name.replace(/\.[^/.]+$/, '')
      const exists = openTabs.some((t) => t.id === tabId)
      if (!exists) {
        useStore.setState({
          openTabs: [...openTabs, { id: tabId, name: node.name, icon: '📄', closable: true }],
        })
      }
      setActiveEditorTab(tabId)
    }
  }

  return (
    <div>
      <div
        onClick={handleClick}
        title={node.name}
        style={{ paddingLeft: `${6 + depth * 8}px` }}
        className={`
          flex items-center gap-1.5 py-[3px] pr-2 cursor-pointer text-xs transition-colors group select-none
          ${isSelected ? 'bg-ide-accent/20 text-ide-accent font-medium' : 'text-ide-text hover:bg-ide-border/60 hover:text-ide-text-bright'}
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
            {node.expanded
              ? <FolderOpen size={13} className="text-amber-400 shrink-0" />
              : <Folder size={13} className="text-amber-400/80 shrink-0" />
            }
          </>
        ) : (
          <>
            <span className="w-3 shrink-0" />
            <span className="shrink-0 flex items-center justify-center"><FileIcon name={node.name} /></span>
          </>
        )}
        <span className="truncate leading-none" title={node.name}>{node.name}</span>
      </div>

      {isFolder && node.expanded && node.children?.map((child) => (
        <TreeNode key={child.id} node={child} depth={depth + 1} />
      ))}
    </div>
  )
}

// ── Repo Details Drawer (PRs, Commits, Issues) ────────
function RepoDetailsPanel({ repo, onClose }) {
  const [tab, setTab] = useState('prs') // 'prs' | 'commits' | 'issues'
  const [prs, setPrs] = useState([])
  const [commits, setCommits] = useState([])
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { setActiveEditorTab } = useStore()

  useEffect(() => {
    setLoading(true)
    setError('')
    Promise.allSettled([
      githubAPI.getPullRequests(repo),
      githubAPI.getCommits(repo),
      githubAPI.getIssues(repo),
    ])
      .then(([prRes, commitRes, issueRes]) => {
        if (prRes.status === 'fulfilled') setPrs(prRes.value.data || [])
        if (commitRes.status === 'fulfilled') setCommits(commitRes.value.data || [])
        if (issueRes.status === 'fulfilled') setIssues(issueRes.value.data || [])
      })
      .catch((e) => setError(e.response?.data?.error || 'Failed to load repository info'))
      .finally(() => setLoading(false))
  }, [repo])

  return (
    <div className="border-t border-ide-border bg-ide-panel/40">
      {/* Header with Tabs */}
      <div className="flex items-center justify-between px-2.5 py-1.5 bg-ide-bg/80 border-b border-ide-border/60">
        <div className="flex items-center gap-2 overflow-x-auto text-[10px] font-semibold">
          <button
            onClick={() => setTab('prs')}
            className={`pb-0.5 border-b-2 transition-colors cursor-pointer ${
              tab === 'prs' ? 'border-ide-accent text-ide-accent' : 'border-transparent text-ide-text/60 hover:text-ide-text'
            }`}
          >
            PRs ({prs.length})
          </button>
          <button
            onClick={() => setTab('commits')}
            className={`pb-0.5 border-b-2 transition-colors cursor-pointer ${
              tab === 'commits' ? 'border-ide-accent text-ide-accent' : 'border-transparent text-ide-text/60 hover:text-ide-text'
            }`}
          >
            Commits ({commits.length})
          </button>
          <button
            onClick={() => setTab('issues')}
            className={`pb-0.5 border-b-2 transition-colors cursor-pointer ${
              tab === 'issues' ? 'border-ide-accent text-ide-accent' : 'border-transparent text-ide-text/60 hover:text-ide-text'
            }`}
          >
            Issues ({issues.length})
          </button>
        </div>
        <button onClick={onClose} className="text-[11px] text-ide-text/60 hover:text-ide-text cursor-pointer p-0.5">✕</button>
      </div>

      {loading && <div className="flex justify-center py-4"><Loader2 size={14} className="animate-spin text-ide-accent" /></div>}
      {error && <p className="text-[10px] text-ide-red px-3 py-2">{error}</p>}

      {!loading && (
        <div className="max-h-48 overflow-y-auto divide-y divide-ide-border/40 text-[11px]">
          {/* PRs */}
          {tab === 'prs' && (
            prs.length === 0 ? (
              <p className="text-[10px] text-ide-text/40 px-3 py-2">No pull requests found.</p>
            ) : (
              prs.map((pr) => (
                <div
                  key={pr.number}
                  onClick={() => setActiveEditorTab('pr-452')}
                  className="px-3 py-2 hover:bg-ide-border/40 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <GitBranch size={11} className="text-ide-purple shrink-0" />
                    <span className="text-[10px] text-ide-blue font-mono">#{pr.number}</span>
                    <span className={`text-[9px] px-1.5 py-px rounded-full font-medium ${
                      pr.state === 'open' ? 'bg-ide-green/20 text-ide-green' : 'bg-ide-red/20 text-ide-red'
                    }`}>{pr.state}</span>
                  </div>
                  <p className="text-[10px] text-ide-text-bright truncate">{pr.title}</p>
                </div>
              ))
            )
          )}

          {/* Commits */}
          {tab === 'commits' && (
            commits.length === 0 ? (
              <p className="text-[10px] text-ide-text/40 px-3 py-2">No commit history found.</p>
            ) : (
              commits.slice(0, 8).map((c) => (
                <div key={c.sha || c.fullSha} className="px-3 py-1.5 hover:bg-ide-border/40 transition-colors">
                  <div className="flex items-center gap-1.5">
                    <GitCommit size={11} className="text-ide-yellow shrink-0" />
                    <span className="text-[9px] font-mono text-ide-accent">{c.sha}</span>
                    <span className="text-[9px] text-ide-text/40 ml-auto truncate">{c.author}</span>
                  </div>
                  <p className="text-[10px] text-ide-text-bright truncate mt-0.5">{c.message}</p>
                </div>
              ))
            )
          )}

          {/* Issues */}
          {tab === 'issues' && (
            issues.length === 0 ? (
              <p className="text-[10px] text-ide-text/40 px-3 py-2">No open issues found.</p>
            ) : (
              issues.map((i) => (
                <div key={i.id || i.number} className="px-3 py-1.5 hover:bg-ide-border/40 transition-colors">
                  <div className="flex items-center gap-1.5">
                    <AlertCircle size={11} className="text-ide-red shrink-0" />
                    <span className="text-[9px] font-mono text-ide-blue">#{i.number}</span>
                    <span className="text-[9px] px-1.5 py-px rounded-full bg-ide-green/10 text-ide-green">{i.state}</span>
                  </div>
                  <p className="text-[10px] text-ide-text-bright truncate mt-0.5">{i.title}</p>
                </div>
              ))
            )
          )}
        </div>
      )}
    </div>
  )
}

// ── Main Sidebar ──────────────────────────────────────
import TaskPanel from './TaskPanel'
import DocPanel from './DocPanel'
import SettingsPanel from './SettingsPanel'

export default function Sidebar() {
  const {
    repositories,
    sidebarSection,
    activeRepoName,
    setActiveRepoName,
    collapseAll,
    expandAll,
  } = useStore()
  const [remoteRepos, setRemoteRepos] = useState([])
  const [loadingRepos, setLoadingRepos] = useState(false)
  const [repoError, setRepoError] = useState('')
  const [selectedPRRepo, setSelectedPRRepo] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showRepoMenu, setShowRepoMenu] = useState(false)
  const [newFileName, setNewFileName] = useState('')

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

  // If Tasks section is active
  if (sidebarSection === 'tasks') {
    return (
      <div className="w-64 flex flex-col bg-ide-sidebar border-r border-ide-border shrink-0 overflow-hidden">
        <TaskPanel />
      </div>
    )
  }

  // If Documentation section is active
  if (sidebarSection === 'docs') {
    return (
      <div className="w-64 flex flex-col bg-ide-sidebar border-r border-ide-border shrink-0 overflow-hidden">
        <DocPanel />
      </div>
    )
  }

  // Settings section
  if (sidebarSection === 'settings') {
    return (
      <div className="w-64 flex flex-col bg-ide-sidebar border-r border-ide-border shrink-0 overflow-hidden">
        <SettingsPanel />
      </div>
    )
  }

  const handleAddFile = (e) => {
    e.preventDefault()
    if (!newFileName.trim()) return
    const fileNode = {
      id: Date.now(),
      name: newFileName.trim(),
      type: 'file',
      lang: newFileName.endsWith('.java') ? 'java' : 'js',
    }
    // Add file to core-service
    const updated = repositories.map((r) => {
      if (r.name === 'core-service') {
        return {
          ...r,
          children: [...(r.children || []), fileNode],
        }
      }
      return r
    })
    useStore.setState({ repositories: updated })
    setNewFileName('')
    setShowAddModal(false)
  }

  return (
    <div className="w-64 flex flex-col bg-ide-sidebar border-r border-ide-border shrink-0 overflow-hidden relative">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-ide-border shrink-0 bg-ide-bg/30">
        {/* Clickable Repositories Dropdown Options Button */}
        <div className="relative">
          <button
            onClick={() => setShowRepoMenu(!showRepoMenu)}
            title="Repositories Options & Switcher"
            className="flex items-center gap-1 px-1.5 py-0.5 -ml-1 rounded hover:bg-ide-border/60 transition-colors cursor-pointer group"
          >
            <span className="text-[11px] font-semibold text-ide-text-bright uppercase tracking-wider group-hover:text-ide-accent">
              Repositories
            </span>
            <ChevronDown
              size={12}
              className={`text-ide-text/60 group-hover:text-ide-accent transition-transform duration-200 ${
                showRepoMenu ? 'rotate-180 text-ide-accent' : ''
              }`}
            />
          </button>

          {/* Repositories Options Dropdown Menu */}
          {showRepoMenu && (
            <div className="absolute top-full left-0 mt-1 w-60 bg-ide-panel border border-ide-border rounded-xl shadow-2xl z-50 p-2 text-xs slide-in">
              <div className="px-2 py-1 text-[10px] text-ide-text/50 font-semibold uppercase tracking-wider">
                Active Workspace
              </div>
              <div
                onClick={() => {
                  setActiveRepoName('core-service')
                  setSelectedPRRepo(null)
                  setShowRepoMenu(false)
                }}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors ${
                  activeRepoName === 'core-service'
                    ? 'bg-ide-accent/20 text-ide-accent font-medium'
                    : 'text-ide-text hover:bg-ide-border'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Folder size={13} className="text-amber-400 shrink-0" />
                  <span className="truncate">core-service</span>
                </div>
                {activeRepoName === 'core-service' && <span className="text-ide-accent text-[11px] font-bold">✓</span>}
              </div>

              {/* GitHub Repositories List */}
              {remoteRepos.length > 0 && (
                <>
                  <div className="px-2 py-1 mt-1.5 border-t border-ide-border/50 text-[10px] text-ide-text/50 font-semibold uppercase tracking-wider">
                    GitHub Repositories ({remoteRepos.length})
                  </div>
                  <div className="max-h-36 overflow-y-auto space-y-0.5">
                    {remoteRepos.slice(0, 10).map((r) => (
                      <div
                        key={r.id}
                        onClick={() => {
                          setActiveRepoName(r.name)
                          setSelectedPRRepo(r.name)
                          setShowRepoMenu(false)
                        }}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors ${
                          activeRepoName === r.name
                            ? 'bg-ide-accent/20 text-ide-accent font-medium'
                            : 'text-ide-text hover:bg-ide-border hover:text-ide-text-bright'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <GitBranch size={12} className="text-ide-purple shrink-0" />
                          <span className="truncate text-xs">{r.name}</span>
                        </div>
                        {activeRepoName === r.name && <span className="text-ide-accent text-[11px] font-bold">✓</span>}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Actions */}
              <div className="mt-1.5 pt-1.5 border-t border-ide-border/50 space-y-0.5">
                <button
                  onClick={() => {
                    collapseAll()
                    setShowRepoMenu(false)
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-ide-text hover:text-ide-text-bright hover:bg-ide-border rounded-lg transition-colors cursor-pointer text-left text-xs"
                >
                  <FolderClosed size={12} className="text-amber-400 shrink-0" />
                  <span>Collapse All Folders</span>
                </button>
                <button
                  onClick={() => {
                    expandAll()
                    setShowRepoMenu(false)
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-ide-text hover:text-ide-text-bright hover:bg-ide-border rounded-lg transition-colors cursor-pointer text-left text-xs"
                >
                  <FolderOpen size={12} className="text-amber-400 shrink-0" />
                  <span>Expand All Folders</span>
                </button>
                <button
                  onClick={() => {
                    fetchRepos()
                    setShowRepoMenu(false)
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-ide-text hover:text-ide-text-bright hover:bg-ide-border rounded-lg transition-colors cursor-pointer text-left text-xs"
                >
                  <RefreshCw size={12} className="text-ide-green shrink-0" />
                  <span>Refresh Repositories</span>
                </button>
                <button
                  onClick={() => {
                    setShowAddModal(true)
                    setShowRepoMenu(false)
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-ide-text hover:text-ide-text-bright hover:bg-ide-border rounded-lg transition-colors cursor-pointer text-left text-xs"
                >
                  <Plus size={12} className="text-ide-accent shrink-0" />
                  <span>New File / Module</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons in Header */}
        <div className="flex items-center gap-1">
          <button
            title="Collapse All Folders"
            onClick={collapseAll}
            className="p-1 rounded hover:bg-ide-border text-ide-text hover:text-ide-text-bright transition-colors cursor-pointer"
          >
            <FolderClosed size={12} />
          </button>
          <button
            title="Refresh Repositories"
            onClick={fetchRepos}
            disabled={loadingRepos}
            className="p-1 rounded hover:bg-ide-border text-ide-text hover:text-ide-text-bright transition-colors cursor-pointer disabled:opacity-50"
          >
            {loadingRepos ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
          </button>
          <button
            onClick={() => setShowAddModal(!showAddModal)}
            title="New File / Module"
            className="p-1 rounded hover:bg-ide-border text-ide-text hover:text-ide-text-bright transition-colors cursor-pointer"
          >
            <Plus size={12} />
          </button>
        </div>
      </div>

      {/* Add File inline input */}
      {showAddModal && (
        <form onSubmit={handleAddFile} className="p-2 bg-ide-bg border-b border-ide-border flex flex-col gap-1.5 shrink-0">
          <span className="text-[10px] text-ide-text/50 font-medium">Add to core-service:</span>
          <input
            type="text"
            placeholder="e.g. UserService.java"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            className="w-full bg-ide-panel border border-ide-border rounded px-2 py-1 text-xs text-ide-text-bright outline-none focus:border-ide-accent"
            autoFocus
          />
          <div className="flex justify-end gap-1.5">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-2 py-0.5 text-[10px] text-ide-text/50 hover:text-ide-text"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-2 py-0.5 text-[10px] bg-ide-accent hover:bg-ide-accent-hover text-white rounded font-medium"
            >
              Create
            </button>
          </div>
        </form>
      )}

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto">
        {/* Local repos (from store) */}
        {repositories.map((repo) => (
          <div key={repo.id}>
            <div
              onClick={() => toggleFolder(repo.id)}
              className="flex items-center gap-1.5 px-2 py-1.5 cursor-pointer text-xs text-ide-text-bright font-medium hover:bg-ide-border/60 transition-colors group select-none"
            >
              <span className="text-ide-text/50 shrink-0">
                {repo.expanded !== false ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              </span>
              {repo.expanded !== false ? (
                <FolderOpen size={13} className="text-amber-400 shrink-0" />
              ) : (
                <Folder size={13} className="text-amber-400/80 shrink-0" />
              )}
              <span className="flex-1 truncate">{repo.name}</span>
            </div>
            {repo.expanded !== false && repo.children?.map((child) => (
              <TreeNode key={child.id} node={child} depth={1} />
            ))}
          </div>
        ))}

        {/* Remote GitHub repos */}
        {remoteRepos.length > 0 && (
          <div className="border-t border-ide-border mt-1">
            <div className="px-3 py-1.5 flex items-center justify-between">
              <span className="text-[10px] text-ide-text/40 uppercase tracking-wider font-semibold">
                GitHub Repos ({remoteRepos.length})
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

        {/* PR / Commits / Issues Drawer for selected repo */}
        {selectedPRRepo && (
          <RepoDetailsPanel
            repo={selectedPRRepo}
            onClose={() => setSelectedPRRepo(null)}
          />
        )}
      </div>
    </div>
  )
}

