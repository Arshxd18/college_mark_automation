const xlsx = require('xlsx');
const path = require('path');

const filePath = path.join("/Users/mohamedarshad/Desktop/CO's", 'NEW_Unittest_template.xlsx');
const wb = xlsx.readFile(filePath);
const sheetName = wb.SheetNames[0];
const sheet = wb.Sheets[sheetName];
const json = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: null });

console.log("Row 0 length:", json[0].length);
console.log("Row 0 full:", json[0]);
console.log("Row 1 full:", json[1]);
console.log("Row 2 full:", json[2]);
