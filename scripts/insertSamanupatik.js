// Script to convert samanupatiklist.xlsx to JSON and insert into 'samanupatik' collection
const mongoose = require('mongoose');
const XLSX = require('xlsx');
const path = require('path');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/nekapa';
const filePath = path.join(__dirname, '../data/samanupatiklist.xlsx');

const SamanupatikSchema = new mongoose.Schema({}, { strict: false, collection: 'samanupatik' });
const Samanupatik = mongoose.model('Samanupatik', SamanupatikSchema);

async function main() {
  await mongoose.connect(MONGO_URI);
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(sheet);

  if (!jsonData.length) {
    console.error('No data found in Excel file.');
    process.exit(1);
  }

  // Insert all rows into the collection
  await Samanupatik.deleteMany({}); // Optional: clear collection first
  await Samanupatik.insertMany(jsonData);
  console.log(`Inserted ${jsonData.length} records into 'samanupatik' collection.`);
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
