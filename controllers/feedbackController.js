const { Feedback, FEEDBACK_CATEGORIES, FEEDBACK_TYPES, FEEDBACK_STATUSES, PRIORITY_LEVELS } = require('../models/Feedback');
const { Department } = require('../models/Department');
const mongoose = require('mongoose');

// Helper function
const pick = (obj, keys) => {
  return keys.reduce((result, key) => {
    if (key in obj) result[key] = obj[key];
    return result;
  }, {});
};

// ===== ADMIN ENDPOINTS =====

/**
 * GET /api/admin/feedback
 * Get all feedback with filters, sorting, and pagination
 */
exports.getAdminFeedback = async (req, res) => {
  try {
    const {
      type,
      category,
      status,
      priority,
      assignedDepartment,
      assignedTo,
      q,
      from,
      to,
      page: pageStr,
      limit: limitStr,
      isPublic
    } = req.query;

    const page = Math.max(parseInt(pageStr || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(limitStr || '20', 10), 1), 200);
    const skip = (page - 1) * limit;

    const filter = {};

    // Add filters
    if (type && FEEDBACK_TYPES.includes(type)) filter.type = type;
    if (category && FEEDBACK_CATEGORIES.includes(category)) filter.category = category;
    if (status && FEEDBACK_STATUSES.includes(status)) filter.status = status;
    if (priority && PRIORITY_LEVELS.includes(priority)) filter.priority = priority;
    if (assignedDepartment) filter.assignedDepartment = assignedDepartment;
    if (assignedTo && mongoose.isValidObjectId(assignedTo)) filter.assignedTo = assignedTo;
    if (isPublic === 'true') filter.isPublic = true;
    if (isPublic === 'false') filter.isPublic = false;

    // Date range filter
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    // Search in subject and description
    if (q) {
      filter.$or = [
        { subject: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { resolutionNotes: { $regex: q, $options: 'i' } }
      ];
    }

    const [items, total] = await Promise.all([
      Feedback.find(filter)
        .populate('user', 'name email role')
        .populate('assignedTo', 'name email department')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Feedback.countDocuments(filter)
    ]);

    return res.json({
      page,
      limit,
      total,
      feedback: items.map((d) => d.toPublicJSON())
    });
  } catch (err) {
    console.error('Error fetching admin feedback:', err);
    return res.status(500).json({ message: 'Failed to fetch feedback', error: err.message });
  }
};

/**
 * PATCH /api/admin/feedback/:id
 * Update feedback (status, priority, assignment, resolution)
 */
exports.updateFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid feedback id' });
    }

    const updates = pick(req.body || {}, [
      'status',
      'priority',
      'assignedDepartment',
      'assignedTo',
      'resolutionNotes',
      'isPublic',
      'tags'
    ]);

    // Validate status
    if (updates.status && !FEEDBACK_STATUSES.includes(updates.status)) {
      return res.status(400).json({
        message: `Invalid status. Allowed: ${FEEDBACK_STATUSES.join(', ')}`
      });
    }

    // Validate priority
    if (updates.priority && !PRIORITY_LEVELS.includes(updates.priority)) {
      return res.status(400).json({
        message: `Invalid priority. Allowed: ${PRIORITY_LEVELS.join(', ')}`
      });
    }

    // Validate department
    if (updates.assignedDepartment) {
      const department = await Department.findOne({
        name: updates.assignedDepartment,
        isActive: true
      });
      if (!department) {
        return res.status(400).json({ message: 'Invalid or inactive department' });
      }
    }

    // Validate assignedTo user
    if (updates.assignedTo) {
      if (!mongoose.isValidObjectId(updates.assignedTo)) {
        return res.status(400).json({ message: 'Invalid user id for assignment' });
      }
    }

    // Set assignment date
    if (updates.assignedDepartment || updates.assignedTo) {
      updates.assignedDate = new Date();
    }

    // Set resolution date if status is Resolved or Closed
    if (updates.status && ['Resolved', 'Closed'].includes(updates.status)) {
      updates.resolutionDate = new Date();
    }

    const doc = await Feedback.findByIdAndUpdate(id, updates, { new: true })
      .populate('user', 'name email role')
      .populate('assignedTo', 'name email department');

    if (!doc) return res.status(404).json({ message: 'Feedback not found' });

    return res.json({ feedback: doc.toPublicJSON() });
  } catch (err) {
    console.error('Error updating feedback:', err);
    return res.status(500).json({ message: 'Failed to update feedback', error: err.message });
  }
};

/**
 * POST /api/admin/feedback/:id/response
 * Add response to feedback
 */
exports.addFeedbackResponse = async (req, res) => {
  try {
    const { id } = req.params;
    const { respondentName, content } = req.body;
    const respondentId = req.user?.id;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid feedback id' });
    }

    if (!respondentName || !content) {
      return res.status(400).json({ message: 'Respondent name and content are required' });
    }

    if (content.length < 10 || content.length > 5000) {
      return res.status(400).json({ message: 'Content must be between 10 and 5000 characters' });
    }

    const feedback = await Feedback.findById(id);
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    feedback.addResponse(respondentId, respondentName, content, []);
    await feedback.save();

    return res.json({ feedback: feedback.toPublicJSON() });
  } catch (err) {
    console.error('Error adding response:', err);
    return res.status(500).json({ message: 'Failed to add response', error: err.message });
  }
};

/**
 * DELETE /api/admin/feedback/:id
 * Delete feedback
 */
exports.deleteFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid feedback id' });
    }

    const result = await Feedback.findByIdAndDelete(id);
    if (!result) return res.status(404).json({ message: 'Feedback not found' });

    return res.json({ message: 'Feedback deleted successfully' });
  } catch (err) {
    console.error('Error deleting feedback:', err);
    return res.status(500).json({ message: 'Failed to delete feedback', error: err.message });
  }
};

// ===== PUBLIC ENDPOINTS =====

/**
 * GET /api/feedback/public
 * Get public feedback (testimonials)
 */
exports.getPublicFeedback = async (req, res) => {
  try {
    const {
      category,
      type,
      page: pageStr,
      limit: limitStr
    } = req.query;

    const page = Math.max(parseInt(pageStr || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(limitStr || '10', 10), 1), 50);
    const skip = (page - 1) * limit;

    const filter = { isPublic: true, status: 'Resolved' };

    if (category && FEEDBACK_CATEGORIES.includes(category)) {
      filter.category = category;
    }

    if (type && FEEDBACK_TYPES.includes(type)) {
      filter.type = type;
    }

    const [items, total] = await Promise.all([
      Feedback.find(filter)
        .select('type category subject description contactName createdAt likes')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Feedback.countDocuments(filter)
    ]);

    return res.json({
      page,
      limit,
      total,
      feedback: items
    });
  } catch (err) {
    console.error('Error fetching public feedback:', err);
    return res.status(500).json({ message: 'Failed to fetch feedback', error: err.message });
  }
};

/**
 * POST /api/feedback
 * Create new feedback
 */
exports.createFeedback = async (req, res) => {
  try {
    const {
      type,
      category,
      subject,
      description,
      anonymous,
      contactEmail,
      contactPhone,
      contactName,
      assignedDepartment
    } = req.body;

    // Validation
    if (!type || !FEEDBACK_TYPES.includes(type)) {
      return res.status(400).json({
        message: `Invalid type. Allowed: ${FEEDBACK_TYPES.join(', ')}`
      });
    }

    if (!category || !FEEDBACK_CATEGORIES.includes(category)) {
      return res.status(400).json({
        message: `Invalid category. Allowed: ${FEEDBACK_CATEGORIES.join(', ')}`
      });
    }

    if (!subject || subject.length < 5 || subject.length > 200) {
      return res.status(400).json({ message: 'Subject must be between 5 and 200 characters' });
    }

    if (!description || description.length < 10 || description.length > 5000) {
      return res.status(400).json({ message: 'Description must be between 10 and 5000 characters' });
    }

    // If not anonymous, require contact info
    if (!anonymous && !contactEmail) {
      return res.status(400).json({ message: 'Email is required for identified feedback' });
    }

    // Validate department if provided
    if (assignedDepartment) {
      const department = await Department.findOne({
        name: assignedDepartment,
        isActive: true
      });
      if (!department) {
        return res.status(400).json({ message: 'Invalid or inactive department' });
      }
    }

    const feedbackData = {
      type,
      category,
      subject,
      description,
      anonymous: anonymous === true || anonymous === 'true',
      user: req.user?.id || null
    };

    if (!feedbackData.anonymous) {
      feedbackData.contactEmail = contactEmail;
      feedbackData.contactPhone = contactPhone;
      feedbackData.contactName = contactName || req.user?.name;
    }

    if (assignedDepartment && assignedDepartment !== 'none') {
      feedbackData.assignedDepartment = assignedDepartment;
    }

    const feedback = new Feedback(feedbackData);
    await feedback.save();

    return res.status(201).json({
      message: 'Feedback submitted successfully',
      feedback: feedback.toPublicJSON()
    });
  } catch (err) {
    console.error('Error creating feedback:', err);
    return res.status(500).json({ message: 'Failed to submit feedback', error: err.message });
  }
};

/**
 * GET /api/feedback/:id
 * Get feedback by ID
 */
exports.getFeedbackById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid feedback id' });
    }

    const feedback = await Feedback.findById(id)
      .populate('user', 'name email role')
      .populate('assignedTo', 'name email department')
      .populate('responses.respondent', 'name email department');

    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    // Mark as read if user is admin
    if (req.user?.role === 'admin') {
      feedback.markAsRead(req.user.id);
      await feedback.save();
    }

    return res.json({ feedback: feedback.toPublicJSON() });
  } catch (err) {
    console.error('Error fetching feedback:', err);
    return res.status(500).json({ message: 'Failed to fetch feedback', error: err.message });
  }
};

/**
 * GET /api/feedback/user/my-feedback
 * Get user's own feedback
 */
exports.getUserFeedback = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { page: pageStr, limit: limitStr } = req.query;
    const page = Math.max(parseInt(pageStr || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(limitStr || '10', 10), 1), 50);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Feedback.find({ user: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Feedback.countDocuments({ user: userId })
    ]);

    return res.json({
      page,
      limit,
      total,
      feedback: items.map(f => f.toPublicJSON())
    });
  } catch (err) {
    console.error('Error fetching user feedback:', err);
    return res.status(500).json({ message: 'Failed to fetch your feedback', error: err.message });
  }
};

/**
 * POST /api/feedback/:id/like
 * Like feedback (public testimonial)
 */
exports.likeFeedback = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid feedback id' });
    }

    const feedback = await Feedback.findByIdAndUpdate(
      id,
      { $inc: { likes: 1 } },
      { new: true }
    );

    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    return res.json({ feedback: feedback.toPublicJSON() });
  } catch (err) {
    console.error('Error liking feedback:', err);
    return res.status(500).json({ message: 'Failed to like feedback', error: err.message });
  }
};

// ===== STATISTICS ENDPOINTS =====

/**
 * GET /api/admin/feedback/stats/overview
 * Get feedback statistics
 */
exports.getFeedbackStats = async (req, res) => {
  try {
    const stats = await Feedback.aggregate([
      {
        $facet: {
          byType: [
            { $group: { _id: '$type', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
          ],
          byCategory: [
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
          ],
          byStatus: [
            { $group: { _id: '$status', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
          ],
          byPriority: [
            { $group: { _id: '$priority', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
          ],
          total: [
            { $count: 'count' }
          ],
          recentFeedback: [
            { $sort: { createdAt: -1 } },
            { $limit: 10 }
          ]
        }
      }
    ]);

    return res.json({
      stats: stats[0],
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error fetching stats:', err);
    return res.status(500).json({ message: 'Failed to fetch statistics', error: err.message });
  }
};
