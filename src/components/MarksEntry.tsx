"use client";

import React from "react";
import { Student, Marks, QuestionConfig } from "@/types";
import { QUESTION_ORDER } from "@/lib/constants";
import { Plus, Trash2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface MarksEntryProps {
    students: Student[];
    questionConfig: QuestionConfig;
    onUpdateStudent: (index: number, field: keyof Student, value: any) => void;
    onUpdateMarks: (index: number, marks: Marks) => void;
    onAddStudent: () => void;
    onRemoveStudent: (index: number) => void;
}

export default function MarksEntry({
    students,
    questionConfig,
    onUpdateStudent,
    onUpdateMarks,
    onAddStudent,
    onRemoveStudent
}: MarksEntryProps) {

    const handleMarkChange = (studentIndex: number, qId: string, value: string) => {
        const numValue = value === "" ? 0 : Number(value);

        // We update anyway, validation visual shown in render
        const updatedMarks = { ...students[studentIndex].marks, [qId]: numValue };
        onUpdateMarks(studentIndex, updatedMarks);
    };

    return (
        <div className="space-y-4">
            <div className="glass-panel overflow-hidden border border-white/40 shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="bg-indigo-50/50 text-gray-700 font-semibold sticky top-0 z-20 backdrop-blur-md">
                            <tr>
                                <th className="p-4 border-b border-indigo-100 min-w-[60px] sticky left-0 z-30 bg-white/80 backdrop-blur-md">Sl</th>
                                <th className="p-4 border-b border-indigo-100 min-w-[140px] sticky left-[60px] z-30 bg-white/80 backdrop-blur-md">Register No</th>
                                <th className="p-4 border-b border-indigo-100 min-w-[200px] sticky left-[200px] z-30 bg-white/80 backdrop-blur-md">Student Name</th>
                                {QUESTION_ORDER.map((qId) => (
                                    <th key={qId} className="p-2 border-b border-l border-indigo-50 text-center min-w-[70px] bg-indigo-50/30">
                                        <div className="flex flex-col items-center">
                                            <span className="uppercase text-xs font-bold text-indigo-900">{qId}</span>
                                            <span className="text-[10px] text-gray-400 font-medium">({questionConfig[qId]?.maxMark || '-'})</span>
                                            <span className="text-[9px] text-indigo-400 font-bold uppercase">{questionConfig[qId]?.co}</span>
                                        </div>
                                    </th>
                                ))}
                                <th className="p-4 border-b border-indigo-100 min-w-[60px] bg-indigo-50/30"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-indigo-50">
                            {students.length === 0 ? (
                                <tr>
                                    <td colSpan={QUESTION_ORDER.length + 4} className="p-12 text-center text-gray-400 italic">
                                        No students added yet. Click "Add Student" to start entering marks.
                                    </td>
                                </tr>
                            ) : (
                                students.map((student, idx) => (
                                    <tr key={student.id} className="hover:bg-indigo-50/40 group transition-colors">
                                        <td className="p-3 border-r border-indigo-50 text-center text-gray-500 sticky left-0 bg-white/60 group-hover:bg-indigo-50/60 backdrop-blur-sm z-10">{student.slNo}</td>
                                        <td className="p-3 border-r border-indigo-50 sticky left-[60px] bg-white/60 group-hover:bg-indigo-50/60 backdrop-blur-sm z-10">
                                            <input
                                                type="text"
                                                value={student.regNo}
                                                onChange={(e) => onUpdateStudent(idx, 'regNo', e.target.value)}
                                                placeholder="Reg No"
                                                className="w-full bg-transparent focus:outline-none focus:ring-1 focus:ring-indigo-400 rounded px-2 py-1 text-gray-700 font-medium placeholder:text-gray-300 transition-all"
                                            />
                                        </td>
                                        <td className="p-3 border-r border-indigo-50 sticky left-[200px] bg-white/60 group-hover:bg-indigo-50/60 backdrop-blur-sm z-10">
                                            <input
                                                type="text"
                                                value={student.name}
                                                onChange={(e) => onUpdateStudent(idx, 'name', e.target.value)}
                                                placeholder="Student Name"
                                                className="w-full bg-transparent focus:outline-none focus:ring-1 focus:ring-indigo-400 rounded px-2 py-1 text-gray-700 font-medium placeholder:text-gray-300 transition-all"
                                            />
                                        </td>
                                        {QUESTION_ORDER.map((qId) => {
                                            const max = questionConfig[qId]?.maxMark || 0;
                                            const val = student.marks[qId] ?? "";
                                            const isInvalid = Number(val) > max;

                                            return (
                                                <td key={qId} className="p-2 border-r border-indigo-50 text-center">
                                                    <div className="relative group/input">
                                                        <input
                                                            type="number"
                                                            value={val}
                                                            min={0}
                                                            max={max}
                                                            onChange={(e) => handleMarkChange(idx, qId, e.target.value)}
                                                            className={cn(
                                                                "w-full text-center py-1.5 rounded-lg focus:outline-none focus:ring-2 transition-all font-medium text-sm",
                                                                isInvalid
                                                                    ? "bg-red-50 text-red-600 ring-2 ring-red-200 focus:ring-red-400"
                                                                    : "bg-white/50 focus:bg-white focus:ring-indigo-400 hover:bg-white/80"
                                                            )}
                                                        />
                                                        {isInvalid && (
                                                            <div className="absolute -top-2 -right-2 transform scale-0 group-hover/input:scale-100 transition-transform z-40">
                                                                <AlertCircle className="w-4 h-4 text-red-500 fill-white" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                        <td className="p-2 text-center">
                                            <button
                                                onClick={() => onRemoveStudent(idx)}
                                                className="text-gray-300 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50 active:scale-95"
                                                title="Remove Student"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            <div className="flex justify-end p-2">
                <button
                    onClick={onAddStudent}
                    className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md transition-all hover:shadow-lg active:scale-95"
                >
                    <Plus className="w-4 h-4" />
                    Add Student
                </button>
            </div>
        </div>
    );
}
