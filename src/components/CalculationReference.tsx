"use client";

import React from "react";
import { QuestionConfig, COLabel } from "@/types";
import { QUESTION_ORDER } from "@/lib/constants";

interface CalculationReferenceProps {
    questionConfig: QuestionConfig;
}

export default function CalculationReference({ questionConfig }: CalculationReferenceProps) {
    // Aggregate data for display
    const coDetails: Record<string, { questions: string[]; totalMax: number }> = {
        co1: { questions: [], totalMax: 0 },
        co2: { questions: [], totalMax: 0 },
        co3: { questions: [], totalMax: 0 },
        co4: { questions: [], totalMax: 0 },
        co5: { questions: [], totalMax: 0 },
        co6: { questions: [], totalMax: 0 },
    };

    QUESTION_ORDER.forEach((qId) => {
        const config = questionConfig[qId];
        if (config) {
            const { co, maxMark } = config;
            coDetails[co].questions.push(`${qId.toUpperCase()} (${maxMark})`);
            coDetails[co].totalMax += maxMark;
        }
    });

    return (
        <div className="space-y-6">
            <div className="glass-panel p-6 shadow-lg border border-white/40">
                <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                    Calculation Logic Reference
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                    Breakdown of how Course Outcome (CO) values are derived.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Mapping Table */}
                <div className="glass-panel p-6 shadow-xl border border-white/40">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
                        Question-to-CO Mapping
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead className="bg-blue-50/50 text-blue-900 font-semibold">
                                <tr>
                                    <th className="p-3 border-b border-blue-100">Course Outcome</th>
                                    <th className="p-3 border-b border-blue-100">Mapped Questions (Max Marks)</th>
                                    <th className="p-3 border-b border-blue-100 text-right">CO Max Marks</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-blue-50">
                                {Object.entries(coDetails).map(([co, details]) => (
                                    <tr key={co} className="hover:bg-blue-50/30 transition-colors">
                                        <td className="p-3 border-r border-blue-50 uppercase font-bold text-gray-700">
                                            {co}
                                        </td>
                                        <td className="p-3 border-r border-blue-50 text-gray-600">
                                            {details.questions.length > 0
                                                ? details.questions.join(", ")
                                                : <span className="text-gray-400 italic">No questions mapped</span>}
                                        </td>
                                        <td className="p-3 text-right font-mono font-medium text-indigo-600">
                                            {details.totalMax}
                                        </td>
                                    </tr>
                                ))}
                                <tr className="bg-blue-50/50 font-bold text-gray-900">
                                    <td className="p-3 border-t border-blue-200" colSpan={2}>TOTAL EXAM MARKS</td>
                                    <td className="p-3 border-t border-blue-200 text-right font-mono text-lg">
                                        {Object.values(coDetails).reduce((acc, curr) => acc + curr.totalMax, 0)}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Formulas */}
                <div className="glass-panel p-6 shadow-xl border border-white/40">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="w-2 h-6 bg-purple-500 rounded-full"></span>
                        Formulas Used
                    </h3>
                    <div className="space-y-6">
                        <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100">
                            <h4 className="font-semibold text-purple-900 mb-2">1. CO Attainment Value</h4>
                            <p className="text-sm text-gray-600 mb-2">
                                The sum of marks obtained by a student in all questions mapped to a specific CO.
                            </p>
                            <code className="block bg-white p-3 rounded-lg border border-purple-100 text-xs font-mono text-gray-700">
                                CO_Value = ∑ (Marks obtained in Questions mapped to CO)
                            </code>
                        </div>

                        <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100">
                            <h4 className="font-semibold text-purple-900 mb-2">2. CO Attainment Percentage</h4>
                            <p className="text-sm text-gray-600 mb-2">
                                The ratio of the obtained CO Value to the maximum possible marks for that CO.
                            </p>
                            <code className="block bg-white p-3 rounded-lg border border-purple-100 text-xs font-mono text-gray-700">
                                CO% = (CO_Value / CO_Max_Marks) × 100
                            </code>
                            <p className="text-xs text-gray-500 mt-2 italic">
                                * If CO_Max_Marks is 0, Percentage is shown as 0 (No #DIV/0 error).
                            </p>
                        </div>

                        <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100">
                            <h4 className="font-semibold text-purple-900 mb-2">3. Part-Wise Totals</h4>
                            <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                                <li><strong>Part A:</strong> Sum of mapped CO max marks for Q1–Q10.</li>
                                <li><strong>Part B (a):</strong> Sum of mapped CO max marks for Q11a–Q16a.</li>
                                <li><strong>Part B (b):</strong> Sum of mapped CO max marks for Q11b–Q16b.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
