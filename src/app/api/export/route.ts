import { NextResponse } from "next/server";
import { createAssessmentWorkbook } from "@/lib/excelReportGenerator";

export async function POST(request: Request) {
    try {
        const { students, examConfig, questionConfig } = await request.json();

        if (!students || !Array.isArray(students) || !questionConfig || !examConfig) {
            return NextResponse.json({ error: "Invalid data" }, { status: 400 });
        }

        const workbook = await createAssessmentWorkbook(students, examConfig, questionConfig);
        const buffer = await workbook.xlsx.writeBuffer();

        const academicYear = examConfig.academicYear || "AY";
        const subjectId = (examConfig.subjectId || "Assessment").replace(/[^a-zA-Z0-9_-]/g, "_");

        return new NextResponse(Buffer.from(buffer), {
            status: 200,
            headers: {
                "Content-Disposition": `attachment; filename="CO_Report_${subjectId}_${academicYear}.xlsx"`,
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            },
        });

    } catch (error) {
        console.error("Export error:", error);
        return NextResponse.json({ error: "Failed to generate Excel" }, { status: 500 });
    }
}

