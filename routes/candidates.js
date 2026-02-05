const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { candidateUpload } = require('../config/multer.config');
const {
  getAllCandidates,
  getCandidate,
  createCandidate,
  updateCandidate,
  deleteCandidate,
  addAchievement,
  addIssue,
  searchCandidates,
  likeCandidate,
  addComment,
  getComments,
  shareCandidate
} = require('../controllers/candidateController');

const candidateFeedbackRouter = require('./candidateFeedback');

// Public routes
router.get('/search', searchCandidates);
router.get('/', getAllCandidates);
router.get('/:id', getCandidate);

// Social engagement routes (Public)
router.post('/:id/like', likeCandidate);
router.post('/:id/comment', addComment);
router.get('/:id/comments', getComments);
router.post('/:id/share', shareCandidate);

// Candidate feedback routes
router.use('/:candidateId/feedback', candidateFeedbackRouter);

// Admin only routes
router.post('/', protect, authorize('admin'), candidateUpload, createCandidate);
router.put('/:id', protect, authorize('admin'), candidateUpload, updateCandidate);
router.delete('/:id', protect, authorize('admin'), deleteCandidate);
router.post('/:id/achievements', protect, authorize('admin'), addAchievement);
router.post('/:id/issues', protect, authorize('admin'), addIssue);

module.exports = router;
