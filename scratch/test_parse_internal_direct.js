const xlsx = require('xlsx');
const path = require('path');

const filePath = path.join("/Users/mohamedarshad/Desktop/CO's", 'Internal1_template.xlsx');
const wb = xlsx.readFile(filePath);
const sheetName = wb.SheetNames[0];
const sheet = wb.Sheets[sheetName];
const json = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: null });

let headerRowIndex = -1;
let maxMarkRowIndex = -1;
let coRowIndex = -1;

for (let i = 0; i < json.length; i++) {
    const row = json[i];
    if (!row || !Array.isArray(row) || row.length === 0) continue;

    const rowStr = row.map(c => c ? c.toString().toUpperCase() : "").join(" ");

    if (rowStr.includes("REG") && (rowStr.includes("NAME") || rowStr.includes("STUDENT"))) {
        headerRowIndex = i;
    }

    if (rowStr.includes("MAXIMUM") || rowStr.includes("MAX MARK")) {
        maxMarkRowIndex = i;
    }
    
    if (rowStr.includes("COURSE OUTCOME") || rowStr.includes("CO MAPPING")) {
        coRowIndex = i;
    }
}

console.log("headerRowIndex:", headerRowIndex);
console.log("maxMarkRowIndex:", maxMarkRowIndex);
console.log("coRowIndex:", coRowIndex);

