const xlsx = require('xlsx');
const path = require('path');

const dir = "/Users/mohamedarshad/Desktop/CO's Templates";

const files = [
    'Unittest_template.xlsx',
    'assesment_template.xlsx',
    'semester_template.xlsx'
];

files.forEach(file => {
    console.log(`\n\n=== ${file} ===`);
    try {
        const fullPath = path.join(dir, file);
        const workbook = xlsx.readFile(fullPath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Convert to array of arrays to see raw layout
        const data = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: null });

        // Print first 10 rows
        for (let i = 0; i < Math.min(10, data.length); i++) {
            console.log(`Row ${i + 1}:`, data[i]);
        }
    } catch (e) {
        console.error("Error reading", file, e);
    }
});
