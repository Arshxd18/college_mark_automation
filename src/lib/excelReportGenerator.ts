import ExcelJS from "exceljs";
import { Student, ExamConfig, QuestionConfig, COLabel, AssessmentDoc } from "@/types";
import { calculateCOAttainment, getPartWiseTotals, calculateCOMaxMarks, sortQuestionKeys } from "@/lib/calculations";
import { computeAssessmentCO } from "@/lib/attainmentEngine";

const CO_KEYS: COLabel[] = ["co1", "co2", "co3", "co4", "co5", "co6"];

const COLORS = {
    primaryHeader: "FF1E3A8A",      // Dark Indigo/Blue
    subHeader: "FF3B82F6",          // Royal Blue
    accentHeader: "FF4F46E5",       // Indigo Accent
    sectionTitle: "FFEDE9FE",       // Soft Purple Tint
    targetRow: "FFEEF2FF",          // Soft Indigo Tint
    partRow: "FFF8FAFC",            // Slate Light
    borderLight: "FFE2E8F0",        // Gray-200
    borderDark: "FF94A3B8",         // Gray-400
    textMain: "FF1E293B",           // Slate-800
    textMuted: "FF64748B",          // Slate-500
    successBg: "FFDCFCE7",          // Green-100
    successText: "FF166534",        // Green-800
    warningBg: "FFFEF3C7",          // Yellow-100
    warningText: "FF92400E",        // Yellow-800
    dangerBg: "FFFFE4E6",           // Rose-100
    dangerText: "FF9F1239",         // Rose-800
    naBg: "FFF1F5F9",               // Gray-100
    naText: "FF94A3B8",             // Gray-400
};

// Helper: Thin border setup
const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: "thin", color: { argb: COLORS.borderLight } },
    left: { style: "thin", color: { argb: COLORS.borderLight } },
    bottom: { style: "thin", color: { argb: COLORS.borderLight } },
    right: { style: "thin", color: { argb: COLORS.borderLight } },
};

const headerBorder: Partial<ExcelJS.Borders> = {
    top: { style: "thin", color: { argb: COLORS.borderDark } },
    left: { style: "thin", color: { argb: COLORS.borderDark } },
    bottom: { style: "medium", color: { argb: COLORS.borderDark } },
    right: { style: "thin", color: { argb: COLORS.borderDark } },
};

export async function createAssessmentWorkbook(
    students: Student[],
    examConfig: ExamConfig,
    questionConfig: QuestionConfig
): Promise<ExcelJS.Workbook> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "CO Automation System";
    workbook.created = new Date();

    const {
        academicYear = "2025-2026",
        batchYear = "2023-2027",
        subjectId = "—",
        testType = "Internal 1",
        section = "A",
        facultyName = "—"
    } = examConfig;

    // ─────────────────────────────────────────────────────────────
    // SHEET 1: CO Analysis & Attainment Report
    // ─────────────────────────────────────────────────────────────
    const sheet = workbook.addWorksheet("CO Attainment & Marks", {
        views: [{ showGridLines: true }],
        pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1 }
    });

    // Setup Columns
    sheet.columns = [
        { key: "col1", width: 6 },   // S.No
        { key: "col2", width: 16 },  // Reg No
        { key: "col3", width: 14 },  // Roll No
        { key: "col4", width: 28 },  // Student Name
        { key: "col5", width: 12 },  // Total Marks
        { key: "co1_raw", width: 10 },
        { key: "co2_raw", width: 10 },
        { key: "co3_raw", width: 10 },
        { key: "co4_raw", width: 10 },
        { key: "co5_raw", width: 10 },
        { key: "co6_raw", width: 10 },
        { key: "co1_pct", width: 12 },
        { key: "co2_pct", width: 12 },
        { key: "co3_pct", width: 12 },
        { key: "co4_pct", width: 12 },
        { key: "co5_pct", width: 12 },
        { key: "co6_pct", width: 12 },
        { key: "avg_pct", width: 12 },
    ];

    // Title Banner
    const titleRow = sheet.addRow(["COURSE OUTCOME (CO) ATTAINMENT & STUDENT MARK SHEET"]);
    sheet.mergeCells("A1:R1");
    titleRow.font = { name: "Calibri", size: 15, bold: true, color: { argb: "FFFFFFFF" } };
    titleRow.alignment = { vertical: "middle", horizontal: "center" };
    titleRow.height = 34;
    titleRow.getCell(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: COLORS.primaryHeader }
    };

    // Subtitle Banner
    const subTitleRow = sheet.addRow([`${testType.toUpperCase()} ASSESSMENT REPORT • ACADEMIC YEAR: ${academicYear}`]);
    sheet.mergeCells("A2:R2");
    subTitleRow.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
    subTitleRow.alignment = { vertical: "middle", horizontal: "center" };
    subTitleRow.height = 22;
    subTitleRow.getCell(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: COLORS.subHeader }
    };

    sheet.addRow([]); // Blank line 3

    // Metadata Grid (Rows 4 - 6)
    const metaBlock = [
        ["Subject Code / ID:", subjectId, "", "Batch Year:", batchYear, "", "Section:", section || "All"],
        ["Assessment Type:", testType, "", "Faculty In-Charge:", facultyName || "—", "", "Total Students:", students.length],
        ["Report Generated:", new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }), "", "Status:", "Computed & Verified", "", "", ""]
    ];

    metaBlock.forEach((meta) => {
        const row = sheet.addRow(meta);
        row.height = 20;
        row.font = { name: "Calibri", size: 10 };
        [1, 4, 7].forEach((colIdx) => {
            const labelCell = row.getCell(colIdx);
            labelCell.font = { name: "Calibri", size: 10, bold: true, color: { argb: COLORS.textMain } };
            labelCell.alignment = { vertical: "middle", horizontal: "left" };
        });
        [2, 5, 8].forEach((colIdx) => {
            const valCell = row.getCell(colIdx);
            valCell.font = { name: "Calibri", size: 10, color: { argb: COLORS.textMain } };
            valCell.alignment = { vertical: "middle", horizontal: "left" };
        });
    });

    sheet.addRow([]); // Blank line 7

    // Section 1: Question Paper CO Distribution Header
    const qSecRow = sheet.addRow(["QUESTION PAPER CO ALLOCATION & MAXIMUM MARKS"]);
    sheet.mergeCells(`A${qSecRow.number}:R${qSecRow.number}`);
    qSecRow.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FF1E293B" } };
    qSecRow.height = 24;
    qSecRow.alignment = { vertical: "middle", horizontal: "left" };
    qSecRow.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.sectionTitle } };

    // Part-wise Totals
    const partTotals = getPartWiseTotals(questionConfig);
    const coMax = { co1: 0, co2: 0, co3: 0, co4: 0, co5: 0, co6: 0 };
    const hasChoicePairs = Object.keys(questionConfig).some(k => /^q\d+[ab]$/i.test(k));
    const isUT = testType === "Unit Test" || Object.keys(questionConfig).some(k => k.startsWith('u'));

    if (isUT && students.length > 0) {
        const totals = { co1: 0, co2: 0, co3: 0, co4: 0, co5: 0, co6: 0 };
        students.forEach((s: Student) => {
            const studentMax = calculateCOMaxMarks(questionConfig, s.marks);
            CO_KEYS.forEach(co => { totals[co] += studentMax[co]; });
        });
        CO_KEYS.forEach(co => {
            coMax[co] = parseFloat((totals[co] / students.length).toFixed(2));
        });
    } else {
        Object.entries(questionConfig).forEach(([_, conf]) => {
            if (conf.co && coMax[conf.co] !== undefined) {
                coMax[conf.co] += conf.maxMark;
            }
        });
    }

    // Question allocation table headers
    const qHeaderRow = sheet.addRow([
        "Details", "", "", "", "TOTAL",
        "CO1", "CO2", "CO3", "CO4", "CO5", "CO6",
        "CO1 %", "CO2 %", "CO3 %", "CO4 %", "CO5 %", "CO6 %", "AVG %"
    ]);
    sheet.mergeCells(`A${qHeaderRow.number}:D${qHeaderRow.number}`);
    qHeaderRow.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    qHeaderRow.alignment = { vertical: "middle", horizontal: "center" };
    qHeaderRow.height = 22;
    qHeaderRow.eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.accentHeader } };
        cell.border = headerBorder;
    });

    const addAllocationRow = (label: string, data: Record<string, number | string>, isMaxRow = false) => {
        const row = sheet.addRow([
            label, "", "", "",
            isMaxRow ? (hasChoicePairs ? 100 : Object.values(coMax).reduce((a, b) => a + b, 0)) : "",
            ...CO_KEYS.map(co => (data[co] !== undefined && data[co] !== 0 ? data[co] : "-")),
            ...Array(7).fill(isMaxRow ? "(Target)" : "")
        ]);
        sheet.mergeCells(`A${row.number}:D${row.number}`);
        row.height = 20;
        row.font = { name: "Calibri", size: 10, bold: isMaxRow };
        row.alignment = { vertical: "middle", horizontal: "center" };
        row.getCell(1).alignment = { vertical: "middle", horizontal: "left" };

        const bg = isMaxRow ? COLORS.targetRow : COLORS.partRow;
        row.eachCell({ includeEmpty: true }, (cell) => {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
            cell.border = thinBorder;
        });

        if (isMaxRow) {
            row.getCell(1).font = { name: "Calibri", size: 10, bold: true, color: { argb: "FF312E81" } };
        }
    };

    addAllocationRow("PART-A CO totals", partTotals.partA);
    addAllocationRow("PART-B (a) CO totals", partTotals.partB_a);
    addAllocationRow("PART-B (b) CO totals", partTotals.partB_b);
    addAllocationRow("TOTAL CO Maximum", coMax, true);

    sheet.addRow([]); // Blank spacer

    // Section 2: Student Marks and CO Attainment Table
    const marksSecRow = sheet.addRow(["INDIVIDUAL STUDENT MARKS & COURSE OUTCOME PERCENTAGES"]);
    sheet.mergeCells(`A${marksSecRow.number}:R${marksSecRow.number}`);
    marksSecRow.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FF1E293B" } };
    marksSecRow.height = 24;
    marksSecRow.alignment = { vertical: "middle", horizontal: "left" };
    marksSecRow.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.sectionTitle } };

    // Student Header Table
    const studentHeader = sheet.addRow([
        "S.No", "Reg. Number", "Roll No", "Student Name", "Total",
        "CO1 (Raw)", "CO2 (Raw)", "CO3 (Raw)", "CO4 (Raw)", "CO5 (Raw)", "CO6 (Raw)",
        "CO1 %", "CO2 %", "CO3 %", "CO4 %", "CO5 %", "CO6 %", "Student Avg %"
    ]);
    studentHeader.height = 24;
    studentHeader.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    studentHeader.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    studentHeader.eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.primaryHeader } };
        cell.border = headerBorder;
    });

    // Populate Student Rows
    students.forEach((s, idx) => {
        const res = calculateCOAttainment(s.marks, questionConfig);

        // Calculate student average percentage across attended COs
        const validPcts = CO_KEYS.map(co => res.percentage[co]).filter(p => p > 0);
        const avgPct = validPcts.length > 0
            ? parseFloat((validPcts.reduce((a, b) => a + b, 0) / validPcts.length).toFixed(1))
            : 0;

        const row = sheet.addRow([
            idx + 1,
            s.regNo || "—",
            s.rollNo || "—",
            s.name || "—",
            res.total,
            ...CO_KEYS.map(co => res[co] !== undefined && res[co] !== null ? res[co] : "-"),
            ...CO_KEYS.map(co => res.percentage[co] > 0 ? Number(res.percentage[co].toFixed(1)) : 0),
            avgPct > 0 ? avgPct : "-"
        ]);
        row.height = 19;
        row.font = { name: "Calibri", size: 9.5 };

        // Alignments
        row.getCell(1).alignment = { vertical: "middle", horizontal: "center" };
        row.getCell(2).alignment = { vertical: "middle", horizontal: "center" };
        row.getCell(3).alignment = { vertical: "middle", horizontal: "center" };
        row.getCell(4).alignment = { vertical: "middle", horizontal: "left" };
        row.getCell(5).alignment = { vertical: "middle", horizontal: "center" };

        // Raw Marks & Percentages
        for (let col = 6; col <= 18; col++) {
            row.getCell(col).alignment = { vertical: "middle", horizontal: "center" };
        }

        // Percentage Cells Coloring (cols 12 to 17)
        CO_KEYS.forEach((co, cIdx) => {
            const pCell = row.getCell(12 + cIdx);
            const pct = res.percentage[co];
            if (pct >= 60) {
                pCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.successBg } };
                pCell.font = { name: "Calibri", size: 9.5, bold: true, color: { argb: COLORS.successText } };
            } else if (pct >= 40) {
                pCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.warningBg } };
                pCell.font = { name: "Calibri", size: 9.5, bold: true, color: { argb: COLORS.warningText } };
            } else if (pct > 0) {
                pCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.dangerBg } };
                pCell.font = { name: "Calibri", size: 9.5, bold: true, color: { argb: COLORS.dangerText } };
            } else {
                pCell.value = "-";
                pCell.font = { name: "Calibri", size: 9.5, color: { argb: COLORS.naText } };
            }
        });

        row.eachCell({ includeEmpty: true }, (cell) => {
            cell.border = thinBorder;
        });
    });

    sheet.addRow([]); // Blank line

    // Section 3: Attainment Summary (L0 - L3 Calculation)
    const computed = computeAssessmentCO(students, questionConfig, testType);
    const summarySecRow = sheet.addRow(["COURSE OUTCOME (CO) ATTAINMENT SUMMARY & LEVELS"]);
    sheet.mergeCells(`A${summarySecRow.number}:R${summarySecRow.number}`);
    summarySecRow.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FF1E293B" } };
    summarySecRow.height = 24;
    summarySecRow.alignment = { vertical: "middle", horizontal: "left" };
    summarySecRow.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.sectionTitle } };

    const sumHeader = sheet.addRow([
        "Attainment Metrics", "", "", "", "Description",
        "CO1", "CO2", "CO3", "CO4", "CO5", "CO6",
        "", "", "", "", "", "", ""
    ]);
    sheet.mergeCells(`A${sumHeader.number}:D${sumHeader.number}`);
    sheet.mergeCells(`L${sumHeader.number}:R${sumHeader.number}`);
    sumHeader.height = 22;
    sumHeader.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    sumHeader.alignment = { vertical: "middle", horizontal: "center" };
    sumHeader.eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.accentHeader } };
        cell.border = headerBorder;
    });

    const addSummaryMetric = (label: string, desc: string, getValue: (co: COLabel) => any, highlight = false) => {
        const row = sheet.addRow([
            label, "", "", "", desc,
            ...CO_KEYS.map(co => getValue(co)),
            "", "", "", "", "", "", ""
        ]);
        sheet.mergeCells(`A${row.number}:D${row.number}`);
        sheet.mergeCells(`L${row.number}:R${row.number}`);
        row.height = 20;
        row.font = { name: "Calibri", size: 10, bold: highlight };
        row.alignment = { vertical: "middle", horizontal: "center" };
        row.getCell(1).alignment = { vertical: "middle", horizontal: "left" };
        row.getCell(5).alignment = { vertical: "middle", horizontal: "left" };

        row.eachCell({ includeEmpty: true }, (cell) => {
            cell.border = thinBorder;
            if (highlight) {
                cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.targetRow } };
            }
        });

        if (highlight) {
            row.getCell(1).font = { name: "Calibri", size: 10, bold: true, color: { argb: "FF312E81" } };
            CO_KEYS.forEach((co, idx) => {
                const cell = row.getCell(6 + idx);
                const val = String(cell.value);
                if (val.includes("L3")) {
                    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.successBg } };
                    cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: COLORS.successText } };
                } else if (val.includes("L2")) {
                    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.warningBg } };
                    cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: COLORS.warningText } };
                } else if (val.includes("L1") || val.includes("L0")) {
                    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.dangerBg } };
                    cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: COLORS.dangerText } };
                }
            });
        }
    };

    addSummaryMetric("Students Attended", "Number of students who attempted questions for this CO", (co) => {
        const st = computed.attainment[co];
        return st && st.attended !== undefined ? st.attended : "-";
    });

    addSummaryMetric("Students Scoring ≥ 60%", "Count of students achieving threshold of 60% mark", (co) => {
        const st = computed.attainment[co];
        return st && st.scoring60 !== undefined ? st.scoring60 : "-";
    });

    addSummaryMetric("Percentage Scoring ≥ 60%", "% of attended students scoring ≥ 60% in this CO", (co) => {
        const st = computed.attainment[co];
        return st && st.pct !== null && st.pct !== undefined ? `${st.pct.toFixed(1)}%` : "N/A";
    });

    addSummaryMetric("Final Attainment Level", "Target Rubric Level (L0, L1, L2, L3)", (co) => {
        const st = computed.attainment[co];
        if (!st || st.level === null || st.level === undefined || st.level === "N/A") return "N/A";
        return `L${st.level}`;
    }, true);

    sheet.addRow([]); // Blank spacer

    // Attainment Rubric Reference Notes
    const rubricNote = sheet.addRow([
        "Attainment Rubrics:  • Level 3 (High): ≥ 70% students score ≥ 60%   • Level 2 (Medium): 60% – 69% students score ≥ 60%   • Level 1 (Low): 50% – 59% students score ≥ 60%   • Level 0: < 50% students"
    ]);
    sheet.mergeCells(`A${rubricNote.number}:R${rubricNote.number}`);
    rubricNote.font = { name: "Calibri", size: 9, italic: true, color: { argb: COLORS.textMuted } };
    rubricNote.alignment = { vertical: "middle", horizontal: "center" };

    // ─────────────────────────────────────────────────────────────
    // SHEET 2: Question Paper Blueprint
    // ─────────────────────────────────────────────────────────────
    const bpSheet = workbook.addWorksheet("Question Blueprint", {
        views: [{ showGridLines: true }]
    });

    bpSheet.columns = [
        { header: "Question No", key: "qNo", width: 16 },
        { header: "Mapped Course Outcome (CO)", key: "co", width: 30 },
        { header: "Maximum Marks", key: "maxMark", width: 16 },
        { header: "Section / Part", key: "part", width: 20 },
    ];

    bpSheet.getRow(1).height = 26;
    bpSheet.getRow(1).eachCell((cell) => {
        cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.primaryHeader } };
        cell.alignment = { vertical: "middle", horizontal: "center" };
        cell.border = headerBorder;
    });

    const sortedQKeys = sortQuestionKeys(Object.keys(questionConfig));
    sortedQKeys.forEach((qKey) => {
        const conf = questionConfig[qKey];
        if (!conf) return;
        const qUpper = qKey.toUpperCase();
        let part = "PART A";
        if (qUpper.includes("A") || qUpper.includes("B") || parseInt(qUpper.replace("Q", "")) > 10) {
            part = qUpper.endsWith("A") ? "PART B (Option A)" : qUpper.endsWith("B") ? "PART B (Option B)" : "PART B";
        }
        const row = bpSheet.addRow({
            qNo: qUpper,
            co: conf.co ? conf.co.toUpperCase() : "UNMAPPED",
            maxMark: conf.maxMark,
            part: part
        });
        row.height = 20;
        row.font = { name: "Calibri", size: 10 };
        row.alignment = { vertical: "middle", horizontal: "center" };
        row.eachCell({ includeEmpty: true }, (cell) => {
            cell.border = thinBorder;
        });
    });

    return workbook;
}

/**
 * Generates an aggregated Excel report for all assessments filtered in the Admin dashboard.
 */
export async function createAdminSummaryWorkbook(
    assessments: AssessmentDoc[],
    filters: {
        academicYear?: string;
        batchYear?: string;
        subjectId?: string;
        section?: string;
        facultyName?: string;
    }
): Promise<ExcelJS.Workbook> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "CO Automation System (Admin)";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet("Admin Attainment Summary", {
        views: [{ showGridLines: true }],
        pageSetup: { orientation: "landscape" }
    });

    sheet.columns = [
        { header: "S.No", key: "sno", width: 6 },
        { header: "Batch Year", key: "batch", width: 14 },
        { header: "Academic Year", key: "ay", width: 14 },
        { header: "Subject ID", key: "subject", width: 14 },
        { header: "Section", key: "section", width: 10 },
        { header: "Assessment Type", key: "testType", width: 16 },
        { header: "Faculty Name", key: "faculty", width: 24 },
        { header: "Students", key: "students", width: 10 },
        { header: "CO1 Level", key: "co1", width: 12 },
        { header: "CO2 Level", key: "co2", width: 12 },
        { header: "CO3 Level", key: "co3", width: 12 },
        { header: "CO4 Level", key: "co4", width: 12 },
        { header: "CO5 Level", key: "co5", width: 12 },
        { header: "CO6 Level", key: "co6", width: 12 },
        { header: "Date Saved", key: "savedAt", width: 16 },
    ];

    // Banner
    sheet.insertRow(1, ["DEPARTMENT COURSE OUTCOME (CO) ATTAINMENT SUMMARY REPORT"]);
    sheet.mergeCells("A1:O1");
    const banner = sheet.getRow(1);
    banner.height = 32;
    banner.font = { name: "Calibri", size: 14, bold: true, color: { argb: "FFFFFFFF" } };
    banner.alignment = { vertical: "middle", horizontal: "center" };
    banner.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.primaryHeader } };

    // Sub Banner with applied filters
    const filterDesc = [
        filters.academicYear ? `Academic Year: ${filters.academicYear}` : null,
        filters.batchYear ? `Batch: ${filters.batchYear}` : null,
        filters.subjectId ? `Subject: ${filters.subjectId}` : null,
        filters.section ? `Section: ${filters.section}` : null,
        filters.facultyName ? `Faculty: ${filters.facultyName}` : null,
    ].filter(Boolean).join("  |  ") || "All Filtered Records";

    sheet.insertRow(2, [`FILTERS: ${filterDesc} • TOTAL RECORDS: ${assessments.length}`]);
    sheet.mergeCells("A2:O2");
    const subBanner = sheet.getRow(2);
    subBanner.height = 22;
    subBanner.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    subBanner.alignment = { vertical: "middle", horizontal: "center" };
    subBanner.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.subHeader } };

    sheet.insertRow(3, []); // Blank spacer

    // Header styling
    const headerRow = sheet.getRow(4);
    headerRow.height = 24;
    headerRow.eachCell((cell) => {
        cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.accentHeader } };
        cell.alignment = { vertical: "middle", horizontal: "center" };
        cell.border = headerBorder;
    });

    // Populate data
    assessments.forEach((d, idx) => {
        const getLevelStr = (co: COLabel) => {
            const st = d.computed?.attainment?.[co];
            if (!st || st.level === null || st.level === undefined || st.level === "N/A") return "N/A";
            return `L${st.level} (${st.pct?.toFixed(0)}%)`;
        };

        const row = sheet.addRow([
            idx + 1,
            d.batchYear || "—",
            d.examConfig?.academicYear || "—",
            d.subjectId || "—",
            d.examConfig?.section || "—",
            d.testType || "—",
            d.examConfig?.facultyName || "—",
            d.students?.length ?? 0,
            getLevelStr("co1"),
            getLevelStr("co2"),
            getLevelStr("co3"),
            getLevelStr("co4"),
            getLevelStr("co5"),
            getLevelStr("co6"),
            d.savedAt ? new Date(d.savedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"
        ]);

        row.height = 20;
        row.font = { name: "Calibri", size: 9.5 };
        row.alignment = { vertical: "middle", horizontal: "center" };
        row.getCell(7).alignment = { vertical: "middle", horizontal: "left" }; // Faculty name left align

        // Color badge cells
        CO_KEYS.forEach((co, cIdx) => {
            const cell = row.getCell(9 + cIdx);
            const val = String(cell.value);
            if (val.startsWith("L3")) {
                cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.successBg } };
                cell.font = { name: "Calibri", size: 9.5, bold: true, color: { argb: COLORS.successText } };
            } else if (val.startsWith("L2")) {
                cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.warningBg } };
                cell.font = { name: "Calibri", size: 9.5, bold: true, color: { argb: COLORS.warningText } };
            } else if (val.startsWith("L1") || val.startsWith("L0")) {
                cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.dangerBg } };
                cell.font = { name: "Calibri", size: 9.5, bold: true, color: { argb: COLORS.dangerText } };
            }
        });

        row.eachCell({ includeEmpty: true }, (cell) => {
            cell.border = thinBorder;
        });
    });

    return workbook;
}

/**
 * Browser-side download trigger for an assessment report
 */
export async function downloadAssessmentReport(
    students: Student[],
    examConfig: ExamConfig,
    questionConfig: QuestionConfig
) {
    const workbook = await createAssessmentWorkbook(students, examConfig, questionConfig);
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const sanitizedSubject = (examConfig.subjectId || "Assessment").replace(/[^a-zA-Z0-9_-]/g, "_");
    const sanitizedTest = (examConfig.testType || "Test").replace(/[^a-zA-Z0-9_-]/g, "_");
    const sanitizedSec = examConfig.section ? `_Sec${examConfig.section}` : "";
    a.download = `CO_Report_${sanitizedSubject}_${sanitizedTest}${sanitizedSec}_${examConfig.academicYear || "AY"}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

/**
 * Browser-side download trigger for admin batch summary report
 */
export async function downloadAdminSummaryReport(
    assessments: AssessmentDoc[],
    filters: {
        academicYear?: string;
        batchYear?: string;
        subjectId?: string;
        section?: string;
        facultyName?: string;
    }
) {
    const workbook = await createAdminSummaryWorkbook(assessments, filters);
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    a.download = `Admin_CO_Summary_Report_${filters.batchYear || "All"}_${dateStr}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}
