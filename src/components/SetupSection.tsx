"use client";

import React from "react";
import { ExamConfig, QuestionConfig, COLabel } from "@/types";
import { QUESTION_ORDER } from "@/lib/constants";
import { ChevronDown, ChevronUp, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface SetupSectionProps {
    examConfig: ExamConfig;
    setExamConfig: (config: ExamConfig) => void;
    questionConfig: QuestionConfig;
    setQuestionConfig: (config: QuestionConfig) => void;
    isOpen: boolean;
    onToggle: () => void;
    onReset: () => void;
}

const CO_OPTIONS: COLabel[] = ["co1", "co2", "co3", "co4", "co5", "co6"];

export default function SetupSection({
    examConfig,
    setExamConfig,
    questionConfig,
    setQuestionConfig,
    isOpen,
    onToggle,
    onReset
}: SetupSectionProps) {

    const handleQuestionConfigChange = (qId: string, field: "co" | "maxMark", value: any) => {
        setQuestionConfig({
            ...questionConfig,
            [qId]: {
                ...questionConfig[qId],
                [field]: field === "maxMark" ? Number(value) : value,
            },
        });
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                        <Settings className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                        <h2 className="text-lg font-semibold text-gray-900">Assessment Setup</h2>
                        <p className="text-xs text-gray-500">Configure exam details and CO mappings</p>
                    </div>
                </div>
                {isOpen ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
            </button>

            {isOpen && (
                <div className="p-6 space-y-8 animate-in slide-in-from-top-4 fade-in duration-300">

                    {/* Exam Configuration */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
                            <input
                                type="text"
                                value={examConfig.academicYear}
                                onChange={(e) => setExamConfig({ ...examConfig, academicYear: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="2025-2026"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Test Type</label>
                            <select
                                value={examConfig.testType}
                                onChange={(e) => setExamConfig({ ...examConfig, testType: e.target.value as any })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                            >
                                <option value="Internal 1">Internal 1</option>
                                <option value="Internal 2">Internal 2</option>
                                <option value="Internal 3">Internal 3</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Subject Name (Optional)</label>
                            <input
                                type="text"
                                value={examConfig.subjectName || ""}
                                onChange={(e) => setExamConfig({ ...examConfig, subjectName: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="e.g. Data Structures"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Subject Code (Optional)</label>
                            <input
                                type="text"
                                value={examConfig.subjectCode || ""}
                                onChange={(e) => setExamConfig({ ...examConfig, subjectCode: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="e.g. CS101"
                            />
                        </div>
                    </div>

                    <div className="border-t border-gray-100 my-6"></div>

                    {/* Question Configuration */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-md font-semibold text-gray-900">Question Configuration</h3>
                            <button
                                onClick={onReset}
                                className="text-xs text-red-500 hover:text-red-700 underline"
                            >
                                Reset to Defaults
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {QUESTION_ORDER.map((qId) => (
                                <div key={qId} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                    <div className="w-12 text-center font-bold text-gray-700 uppercase disable-select">
                                        {qId}
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-gray-500 uppercase font-bold w-6">Max</span>
                                            <input
                                                type="number"
                                                min="1"
                                                value={questionConfig[qId]?.maxMark}
                                                onChange={(e) => handleQuestionConfigChange(qId, "maxMark", e.target.value)}
                                                className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-500"
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-gray-500 uppercase font-bold w-6">CO</span>
                                            <select
                                                value={questionConfig[qId]?.co}
                                                onChange={(e) => handleQuestionConfigChange(qId, "co", e.target.value)}
                                                className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-500 bg-white"
                                            >
                                                {CO_OPTIONS.map(co => (
                                                    <option key={co} value={co}>{co.toUpperCase()}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            onClick={onToggle}
                            className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                        >
                            Save & Close Setup
                        </button>
                    </div>

                </div>
            )}
        </div>
    );
}
