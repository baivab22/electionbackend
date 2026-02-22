// Script to convert newCandidate.xlsx to mycandidate.json with empty strings for missing values
// Usage: node xlsx-to-json.js

const xlsx = require('xlsx');
const fs = require('fs');

const inputPath = __dirname + '/newCandidate.xlsx';
const outputPath = __dirname + '/mycandidate.json';

const workbook = xlsx.readFile(inputPath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
let data = xlsx.utils.sheet_to_json(sheet, { defval: '' }); // defval sets empty string for missing values

// Optionally, ensure all keys exist for each object (normalize columns)
const allKeys = Array.from(new Set(data.flatMap(obj => Object.keys(obj))));
data = data.map(obj => {
  const normalized = {};
  for (const key of allKeys) {
    normalized[key] = obj[key] !== undefined ? obj[key] : '';
  }
  return normalized;
});

fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf8');
console.log('Converted to', outputPath);
