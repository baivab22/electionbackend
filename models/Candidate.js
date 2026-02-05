const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
  // Basic Information
  personalInfo: {
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    fullName_np: {
      type: String,
      trim: true
    },
    position: {
      type: String,
      enum: ['President', 'Vice President', 'Parliamentary', 'Local Body', 'Other'],
      required: true
    },
    position_np: {
      type: String,
      trim: true
    },
    constituency: {
      type: String,
      required: true,
      trim: true
    },
    constituency_np: {
      type: String,
      trim: true
    },
    dateOfBirth: {
      type: Date,
      required: true
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      required: true
    },
    contactNumber: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    address: {
      type: String,
      trim: true
    }
  },

  // Biography
  biography: {
    bio_en: {
      type: String
    },
    bio_np: {
      type: String
    },
    backgroundEducation: {
      type: String
    },
    backgroundEducation_np: {
      type: String
    },
    experience: {
      type: String
    },
    experience_np: {
      type: String
    },
    profilePhoto: {
      type: String // File path to profile photo
    }
  },

  // Manifesto
  manifesto: {
    title_en: {
      type: String,
      maxlength: [300, 'Title cannot be more than 300 characters']
    },
    title_np: {
      type: String,
      maxlength: [300, 'Title cannot be more than 300 characters']
    },
    content_en: {
      type: String,
      maxlength: [5000, 'Manifesto content cannot be more than 5000 characters']
    },
    content_np: {
      type: String,
      maxlength: [5000, 'Manifesto content cannot be more than 5000 characters']
    },
    manifestoBrochure: {
      type: String // File path to PDF or document
    }
  },

  // Key Issues
  issues: [
    {
      issueTitle_en: {
        type: String,
        maxlength: [200, 'Issue title cannot be more than 200 characters']
      },
      issueTitle_np: {
        type: String,
        maxlength: [200, 'Issue title cannot be more than 200 characters']
      },
      issueDescription_en: {
        type: String,
        maxlength: [1000, 'Issue description cannot be more than 1000 characters']
      },
      issueDescription_np: {
        type: String,
        maxlength: [1000, 'Issue description cannot be more than 1000 characters']
      },
      issueCategory: {
        type: String,
        enum: ['Healthcare', 'Education', 'Economy', 'Infrastructure', 'Environment', 'Security', 'Agriculture', 'Other'],
        default: 'Other'
      },
      priority: {
        type: Number,
        default: 5,
        min: 1,
        max: 10
      }
    }
  ],

  // Achievements
  achievements: [
    {
      achievementTitle_en: {
        type: String,
        required: true,
        maxlength: [300, 'Achievement title cannot be more than 300 characters']
      },
      achievementTitle_np: {
        type: String,
        maxlength: [300, 'Achievement title cannot be more than 300 characters']
      },
      achievementDescription_en: {
        type: String,
        maxlength: [1500, 'Achievement description cannot be more than 1500 characters']
      },
      achievementDescription_np: {
        type: String,
        maxlength: [1500, 'Achievement description cannot be more than 1500 characters']
      },
      achievementDate: {
        type: Date
      },
      achievementCategory: {
        type: String,
        enum: ['Award', 'Project', 'Initiative', 'Community Work', 'Public Service', 'Other'],
        default: 'Other'
      },
      achievementImage: {
        type: String // File path to image
      }
    }
  ],

  // Social Media & Links
  socialMedia: {
    facebook: String,
    twitter: String,
    instagram: String,
    youtube: String,
    website: String
  },

  // Campaign Info
  campaign: {
    campaignStartDate: Date,
    campaignEndDate: Date,
    campaignSlogan_en: String,
    campaignSlogan_np: String,
    votingTarget: {
      type: Number,
      default: 0
    },
    campaignBudget: {
      type: Number,
      default: 0
    },
    campaignManager: {
      name: String,
      email: String,
      phone: String
    }
  },

  // Social Engagement
  likes: {
    type: Number,
    default: 0
  },
  likedBy: [{
    type: String // Store IP or session ID for anonymous likes
  }],
  comments: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      trim: true
    },
    comment: {
      type: String,
      required: true,
      maxlength: 1000
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    isApproved: {
      type: Boolean,
      default: false // Comments need admin approval
    }
  }],
  shares: {
    type: Number,
    default: 0
  },

  // Status & Metadata
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
candidateSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Candidate', candidateSchema);
