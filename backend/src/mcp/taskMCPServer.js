import * as taskStore from '../models/taskStore.js'
import { isDBConnected } from '../config/db.js'
import { Task, Project, Activity } from '../models/schemas.js'

/**
 * Project / Task MCP Server Implementation
 * Protocol endpoints:
 * - list_tasks()
 * - create_task(title, description, priority, status)
 * - update_task(taskId, status, priority)
 * - get_project_summary()
 * - record_progress(taskId, notes)
 */

export const TASK_TOOLS = [
  {
    name: 'task_list',
    description: 'List all project tasks and their statuses (todo, in-progress, done)',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'task_create',
    description: 'Create a new project development task',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Task title' },
        description: { type: 'string', description: 'Task description' },
        priority: { type: 'string', enum: ['low', 'medium', 'high'], description: 'Priority level' },
        status: { type: 'string', enum: ['todo', 'in-progress', 'done'], description: 'Current status' },
      },
      required: ['title'],
    },
  },
  {
    name: 'task_update',
    description: 'Update status or priority of an existing task',
    parameters: {
      type: 'object',
      properties: {
        taskId: { type: 'string', description: 'Task ID' },
        status: { type: 'string', enum: ['todo', 'in-progress', 'done'] },
        priority: { type: 'string', enum: ['low', 'medium', 'high'] },
      },
      required: ['taskId'],
    },
  },
  {
    name: 'task_delete',
    description: 'Delete a task by ID',
    parameters: {
      type: 'object',
      properties: {
        taskId: { type: 'string', description: 'Task ID' },
      },
      required: ['taskId'],
    },
  },
  {
    name: 'project_issues_list',
    description: 'List all project issues, bugs, and incident tickets',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'project_issue_create',
    description: 'Create a new project issue or bug ticket',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Issue title' },
        description: { type: 'string', description: 'Detailed issue description' },
        severity: { type: 'string', enum: ['low', 'medium', 'high'] },
        labels: { type: 'array', items: { type: 'string' } },
      },
      required: ['title'],
    },
  },
  {
    name: 'project_issue_update',
    description: 'Update status or severity of an existing project issue',
    parameters: {
      type: 'object',
      properties: {
        issueId: { type: 'string', description: 'Issue ID' },
        status: { type: 'string', enum: ['open', 'closed'] },
        severity: { type: 'string', enum: ['low', 'medium', 'high'] },
      },
      required: ['issueId'],
    },
  },
  {
    name: 'project_get_data',
    description: 'Get project metadata, architecture, dependencies, and environment data',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'project_get_progress',
    description: 'Get detailed project progress percentages, milestone metrics, and completion stats',
    parameters: { type: 'object', properties: {} },
  },
]

export async function handleTaskMCP(toolName, args, user = 'DevUser') {
  let result = null

  switch (toolName) {
    case 'task_list':
    case 'tasks_list': {
      if (isDBConnected()) {
        try {
          const list = await Task.find({}).sort({ createdAt: -1 }).lean()
          if (list && list.length > 0) {
            result = list
            break
          }
        } catch {}
      }
      result = taskStore.getAllTasks()
      break
    }

    case 'task_create': {
      const created = taskStore.createTask({
        ...args,
        assignee: user,
      })
      result = created

      if (isDBConnected()) {
        try {
          await Task.create({
            taskId: created.id,
            title: created.title,
            description: created.description,
            priority: created.priority,
            status: created.status,
            assignee: created.assignee,
          })
          await Activity.create({
            userId: user,
            action: 'mcp_task_created',
            details: { title: created.title, taskId: created.id },
          })
        } catch {}
      }
      break
    }

    case 'task_update': {
      const updated = taskStore.updateTask(args.taskId, args)
      result = updated

      if (isDBConnected()) {
        try {
          await Task.findOneAndUpdate({ taskId: args.taskId }, { $set: args }, { new: true })
          await Activity.create({
            userId: user,
            action: 'mcp_task_updated',
            details: { taskId: args.taskId, updates: args },
          })
        } catch {}
      }
      break
    }

    case 'task_delete': {
      const deleted = taskStore.deleteTask(args.taskId)
      result = { success: deleted, taskId: args.taskId }
      if (isDBConnected()) {
        try {
          await Task.findOneAndDelete({ taskId: args.taskId })
        } catch {}
      }
      break
    }

    case 'project_issues_list':
    case 'project_get_issues': {
      result = taskStore.getAllIssues()
      break
    }

    case 'project_issue_create': {
      result = taskStore.createIssue(args)
      if (isDBConnected()) {
        try {
          await Activity.create({
            userId: user,
            action: 'mcp_issue_created',
            details: { title: args.title },
          })
        } catch {}
      }
      break
    }

    case 'project_issue_update': {
      result = taskStore.updateIssue(args.issueId, args)
      break
    }

    case 'project_get_data': {
      result = taskStore.getProjectData()
      break
    }

    case 'project_get_progress': {
      result = taskStore.getProjectProgress()
      break
    }

    default:
      throw new Error(`Unknown Task/Project MCP tool: ${toolName}`)
  }

  return result
}

export default { TASK_TOOLS, handleTaskMCP }
