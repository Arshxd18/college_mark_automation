const xlsx = require('xlsx');
const path = require('path');

const filePath = path.join("/Users/mohamedarshad/Desktop/CO's", 'NEW_Unittest_template.xlsx');
const wb = xlsx.readFile(filePath);
const sheetName = wb.SheetNames[0];
const sheet = wb.Sheets[sheetName];
const json = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: null });

console.log("Total rows:", json.length);
json.forEach((row, idx) => {
    if (!row) return;
    const rowStr = JSON.stringify(row).toLowerCase();
    if (rowStr.includes("max") || rowStr.includes("target") || rowStr.includes("total")) {
        console.log(`Row ${idx} matches:`, row.slice(0, 15));
    }
});
