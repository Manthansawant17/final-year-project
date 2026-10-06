import { Router } from 'express'
import { listRepositories, listPullRequests, getPRDiff, getFile, createPR } from '../controllers/githubController.js'
import { requireAuth } from '../middleware/auth.js'
const router = Router()
router.get('/repositories', requireAuth, listRepositories)
router.get('/prs/:repo', requireAuth, listPullRequests)
router.get('/prs/:repo/:number/diff', requireAuth, getPRDiff)
router.get('/file/:repo', requireAuth, getFile)
router.post('/create-pr', requireAuth, createPR)
export default router
