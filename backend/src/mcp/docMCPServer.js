import * as docStore from '../models/docStore.js'
import { isDBConnected } from '../config/db.js'
import { Documentation, Activity } from '../models/schemas.js'

/**
 * Documentation MCP Server Implementation
 * Protocol endpoints:
 * - read_docs(docId)
 * - create_docs(title, category, content, tags)
 * - update_docs(docId, updates)
 * - search_docs(query)
 */

export const DOC_TOOLS = [
  {
    name: 'doc_search',
    description: 'Search documentation library by keywords, topics, or tags',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search term or question' },
      },
      required: ['query'],
    },
  },
  {
    name: 'doc_read',
    description: 'Read full content of a documentation document by ID',
    parameters: {
      type: 'object',
      properties: {
        docId: { type: 'string', description: 'Document ID' },
      },
      required: ['docId'],
    },
  },
  {
    name: 'doc_create',
    description: 'Create a new project documentation document',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Document title' },
        category: { type: 'string', description: 'Category (e.g. Architecture, API, Models)' },
        content: { type: 'string', description: 'Markdown content body' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Tags list' },
      },
      required: ['title', 'content'],
    },
  },
  {
    name: 'doc_update',
    description: 'Update existing documentation content or metadata',
    parameters: {
      type: 'object',
      properties: {
        docId: { type: 'string', description: 'Document ID' },
        content: { type: 'string', description: 'New markdown content' },
        title: { type: 'string', description: 'Updated title' },
      },
      required: ['docId'],
    },
  },
  {
    name: 'doc_list',
    description: 'List all available documentation topics and guides',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'doc_delete',
    description: 'Delete a documentation document by ID',
    parameters: {
      type: 'object',
      properties: {
        docId: { type: 'string', description: 'Document ID' },
      },
      required: ['docId'],
    },
  },
]

export async function handleDocMCP(toolName, args, user = 'DevUser') {
  let result = null

  switch (toolName) {
    case 'doc_search':
    case 'search_docs': {
      if (isDBConnected()) {
        try {
          const q = new RegExp(args.query, 'i')
          const found = await Documentation.find({
            $or: [{ title: q }, { content: q }, { category: q }, { tags: q }],
          }).lean()
          if (found && found.length > 0) {
            result = found
            break
          }
        } catch {}
      }
      result = docStore.searchDocs(args.query)
      break
    }

    case 'doc_read':
    case 'read_docs': {
      if (isDBConnected()) {
        try {
          const doc = await Documentation.findOne({ docId: args.docId }).lean()
          if (doc) {
            result = doc
            break
          }
        } catch {}
      }
      result = docStore.getDocById(args.docId)
      break
    }

    case 'doc_create':
    case 'create_docs': {
      const created = docStore.createDoc(args)
      result = created
      if (isDBConnected()) {
        try {
          await Documentation.create({
            docId: created.id,
            title: created.title,
            category: created.category,
            content: created.content,
            tags: created.tags,
          })
          await Activity.create({
            userId: user,
            action: 'mcp_doc_created',
            details: { title: created.title, docId: created.id },
          })
        } catch {}
      }
      break
    }

    case 'doc_update':
    case 'update_docs': {
      const updated = docStore.updateDoc(args.docId, args)
      result = updated
      if (isDBConnected()) {
        try {
          await Documentation.findOneAndUpdate({ docId: args.docId }, { $set: args }, { new: true })
          await Activity.create({
            userId: user,
            action: 'mcp_doc_updated',
            details: { docId: args.docId },
          })
        } catch {}
      }
      break
    }

    case 'doc_list':
    case 'list_docs': {
      if (isDBConnected()) {
        try {
          const all = await Documentation.find({}).sort({ updatedAt: -1 }).lean()
          if (all && all.length > 0) {
            result = all
            break
          }
        } catch {}
      }
      result = docStore.getAllDocs()
      break
    }

    case 'doc_delete':
    case 'delete_docs': {
      const deleted = docStore.deleteDoc(args.docId)
      result = { success: deleted, docId: args.docId }
      if (isDBConnected()) {
        try {
          await Documentation.findOneAndDelete({ docId: args.docId })
        } catch {}
      }
      break
    }

    default:
      throw new Error(`Unknown Doc MCP tool: ${toolName}`)
  }

  return result
}

export default { DOC_TOOLS, handleDocMCP }
