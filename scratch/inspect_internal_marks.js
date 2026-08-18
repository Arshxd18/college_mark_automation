const xlsx = require('xlsx');
const path = require('path');

const file1 = path.join("/Users/mohamedarshad/Desktop/CO's", 'Internal1_template.xlsx');
const wb1 = xlsx.readFile(file1);
const sheetName1 = wb1.SheetNames[0];
const sheet1 = wb1.Sheets[sheetName1];
const json1 = xlsx.utils.sheet_to_json(sheet1, { header: 1, defval: null });

console.log("Internal 1 rows count:", json1.length);
for (let i = 2; i < Math.min(json1.length, 10); i++) {
    console.log(`Row ${i}:`, json1[i] ? json1[i].slice(0, 10) : null);
}

const file2 = path.join("/Users/mohamedarshad/Desktop/CO's", 'Internal2_assesment.xlsx');
const wb2 = xlsx.readFile(file2);
const sheetName2 = wb2.SheetNames[0];
const sheet2 = wb2.Sheets[sheetName2];
const json2 = xlsx.utils.sheet_to_json(sheet2, { header: 1, defval: null });

console.log("\nInternal 2 rows count:", json2.length);
for (let i = 2; i < Math.min(json2.length, 10); i++) {
    console.log(`Row ${i}:`, json2[i] ? json2[i].slice(0, 10) : null);
}
