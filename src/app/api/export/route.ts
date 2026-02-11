import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { Student } from "@/types";
import { calculateCOAttainment, getPartWiseTotals, calculateCOMaxMarks } from "@/lib/calculations";
import { COResult } from "@/types";

export async function POST(request: Request) {
    try {
        const { students, examConfig, questionConfig } = await request.json();

        if (!students || !Array.isArray(students) || !questionConfig || !examConfig) {
            return NextResponse.json({ error: "Invalid data" }, { status: 400 });
        }

        const { academicYear, testType, subjectName, subjectCode } = examConfig;

        const wb = XLSX.utils.book_new();

        // --- Sheet 1: CO Analysis & Summary ---
        const summaryData: any[][] = [];

        // Header Info
        summaryData.push(["Academic Year:", academicYear]);
        summaryData.push(["Assessment:", testType]);
        if (subjectName) summaryData.push(["Subject:", subjectName]);
        if (subjectCode) summaryData.push(["Code:", subjectCode]);
        summaryData.push([]); // spacer

        // Table Header
        const coLabels = ["co1", "co2", "co3", "co4", "co5", "co6"] as const;
        const headerRow1 = ["Details", "TOTAL", ...coLabels.map(s => s.toUpperCase()), ...coLabels.map(s => `${s.toUpperCase()} %`), "AVG %"];
        summaryData.push(headerRow1);

        // Part-wise Totals
        const partTotals = getPartWiseTotals(questionConfig);
        const addPartRow = (label: string, data: any) => {
            const row = [label, "", ...coLabels.map(co => data[co] || "-"), ...Array(7).fill("")];
            summaryData.push(row);
        };

        addPartRow("PART-A CO totals", partTotals.partA);
        addPartRow("PART-B (a) CO totals", partTotals.partB_a);
        addPartRow("PART-B (b) CO totals", partTotals.partB_b);

        // Total CO Maximum
        const coMax = calculateCOMaxMarks(questionConfig);
        const totalMaxRow = [
            "TOTAL CO Maximum",
            Object.values(coMax).reduce((a: number, b: number) => a + b, 0),
            ...coLabels.map(co => coMax[co]),
            ...Array(7).fill("")
        ];
        summaryData.push(totalMaxRow);
        summaryData.push([]); // spacer

        // Student Rows
        students.forEach((s: Student, idx: number) => {
            const res = calculateCOAttainment(s.marks, questionConfig);
            const row = [
                `${idx + 1}. ${s.regNo} - ${s.name}`,
                res.total,
                ...coLabels.map(co => res[co] || "-"),
                ...coLabels.map(co => {
                    const pct = res.percentage[co];
                    return pct > 0 ? `${pct}%` : "-";
                }),
                " "
            ];
            summaryData.push(row);
        });

        const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);

        // Styling/Widths (Basic)
        wsSummary['!cols'] = [{ wch: 40 }, { wch: 10 }, ...Array(13).fill({ wch: 8 })];

        XLSX.utils.book_append_sheet(wb, wsSummary, "CO Analysis");

        // Generate Buffer
        const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

        // Return response
        return new NextResponse(buf, {
            status: 200,
            headers: {
                "Content-Disposition": `attachment; filename="CO_Analysis_${academicYear}.xlsx"`,
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            },
        });

    } catch (error) {
        console.error("Export error:", error);
        return NextResponse.json({ error: "Failed to generate Excel" }, { status: 500 });
    }
}
