const xlsx = require('xlsx');
const path = require('path');

const file1 = path.join("/Users/mohamedarshad/Desktop/CO's", 'Internal1_template.xlsx');
const wb1 = xlsx.readFile(file1);
const sheetName1 = wb1.SheetNames[0];
const sheet1 = wb1.Sheets[sheetName1];
const json1 = xlsx.utils.sheet_to_json(sheet1, { header: 1, defval: null });

console.log("=== First 5 rows of Internal1_template.xlsx ===");
for (let i = 0; i < Math.min(json1.length, 6); i++) {
    const row = json1[i];
    console.log(`Row ${i}:`, row ? row.slice(0, 15) : null);
}

const file2 = path.join("/Users/mohamedarshad/Desktop/CO's", 'Internal2_template.xlsx');
let json2 = null;
try {
    const wb2 = xlsx.readFile(file2);
    const sheetName2 = wb2.SheetNames[0];
    const sheet2 = wb2.Sheets[sheetName2];
    json2 = xlsx.utils.sheet_to_json(sheet2, { header: 1, defval: null });
    console.log("\n=== First 5 rows of Internal2_template.xlsx ===");
    for (let i = 0; i < Math.min(json2.length, 6); i++) {
        const row = json2[i];
        console.log(`Row ${i}:`, row ? row.slice(0, 15) : null);
    }
} catch (e) {
    console.log("\nError reading Internal2_template.xlsx:", e.message);
}
