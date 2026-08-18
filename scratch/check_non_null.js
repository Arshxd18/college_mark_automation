const xlsx = require('xlsx');
const path = require('path');

const filePath = path.join("/Users/mohamedarshad/Desktop/CO's", 'NEW_Unittest_template.xlsx');
const wb = xlsx.readFile(filePath);
const sheetName = wb.SheetNames[0];
const sheet = wb.Sheets[sheetName];
const json = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: null });

let lastIdx = -1;
for (let i = json.length - 1; i >= 0; i--) {
    const row = json[i];
    if (row && row.some(cell => cell !== null && cell !== '')) {
        lastIdx = i;
        break;
    }
}
console.log("Last row index with data:", lastIdx);
if (lastIdx !== -1) {
    console.log("Last data row:", json[lastIdx].slice(0, 15));
    // Print 5 rows before the last row
    for (let i = Math.max(0, lastIdx - 5); i <= lastIdx; i++) {
        console.log(`Row ${i}:`, json[i] ? json[i].slice(0, 15) : null);
    }
}
