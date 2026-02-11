"use client";

import React, { useState, useMemo } from "react";
import { Upload, FileSpreadsheet, CheckCircle, AlertTriangle, Download, ArrowRight, Loader2 } from "lucide-react";
import { parseExcelUpload, ParsedUploadData } from "@/lib/excel-parser";
import { calculateCOAttainment } from "@/lib/calculations";
import { cn } from "@/lib/utils";

export default function UploadAnalyzer() {
    const [step, setStep] = useState<"upload" | "preview" | "result">("upload");
    const [file, setFile] = useState<File | null>(null);
    const [data, setData] = useState<ParsedUploadData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setLoading(true);
        setError(null);

        try {
            const parsed = await parseExcelUpload(selectedFile);
            setData(parsed);
            setStep("preview");
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to parse file. Please ensure it follows the template format.");
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateReport = () => {
        setStep("result");
    };

    const results = useMemo(() => {
        if (!data) return null;
        return data.students.map(student => ({
            ...student,
            result: calculateCOAttainment(student.marks, data.questionConfig)
        }));
    }, [data]);

    const coMaxMarks = useMemo(() => {
        if (!data) return null;
        const config = data.questionConfig;
        const staticMaxMarks = { co1: 0, co2: 0, co3: 0, co4: 0, co5: 0, co6: 0 };
        Object.entries(config).forEach(([qId, conf]) => {
            if (qId.endsWith('b')) return;
            staticMaxMarks[conf.co] += conf.maxMark;
        });
        return staticMaxMarks;
    }, [data]);

    const handleExport = async () => {
        if (!data || !results) return;

        try {
            // Using the new secure API route
            const response = await fetch('/api/secure-export-x9y2z', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filename: file?.name,
                    data,
                    results,
                    coMaxMarks
                }),
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Analyzed_${file?.name || "Report.xlsx"}`;
                document.body.appendChild(a);
                a.click();
                a.remove();
            } else {
                alert('Failed to export analyzed report');
            }
        } catch (e) {
            console.error(e);
            alert('Error exporting report');
        }
    };

    const CO_LABELS = ["co1", "co2", "co3", "co4", "co5", "co6"] as const;

    return (
        <div className="space-y-8">
            {/* Stepper */}
            <div className="flex justify-center mb-8">
                <div className="flex items-center gap-4">
                    <div className={cn("flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium", step === "upload" ? "bg-indigo-100 text-indigo-700" : "text-gray-500")}>
                        <span className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-xs border">1</span> Upload
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300" />
                    <div className={cn("flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium", step === "preview" ? "bg-indigo-100 text-indigo-700" : "text-gray-500")}>
                        <span className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-xs border">2</span> Preview
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300" />
                    <div className={cn("flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium", step === "result" ? "bg-indigo-100 text-indigo-700" : "text-gray-500")}>
                        <span className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-xs border">3</span> Results
                    </div>
                </div>
            </div>

            {/* Step 1: Upload */}
            {step === "upload" && (
                <div className="max-w-2xl mx-auto">
                    <div className="border-2 border-dashed border-gray-300 rounded-2xl p-10 text-center hover:bg-gray-50 transition-colors relative">
                        <input
                            type="file"
                            accept=".xlsx"
                            onChange={handleFileUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="flex flex-col items-center gap-4">
                            <div className="p-4 bg-indigo-50 text-indigo-600 rounded-full">
                                {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : <Upload className="w-8 h-8" />}
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Upload Assessment Sheet</h3>
                                <p className="text-sm text-gray-500 mt-1">Drag & drop or click to browse. Supports .xlsx templates.</p>
                            </div>
                        </div>
                    </div>
                    {error && (
                        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 text-sm border border-red-200">
                            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    <div className="mt-8 text-center">
                        <a
                            href="/sample_template.xlsx"
                            download="CO_Analysis_Template.xlsx"
                            className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium hover:underline p-2 rounded-lg hover:bg-indigo-50 transition-colors"
                        >
                            <FileSpreadsheet className="w-4 h-4" />
                            Download Sample Template
                        </a>
                    </div>
                </div>
            )}

            {/* Step 2: Preview */}
            {step === "preview" && data && (
                <div className="max-w-4xl mx-auto space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            File Parsed Successfully
                        </h3>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <span className="text-gray-500 block mb-1">Total Students</span>
                                <span className={cn("font-semibold text-lg", data.students.length === 0 ? "text-red-600" : "text-gray-900")}>
                                    {data.students.length}
                                </span>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <span className="text-gray-500 block mb-1">Questions Detected</span>
                                <span className={cn("font-semibold text-lg", Object.keys(data.questionConfig).length === 0 ? "text-red-600" : "text-gray-900")}>
                                    {Object.keys(data.questionConfig).length}
                                </span>
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {Object.keys(data.questionConfig).slice(0, 10).map(q => (
                                        <span key={q} className="px-1.5 py-0.5 bg-white border rounded text-xs text-gray-600 uppercase">{q}</span>
                                    ))}
                                    {Object.keys(data.questionConfig).length > 10 && <span className="text-xs text-gray-400">...</span>}
                                </div>
                            </div>
                        </div>

                        {/* Debug View for Empty Results */}
                        {(data.students.length === 0 || Object.keys(data.questionConfig).length === 0) && data.debug && (
                            <div className="mt-8 border rounded-xl overflow-hidden shadow-sm">
                                <div className="bg-red-50 p-4 border-b border-red-100 flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-red-700 font-semibold">
                                        <AlertTriangle className="w-5 h-5" />
                                        Troubleshoot: Raw File Preview
                                    </div>
                                    <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">First 20 rows</span>
                                </div>
                                <div className="overflow-x-auto max-h-[400px]">
                                    <table className="w-full text-xs text-left">
                                        <tbody className="divide-y relative">
                                            {data.debug.map((row, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50">
                                                    <td className="p-2 bg-gray-50 font-mono text-gray-400 border-r w-12 sticky left-0 z-10">{idx + 1}</td>
                                                    {row.map((cell: any, cIdx: number) => (
                                                        <td key={cIdx} className="p-2 border-r min-w-[100px] whitespace-normal">
                                                            {cell !== null && cell !== undefined ? cell.toString() : <span className="text-gray-300 italic">null</span>}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="p-4 bg-gray-50 text-xs text-gray-500">
                                    * Check if "Maximim Mark", "Course Outcome" and "Reg No" rows exist and match common spellings.
                                </div>
                            </div>
                        )}

                        <div className="mt-6">
                            <h4 className="font-semibold text-gray-900 mb-2">Configuration Preview</h4>
                            <div className="overflow-x-auto border rounded-lg">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="p-2 border-b">Question</th>
                                            <th className="p-2 border-b">Max Mark</th>
                                            <th className="p-2 border-b">CO Mapping</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.entries(data.questionConfig).slice(0, 5).map(([q, conf]) => (
                                            <tr key={q} className="border-b last:border-0 hover:bg-gray-50">
                                                <td className="p-2 font-mono uppercase">{q}</td>
                                                <td className="p-2">{conf.maxMark}</td>
                                                <td className="p-2 uppercase badge">{conf.co}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div className="p-2 text-center text-xs text-gray-500 bg-gray-50 border-t">
                                    Showing first 5 columns...
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end gap-3">
                            <button
                                onClick={() => setStep("upload")}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleGenerateReport}
                                className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm"
                            >
                                Generate CO Report
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Step 3: Result */}
            {step === "result" && results && coMaxMarks && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Assessment Report</h2>
                            <p className="text-sm text-gray-500">Analysis generated from {file?.name}</p>
                        </div>
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow hover:bg-green-700 transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            Download Excel Report
                        </button>
                    </div>

                    {results.length === 0 ? (
                        <div className="p-12 text-center bg-white rounded-xl border border-gray-200 shadow-sm">
                            <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-gray-900">No Students Found</h3>
                            <p className="text-gray-500 mt-2 max-w-md mx-auto">
                                We detected the configuration rows but couldn't find any student data.
                                Please ensure your Excel file has rows with "Reg No" and "Student Name" populated below the configuration.
                            </p>
                            <button
                                onClick={() => setStep("upload")}
                                className="mt-6 px-4 py-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg font-medium transition-colors"
                            >
                                Upload a different file
                            </button>
                        </div>
                    ) : (
                        <div className="glass-panel overflow-hidden border border-white/40 shadow-xl">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left border-collapse whitespace-nowrap">
                                    <thead className="bg-indigo-50/50 text-indigo-900 font-semibold">
                                        <tr>
                                            <th className="p-3 border-b border-indigo-100 sticky left-0 bg-white z-10 w-64">Student Details</th>
                                            <th className="p-3 border-b border-indigo-100 text-center w-20">Total</th>
                                            {CO_LABELS.map(co => (
                                                <th key={co} className="p-3 border-b border-indigo-100 text-center uppercase text-xs w-16">{co} %</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-indigo-50">
                                        {/* Max Marks Row */}
                                        <tr className="bg-yellow-50 font-bold border-b-2 border-indigo-100">
                                            <td className="p-3 sticky left-0 bg-yellow-50 z-10">CO MAXIMUM</td>
                                            <td className="p-3 text-center">{Object.values(coMaxMarks).reduce((a, b) => a + b, 0)}</td>
                                            {CO_LABELS.map(co => (
                                                <td key={co} className="p-3 text-center">{coMaxMarks[co]}</td>
                                            ))}
                                        </tr>

                                        {/* Students */}
                                        {results.map((s, idx) => (
                                            <tr key={idx} className="hover:bg-indigo-50/30">
                                                <td className="p-3 sticky left-0 bg-white/80 backdrop-blur-sm z-10 border-r border-indigo-50">
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-gray-900">{s.name}</span>
                                                        <span className="text-xs text-gray-500">{s.regNo}</span>
                                                    </div>
                                                </td>
                                                <td className="p-3 text-center border-r border-indigo-50 font-medium">
                                                    {s.result.total}
                                                </td>
                                                {CO_LABELS.map(co => {
                                                    const pct = s.result.percentage[co];
                                                    return (
                                                        <td key={co} className="p-3 text-center border-r border-indigo-50">
                                                            <span className={cn(
                                                                "px-2 py-0.5 rounded text-xs font-bold",
                                                                pct >= 60 ? "bg-green-100 text-green-700" :
                                                                    pct >= 40 ? "bg-yellow-100 text-yellow-700" :
                                                                        pct > 0 ? "bg-red-100 text-red-700" : "text-gray-300"
                                                            )}>
                                                                {pct > 0 ? `${pct}%` : "-"}
                                                            </span>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
