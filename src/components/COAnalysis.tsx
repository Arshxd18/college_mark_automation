"use client";

import React, { useMemo } from "react";
import { Student, QuestionConfig, TestType } from "@/types";
import { calculateCOAttainment, getPartWiseTotals, calculateCOMaxMarks } from "@/lib/calculations";
import { computeAssessmentCO } from "@/lib/attainmentEngine";
import { cn } from "@/lib/utils";

interface COAnalysisProps {
    students: Student[];
    questionConfig: QuestionConfig;
    testType?: TestType;
}

// Weight multipliers for display — these match the contribution each test type has to Internal Attainment
const WEIGHT_BY_TYPE: Record<string, number> = {
    "CO Average": 0.25,
    "Unit Test": 0.15,
    "Internal 1": 1,
    "Internal 2": 1,
    "Semester": 0.60,
};

export default function COAnalysis({ students, questionConfig, testType = "Internal 1" }: COAnalysisProps) {

    const weight = WEIGHT_BY_TYPE[testType] ?? 1;
    const isWeighted = weight !== 1;

    const partWiseTotals = useMemo(() => getPartWiseTotals(questionConfig), [questionConfig]);

    const coMaxMarks = useMemo(() => {
        const staticMaxMarks = { co1: 0, co2: 0, co3: 0, co4: 0, co5: 0, co6: 0 };
        Object.entries(questionConfig).forEach(([qId, conf]) => {
            if (qId.endsWith('b')) return;
            staticMaxMarks[conf.co] += conf.maxMark;
        });
        return staticMaxMarks;
    }, [questionConfig]);

    const studentResults = useMemo(() => {
        return students.map(student => ({
            ...student,
            results: calculateCOAttainment(student.marks, questionConfig)
        }));
    }, [students, questionConfig]);

    const { attainment } = useMemo(() => {
        return computeAssessmentCO(students, questionConfig, testType);
    }, [students, questionConfig, testType]);

    const CO_LABELS = ["co1", "co2", "co3", "co4", "co5", "co6"] as const;

    // Weighted label for column header
    const pctLabel = isWeighted
        ? `CO % (×${Math.round(weight * 100)}%)`
        : "CO %";

    const totalMax = Object.values(coMaxMarks).reduce((a, b) => a + b, 0);
    const weightedTotalMax = parseFloat((totalMax * weight).toFixed(2));

    return (
        <div className="space-y-6">
            {isWeighted && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 text-sm text-indigo-800 flex items-center gap-2">
                    <span className="font-bold">ℹ️ Weighted View:</span>
                    <span>
                        Percentages are scaled by the <strong>{testType}</strong> contribution weight
                        &nbsp;({Math.round(weight * 100)}%). Formula: <code className="bg-white px-1 rounded">(CO% × {weight})</code>
                    </span>
                </div>
            )}
            <div className="glass-panel overflow-hidden border border-white/40 shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse whitespace-nowrap">
                        <thead className="bg-indigo-50/50 text-indigo-900 font-semibold backdrop-blur-md">
                            <tr>
                                <th rowSpan={2} className="p-4 border-b-2 border-r border-indigo-100 sticky left-0 z-20 bg-white/80 backdrop-blur-md">Details</th>
                                <th colSpan={7} className="p-2 border-b border-r border-indigo-100 text-center bg-indigo-100/30">Details of Marks Allocated for COs</th>
                                <th colSpan={7} className="p-2 border-b border-indigo-100 text-center bg-indigo-100/30">{pctLabel}</th>
                            </tr>
                            <tr>
                                {/* Marks Values */}
                                <th className="p-3 border-b border-r border-indigo-100 text-center text-xs font-bold">TOTAL</th>
                                {CO_LABELS.map(co => (
                                    <th key={co} className="p-3 border-b border-r border-indigo-100 text-center uppercase text-xs font-bold">{co}</th>
                                ))}

                                {/* Percentages */}
                                {CO_LABELS.map(co => (
                                    <th key={`pct-${co}`} className="p-3 border-b border-r border-indigo-100 text-center uppercase text-xs font-bold">{co} %</th>
                                ))}
                                <th className="p-3 border-b border-indigo-100 text-center text-xs font-bold">AVG %</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-indigo-50">
                            {/* Summary Rows — only show for Internal types */}
                            {!isWeighted && (
                                <>
                                    <tr className="bg-white/40 font-medium text-gray-700">
                                        <td className="p-4 border-r border-indigo-50 sticky left-0 bg-white/40 backdrop-blur-sm">PART-A CO totals</td>
                                        <td className="border-r border-indigo-50"></td>
                                        {CO_LABELS.map(co => (
                                            <td key={co} className="p-3 border-r border-indigo-50 text-center text-xs">
                                                {partWiseTotals.partA[co]}
                                            </td>
                                        ))}
                                        <td colSpan={7}></td>
                                    </tr>
                                    <tr className="bg-white/40 font-medium text-gray-700">
                                        <td className="p-4 border-r border-indigo-50 sticky left-0 bg-white/40 backdrop-blur-sm">PART-B (a) CO totals</td>
                                        <td className="border-r border-indigo-50"></td>
                                        {CO_LABELS.map(co => (
                                            <td key={co} className="p-3 border-r border-indigo-50 text-center text-xs">
                                                {partWiseTotals.partB_a[co]}
                                            </td>
                                        ))}
                                        <td colSpan={7}></td>
                                    </tr>
                                    <tr className="bg-white/40 font-medium text-gray-700">
                                        <td className="p-4 border-r border-indigo-50 sticky left-0 bg-white/40 backdrop-blur-sm">PART-B (b) CO totals</td>
                                        <td className="border-r border-indigo-50"></td>
                                        {CO_LABELS.map(co => (
                                            <td key={co} className="p-3 border-r border-indigo-50 text-center text-xs">
                                                {partWiseTotals.partB_b[co]}
                                            </td>
                                        ))}
                                        <td colSpan={7}></td>
                                    </tr>
                                </>
                            )}

                            <tr className="bg-yellow-50/80 font-bold text-gray-900 border-b-2 border-indigo-100">
                                <td className="p-4 border-r border-indigo-100 sticky left-0 bg-yellow-50">TOTAL CO Maximum</td>
                                <td className="border-r border-indigo-100 text-center">
                                    {isWeighted ? weightedTotalMax : totalMax}
                                </td>
                                {CO_LABELS.map(co => (
                                    <td key={co} className="p-3 border-r border-indigo-100 text-center">
                                        {isWeighted
                                            ? parseFloat((coMaxMarks[co] * weight).toFixed(2))
                                            : coMaxMarks[co]}
                                    </td>
                                ))}
                                <td colSpan={7} className="text-center text-gray-400 font-normal italic text-xs">
                                    (Target Range)
                                </td>
                            </tr>

                            {/* Student Rows */}
                            {studentResults.map((s, idx) => (
                                <tr key={s.id} className="hover:bg-indigo-50/40 transition-colors">
                                    <td className="p-4 border-r border-indigo-50 sticky left-0 bg-white/60 backdrop-blur-sm font-medium text-gray-700">
                                        {idx + 1}. {s.regNo} - {s.name}
                                    </td>

                                    {/* Raw CO Totals */}
                                    <td className="p-3 border-r border-indigo-50 text-center font-semibold bg-gray-50/30">
                                        {s.results.total}
                                    </td>
                                    {CO_LABELS.map(co => (
                                        <td key={co} className="p-3 border-r border-indigo-50 text-center text-gray-600">
                                            {s.results[co] !== undefined ? s.results[co] : "-"}
                                        </td>
                                    ))}

                                    {/* Weighted Percentages */}
                                    {CO_LABELS.map(co => {
                                        const rawPct = s.results.percentage[co];
                                        const displayPct = parseFloat((rawPct * weight).toFixed(2));
                                        return (
                                            <td key={co} className="p-3 border-r border-indigo-50 text-center">
                                                <span className={cn(
                                                    "px-2.5 py-1 rounded-md text-xs font-bold shadow-sm",
                                                    rawPct >= 60 ? "bg-green-100 text-green-700 border border-green-200" :
                                                        rawPct >= 40 ? "bg-yellow-100 text-yellow-700 border border-yellow-200" :
                                                            rawPct >= 0 ? "bg-red-100 text-red-700 border border-red-200" : "text-gray-300"
                                                )}>
                                                    {displayPct >= 0 ? `${displayPct}` : "-"}
                                                </span>
                                            </td>
                                        );
                                    })}
                                    <td className="p-3 text-center text-gray-400 text-xs">
                                        -
                                    </td>
                                </tr>
                            ))}

                            {/* Attainment Summary Rows — CO Average only */}
                            {testType === "CO Average" && (<>
                            <tr>
                                <td colSpan={2} className="p-3 border-r border-indigo-50 font-semibold bg-gray-50/50 sticky left-0 text-gray-700">No of Students Attended</td>
                                {CO_LABELS.map(co => (
                                    <td key={co} className="p-3 border-r border-indigo-50 text-center text-sm font-medium bg-gray-50/50">
                                        {attainment[co]?.level !== "N/A" ? attainment[co].attended : "-"}
                                    </td>
                                ))}
                                <td colSpan={7} className="bg-gray-50/50"></td>
                            </tr>
                            <tr>
                                <td colSpan={2} className="p-3 border-r border-indigo-50 font-semibold bg-gray-50/50 sticky left-0 text-gray-700">No. of Students Scoring &ge;60%</td>
                                {CO_LABELS.map(co => (
                                    <td key={co} className="p-3 border-r border-indigo-50 text-center text-sm font-medium bg-gray-50/50">
                                        {attainment[co]?.level !== "N/A" ? attainment[co].scoring60 : "-"}
                                    </td>
                                ))}
                                <td colSpan={7} className="bg-gray-50/50"></td>
                            </tr>
                            <tr>
                                <td colSpan={2} className="p-3 border-r border-indigo-50 font-semibold bg-gray-50/50 sticky left-0 text-gray-700">% of Students Scoring &ge;60%</td>
                                {CO_LABELS.map(co => (
                                    <td key={co} className="p-3 border-r border-indigo-50 text-center text-sm font-medium bg-gray-50/50">
                                        {attainment[co]?.level !== "N/A" ? attainment[co].pct : "-"}
                                    </td>
                                ))}
                                <td colSpan={7} className="bg-gray-50/50"></td>
                            </tr>
                            <tr>
                                <td colSpan={2} className="p-3 border-r border-indigo-50 font-semibold bg-indigo-100/50 sticky left-0 text-indigo-900">Attainment Level</td>
                                {CO_LABELS.map(co => (
                                    <td key={co} className="p-3 border-r border-indigo-50 text-center text-sm font-bold bg-indigo-100/50 text-indigo-700">
                                        {attainment[co]?.level !== "N/A" ? attainment[co].level : "N/A"}
                                    </td>
                                ))}
                                <td colSpan={7} className="bg-indigo-100/50"></td>
                            </tr>
                            </>)}

                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
