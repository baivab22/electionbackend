const express = require('express');
const router = express.Router({ mergeParams: true });
const candidateFeedbackController = require('../controllers/candidateFeedbackController');

// ===== PUBLIC ROUTES =====

/**
 * POST /api/candidates/:candidateId/feedback
 * Submit feedback for a candidate
 */
router.post('/', candidateFeedbackController.submitCandidateFeedback);

/**
 * GET /api/candidates/:candidateId/feedback
 * Get all approved feedback for a candidate
 */
router.get('/', candidateFeedbackController.getCandidateFeedback);

/**
 * GET /api/candidates/:candidateId/feedback/:feedbackId
 * Get specific feedback
 */
router.get('/:feedbackId', candidateFeedbackController.getCandidateFeedbackById);

/**
 * POST /api/candidates/:candidateId/feedback/:feedbackId/helpful
 * Mark feedback as helpful
 */
router.post('/:feedbackId/helpful', candidateFeedbackController.markFeedbackHelpful);

/**
 * POST /api/candidates/:candidateId/feedback/:feedbackId/unhelpful
 * Mark feedback as unhelpful
 */
router.post('/:feedbackId/unhelpful', candidateFeedbackController.markFeedbackUnhelpful);

// ===== ADMIN ROUTES =====

/**
 * GET /api/candidates/:candidateId/feedback/admin
 * Get all feedback for a candidate (admin view)
 */
router.get('/admin', candidateFeedbackController.getAdminCandidateFeedback);

/**
 * PATCH /api/candidates/:candidateId/feedback/admin/:feedbackId
 * Approve or reject feedback
 */
router.patch('/admin/:feedbackId', candidateFeedbackController.updateCandidateFeedback);

/**
 * DELETE /api/candidates/:candidateId/feedback/admin/:feedbackId
 * Delete feedback
 */
router.delete('/admin/:feedbackId', candidateFeedbackController.deleteCandidateFeedback);

module.exports = router;
