const xlsx = require('xlsx');
const path = require('path');

const filePath = path.join("/Users/mohamedarshad/Desktop/CO's", 'NEW_Unittest_template.xlsx');
const wb = xlsx.readFile(filePath);
const sheetName = wb.SheetNames[0];
const sheet = wb.Sheets[sheetName];
const json = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: null });

console.log("End rows:");
for (let i = json.length - 15; i < json.length; i++) {
    const row = json[i];
    console.log(`Row ${i}:`, row ? row.slice(0, 15) : null);
}
