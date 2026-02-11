"use client";

import React, { useMemo } from "react";
import { Student, QuestionConfig } from "@/types";
import { calculateCOAttainment } from "@/lib/calculations";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

interface VisualizationsProps {
    students: Student[];
    questionConfig: QuestionConfig;
}

export default function Visualizations({ students, questionConfig }: VisualizationsProps) {
    const data = useMemo(() => {
        if (students.length === 0) return null;

        // Aggregate CO percentages
        const coTotals = { co1: 0, co2: 0, co3: 0, co4: 0, co5: 0, co6: 0 };
        const coCounts = { co1: 0, co2: 0, co3: 0, co4: 0, co5: 0, co6: 0 };

        students.forEach((student) => {
            const result = calculateCOAttainment(student.marks, questionConfig);
            (["co1", "co2", "co3", "co4", "co5", "co6"] as const).forEach((co) => {
                coTotals[co] += result.percentage[co];
                if (result.percentage[co] > 0) coCounts[co]++;
            });
        });

        const averageData = (["co1", "co2", "co3", "co4", "co5", "co6"] as const).map(
            (co) => ({
                name: co.toUpperCase(),
                Average: coCounts[co] ? Number((coTotals[co] / students.length).toFixed(2)) : 0,
            })
        );

        // Distribution of Total Marks
        const ranges = [
            { name: "0-20", count: 0 },
            { name: "21-40", count: 0 },
            { name: "41-60", count: 0 },
            { name: "61-80", count: 0 },
            { name: "81-100", count: 0 },
        ];

        students.forEach((s) => {
            const total = calculateCOAttainment(s.marks, questionConfig).total;
            if (total <= 20) ranges[0].count++;
            else if (total <= 40) ranges[1].count++;
            else if (total <= 60) ranges[2].count++;
            else if (total <= 80) ranges[3].count++;
            else ranges[4].count++;
        });

        return { averageData, ranges };
    }, [students, questionConfig]);

    if (!students.length) {
        return (
            <div className="p-12 text-center text-gray-500 glass-panel border border-white/40">
                <p className="text-lg font-medium text-gray-600">No student data available.</p>
                <p className="text-sm">Please enter marks in the "Marks Entry" tab to see visualizations.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Class Average CO Performance */}
                <div className="glass-panel p-6 shadow-xl border border-white/40">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <span className="w-2 h-6 bg-indigo-500 rounded-full"></span>
                        Class Average CO Attainment (%)
                    </h3>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data?.averageData} barSize={40}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e7ff" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} dy={10} tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }} />
                                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} dx={-10} tick={{ fill: '#6b7280', fontSize: 12 }} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '12px' }}
                                />
                                <Bar dataKey="Average" fill="#6366f1" radius={[8, 8, 0, 0]} animationDuration={1500} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Student Marks Distribution */}
                <div className="glass-panel p-6 shadow-xl border border-white/40">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <span className="w-2 h-6 bg-emerald-500 rounded-full"></span>
                        Total Marks Distribution
                    </h3>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data?.ranges} barSize={40}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ecfdf5" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} dy={10} tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }} />
                                <YAxis allowDecimals={false} axisLine={false} tickLine={false} dx={-10} tick={{ fill: '#6b7280', fontSize: 12 }} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(16, 185, 129, 0.1)' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '12px' }}
                                />
                                <Bar dataKey="count" name="Number of Students" fill="#10b981" radius={[8, 8, 0, 0]} animationDuration={1500} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
