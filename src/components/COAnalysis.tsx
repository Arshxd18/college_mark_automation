"use client";

import React, { useMemo } from "react";
import { Student, QuestionConfig, TestType, AttainmentThresholds } from "@/types";
import { calculateCOAttainment, getPartWiseTotals } from "@/lib/calculations";
import { computeAssessmentCO } from "@/lib/attainmentEngine";
import { cn } from "@/lib/utils";

interface COAnalysisProps {
    students: Student[];
    questionConfig: QuestionConfig;
    testType?: TestType;
    thresholds?: AttainmentThresholds;
}

// Weight multipliers for display — these match the contribution each test type has to Internal Attainment
const WEIGHT_BY_TYPE: Record<string, number> = {
    "CO Average": 0.25,
    "Unit Test": 0.15,
    "Internal 1": 1,
    "Internal 2": 1,
    "Semester": 0.60,
};

export default function COAnalysis({ students, questionConfig, testType = "Internal 1", thresholds }: COAnalysisProps) {

    const weight = WEIGHT_BY_TYPE[testType] ?? 1;
    const isWeighted = weight !== 1;
    const targetScorePct = thresholds?.targetStudentScorePct ?? 60;

    const CO_LABELS = ["co1", "co2", "co3", "co4", "co5", "co6"] as const;

    const hasChoicePairs = Object.keys(questionConfig).some(k => /^q\d+[ab]$/i.test(k));

    const coMaxMarks = useMemo(() => {
        // Standard CO calculation for all assessments (Internal 1, Internal 2, Unit Test, Assignment, Semester):
        // TOTAL CO Maximum for each CO is simply the sum of all question maxMarks configured for that CO!
        // In Excel: =SUMIF($E$14:$Z$14, "COx", $E$13:$Z$13)
        const staticMaxMarks = { co1: 0, co2: 0, co3: 0, co4: 0, co5: 0, co6: 0 };
        Object.entries(questionConfig).forEach(([qId, conf]) => {
            if (conf.co && staticMaxMarks[conf.co] !== undefined) {
                staticMaxMarks[conf.co] += conf.maxMark;
            }
        });
        return staticMaxMarks;
    }, [questionConfig]);

    const partWiseTotals = useMemo(() => getPartWiseTotals(questionConfig), [questionConfig]);

    const isUT = testType === "Unit Test" || Object.keys(questionConfig).some(k => k.startsWith('u'));

    const studentResults = useMemo(() => {
        return students.map(student => {
            return {
                ...student,
                results: calculateCOAttainment(student.marks, questionConfig),
            };
        });
    }, [students, questionConfig]);

    const { attainment } = useMemo(() => {
        return computeAssessmentCO(students, questionConfig, testType, thresholds);
    }, [students, questionConfig, testType, thresholds]);

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
                    <span className="font-bold">Weighted View:</span>
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
                                <td className="border-r border-indigo-100 text-center" title={hasChoicePairs ? "Exam max is 100 (Total with all choices: 180)" : undefined}>
                                    {isWeighted ? weightedTotalMax : (hasChoicePairs ? 100 : totalMax)}
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

                            {/* Attainment Summary Rows — All Assessments (Internal 1, 2, Unit Test, Assignment, etc.) */}
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
                                <td colSpan={2} className="p-3 border-r border-indigo-50 font-semibold bg-gray-50/50 sticky left-0 text-gray-700">No. of Students Scoring &ge;{targetScorePct}%</td>
                                {CO_LABELS.map(co => (
                                    <td key={co} className="p-3 border-r border-indigo-50 text-center text-sm font-medium bg-gray-50/50">
                                        {attainment[co]?.level !== "N/A" ? attainment[co].scoring60 : "-"}
                                    </td>
                                ))}
                                <td colSpan={7} className="bg-gray-50/50"></td>
                            </tr>
                            <tr>
                                <td colSpan={2} className="p-3 border-r border-indigo-50 font-semibold bg-gray-50/50 sticky left-0 text-gray-700">% of Students Scoring &ge;{targetScorePct}%</td>
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
                                        {attainment[co]?.level !== "N/A" ? `L${attainment[co].level}` : "N/A"}
                                    </td>
                                ))}
                                <td colSpan={7} className="bg-indigo-100/50"></td>
                            </tr>

                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
