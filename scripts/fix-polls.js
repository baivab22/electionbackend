const mongoose = require('mongoose');
require('dotenv').config();

const Poll = require('../models/Poll');

async function fixPolls() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/election-app');
    console.log('Connected to MongoDB');

    // Find all polls
    const polls = await Poll.find({});
    console.log(`Found ${polls.length} polls`);

    for (const poll of polls) {
      console.log(`\nPoll: ${poll.title}`);
      console.log(`  ID: ${poll._id}`);
      console.log(`  isActive: ${poll.isActive}`);
      console.log(`  startAt: ${poll.startAt}`);
      console.log(`  endAt: ${poll.endAt}`);
      console.log(`  isOpen(): ${poll.isOpen()}`);
      
      // Fix: Ensure poll is active and remove endAt if it's causing issues
      let updated = false;
      
      if (!poll.isActive) {
        poll.isActive = true;
        updated = true;
        console.log('  ✓ Set isActive to true');
      }
      
      // If endAt is in the past, remove it or extend it
      if (poll.endAt && new Date() > poll.endAt) {
        // Extend endAt by 30 days from now
        poll.endAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        updated = true;
        console.log(`  ✓ Extended endAt to: ${poll.endAt}`);
      }
      
      // If startAt is in the future, set it to now
      if (poll.startAt && new Date() < poll.startAt) {
        poll.startAt = new Date();
        updated = true;
        console.log(`  ✓ Set startAt to now: ${poll.startAt}`);
      }
      
      if (updated) {
        await poll.save();
        console.log(`  ✓ Poll updated successfully`);
        console.log(`  New isOpen(): ${poll.isOpen()}`);
      } else {
        console.log('  No updates needed');
      }
    }

    console.log('\n✓ All polls checked and fixed!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixPolls();
