const mongoose = require('mongoose');

const ChoiceSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
  label: { type: String, required: true },
  metadata: { type: mongoose.Schema.Types.Mixed },
  votesCount: { type: Number, default: 0 }
}, { _id: false });

const PollSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  choices: { type: [ChoiceSchema], required: true },
  startAt: { type: Date, default: Date.now },
  endAt: { type: Date },
  isActive: { type: Boolean, default: true },
  allowAnonymous: { type: Boolean, default: true },
  maxVotesPerVoter: { type: Number, default: 1 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

PollSchema.methods.isOpen = function() {
  const now = new Date();
  if (!this.isActive) return false;
  if (this.startAt && now < this.startAt) return false;
  if (this.endAt && now > this.endAt) return false;
  return true;
};

module.exports = mongoose.model('Poll', PollSchema);
