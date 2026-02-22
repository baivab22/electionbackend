const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Samanupatik = require('../models/Samanupatik');

// GET all samanupatik candidates
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 0;
    const candidates = await Samanupatik.find({}).limit(limit);
    res.json({ success: true, data: candidates });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch samanupatik candidates' });
  }
});

// GET a single samanupatik candidate by ID
router.get('/:id', async (req, res) => {
  try {
    const candidate = await Samanupatik.findById(req.params.id);
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
    res.json({ success: true, data: candidate });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch candidate' });
  }
});

module.exports = router;
