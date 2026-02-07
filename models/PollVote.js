const mongoose = require('mongoose');

const PollVoteSchema = new mongoose.Schema({
  pollId: { type: mongoose.Schema.Types.ObjectId, ref: 'Poll', required: true, index: true },
  choiceId: { type: mongoose.Schema.Types.ObjectId, required: true },
  voterId: { type: String, index: true }, // optional identifier for authenticated voters
  ipAddress: { type: String, index: true },
  userAgent: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed },
  voteTimestamp: { type: Date, default: Date.now }
});

// Prevent duplicate votes for same voterId if provided
PollVoteSchema.index({ pollId: 1, voterId: 1 }, { unique: true, sparse: true });
// Prevent duplicate anonymous votes by IP address
PollVoteSchema.index({ pollId: 1, ipAddress: 1 }, { unique: true, sparse: true });

// Convenience: check if a voter has voted
PollVoteSchema.statics.hasVoted = async function(pollId, { voterId, ipAddress }) {
  if (voterId) {
    const exists = await this.exists({ pollId, voterId });
    if (exists) return true;
  }
  if (ipAddress) {
    const exists = await this.exists({ pollId, ipAddress });
    return !!exists;
  }
  return false;
};

module.exports = mongoose.model('PollVote', PollVoteSchema);
