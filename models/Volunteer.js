const mongoose = require('mongoose');

const volunteerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    district: {
      type: String,
      required: true,
      trim: true,
    },
    municipality: {
      type: String,
      trim: true,
    },
    skills: [
      {
        type: String,
        enum: [
          'social_media',
          'field_work',
          'data_entry',
          'event_org',
          'content',
          'translation',
          'logistics',
          'fundraising',
          'media',
          'training'
        ],
      },
    ],
    availability: [
      {
        type: String,
        enum: ['weekdays', 'evenings', 'weekends', 'flexible'],
      },
    ],
    motivation: {
      type: String,
      trim: true,
    },
    agreeTerms: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    notes: {
      type: String,
      trim: true,
    },
    registeredAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
volunteerSchema.index({ email: 1 });
volunteerSchema.index({ phone: 1 });
volunteerSchema.index({ district: 1 });
volunteerSchema.index({ status: 1 });

module.exports = mongoose.model('Volunteer', volunteerSchema);
