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
        const nonNulls = [];
        row.forEach((cell, colIdx) => {
            if (cell !== null && cell !== '') {
                nonNulls.push({ colIdx, cell });
            }
        });
        if (nonNulls.length > 0 && i < 20) {
            console.log(`Row ${i} non-nulls:`, nonNulls.slice(0, 10));
        } else if (nonNulls.length > 0 && i >= json.length - 20) {
            console.log(`Row ${i} non-nulls:`, nonNulls.slice(0, 10));
        }
    }
}
