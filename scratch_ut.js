const xlsx = require('xlsx');
const path = require('path');

const dir = "/Users/mohamedarshad/Desktop/CO's Templates";
const file = 'Unittest_template.xlsx';
const wb = xlsx.readFile(path.join(dir, file));
const sheet = wb.Sheets[wb.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: null });

console.log("=== Row 1 ===");
data[0].forEach((val, colIdx) => {
    if (val !== null) console.log(`Col ${colIdx}: ${val}`);
});

console.log("\n=== Row 2 (CO mappings) ===");
data[1].forEach((val, colIdx) => {
    if (val !== null) console.log(`Col ${colIdx}: ${val}`);
});

console.log("\n=== Row 4 (Max Marks) ===");
data[3].forEach((val, colIdx) => {
    if (val !== null) console.log(`Col ${colIdx}: ${val}`);
});
