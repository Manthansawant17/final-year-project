import { Router } from 'express'
import {
  listRepositories,
  listPullRequests,
  getPRDiff,
  getFile,
  createPR,
  listCommits,
  listIssues,
  createIssue,
  getRepoTree,
  getRepoDetails,
} from '../controllers/githubController.js'
import { optionalAuth } from '../middleware/auth.js'

const router = Router()

router.get('/repositories', optionalAuth, listRepositories)
router.get('/repository/:repo', optionalAuth, getRepoDetails)
router.get('/prs/:repo', optionalAuth, listPullRequests)
router.get('/prs/:repo/:number/diff', optionalAuth, getPRDiff)
router.get('/file/:repo', optionalAuth, getFile)
router.get('/tree/:repo', optionalAuth, getRepoTree)
router.post('/create-pr', optionalAuth, createPR)
router.get('/commits/:repo', optionalAuth, listCommits)
router.get('/issues/:repo', optionalAuth, listIssues)
router.post('/issues/:repo', optionalAuth, createIssue)

export default router

