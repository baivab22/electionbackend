// Script to repair and rewrite oldercandidates.json as valid JSON
// Usage: node repair-oldercandidates-json.js

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../data/oldercandidates.json');
const backupPath = path.join(__dirname, '../data/oldercandidates_backup.json');

try {
  // Backup original file
  fs.copyFileSync(filePath, backupPath);
  const raw = fs.readFileSync(filePath, 'utf8');
  let fixed = raw;

  // Try to parse, if fails, attempt to auto-fix
  try {
    JSON.parse(fixed);
    console.log('File is already valid JSON.');
  } catch (e) {
    // Remove trailing commas before closing objects/arrays
    fixed = fixed.replace(/,\s*([}\]])/g, '$1');
    // Remove any BOM
    fixed = fixed.replace(/^\uFEFF/, '');
    // Try to parse again
    try {
      JSON.parse(fixed);
      fs.writeFileSync(filePath, fixed, 'utf8');
      console.log('File repaired and saved.');
    } catch (e2) {
      console.error('Could not auto-fix JSON. Manual inspection required.');
      process.exit(1);
    }
  }
} catch (err) {
  console.error('Error processing file:', err);
  process.exit(1);
}
