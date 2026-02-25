const xlsx = require('xlsx');
const path = require('path');

const dir = "/Users/mohamedarshad/Desktop/CO's Templates";

const file = 'Unittest_template.xlsx';
const wbu = xlsx.readFile(path.join(dir, file));
const datau = xlsx.utils.sheet_to_json(wbu.Sheets[wbu.SheetNames[0]], { header: "A", defval: null });

console.log("=== Unit Test Template ===");
console.log("Row 1", datau[0]);
console.log("Row 2", datau[1]);
console.log("Row 3", datau[2]);
console.log("Row 4", datau[3]);
console.log("Row 5", datau[4]);

const file2 = 'assesment_template.xlsx';
const wba = xlsx.readFile(path.join(dir, file2));
const dataa = xlsx.utils.sheet_to_json(wba.Sheets[wba.SheetNames[0]], { header: "A", defval: null });

console.log("\n=== Assignment Template ===");
console.log("Row 3", dataa[2]);
console.log("Row 4", dataa[3]);
console.log("Row 5", dataa[4]);
