const xlsx = require('xlsx');

const filePath = "/Users/mohamedarshad/Desktop/CO's/NEWEXCEL.xlsx";
const wb = xlsx.readFile(filePath);

console.log("=== Sheet Names ===");
console.log(wb.SheetNames);

wb.SheetNames.forEach(name => {
    const sheet = wb.Sheets[name];
    const json = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: null });

    console.log(`\n\n===== SHEET: "${name}" =====`);

    // Print first 15 rows (headers/structure)
    json.slice(0, 15).forEach((row, i) => {
        if (!row || !Array.isArray(row)) return;
        const hasContent = row.some(c => c !== null && c !== undefined && c !== '');
        if (hasContent) {
            const pretty = row.map((v, idx) => `[${idx}]:${JSON.stringify(v)}`).join('  ');
            console.log(`Row ${i + 1}: ${pretty.substring(0, 400)}`);
        }
    });

    // Print last 20 rows (summary/attainment rows)
    console.log(`  ... (${Math.max(0, json.length - 35)} middle rows omitted) ...`);
    json.slice(-20).forEach((row, i) => {
        if (!row || !Array.isArray(row)) return;
        const hasContent = row.some(c => c !== null && c !== undefined && c !== '');
        if (hasContent) {
            const pretty = row.map((v, idx) => `[${idx}]:${JSON.stringify(v)}`).join('  ');
            console.log(`Row ${json.length - 20 + i + 1}: ${pretty.substring(0, 400)}`);
        }
    });
});
