import { NextResponse } from "next/server";
import ExcelJS from "exceljs";

export async function POST(request: Request) {
    try {
        const { filename, data, results, coMaxMarks } = await request.json();

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet("CO Analysis Report");

        // --- Styles ---
        const headerFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E7FF' } }; // Indigo 50
        const borderStyle: Partial<ExcelJS.Borders> = {
            top: { style: 'thin', color: { argb: 'FFCBD5E0' } },
            left: { style: 'thin', color: { argb: 'FFCBD5E0' } },
            bottom: { style: 'thin', color: { argb: 'FFCBD5E0' } },
            right: { style: 'thin', color: { argb: 'FFCBD5E0' } }
        };
        const fontBold = { bold: true, name: 'Arial', size: 10 };

        // --- Headers ---
        sheet.columns = [
            { header: 'Sl No', key: 'slNo', width: 6 },
            { header: 'Reg No', key: 'regNo', width: 15 },
            { header: 'Student Name', key: 'name', width: 25 },
            { header: 'TOTAL', key: 'total', width: 10 },
            { header: 'CO1 %', key: 'co1', width: 10 },
            { header: 'CO2 %', key: 'co2', width: 10 },
            { header: 'CO3 %', key: 'co3', width: 10 },
            { header: 'CO4 %', key: 'co4', width: 10 },
            { header: 'CO5 %', key: 'co5', width: 10 },
            { header: 'CO6 %', key: 'co6', width: 10 },
        ];

        // Styled Header Row
        const headerRow = sheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FF4338CA' }, size: 11 };
        headerRow.fill = headerFill;
        headerRow.commit();

        // --- CO Max Row ---
        const maxRow = sheet.addRow({
            slNo: '', regNo: '', name: 'CO MAXIMUM',
            total: Object.values(coMaxMarks).reduce((a: any, b: any) => a + b, 0),
            co1: coMaxMarks.co1,
            co2: coMaxMarks.co2,
            co3: coMaxMarks.co3,
            co4: coMaxMarks.co4,
            co5: coMaxMarks.co5,
            co6: coMaxMarks.co6
        });
        maxRow.font = { bold: true };
        maxRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF9C4' } }; // Yellow 50
        maxRow.commit();


        // --- Student Data ---
        results.forEach((s: any) => {
            const row = sheet.addRow({
                slNo: s.slNo,
                regNo: s.regNo,
                name: s.name,
                total: s.result.total,
                co1: s.result.percentage.co1,
                co2: s.result.percentage.co2,
                co3: s.result.percentage.co3,
                co4: s.result.percentage.co4,
                co5: s.result.percentage.co5,
                co6: s.result.percentage.co6,
            });

            // Highlights for CO Percentages
            ['co1', 'co2', 'co3', 'co4', 'co5', 'co6'].forEach((key, idx) => {
                // Columns 5 to 10 (1-indexed based on my columns def approx)
                const cell = row.getCell(idx + 5);
                const val = cell.value as number;

                if (val > 0) {
                    if (val >= 60) {
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } }; // Green 100
                    } else if (val >= 40) {
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF9C3' } }; // Yellow 100
                    } else {
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } }; // Red 100
                    }
                    cell.value = `${val}%`;
                } else {
                    cell.value = '-';
                    cell.font = { color: { argb: 'FF9CA3AF' } }; // Gray text
                }
            });

            row.commit();
        });

        // Generate Buffer
        const buffer = await workbook.xlsx.writeBuffer();

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                "Content-Disposition": `attachment; filename="Analyzed_Report.xlsx"`,
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            },
        });

    } catch (error) {
        console.error("Export error:", error);
        return NextResponse.json({ error: "Failed to generate Excel" }, { status: 500 });
    }
}
