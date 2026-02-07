const express = require('express');
const router = express.Router();
const pollController = require('../controllers/pollController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/', pollController.listPolls);
router.get('/:id', pollController.getPoll);
router.post('/:id/vote', pollController.vote);
router.get('/:id/results', pollController.results);
router.get('/:id/check', pollController.checkStatus);

// Admin (protected)
router.post('/', protect, authorize('admin'), pollController.createPoll);
router.put('/:id/toggle', protect, authorize('admin'), pollController.togglePoll);

module.exports = router;
