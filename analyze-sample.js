const xlsx = require('xlsx');
const path = require('path');

const filePath = '/Users/mohamedarshad/Desktop/CO\'s/sampleformulafile.xlsx';
const wb = xlsx.readFile(filePath);

console.log("=== Sheet Names ===");
console.log(wb.SheetNames);

wb.SheetNames.forEach(name => {
    const sheet = wb.Sheets[name];
    const json = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: null });

    console.log(`\n===== SHEET: "${name}" =====`);
    json.slice(0, 40).forEach((row, i) => {
        if (!row || !Array.isArray(row)) return;
        const hasContent = row.some(c => c !== null && c !== undefined && c !== '');
        if (hasContent) {
            console.log(`Row ${i + 1}:`, row);
        }
    });
});
