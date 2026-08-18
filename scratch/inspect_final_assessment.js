const xlsx = require('xlsx');
const path = require('path');

const filePath = path.join("/Users/mohamedarshad/Desktop/CO's", 'Final_assesment_template.xlsx');
const wb = xlsx.readFile(filePath);
const sheetName = wb.SheetNames[0];
const sheet = wb.Sheets[sheetName];
const json = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: null });

console.log("=== First 10 rows of Final_assesment_template.xlsx ===");
for (let i = 0; i < Math.min(json.length, 12); i++) {
    const row = json[i];
    console.log(`Row ${i}:`, row ? row.slice(0, 30) : null);
}
