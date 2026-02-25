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
                        Full Engine Attainment Formulas
                    </h3>
                    <div className="space-y-6">
                        <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100">
                            <h4 className="font-semibold text-purple-900 mb-2">1. Internal Attainment</h4>
                            <p className="text-sm text-gray-600 mb-2">
                                Derived from continuous assessments: CO Exams, Unit Tests, and Assignments.
                            </p>
                            <code className="block bg-white p-3 rounded-lg border border-purple-100 text-xs font-mono text-gray-700">
                                CO_Average = (Internal 1 + Internal 2) / 2<br />
                                Internal = (CO_Average × 60%) + (UT_Percentage × 15%) + (Assignment_Percentage × 25%)
                            </code>
                        </div>

                        <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100">
                            <h4 className="font-semibold text-purple-900 mb-2">2. Direct Attainment</h4>
                            <p className="text-sm text-gray-600 mb-2">
                                Combines the University Semester End Examination with Internal Attainment.
                            </p>
                            <code className="block bg-white p-3 rounded-lg border border-purple-100 text-xs font-mono text-gray-700">
                                Direct = (Semester_Percentage × 60%) + (Internal_Attainment × 40%)
                            </code>
                        </div>

                        <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100">
                            <h4 className="font-semibold text-purple-900 mb-2">3. Indirect Attainment</h4>
                            <p className="text-sm text-gray-600 mb-2">
                                Values from 0 to 3, directly taken from the Course-End Survey feedback.
                            </p>
                        </div>

                        <div className="bg-indigo-50/80 p-5 rounded-xl border border-indigo-200 shadow-sm">
                            <h4 className="font-bold text-indigo-900 mb-2">4. Final Attainment</h4>
                            <p className="text-sm text-gray-700 mb-2">
                                Final calculation determining the overall success level. Target is generally &gt; 2.0.
                            </p>
                            <code className="block bg-white p-3 rounded-lg border border-indigo-200 font-bold text-sm font-mono text-indigo-700">
                                Final_Attainment = (Direct_Attainment × 90%) + (Indirect_Attainment × 10%)
                            </code>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                            <h4 className="font-semibold text-gray-800 mb-2">Level Thresholds</h4>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li><span className="font-bold text-emerald-600">Level 3 (High):</span> ≥ 60% of students scored above target.</li>
                                <li><span className="font-bold text-yellow-600">Level 2 (Medium):</span> 50% - 59% of students scored above target.</li>
                                <li><span className="font-bold text-orange-600">Level 1 (Low):</span> 40% - 49% of students scored above target.</li>
                                <li><span className="font-bold text-red-600">Level 0:</span> &lt; 40% of students scored above target.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
