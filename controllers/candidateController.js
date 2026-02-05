const Candidate = require('../models/Candidate');
const { validationResult } = require('express-validator');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');

// @desc    Get all candidates
// @route   GET /api/candidates
// @access  Public
exports.getAllCandidates = async (req, res) => {
  try {
    const { position, isActive } = req.query;
    
    let query = {};
    if (position) query['personalInfo.position'] = position;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const candidates = await Candidate.find(query)
      .select('-manifesto.manifestoBrochure') // Exclude heavy files from list
      .populate('createdBy', 'name email');

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
    const candidate = await Candidate.findById(req.params.id)
      .populate('createdBy', 'name email');

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
// @access  Private (Admin only)
exports.createCandidate = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Parse nested objects from FormData structure
    const parseNestedObject = (obj, prefix) => {
      const result = {};
      const prefixPattern = `${prefix}[`;
      
      Object.keys(obj).forEach(key => {
        if (key.startsWith(prefixPattern)) {
          // Extract the nested key: "personalInfo[email]" -> "email"
          const match = key.match(new RegExp(`^${prefix}\\[([^\\]]+)\\]$`));
          if (match) {
            const nestedKey = match[1];
            result[nestedKey] = obj[key];
          }
        }
      });
      
      return Object.keys(result).length > 0 ? result : null;
    };

    const personalInfo = parseNestedObject(req.body, 'personalInfo') || req.body.personalInfo;
    const biography = parseNestedObject(req.body, 'biography') || req.body.biography;
    const manifesto = parseNestedObject(req.body, 'manifesto') || req.body.manifesto;
    const socialMedia = parseNestedObject(req.body, 'socialMedia') || req.body.socialMedia;
    
    // Parse achievements array
    let achievements = [];
    if (req.body.achievements) {
      if (Array.isArray(req.body.achievements)) {
        achievements = req.body.achievements;
      } else {
        // Parse achievements from FormData format
        const achievementKeys = Object.keys(req.body).filter(k => k.startsWith('achievements['));
        const achievementIndexes = [...new Set(achievementKeys.map(k => k.match(/\[(\d+)\]/)?.[1]).filter(Boolean))];
        achievements = achievementIndexes.map(index => ({
          achievementTitle_en: req.body[`achievements[${index}][achievementTitle_en]`],
          achievementDescription_en: req.body[`achievements[${index}][achievementDescription_en]`],
          achievementDate: req.body[`achievements[${index}][achievementDate]`],
          achievementCategory: req.body[`achievements[${index}][achievementCategory]`],
        })).filter(a => a.achievementTitle_en);
      }
    }

    const issues = req.body.issues || [];
    const campaign = req.body.campaign || {};

    // Handle file uploads from multer
    let profilePhotoPath = biography?.profilePhoto || null;
    let manifestoBrochurePath = manifesto?.manifestoBrochure || null;

    if (req.files) {
      // Multer with fields() puts files in an object with field names as keys
      if (req.files.profilePhoto && req.files.profilePhoto[0]) {
        profilePhotoPath = req.files.profilePhoto[0].path; // Cloudinary URL
      }

      if (req.files.manifestoBrochure && req.files.manifestoBrochure[0]) {
        manifestoBrochurePath = req.files.manifestoBrochure[0].path; // Cloudinary URL
      }
    }

    const candidateData = {
      personalInfo,
      biography: {
        ...biography,
        profilePhoto: profilePhotoPath || biography?.profilePhoto
      },
      manifesto: {
        ...manifesto,
        manifestoBrochure: manifestoBrochurePath || manifesto?.manifestoBrochure
      },
      socialMedia: socialMedia || {},
      issues,
      achievements,
      campaign,
      isActive: req.body.isActive === 'true' || req.body.isActive === true,
      createdBy: req.user.id
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

    // Parse nested objects from FormData structure
    const parseNestedObject = (obj, prefix) => {
      const result = {};
      const prefixPattern = `${prefix}[`;
      
      Object.keys(obj).forEach(key => {
        if (key.startsWith(prefixPattern)) {
          // Extract the nested key: "personalInfo[email]" -> "email"
          const match = key.match(new RegExp(`^${prefix}\\[([^\\]]+)\\]$`));
          if (match) {
            const nestedKey = match[1];
            result[nestedKey] = obj[key];
          }
        }
      });
      
      return Object.keys(result).length > 0 ? result : null;
    };

    const personalInfo = parseNestedObject(req.body, 'personalInfo') || req.body.personalInfo;
    const biography = parseNestedObject(req.body, 'biography') || req.body.biography;
    const manifesto = parseNestedObject(req.body, 'manifesto') || req.body.manifesto;
    const socialMedia = parseNestedObject(req.body, 'socialMedia') || req.body.socialMedia;
    
    // Parse achievements array
    let achievements = candidate.achievements;
    if (req.body.achievements) {
      if (Array.isArray(req.body.achievements)) {
        achievements = req.body.achievements;
      } else {
        // Parse achievements from FormData format
        const achievementKeys = Object.keys(req.body).filter(k => k.startsWith('achievements['));
        const achievementIndexes = [...new Set(achievementKeys.map(k => k.match(/\[(\d+)\]/)?.[1]).filter(Boolean))];
        if (achievementIndexes.length > 0) {
          achievements = achievementIndexes.map(index => ({
            achievementTitle_en: req.body[`achievements[${index}][achievementTitle_en]`],
            achievementDescription_en: req.body[`achievements[${index}][achievementDescription_en]`],
            achievementDate: req.body[`achievements[${index}][achievementDate]`],
            achievementCategory: req.body[`achievements[${index}][achievementCategory]`],
          })).filter(a => a.achievementTitle_en);
        }
      }
    }

    // Handle file uploads from multer
    let profilePhotoPath = biography?.profilePhoto;
    let manifestoBrochurePath = manifesto?.manifestoBrochure;

    if (req.files) {
      if (req.files.profilePhoto && req.files.profilePhoto[0]) {
        profilePhotoPath = req.files.profilePhoto[0].path; // Cloudinary URL
      }

      if (req.files.manifestoBrochure && req.files.manifestoBrochure[0]) {
        manifestoBrochurePath = req.files.manifestoBrochure[0].path; // Cloudinary URL
      }
    }

    // Update candidate data
    if (personalInfo) candidate.personalInfo = { ...candidate.personalInfo, ...personalInfo };
    if (biography) candidate.biography = { ...candidate.biography, ...biography, profilePhoto: profilePhotoPath || candidate.biography.profilePhoto };
    if (manifesto) candidate.manifesto = { ...candidate.manifesto, ...manifesto, manifestoBrochure: manifestoBrochurePath || candidate.manifesto.manifestoBrochure };
    if (socialMedia) candidate.socialMedia = { ...candidate.socialMedia, ...socialMedia };
    if (achievements) candidate.achievements = achievements;
    if (req.body.isActive !== undefined) candidate.isActive = req.body.isActive === 'true' || req.body.isActive === true;

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

    // Delete associated files
    if (candidate.biography.profilePhoto) {
      try {
        fs.unlinkSync(candidate.biography.profilePhoto);
      } catch (err) {
        console.log('Could not delete profile photo');
      }
    }

    if (candidate.manifesto.manifestoBrochure) {
      try {
        fs.unlinkSync(candidate.manifesto.manifestoBrochure);
      } catch (err) {
        console.log('Could not delete manifesto brochure');
      }
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

// @desc    Add achievement to candidate
// @route   POST /api/candidates/:id/achievements
// @access  Private (Admin only)
exports.addAchievement = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    const achievement = req.body;

    // Handle file upload for achievement image
    if (req.files && req.files.achievementImage) {
      const image = req.files.achievementImage;
      const uploadPath = `${process.env.UPLOAD_DIR || './uploads/candidates'}/achievements/${Date.now()}-${image.name}`;
      
      const dir = require('path').dirname(uploadPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      await image.mv(uploadPath);
      achievement.achievementImage = uploadPath;
    }

    candidate.achievements.push(achievement);
    await candidate.save();

    res.status(201).json({
      success: true,
      message: 'Achievement added successfully',
      data: candidate
    });
  } catch (error) {
    console.error('Error adding achievement:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding achievement',
      error: error.message
    });
  }
};

// @desc    Add issue to candidate
// @route   POST /api/candidates/:id/issues
// @access  Private (Admin only)
exports.addIssue = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    candidate.issues.push(req.body);
    await candidate.save();

    res.status(201).json({
      success: true,
      message: 'Issue added successfully',
      data: candidate
    });
  } catch (error) {
    console.error('Error adding issue:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding issue',
      error: error.message
    });
  }
};

// @desc    Search candidates
// @route   GET /api/candidates/search
// @access  Public
exports.searchCandidates = async (req, res) => {
  try {
    const { query, position, constituency } = req.query;

    let searchQuery = { isActive: true };

    if (query) {
      searchQuery.$or = [
        { 'personalInfo.fullName': { $regex: query, $options: 'i' } },
        { 'personalInfo.constituency': { $regex: query, $options: 'i' } }
      ];
    }

    if (position) {
      searchQuery['personalInfo.position'] = position;
    }

    if (constituency) {
      searchQuery['personalInfo.constituency'] = { $regex: constituency, $options: 'i' };
    }

    const candidates = await Candidate.find(searchQuery)
      .select('-manifesto.manifestoBrochure')
      .populate('createdBy', 'name email')
      .limit(20);

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

// @desc    Like a candidate
// @route   POST /api/candidates/:id/like
// @access  Public
exports.likeCandidate = async (req, res) => {
  try {
    const { id } = req.params;
    const clientId = req.ip || req.headers['x-forwarded-for'] || 'anonymous';

    const candidate = await Candidate.findById(id);
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    // Check if already liked by this client
    if (candidate.likedBy.includes(clientId)) {
      // Unlike
      candidate.likedBy = candidate.likedBy.filter(ip => ip !== clientId);
      candidate.likes = Math.max(0, candidate.likes - 1);
    } else {
      // Like
      candidate.likedBy.push(clientId);
      candidate.likes += 1;
    }

    await candidate.save();

    res.status(200).json({
      success: true,
      data: {
        likes: candidate.likes,
        isLiked: candidate.likedBy.includes(clientId)
      }
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

// @desc    Add comment to candidate
// @route   POST /api/candidates/:id/comment
// @access  Public
exports.addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, comment } = req.body;

    if (!name || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Name and comment are required'
      });
    }

    const candidate = await Candidate.findById(id);
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    candidate.comments.push({
      name,
      email,
      comment,
      createdAt: new Date(),
      isApproved: false // Require admin approval
    });

    await candidate.save();

    res.status(201).json({
      success: true,
      message: 'Comment submitted successfully. It will be visible after approval.',
      data: {
        totalComments: candidate.comments.length
      }
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding comment',
      error: error.message
    });
  }
};

// @desc    Get approved comments for candidate
// @route   GET /api/candidates/:id/comments
// @access  Public
exports.getComments = async (req, res) => {
  try {
    const { id } = req.params;
    
    const candidate = await Candidate.findById(id).select('comments');
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    // Only return approved comments for public
    const approvedComments = candidate.comments
      .filter(comment => comment.isApproved)
      .sort((a, b) => b.createdAt - a.createdAt);

    res.status(200).json({
      success: true,
      count: approvedComments.length,
      data: approvedComments
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching comments',
      error: error.message
    });
  }
};

// @desc    Increment share count
// @route   POST /api/candidates/:id/share
// @access  Public
exports.shareCandidate = async (req, res) => {
  try {
    const { id } = req.params;

    const candidate = await Candidate.findById(id);
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    candidate.shares += 1;
    await candidate.save();

    res.status(200).json({
      success: true,
      data: {
        shares: candidate.shares
      }
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
