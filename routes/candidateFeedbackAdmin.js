const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAllCandidateFeedbackAdmin,
  deleteFeedbackById,
  updateFeedbackById
} = require('../controllers/candidateFeedbackController');

// All routes require admin authentication
router.use(protect);
router.use(authorize('admin'));

/**
 * GET /api/candidate-feedback/admin
 * Get all feedback across all candidates
 */
router.get('/admin', getAllCandidateFeedbackAdmin);

/**
 * PATCH /api/candidate-feedback/admin/:feedbackId
 * Update feedback status
 */
router.patch('/admin/:feedbackId', updateFeedbackById);

/**
 * DELETE /api/candidate-feedback/admin/:feedbackId
 * Delete feedback
 */
router.delete('/admin/:feedbackId', deleteFeedbackById);

module.exports = router;
