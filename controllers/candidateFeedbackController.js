const { CandidateFeedback, FEEDBACK_TYPES, RATINGS } = require('../models/CandidateFeedback');
const mongoose = require('mongoose');

const pick = (obj, keys) => {
  return keys.reduce((result, key) => {
    if (key in obj) result[key] = obj[key];
    return result;
  }, {});
};

/**
 * POST /api/candidates/:candidateId/feedback
 * Submit feedback for a candidate
 */
exports.submitCandidateFeedback = async (req, res) => {
  try {
    const { candidateId } = req.params;
    const { type, rating, comment, anonymous, email, name, phone } = req.body;

    if (!mongoose.isValidObjectId(candidateId)) {
      return res.status(400).json({ message: 'Invalid candidate id' });
    }

    // Validation
    if (!type || !FEEDBACK_TYPES.includes(type)) {
      return res.status(400).json({
        message: `Invalid type. Allowed: ${FEEDBACK_TYPES.join(', ')}`
      });
    }

    if (!rating || !RATINGS.includes(parseInt(rating))) {
      return res.status(400).json({
        message: `Invalid rating. Must be between 1 and 5`
      });
    }

    if (!comment || comment.length < 5 || comment.length > 1000) {
      return res.status(400).json({
        message: 'Comment must be between 5 and 1000 characters'
      });
    }

    const feedbackData = {
      candidate: candidateId,
      type,
      rating: parseInt(rating),
      comment,
      anonymous: anonymous === true || anonymous === 'true',
      user: req.user?.id || null
    };

    // For non-anonymous feedback
    if (!feedbackData.anonymous) {
      if (!email) {
        return res.status(400).json({ message: 'Email is required for identified feedback' });
      }
      feedbackData.email = email;
      feedbackData.name = name;
      feedbackData.phone = phone;
    }

    const feedback = new CandidateFeedback(feedbackData);
    await feedback.save();

    return res.status(201).json({
      message: 'Feedback submitted successfully',
      feedback: feedback.toPublicJSON()
    });
  } catch (err) {
    console.error('Error submitting feedback:', err);
    return res.status(500).json({ message: 'Failed to submit feedback', error: err.message });
  }
};

/**
 * GET /api/candidates/:candidateId/feedback
 * Get all feedback for a candidate (public/approved only)
 */
exports.getCandidateFeedback = async (req, res) => {
  try {
    const { candidateId } = req.params;
    const { page: pageStr, limit: limitStr, sort } = req.query;

    if (!mongoose.isValidObjectId(candidateId)) {
      return res.status(400).json({ message: 'Invalid candidate id' });
    }

    const page = Math.max(parseInt(pageStr || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(limitStr || '10', 10), 1), 100);
    const skip = (page - 1) * limit;

    // Only get approved and public feedback
    const filter = {
      candidate: candidateId,
      status: 'approved',
      isPublic: true
    };

    const sortOption = sort === 'newest' ? { createdAt: -1 } : 
                       sort === 'rating' ? { rating: -1 } :
                       sort === 'helpful' ? { helpful: -1 } :
                       { createdAt: -1 };

    const [items, total] = await Promise.all([
      CandidateFeedback.find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .populate('user', 'name'),
      CandidateFeedback.countDocuments(filter)
    ]);

    // Calculate average rating
    const ratingStats = await CandidateFeedback.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalFeedback: { $sum: 1 },
          ratingDistribution: {
            $push: '$rating'
          }
        }
      }
    ]);

    const stats = ratingStats[0] || {
      averageRating: 0,
      totalFeedback: 0,
      ratingDistribution: []
    };

    // Calculate rating distribution
    const distribution = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0
    };

    stats.ratingDistribution.forEach(r => {
      distribution[r]++;
    });

    return res.json({
      page,
      limit,
      total,
      feedback: items.map(f => f.toPublicJSON()),
      stats: {
        averageRating: stats.averageRating ? parseFloat(stats.averageRating.toFixed(1)) : 0,
        totalFeedback: stats.totalFeedback,
        ratingDistribution: distribution
      }
    });
  } catch (err) {
    console.error('Error fetching feedback:', err);
    return res.status(500).json({ message: 'Failed to fetch feedback', error: err.message });
  }
};

/**
 * GET /api/candidates/:candidateId/feedback/:feedbackId
 * Get specific feedback
 */
exports.getCandidateFeedbackById = async (req, res) => {
  try {
    const { candidateId, feedbackId } = req.params;

    if (!mongoose.isValidObjectId(candidateId) || !mongoose.isValidObjectId(feedbackId)) {
      return res.status(400).json({ message: 'Invalid id' });
    }

    const feedback = await CandidateFeedback.findOne({
      _id: feedbackId,
      candidate: candidateId,
      status: 'approved',
      isPublic: true
    }).populate('user', 'name');

    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    return res.json({ feedback: feedback.toPublicJSON() });
  } catch (err) {
    console.error('Error fetching feedback:', err);
    return res.status(500).json({ message: 'Failed to fetch feedback', error: err.message });
  }
};

/**
 * POST /api/candidates/:candidateId/feedback/:feedbackId/helpful
 * Mark feedback as helpful
 */
exports.markFeedbackHelpful = async (req, res) => {
  try {
    const { candidateId, feedbackId } = req.params;

    if (!mongoose.isValidObjectId(candidateId) || !mongoose.isValidObjectId(feedbackId)) {
      return res.status(400).json({ message: 'Invalid id' });
    }

    const feedback = await CandidateFeedback.findOneAndUpdate(
      { _id: feedbackId, candidate: candidateId },
      { $inc: { helpful: 1 } },
      { new: true }
    );

    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    return res.json({ feedback: feedback.toPublicJSON() });
  } catch (err) {
    console.error('Error marking feedback:', err);
    return res.status(500).json({ message: 'Failed to mark feedback', error: err.message });
  }
};

/**
 * POST /api/candidates/:candidateId/feedback/:feedbackId/unhelpful
 * Mark feedback as unhelpful
 */
exports.markFeedbackUnhelpful = async (req, res) => {
  try {
    const { candidateId, feedbackId } = req.params;

    if (!mongoose.isValidObjectId(candidateId) || !mongoose.isValidObjectId(feedbackId)) {
      return res.status(400).json({ message: 'Invalid id' });
    }

    const feedback = await CandidateFeedback.findOneAndUpdate(
      { _id: feedbackId, candidate: candidateId },
      { $inc: { unhelpful: 1 } },
      { new: true }
    );

    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    return res.json({ feedback: feedback.toPublicJSON() });
  } catch (err) {
    console.error('Error marking feedback:', err);
    return res.status(500).json({ message: 'Failed to mark feedback', error: err.message });
  }
};

// ===== ADMIN ENDPOINTS =====

/**
 * GET /api/admin/candidates/:candidateId/feedback
 * Get all feedback for a candidate (admin view)
 */
exports.getAdminCandidateFeedback = async (req, res) => {
  try {
    const { candidateId } = req.params;
    const { page: pageStr, limit: limitStr, status } = req.query;

    if (!mongoose.isValidObjectId(candidateId)) {
      return res.status(400).json({ message: 'Invalid candidate id' });
    }

    const page = Math.max(parseInt(pageStr || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(limitStr || '20', 10), 1), 100);
    const skip = (page - 1) * limit;

    const filter = { candidate: candidateId };
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      filter.status = status;
    }

    const [items, total] = await Promise.all([
      CandidateFeedback.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'name email'),
      CandidateFeedback.countDocuments(filter)
    ]);

    return res.json({
      page,
      limit,
      total,
      feedback: items.map(f => f.toPublicJSON())
    });
  } catch (err) {
    console.error('Error fetching admin feedback:', err);
    return res.status(500).json({ message: 'Failed to fetch feedback', error: err.message });
  }
};

/**
 * PATCH /api/admin/candidates/:candidateId/feedback/:feedbackId
 * Approve or reject feedback
 */
exports.updateCandidateFeedback = async (req, res) => {
  try {
    const { candidateId, feedbackId } = req.params;
    const { status, isPublic } = req.body;

    if (!mongoose.isValidObjectId(candidateId) || !mongoose.isValidObjectId(feedbackId)) {
      return res.status(400).json({ message: 'Invalid id' });
    }

    if (status && !['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const updates = {};
    if (status) updates.status = status;
    if (isPublic !== undefined) updates.isPublic = isPublic;

    const feedback = await CandidateFeedback.findOneAndUpdate(
      { _id: feedbackId, candidate: candidateId },
      updates,
      { new: true }
    );

    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    return res.json({ feedback: feedback.toPublicJSON() });
  } catch (err) {
    console.error('Error updating feedback:', err);
    return res.status(500).json({ message: 'Failed to update feedback', error: err.message });
  }
};

/**
 * DELETE /api/admin/candidates/:candidateId/feedback/:feedbackId
 * Delete feedback
 */
exports.deleteCandidateFeedback = async (req, res) => {
  try {
    const { candidateId, feedbackId } = req.params;

    if (!mongoose.isValidObjectId(candidateId) || !mongoose.isValidObjectId(feedbackId)) {
      return res.status(400).json({ message: 'Invalid id' });
    }

    const result = await CandidateFeedback.findOneAndDelete({
      _id: feedbackId,
      candidate: candidateId
    });

    if (!result) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    return res.json({ message: 'Feedback deleted successfully' });
  } catch (err) {
    console.error('Error deleting feedback:', err);
    return res.status(500).json({ message: 'Failed to delete feedback', error: err.message });
  }
};
