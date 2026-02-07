const Poll = require('../models/Poll');
const PollVote = require('../models/PollVote');

// Create a new poll (admin)
exports.createPoll = async (req, res) => {
  try {
    const { title, description, choices = [], startAt, endAt, allowAnonymous = true, maxVotesPerVoter = 1 } = req.body;

    if (!title || !Array.isArray(choices) || choices.length < 2) {
      return res.status(400).json({ success: false, message: 'Title and at least two choices are required' });
    }

    const poll = await Poll.create({
      title,
      description,
      choices: choices.map(c => ({ label: c.label || c })),
      startAt: startAt ? new Date(startAt) : undefined,
      endAt: endAt ? new Date(endAt) : undefined,
      allowAnonymous,
      maxVotesPerVoter,
      createdBy: req.user?.id
    });

    res.status(201).json({ success: true, data: poll });
  } catch (error) {
    console.error('Error creating poll:', error);
    res.status(500).json({ success: false, message: 'Server error creating poll', error: error.message });
  }
};

// List polls
exports.listPolls = async (req, res) => {
  try {
    const { activeOnly } = req.query;
    const query = {};
    if (activeOnly === 'true') query.isActive = true;

    const polls = await Poll.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: polls });
  } catch (error) {
    console.error('Error listing polls:', error);
    res.status(500).json({ success: false, message: 'Server error listing polls', error: error.message });
  }
};

// Get a single poll
exports.getPoll = async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) return res.status(404).json({ success: false, message: 'Poll not found' });
    res.json({ success: true, data: poll });
  } catch (error) {
    console.error('Error getting poll:', error);
    res.status(500).json({ success: false, message: 'Server error getting poll', error: error.message });
  }
};

// Vote on a poll (public, supports anonymous)
exports.vote = async (req, res) => {
  try {
    const pollId = req.params.id;
    const { choiceId, voterId } = req.body;

    if (!choiceId) return res.status(400).json({ success: false, message: 'choiceId is required' });

    const poll = await Poll.findById(pollId);
    if (!poll) return res.status(404).json({ success: false, message: 'Poll not found' });

    if (!poll.isOpen()) {
      return res.status(403).json({ success: false, message: 'Poll is closed' });
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    // Check allowAnonymous
    if (!poll.allowAnonymous && !voterId) {
      return res.status(403).json({ success: false, message: 'Authentication required to vote on this poll' });
    }

    // Check if voter already voted
    const already = await PollVote.hasVoted(pollId, { voterId, ipAddress });
    if (already) return res.status(400).json({ success: false, message: 'You have already voted' });

    // Create vote
    const vote = await PollVote.create({ pollId, choiceId, voterId, ipAddress, userAgent });

    // Increment choice count
    const choice = poll.choices.id(choiceId) || poll.choices.find(c => String(c._id) === String(choiceId));
    if (!choice) {
      // If choiceId not found, remove vote and return error
      await vote.deleteOne();
      return res.status(400).json({ success: false, message: 'Invalid choice' });
    }

    choice.votesCount = (choice.votesCount || 0) + 1;
    await poll.save();

    res.status(201).json({ success: true, message: 'Vote recorded', data: { voteId: vote._id } });
  } catch (error) {
    console.error('Error voting:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Duplicate vote detected' });
    }
    res.status(500).json({ success: false, message: 'Server error while voting', error: error.message });
  }
};

// Get poll results
exports.results = async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) return res.status(404).json({ success: false, message: 'Poll not found' });

    const totalVotes = poll.choices.reduce((s, c) => s + (c.votesCount || 0), 0);
    const choices = poll.choices.map(c => ({ id: c._id, label: c.label, votes: c.votesCount || 0, percentage: totalVotes > 0 ? ((c.votesCount || 0) / totalVotes * 100).toFixed(2) : '0.00' }));

    res.json({ success: true, data: { pollId: poll._id, title: poll.title, totalVotes, choices } });
  } catch (error) {
    console.error('Error getting results:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching results', error: error.message });
  }
};

// Check if a voter has voted
exports.checkStatus = async (req, res) => {
  try {
    const pollId = req.params.id;
    const { voterId } = req.query;
    const ipAddress = req.ip || req.connection.remoteAddress;

    const hasVoted = await PollVote.hasVoted(pollId, { voterId, ipAddress });
    res.json({ success: true, data: { hasVoted } });
  } catch (error) {
    console.error('Error checking poll status:', error);
    res.status(500).json({ success: false, message: 'Server error while checking status', error: error.message });
  }
};

// Admin toggle poll
exports.togglePoll = async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) return res.status(404).json({ success: false, message: 'Poll not found' });
    poll.isActive = req.body.isActive !== undefined ? !!req.body.isActive : !poll.isActive;
    await poll.save();
    res.json({ success: true, data: { pollId: poll._id, isActive: poll.isActive } });
  } catch (error) {
    console.error('Error toggling poll:', error);
    res.status(500).json({ success: false, message: 'Server error while toggling poll', error: error.message });
  }
};

module.exports = {
  createPoll: exports.createPoll,
  listPolls: exports.listPolls,
  getPoll: exports.getPoll,
  vote: exports.vote,
  results: exports.results,
  checkStatus: exports.checkStatus,
  togglePoll: exports.togglePoll
};
