import React from 'react'
import useStore from '../store/useStore'
import { ArrowLeft, ExternalLink, GitMerge, RotateCcw, ChevronRight } from 'lucide-react'

// Mock diff data
const diffLines = [
  { num: 1, type: 'neutral', old: 'public class AppController {', new: 'public class AppController {' },
  { num: 2, type: 'neutral', old: '', new: '' },
  { num: 3, type: 'neutral', old: '  @GetMapping("/data")', new: '  @GetMapping("/data")' },
  { num: 4, type: 'remove', old: '  public class getData() {', new: '  public AppService.getData() {' },
  { num: 5, type: 'neutral', old: '    return service.getData();', new: '    return service.getData();' },
  { num: 6, type: 'neutral', old: '  }', new: '  }' },
  { num: 7, type: 'neutral', old: '', new: '' },
  { num: 8, type: 'neutral', old: '  @GetMapping("/data")', new: '  @GetMapping("/data")' },
  { num: 9, type: 'remove',  old: '    return service.getData();', new: '    return service.getData();' },
  { num: 10, type: 'neutral', old: '  }', new: '  }' },
  { num: 11, type: 'add',  old: null, new: '  // New data structure' },
  { num: 12, type: 'add',  old: null, new: '  public Optional<Data> getData() {' },
  { num: 13, type: 'add',  old: null, new: '    return Optional.ofNullable(rep' },
  { num: 14, type: 'neutral', old: '}', new: '}' },
]

function DiffLine({ lineNum, content, type }) {
  const bg =
    type === 'add' ? 'bg-diff-add' :
    type === 'remove' ? 'bg-diff-remove' : ''
  const textColor =
    type === 'add' ? 'text-ide-green' :
    type === 'remove' ? 'text-ide-red' : 'text-ide-text'
  const prefix =
    type === 'add' ? '+ ' :
    type === 'remove' ? '- ' : '  '

  return (
    <div className={`flex items-start group ${bg}`}>
      <span className="w-10 shrink-0 text-right pr-3 py-0.5 text-xs text-ide-text/40 select-none border-r border-ide-border">
        {lineNum}
      </span>
      <pre className={`flex-1 px-3 py-0.5 text-xs font-mono ${textColor} whitespace-pre-wrap break-all`}>
        {prefix}{content}
      </pre>
    </div>
  )
}

export default function DiffViewer() {
  const { currentPR, setActiveEditorTab } = useStore()
  const [viewMode, setViewMode] = React.useState('paired') // 'paired' | 'unified'
  const [resetKey, setResetKey] = React.useState(0)

  // Split into old/new columns
  const oldLines = diffLines.filter((l) => l.type !== 'add')
  const newLines = diffLines.filter((l) => l.type !== 'remove')

  return (
    <div key={resetKey} className="flex flex-col h-full overflow-hidden">
      {/* PR Header */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-ide-border shrink-0">
        <button
          onClick={() => setActiveEditorTab('AppController')}
          title="Back to file editor"
          className="text-ide-text hover:text-ide-text-bright transition-colors cursor-pointer"
        >
          <ArrowLeft size={15} />
        </button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <GitMerge size={15} className="text-ide-purple shrink-0" />
          <h2 className="text-sm font-semibold text-ide-text-bright truncate">
            <span className="text-ide-blue">PR #{currentPR.number}:</span>{' '}
            {currentPR.title}
          </h2>
        </div>
        <span className="shrink-0 px-2 py-0.5 text-xs font-semibold bg-ide-green/20 text-ide-green rounded-full border border-ide-green/40">
          ● Open
        </span>
      </div>

      {/* GitHub Diff Header */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-ide-border bg-ide-sidebar shrink-0">
        <div className="w-4 h-4 rounded-full bg-ide-text/20 flex items-center justify-center">
          <span className="text-[9px] text-ide-text-bright font-bold">G</span>
        </div>
        <span className="text-xs text-ide-text font-medium">GitHub diff</span>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'paired' ? 'unified' : 'paired')}
            title="Toggle Split / Unified view"
            className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded border transition-colors cursor-pointer ${
              viewMode === 'paired'
                ? 'bg-ide-accent/20 border-ide-accent/40 text-ide-accent'
                : 'bg-ide-bg border-ide-border text-ide-text hover:text-ide-text-bright'
            }`}
          >
            <GitMerge size={12} />
            {viewMode === 'paired' ? 'Paired (Split)' : 'Unified'}
          </button>
          <button
            onClick={() => setResetKey((k) => k + 1)}
            title="Reset Diff Scroll"
            className="p-1 rounded hover:bg-ide-border text-ide-text hover:text-ide-text-bright transition-colors cursor-pointer"
          >
            <RotateCcw size={12} />
          </button>
        </div>
      </div>

      {/* Diff Content View */}
      <div className="flex-1 overflow-auto">
        {viewMode === 'unified' ? (
          /* Unified Single Column */
          <div className="min-w-full">
            {diffLines.map((line, i) => (
              <DiffLine
                key={i}
                lineNum={i + 1}
                content={line.type === 'remove' ? line.old : line.new}
                type={line.type}
              />
            ))}
          </div>
        ) : (
          /* Split Paired View */
          <div className="flex min-h-full">
            {/* OLD (Left) */}
            <div className="flex-1 border-r border-ide-border overflow-x-auto">
              <div className="flex items-center gap-2 px-3 py-1 bg-ide-sidebar/80 border-b border-ide-border sticky top-0">
                <span className="text-xs text-ide-text/50 font-mono">1</span>
                <span className="text-xs text-ide-text font-mono">public class AppController {'{'}</span>
              </div>
              {oldLines.map((line, i) => (
                <DiffLine
                  key={i}
                  lineNum={i + 1}
                  content={line.old}
                  type={line.type}
                />
              ))}
            </div>

            {/* NEW (Right) */}
            <div className="flex-1 overflow-x-auto">
              <div className="flex items-center gap-2 px-3 py-1 bg-ide-sidebar/80 border-b border-ide-border sticky top-0">
                <span className="text-xs text-ide-text/50 font-mono">1</span>
                <span className="text-xs text-ide-text font-mono">public class AppController {'{'}</span>
              </div>
              {newLines.map((line, i) => (
                <DiffLine
                  key={i}
                  lineNum={i + 1}
                  content={line.new}
                  type={line.type}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
