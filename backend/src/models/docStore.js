import { v4 as uuidv4 } from 'uuid'
import { Documentation } from './schemas.js'
import { isDBConnected } from '../config/db.js'

// ── In-Memory Documentation Store (with MongoDB Sync) ───────────
const docs = new Map([
  [
    'doc-1',
    {
      id: 'doc-1',
      title: 'Project Architecture & Design',
      category: 'Architecture',
      content: `# Project Architecture & System Overview

## 1. System Layers
- **Frontend Layer**: React 18 with Tailwind CSS, delivering a dark-mode developer IDE workspace with DiffViewer, File Explorer, Terminal, and AI Assistant.
- **Backend API**: Node.js with Express & Socket.IO providing secure REST endpoints, JWT authentication, and session handling.
- **AI Agent Layer**: Powered by **Google Gemini 3.8 Flash** via \`@google/genai\` with multi-turn prompt engineering, code synthesis, and diff analysis.
- **MCP Protocol / GitHub Integration**: Connects to the GitHub REST API for repository inspection, branch management, pull requests, and unified/split diff rendering.

## 2. Authentication flow
- Uses JWT access tokens (signed with HMAC-SHA256) and optional refresh rotation.
- Supports guest mode alongside registered developer profiles.`,
      tags: ['overview', 'architecture', 'react', 'nodejs', 'gemini'],
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
    },
  ],
  [
    'doc-2',
    {
      id: 'doc-2',
      title: 'Google Gemini AI Integration Guide',
      category: 'AI & Models',
      content: `# Google Gemini Integration Guide

## Overview
The AI assistant uses **Gemini 3.8 Flash (Free Tier)**.

### Model Parameters:
- Model code: \`gemini-3.8-flash\`
- Token input limit: 1,048,576 tokens
- System instruction: Injected as an IDE assistant persona that outputs structured actions (\`Apply Code\`, \`Create PR\`).

### Available Free Models:
- \`gemini-3.8-flash\` (Primary default)
- \`gemini-2.5-flash\`
- \`gemini-2.0-flash\`
- \`gemini-1.5-flash\`

### Configuration in backend/.env:
\`\`\`env
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-3.8-flash
\`\`\``,
      tags: ['gemini', 'ai', 'models', 'free-tier'],
      updatedAt: new Date().toISOString(),
    },
  ],
  [
    'doc-3',
    {
      id: 'doc-3',
      title: 'GitHub & PR Diff Workflow',
      category: 'GitHub',
      content: `# GitHub PR Diff & Code Review Workflow

## Pull Request #452
- **Issue**: Data fetch issues and NullPointerException handling in \`AppService.java\`.
- **Solution**: Refactor to Java 8+ \`Optional<Data>\` and handle repository failures gracefully.
- **Diff format**: Side-by-side split diff with synchronized line scrolling and syntax highlighting.

## Actions available in AI Chat:
- **Apply Code**: Instantly copies the recommended code block to your clipboard.
- **Create PR**: Prepares and pushes pull request metadata via GitHub API.`,
      tags: ['github', 'diff', 'pull-request', 'code-review'],
      updatedAt: new Date().toISOString(),
    },
  ],
])

// Hydrate from MongoDB or seed defaults
async function hydrateDocsFromDB() {
  if (!isDBConnected()) return
  try {
    const dbDocs = await Documentation.find({}).lean()
    if (dbDocs && dbDocs.length > 0) {
      docs.clear()
      for (const d of dbDocs) {
        docs.set(d.docId, {
          id: d.docId,
          title: d.title,
          category: d.category || 'General',
          content: d.content,
          tags: d.tags || [],
          updatedAt: d.updatedAt ? new Date(d.updatedAt).toISOString() : new Date().toISOString(),
        })
      }
      console.log(`📦 Hydrated ${dbDocs.length} documentation files from MongoDB`)
    } else {
      for (const doc of docs.values()) {
        await Documentation.create({
          docId: doc.id,
          title: doc.title,
          category: doc.category,
          content: doc.content,
          tags: doc.tags,
          projectId: 'default',
        })
      }
      console.log('📦 Seeded initial documentation to MongoDB')
    }
  } catch (err) {
    console.warn('Could not sync documentation with MongoDB:', err.message)
  }
}

setTimeout(hydrateDocsFromDB, 2000)

export function getAllDocs() {
  return Array.from(docs.values()).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
}

export function getDocById(id) {
  return docs.get(id) || null
}

export function searchDocs(query) {
  if (!query) return getAllDocs()
  const q = query.toLowerCase()
  return getAllDocs().filter(
    (d) =>
      d.title.toLowerCase().includes(q) ||
      d.content.toLowerCase().includes(q) ||
      d.category.toLowerCase().includes(q) ||
      d.tags.some((t) => t.toLowerCase().includes(q))
  )
}

export function createDoc({ title, category = 'General', content = '', tags = [] }) {
  const id = `doc-${uuidv4().slice(0, 8)}`
  const formattedTags = Array.isArray(tags) ? tags : tags.split(',').map((t) => t.trim())
  const doc = {
    id,
    title,
    category,
    content,
    tags: formattedTags,
    updatedAt: new Date().toISOString(),
  }
  docs.set(id, doc)

  if (isDBConnected()) {
    Documentation.create({
      docId: id,
      title,
      category,
      content,
      tags: formattedTags,
      projectId: 'default',
    }).catch((err) => console.error('Failed to save document to MongoDB:', err.message))
  }

  return doc
}

export function updateDoc(id, updates) {
  const existing = docs.get(id)
  if (!existing) return null
  const formattedTags = updates.tags
    ? Array.isArray(updates.tags)
      ? updates.tags
      : updates.tags.split(',').map((t) => t.trim())
    : existing.tags

  const updated = {
    ...existing,
    ...updates,
    tags: formattedTags,
    updatedAt: new Date().toISOString(),
  }
  docs.set(id, updated)

  if (isDBConnected()) {
    Documentation.findOneAndUpdate(
      { docId: id },
      {
        $set: {
          ...(updates.title && { title: updates.title }),
          ...(updates.category && { category: updates.category }),
          ...(updates.content !== undefined && { content: updates.content }),
          ...(updates.tags && { tags: formattedTags }),
        },
      },
      { new: true }
    ).catch((err) => console.error('Failed to update document in MongoDB:', err.message))
  }

  return updated
}

export function deleteDoc(id) {
  const deleted = docs.delete(id)
  if (isDBConnected()) {
    Documentation.findOneAndDelete({ docId: id }).catch((err) =>
      console.error('Failed to delete document from MongoDB:', err.message)
    )
  }
  return deleted
}
