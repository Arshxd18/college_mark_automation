"use client";

import React, { useState, useEffect } from "react";
import { Student, Marks, ExamConfig, QuestionConfig, DEFAULT_QUESTION_CONFIG } from "@/types";
import MarksEntry from "./MarksEntry";
import COAnalysis from "./COAnalysis";
import Visualizations from "./Visualizations";
import CalculationReference from "./CalculationReference";
import SetupSection from "./SetupSection";
import { Download, BarChart3, Calculator, Table as TableIcon, BookOpen, Menu, X } from "lucide-react";

import Header from "./Header";
import Footer from "./Footer";

export default function Dashboard() {
    // ... existing state ...
    const [activeTab, setActiveTab] = useState<"entry" | "analysis" | "visuals" | "logic">("entry");
    const [students, setStudents] = useState<Student[]>([]);

    // New Dynamic Configuration State
    const [examConfig, setExamConfig] = useState<ExamConfig>({
        academicYear: "2023-2024",
        testType: "Internal 1",
        subjectName: "",
        subjectCode: ""
    });

    const [questionConfig, setQuestionConfig] = useState<QuestionConfig>(DEFAULT_QUESTION_CONFIG);
    const [isSetupOpen, setIsSetupOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // ... existing effects ...
    // Load saved data on mount
    useEffect(() => {
        // Load student data
        const savedStudents = localStorage.getItem("co_students");
        if (savedStudents) {
            try {
                setStudents(JSON.parse(savedStudents));
            } catch (e) { console.error("Failed to load students", e); }
        }

        // Load configs
        const savedExamConfig = localStorage.getItem("co_exam_config");
        if (savedExamConfig) {
            try { setExamConfig(JSON.parse(savedExamConfig)); } catch (e) { }
        }

        const savedQConfig = localStorage.getItem("co_question_config");
        if (savedQConfig) {
            try { setQuestionConfig(JSON.parse(savedQConfig)); } catch (e) { }
        }
    }, []);

    // Save on changes
    useEffect(() => { localStorage.setItem("co_students", JSON.stringify(students)); }, [students]);
    useEffect(() => { localStorage.setItem("co_exam_config", JSON.stringify(examConfig)); }, [examConfig]);
    useEffect(() => { localStorage.setItem("co_question_config", JSON.stringify(questionConfig)); }, [questionConfig]);

    const handleUpdateStudent = (index: number, field: keyof Student, value: any) => {
        const newStudents = [...students];
        newStudents[index] = { ...newStudents[index], [field]: value };
        setStudents(newStudents);
    };

    const handleUpdateMarks = (index: number, marks: Marks) => {
        const newStudents = [...students];
        newStudents[index] = { ...newStudents[index], marks };
        setStudents(newStudents);
    };

    const addStudent = () => {
        const newStudent: Student = {
            id: crypto.randomUUID(),
            slNo: students.length + 1,
            regNo: "",
            rollNo: "",
            name: "",
            marks: {}
        };
        setStudents([...students, newStudent]);
    };

    const removeStudent = (index: number) => {
        const newStudents = students.filter((_, i) => i !== index);
        const reIndexed = newStudents.map((s, i) => ({ ...s, slNo: i + 1 }));
        setStudents(reIndexed);
    };

    const handleResetConfig = () => {
        if (confirm("Are you sure you want to reset CO mappings and max marks to defaults?")) {
            setQuestionConfig(DEFAULT_QUESTION_CONFIG);
        }
    };

    const handleExport = async () => {
        try {
            const response = await fetch('/api/export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ students, examConfig, questionConfig }),
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `CO_Analysis_${examConfig.academicYear}.xlsx`;
                document.body.appendChild(a);
                a.click();
                a.remove();
            } else {
                alert('Failed to export Excel');
            }
        } catch (e) {
            console.error(e);
            alert('Error exporting Excel');
        }
    };

    const NavButton = ({ tab, icon: Icon, label }: { tab: typeof activeTab, icon: any, label: string }) => (
        <button
            onClick={() => { setActiveTab(tab); setIsMobileMenuOpen(false); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all w-full md:w-auto ${activeTab === tab
                ? "bg-white text-indigo-600 shadow-sm ring-1 ring-black/5"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-200/50"
                }`}
        >
            <Icon className="w-4 h-4" />
            {label}
        </button>
    );

    return (
        <div className="min-h-screen flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900 bg-gray-50">
            <Header />

            {/* Toolbar / Sub-header */}
            <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-20 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
                    {/* System Name / Context */}
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-md">
                            <Calculator className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-gray-700 text-sm hidden sm:inline">CO Automation System</span>
                    </div>

                    {/* Desktop Toolbar Nav */}
                    <div className="hidden md:flex items-center gap-6">
                        <nav className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
                            <NavButton tab="entry" icon={TableIcon} label="Entry" />
                            <NavButton tab="analysis" icon={Calculator} label="Analysis" />
                            <NavButton tab="visuals" icon={BarChart3} label="Visuals" />
                            <NavButton tab="logic" icon={BookOpen} label="Logic" />
                        </nav>

                        <div className="h-6 w-px bg-gray-300 mx-2"></div>

                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg shadow-sm text-sm font-semibold transition-all hover:-translate-y-0.5"
                        >
                            <Download className="w-4 h-4" />
                            Export Data
                        </button>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <div className="md:hidden flex items-center gap-2">
                        <button
                            onClick={handleExport}
                            className="p-2 text-emerald-600 bg-emerald-50 rounded-lg"
                        >
                            <Download className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="p-2 text-gray-600 bg-gray-100 rounded-lg"
                        >
                            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Toolbar Dropdown */}
                {isMobileMenuOpen && (
                    <div className="md:hidden border-t border-gray-200 bg-white p-4 space-y-2 shadow-inner">
                        <NavButton tab="entry" icon={TableIcon} label="Marks Entry" />
                        <NavButton tab="analysis" icon={Calculator} label="CO Analysis" />
                        <NavButton tab="visuals" icon={BarChart3} label="Visualizations" />
                        <NavButton tab="logic" icon={BookOpen} label="Calculation Logic" />
                    </div>
                )}
            </div>

            <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 w-full">

                <SetupSection
                    examConfig={examConfig}
                    setExamConfig={setExamConfig}
                    questionConfig={questionConfig}
                    setQuestionConfig={setQuestionConfig}
                    isOpen={isSetupOpen}
                    onToggle={() => setIsSetupOpen(!isSetupOpen)}
                    onReset={handleResetConfig}
                />

                <div className="animate-in fade-in duration-500 mt-6">
                    {activeTab === "entry" && (
                        <MarksEntry
                            students={students}
                            questionConfig={questionConfig}
                            onUpdateStudent={handleUpdateStudent}
                            onUpdateMarks={handleUpdateMarks}
                            onAddStudent={addStudent}
                            onRemoveStudent={removeStudent}
                        />
                    )}
                    {activeTab === "analysis" && (
                        <COAnalysis students={students} questionConfig={questionConfig} />
                    )}
                    {activeTab === "visuals" && (
                        <Visualizations students={students} questionConfig={questionConfig} />
                    )}
                    {activeTab === "logic" && (
                        <CalculationReference questionConfig={questionConfig} />
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
