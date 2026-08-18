const xlsx = require('xlsx');
const path = require('path');

const filePath = path.join("/Users/mohamedarshad/Desktop/CO's", 'NEW_Unittest_template.xlsx');
const wb = xlsx.readFile(filePath);
const sheetName = wb.SheetNames[0];
const sheet = wb.Sheets[sheetName];
const json = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: null });

for (let i = 0; i < Math.min(json.length, 25); i++) {
    const row = json[i];
    if (row) {
        console.log(`Row ${i}:`, row.slice(0, 15));
    }
}
