const xlsx = require('xlsx');
const path = require('path');

const filePath = path.join("/Users/mohamedarshad/Desktop/CO's", 'NEW_Unittest_template.xlsx');
const wb = xlsx.readFile(filePath);
const sheetName = wb.SheetNames[0];
const sheet = wb.Sheets[sheetName];
const json = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: null });

console.log("Row 0:", json[0].slice(0, 10));
console.log("Row 1:", json[1].slice(0, 10));
console.log("Row 2:", json[2].slice(0, 10));

// Let's count how many students are there
let studentCount = 0;
for (let i = 2; i < json.length; i++) {
    const row = json[i];
    if (row && row[2]) {
        studentCount++;
    }
}
console.log("Rows with a value in column 2 (NAME):", studentCount);

// Let's print rows around row 60 to 70
console.log("--- Rows 60 to 65 ---");
for (let i = 60; i < 65; i++) {
    console.log(`Row ${i}:`, json[i] ? json[i].slice(0, 5) : null);
}

// Let's see if there are columns past col 32
console.log("--- Rows 100 to 105 columns 30-36 ---");
for (let i = 100; i < 105; i++) {
    console.log(`Row ${i} cols 30-36:`, json[i] ? json[i].slice(30, 37) : null);
}
