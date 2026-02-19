"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    COScores,
    AssessmentDoc,
    AttainmentResult,
    TestType,
} from "@/types";
import {
    getAssessmentsForBatch,
    getAllBatchYears,
    getSubjectsForBatch,
    saveAttainmentResult,
    getAttainmentResult,
} from "@/lib/firestoreService";
import { computeAttainment } from "@/lib/attainmentEngine";
import {
    RefreshCw,
    CheckCircle,
    XCircle,
    Calculator,
    AlertTriangle,
    Loader2,
    CloudUpload,
    TrendingUp,
} from "lucide-react";

const CO_KEYS: (keyof COScores)[] = ["co1", "co2", "co3", "co4", "co5", "co6"];
const TEST_TYPES: TestType[] = ["Internal 1", "Internal 2", "Semester", "Unit Test", "Assignment"];

const LEVEL_COLORS = ["bg-red-100 text-red-700", "bg-orange-100 text-orange-700", "bg-yellow-100 text-yellow-700", "bg-emerald-100 text-emerald-700"];
const LEVEL_LABELS = ["L0", "L1", "L2", "L3"];

function LevelBadge({ level }: { level: number | "N/A" }) {
    if (level === "N/A") {
        return (
            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-400">
                N/A
            </span>
        );
    }
    const l = Math.min(Math.max(Math.round(level), 0), 3);
    return (
        <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold ${LEVEL_COLORS[l]}`}>
            {LEVEL_LABELS[l]}
        </span>
    );
}

function zeroScores(): COScores {
    return { co1: 0, co2: 0, co3: 0, co4: 0, co5: 0, co6: 0 };
}

export default function AttainmentDashboard() {
    const [batchYears, setBatchYears] = useState<string[]>([]);
    const [subjects, setSubjects] = useState<string[]>([]);
    const [selectedBatch, setSelectedBatch] = useState("");
    const [selectedSubject, setSelectedSubject] = useState("");

    const [assessments, setAssessments] = useState<AssessmentDoc[]>([]);
    const [indirect, setIndirect] = useState<COScores>(zeroScores());
    const [result, setResult] = useState<AttainmentResult | null>(null);
    const [missing, setMissing] = useState<string[]>([]);

    const [loadingBatches, setLoadingBatches] = useState(true);
    const [loadingSubjects, setLoadingSubjects] = useState(false);
    const [loadingAssessments, setLoadingAssessments] = useState(false);
    const [computing, setComputing] = useState(false);
    const [saved, setSaved] = useState(false);

    // Load batch years on mount
    useEffect(() => {
        setLoadingBatches(true);
        getAllBatchYears().then((years) => {
            setBatchYears(years);
            if (years.length > 0) setSelectedBatch(years[0]);
        }).finally(() => setLoadingBatches(false));
    }, []);

    // Load subjects when batch changes
    useEffect(() => {
        if (!selectedBatch) return;
        setLoadingSubjects(true);
        setSelectedSubject("");
        setAssessments([]);
        setResult(null);
        getSubjectsForBatch(selectedBatch).then((subs) => {
            setSubjects(subs);
            if (subs.length > 0) setSelectedSubject(subs[0]);
        }).finally(() => setLoadingSubjects(false));
    }, [selectedBatch]);

    // Load assessments + saved result when subject changes
    useEffect(() => {
        if (!selectedBatch || !selectedSubject) return;
        setLoadingAssessments(true);
        setResult(null);
        Promise.all([
            getAssessmentsForBatch(selectedBatch, selectedSubject),
            getAttainmentResult(selectedBatch, selectedSubject),
        ]).then(([docs, savedResult]) => {
            setAssessments(docs);
            if (savedResult) {
                setResult(savedResult);
                setIndirect(savedResult.indirectAttainment);
            } else {
                setIndirect(zeroScores());
            }
        }).finally(() => setLoadingAssessments(false));
    }, [selectedBatch, selectedSubject]);

    const handleCompute = async () => {
        setComputing(true);
        setSaved(false);
        try {
            const { internalAttainment, directAttainment, finalAttainment, levels, missing: miss } = computeAttainment(assessments, indirect);
            setMissing(miss);

            const attainmentResult: AttainmentResult = {
                batchYear: selectedBatch,
                subjectId: selectedSubject,
                internalAttainment,
                directAttainment,
                indirectAttainment: indirect,
                finalAttainment,
                levels,
                computedAt: new Date().toISOString(),
            };

            setResult(attainmentResult);
            await saveAttainmentResult(attainmentResult);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } finally {
            setComputing(false);
        }
    };

    const testTypeStatus = (tt: TestType) => assessments.some(a => a.testType === tt);

    if (loadingBatches) {
        return (
            <div className="flex items-center justify-center py-20 text-gray-500">
                <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading batches...
            </div>
        );
    }

    if (batchYears.length === 0) {
        return (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center">
                <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-3" />
                <h3 className="font-semibold text-amber-800">No Data Found</h3>
                <p className="text-sm text-amber-600 mt-1">Please save some assessments to Firebase first using the Dashboard.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">

            {/* Selectors */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-violet-600" /> CO Attainment Calculator
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Batch Year</label>
                        <select
                            value={selectedBatch}
                            onChange={(e) => setSelectedBatch(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-violet-500 focus:outline-none"
                        >
                            {batchYears.map(y => <option key={y}>{y}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Subject ID</label>
                        {loadingSubjects ? (
                            <div className="flex items-center gap-2 text-gray-400 text-sm py-2"><Loader2 className="w-4 h-4 animate-spin" />Loading...</div>
                        ) : (
                            <select
                                value={selectedSubject}
                                onChange={(e) => setSelectedSubject(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-violet-500 focus:outline-none"
                            >
                                {subjects.map(s => <option key={s}>{s}</option>)}
                            </select>
                        )}
                    </div>
                </div>
            </div>

            {/* Assessment File Status */}
            {selectedSubject && !loadingAssessments && (
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">Uploaded Assessments</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                        {TEST_TYPES.map(tt => {
                            const present = testTypeStatus(tt);
                            return (
                                <div key={tt} className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-semibold ${present ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-gray-50 border-gray-200 text-gray-400"}`}>
                                    {present
                                        ? <CheckCircle className="w-5 h-5 text-emerald-500" />
                                        : <XCircle className="w-5 h-5 text-gray-300" />}
                                    {tt}
                                </div>
                            );
                        })}
                    </div>

                    {/* Missing warnings */}
                    {missing.length > 0 && (
                        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <p className="text-xs font-semibold text-amber-700 flex items-center gap-1.5">
                                <AlertTriangle className="w-4 h-4" /> Missing data (computed with 0):
                            </p>
                            <ul className="mt-1 list-disc list-inside text-xs text-amber-600">
                                {missing.map(m => <li key={m}>{m}</li>)}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {/* Indirect Attainment Input */}
            {selectedSubject && !loadingAssessments && (
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-1">Indirect Attainment</h3>
                    <p className="text-xs text-gray-500 mb-4">Enter values from Course-End Survey (e.g. 2.77, 2.89). Range: 0–3</p>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
                        {CO_KEYS.map(co => (
                            <div key={co}>
                                <label className="block text-xs font-bold text-gray-600 text-center mb-1 uppercase">{co}</label>
                                <input
                                    type="number"
                                    min={0} max={3} step={0.01}
                                    value={indirect[co]}
                                    onChange={(e) => setIndirect(prev => ({ ...prev, [co]: parseFloat(e.target.value) || 0 }))}
                                    className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm text-center focus:ring-2 focus:ring-violet-500 focus:outline-none"
                                />
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end mt-4 gap-3">
                        <button
                            onClick={handleCompute}
                            disabled={computing || !selectedSubject}
                            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm"
                        >
                            {computing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
                            {computing ? "Computing..." : "Calculate & Save"}
                        </button>
                        {saved && (
                            <span className="flex items-center gap-1 text-sm text-emerald-600 font-medium">
                                <CheckCircle className="w-4 h-4" /> Saved!
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Results Table */}
            {result && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 bg-gradient-to-r from-violet-600 to-indigo-600">
                        <h3 className="text-white font-bold">Final CO Attainment Results</h3>
                        <p className="text-violet-200 text-xs mt-0.5">
                            Computed: {new Date(result.computedAt).toLocaleString()} • Batch: {result.batchYear} • Subject: {result.subjectId}
                        </p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Metric</th>
                                    {CO_KEYS.map(co => (
                                        <th key={co} className="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-center">{co.toUpperCase()}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                <tr>
                                    <td className="px-4 py-3 text-xs font-semibold text-gray-600">Internal Attainment<br /><span className="font-normal text-gray-400">CO×60% + UT×15% + Asgn×25%</span></td>
                                    {CO_KEYS.map(co => <td key={co} className="px-4 py-3 text-center font-mono text-gray-800">{result.internalAttainment[co].toFixed(2)}</td>)}
                                </tr>
                                <tr className="bg-blue-50/30">
                                    <td className="px-4 py-3 text-xs font-semibold text-gray-600">Direct Attainment<br /><span className="font-normal text-gray-400">Sem×60% + Internal×40%</span></td>
                                    {CO_KEYS.map(co => <td key={co} className="px-4 py-3 text-center font-mono text-indigo-700 font-semibold">{result.directAttainment[co].toFixed(2)}</td>)}
                                </tr>
                                <tr>
                                    <td className="px-4 py-3 text-xs font-semibold text-gray-600">Indirect Attainment<br /><span className="font-normal text-gray-400">Course-End Survey</span></td>
                                    {CO_KEYS.map(co => <td key={co} className="px-4 py-3 text-center font-mono text-gray-800">{result.indirectAttainment[co].toFixed(2)}</td>)}
                                </tr>
                                <tr className="bg-violet-50/50">
                                    <td className="px-4 py-3 text-xs font-bold text-violet-700">Final Attainment<br /><span className="font-normal text-gray-400">Direct×90% + Indirect×10%</span></td>
                                    {CO_KEYS.map(co => <td key={co} className="px-4 py-3 text-center font-mono text-violet-800 font-bold text-base">{result.finalAttainment[co].toFixed(3)}</td>)}
                                </tr>
                                <tr>
                                    <td className="px-4 py-3 text-xs font-semibold text-gray-600">Attainment Level</td>
                                    {CO_KEYS.map(co => (
                                        <td key={co} className="px-4 py-3 text-center">
                                            <LevelBadge level={result.levels[co]} />
                                        </td>
                                    ))}
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* CO Attainment Gap */}
                    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">CO Attainment Gap (Target: 2.0)</h4>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                            {CO_KEYS.map(co => {
                                const gap = result.finalAttainment[co] - 2.0;
                                const positive = gap >= 0;
                                return (
                                    <div key={co} className={`p-3 rounded-lg text-center ${positive ? "bg-emerald-50 border border-emerald-200" : "bg-red-50 border border-red-200"}`}>
                                        <div className="text-xs font-bold text-gray-500 uppercase mb-1">{co}</div>
                                        <div className={`text-sm font-bold ${positive ? "text-emerald-700" : "text-red-700"}`}>
                                            {positive ? "+" : ""}{gap.toFixed(3)}
                                        </div>
                                        <div className={`text-[10px] mt-0.5 ${positive ? "text-emerald-600" : "text-red-600"}`}>
                                            {positive ? "✓ Achieved" : "✗ Gap"}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
