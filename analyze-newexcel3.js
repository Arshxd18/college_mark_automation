const xlsx = require('xlsx');

const filePath = "/Users/mohamedarshad/Desktop/CO's/NEWEXCEL.xlsx";
const wb = xlsx.readFile(filePath);

const sheetName = wb.SheetNames[0];
const sheet = wb.Sheets[sheetName];
const json = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: null });

console.log(`Total rows: ${json.length}`);

// Print first 4 rows completely (all columns)
console.log("\n=== FIRST 4 ROWS (header) ===");
json.slice(0, 4).forEach((row, i) => {
    console.log(`\nRow ${i + 1}:`);
    if (Array.isArray(row)) {
        row.forEach((v, idx) => { if (v !== null) console.log(`  col[${idx}]: ${JSON.stringify(v)}`); });
    }
});

// Print rows 509-516 (summary rows at bottom of NEWEXCEL from user message)
console.log("\n=== ROWS 509-520 (summary area) ===");
json.slice(508, 520).forEach((row, i) => {
    const rowNum = 509 + i;
    if (Array.isArray(row)) {
        const nonNull = row.map((v, idx) => v !== null ? `col[${idx}]:${JSON.stringify(v)}` : null).filter(Boolean);
        if (nonNull.length > 0) {
            console.log(`Row ${rowNum}: ${nonNull.join('  ')}`);
        }
    }
});

// Also derive header from coaverage template to understand col mapping
const coavgFile = "/Users/mohamedarshad/Desktop/CO's Templates/coaverage_template.xlsx";
const wb2 = xlsx.readFile(coavgFile);
const coSheet = wb2.Sheets[wb2.SheetNames[0]];
const coJson = xlsx.utils.sheet_to_json(coSheet, { header: 1, defval: null });

console.log("\n=== CO AVG TEMPLATE - Row 1 header ===");
const headerRow = coJson[0];
if (Array.isArray(headerRow)) {
    headerRow.forEach((v, idx) => { if (v !== null) console.log(`  col[${idx}]: ${JSON.stringify(v)}`); });
}

console.log("\n=== CO AVG TEMPLATE - Rows 508-515 (summary rows) ===");
coJson.slice(507, 515).forEach((row, i) => {
    const rowNum = 508 + i;
    if (Array.isArray(row)) {
        const nonNull = row.map((v, idx) => v !== null ? `col[${idx}]:${JSON.stringify(v)}` : null).filter(Boolean);
        if (nonNull.length > 0) {
            console.log(`Row ${rowNum}: ${nonNull.join('  ')}`);
        }
    }
});
