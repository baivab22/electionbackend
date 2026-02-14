const express = require('express');
const router = express.Router();
const {
  registerVolunteer,
  getAllVolunteers,
  getVolunteer,
  updateVolunteer,
  deleteVolunteer,
  getVolunteerStats,
} = require('../controllers/volunteerController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.post('/register', registerVolunteer);

// Admin only routes
router.get('/', protect, authorize('admin'), getAllVolunteers);
router.get('/stats', protect, authorize('admin'), getVolunteerStats);
router.get('/:id', protect, authorize('admin'), getVolunteer);
router.put('/:id', protect, authorize('admin'), updateVolunteer);
router.delete('/:id', protect, authorize('admin'), deleteVolunteer);

module.exports = router;
