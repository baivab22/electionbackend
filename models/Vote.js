const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',
    required: true
  },
  voterId: {
    type: String,
    required: true,
    trim: true
  },
  voterEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  voterName: {
    type: String,
    trim: true
  },
  ipAddress: {
    type: String,
    trim: true
  },
  deviceFingerprint: {
    type: String,
    trim: true
  },
  constituency: {
    type: String,
    trim: true
  },
  voteTimestamp: {
    type: Date,
    default: Date.now
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  metadata: {
    userAgent: String,
    location: {
      city: String,
      state: String,
      country: String
    }
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate voting
voteSchema.index({ candidateId: 1, voterId: 1 }, { unique: true });
voteSchema.index({ candidateId: 1, voterEmail: 1 });
voteSchema.index({ candidateId: 1, ipAddress: 1 });
voteSchema.index({ voteTimestamp: -1 });

// Method to check if a voter has already voted for this candidate
voteSchema.statics.hasVoted = async function(candidateId, voterId) {
  const vote = await this.findOne({ candidateId, voterId });
  return !!vote;
};

// Method to get total votes for a candidate
voteSchema.statics.countVotes = async function(candidateId) {
  return await this.countDocuments({ candidateId });
};

// Method to get voting statistics
voteSchema.statics.getVotingStats = async function(candidateId) {
  const totalVotes = await this.countDocuments({ candidateId });
  const verifiedVotes = await this.countDocuments({ candidateId, isVerified: true });
  
  return {
    totalVotes,
    verifiedVotes,
    unverifiedVotes: totalVotes - verifiedVotes
  };
};

module.exports = mongoose.model('Vote', voteSchema);
