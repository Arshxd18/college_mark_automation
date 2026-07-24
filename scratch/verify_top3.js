/**
 * Verification script for Top-3 Unit Test logic.
 * Reads the Unittest_template.xlsx and simulates what our calculations.ts does.
 */
const xlsx = require('xlsx');
const path = require('path');

const dir = "/Users/mohamedarshad/Desktop/CO's Templates";
const file = 'Unittest_template.xlsx';
const wb = xlsx.readFile(path.join(dir, file));
const sheet = wb.Sheets[wb.SheetNames[0]];
const json = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: null });

// ---- Parse config (mirrors parseUnitTest from excel-parser.ts) ----
const coRow = json[1] || [];
const maxMarksRow = json[3] || [];
const qConfig = {};
for (let c = 3; c <= 14; c++) {
    const coLabel = coRow[c];
    const maxMark = maxMarksRow[c + 24]; // offset by 24
    if (coLabel && maxMark) {
        const normalized = coLabel.toString().toLowerCase().replace(/[^a-z0-9]/g, '');
        if (normalized.startsWith('co')) {
            qConfig[`u${c - 2}`] = { maxMark: Number(maxMark), co: normalized };
        }
    }
}

console.log("=== Question Config (12 question keys: u1-u12) ===");
Object.entries(qConfig).forEach(([k, v]) => console.log(`  ${k}: CO=${v.co}, Max=${v.maxMark}`));

// ---- Parse students ----
const students = [];
for (let i = 4; i < Math.min(json.length, 10); i++) {
    const row = json[i];
    if (!row || !Array.isArray(row) || !row[0]) continue;
    const regNo = row[1]; const name = row[2];
    if (!regNo || !name) continue;
    const marks = {};
    for (let c = 3; c <= 14; c++) {
        const mark = row[c];
        if (mark !== undefined && mark !== null && mark !== '') {
            marks[`u${c - 2}`] = Number(mark);
        }
    }
    students.push({ name: String(name), regNo: String(regNo), marks });
}

// ---- Unit Definitions (mirrors calculations.ts) ----
// Col 3-4 = Unit Test 1 (u1, u2)
// Col 5-7 = Unit Test 2 (u3, u4, u5)  but col 5=row[5] in 0-indexed => u3=col5-2=3, u4=col6-2=4... wait
// Let's check: c=3 => u1, c=4 => u2, c=5 => u3, c=6 => u4, c=7 => u5, c=8 => u6, c=9 => u7, c=10 => u8, c=11 => u9, c=12 => u10, c=13 => u11, c=14 => u12
// And from Row 1 header: Col 3 = Unit Test 1, Col 5 = Unit Test 2, Col 8 = Unit Test 3, Col 10 = Unit Test 4, Col 13 = Unit Test 5
// But index in json (0-indexed): Row 1 = json[0], and data[0][3] = Unit Test 1, data[0][5] = Unit Test 2...
// Wait the template uses merged cells so:
// Unit Test 1: cols 3,4 (u1, u2)
// Unit Test 2: cols 5,6,7 (u3, u4, u5) 
// Unit Test 3: cols 8,9 (u6, u7)
// Unit Test 4: cols 10,11,12 (u8, u9, u10)
// Unit Test 5: cols 13,14 (u11, u12)
// This matches what we put in calculations.ts utDefinitions!

const utDefinitions = [
    { id: 1, keys: ["u1", "u2"] },
    { id: 2, keys: ["u3", "u4", "u5"] },
    { id: 3, keys: ["u6", "u7"] },
    { id: 4, keys: ["u8", "u9", "u10"] },
    { id: 5, keys: ["u11", "u12"] },
];

function getFilteredUT(marks, config) {
    const utScores = utDefinitions.map(ut => {
        let obtained = 0, max = 0;
        ut.keys.forEach(k => {
            const m = marks[k];
            if (m !== undefined && m !== null) {
                obtained += m;
                max += config[k]?.maxMark ?? 0;
            }
        });
        const pct = max > 0 ? (obtained / max) * 100 : 0;
        return { ...ut, obtained, max, pct };
    });
    return utScores;
}

// ---- For each student, show all 5 UT scores and which 3 are selected ----
console.log("\n=== TOP-3 UNIT TEST SELECTION VERIFICATION ===\n");
students.forEach(s => {
    const scores = getFilteredUT(s.marks, qConfig);
    const sorted = [...scores].sort((a, b) => b.pct - a.pct);
    const top3 = sorted.slice(0, 3);
    const keptKeys = new Set(top3.flatMap(ut => ut.keys));

    console.log(`Student: ${s.name} (${s.regNo})`);
    scores.forEach(ut => {
        const selected = top3.find(t => t.id === ut.id);
        console.log(`  UT${ut.id}: obtained=${ut.obtained}/${ut.max} (${ut.pct.toFixed(1)}%) ${selected ? '✅ SELECTED' : '❌ DROPPED'}`);
    });

    // CO attainment from kept UTs only
    const coTotals = { co1: 0, co2: 0, co3: 0, co4: 0, co5: 0, co6: 0 };
    const coMax = { co1: 0, co2: 0, co3: 0, co4: 0, co5: 0, co6: 0 };
    Object.keys(qConfig).forEach(k => {
        if (keptKeys.has(k)) {
            const m = s.marks[k] ?? 0;
            const co = qConfig[k].co;
            coTotals[co] += m;
            coMax[co] += qConfig[k].maxMark;
        }
    });

    console.log(`  CO Attainment:`);
    Object.keys(coTotals).forEach(co => {
        const pct = coMax[co] > 0 ? ((coTotals[co] / coMax[co]) * 100).toFixed(2) : '-';
        console.log(`    ${co}: ${coTotals[co]}/${coMax[co]} = ${pct}%`);
    });
    console.log();
});
