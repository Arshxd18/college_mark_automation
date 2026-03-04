import * as xlsx from 'xlsx';
import * as fs from 'fs';

const filePath = "../CO's Templates/coaverage_template.xlsx";
const buffer = fs.readFileSync(filePath);
const workbook = xlsx.read(buffer, { type: 'buffer' });
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const json = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

console.log("JSON Length:", json.length);
console.log("First 10 rows:");
console.dir(json.slice(0, 10), { depth: null });

let headerRowIndex = 0;
while (headerRowIndex < json.length) {
    const row = json[headerRowIndex];
    if (row && row[1] && typeof row[1] === 'string' && row[1].toUpperCase().includes('REG')) {
        break;
    }
    headerRowIndex++;
}
console.log("Header row index:", headerRowIndex);

const startIndex = headerRowIndex !== json.length ? headerRowIndex + 1 : 1;
const totals = { co1: [], co2: [], co3: [], co4: [], co5: [], co6: [] };

for (let i = startIndex; i < json.length; i++) {
    const row = json[i];
    if (!row || !Array.isArray(row)) continue;
    if (typeof row[0] === 'string' && (row[0].toLowerCase().includes('s.no') || row[0].toLowerCase().includes('attainment') || row[0].toLowerCase().includes('no of students'))) continue;
    if (typeof row[5] === 'string' && (row[5].toLowerCase().includes('attainment level') || row[5].toLowerCase().includes('no. of studetns'))) continue;

    const regNo = row[1];
    if (!regNo || regNo === "" || typeof regNo === 'object') continue;

    ["co1", "co2", "co3", "co4", "co5", "co6"].forEach((co, idx) => {
        const mark = row[4 + idx];
        if (mark !== undefined && mark !== null && mark !== "") {
            totals[co].push(Number(mark));
        }
    });
}

const levels = {};
["co1", "co2", "co3", "co4", "co5", "co6"].forEach((co) => {
    const vals = totals[co];
    const attended = vals.length;
    const scoring60 = vals.filter(v => v >= 60).length;
    const pct = attended > 0 ? (scoring60 / attended) * 100 : 0;

    let level = 0;
    if (pct >= 80) level = 3;
    else if (pct >= 70) level = 2;
    else if (pct >= 60) level = 1;

    levels[co] = { pct: pct.toFixed(2), level };
});

console.log("Computed Levels:", levels);
