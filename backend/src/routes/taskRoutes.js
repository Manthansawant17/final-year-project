import { Router } from 'express'
import { getAllTasks, getTaskById, createTask, updateTask, deleteTask } from '../models/taskStore.js'
import { optionalAuth } from '../middleware/auth.js'

const router = Router()

// GET /api/tasks
router.get('/', optionalAuth, (req, res) => {
  try {
    const tasks = getAllTasks()
    res.json(tasks)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tasks', details: err.message })
  }
})

// GET /api/tasks/:id
router.get('/:id', optionalAuth, (req, res) => {
  const task = getTaskById(req.params.id)
  if (!task) return res.status(404).json({ error: 'Task not found' })
  res.json(task)
})

// POST /api/tasks
router.post('/', optionalAuth, (req, res) => {
  try {
    const { title, description, priority, status } = req.body
    if (!title) return res.status(400).json({ error: 'title is required' })
    const task = createTask({
      title,
      description,
      priority,
      status,
      assignee: req.user?.name || 'DevUser',
    })
    res.status(201).json(task)
  } catch (err) {
    res.status(500).json({ error: 'Failed to create task', details: err.message })
  }
})

// PUT /api/tasks/:id
router.put('/:id', optionalAuth, (req, res) => {
  try {
    const updated = updateTask(req.params.id, req.body)
    if (!updated) return res.status(404).json({ error: 'Task not found' })
    res.json(updated)
  } catch (err) {
    res.status(500).json({ error: 'Failed to update task', details: err.message })
  }
})

// DELETE /api/tasks/:id
router.delete('/:id', optionalAuth, (req, res) => {
  try {
    const deleted = deleteTask(req.params.id)
    if (!deleted) return res.status(404).json({ error: 'Task not found' })
    res.json({ success: true, message: 'Task deleted' })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete task', details: err.message })
  }
})

// ── Project & Issues Endpoints ─────────────────────────────────
import {
  getAllIssues,
  getIssueById,
  createIssue,
  updateIssue,
  deleteIssue,
  getProjectData,
  getProjectProgress,
} from '../models/taskStore.js'

// GET /api/tasks/project/data
router.get('/project/data', optionalAuth, (req, res) => {
  try {
    res.json(getProjectData())
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch project data', details: err.message })
  }
})

// GET /api/tasks/project/progress
router.get('/project/progress', optionalAuth, (req, res) => {
  try {
    res.json(getProjectProgress())
  } catch (err) {
    res.status(500).json({ error: 'Failed to calculate progress', details: err.message })
  }
})

// GET /api/tasks/project/issues
router.get('/project/issues', optionalAuth, (req, res) => {
  try {
    res.json(getAllIssues())
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch project issues', details: err.message })
  }
})

// POST /api/tasks/project/issues
router.post('/project/issues', optionalAuth, (req, res) => {
  try {
    const { title, description, severity, labels } = req.body
    if (!title) return res.status(400).json({ error: 'title is required' })
    const issue = createIssue({ title, description, severity, labels })
    res.status(201).json(issue)
  } catch (err) {
    res.status(500).json({ error: 'Failed to create issue', details: err.message })
  }
})

// PUT /api/tasks/project/issues/:id
router.put('/project/issues/:id', optionalAuth, (req, res) => {
  try {
    const updated = updateIssue(req.params.id, req.body)
    if (!updated) return res.status(404).json({ error: 'Issue not found' })
    res.json(updated)
  } catch (err) {
    res.status(500).json({ error: 'Failed to update issue', details: err.message })
  }
})

// DELETE /api/tasks/project/issues/:id
router.delete('/project/issues/:id', optionalAuth, (req, res) => {
  try {
    const deleted = deleteIssue(req.params.id)
    if (!deleted) return res.status(404).json({ error: 'Issue not found' })
    res.json({ success: true, message: 'Issue deleted' })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete issue', details: err.message })
  }
})

export default router
