"use client";

import React, { useState, useEffect } from "react";
import AuthGuard from "@/components/AuthGuard";
import Header from "@/components/Header";
import MappingTable from "@/components/MappingTable";
import { getAllBatchYears, getSubjectsForBatch, getCOMapping } from "@/lib/firestoreService";
import { COMappingDoc } from "@/types";
import { Network, Loader2, RefreshCw } from "lucide-react";

function MappingPageInner() {
    const [batchYears, setBatchYears] = useState<string[]>([]);
    const [subjects, setSubjects] = useState<string[]>([]);
    const [selectedBatch, setSelectedBatch] = useState("");
    const [selectedSubject, setSelectedSubject] = useState("");
    const [existingDoc, setExistingDoc] = useState<COMappingDoc | null>(null);
    const [loadingBatches, setLoadingBatches] = useState(true);
    const [loadingSubjects, setLoadingSubjects] = useState(false);
    const [loadingMapping, setLoadingMapping] = useState(false);

    // Load batch years on mount
    useEffect(() => {
        getAllBatchYears()
            .then(setBatchYears)
            .catch(console.error)
            .finally(() => setLoadingBatches(false));
    }, []);

    // Load subjects when batch changes
    useEffect(() => {
        if (!selectedBatch) { setSubjects([]); setSelectedSubject(""); return; }
        setLoadingSubjects(true);
        getSubjectsForBatch(selectedBatch)
            .then(subs => { setSubjects(subs); setSelectedSubject(subs[0] ?? ""); })
            .catch(console.error)
            .finally(() => setLoadingSubjects(false));
    }, [selectedBatch]);

    // Load existing mapping when both batch + subject are selected
    useEffect(() => {
        if (!selectedBatch || !selectedSubject) { setExistingDoc(null); return; }
        setLoadingMapping(true);
        getCOMapping(selectedBatch, selectedSubject)
            .then(setExistingDoc)
            .catch(console.error)
            .finally(() => setLoadingMapping(false));
    }, [selectedBatch, selectedSubject]);

    const ready = selectedBatch && selectedSubject && !loadingMapping;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/20">
            <Header />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

                {/* ── Page heading ─────────────────────────────── */}
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-violet-100 rounded-2xl">
                        <Network className="w-7 h-7 text-violet-700" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-extrabold text-gray-900">CO–PO–PSO Mapping</h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            Hybrid NLP engine — Jaccard + Cosine TF-IDF — to match Course Outcomes against Programme Indicators
                        </p>
                    </div>
                </div>

                {/* ── Batch / Subject selector ──────────────────── */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                    <h2 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">Select Batch & Subject</h2>
                    <div className="flex flex-wrap gap-4 items-end">
                        {/* Batch Year */}
                        <div className="space-y-1 min-w-[200px]">
                            <label className="text-xs font-medium text-gray-500">Batch Year</label>
                            {loadingBatches ? (
                                <div className="flex items-center gap-2 text-sm text-gray-400 h-10">
                                    <Loader2 className="w-4 h-4 animate-spin" /> Loading...
                                </div>
                            ) : batchYears.length === 0 ? (
                                <p className="text-xs text-red-500">No batches found. Save an assessment first.</p>
                            ) : (
                                <select
                                    value={selectedBatch}
                                    onChange={e => setSelectedBatch(e.target.value)}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                >
                                    <option value="">— Select —</option>
                                    {batchYears.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            )}
                        </div>

                        {/* Subject ID */}
                        <div className="space-y-1 min-w-[200px]">
                            <label className="text-xs font-medium text-gray-500">Subject ID</label>
                            {loadingSubjects ? (
                                <div className="flex items-center gap-2 text-sm text-gray-400 h-10">
                                    <Loader2 className="w-4 h-4 animate-spin" /> Loading...
                                </div>
                            ) : (
                                <select
                                    value={selectedSubject}
                                    onChange={e => setSelectedSubject(e.target.value)}
                                    disabled={!selectedBatch || subjects.length === 0}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-40"
                                >
                                    <option value="">— Select —</option>
                                    {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            )}
                        </div>

                        {/* Existing mapping badge */}
                        {ready && (
                            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium ${existingDoc ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-gray-50 text-gray-500 border border-gray-200"}`}>
                                {existingDoc ? "✓ Existing mapping loaded" : "No saved mapping — start fresh"}
                            </div>
                        )}

                        {loadingMapping && (
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                <Loader2 className="w-4 h-4 animate-spin" /> Loading mapping...
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Mapping table ─────────────────────────────── */}
                {ready ? (
                    <MappingTable
                        key={`${selectedBatch}__${selectedSubject}`}
                        batchYear={selectedBatch}
                        subjectId={selectedSubject}
                        initialDoc={existingDoc}
                    />
                ) : (
                    !loadingBatches && (
                        <div className="text-center py-20 text-gray-300">
                            <Network className="w-16 h-16 mx-auto mb-4 opacity-30" />
                            <p className="text-gray-400 font-medium">Select a batch and subject to begin mapping</p>
                        </div>
                    )
                )}
            </main>
        </div>
    );
}

export default function MappingPage() {
    return (
        <AuthGuard>
            <MappingPageInner />
        </AuthGuard>
    );
}
