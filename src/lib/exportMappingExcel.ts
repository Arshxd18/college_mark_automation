import ExcelJS from "exceljs";
import { MappingCell, COLabel, PIEntry, POAttainmentRow } from "@/types";

const CO_KEYS: COLabel[] = ["co1", "co2", "co3", "co4", "co5", "co6"];

export async function exportMappingToExcel(
    matrix: Record<COLabel, Record<string, MappingCell>>,
    piList: PIEntry[],
    poAttainment: POAttainmentRow[],
    batchYear: string,
    subjectId: string,
    pisByPO: Record<number, PIEntry[]>
) {
    const workbook = new ExcelJS.Workbook();
    
    // ── Sheet 1: Final Mapping Matrix ────────────
    const mappingSheet = workbook.addWorksheet("CO-PI Matrix");
    
    mappingSheet.columns = [
        { header: "PO", key: "po", width: 10 },
        { header: "PI ID", key: "piId", width: 12 },
        { header: "Descriptor", key: "descriptor", width: 60 },
        { header: "CO1", key: "co1", width: 8 },
        { header: "CO2", key: "co2", width: 8 },
        { header: "CO3", key: "co3", width: 8 },
        { header: "CO4", key: "co4", width: 8 },
        { header: "CO5", key: "co5", width: 8 },
        { header: "CO6", key: "co6", width: 8 },
    ];

    // Style headers
    mappingSheet.getRow(1).eachCell(cell => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F46E5" } };
        cell.alignment = { vertical: "middle", horizontal: "center" };
        cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
    });

    const poNumbers = Object.keys(pisByPO).map(Number).sort((a, b) => a - b);
    
    for (const po of poNumbers) {
        const pis = pisByPO[po] ?? [];
        pis.forEach(pi => {
            const row = mappingSheet.addRow({
                po: `PO${po}`,
                piId: pi.id,
                descriptor: pi.descriptor,
                co1: matrix.co1?.[pi.id]?.value ?? "-",
                co2: matrix.co2?.[pi.id]?.value ?? "-",
                co3: matrix.co3?.[pi.id]?.value ?? "-",
                co4: matrix.co4?.[pi.id]?.value ?? "-",
                co5: matrix.co5?.[pi.id]?.value ?? "-",
                co6: matrix.co6?.[pi.id]?.value ?? "-",
            });
            row.eachCell({ includeEmpty: false }, cell => {
                const colNum = Number(cell.col);
                cell.alignment = { vertical: "middle", horizontal: colNum >= 4 ? "center" : "left", wrapText: colNum === 3 };
                cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
            });
        });

        // PO Average Row
        const avgRow = mappingSheet.addRow({
            descriptor: `PO${po} Average`
        });
        
        CO_KEYS.forEach((co, idx) => {
            let sum = 0, count = 0;
            pis.forEach(pi => {
                const val = matrix[co]?.[pi.id]?.value;
                if (val !== null && val !== undefined) {
                    sum += val;
                    count++;
                }
            });
            const avg = count > 0 ? parseFloat((sum / count).toFixed(2)) : "-";
            avgRow.getCell(idx + 4).value = avg;
        });

        avgRow.eachCell(cell => {
            cell.font = { bold: true };
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F4F6" } };
            cell.alignment = { horizontal: "center" };
            cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
        });
        
        mappingSheet.mergeCells(avgRow.number, 1, avgRow.number, 3);
        avgRow.getCell(1).alignment = { horizontal: "right", vertical: "middle" };
    }

    // Legend
    mappingSheet.addRow([]); // empty row
    const legend1 = mappingSheet.addRow(["Legend:"]);
    const legend2 = mappingSheet.addRow(["3", "Strongly Mapped"]);
    const legend3 = mappingSheet.addRow(["2", "Moderately Mapped"]);
    const legend4 = mappingSheet.addRow(["1", "Slightly Mapped"]);
    const legend5 = mappingSheet.addRow(["-", "Not Mapped"]);

    [legend1, legend2, legend3, legend4, legend5].forEach(r => {
        r.getCell(1).font = { bold: true };
    });

    // ── Sheet 2: PO Attainment Summary ──────────────
    const attSheet = workbook.addWorksheet("PO Summary");
    
    // Header Row
    const headerRow = attSheet.addRow(poAttainment.map(r => Number(r.poId) > 12 ? `PSO${Number(r.poId) - 12}` : `PO${r.poId}`));
    headerRow.eachCell(cell => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F46E5" } };
        cell.alignment = { horizontal: "center" };
        cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
    });

    // Value Row
    const valueRow = attSheet.addRow(poAttainment.map(r => r.level !== null ? r.level : "-"));
    valueRow.eachCell(cell => {
        cell.alignment = { horizontal: "center" };
        cell.font = { bold: true };
        cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
    });

    // Download Phase
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `CO-PI-Mapping-${batchYear}-${subjectId}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}
