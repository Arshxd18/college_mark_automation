const xlsx = require('xlsx');
const path = require('path');

const filePath = path.join("/Users/mohamedarshad/Desktop/CO's", 'Internal1_template.xlsx');
const wb = xlsx.readFile(filePath);
const sheetName = wb.SheetNames[0];
const sheet = wb.Sheets[sheetName];
const json = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: null });

// Let's add some mock students and marks since it is a blank template
json[2] = [1, "2025PECAI101", "AAISHA M", 15, 18, null, null, null, null];
json[3] = [2, "2025PECAI102", "AARTHI S", 14, 17, null, null, null, null];

const coRow = json[1] || [];
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

for (let c = 3; c <= 8; c++) {
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

if (activeCols.length === 0) {
    for (let c = 3; c <= 8; c++) {
        activeCols.push(c);
        colMaxs[c] = 100;
    }
}

const qConfig = {};
const students = [];
const prefix = "ia1";

const getInternalMaxMark = (rawMax) => {
    if (rawMax <= 20) return 20;
    if (rawMax <= 50) return 50;
    return 100;
};

activeCols.forEach((c) => {
    const coLabel = coRow[c];
    if (coLabel) {
        const normalizedCo = coLabel.toString().toLowerCase().replace(/[^a-z0-9]/g, '');
        if (normalizedCo.startsWith('co')) {
            const key = `${prefix}_${normalizedCo}`;
            const maxMark = getInternalMaxMark(colMaxs[c] || 100);
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
                const key = `${prefix}_${normalizedCo}`;
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

console.log("Successfully parsed Internal1_template!");
console.log("Total students found:", students.length);
console.log("Question config:", qConfig);
console.log("First student's marks:", students[0].marks);
console.log("Active columns:", activeCols);

