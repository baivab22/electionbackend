const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Use a flexible schema for newCandidate
const newCandidateSchema = new mongoose.Schema({}, { strict: false });
const NewCandidate = mongoose.model('NewCandidate', newCandidateSchema, 'newCandidate');

// GET all new candidates
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 0;
    const candidates = await NewCandidate.find({}).limit(limit);
    res.json(candidates);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch new candidates' });
  }
});

// GET a single new candidate by ID
router.get('/:id', async (req, res) => {
  try {
    const candidate = await NewCandidate.findById(req.params.id);
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
    res.json(candidate);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch candidate' });
  }
});

module.exports = router;
