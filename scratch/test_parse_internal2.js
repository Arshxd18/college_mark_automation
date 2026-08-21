const xlsx = require('xlsx');
const path = require('path');

const filePath = path.join("/Users/mohamedarshad/Desktop/CO's", 'Internal2_assesment.xlsx');
const wb = xlsx.readFile(filePath);
const sheetName = wb.SheetNames[0];
const sheet = wb.Sheets[sheetName];
const json = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: null });

// Let's implement the same parser function as above
function testParser(json) {
    const qConfig = {};
    const students = [];

    // Find critical rows
    const headerRowIndex = json.findIndex(row => row && row.some(c => c && c.toString().toUpperCase().replace(/\s+/g, "").includes("REGNO")));
    const maxMarkRowIndex = json.findIndex(row => row && row.some(c => c && c.toString().toUpperCase().includes("MAXIMUM MARK")));
    
    if (headerRowIndex === -1 || maxMarkRowIndex === -1) {
        throw new Error("Could not find configuration rows.");
    }

    const qNoRowIndex = headerRowIndex + 1;
    const subQRowIndex = headerRowIndex + 3;
    const coRowIndex = maxMarkRowIndex + 1;

    const maxMarksRow = json[maxMarkRowIndex] || [];
    const coRow = json[coRowIndex] || [];

    const activeCols = [];
    const questionIndices = {};

    for (let c = 4; c < maxMarksRow.length; c++) {
        let qId = "";
        const subVal = json[subQRowIndex]?.[c];
        if (subVal) {
            const match = subVal.toString().match(/(\d+)[.\s]*([ab])/i);
            if (match) qId = `q${match[1]}${match[2]}`.toLowerCase();
        }
        if (!qId) {
            const qNoVal = json[qNoRowIndex]?.[c];
            if (qNoVal) {
                const match = qNoVal.toString().match(/Q[.\s]*N?o?[.\s]*(\d+)/i) || qNoVal.toString().match(/^Q\s*(\d+)$/i);
                if (match) qId = `q${match[1]}`.toLowerCase();
            }
        }

        if (qId && maxMarksRow[c] !== null && maxMarksRow[c] !== undefined) {
            activeCols.push(c);
            questionIndices[qId] = c;

            const coVal = coRow[c];
            let normalizedCo = "co1";
            if (coVal) {
                const norm = coVal.toString().toLowerCase().replace(/[^a-z0-9]/g, '');
                if (norm.startsWith('co')) {
                    normalizedCo = norm;
                }
            }
            qConfig[qId] = {
                maxMark: Number(maxMarksRow[c]),
                co: normalizedCo
            };
        }
    }

    const studentStartIndex = maxMarkRowIndex + 4;
    for (let r = studentStartIndex; r < json.length; r++) {
        const row = json[r];
        if (!row || !Array.isArray(row)) continue;

        const regNo = row[1];
        const name = row[3];
        if (!regNo || regNo.toString().toUpperCase().includes("REG") || !name || name.toString().toUpperCase().includes("NAME")) continue;

        const student = {
            slNo: students.length + 1,
            regNo: String(regNo).trim(),
            name: String(name).trim(),
            marks: {}
        };

        activeCols.forEach((c) => {
            const val = row[c];
            if (val !== null && val !== undefined && val !== "") {
                // Find qId for this column
                const qId = Object.keys(questionIndices).find(k => questionIndices[k] === c);
                if (qId) {
                    student.marks[qId] = Number(val);
                }
            }
        });
        students.push(student);
    }

    return { qConfig, students };
}

const result = testParser(json);
console.log("Successfully parsed Internal 2!");
console.log("Questions parsed count:", Object.keys(result.qConfig).length);
console.log("Questions Config:", result.qConfig);
console.log("Students count:", result.students.length);
console.log("First student's marks:", result.students[0]);
