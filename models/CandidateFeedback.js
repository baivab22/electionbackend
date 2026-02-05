const mongoose = require('mongoose');

const FEEDBACK_TYPES = ['support', 'concern', 'question', 'suggestion'];
const RATINGS = [1, 2, 3, 4, 5];

const CandidateFeedbackSchema = new mongoose.Schema(
  {
    candidate: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Candidate', 
      required: true, 
      index: true 
    },
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: false, 
      index: true 
    },
    anonymous: { type: Boolean, default: true },
    
    // Contact info for anonymous feedback
    email: { type: String, default: null },
    name: { type: String, default: null },
    phone: { type: String, default: null },

    // Feedback content
    type: { type: String, enum: FEEDBACK_TYPES, required: true },
    rating: { type: Number, enum: RATINGS, required: true },
    comment: { type: String, required: true, minlength: 5, maxlength: 1000 },

    // Status
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    isPublic: { type: Boolean, default: false },

    // Metadata
    likes: { type: Number, default: 0 },
    helpful: { type: Number, default: 0 },
    unhelpful: { type: Number, default: 0 },

    // Timestamps
    createdAt: { type: Date, default: Date.now, index: true },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

CandidateFeedbackSchema.methods.toPublicJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  if (obj.anonymous) {
    delete obj.user;
    delete obj.email;
    delete obj.phone;
  }
  return obj;
};

// Indexes
CandidateFeedbackSchema.index({ candidate: 1, createdAt: -1 });
CandidateFeedbackSchema.index({ candidate: 1, status: 1 });
CandidateFeedbackSchema.index({ candidate: 1, rating: 1 });
CandidateFeedbackSchema.index({ user: 1, candidate: 1 });

module.exports = {
  CandidateFeedback: mongoose.model('CandidateFeedback', CandidateFeedbackSchema),
  FEEDBACK_TYPES,
  RATINGS
};
