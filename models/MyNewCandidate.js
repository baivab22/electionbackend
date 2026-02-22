const mongoose = require('mongoose');

const myNewCandidateSchema = new mongoose.Schema({
  ageDetails: { type: String, default: '' },
  profilepicture: { type: String, default: '' },
  area: { type: String, default: '' },
  name: { type: String, default: '' },
  detaildescription: { type: String, default: '' },
  politicalBehaviour: { type: String, default: '' },
  politicalHIstory: { type: String, default: '' },
  politicaltimeline: { type: String, default: '' }
  // Add any additional fields as needed
}, { timestamps: true, collection: 'mynewcandidate' });

module.exports = mongoose.model('mynewcandidate', myNewCandidateSchema);
