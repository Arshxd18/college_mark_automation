"use client";

import React, { useMemo } from "react";
import { Student, QuestionConfig } from "@/types";
import { calculateCOAttainment, getPartWiseTotals, calculateCOMaxMarks } from "@/lib/calculations";
import { cn } from "@/lib/utils";

interface COAnalysisProps {
    students: Student[];
    questionConfig: QuestionConfig;
}

export default function COAnalysis({ students, questionConfig }: COAnalysisProps) {

    const partWiseTotals = useMemo(() => getPartWiseTotals(questionConfig), [questionConfig]);

    // Static Max Marks (assuming Part A is chosen for max calculation basics)
    const coMaxMarks = useMemo(() => {
        const staticMaxMarks = { co1: 0, co2: 0, co3: 0, co4: 0, co5: 0, co6: 0 };
        Object.entries(questionConfig).forEach(([qId, conf]) => {
            // For static "Max Marks" display, we usually sum up the paper's total.
            // If 11a and 11b both exist, we only add one.
            if (qId.endsWith('b')) return; // Simple heuristic: ignore 'b' for total sum
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

    const CO_LABELS = ["co1", "co2", "co3", "co4", "co5", "co6"] as const;

    return (
        <div className="space-y-6">
            <div className="glass-panel overflow-hidden border border-white/40 shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse whitespace-nowrap">
                        <thead className="bg-indigo-50/50 text-indigo-900 font-semibold backdrop-blur-md">
                            <tr>
                                <th rowSpan={2} className="p-4 border-b-2 border-r border-indigo-100 sticky left-0 z-20 bg-white/80 backdrop-blur-md">Details</th>
                                <th colSpan={7} className="p-2 border-b border-r border-indigo-100 text-center bg-indigo-100/30">Details of Marks Allocated for COs</th>
                                <th colSpan={7} className="p-2 border-b border-indigo-100 text-center bg-indigo-100/30">Percentage of Marks Allocated for COs</th>
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
                            {/* Summary Rows */}
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
                            <tr className="bg-yellow-50/80 font-bold text-gray-900 border-b-2 border-indigo-100">
                                <td className="p-4 border-r border-indigo-100 sticky left-0 bg-yellow-50">TOTAL CO Maximum</td>
                                <td className="border-r border-indigo-100 text-center">
                                    {/* Sum of all CO maxes */}
                                    {Object.values(coMaxMarks).reduce((a, b) => a + b, 0)}
                                </td>
                                {CO_LABELS.map(co => (
                                    <td key={co} className="p-3 border-r border-indigo-100 text-center">
                                        {coMaxMarks[co]}
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

                                    {/* Values */}
                                    <td className="p-3 border-r border-indigo-50 text-center font-semibold bg-gray-50/30">
                                        {s.results.total}
                                    </td>
                                    {CO_LABELS.map(co => (
                                        <td key={co} className="p-3 border-r border-indigo-50 text-center text-gray-600">
                                            {s.results[co] || "-"}
                                        </td>
                                    ))}

                                    {/* Percentages */}
                                    {CO_LABELS.map(co => {
                                        const pct = s.results.percentage[co];
                                        return (
                                            <td key={co} className="p-3 border-r border-indigo-50 text-center">
                                                <span className={cn(
                                                    "px-2.5 py-1 rounded-md text-xs font-bold shadow-sm",
                                                    pct >= 60 ? "bg-green-100 text-green-700 border border-green-200" :
                                                        pct >= 40 ? "bg-yellow-100 text-yellow-700 border border-yellow-200" :
                                                            pct > 0 ? "bg-red-100 text-red-700 border border-red-200" : "text-gray-300"
                                                )}>
                                                    {pct > 0 ? `${pct}%` : "-"}
                                                </span>
                                            </td>
                                        );
                                    })}
                                    <td className="p-3 text-center text-gray-400 text-xs">
                                        -
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
