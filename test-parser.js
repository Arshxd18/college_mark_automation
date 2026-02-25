const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

// Compile the excel-parser logic for Node specifically for testing
const tsParserContent = fs.readFileSync(path.join(__dirname, 'src/lib/excel-parser.ts'), 'utf8');

// Quick and dirty way to test the logic:
function runParserTest(filename, typeName) {
    const fullPath = path.join("/Users/mohamedarshad/Desktop/CO's Templates", filename);
    const workbook = xlsx.readFile(fullPath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const json = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    // We can extract just the parse functions by simulating
    const parseCode = tsParserContent.split("export const parseExcelUpload")[1];

    // Actually it's easier to just use the ts-node or Next dev server to test, 
    // but a quick JS evaluate is fine
}
