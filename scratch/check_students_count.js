const xlsx = require('xlsx');
const path = require('path');

const filePath = path.join("/Users/mohamedarshad/Desktop/CO's", 'Final_assesment_template.xlsx');
const wb = xlsx.readFile(filePath);
const sheetName = wb.SheetNames[0];
const sheet = wb.Sheets[sheetName];
const json = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: null });

let studentCount = 0;
for (let i = 2; i < json.length; i++) {
    const row = json[i];
    if (row && row[2]) {
        studentCount++;
    }
}
console.log("Total rows in sheet:", json.length);
console.log("Rows with NAME in sheet:", studentCount);

// Let's find where the names end
let lastIdx = -1;
for (let i = 2; i < json.length; i++) {
    const row = json[i];
    if (row && row[2]) {
        lastIdx = i;
    }
}
console.log("Last row index with NAME:", lastIdx);
console.log("Last student row content:", json[lastIdx]);
