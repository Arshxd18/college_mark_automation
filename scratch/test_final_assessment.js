const xlsx = require('xlsx');
const path = require('path');

const filePath = path.join("/Users/mohamedarshad/Desktop/CO's", 'Final_assesment_template.xlsx');
const wb = xlsx.readFile(filePath);
const sheetName = wb.SheetNames[0];
const sheet = wb.Sheets[sheetName];
const json = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: null });

console.log("Original template rows count:", json.length);

// Let's add some mock marks to simulate a filled template
// UT1 CO1 (col 3) -> fill with 15
// UT1 CO3 (col 5) -> fill with 10
// UT2 CO2 (col 10) -> fill with 12
for (let r = 2; r < 20; r++) {
    if (json[r]) {
        json[r][3] = 15;
        json[r][5] = 10;
        json[r][10] = 12;
    }
}

// Run the exact parseUnitTest logic
const qConfig = {};
const students = [];
const coRow = json[1] || [];

const getStandardMaxMark = (coLabel) => {
    const co = coLabel.trim().toUpperCase().replace(/\s+/g, "");
    if (co === "CO1" || co === "CO2" || co === "CO5" || co === "CO6") return 20;
    if (co === "CO3") return 13;
    if (co === "CO4") return 14;
    return 20;
};

const activeCols = [];
const colMaxs = {};

let lastStudentRow = 2;
while (lastStudentRow < json.length) {
    const r = json[lastStudentRow];
    if (!r || !r[2] || r[2].toString().trim() === "") {
        break;
    }
    lastStudentRow++;
}

for (let c = 3; c <= 32; c++) {
    let maxObtained = 0;
    let hasMark = false;
    for (let r = 2; r < lastStudentRow; r++) {
        const val = json[r]?.[c];
        if (val !== undefined && val !== null && val !== "") {
            const num = Number(val);
            if (!isNaN(num)) {
                hasMark = true;
                if (num > maxObtained) maxObtained = num;
            }
        }
    }
    if (hasMark) {
        activeCols.push(c);
        colMaxs[c] = maxObtained;
    }
}

activeCols.forEach((c) => {
    const coLabel = coRow[c];
    if (coLabel) {
        const normalizedCo = coLabel.toString().toLowerCase().replace(/[^a-z0-9]/g, '');
        if (normalizedCo.startsWith('co')) {
            const utNum = Math.floor((c - 3) / 6) + 1;
            const key = `u${utNum}_${normalizedCo}`;
            const stdMax = getStandardMaxMark(coLabel);
            const maxMark = Math.max(stdMax, colMaxs[c] || 0);
            qConfig[key] = { maxMark, co: normalizedCo };
        }
    }
});

for (let r = 2; r < lastStudentRow; r++) {
    const row = json[r];
    if (!row || !Array.isArray(row)) continue;
    const regNo = row[1];
    const name = row[2];
    if (!regNo || !name) continue;

    const student = {
        slNo: students.length + 1,
        regNo: String(regNo).trim(),
        name: String(name).trim(),
        marks: {}
    };

    activeCols.forEach((c) => {
        const coLabel = coRow[c];
        if (coLabel) {
            const normalizedCo = coLabel.toString().toLowerCase().replace(/[^a-z0-9]/g, '');
            if (normalizedCo.startsWith('co')) {
                const utNum = Math.floor((c - 3) / 6) + 1;
                const key = `u${utNum}_${normalizedCo}`;
                const mark = row[c];
                if (mark !== undefined && mark !== null && mark !== "") {
                    const num = Number(mark);
                    if (!isNaN(num)) {
                        student.marks[key] = num;
                    }
                }
            }
        }
    });
    students.push(student);
}

console.log("Successfully parsed Final_assessment_template!");
console.log("Total students found:", students.length);
console.log("Question config:", qConfig);
console.log("First student's marks:", students[0].marks);
console.log("Active columns:", activeCols);
