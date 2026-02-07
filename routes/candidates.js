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
  searchCandidates,
  likeCandidate,
  shareCandidate,
  registerCandidate,
  verifyCandidate,
  getCandidateStats
} = require('../controllers/candidateController');

const {
  castVote,
  removeVote,
  checkVoteStatus,
  getVoteCount,
  getAllVotingStats,
  toggleVoting,
  getVotersList
} = require('../controllers/voteController');

const candidateFeedbackRouter = require('./candidateFeedback');

// Public routes
router.get('/search', searchCandidates);
router.get('/stats', protect, authorize('admin'), getCandidateStats);
router.get('/votes/statistics', getAllVotingStats);
router.get('/', getAllCandidates);
router.get('/:id', getCandidate);

// Public registration route (no auth required)
router.post('/register', candidateUpload, registerCandidate);

// Voting routes (Public)
router.post('/:id/vote', castVote);
router.delete('/:id/vote', removeVote);
router.get('/:id/vote/check', checkVoteStatus);
router.get('/:id/votes/count', getVoteCount);

// Social engagement routes (Public)
router.post('/:id/like', likeCandidate);
router.post('/:id/share', shareCandidate);

// Voting toggle (admin)
// router.put('/:id/voting/toggle', protect, authorize('admin'), toggleVoting);
router.get('/:id/voters', protect, authorize('admin'), getVotersList);

// Candidate feedback routes
router.use('/:candidateId/feedback', candidateFeedbackRouter);

// Admin only routes
router.post('/', protect, authorize('admin'), candidateUpload, createCandidate);
router.put('/:id', protect, authorize('admin'), candidateUpload, updateCandidate);
router.put('/:id/verify', protect, authorize('admin'), verifyCandidate);
router.delete('/:id', protect, authorize('admin'), deleteCandidate);

module.exports = router;
