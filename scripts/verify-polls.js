/**
 * Verification script to check if sample polls exist in database
 * Run: node verify-polls.js
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const Poll = require('../models/Poll');

const MONGO_URI = process.env.MONGO_URL || 'mongodb://localhost:27017/election-app';

async function verifyPolls() {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('\n✓ Connected to MongoDB\n');

    // Get all active polls
    const polls = await Poll.find({ isActive: true }).sort({ createdAt: -1 });

    if (polls.length === 0) {
      console.log('❌ No active polls found in database');
      process.exit(0);
    }

    console.log(`📊 Found ${polls.length} active polls:\n`);

    polls.forEach((poll, index) => {
      const totalVotes = poll.choices.reduce((sum, c) => sum + (c.votesCount || 0), 0);
      console.log(`${index + 1}. ${poll.title}`);
      console.log(`   📌 ID: ${poll._id}`);
      console.log(`   📈 Total Votes: ${totalVotes.toLocaleString()}`);
      console.log(`   ⏰ Active: ${poll.isActive ? '✓ Yes' : '✗ No'}`);
      console.log(`   📝 Choices (${poll.choices.length}):`);
      
      poll.choices.forEach((choice) => {
        const percentage = totalVotes > 0 ? ((choice.votesCount / totalVotes) * 100).toFixed(1) : 0;
        const barLength = Math.round(percentage / 2);
        const bar = '█'.repeat(barLength) + '░'.repeat(50 - barLength);
        console.log(`      • ${choice.label.padEnd(35)} ${bar} ${choice.votesCount} (${percentage}%)`);
      });
      console.log('');
    });

    console.log('✨ Polls are ready to display on the home page!\n');
    console.log('🔗 Test URLs:');
    polls.slice(0, 1).forEach(poll => {
      console.log(`   • Results: http://localhost:5000/api/polls/${poll._id}/results`);
      console.log(`   • Full Poll: http://localhost:5000/api/polls/${poll._id}`);
    });
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error verifying polls:', error.message);
    process.exit(1);
  }
}

verifyPolls();
