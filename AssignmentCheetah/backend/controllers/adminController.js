const Organizer = require('../models/Organizer');
const PasswordReset = require('../models/PasswordReset');
const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// @desc    Create new organizer account
// @route   POST /api/admin/organizers
// @access  Private (Admin)
const createOrganizer = async (req, res) => {
  try {
    const { organizerName, email, password, category, description, contactEmail, contactNumber } = req.body;

    // Validate password
    if (!password || password.length < 6) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters long',
      });
    }

    // Check if organizer already exists
    const existingOrganizer = await Organizer.findOne({ email });
    if (existingOrganizer) {
      return res.status(400).json({
        message: 'Organizer with this email already exists',
      });
    }

    // Create organizer with admin-provided password
    const organizer = await Organizer.create({
      organizerName,
      email,
      password,
      category,
      description,
      contactEmail,
      contactNumber,
      createdBy: req.user._id,
    });

    res.status(201).json({
      message: 'Organizer account created successfully',
      organizer: {
        id: organizer._id,
        organizerName: organizer.organizerName,
        email: organizer.email,
        category: organizer.category,
      },
      credentials: {
        email: organizer.email,
        password: password,
      },
    });
  } catch (error) {
    console.error('Create organizer error:', error);
    res.status(500).json({
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get all organizers (including inactive)
// @route   GET /api/admin/organizers
// @access  Private (Admin)
const getAllOrganizers = async (req, res) => {
  try {
    const organizers = await Organizer.find().select('-password').sort({ createdAt: -1 });

    res.json({
      count: organizers.length,
      organizers,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Server error',
    });
  }
};

// @desc    Remove/disable organizer
// @route   PUT /api/admin/organizers/:id/toggle-active
// @access  Private (Admin)
const toggleOrganizerActive = async (req, res) => {
  try {
    const organizer = await Organizer.findById(req.params.id);

    if (!organizer) {
      return res.status(404).json({
        message: 'Organizer not found',
      });
    }

    organizer.isActive = !organizer.isActive;
    await organizer.save();

    res.json({
      message: `Organizer ${organizer.isActive ? 'activated' : 'deactivated'} successfully`,
      organizer,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Server error',
    });
  }
};

// @desc    Delete organizer permanently
// @route   DELETE /api/admin/organizers/:id
// @access  Private (Admin)
const deleteOrganizer = async (req, res) => {
  try {
    const organizer = await Organizer.findById(req.params.id);

    if (!organizer) {
      return res.status(404).json({
        message: 'Organizer not found',
      });
    }

    // Check if organizer has any events
    const Event = require('../models/Event');
    const eventCount = await Event.countDocuments({ organizer: req.params.id });

    if (eventCount > 0) {
      return res.status(400).json({
        message: 'Cannot delete organizer with existing events. Deactivate instead.',
      });
    }

    await organizer.deleteOne();

    res.json({
      message: 'Organizer deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      message: 'Server error',
    });
  }
};

// @desc    Get all password reset requests
// @route   GET /api/admin/password-resets
// @access  Private (Admin)
const getPasswordResets = async (req, res) => {
  try {
    const requests = await PasswordReset.find({ status: 'Pending' }).sort({ requestedAt: -1 });

    res.json({
      count: requests.length,
      requests,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Server error',
    });
  }
};

// @desc    Approve password reset
// @route   PUT /api/admin/password-resets/:id/approve
// @access  Private (Admin)
const approvePasswordReset = async (req, res) => {
  try {
    const resetRequest = await PasswordReset.findById(req.params.id);

    if (!resetRequest) {
      return res.status(404).json({
        message: 'Reset request not found',
      });
    }

    if (resetRequest.status !== 'Pending') {
      return res.status(400).json({
        message: 'Request has already been processed',
      });
    }

    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({
        message: 'New password is required',
      });
    }

    // Update user password based on type
    let user;
    if (resetRequest.userType === 'participant') {
      const Participant = require('../models/Participant');
      user = await Participant.findOne({ email: resetRequest.email });
    } else if (resetRequest.userType === 'organizer') {
      user = await Organizer.findOne({ email: resetRequest.email });
    }

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    user.password = newPassword;
    await user.save();

    resetRequest.status = 'Approved';
    await resetRequest.save();

    res.json({
      message: 'Password reset approved and updated successfully',
    });
  } catch (error) {
    console.error('Approve password reset error:', error);
    res.status(500).json({
      message: 'Server error',
    });
  }
};

// @desc    Reject password reset
// @route   PUT /api/admin/password-resets/:id/reject
// @access  Private (Admin)
const rejectPasswordReset = async (req, res) => {
  try {
    const resetRequest = await PasswordReset.findById(req.params.id);

    if (!resetRequest) {
      return res.status(404).json({
        message: 'Reset request not found',
      });
    }

    resetRequest.status = 'Rejected';
    await resetRequest.save();

    res.json({
      message: 'Password reset request rejected',
    });
  } catch (error) {
    res.status(500).json({
      message: 'Server error',
    });
  }
};

// @desc    Request password reset (for participants/organizers)
// @route   POST /api/admin/password-reset-request
// @access  Public
const requestPasswordReset = async (req, res) => {
  try {
    const { email, userType } = req.body;

    // Check if user exists
    let user;
    if (userType === 'participant') {
      const Participant = require('../models/Participant');
      user = await Participant.findOne({ email });
    } else if (userType === 'organizer') {
      user = await Organizer.findOne({ email });
    }

    if (!user) {
      // Don't reveal if email exists
      return res.json({
        message: 'If the email exists, a password reset request has been submitted',
      });
    }

    // Generate token
    const token = crypto.randomBytes(32).toString('hex');

    // Create reset request
    await PasswordReset.create({
      email,
      userType,
      token,
    });

    res.json({
      message: 'Password reset request submitted. Please wait for admin approval.',
    });
  } catch (error) {
    res.status(500).json({
      message: 'Server error',
    });
  }
};

module.exports = {
  createOrganizer,
  getAllOrganizers,
  toggleOrganizerActive,
  deleteOrganizer,
  getPasswordResets,
  approvePasswordReset,
  rejectPasswordReset,
  requestPasswordReset,
};
