const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');

// ===== PUBLIC ROUTES =====

/**
 * GET /api/feedback/public
 * Get public feedback (testimonials)
 */
router.get('/public', feedbackController.getPublicFeedback);

/**
 * POST /api/feedback
 * Create new feedback
 */
router.post('/', feedbackController.createFeedback);

/**
 * GET /api/feedback/:id
 * Get feedback by ID
 */
router.get('/:id', feedbackController.getFeedbackById);

/**
 * POST /api/feedback/:id/like
 * Like a feedback (for testimonials)
 */
router.post('/:id/like', feedbackController.likeFeedback);

/**
 * GET /api/feedback/user/my-feedback
 * Get user's own feedback
 */
router.get('/user/my-feedback', feedbackController.getUserFeedback);

// ===== ADMIN ROUTES (add auth middleware as needed) =====

/**
 * GET /api/admin/feedback
 * Get all feedback with filters and pagination
 */
router.get('/admin/feedback', feedbackController.getAdminFeedback);

/**
 * PATCH /api/admin/feedback/:id
 * Update feedback (status, priority, assignment, resolution)
 */
router.patch('/admin/feedback/:id', feedbackController.updateFeedback);

/**
 * POST /api/admin/feedback/:id/response
 * Add response to feedback
 */
router.post('/admin/feedback/:id/response', feedbackController.addFeedbackResponse);

/**
 * DELETE /api/admin/feedback/:id
 * Delete feedback
 */
router.delete('/admin/feedback/:id', feedbackController.deleteFeedback);

/**
 * GET /api/admin/feedback/stats/overview
 * Get feedback statistics
 */
router.get('/admin/feedback/stats/overview', feedbackController.getFeedbackStats);

module.exports = router;
