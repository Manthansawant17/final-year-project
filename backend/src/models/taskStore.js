import { v4 as uuidv4 } from 'uuid'
import { Task, Issue } from './schemas.js'
import { isDBConnected } from '../config/db.js'

// ── In-Memory Tasks Store (with MongoDB Sync) ───────────────────
const tasks = new Map([
  [
    'task-1',
    {
      id: 'task-1',
      title: 'Fix NullPointerException in AppService',
      description: 'Refactor getData() method to use Java Optional to safely handle nullable returns.',
      status: 'in-progress', // 'todo' | 'in-progress' | 'done'
      priority: 'high',     // 'low' | 'medium' | 'high'
      assignee: 'DevUser',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  [
    'task-2',
    {
      id: 'task-2',
      title: 'Setup Gemini 3.8 Flash AI Integration',
      description: 'Integrate the @google/genai SDK with multi-turn reasoning and automated PR diff reviews.',
      status: 'done',
      priority: 'high',
      assignee: 'DevUser',
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  [
    'task-3',
    {
      id: 'task-3',
      title: 'Add Unit Tests for Controller endpoints',
      description: 'Write JUnit tests for AppController covering successful response and exception cases.',
      status: 'todo',
      priority: 'medium',
      assignee: 'DevUser',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
])

// ── In-Memory Project Issues Store (with MongoDB Sync) ──────────
const issues = new Map([
  [
    'issue-1',
    {
      id: 'issue-1',
      number: 1,
      title: 'Memory leak under high concurrent payload',
      description: 'Profiling indicates connection pool leaks when database transactions time out.',
      status: 'open', // 'open' | 'closed'
      severity: 'high', // 'low' | 'medium' | 'high'
      labels: ['bug', 'performance'],
      createdAt: new Date(Date.now() - 36000000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  [
    'issue-2',
    {
      id: 'issue-2',
      number: 2,
      title: 'Add rate limiting to /api/status endpoint',
      description: 'Expose bucket4j or token bucket rate limiter to prevent denial of service.',
      status: 'open',
      severity: 'medium',
      labels: ['enhancement', 'security'],
      createdAt: new Date(Date.now() - 72000000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
])

// Hydrate tasks & issues from MongoDB or seed defaults
async function hydrateTasksAndIssuesFromDB() {
  if (!isDBConnected()) return
  try {
    const dbTasks = await Task.find({}).lean()
    if (dbTasks && dbTasks.length > 0) {
      tasks.clear()
      for (const t of dbTasks) {
        tasks.set(t.taskId, {
          id: t.taskId,
          title: t.title,
          description: t.description || '',
          status: t.status,
          priority: t.priority,
          assignee: t.assignee || 'DevUser',
          createdAt: t.createdAt ? new Date(t.createdAt).toISOString() : new Date().toISOString(),
          updatedAt: t.updatedAt ? new Date(t.updatedAt).toISOString() : new Date().toISOString(),
        })
      }
      console.log(`📦 Hydrated ${dbTasks.length} tasks from MongoDB`)
    } else {
      for (const task of tasks.values()) {
        await Task.create({
          taskId: task.id,
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          assignee: task.assignee,
          projectId: 'default',
        })
      }
      console.log('📦 Seeded initial tasks to MongoDB')
    }

    const dbIssues = await Issue.find({}).lean()
    if (dbIssues && dbIssues.length > 0) {
      issues.clear()
      for (const i of dbIssues) {
        issues.set(i.issueId, {
          id: i.issueId,
          number: i.number,
          title: i.title,
          description: i.description || '',
          status: i.status,
          severity: i.severity,
          labels: i.labels || [],
          createdAt: i.createdAt ? new Date(i.createdAt).toISOString() : new Date().toISOString(),
          updatedAt: i.updatedAt ? new Date(i.updatedAt).toISOString() : new Date().toISOString(),
        })
      }
      console.log(`📦 Hydrated ${dbIssues.length} issues from MongoDB`)
    } else {
      for (const issue of issues.values()) {
        await Issue.create({
          issueId: issue.id,
          number: issue.number,
          title: issue.title,
          description: issue.description,
          status: issue.status,
          severity: issue.severity,
          labels: issue.labels,
          projectId: 'default',
        })
      }
      console.log('📦 Seeded initial issues to MongoDB')
    }
  } catch (err) {
    console.warn('Could not sync tasks/issues with MongoDB:', err.message)
  }
}

setTimeout(hydrateTasksAndIssuesFromDB, 2000)

export function getAllTasks() {
  return Array.from(tasks.values()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export function getTaskById(id) {
  return tasks.get(id) || null
}

export function createTask({ title, description, priority = 'medium', status = 'todo', assignee = 'DevUser' }) {
  const id = `task-${uuidv4().slice(0, 8)}`
  const task = {
    id,
    title,
    description: description || '',
    status,
    priority,
    assignee,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  tasks.set(id, task)

  if (isDBConnected()) {
    Task.create({
      taskId: id,
      title,
      description: description || '',
      status,
      priority,
      assignee,
      projectId: 'default',
    }).catch((err) => console.error('Failed to save task to MongoDB:', err.message))
  }

  return task
}

export function updateTask(id, updates) {
  const existing = tasks.get(id)
  if (!existing) return null
  const updated = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  }
  tasks.set(id, updated)

  if (isDBConnected()) {
    Task.findOneAndUpdate(
      { taskId: id },
      {
        $set: {
          ...(updates.title && { title: updates.title }),
          ...(updates.description !== undefined && { description: updates.description }),
          ...(updates.status && { status: updates.status }),
          ...(updates.priority && { priority: updates.priority }),
          ...(updates.assignee && { assignee: updates.assignee }),
        },
      },
      { new: true }
    ).catch((err) => console.error('Failed to update task in MongoDB:', err.message))
  }

  return updated
}

export function deleteTask(id) {
  const deleted = tasks.delete(id)
  if (isDBConnected()) {
    Task.findOneAndDelete({ taskId: id }).catch((err) =>
      console.error('Failed to delete task from MongoDB:', err.message)
    )
  }
  return deleted
}

export function getAllIssues() {
  return Array.from(issues.values()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export function getIssueById(id) {
  return issues.get(id) || null
}

export function createIssue({ title, description, severity = 'medium', labels = ['enhancement'] }) {
  const id = `issue-${uuidv4().slice(0, 8)}`
  const formattedLabels = Array.isArray(labels) ? labels : [labels]
  const issue = {
    id,
    number: issues.size + 1,
    title,
    description: description || '',
    status: 'open',
    severity,
    labels: formattedLabels,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  issues.set(id, issue)

  if (isDBConnected()) {
    Issue.create({
      issueId: id,
      number: issue.number,
      title,
      description: description || '',
      status: 'open',
      severity,
      labels: formattedLabels,
      projectId: 'default',
    }).catch((err) => console.error('Failed to save issue to MongoDB:', err.message))
  }

  return issue
}

export function updateIssue(id, updates) {
  const existing = issues.get(id)
  if (!existing) return null
  const formattedLabels = updates.labels
    ? Array.isArray(updates.labels)
      ? updates.labels
      : [updates.labels]
    : existing.labels

  const updated = {
    ...existing,
    ...updates,
    labels: formattedLabels,
    updatedAt: new Date().toISOString(),
  }
  issues.set(id, updated)

  if (isDBConnected()) {
    Issue.findOneAndUpdate(
      { issueId: id },
      {
        $set: {
          ...(updates.title && { title: updates.title }),
          ...(updates.description !== undefined && { description: updates.description }),
          ...(updates.status && { status: updates.status }),
          ...(updates.severity && { severity: updates.severity }),
          ...(updates.labels && { labels: formattedLabels }),
        },
      },
      { new: true }
    ).catch((err) => console.error('Failed to update issue in MongoDB:', err.message))
  }

  return updated
}

export function deleteIssue(id) {
  const deleted = issues.delete(id)
  if (isDBConnected()) {
    Issue.findOneAndDelete({ issueId: id }).catch((err) =>
      console.error('Failed to delete issue from MongoDB:', err.message)
    )
  }
  return deleted
}

export function getProjectProgress() {
  const allTasks = getAllTasks()
  const totalTasks = allTasks.length
  const completedTasks = allTasks.filter((t) => t.status === 'done').length
  const inProgressTasks = allTasks.filter((t) => t.status === 'in-progress').length
  const todoTasks = allTasks.filter((t) => t.status === 'todo').length
  const taskProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  const allIssues = getAllIssues()
  const openIssues = allIssues.filter((i) => i.status === 'open').length
  const resolvedIssues = allIssues.filter((i) => i.status === 'closed').length

  const readiness = Math.min(100, Math.round(taskProgress * 0.75 + (openIssues === 0 ? 25 : 15)))

  return {
    projectName: 'core-service',
    overallProgress: taskProgress,
    readinessScore: readiness,
    tasks: {
      total: totalTasks,
      completed: completedTasks,
      inProgress: inProgressTasks,
      todo: todoTasks,
    },
    issues: {
      total: allIssues.length,
      open: openIssues,
      resolved: resolvedIssues,
    },
    activeMilestone: 'Sprint 4 - System Stabilization & AI Assistants',
    milestoneDeadline: '2026-10-30',
    status: taskProgress >= 80 ? 'on-track' : 'in-progress',
  }
}

export function getProjectData() {
  const progress = getProjectProgress()
  return {
    id: 'proj-core-service',
    name: 'core-service',
    description: 'Enterprise Microservice with Spring Boot 3.2, Java 17, and Gemini AI Assistant',
    repository: 'karansinhpatil11/final-year-project',
    branch: 'main',
    framework: 'Spring Boot 3.2',
    language: 'Java 17',
    buildTool: 'Maven',
    dependencies: [
      'spring-boot-starter-web',
      'spring-boot-starter-actuator',
      'spring-boot-starter-data-jpa',
      'lombok',
    ],
    activePR: 452,
    openTasks: progress.tasks.inProgress + progress.tasks.todo,
    openIssues: progress.issues.open,
    progress,
  }
}
