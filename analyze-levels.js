const xlsx = require('xlsx');
const path = require('path');

const filePath = '/Users/mohamedarshad/Desktop/CO\'s/sampleformulafile.xlsx';
const wb = xlsx.readFile(filePath);

// Read assignment sheet CO attainment section - key rows
const sheetNames = wb.SheetNames;
console.log("All sheets:", sheetNames);

// Look at the CO attainment sheet starting from row 1 for levels
const coAttainSheet = wb.Sheets["CO's Attainment"];
const data = xlsx.utils.sheet_to_json(coAttainSheet, { header: 1, defval: null });

console.log("\n=== Full CO's Attainment Sheet (first 10 rows) ===");
data.slice(0, 10).forEach((row, i) => {
    console.log(`Row ${i + 1}:`, row.slice(0, 20));
});

// Look for the summary/level rows at the bottom
console.log("\n=== Checking towards end of CO Attainment sheet ===");
const lastRows = data.slice(-30);
lastRows.forEach((row, i) => {
    const hasContent = row && row.some(c => c !== null && c !== undefined && c !== '');
    if (hasContent) {
        console.log(`Row ${data.length - 30 + i + 1}:`, row.slice(0, 20));
    }
});

// Also check direct attainment sheet in detail
const directSheet = wb.Sheets["Direct Attainment"];
const directData = xlsx.utils.sheet_to_json(directSheet, { header: 1, defval: null });
console.log("\n=== Direct Attainment Sheet (all rows) ===");
directData.forEach((row, i) => {
    const hasContent = row && row.some(c => c !== null && c !== undefined && c !== '');
    if (hasContent) {
        console.log(`Row ${i + 1}:`, row.slice(0, 12));
    }
});

// Check assignment sheet specifically
const assignSheet = wb.Sheets["Assignment"];
if (assignSheet) {
    const assignData = xlsx.utils.sheet_to_json(assignSheet, { header: 1, defval: null });
    console.log("\n=== Assignment Sheet (first 10 rows) ===");
    assignData.slice(0, 10).forEach((row, i) => {
        const hasContent = row && row.some(c => c !== null && c !== undefined && c !== '');
        if (hasContent) console.log(`Row ${i + 1}:`, row.slice(0, 20));
    });
    console.log("Last 10 rows of Assignment:");
    assignData.slice(-15).forEach((row, i) => {
        const hasContent = row && row.some(c => c !== null && c !== undefined && c !== '');
        if (hasContent) console.log(`Row ${assignData.length - 15 + i + 1}:`, row.slice(0, 20));
    });
}
