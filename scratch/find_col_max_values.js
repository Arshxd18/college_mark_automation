const xlsx = require('xlsx');
const path = require('path');

const filePath = path.join("/Users/mohamedarshad/Desktop/CO's", 'NEW_Unittest_template.xlsx');
const wb = xlsx.readFile(filePath);
const sheetName = wb.SheetNames[0];
const sheet = wb.Sheets[sheetName];
const json = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: null });

const maxVals = {};
for (let c = 3; c <= 32; c++) {
    let max = 0;
    for (let r = 2; r < 93; r++) {
        const val = json[r]?.[c];
        if (val !== null && val !== undefined && val !== "") {
            const num = Number(val);
            if (num > max) max = num;
        }
    }
    if (max > 0) {
        maxVals[c] = max;
    }
}
console.log("Column index to Max Value map:", maxVals);
