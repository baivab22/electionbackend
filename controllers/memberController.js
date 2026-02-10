const Member = require('../models/member');
const { cloudinary, hasFullCredentials } = require('../config/cloudinary.config');
const fs = require('fs');
const path = require('path');

/**
 * Helper: Delete Cloudinary documents from member
 * @param {Object} member - Member document
 */
async function deleteCloudinaryDocuments(member) {
  // Skip if we don't have API credentials
  if (!hasFullCredentials) {
    console.log('ℹ️  Skipping Cloudinary cleanup (API credentials not configured)');
    return;
  }
  
  if (!member.documents) return;
  
  const documentsToDelete = [];
  
  // Collect all Cloudinary URLs from documents
  for (const [key, doc] of Object.entries(member.documents)) {
    if (doc?.path && /res\.cloudinary\.com/.test(doc.path)) {
      documentsToDelete.push(doc.path);
    }
  }
  
  // Delete all found documents from Cloudinary
  for (const docUrl of documentsToDelete) {
    try {
      // Extract public_id from Cloudinary URL
      const match = docUrl.match(/\/upload\/(?:v\d+\/)?(.*?)(?:\.[a-zA-Z0-9]+)?$/);
      if (match && match[1]) {
        const publicId = match[1];
        await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
        console.log('🗑️ Deleted Cloudinary document:', publicId);
      }
    } catch (err) {
      console.warn('⚠️ Failed to delete Cloudinary document:', docUrl, err.message);
    }
  }
}

// Create new member application
const createMember = async (req, res) => {
  try {
    const {
      generalInfo,
      professionalDetails,
      membershipDetails,
      endorsement,
      declaration
    } = req.body;

    // Parse JSON strings if they are sent as strings
    const generalInfoData = typeof generalInfo === 'string' ? JSON.parse(generalInfo) : generalInfo;
    const professionalDetailsData = typeof professionalDetails === 'string' ? JSON.parse(professionalDetails) : professionalDetails;
    const membershipDetailsData = typeof membershipDetails === 'string' ? JSON.parse(membershipDetails) : membershipDetails;
    const endorsementData = typeof endorsement === 'string' ? JSON.parse(endorsement) : endorsement;
    const declarationData = typeof declaration === 'string' ? JSON.parse(declaration) : declaration;

    // Check if member already exists with same citizenship ID or email
    const existingMember = await Member.findOne({
      $or: [
        { 'generalInfo.citizenshipId': generalInfoData.citizenshipId },
        { 'generalInfo.email': generalInfoData.email.toLowerCase() }
      ]
    });

    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: 'Member with this Citizenship ID or Email already exists'
      });
    }

    // Handle file uploads - store Cloudinary URLs
    const documents = {};
    if (req.files) {
      if (req.files.citizenshipCopy) {
        documents.citizenshipCopy = {
          filename: req.files.citizenshipCopy[0].filename || req.files.citizenshipCopy[0].originalname,
          path: req.files.citizenshipCopy[0].path // Cloudinary URL
        };
        console.log('✅ Citizenship copy uploaded to Cloudinary:', documents.citizenshipCopy.path);
      }
      if (req.files.photo) {
        documents.photo = {
          filename: req.files.photo[0].filename || req.files.photo[0].originalname,
          path: req.files.photo[0].path // Cloudinary URL
        };
        console.log('✅ Photo uploaded to Cloudinary:', documents.photo.path);
      }
      if (req.files.recommendationLetter) {
        documents.recommendationLetter = {
          filename: req.files.recommendationLetter[0].filename || req.files.recommendationLetter[0].originalname,
          path: req.files.recommendationLetter[0].path // Cloudinary URL
        };
        console.log('✅ Recommendation letter uploaded to Cloudinary:', documents.recommendationLetter.path);
      }
      if (req.files.resume) {
        documents.resume = {
          filename: req.files.resume[0].filename || req.files.resume[0].originalname,
          path: req.files.resume[0].path // Cloudinary URL
        };
        console.log('✅ Resume uploaded to Cloudinary:', documents.resume.path);
      }
    }

    // Create new member
    const newMember = new Member({
      generalInfo: generalInfoData,
      professionalDetails: professionalDetailsData,
      membershipDetails: membershipDetailsData,
      endorsement: endorsementData,
      documents,
      declaration: declarationData
    });

    await newMember.save();

    res.status(201).json({
      success: true,
      message: 'Member application submitted successfully',
      data: newMember
    });

  } catch (error) {
    console.error('Error creating member:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting application',
      error: error.message
    });
  }
};

// Get all members with filtering and pagination
const getAllMembers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      membershipLevel,
      search,
      province
    } = req.query;

    const query = {};

    // Add filters
    if (status) query.status = status;
    if (membershipLevel) query['membershipDetails.membershipLevel'] = membershipLevel;
    if (province) query['generalInfo.permanentAddress.province'] = province;

    // Add search functionality
    if (search) {
      query.$or = [
        { 'generalInfo.fullName': { $regex: search, $options: 'i' } },
        { 'generalInfo.email': { $regex: search, $options: 'i' } },
        { 'generalInfo.citizenshipId': { $regex: search, $options: 'i' } }
      ];
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 }
    };

    const members = await Member.find(query)
      .limit(options.limit * 1)
      .skip((options.page - 1) * options.limit)
      .sort(options.sort);

    const total = await Member.countDocuments(query);

    res.json({
      success: true,
      data: members,
      pagination: {
        currentPage: options.page,
        totalPages: Math.ceil(total / options.limit),
        totalMembers: total,
        hasNext: options.page < Math.ceil(total / options.limit),
        hasPrev: options.page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching members:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching members',
      error: error.message
    });
  }
};

// Get single member by ID
const getMemberById = async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    res.json({
      success: true,
      data: member
    });

  } catch (error) {
    console.error('Error fetching member:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching member',
      error: error.message
    });
  }
};

// Update member status (approve/reject)
const updateMemberStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const member = await Member.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    res.json({
      success: true,
      message: `Member application ${status} successfully`,
      data: member
    });

  } catch (error) {
    console.error('Error updating member status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating member status',
      error: error.message
    });
  }
};

// Update member information
const updateMember = async (req, res) => {
  try {
    const member = await Member.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    res.json({
      success: true,
      message: 'Member updated successfully',
      data: member
    });

  } catch (error) {
    console.error('Error updating member:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating member',
      error: error.message
    });
  }
};

// Delete member
const deleteMember = async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    // Delete all associated Cloudinary documents
    try {
      await deleteCloudinaryDocuments(member);
      console.log('✅ All Cloudinary documents deleted for member:', member._id);
    } catch (err) {
      console.warn('⚠️ Error deleting Cloudinary documents:', err.message);
      // Continue with deletion even if document cleanup fails
    }

    // Delete the member from database
    await Member.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Member and associated documents deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting member:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting member',
      error: error.message
    });
  }
};

// Get membership statistics
const getMembershipStats = async (req, res) => {
  try {
    const totalMembers = await Member.countDocuments();
    const pendingMembers = await Member.countDocuments({ status: 'pending' });
    const approvedMembers = await Member.countDocuments({ status: 'approved' });
    const rejectedMembers = await Member.countDocuments({ status: 'rejected' });

    // Count by membership level
    const membershipLevelStats = await Member.aggregate([
      {
        $group: {
          _id: '$membershipDetails.membershipLevel',
          count: { $sum: 1 }
        }
      }
    ]);

    // Count by province
    const provinceStats = await Member.aggregate([
      {
        $group: {
          _id: '$generalInfo.permanentAddress.province',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        total: totalMembers,
        pending: pendingMembers,
        approved: approvedMembers,
        rejected: rejectedMembers,
        byMembershipLevel: membershipLevelStats,
        byProvince: provinceStats
      }
    });

  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
};

module.exports = {
  createMember,
  getAllMembers,
  getMemberById,
  updateMemberStatus,
  updateMember,
  deleteMember,
  getMembershipStats
};