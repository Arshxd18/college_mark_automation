"use client";

import React, { useState, useEffect } from "react";
import { Student, Marks, ExamConfig, QuestionConfig, DEFAULT_QUESTION_CONFIG } from "@/types";
import MarksEntry from "./MarksEntry";
import COAnalysis from "./COAnalysis";
import Visualizations from "./Visualizations";
import CalculationReference from "./CalculationReference";
import SetupSection from "./SetupSection";
import { Download, BarChart3, Calculator, Table as TableIcon, BookOpen, Menu, X, CloudUpload, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { saveAssessment } from "@/lib/firestoreService";

import Header from "./Header";
import Footer from "./Footer";

type SaveStatus = "idle" | "saving" | "success" | "error";

export default function Dashboard() {
    const [activeTab, setActiveTab] = useState<"entry" | "analysis" | "visuals" | "logic">("entry");
    const [students, setStudents] = useState<Student[]>([]);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
    const [saveError, setSaveError] = useState("");

    const [examConfig, setExamConfig] = useState<ExamConfig>({
        academicYear: "2025-2026",
        batchYear: "2023-2027",
        subjectId: "",
        testType: "Internal 1",
    });

    const [questionConfig, setQuestionConfig] = useState<QuestionConfig>(DEFAULT_QUESTION_CONFIG);
    const [isSetupOpen, setIsSetupOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Load saved data on mount
    useEffect(() => {
        const savedStudents = localStorage.getItem("co_students");
        if (savedStudents) {
            try { setStudents(JSON.parse(savedStudents)); } catch (e) { }
        }

        const savedExamConfig = localStorage.getItem("co_exam_config");
        if (savedExamConfig) {
            try { setExamConfig(JSON.parse(savedExamConfig)); } catch (e) { }
        }

        const savedQConfig = localStorage.getItem("co_question_config");
        if (savedQConfig) {
            try { setQuestionConfig(JSON.parse(savedQConfig)); } catch (e) { }
        }
    }, []);

    // Persist locally
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
            marks: {},
        };
        setStudents([...students, newStudent]);
    };

    const removeStudent = (index: number) => {
        const newStudents = students.filter((_, i) => i !== index);
        setStudents(newStudents.map((s, i) => ({ ...s, slNo: i + 1 })));
    };

    const handleResetConfig = () => {
        if (confirm("Reset CO mappings and max marks to defaults?")) {
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

    const handleSaveToFirebase = async () => {
        if (!examConfig.batchYear.trim()) {
            alert("Please set a Batch Year before saving.");
            return;
        }
        if (!examConfig.subjectId.trim()) {
            alert("Please set a Subject ID before saving.");
            return;
        }
        if (students.length === 0) {
            alert("No students to save.");
            return;
        }

        setSaveStatus("saving");
        setSaveError("");
        try {
            await saveAssessment(examConfig, questionConfig, students);
            setSaveStatus("success");
            setTimeout(() => setSaveStatus("idle"), 3000);
        } catch (err: any) {
            console.error(err);
            setSaveError(err?.message || "Unknown error");
            setSaveStatus("error");
            setTimeout(() => setSaveStatus("idle"), 5000);
        }
    };

    const SaveButtonContent = () => {
        if (saveStatus === "saving") return <><Loader2 className="w-4 h-4 animate-spin" />Saving...</>;
        if (saveStatus === "success") return <><CheckCircle className="w-4 h-4" />Saved!</>;
        if (saveStatus === "error") return <><AlertCircle className="w-4 h-4" />Error</>;
        return <><CloudUpload className="w-4 h-4" />Save to Firebase</>;
    };

    const saveButtonClass = {
        idle: "bg-violet-600 hover:bg-violet-700",
        saving: "bg-violet-400 cursor-not-allowed",
        success: "bg-emerald-600",
        error: "bg-red-600",
    }[saveStatus];

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

            {/* Toolbar */}
            <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-20 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-md">
                            <Calculator className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-gray-700 text-sm hidden sm:inline">CO Automation System</span>
                    </div>

                    {/* Desktop Toolbar */}
                    <div className="hidden md:flex items-center gap-3">
                        <nav className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
                            <NavButton tab="entry" icon={TableIcon} label="Entry" />
                            <NavButton tab="analysis" icon={Calculator} label="Analysis" />
                            <NavButton tab="visuals" icon={BarChart3} label="Visuals" />
                            <NavButton tab="logic" icon={BookOpen} label="Logic" />
                        </nav>

                        <div className="h-6 w-px bg-gray-300"></div>

                        {/* Save to Firebase */}
                        <button
                            onClick={handleSaveToFirebase}
                            disabled={saveStatus === "saving"}
                            className={`flex items-center gap-2 ${saveButtonClass} text-white px-4 py-2 rounded-lg shadow-sm text-sm font-semibold transition-all hover:-translate-y-0.5`}
                        >
                            <SaveButtonContent />
                        </button>

                        {/* Export Excel */}
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg shadow-sm text-sm font-semibold transition-all hover:-translate-y-0.5"
                        >
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                    </div>

                    {/* Mobile */}
                    <div className="md:hidden flex items-center gap-2">
                        <button onClick={handleSaveToFirebase} disabled={saveStatus === "saving"}
                            className={`p-2 ${saveButtonClass} text-white rounded-lg`}>
                            <CloudUpload className="w-5 h-5" />
                        </button>
                        <button onClick={handleExport} className="p-2 text-emerald-600 bg-emerald-50 rounded-lg">
                            <Download className="w-5 h-5" />
                        </button>
                        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="p-2 text-gray-600 bg-gray-100 rounded-lg">
                            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                {/* Error Banner */}
                {saveStatus === "error" && saveError && (
                    <div className="bg-red-50 border-t border-red-100 px-4 py-2 text-xs text-red-700 text-center">
                        ⚠️ Save failed: {saveError}
                    </div>
                )}

                {/* Mobile Menu */}
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
