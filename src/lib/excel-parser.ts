import * as XLSX from 'xlsx';
import { COLabel, QuestionConfig } from '@/types';

export interface ParsedUploadData {
    academicYear: string;
    testType: string;
    questionConfig: QuestionConfig;
    students: any[];
    headers: string[];
    debug?: any[][];
}

export const parseExcelUpload = async (file: File, testType: string = "Internal 1"): Promise<ParsedUploadData> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

                let result: ParsedUploadData;

                // Auto-detect template types if the user forgot to select the correct one
                if (json[0] && json[0].includes("INTERNAL COs %")) {
                    testType = "CO Average";
                }

                if (testType === "Unit Test") {
                    result = parseUnitTest(json, testType);
                } else if (testType === "Assignment") {
                    result = parseAssignment(json, testType);
                } else if (testType === "Semester") {
                    result = parseSemester(json, testType);
                } else if (testType === "CO Average") {
                    result = parseCoAverage(json, testType);
                } else {
                    result = parseInternal(json, testType);
                }

                // Attach raw data for debugging
                result.debug = json.slice(0, 20);
                resolve(result);

            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsBinaryString(file);
    });
};

function parseUnitTest(json: any[][], testType: string): ParsedUploadData {
    const qConfig: QuestionConfig = {};
    const students: any[] = [];

    // Row 2 (index 1) cols 3 to 14 have COs
    // Row 4 (index 3) cols 27 to 38 have Max Marks
    const coRow = json[1] || [];
    const maxMarksRow = json[3] || [];

    // Config Extraction
    for (let c = 3; c <= 14; c++) {
        const coLabel = coRow[c];
        const maxMark = maxMarksRow[c + 24]; // offset by 24 columns in template

        if (coLabel && maxMark) {
            const normalizedCo = coLabel.toString().toLowerCase().replace(/[^a-z0-9]/g, '') as COLabel;
            if (normalizedCo.startsWith('co')) {
                qConfig[`u${c - 2}`] = {
                    maxMark: Number(maxMark),
                    co: normalizedCo
                };
            }
        }
    }

    // Students Extraction
    for (let i = 4; i < json.length; i++) {
        const row = json[i];
        if (!row || !Array.isArray(row) || !row[0]) continue;

        const regNo = row[1];
        const name = row[2];
        if (!regNo || !name) continue;

        const student: any = {
            slNo: students.length + 1,
            regNo: String(regNo),
            name: String(name),
            marks: {}
        };

        for (let c = 3; c <= 14; c++) {
            const mark = row[c];
            if (mark !== undefined && mark !== null && mark !== "") {
                student.marks[`u${c - 2}`] = Number(mark);
            }
        }
        students.push(student);
    }

    return { academicYear: "2023-2024", testType, questionConfig: qConfig, students, headers: ["REG.NO", "NAME"] };
}

function parseAssignment(json: any[][], testType: string): ParsedUploadData {
    const qConfig: QuestionConfig = {};
    const students: any[] = [];

    // Row 3 (index 2) cols 4 to 9 have Max Marks (10)
    // Row 4 (index 3) cols 4 to 9 have COs (CO1 to CO6)
    const maxMarksRow = json[2] || [];
    const coRow = json[3] || [];

    for (let c = 4; c <= 9; c++) {
        const coLabel = coRow[c];
        const maxMark = maxMarksRow[c];

        if (coLabel && maxMark) {
            const normalizedCo = coLabel.toString().toLowerCase().replace(/[^a-z0-9]/g, '') as COLabel;
            if (normalizedCo.startsWith('co')) {
                qConfig[`a${c - 3}`] = {
                    maxMark: Number(maxMark),
                    co: normalizedCo
                };
            }
        }
    }

    // Students Extraction starting row 5 (index 4)
    for (let i = 4; i < json.length; i++) {
        const row = json[i];
        if (!row || !Array.isArray(row) || !row[0]) continue;

        const regNo = row[1];
        const name = row[3];
        if (!regNo || !name) continue;

        const student: any = {
            slNo: students.length + 1,
            regNo: String(regNo),
            name: String(name),
            marks: {}
        };

        for (let c = 4; c <= 9; c++) {
            const mark = row[c];
            if (mark !== undefined && mark !== null && mark !== "") {
                student.marks[`a${c - 3}`] = Number(mark);
            }
        }
        students.push(student);
    }

    return { academicYear: "2023-2024", testType, questionConfig: qConfig, students, headers: ["REG.NO", "NAME"] };
}

function parseSemester(json: any[][], testType: string): ParsedUploadData {
    const qConfig: QuestionConfig = {};
    const students: any[] = [];

    // Semester template: Single 'TOTAL' column applies to all COs
    // We create 6 pseudo-questions so the attainment engine processes it perfectly.
    ["co1", "co2", "co3", "co4", "co5", "co6"].forEach((co) => {
        qConfig[`sem_${co}`] = { maxMark: 100, co: co as COLabel };
    });

    // Row 1 (index 0) has headers, look for "TOTAL"
    const headers = json[0] || [];
    // Data starts at row 3 (index 2) generally, but let's just scan

    const regNoIdx = headers.findIndex((h: any) => h && h.toString().toUpperCase().includes("REG"));
    const nameIdx = headers.findIndex((h: any) => h && h.toString().toUpperCase().includes("NAME"));
    const totalIdx = headers.findIndex((h: any) => h && h.toString().toUpperCase().includes("TOTAL"));

    if (totalIdx === -1) throw new Error("Could not find 'TOTAL' column in Semester template.");

    for (let i = 1; i < json.length; i++) {
        const row = json[i];
        if (!row || !Array.isArray(row) || row.length < 2) continue;

        const regNo = row[regNoIdx];
        const name = row[nameIdx];
        const totalMark = row[totalIdx];

        if (!regNo || !name) continue;

        const student: any = {
            slNo: students.length + 1,
            regNo: String(regNo),
            name: String(name),
            marks: {}
        };

        if (totalMark !== undefined && totalMark !== null && totalMark !== "") {
            ["co1", "co2", "co3", "co4", "co5", "co6"].forEach((co) => {
                student.marks[`sem_${co}`] = Number(totalMark);
            });
        }
        students.push(student);
    }

    return { academicYear: "2023-2024", testType, questionConfig: qConfig, students, headers: ["REG.NO", "NAME"] };
}

function parseInternal(json: any[][], testType: string): ParsedUploadData {
    let headerRowIndex = -1;
    let maxMarkRowIndex = -1;
    let coRowIndex = -1;
    let studentStartIndex = -1;

    for (let i = 0; i < json.length; i++) {
        const row = json[i];
        if (!row || !Array.isArray(row) || row.length === 0) continue;

        const rowStr = row.map(c => c ? c.toString().toUpperCase() : "").join(" ");

        if (rowStr.includes("REG") && (rowStr.includes("NAME") || rowStr.includes("STUDENT"))) {
            headerRowIndex = i;
        }

        if (rowStr.includes("MAXIMUM") || rowStr.includes("MAX MARK")) {
            maxMarkRowIndex = i;
        } else if (maxMarkRowIndex === -1 && i !== headerRowIndex) {
            const validCells = row.filter(c => c !== null && c !== undefined && c !== "").length;
            const numCount = row.filter(c => typeof c === 'number' || (typeof c === 'string' && !isNaN(Number(c)) && c.trim() !== "")).length;
            if (validCells > 5 && (numCount / validCells) > 0.8) {
                if (!row.some(c => typeof c === 'number' && c > 1000)) {
                    maxMarkRowIndex = i;
                }
            }
        }

        if (rowStr.includes("COURSE OUTCOME") || rowStr.includes("CO MAPPING")) {
            coRowIndex = i;
        } else if (coRowIndex === -1 && i !== headerRowIndex && i !== maxMarkRowIndex) {
            const coCount = row.filter(c => c && c.toString().toUpperCase().match(/CO\s*\d+/)).length;
            if (coCount > 3) {
                coRowIndex = i;
            }
        }
    }

    if (headerRowIndex === -1) throw new Error("Could not find Header row.");
    if (maxMarkRowIndex === -1 || coRowIndex === -1) throw new Error(`Could not identify configuration rows.`);

    const rawHeaders = json[headerRowIndex] || [];
    let subHeaders: any[] = [];
    if (maxMarkRowIndex > headerRowIndex + 1) {
        const potentialSub = json[maxMarkRowIndex - 1];
        if (potentialSub && Array.isArray(potentialSub)) {
            if (potentialSub.some(c => c && c.toString().match(/\d+[.\s]*[ab]/i))) subHeaders = potentialSub;
        }
    }

    const maxMarksRow = json[maxMarkRowIndex] || [];
    const coRow = json[coRowIndex] || [];

    const questionIndices: { [key: string]: number } = {};
    const qConfig: QuestionConfig = {};

    const colCount = Math.max(rawHeaders.length, subHeaders.length, maxMarksRow.length);

    for (let idx = 0; idx < colCount; idx++) {
        let qId = "";
        if (subHeaders[idx]) {
            const match = subHeaders[idx].toString().match(/(\d+)[.\s]*([ab])/i);
            if (match) qId = `q${match[1]}${match[2]}`.toLowerCase();
        }
        if (!qId && rawHeaders[idx]) {
            const match = rawHeaders[idx].toString().match(/Q[.\s]*N?o?[.\s]*(\d+)/i) || rawHeaders[idx].toString().match(/^Q\s*(\d+)$/i);
            if (match) qId = `q${match[1]}`.toLowerCase();
        }

        if (qId && !questionIndices[qId]) {
            questionIndices[qId] = idx;
            const max = maxMarksRow[idx];
            const co = coRow[idx];

            if (max && co) {
                const normalizedCo = co.toString().toLowerCase().replace(/[^a-z0-9]/g, '') as COLabel;
                if (normalizedCo.startsWith('co')) {
                    qConfig[qId] = { maxMark: Number(max), co: normalizedCo };
                }
            }
        }
    }

    const headers = rawHeaders.map(h => h ? h.toString().trim().toUpperCase() : "");
    const students = [];
    const startIndex = Math.max(headerRowIndex, maxMarkRowIndex, coRowIndex) + 1;

    for (let i = startIndex; i < json.length; i++) {
        const row = json[i];
        if (!row || !Array.isArray(row) || row.length < 2) continue;

        const regNoIdx = headers.findIndex(h => h && h.toUpperCase().includes("REG"));
        const nameIdx = headers.findIndex(h => h && h.toUpperCase().includes("NAME"));

        if (regNoIdx === -1 || nameIdx === -1) continue;

        const student: any = {
            slNo: students.length + 1,
            regNo: row[regNoIdx],
            name: row[nameIdx],
            marks: {}
        };

        Object.entries(questionIndices).forEach(([qId, idx]) => {
            const mark = row[idx];
            if (mark !== undefined && mark !== null && mark !== "") {
                student.marks[qId] = Number(mark);
            }
        });
        students.push(student);
    }

    return { academicYear: "2023-2024", testType, questionConfig: qConfig, students, headers };
}

function parseCoAverage(json: any[][], testType: string): ParsedUploadData {
    const qConfig: QuestionConfig = {};
    const students: any[] = [];

    // In coaverage_template, CO1 to CO6 map to columns 4 through 9 (indices 4 to 9).
    // The values there are ALREADY percentages (0-100).
    // We treat each as a question with max=100, so the engine computes `(val/100)*100 = val`.
    ["co1", "co2", "co3", "co4", "co5", "co6"].forEach((co, idx) => {
        qConfig[`coavg_${co}`] = { maxMark: 100, co: co as COLabel };
    });

    // Determine row where data starts. Row 0 has "S.NO", "REG.NO", "ROLL.NO", "NAME", "INTERNAL COs %"
    let headerRowIndex = 0;
    while (headerRowIndex < json.length && (!json[headerRowIndex] || !json[headerRowIndex][1] || typeof json[headerRowIndex][1] !== 'string' || !json[headerRowIndex][1].toUpperCase().includes('REG'))) {
        headerRowIndex++;
    }

    // Students start roughly from Row 6 (index 5) depending on header length, or after the header row.
    const startIndex = headerRowIndex !== json.length ? headerRowIndex + 1 : 1;

    for (let i = startIndex; i < json.length; i++) {
        const row = json[i];
        if (!row || !Array.isArray(row)) continue;

        // Skip summary rows at the bottom
        if (typeof row[0] === 'string' && (row[0].toLowerCase().includes('s.no') || row[0].toLowerCase().includes('attainment') || row[0].toLowerCase().includes('no of students'))) continue;
        if (typeof row[5] === 'string' && (row[5].toLowerCase().includes('attainment level') || row[5].toLowerCase().includes('no. of studetns'))) continue;

        const regNo = row[1];
        const name = row[3] || row[2]; // Sometimes name is in Col 3, sometimes Col 2 depending on if ROLL.NO exists

        // Need strings for regNo and name to consider it a valid student row
        if (!regNo || regNo === "" || typeof regNo === 'object') continue;

        const student: any = {
            slNo: students.length + 1,
            regNo: String(regNo),
            name: String(name || "Unknown"),
            marks: {}
        };

        // Columns 4 to 9 map to CO1 to CO6
        ["co1", "co2", "co3", "co4", "co5", "co6"].forEach((co, idx) => {
            const mark = row[4 + idx];
            if (mark !== undefined && mark !== null && mark !== "") {
                student.marks[`coavg_${co}`] = Number(mark);
            }
        });

        // Only add student if they have at least one CO calculated
        if (Object.keys(student.marks).length > 0) {
            students.push(student);
        }
    }

    return { academicYear: "2023-2024", testType, questionConfig: qConfig, students, headers: ["REG.NO", "NAME"] };
}
