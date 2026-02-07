const Candidate = require('../models/Candidate');
const Vote = require('../models/Vote');

// @desc    Cast a vote for a candidate
// @route   POST /api/candidates/:id/vote
// @access  Public
exports.castVote = async (req, res) => {
  try {
    const { id: candidateId } = req.params;
    const { voterId, voterEmail, voterName, constituency } = req.body;

    // Validate required fields
    if (!voterId) {
      return res.status(400).json({
        success: false,
        message: 'Voter ID is required'
      });
    }

    // Check if candidate exists and voting is enabled
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    if (!candidate.votingEnabled) {
      return res.status(403).json({
        success: false,
        message: 'Voting is currently disabled for this candidate'
      });
    }

    if (!candidate.isActive) {
      return res.status(403).json({
        success: false,
        message: 'This candidate is not active'
      });
    }

    // Check if voter has already voted for this candidate
    const hasVoted = await Vote.hasVoted(candidateId, voterId);
    if (hasVoted) {
      return res.status(400).json({
        success: false,
        message: 'You have already voted for this candidate'
      });
    }

    // Get IP address and user agent
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    // Create the vote
    const vote = await Vote.create({
      candidateId,
      voterId,
      voterEmail,
      voterName,
      ipAddress,
      constituency,
      metadata: {
        userAgent
      }
    });

    // Increment vote count in candidate
    candidate.votes = (candidate.votes || 0) + 1;
    await candidate.save();

    res.status(201).json({
      success: true,
      message: 'Vote cast successfully',
      data: {
        candidateId: candidate._id,
        candidateName: candidate.personalInfo.fullName,
        totalVotes: candidate.votes,
        voteId: vote._id
      }
    });
  } catch (error) {
    console.error('Error casting vote:', error);
    
    // Handle duplicate vote attempt
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You have already voted for this candidate'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while casting vote',
      error: error.message
    });
  }
};

// @desc    Remove a vote for a candidate
// @route   DELETE /api/candidates/:id/vote
// @access  Public (with voterId verification)
exports.removeVote = async (req, res) => {
  try {
    const { id: candidateId } = req.params;
    const { voterId } = req.body;

    if (!voterId) {
      return res.status(400).json({
        success: false,
        message: 'Voter ID is required'
      });
    }

    // Find and delete the vote
    const vote = await Vote.findOneAndDelete({ candidateId, voterId });

    if (!vote) {
      return res.status(404).json({
        success: false,
        message: 'Vote not found'
      });
    }

    // Decrement vote count in candidate
    const candidate = await Candidate.findById(candidateId);
    if (candidate) {
      candidate.votes = Math.max(0, (candidate.votes || 0) - 1);
      await candidate.save();
    }

    res.status(200).json({
      success: true,
      message: 'Vote removed successfully',
      data: {
        candidateId,
        totalVotes: candidate ? candidate.votes : 0
      }
    });
  } catch (error) {
    console.error('Error removing vote:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while removing vote',
      error: error.message
    });
  }
};

// @desc    Check if a voter has voted for a candidate
// @route   GET /api/candidates/:id/vote/check
// @access  Public
exports.checkVoteStatus = async (req, res) => {
  try {
    const { id: candidateId } = req.params;
    const { voterId } = req.query;

    if (!voterId) {
      return res.status(400).json({
        success: false,
        message: 'Voter ID is required'
      });
    }

    const hasVoted = await Vote.hasVoted(candidateId, voterId);
    const candidate = await Candidate.findById(candidateId).select('votes votingEnabled personalInfo.fullName');

    res.status(200).json({
      success: true,
      data: {
        hasVoted,
        candidateId,
        candidateName: candidate?.personalInfo?.fullName,
        totalVotes: candidate?.votes || 0,
        votingEnabled: candidate?.votingEnabled || false
      }
    });
  } catch (error) {
    console.error('Error checking vote status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while checking vote status',
      error: error.message
    });
  }
};

// @desc    Get vote count for a candidate
// @route   GET /api/candidates/:id/votes/count
// @access  Public
exports.getVoteCount = async (req, res) => {
  try {
    const { id: candidateId } = req.params;

    const candidate = await Candidate.findById(candidateId)
      .select('personalInfo.fullName votes votePercentage votingEnabled');

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    const votingStats = await Vote.getVotingStats(candidateId);

    res.status(200).json({
      success: true,
      data: {
        candidateId,
        candidateName: candidate.personalInfo.fullName,
        votes: candidate.votes,
        votePercentage: candidate.votePercentage,
        votingEnabled: candidate.votingEnabled,
        stats: votingStats
      }
    });
  } catch (error) {
    console.error('Error getting vote count:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while getting vote count',
      error: error.message
    });
  }
};

// @desc    Get voting statistics for all candidates
// @route   GET /api/candidates/votes/statistics
// @access  Public
exports.getAllVotingStats = async (req, res) => {
  try {
    const { constituency, candidacyLevel, partyName } = req.query;

    let query = { isActive: true, votingEnabled: true };
    if (constituency) query['politicalInfo.constituency'] = { $regex: constituency, $options: 'i' };
    if (candidacyLevel) query['politicalInfo.candidacyLevel'] = candidacyLevel;
    if (partyName) query['politicalInfo.partyName'] = { $regex: partyName, $options: 'i' };

    const candidates = await Candidate.find(query)
      .select('personalInfo.fullName personalInfo.profilePhoto politicalInfo votes votePercentage')
      .sort({ votes: -1 });

    // Calculate total votes across all candidates
    const totalVotes = candidates.reduce((sum, candidate) => sum + (candidate.votes || 0), 0);

    // Update vote percentages
    for (const candidate of candidates) {
      if (totalVotes > 0) {
        candidate.votePercentage = ((candidate.votes || 0) / totalVotes * 100).toFixed(2);
        await candidate.save();
      }
    }

    res.status(200).json({
      success: true,
      data: {
        totalVotes,
        totalCandidates: candidates.length,
        candidates: candidates.map(c => ({
          id: c._id,
          name: c.personalInfo?.fullName,
          photo: c.personalInfo?.profilePhoto,
          party: c.politicalInfo?.partyName,
          constituency: c.politicalInfo?.constituency,
          votes: c.votes || 0,
          votePercentage: c.votePercentage || 0
        }))
      }
    });
  } catch (error) {
    console.error('Error getting voting statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while getting voting statistics',
      error: error.message
    });
  }
};

// @desc    Enable/Disable voting for a candidate (Admin only)
// @route   PUT /api/candidates/:id/voting/toggle
// @access  Private (Admin)
exports.toggleVoting = async (req, res) => {
  try {
    const { id: candidateId } = req.params;
    const { votingEnabled } = req.body;

    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    candidate.votingEnabled = votingEnabled !== undefined ? votingEnabled : !candidate.votingEnabled;
    await candidate.save();

    res.status(200).json({
      success: true,
      message: `Voting ${candidate.votingEnabled ? 'enabled' : 'disabled'} successfully`,
      data: {
        candidateId: candidate._id,
        votingEnabled: candidate.votingEnabled
      }
    });
  } catch (error) {
    console.error('Error toggling voting:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while toggling voting',
      error: error.message
    });
  }
};

// @desc    Get voters list for a candidate (Admin only)
// @route   GET /api/candidates/:id/voters
// @access  Private (Admin)
exports.getVotersList = async (req, res) => {
  try {
    const { id: candidateId } = req.params;
    const { page = 1, limit = 50, verified } = req.query;

    const query = { candidateId };
    if (verified !== undefined) {
      query.isVerified = verified === 'true';
    }

    const votes = await Vote.find(query)
      .select('voterName voterEmail constituency voteTimestamp isVerified')
      .sort({ voteTimestamp: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const totalVotes = await Vote.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        votes,
        totalVotes,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalVotes / limit)
      }
    });
  } catch (error) {
    console.error('Error getting voters list:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while getting voters list',
      error: error.message
    });
  }
};

module.exports = {
  castVote: exports.castVote,
  removeVote: exports.removeVote,
  checkVoteStatus: exports.checkVoteStatus,
  getVoteCount: exports.getVoteCount,
  getAllVotingStats: exports.getAllVotingStats,
  toggleVoting: exports.toggleVoting,
  getVotersList: exports.getVotersList
};
