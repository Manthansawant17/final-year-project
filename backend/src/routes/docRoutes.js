import { Router } from 'express'
import { getAllDocs, getDocById, searchDocs, createDoc, updateDoc, deleteDoc } from '../models/docStore.js'
import { optionalAuth } from '../middleware/auth.js'

const router = Router()

// GET /api/docs (with optional ?q= query)
router.get('/', optionalAuth, (req, res) => {
  try {
    const { q } = req.query
    const results = q ? searchDocs(q) : getAllDocs()
    res.json(results)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch documentation', details: err.message })
  }
})

// GET /api/docs/:id
router.get('/:id', optionalAuth, (req, res) => {
  const doc = getDocById(req.params.id)
  if (!doc) return res.status(404).json({ error: 'Documentation entry not found' })
  res.json(doc)
})

// POST /api/docs
router.post('/', optionalAuth, (req, res) => {
  try {
    const { title, category, content, tags } = req.body
    if (!title) return res.status(400).json({ error: 'title is required' })
    const doc = createDoc({ title, category, content, tags })
    res.status(201).json(doc)
  } catch (err) {
    res.status(500).json({ error: 'Failed to create document', details: err.message })
  }
})

// PUT /api/docs/:id
router.put('/:id', optionalAuth, (req, res) => {
  try {
    const updated = updateDoc(req.params.id, req.body)
    if (!updated) return res.status(404).json({ error: 'Documentation entry not found' })
    res.json(updated)
  } catch (err) {
    res.status(500).json({ error: 'Failed to update document', details: err.message })
  }
})

// DELETE /api/docs/:id
router.delete('/:id', optionalAuth, (req, res) => {
  try {
    const deleted = deleteDoc(req.params.id)
    if (!deleted) return res.status(404).json({ error: 'Documentation entry not found' })
    res.json({ success: true, message: 'Document deleted' })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete document', details: err.message })
  }
})

export default router
