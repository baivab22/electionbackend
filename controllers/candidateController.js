const Candidate = require('../models/Candidate');
const { validationResult } = require('express-validator');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');

// Helper function to parse nested objects from FormData
const parseNestedObject = (obj, prefix) => {
  const result = {};
  const prefixPattern = `${prefix}[`;
  
  Object.keys(obj).forEach(key => {
    if (key.startsWith(prefixPattern)) {
      const match = key.match(new RegExp(`^${prefix}\\[([^\\]]+)\\]$`));
      if (match) {
        const nestedKey = match[1];
        result[nestedKey] = obj[key];
      }
    }
  });
  
  return Object.keys(result).length > 0 ? result : null;
};

// @desc    Get all candidates
// @route   GET /api/candidates
// @access  Public
exports.getAllCandidates = async (req, res) => {
  try {
    const { position, isActive, constituency, partyName, candidacyLevel } = req.query;
    
    let query = {};
    if (position) query['personalInfo.position'] = position;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (constituency) query['politicalInfo.constituency'] = { $regex: constituency, $options: 'i' };
    if (partyName) query['politicalInfo.partyName'] = { $regex: partyName, $options: 'i' };
    if (candidacyLevel) query['politicalInfo.candidacyLevel'] = candidacyLevel;

    const candidates = await Candidate.find(query)
      .select('-documents') // Exclude document fields from list
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: candidates.length,
      data: candidates
    });
  } catch (error) {
    console.error('Error fetching candidates:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching candidates',
      error: error.message
    });
  }
};

// @desc    Get single candidate
// @route   GET /api/candidates/:id
// @access  Public
exports.getCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    res.status(200).json({
      success: true,
      data: candidate
    });
  } catch (error) {
    console.error('Error fetching candidate:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching candidate',
      error: error.message
    });
  }
};

// @desc    Create new candidate
// @route   POST /api/candidates
// @access  Private (Admin only) or Public for registration
exports.createCandidate = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Parse all nested objects from FormData
    const personalInfo = parseNestedObject(req.body, 'personalInfo') || req.body.personalInfo || {};
    const politicalInfo = parseNestedObject(req.body, 'politicalInfo') || req.body.politicalInfo || {};
    const education = parseNestedObject(req.body, 'education') || req.body.education || {};
    const professionalExperience = parseNestedObject(req.body, 'professionalExperience') || req.body.professionalExperience || {};
    const politicalExperience = parseNestedObject(req.body, 'politicalExperience') || req.body.politicalExperience || {};
    const socialEngagement = parseNestedObject(req.body, 'socialEngagement') || req.body.socialEngagement || {};
    const financialInfo = parseNestedObject(req.body, 'financialInfo') || req.body.financialInfo || {};
    const legalStatus = parseNestedObject(req.body, 'legalStatus') || req.body.legalStatus || {};
    const visionGoals = parseNestedObject(req.body, 'visionGoals') || req.body.visionGoals || {};
    const socialMedia = parseNestedObject(req.body, 'socialMedia') || req.body.socialMedia || {};
    const campaign = parseNestedObject(req.body, 'campaign') || req.body.campaign || {};
    const documents = parseNestedObject(req.body, 'documents') || req.body.documents || {};

    // Handle file uploads
    let profilePhotoPath = personalInfo.profilePhoto || null;
    let electionSymbolImagePath = politicalInfo.electionSymbolImage || null;

    if (req.files) {
      // Profile photo upload
      if (req.files.profilePhoto && req.files.profilePhoto[0]) {
        profilePhotoPath = req.files.profilePhoto[0].path;
      }
      // Election symbol image upload
      if (req.files.electionSymbolImage && req.files.electionSymbolImage[0]) {
        electionSymbolImagePath = req.files.electionSymbolImage[0].path;
      }
    }

    // Handle single file upload
    if (req.file) {
      profilePhotoPath = req.file.path;
    }

    // Build candidate data
    const candidateData = {
      personalInfo: {
        ...personalInfo,
        profilePhoto: profilePhotoPath
      },
      politicalInfo: {
        ...politicalInfo,
        electionSymbolImage: electionSymbolImagePath,
        isFirstTimeCandidate: politicalInfo.isFirstTimeCandidate === 'true' || politicalInfo.isFirstTimeCandidate === true
      },
      education,
      professionalExperience,
      politicalExperience,
      socialEngagement,
      financialInfo,
      legalStatus: {
        ...legalStatus,
        hasCriminalCase: legalStatus.hasCriminalCase === 'true' || legalStatus.hasCriminalCase === true
      },
      visionGoals,
      socialMedia,
      campaign,
      documents,
      isActive: req.body.isActive === 'true' || req.body.isActive === true,
      isVerified: false, // Default to not verified
      createdBy: req.user ? req.user.id : null
    };

    const candidate = new Candidate(candidateData);
    await candidate.save();

    res.status(201).json({
      success: true,
      message: 'Candidate created successfully',
      data: candidate
    });
  } catch (error) {
    console.error('Error creating candidate:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating candidate',
      error: error.message
    });
  }
};

// @desc    Public registration - Create new candidate (no auth required)
// @route   POST /api/candidates/register
// @access  Public
exports.registerCandidate = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    let candidateData = req.body;
    
    // Handle file upload
    if (req.file) {
      candidateData.personalInfo = {
        ...candidateData.personalInfo,
        profilePhoto: req.file.path
      };
    }

    if (req.files) {
      if (req.files.profilePhoto && req.files.profilePhoto[0]) {
        candidateData.personalInfo = {
          ...candidateData.personalInfo,
          profilePhoto: req.files.profilePhoto[0].path
        };
      }
    }

    // Ensure booleans are properly parsed
    if (candidateData.politicalInfo) {
      candidateData.politicalInfo.isFirstTimeCandidate = 
        candidateData.politicalInfo.isFirstTimeCandidate === 'true' || 
        candidateData.politicalInfo.isFirstTimeCandidate === true;
    }

    if (candidateData.legalStatus) {
      candidateData.legalStatus.hasCriminalCase = 
        candidateData.legalStatus.hasCriminalCase === 'true' || 
        candidateData.legalStatus.hasCriminalCase === true;
    }

    // Set default values for new registrations
    candidateData.isActive = false; // Needs admin approval
    candidateData.isVerified = false;
    candidateData.likes = 0;
    candidateData.shares = 0;

    const candidate = new Candidate(candidateData);
    await candidate.save();

    res.status(201).json({
      success: true,
      message: 'उम्मेदवार दर्ता सफल भयो। प्रशासकबाट अनुमोदन पछि प्रकाशित हुनेछ। / Registration successful. Will be published after admin approval.',
      data: { id: candidate._id }
    });
  } catch (error) {
    console.error('Error registering candidate:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while registering candidate',
      error: error.message
    });
  }
};

// @desc    Update candidate
// @route   PUT /api/candidates/:id
// @access  Private (Admin only)
exports.updateCandidate = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    let candidate = await Candidate.findById(req.params.id);

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    // Parse all nested objects from FormData
    const personalInfo = parseNestedObject(req.body, 'personalInfo') || req.body.personalInfo;
    const politicalInfo = parseNestedObject(req.body, 'politicalInfo') || req.body.politicalInfo;
    const education = parseNestedObject(req.body, 'education') || req.body.education;
    const professionalExperience = parseNestedObject(req.body, 'professionalExperience') || req.body.professionalExperience;
    const politicalExperience = parseNestedObject(req.body, 'politicalExperience') || req.body.politicalExperience;
    const socialEngagement = parseNestedObject(req.body, 'socialEngagement') || req.body.socialEngagement;
    const financialInfo = parseNestedObject(req.body, 'financialInfo') || req.body.financialInfo;
    const legalStatus = parseNestedObject(req.body, 'legalStatus') || req.body.legalStatus;
    const visionGoals = parseNestedObject(req.body, 'visionGoals') || req.body.visionGoals;
    const socialMedia = parseNestedObject(req.body, 'socialMedia') || req.body.socialMedia;
    const campaign = parseNestedObject(req.body, 'campaign') || req.body.campaign;
    const documents = parseNestedObject(req.body, 'documents') || req.body.documents;

    // Handle file uploads
    let profilePhotoPath = candidate.personalInfo?.profilePhoto;
    let electionSymbolImagePath = candidate.politicalInfo?.electionSymbolImage;

    if (req.files) {
      if (req.files.profilePhoto && req.files.profilePhoto[0]) {
        profilePhotoPath = req.files.profilePhoto[0].path;
      }
      if (req.files.electionSymbolImage && req.files.electionSymbolImage[0]) {
        electionSymbolImagePath = req.files.electionSymbolImage[0].path;
      }
    }

    if (req.file) {
      profilePhotoPath = req.file.path;
    }

    // Update fields if provided
    if (personalInfo) {
      candidate.personalInfo = { 
        ...candidate.personalInfo?.toObject?.() || candidate.personalInfo, 
        ...personalInfo,
        profilePhoto: profilePhotoPath
      };
    }
    
    if (politicalInfo) {
      candidate.politicalInfo = { 
        ...candidate.politicalInfo?.toObject?.() || candidate.politicalInfo, 
        ...politicalInfo,
        electionSymbolImage: electionSymbolImagePath,
        isFirstTimeCandidate: politicalInfo.isFirstTimeCandidate === 'true' || politicalInfo.isFirstTimeCandidate === true
      };
    }
    
    if (education) candidate.education = { ...candidate.education?.toObject?.() || candidate.education, ...education };
    if (professionalExperience) candidate.professionalExperience = { ...candidate.professionalExperience?.toObject?.() || candidate.professionalExperience, ...professionalExperience };
    if (politicalExperience) candidate.politicalExperience = { ...candidate.politicalExperience?.toObject?.() || candidate.politicalExperience, ...politicalExperience };
    if (socialEngagement) candidate.socialEngagement = { ...candidate.socialEngagement?.toObject?.() || candidate.socialEngagement, ...socialEngagement };
    if (financialInfo) candidate.financialInfo = { ...candidate.financialInfo?.toObject?.() || candidate.financialInfo, ...financialInfo };
    
    if (legalStatus) {
      candidate.legalStatus = { 
        ...candidate.legalStatus?.toObject?.() || candidate.legalStatus, 
        ...legalStatus,
        hasCriminalCase: legalStatus.hasCriminalCase === 'true' || legalStatus.hasCriminalCase === true
      };
    }
    
    if (visionGoals) candidate.visionGoals = { ...candidate.visionGoals?.toObject?.() || candidate.visionGoals, ...visionGoals };
    if (socialMedia) candidate.socialMedia = { ...candidate.socialMedia?.toObject?.() || candidate.socialMedia, ...socialMedia };
    if (campaign) candidate.campaign = { ...candidate.campaign?.toObject?.() || candidate.campaign, ...campaign };
    if (documents) candidate.documents = { ...candidate.documents?.toObject?.() || candidate.documents, ...documents };
    
    if (req.body.isActive !== undefined) candidate.isActive = req.body.isActive === 'true' || req.body.isActive === true;
    if (req.body.isVerified !== undefined) candidate.isVerified = req.body.isVerified === 'true' || req.body.isVerified === true;

    await candidate.save();

    res.status(200).json({
      success: true,
      message: 'Candidate updated successfully',
      data: candidate
    });
  } catch (error) {
    console.error('Error updating candidate:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating candidate',
      error: error.message
    });
  }
};

// @desc    Delete candidate
// @route   DELETE /api/candidates/:id
// @access  Private (Admin only)
exports.deleteCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findByIdAndDelete(req.params.id);

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Candidate deleted successfully',
      data: candidate
    });
  } catch (error) {
    console.error('Error deleting candidate:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting candidate',
      error: error.message
    });
  }
};

// @desc    Like/Unlike candidate
// @route   POST /api/candidates/:id/like
// @access  Public
exports.likeCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    // Get client IP or session identifier
    const clientId = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.ip;
    
    // Simple toggle based on current state (in real app, track likes by user/IP)
    const { action } = req.body; // 'like' or 'unlike'
    
    if (action === 'unlike') {
      candidate.likes = Math.max(0, (candidate.likes || 0) - 1);
    } else {
      candidate.likes = (candidate.likes || 0) + 1;
    }

    await candidate.save();

    res.status(200).json({
      success: true,
      likes: candidate.likes,
      isLiked: action !== 'unlike'
    });
  } catch (error) {
    console.error('Error liking candidate:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while liking candidate',
      error: error.message
    });
  }
};

// @desc    Share candidate (increment share count)
// @route   POST /api/candidates/:id/share
// @access  Public
exports.shareCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    candidate.shares = (candidate.shares || 0) + 1;
    await candidate.save();

    res.status(200).json({
      success: true,
      shares: candidate.shares
    });
  } catch (error) {
    console.error('Error sharing candidate:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while sharing candidate',
      error: error.message
    });
  }
};

// @desc    Verify candidate
// @route   PUT /api/candidates/:id/verify
// @access  Private (Admin only)
exports.verifyCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    candidate.isVerified = req.body.isVerified !== false;
    candidate.isActive = req.body.isActive !== false;
    await candidate.save();

    res.status(200).json({
      success: true,
      message: candidate.isVerified ? 'Candidate verified successfully' : 'Candidate unverified',
      data: candidate
    });
  } catch (error) {
    console.error('Error verifying candidate:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while verifying candidate',
      error: error.message
    });
  }
};

// @desc    Get candidate statistics
// @route   GET /api/candidates/stats
// @access  Private (Admin only)
exports.getCandidateStats = async (req, res) => {
  try {
    const totalCandidates = await Candidate.countDocuments();
    const activeCandidates = await Candidate.countDocuments({ isActive: true });
    const verifiedCandidates = await Candidate.countDocuments({ isVerified: true });
    const pendingApproval = await Candidate.countDocuments({ isActive: false, isVerified: false });

    // Get counts by candidacy level
    const byLevel = await Candidate.aggregate([
      {
        $group: {
          _id: '$politicalInfo.candidacyLevel',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get counts by party
    const byParty = await Candidate.aggregate([
      {
        $group: {
          _id: '$politicalInfo.partyName',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalCandidates,
        activeCandidates,
        verifiedCandidates,
        pendingApproval,
        byLevel,
        byParty
      }
    });
  } catch (error) {
    console.error('Error fetching candidate stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching statistics',
      error: error.message
    });
  }
};

// @desc    Search candidates
// @route   GET /api/candidates/search
// @access  Public
exports.searchCandidates = async (req, res) => {
  try {
    const { q, constituency, partyName, candidacyLevel } = req.query;

    let query = { isActive: true };

    if (q) {
      query.$or = [
        { 'personalInfo.fullName': { $regex: q, $options: 'i' } },
        { 'personalInfo.fullName_np': { $regex: q, $options: 'i' } },
        { 'politicalInfo.constituency': { $regex: q, $options: 'i' } },
        { 'politicalInfo.constituency_np': { $regex: q, $options: 'i' } }
      ];
    }

    if (constituency) {
      query['politicalInfo.constituency'] = { $regex: constituency, $options: 'i' };
    }

    if (partyName) {
      query['politicalInfo.partyName'] = { $regex: partyName, $options: 'i' };
    }

    if (candidacyLevel) {
      query['politicalInfo.candidacyLevel'] = candidacyLevel;
    }

    const candidates = await Candidate.find(query)
      .select('personalInfo politicalInfo education likes shares isVerified')
      .sort({ likes: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      count: candidates.length,
      data: candidates
    });
  } catch (error) {
    console.error('Error searching candidates:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while searching candidates',
      error: error.message
    });
  }
};
