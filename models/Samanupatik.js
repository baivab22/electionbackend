const mongoose = require('mongoose');

const samanupatikSchema = new mongoose.Schema({}, { strict: false, collection: 'samanupatik' });

module.exports = mongoose.model('Samanupatik', samanupatikSchema);