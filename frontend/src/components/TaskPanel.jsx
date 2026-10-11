import React, { useState, useEffect } from 'react'
import { taskAPI } from '../services/api'
import { CheckSquare, Plus, Trash2, CheckCircle2, Clock, AlertCircle } from 'lucide-react'

export default function TaskPanel() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newPriority, setNewPriority] = useState('medium')

  const fetchTasks = async () => {
    setLoading(true)
    try {
      const res = await taskAPI.getTasks()
      setTasks(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    try {
      const res = await taskAPI.createTask({
        title: newTitle,
        description: newDesc,
        priority: newPriority,
        status: 'todo',
      })
      setTasks([res.data, ...tasks])
      setNewTitle('')
      setNewDesc('')
      setShowAddModal(false)
    } catch (e) {
      console.error(e)
    }
  }

  const handleToggleStatus = async (task) => {
    const nextStatus = task.status === 'done' ? 'todo' : 'done'
    try {
      const res = await taskAPI.updateTask(task.id, { status: nextStatus })
      setTasks(tasks.map((t) => (t.id === task.id ? res.data : t)))
    } catch (e) {
      console.error(e)
    }
  }

  const handleDelete = async (id, e) => {
    e.stopPropagation()
    try {
      await taskAPI.deleteTask(id)
      setTasks(tasks.filter((t) => t.id !== id))
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden text-xs">
      {/* Subheader */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-ide-border shrink-0">
        <span className="text-[10px] text-ide-text/40 font-semibold uppercase tracking-wider">
          Task Tracker ({tasks.length})
        </span>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1 text-[11px] text-ide-accent hover:text-ide-accent-hover transition-colors cursor-pointer"
        >
          <Plus size={13} />
          <span>New Task</span>
        </button>
      </div>

      {/* New Task Form Modal */}
      {showAddModal && (
        <form onSubmit={handleCreate} className="p-3 bg-ide-bg border-b border-ide-border flex flex-col gap-2 shrink-0">
          <input
            type="text"
            placeholder="Task title..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full bg-ide-panel border border-ide-border rounded-lg px-2.5 py-1.5 text-xs text-ide-text-bright placeholder-ide-text/30 outline-none focus:border-ide-accent"
            autoFocus
          />
          <textarea
            placeholder="Description (optional)..."
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            rows={2}
            className="w-full bg-ide-panel border border-ide-border rounded-lg px-2.5 py-1 text-xs text-ide-text-bright placeholder-ide-text/30 outline-none focus:border-ide-accent resize-none"
          />
          <div className="flex items-center justify-between gap-2 mt-1">
            <select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value)}
              className="bg-ide-panel border border-ide-border rounded-lg px-2 py-1 text-[10px] text-ide-text outline-none"
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-2.5 py-1 rounded-lg text-ide-text/50 hover:text-ide-text transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 bg-ide-accent hover:bg-ide-accent-hover text-white rounded-lg font-medium transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Task List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {loading && <p className="text-center text-ide-text/40 py-4">Loading tasks...</p>}
        {!loading && tasks.length === 0 && (
          <div className="text-center py-8 text-ide-text/40">
            <CheckSquare size={24} className="mx-auto mb-2 opacity-30" />
            <p>No active tasks</p>
          </div>
        )}
        {tasks.map((task) => {
          const isDone = task.status === 'done'
          return (
            <div
              key={task.id}
              onClick={() => handleToggleStatus(task)}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer group flex flex-col gap-1.5 ${
                isDone
                  ? 'bg-ide-bg/50 border-ide-border/40 opacity-60'
                  : 'bg-ide-panel border-ide-border hover:border-ide-accent/40 shadow-sm'
              }`}
            >
              <div className="flex items-start gap-2">
                <button
                  type="button"
                  className="mt-0.5 text-ide-text/40 group-hover:text-ide-accent transition-colors shrink-0"
                >
                  {isDone ? (
                    <CheckCircle2 size={14} className="text-ide-green" />
                  ) : (
                    <Clock size={14} className="text-ide-yellow" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p
                    className={`font-medium text-xs leading-snug truncate ${
                      isDone ? 'line-through text-ide-text/40' : 'text-ide-text-bright'
                    }`}
                  >
                    {task.title}
                  </p>
                  {task.description && (
                    <p className="text-[11px] text-ide-text/50 line-clamp-2 mt-0.5">{task.description}</p>
                  )}
                </div>
                <button
                  onClick={(e) => handleDelete(task.id, e)}
                  className="text-ide-text/20 hover:text-ide-red opacity-0 group-hover:opacity-100 transition-all p-1"
                  title="Delete task"
                >
                  <Trash2 size={12} />
                </button>
              </div>

              {/* Priority badge */}
              <div className="flex items-center justify-between text-[10px] text-ide-text/40 pt-1 border-t border-ide-border/30">
                <span
                  className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-semibold ${
                    task.priority === 'high'
                      ? 'bg-ide-red/15 text-ide-red'
                      : task.priority === 'medium'
                      ? 'bg-ide-yellow/15 text-ide-yellow'
                      : 'bg-ide-blue/15 text-ide-blue'
                  }`}
                >
                  {task.priority}
                </span>
                <span>{task.assignee}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
