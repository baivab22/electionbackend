const Volunteer = require('../models/Volunteer');

// @desc    Register a volunteer
// @route   POST /api/volunteers/register
// @access  Public
exports.registerVolunteer = async (req, res) => {
  try {
    const { name, email, phone, district, municipality, skills, availability, motivation, agreeTerms } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !district) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
      });
    }

    // Validate phone number (10 digits)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone.replace(/[^\d]/g, ''))) {
      return res.status(400).json({
        success: false,
        message: 'Phone number must be 10 digits',
      });
    }

    // Check if user already registered with same email
    const existingVolunteer = await Volunteer.findOne({ email });
    if (existingVolunteer) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered',
      });
    }

    // Validate skills array
    if (!Array.isArray(skills) || skills.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please select at least one skill',
      });
    }

    // Validate availability array
    if (!Array.isArray(availability) || availability.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please select at least one availability option',
      });
    }

    // Validate terms agreement
    if (!agreeTerms) {
      return res.status(400).json({
        success: false,
        message: 'You must agree to the terms and conditions',
      });
    }

    // Create new volunteer
    const volunteer = new Volunteer({
      name,
      email,
      phone,
      district,
      municipality,
      skills,
      availability,
      motivation,
      agreeTerms,
      status: 'pending',
    });

    await volunteer.save();

    res.status(201).json({
      success: true,
      message: 'Volunteer registration successful! We will contact you soon.',
      data: {
        id: volunteer._id,
        name: volunteer.name,
        email: volunteer.email,
        registeredAt: volunteer.registeredAt,
      },
    });
  } catch (error) {
    console.error('Error registering volunteer:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during volunteer registration',
      error: error.message,
    });
  }
};

// @desc    Get all volunteers (admin only)
// @route   GET /api/volunteers
// @access  Private/Admin
exports.getAllVolunteers = async (req, res) => {
  try {
    const { status, district, page = 1, limit = 10 } = req.query;

    let query = {};
    if (status) query.status = status;
    if (district) query.district = district;

    const skip = (page - 1) * limit;

    const volunteers = await Volunteer.find(query)
      .sort({ registeredAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Volunteer.countDocuments(query);

    res.status(200).json({
      success: true,
      count: volunteers.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: volunteers,
    });
  } catch (error) {
    console.error('Error fetching volunteers:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching volunteers',
      error: error.message,
    });
  }
};

// @desc    Get volunteer by ID
// @route   GET /api/volunteers/:id
// @access  Private/Admin
exports.getVolunteer = async (req, res) => {
  try {
    const volunteer = await Volunteer.findById(req.params.id);

    if (!volunteer) {
      return res.status(404).json({
        success: false,
        message: 'Volunteer not found',
      });
    }

    res.status(200).json({
      success: true,
      data: volunteer,
    });
  } catch (error) {
    console.error('Error fetching volunteer:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching volunteer',
      error: error.message,
    });
  }
};

// @desc    Update volunteer status (admin only)
// @route   PUT /api/volunteers/:id
// @access  Private/Admin
exports.updateVolunteer = async (req, res) => {
  try {
    const { status, notes } = req.body;

    const volunteer = await Volunteer.findByIdAndUpdate(
      req.params.id,
      { status, notes },
      { new: true, runValidators: true }
    );

    if (!volunteer) {
      return res.status(404).json({
        success: false,
        message: 'Volunteer not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Volunteer updated successfully',
      data: volunteer,
    });
  } catch (error) {
    console.error('Error updating volunteer:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating volunteer',
      error: error.message,
    });
  }
};

// @desc    Delete volunteer
// @route   DELETE /api/volunteers/:id
// @access  Private/Admin
exports.deleteVolunteer = async (req, res) => {
  try {
    const volunteer = await Volunteer.findByIdAndDelete(req.params.id);

    if (!volunteer) {
      return res.status(404).json({
        success: false,
        message: 'Volunteer not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Volunteer deleted successfully',
      data: volunteer,
    });
  } catch (error) {
    console.error('Error deleting volunteer:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting volunteer',
      error: error.message,
    });
  }
};

// @desc    Get volunteer statistics
// @route   GET /api/volunteers/stats
// @access  Private/Admin
exports.getVolunteerStats = async (req, res) => {
  try {
    const total = await Volunteer.countDocuments();
    const pending = await Volunteer.countDocuments({ status: 'pending' });
    const approved = await Volunteer.countDocuments({ status: 'approved' });
    const rejected = await Volunteer.countDocuments({ status: 'rejected' });

    const byDistrict = await Volunteer.aggregate([
      {
        $group: {
          _id: '$district',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    res.status(200).json({
      success: true,
      data: {
        total,
        pending,
        approved,
        rejected,
        byDistrict,
      },
    });
  } catch (error) {
    console.error('Error fetching volunteer stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching statistics',
      error: error.message,
    });
  }
};
