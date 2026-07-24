const xlsx = require('xlsx');

const filePath = '/Users/mohamedarshad/Desktop/CO\'s/sampleformulafile.xlsx';
const wb = xlsx.readFile(filePath, { cellFormula: true });
const sheet = wb.Sheets["UNIT TEST"];
const data = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: null });

console.log("=== Dumping first 5 rows of UNIT TEST sheet ===");
for (let r = 0; r < 6; r++) {
    const row = data[r];
    if (!row) continue;
    console.log(`\nRow ${r + 1}:`);
    row.forEach((val, c) => {
        const cellRef = xlsx.utils.encode_cell({ r, c });
        const cell = sheet[cellRef];
        if (val !== null || cell) {
            console.log(`  Col ${c} (${cellRef}): val = ${JSON.stringify(val)}, formula = ${cell ? cell.f || 'none' : 'none'}`);
        }
    });
}
