const XLSX = require('xlsx');

try {
    const workbook = XLSX.readFile('/Users/mohamedarshad/Desktop/CO\'s/sample1.xlsx');
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    console.log("--- Excel File Debug ---");
    console.log(`Total Rows: ${json.length}`);
    console.log("First 10 Rows:");
    json.slice(0, 10).forEach((row, idx) => {
        console.log(`Row ${idx}:`, JSON.stringify(row));
    });
} catch (e) {
    console.error("Error reading file:", e);
}
