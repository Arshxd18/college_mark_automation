import ExcelJS from "exceljs";
import { COLabel, POAttainmentRow, PIMappingSelection } from "@/types";
import { DEFAULT_PO_DEFINITIONS, PODefinition } from "./poData";
import { DEFAULT_PI_LIST, ExtendedPIEntry, getPIsByPO } from "./piData";

const CO_KEYS: COLabel[] = ["co1", "co2", "co3", "co4", "co5", "co6"];
const CO_DISPLAY_LABELS = ["C304.1", "C304.2", "C304.3", "C304.4", "C304.5", "C304.6"];

const COLORS = {
    deptHeader: "FFFFFFFF",
    attrHeaderBg: "FFD9EAD3",      // Light Sage Green
    attrHeaderText: "FF1E293B",
    poHeaderBg: "FFD9D2E9",        // Light Lilac Purple
    poHeaderText: "FF1E293B",
    coHeaderBg: "FFFCE5CD",        // Light Peach
    avgRowBg: "FFF4CCCC",          // Soft Pink / Rose
    border: "FF94A3B8",
    lightBorder: "FFE2E8F0",
    piHeaderBg: "FF312E81",        // Dark Indigo
    piSectionBg: "FFEEF2FF",
    yesCellBg: "FFDCFCE7",
    yesCellText: "FF166534"
};

const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: "thin", color: { argb: "FF000000" } },
    left: { style: "thin", color: { argb: "FF000000" } },
    bottom: { style: "thin", color: { argb: "FF000000" } },
    right: { style: "thin", color: { argb: "FF000000" } },
};

export async function exportMappingToExcel(
    poAttainment: POAttainmentRow[],
    piSelections: PIMappingSelection,
    batchYear: string,
    subjectId: string,
    subjectName: string = "KNOWLEDGE ENGINEERING AND INTELLIGENCE SYSTEM",
    department: string = "DEPARTMENT OF ARTIFICIAL INTELLIGENCE AND DATA SCIENCE",
    poDefs: PODefinition[] = DEFAULT_PO_DEFINITIONS,
    piList: ExtendedPIEntry[] = DEFAULT_PI_LIST
) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "CO Automation System";
    workbook.created = new Date();

    // ─────────────────────────────────────────────────────────────
    // SHEET 1: Course Outcome (The Output Articulation Matrix)
    // ─────────────────────────────────────────────────────────────
    const matrixSheet = workbook.addWorksheet("Course Outcome", {
        views: [{ showGridLines: true }],
    });

    const totalCols = poDefs.length + 1; // 1 for CO's + PO columns

    // Row 1: Department Title
    const r1 = matrixSheet.addRow([department]);
    matrixSheet.mergeCells(1, 1, 1, totalCols);
    r1.font = { name: "Calibri", size: 13, bold: true };
    r1.alignment = { vertical: "middle", horizontal: "center" };
    r1.height = 24;

    // Row 2: Subject ID & Name
    const r2 = matrixSheet.addRow([subjectId, "", subjectName]);
    matrixSheet.mergeCells(2, 1, 2, 2);
    matrixSheet.mergeCells(2, 3, 2, totalCols);
    r2.font = { name: "Calibri", size: 11, bold: true };
    r2.alignment = { vertical: "middle", horizontal: "center" };
    r2.height = 22;

    // Row 3: COURSE OUTCOMES
    const r3 = matrixSheet.addRow(["COURSE OUTCOMES"]);
    matrixSheet.mergeCells(3, 1, 3, totalCols);
    r3.font = { name: "Calibri", size: 12, bold: true };
    r3.alignment = { vertical: "middle", horizontal: "center" };
    r3.height = 22;

    // Row 4: Subtitle
    const r4 = matrixSheet.addRow(["Mapping Course Outcomes to Program Outcomes"]);
    matrixSheet.mergeCells(4, 1, 4, totalCols);
    r4.font = { name: "Calibri", size: 11, bold: true, italic: true };
    r4.alignment = { vertical: "middle", horizontal: "center" };
    r4.height = 20;

    // Row 5: Attributes Header
    const attrRow = matrixSheet.addRow([
        "Attributes",
        ...poDefs.map(p => p.attribute)
    ]);
    attrRow.font = { name: "Calibri", size: 10, bold: true };
    attrRow.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    attrRow.height = 32;
    attrRow.eachCell(cell => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.attrHeaderBg } };
        cell.border = thinBorder;
    });

    // Row 6: PO Codes Header (P1..P11, PSO1..PSO3)
    const poCodeRow = matrixSheet.addRow([
        "CO's",
        ...poDefs.map(p => p.shortCode)
    ]);
    poCodeRow.font = { name: "Calibri", size: 10, bold: true };
    poCodeRow.alignment = { vertical: "middle", horizontal: "center" };
    poCodeRow.height = 22;
    poCodeRow.eachCell(cell => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.poHeaderBg } };
        cell.border = thinBorder;
    });

    // Rows 7-12: CO Rows (C304.1 to C304.6)
    CO_KEYS.forEach((co, idx) => {
        const coLabel = CO_DISPLAY_LABELS[idx] || `CO${idx + 1}`;
        const rowValues = [
            coLabel,
            ...poDefs.map(poDef => {
                const poRow = poAttainment.find(r => r.poId === String(poDef.id));
                const level = poRow?.levels?.[co];
                return level !== null && level !== undefined ? level : "_";
            })
        ];

        const row = matrixSheet.addRow(rowValues);
        row.font = { name: "Calibri", size: 10, bold: true };
        row.alignment = { vertical: "middle", horizontal: "center" };
        row.height = 20;

        row.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.coHeaderBg } };
        row.eachCell({ includeEmpty: true }, cell => {
            cell.border = thinBorder;
        });
    });

    // Row 13: CO's AVG
    const avgRowValues = [
        "CO's AVG",
        ...poDefs.map(poDef => {
            const poRow = poAttainment.find(r => r.poId === String(poDef.id));
            return poRow?.level !== null && poRow?.level !== undefined ? poRow.level : "_";
        })
    ];
    const avgRow = matrixSheet.addRow(avgRowValues);
    avgRow.font = { name: "Calibri", size: 10, bold: true };
    avgRow.alignment = { vertical: "middle", horizontal: "center" };
    avgRow.height = 22;
    avgRow.eachCell({ includeEmpty: true }, cell => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.avgRowBg } };
        cell.border = thinBorder;
    });

    matrixSheet.addRow([]); // Blank spacer

    // Legend Table
    const legRow1 = matrixSheet.addRow(["", "", "", "LOW", "MED", "HIGH", "NO"]);
    const legRow2 = matrixSheet.addRow(["MAPPING CORRELATION", "", "", "1", "2", "3", "_"]);
    matrixSheet.mergeCells(legRow2.number, 1, legRow2.number, 3);
    [legRow1, legRow2].forEach(r => {
        r.font = { name: "Calibri", size: 9.5, bold: true };
        r.alignment = { vertical: "middle", horizontal: "center" };
        r.height = 18;
        for (let col = 4; col <= 7; col++) {
            const cell = r.getCell(col);
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0E68C" } };
            cell.border = thinBorder;
        }
    });

    // Column Widths
    matrixSheet.getColumn(1).width = 14;
    for (let c = 2; c <= totalCols; c++) {
        matrixSheet.getColumn(c).width = 11;
    }

    // ─────────────────────────────────────────────────────────────
    // SHEET 2: COPO with PI (Detailed Performance Indicators Checklist)
    // ─────────────────────────────────────────────────────────────
    const piSheet = workbook.addWorksheet("COPO with PI", {
        views: [{ showGridLines: true }]
    });

    piSheet.columns = [
        { header: "", key: "space", width: 4 },
        { header: "POs", key: "poTitle", width: 32 },
        { header: "Competency", key: "comp", width: 35 },
        { header: "Performance Indicator", key: "pi", width: 55 },
        { header: "CO1", key: "co1", width: 8 },
        { header: "CO2", key: "co2", width: 8 },
        { header: "CO3", key: "co3", width: 8 },
        { header: "CO4", key: "co4", width: 8 },
        { header: "CO5", key: "co5", width: 8 },
        { header: "CO6", key: "co6", width: 8 },
    ];

    // Header banner
    const piH1 = piSheet.addRow(["", "", subjectId, subjectName]);
    piSheet.mergeCells(piH1.number, 4, piH1.number, 10);
    piH1.font = { name: "Calibri", size: 11, bold: true };
    piH1.height = 22;

    const piH2 = piSheet.addRow(["", "POs", "Competency", "Performance Indicator", "CO1", "CO2", "CO3", "CO4", "CO5", "CO6"]);
    piH2.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    piH2.alignment = { vertical: "middle", horizontal: "center" };
    piH2.height = 24;
    piH2.eachCell({ includeEmpty: false }, (cell, colIdx) => {
        if (colIdx > 1) {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.piHeaderBg } };
            cell.border = thinBorder;
        }
    });

    const pisByPO = getPIsByPO(piList);

    poDefs.forEach(poDef => {
        const pis = pisByPO[poDef.id] || [];
        if (pis.length === 0) return;

        pis.forEach((pi, idx) => {
            const piRow = piSheet.addRow([
                "",
                idx === 0 ? `${poDef.code}  ${poDef.title}` : "",
                pi.competency || "",
                `${pi.id} ${pi.descriptor}`,
                piSelections.co1?.[pi.id] ? "Yes" : "",
                piSelections.co2?.[pi.id] ? "Yes" : "",
                piSelections.co3?.[pi.id] ? "Yes" : "",
                piSelections.co4?.[pi.id] ? "Yes" : "",
                piSelections.co5?.[pi.id] ? "Yes" : "",
                piSelections.co6?.[pi.id] ? "Yes" : "",
            ]);

            piRow.font = { name: "Calibri", size: 9.5 };
            piRow.height = 22;
            piRow.getCell(2).alignment = { vertical: "top", horizontal: "left", wrapText: true };
            piRow.getCell(3).alignment = { vertical: "top", horizontal: "left", wrapText: true };
            piRow.getCell(4).alignment = { vertical: "top", horizontal: "left", wrapText: true };

            for (let c = 5; c <= 10; c++) {
                const cell = piRow.getCell(c);
                cell.alignment = { vertical: "middle", horizontal: "center" };
                if (cell.value === "Yes") {
                    cell.font = { bold: true, color: { argb: COLORS.yesCellText } };
                    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.yesCellBg } };
                }
            }

            piRow.eachCell({ includeEmpty: false }, (cell, cIdx) => {
                if (cIdx > 1) cell.border = thinBorder;
            });
        });

        // Count row
        const attRow = poAttainment.find(r => r.poId === String(poDef.id));
        const countRow = piSheet.addRow([
            "", "", pis.length, "counting the Number of PI attained",
            attRow?.counts?.co1 ?? 0,
            attRow?.counts?.co2 ?? 0,
            attRow?.counts?.co3 ?? 0,
            attRow?.counts?.co4 ?? 0,
            attRow?.counts?.co5 ?? 0,
            attRow?.counts?.co6 ?? 0,
        ]);
        countRow.font = { name: "Calibri", size: 9.5, bold: true };
        countRow.height = 20;
        countRow.eachCell({ includeEmpty: false }, (cell, cIdx) => {
            if (cIdx > 1) {
                cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F4F6" } };
                cell.border = thinBorder;
                cell.alignment = { vertical: "middle", horizontal: "center" };
            }
        });

        // % row
        const pctRow = piSheet.addRow([
            "", "", "", "% of PI attained",
            attRow?.percentages?.co1 ? `${attRow.percentages.co1}%` : "0%",
            attRow?.percentages?.co2 ? `${attRow.percentages.co2}%` : "0%",
            attRow?.percentages?.co3 ? `${attRow.percentages.co3}%` : "0%",
            attRow?.percentages?.co4 ? `${attRow.percentages.co4}%` : "0%",
            attRow?.percentages?.co5 ? `${attRow.percentages.co5}%` : "0%",
            attRow?.percentages?.co6 ? `${attRow.percentages.co6}%` : "0%",
        ]);
        pctRow.font = { name: "Calibri", size: 9.5, bold: true };
        pctRow.height = 20;
        pctRow.eachCell({ includeEmpty: false }, (cell, cIdx) => {
            if (cIdx > 1) {
                cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F4F6" } };
                cell.border = thinBorder;
                cell.alignment = { vertical: "middle", horizontal: "center" };
            }
        });

        // Level Row
        const levelRow = piSheet.addRow([
            "", "Level 1: % of PI <= 59%  Level 2: 60 <= % <= 70  Level 3: % >= 71", "", "Level",
            attRow?.levels?.co1 !== null && attRow?.levels?.co1 !== undefined ? attRow.levels.co1 : "_",
            attRow?.levels?.co2 !== null && attRow?.levels?.co2 !== undefined ? attRow.levels.co2 : "_",
            attRow?.levels?.co3 !== null && attRow?.levels?.co3 !== undefined ? attRow.levels.co3 : "_",
            attRow?.levels?.co4 !== null && attRow?.levels?.co4 !== undefined ? attRow.levels.co4 : "_",
            attRow?.levels?.co5 !== null && attRow?.levels?.co5 !== undefined ? attRow.levels.co5 : "_",
            attRow?.levels?.co6 !== null && attRow?.levels?.co6 !== undefined ? attRow.levels.co6 : "_",
        ]);
        levelRow.font = { name: "Calibri", size: 10, bold: true };
        levelRow.height = 22;
        levelRow.eachCell({ includeEmpty: false }, (cell, cIdx) => {
            if (cIdx > 1) {
                cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.attrHeaderBg } };
                cell.border = thinBorder;
                cell.alignment = { vertical: "middle", horizontal: "center" };
            }
        });
    });

    // Trigger Download in browser
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `COPO_Articulation_Matrix_${batchYear}_${subjectId}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}
