const xlsx = require('xlsx');
const path = require('path');

const filePath = path.join("/Users/mohamedarshad/Desktop/CO's", 'NEW_Unittest_template.xlsx');
const wb = xlsx.readFile(filePath);
const sheetName = wb.SheetNames[0];
const sheet = wb.Sheets[sheetName];
const json = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: null });

for (let i = 0; i < json.length; i++) {
    const row = json[i];
    if (row) {
        for (let col = 33; col < row.length; col++) {
            if (row[col] !== null && row[col] !== '') {
                console.log(`Row ${i}, Col ${col}:`, row[col]);
            }
        }
    }
}
