const xlsx = require('xlsx');

const filePath = "/Users/mohamedarshad/Desktop/CO's/NEWEXCEL.xlsx";
const wb = xlsx.readFile(filePath);

console.log("=== Sheet Names ===");
console.log(wb.SheetNames);

wb.SheetNames.forEach(name => {
    const sheet = wb.Sheets[name];
    const range = xlsx.utils.decode_range(sheet['!ref'] || 'A1:A1');
    const json = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: null });

    console.log(`\n\n===== SHEET: "${name}" (${range.e.c + 1} cols, ${range.e.r + 1} rows) =====`);

    // Print first 5 rows (headers)
    json.slice(0, 5).forEach((row, i) => {
        if (!row || !Array.isArray(row)) return;
        const hasContent = row.some(c => c !== null && c !== undefined && c !== '');
        if (hasContent) {
            // Print ALL columns
            console.log(`Row ${i + 1}: ${row.map((v, idx) => `[${idx}]:${JSON.stringify(v)}`).join('  ')}`);
        }
    });

    // Print last 15 rows (summaries)
    console.log(`  ... (${Math.max(0, json.length - 5)} rows below header) ...`);
    json.slice(-15).forEach((row, i) => {
        if (!row || !Array.isArray(row)) return;
        const hasContent = row.some(c => c !== null && c !== undefined && c !== '');
        if (hasContent) {
            console.log(`Row ${json.length - 15 + i + 1}: ${row.map((v, idx) => `[${idx}]:${JSON.stringify(v)}`).join('  ')}`);
        }
    });
});
