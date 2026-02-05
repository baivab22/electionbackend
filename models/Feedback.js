const mongoose = require('mongoose');

const FEEDBACK_CATEGORIES = ['service_quality', 'staff_conduct', 'response_time', 'transparency', 'accessibility', 'other'];
const FEEDBACK_TYPES = ['compliment', 'complaint', 'suggestion', 'inquiry'];
const FEEDBACK_STATUSES = ['Received', 'In Process', 'Resolved', 'Closed'];
const PRIORITY_LEVELS = ['low', 'medium', 'high', 'urgent'];

const MediaSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['image', 'video', 'document'], required: true },
    url: { type: String, required: true },
    filename: { type: String, required: true },
    mimetype: { type: String, required: true },
    size: { type: Number, required: true }
  },
  { _id: false }
);

const ResponseSchema = new mongoose.Schema(
  {
    respondent: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    respondentName: { type: String, required: true },
    respondentDepartment: { type: String, default: null },
    content: { type: String, required: true, minlength: 10, maxlength: 5000 },
    media: { type: [MediaSchema], default: [] },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: true }
);

const FeedbackSchema = new mongoose.Schema(
  {
    // User info
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false, index: true },
    anonymous: { type: Boolean, default: false },
    
    // Contact info for anonymous feedback
    contactEmail: { type: String, default: null },
    contactPhone: { type: String, default: null },
    contactName: { type: String, default: null },

    // Feedback content
    type: { type: String, enum: FEEDBACK_TYPES, required: true, index: true },
    category: { type: String, enum: FEEDBACK_CATEGORIES, required: true, index: true },
    subject: { type: String, required: true, minlength: 5, maxlength: 200 },
    description: { type: String, required: true, minlength: 10, maxlength: 5000 },

    // Status tracking
    status: { type: String, enum: FEEDBACK_STATUSES, default: 'Received', index: true },
    priority: { type: String, enum: PRIORITY_LEVELS, default: 'medium', index: true },

    // Assignment
    assignedDepartment: { type: String, default: null, index: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    assignedDate: { type: Date, default: null },

    // Resolution tracking
    resolutionDate: { type: Date, default: null },
    resolutionNotes: { type: String, default: null, maxlength: 5000 },
    responses: { type: [ResponseSchema], default: [] },

    // Media attachments
    media: { type: [MediaSchema], default: [] },

    // Metadata
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    likes: { type: Number, default: 0 },
    isPublic: { type: Boolean, default: false }, // Can be made public for testimonials
    tags: [{ type: String }],

    // Timestamps
    createdAt: { type: Date, default: Date.now, index: true },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// Methods
FeedbackSchema.methods.toPublicJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  if (obj.anonymous) {
    delete obj.user;
    delete obj.contactEmail;
    delete obj.contactPhone;
  }
  return obj;
};

FeedbackSchema.methods.addResponse = function (respondent, respondentName, content, media = []) {
  if (!this.responses) {
    this.responses = [];
  }
  this.responses.push({
    respondent,
    respondentName,
    respondentDepartment: respondent.department || null,
    content,
    media
  });
  this.updatedAt = new Date();
};

FeedbackSchema.methods.markAsRead = function (userId) {
  if (!this.readBy.includes(userId)) {
    this.readBy.push(userId);
  }
};

// Pre-save middleware
FeedbackSchema.pre('save', async function (next) {
  // Validate assignedDepartment if provided
  if (this.assignedDepartment && this.isModified('assignedDepartment')) {
    try {
      const Department = mongoose.model('Department');
      const department = await Department.findOne({
        name: this.assignedDepartment,
        isActive: true
      });

      if (!department) {
        const error = new Error('Invalid or inactive department');
        error.name = 'ValidationError';
        return next(error);
      }
    } catch (err) {
      if (err.message.includes("Schema hasn't been registered")) {
        return next();
      }
      return next(err);
    }
  }

  // Update timestamp
  this.updatedAt = new Date();

  next();
});

// Indexes
FeedbackSchema.index({ createdAt: -1 });
FeedbackSchema.index({ category: 1, status: 1 });
FeedbackSchema.index({ assignedDepartment: 1, status: 1 });
FeedbackSchema.index({ type: 1, priority: 1 });
FeedbackSchema.index({ user: 1, createdAt: -1 });

module.exports = {
  Feedback: mongoose.model('Feedback', FeedbackSchema),
  FEEDBACK_CATEGORIES,
  FEEDBACK_TYPES,
  FEEDBACK_STATUSES,
  PRIORITY_LEVELS
};
