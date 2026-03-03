const xlsx = require('xlsx');
const path = require('path');

const filePath = "/Users/mohamedarshad/Desktop/CO's Templates/coaverage_template.xlsx";
const wb = xlsx.readFile(filePath);

console.log("=== Sheet Names ===");
console.log(wb.SheetNames);

wb.SheetNames.forEach(name => {
    const sheet = wb.Sheets[name];
    const json = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: null });

    console.log(`\n\n===== SHEET: "${name}" =====`);
    json.slice(0, 60).forEach((row, i) => {
        if (!row || !Array.isArray(row)) return;
        const hasContent = row.some(c => c !== null && c !== undefined && c !== '');
        if (hasContent) {
            const pretty = row.map((v, idx) => `[${idx}]:${v}`).join('  ');
            console.log(`Row ${i + 1}: ${pretty.substring(0, 300)}`);
        }
    });

    // Also print last 20 rows
    if (json.length > 60) {
        console.log(`  ... (${json.length - 60} rows skipped) ...`);
        json.slice(-20).forEach((row, i) => {
            if (!row || !Array.isArray(row)) return;
            const hasContent = row.some(c => c !== null && c !== undefined && c !== '');
            if (hasContent) {
                const pretty = row.map((v, idx) => `[${idx}]:${v}`).join('  ');
                console.log(`Row ${json.length - 20 + i + 1}: ${pretty.substring(0, 300)}`);
            }
        });
    }
});
