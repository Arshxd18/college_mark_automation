import * as XLSX from 'xlsx';
import { COLabel, QuestionConfig } from '@/types';

export interface ParsedUploadData {
    academicYear: string;
    testType: string;
    questionConfig: QuestionConfig;
    students: any[];
    headers: string[];
    debug?: any[][]; // Raw rows for troubleshooting
}

export const parseExcelUpload = async (file: File): Promise<ParsedUploadData> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

                let headerRowIndex = -1;
                let maxMarkRowIndex = -1;
                let coRowIndex = -1;
                let studentStartIndex = -1;

                // --- Heuristic Detection ---
                // We assign a "score" to each row to identify what it likely contains.

                for (let i = 0; i < json.length; i++) {
                    const row = json[i];
                    if (!row || !Array.isArray(row) || row.length === 0) continue;

                    const rowStr = row.map(c => c ? c.toString().toUpperCase() : "").join(" ");

                    // 1. Header Row: Look for "REG" and "NAME"
                    if (rowStr.includes("REG") && (rowStr.includes("NAME") || rowStr.includes("STUDENT"))) {
                        headerRowIndex = i;
                    }

                    // 2. Max Marks Row: Look for "MAX" keyword OR high density of numbers
                    // If label exists, use it.
                    if (rowStr.includes("MAXIMUM") || rowStr.includes("MAX MARK")) {
                        maxMarkRowIndex = i;
                    } else if (maxMarkRowIndex === -1 && i !== headerRowIndex) {
                        // Check density: count numbers in the row
                        const numCount = row.filter(c => typeof c === 'number' || (typeof c === 'string' && !isNaN(Number(c)) && c.trim() !== "")).length;
                        const validCells = row.filter(c => c !== null && c !== undefined && c !== "").length;

                        // If > 50% of valid cells are numbers, and we have enough of them (e.g. at least 5)
                        // And it's not the student data (which also has numbers, but usually starts later)
                        // We'll rely on relative position later (usually config comes before data), 
                        // but for now, let's store candidates if needed. 
                        // Simpler approach: explicit check for small integers typical of max marks
                        if (validCells > 5 && (numCount / validCells) > 0.8) {
                            // Likely max marks row. Verify it's not student data (student data usually has a large reg no)
                            // Max marks are usually small (< 100). Reg nos are large.
                            const hasLargeNum = row.some(c => typeof c === 'number' && c > 1000);
                            if (!hasLargeNum) {
                                maxMarkRowIndex = i;
                            }
                        }
                    }

                    // 3. CO Row: Look for "CO" patterns
                    if (rowStr.includes("COURSE OUTCOME") || rowStr.includes("CO MAPPING")) {
                        coRowIndex = i;
                    } else if (coRowIndex === -1 && i !== headerRowIndex && i !== maxMarkRowIndex) {
                        const coCount = row.filter(c => c && c.toString().toUpperCase().match(/CO\s*\d+/)).length;
                        if (coCount > 3) {
                            coRowIndex = i;
                        }
                    }
                }

                // Fallback: If we found headers but missing others, assume standard relative positions if amenable
                // (e.g. Max Marks usually below Header, CO below Max Marks)
                // But relying on scores above is safer for now.

                if (headerRowIndex === -1) {
                    reject(new Error("Could not find Header row (must contain 'Reg No' and 'Name')."));
                    return;
                }

                if (maxMarkRowIndex === -1 || coRowIndex === -1) {
                    reject(new Error(`Could not identify configuration rows. Found: Header@${headerRowIndex}, MaxMarks@${maxMarkRowIndex}, CO@${coRowIndex}. Ensure rows contain "Max" or "CO" values.`));
                    return;
                }

                const rawHeaders = json[headerRowIndex] || [];
                // Check if there's a sub-header row (e.g. Row 2 with "11.a", "11.b")
                // Usually between Header and MaxMarks
                let subHeaders: any[] = [];
                if (maxMarkRowIndex > headerRowIndex + 1) {
                    // Try the row immediately before max marks, or implicitly distinct
                    // For parsed sample, subheader is at Row 2, Header at Row 0. MaxMarks at Row 3.
                    // We can try to assume the row just above MaxMarks might be subheaders if it contains "a" or "b"
                    const potentialSub = json[maxMarkRowIndex - 1];
                    if (potentialSub && Array.isArray(potentialSub)) {
                        const hasSubParts = potentialSub.some(c => c && c.toString().match(/\d+[.\s]*[ab]/i));
                        if (hasSubParts) subHeaders = potentialSub;
                    }
                }

                const maxMarksRow = json[maxMarkRowIndex] || [];
                const coRow = json[coRowIndex] || [];

                // identifying Question Columns
                const questionIndices: { [key: string]: number } = {};
                const qConfig: QuestionConfig = {};

                // Iterate through the LONGEST of header or subheader
                const colCount = Math.max(rawHeaders.length, subHeaders.length, maxMarksRow.length);

                for (let idx = 0; idx < colCount; idx++) {
                    let qId = "";

                    // Strategy 1: Subheader (e.g. "11.a")
                    if (subHeaders[idx]) {
                        const val = subHeaders[idx].toString();
                        const match = val.match(/(\d+)[.\s]*([ab])/i);
                        if (match) {
                            qId = `q${match[1]}${match[2]}`.toLowerCase();
                        }
                    }

                    // Strategy 2: Header (e.g. "Q. No. 1")
                    if (!qId && rawHeaders[idx]) {
                        const val = rawHeaders[idx].toString();
                        // Match "Q. No. 1", "Q1", "Q 1"
                        const match = val.match(/Q[.\s]*N?o?[.\s]*(\d+)/i) || val.match(/^Q\s*(\d+)$/i);
                        if (match) {
                            qId = `q${match[1]}`.toLowerCase();
                        }
                    }

                    if (qId && !questionIndices[qId]) {
                        questionIndices[qId] = idx;

                        const max = maxMarksRow[idx];
                        const co = coRow[idx];

                        if (max && co) {
                            // Normalize CO
                            const normalizedCo = co.toString().toLowerCase().replace(/[^a-z0-9]/g, '') as COLabel;
                            // Ensure it's a valid CO
                            if (normalizedCo.startsWith('co')) {
                                qConfig[qId] = {
                                    maxMark: Number(max),
                                    co: normalizedCo
                                }
                            }
                        }
                    }
                }

                // Define headers for student extraction usage later
                const headers = rawHeaders.map(h => h ? h.toString().trim().toUpperCase() : "");

                // Students
                const students = [];
                // Fallback: if studentStartIndex wasn't correctly identified by loop, start after the last config row
                const startIndex = studentStartIndex !== -1 ? studentStartIndex : Math.max(headerRowIndex, maxMarkRowIndex, coRowIndex) + 1;

                for (let i = startIndex; i < json.length; i++) {
                    const row = json[i];
                    if (!row || !Array.isArray(row) || row.length < 2) continue; // skip empty rows

                    // Basic extraction based on headers, assuming standard names
                    // Finding RegNo and Name index
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

                // Return raw data for debugging if parsing fails to find objects
                const debugData = json.slice(0, 20);

                resolve({
                    academicYear: "2023-2024",
                    testType: "Internal 1",
                    questionConfig: qConfig,
                    students,
                    headers,
                    debug: debugData
                });

            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsBinaryString(file);
    });
};
