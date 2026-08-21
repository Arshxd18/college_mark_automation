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

                const isUTStyle = json[0] && json[0].some((cell: any) => cell && cell.toString().includes("Unit Test"));
                
                // New Internal 1/2 template: has "QUESTION NUMBER" in row 0, "MAXIMUM MARK" and "COURSE OUTCOME" rows
                const hasQuestionNumberHeader = json[0] && json[0].some((cell: any) => cell && cell.toString().toUpperCase().includes("QUESTION NUMBER"));
                const hasMaxMarkRow = json.some((row: any[]) => row && row.some((c: any) => c && c.toString().toUpperCase().includes("MAXIMUM MARK")));
                const isNewInternalQStyle = hasQuestionNumberHeader && hasMaxMarkRow;

                // Old simple Internal style: had INTERNAL 1/2 header in row 0 with CO 1 in row 1
                const isOldInternalStyle = json[0] && json[0].some((cell: any) => cell && (cell.toString().includes("INTERNAL 1") || cell.toString().includes("INTERNAL 2"))) &&
                                           json[1] && json[1].some((cell: any) => cell && cell.toString().includes("CO 1"));

                if (isOldInternalStyle) {
                    result = parseNewInternal(json, testType);
                } else if (isUTStyle || testType === "Unit Test") {
                    result = parseUnitTest(json, testType);
                } else if (testType === "Assignment") {
                    result = parseAssignment(json, testType);
                } else if (testType === "Semester") {
                    result = parseSemester(json, testType);
                } else if (testType === "CO Average") {
                    result = parseCoAverage(json, testType);
                } else {
                    // For Internal 1 & 2 (new question-based format) or fallback
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

    // Row 0 has the UT headers (e.g. Unit Test 1, Unit Test 2, etc.)
    // Row 1 has the CO headers (CO 1, CO 2, CO 3, etc.)
    // Students start at Row 2 (index 2)
    const coRow = json[1] || [];

    // Helper to get fallback/standard max marks if the column has marks
    const getStandardMaxMark = (coLabel: string): number => {
        const co = coLabel.trim().toUpperCase().replace(/\s+/g, "");
        if (co === "CO1" || co === "CO2" || co === "CO5" || co === "CO6") return 20;
        if (co === "CO3") return 13;
        if (co === "CO4") return 14;
        return 20; // default fallback
    };

    // Columns 3 to 32 contain the 5 Unit Tests and their 6 CO columns
    // Check which columns actually have at least one numeric mark.
    const activeCols: number[] = [];
    const colMaxs: Record<number, number> = {};

    // Find where student rows actually end (they end when NAME is empty/null or not a string)
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

    // Configure active columns in qConfig
    activeCols.forEach((c) => {
        const coLabel = coRow[c];
        if (coLabel) {
            const normalizedCo = coLabel.toString().toLowerCase().replace(/[^a-z0-9]/g, '') as COLabel;
            if (normalizedCo.startsWith('co')) {
                // Columns 3-8: UT1, 9-14: UT2, 15-20: UT3, 21-26: UT4, 27-32: UT5
                const utNum = Math.floor((c - 3) / 6) + 1;
                const key = `u${utNum}_${normalizedCo}`;
                
                const stdMax = getStandardMaxMark(coLabel);
                const maxMark = Math.max(stdMax, colMaxs[c] || 0);

                qConfig[key] = {
                    maxMark: maxMark,
                    co: normalizedCo
                };
            }
        }
    });

    // Extract Students and Marks
    for (let r = 2; r < lastStudentRow; r++) {
        const row = json[r];
        if (!row || !Array.isArray(row)) continue;

        const regNo = row[1];
        const name = row[2];
        if (!regNo || !name) continue;

        const student: any = {
            slNo: students.length + 1,
            regNo: String(regNo).trim(),
            name: String(name).trim(),
            marks: {}
        };

        activeCols.forEach((c) => {
            const coLabel = coRow[c];
            if (coLabel) {
                const normalizedCo = coLabel.toString().toLowerCase().replace(/[^a-z0-9]/g, '') as COLabel;
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
    const qConfig: QuestionConfig = {};
    const students: any[] = [];

    // Find critical rows
    const headerRowIndex = json.findIndex(row => row && row.some(c => c && c.toString().toUpperCase().replace(/\s+/g, "").includes("REGNO")));
    const maxMarkRowIndex = json.findIndex(row => row && row.some(c => c && c.toString().toUpperCase().includes("MAXIMUM MARK")));
    
    if (headerRowIndex === -1 || maxMarkRowIndex === -1) {
        throw new Error("Could not find configuration rows in Internal template.");
    }

    const qNoRowIndex = headerRowIndex + 1;
    const subQRowIndex = headerRowIndex + 3;
    const coRowIndex = maxMarkRowIndex + 1;

    const maxMarksRow = json[maxMarkRowIndex] || [];
    const coRow = json[coRowIndex] || [];

    const activeCols: number[] = [];
    const questionIndices: { [key: string]: number } = {};

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
            let normalizedCo: COLabel = "co1";
            if (coVal) {
                const norm = coVal.toString().toLowerCase().replace(/[^a-z0-9]/g, '');
                if (norm.startsWith('co') && ["co1", "co2", "co3", "co4", "co5", "co6"].includes(norm)) {
                    normalizedCo = norm as COLabel;
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

        const student: any = {
            slNo: students.length + 1,
            regNo: String(regNo).trim(),
            name: String(name).trim(),
            marks: {}
        };

        activeCols.forEach((c) => {
            const val = row[c];
            if (val !== null && val !== undefined && val !== "") {
                const qId = Object.keys(questionIndices).find(k => questionIndices[k] === c);
                if (qId) {
                    student.marks[qId] = Number(val);
                }
            }
        });
        students.push(student);
    }

    return { academicYear: "2023-2024", testType, questionConfig: qConfig, students, headers: ["REG.NO", "NAME"] };
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

function parseNewInternal(json: any[][], testType: string): ParsedUploadData {
    const qConfig: QuestionConfig = {};
    const students: any[] = [];
    const coRow = json[1] || [];

    // Columns 3 to 8 contain CO1 to CO6
    const activeCols: number[] = [];
    const colMaxs: Record<number, number> = {};

    // Find where student rows end
    let lastStudentRow = 2;
    while (lastStudentRow < json.length) {
        const r = json[lastStudentRow];
        if (!r || !r[2] || r[2].toString().trim() === "") {
            break;
        }
        lastStudentRow++;
    }

    // Scan student rows to check which columns have values
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

    // If template is completely blank, assume all columns are active with default 100 max mark
    if (activeCols.length === 0) {
        for (let c = 3; c <= 8; c++) {
            activeCols.push(c);
            colMaxs[c] = 100;
        }
    }

    const prefix = testType.toLowerCase().replace(/\s+/g, "") === "internal1" ? "ia1" : "ia2";

    const getInternalMaxMark = (rawMax: number): number => {
        if (rawMax <= 20) return 20;
        if (rawMax <= 50) return 50;
        return 100;
    };

    activeCols.forEach((c) => {
        const coLabel = coRow[c];
        if (coLabel) {
            const normalizedCo = coLabel.toString().toLowerCase().replace(/[^a-z0-9]/g, '') as COLabel;
            if (normalizedCo.startsWith('co')) {
                const key = `${prefix}_${normalizedCo}`;
                const maxMark = getInternalMaxMark(colMaxs[c] || 100);

                qConfig[key] = {
                    maxMark: maxMark,
                    co: normalizedCo
                };
            }
        }
    });

    // Extract Students and Marks
    for (let r = 2; r < lastStudentRow; r++) {
        const row = json[r];
        if (!row || !Array.isArray(row)) continue;

        const regNo = row[1];
        const name = row[2];
        if (!regNo || !name) continue;

        const student: any = {
            slNo: students.length + 1,
            regNo: String(regNo).trim(),
            name: String(name).trim(),
            marks: {}
        };

        activeCols.forEach((c) => {
            const coLabel = coRow[c];
            if (coLabel) {
                const normalizedCo = coLabel.toString().toLowerCase().replace(/[^a-z0-9]/g, '') as COLabel;
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

    return { academicYear: "2023-2024", testType, questionConfig: qConfig, students, headers: ["REG.NO", "NAME"] };
}
