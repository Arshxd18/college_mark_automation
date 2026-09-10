"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
    Network,
    Save,
    RotateCcw,
    Download,
    CheckCircle,
    AlertCircle,
    Loader2,
    ChevronDown,
    ChevronUp,
    Sparkles,
    Sliders,
    Table as TableIcon,
    Layers,
    FileSpreadsheet,
    BookOpen
} from "lucide-react";
import { COLabel, POAttainmentRow, COMappingDoc, PIMappingSelection } from "@/types";
import { DEFAULT_PO_DEFINITIONS, PODefinition } from "@/lib/poData";
import { DEFAULT_PI_LIST, ExtendedPIEntry, getPIsByPO } from "@/lib/piData";
import {
    getDefaultPIMappingSelection,
    computeRelativePOAttainment
} from "@/lib/coPiMatcher";
import { saveCOMapping, getAttainmentResult } from "@/lib/firestoreService";
import { exportMappingToExcel } from "@/lib/exportMappingExcel";
import { cn } from "@/lib/utils";

const CO_KEYS: COLabel[] = ["co1", "co2", "co3", "co4", "co5", "co6"];
const CO_DISPLAY_LABELS: Record<COLabel, string> = {
    co1: "C304.1",
    co2: "C304.2",
    co3: "C304.3",
    co4: "C304.4",
    co5: "C304.5",
    co6: "C304.6"
};

interface MappingTableProps {
    batchYear: string;
    subjectId: string;
    subjectName?: string;
    department?: string;
    initialDoc?: COMappingDoc | null;
}

export default function MappingTable({
    batchYear,
    subjectId,
    subjectName = "KNOWLEDGE ENGINEERING AND INTELLIGENCE SYSTEM",
    department = "DEPARTMENT OF ARTIFICIAL INTELLIGENCE AND DATA SCIENCE",
    initialDoc
}: MappingTableProps) {
    const [activeView, setActiveView] = useState<"matrix" | "pi_checklist" | "po_config">("matrix");

    // PO and PI state
    const [poDefs, setPoDefs] = useState<PODefinition[]>(DEFAULT_PO_DEFINITIONS);
    const [piList] = useState<ExtendedPIEntry[]>(DEFAULT_PI_LIST);

    // PI Selection state (which PI is "Yes" for which CO)
    const [piSelections, setPiSelections] = useState<PIMappingSelection>(() => {
        if (initialDoc?.piSelections) return initialDoc.piSelections;
        return getDefaultPIMappingSelection(DEFAULT_PI_LIST);
    });

    const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
    const [saveError, setSaveError] = useState("");
    const [exporting, setExporting] = useState(false);

    // Sync if initialDoc changes
    useEffect(() => {
        if (initialDoc?.piSelections) {
            setPiSelections(initialDoc.piSelections);
        }
    }, [initialDoc]);

    // Live Relative Grading Calculation
    const poAttainment: POAttainmentRow[] = useMemo(() => {
        return computeRelativePOAttainment(piSelections, piList, poDefs);
    }, [piSelections, piList, poDefs]);

    // Toggle a PI for a CO
    const handleTogglePI = useCallback((co: COLabel, piId: string) => {
        setPiSelections(prev => ({
            ...prev,
            [co]: {
                ...prev[co],
                [piId]: !prev[co]?.[piId]
            }
        }));
    }, []);

    // Reset to verified default dataset
    const handleReset = () => {
        if (confirm("Reset all PI mappings to default verified syllabus matrix?")) {
            setPiSelections(getDefaultPIMappingSelection(DEFAULT_PI_LIST));
            setPoDefs(DEFAULT_PO_DEFINITIONS);
        }
    };

    // Save to database
    const handleSave = async () => {
        setSaveStatus("saving");
        setSaveError("");
        try {
            const doc: COMappingDoc = {
                batchYear,
                subjectId,
                coDescriptions: initialDoc?.coDescriptions || {
                    co1: "", co2: "", co3: "", co4: "", co5: "", co6: ""
                },
                piSelections,
                matrix: initialDoc?.matrix || ({} as any),
                poAttainment,
                savedAt: new Date().toISOString()
            };
            await saveCOMapping(doc);
            setSaveStatus("success");
            setTimeout(() => setSaveStatus("idle"), 3000);
        } catch (err: any) {
            console.error("Save mapping error:", err);
            setSaveError(err.message || "Failed to save mapping");
            setSaveStatus("error");
            setTimeout(() => setSaveStatus("idle"), 5000);
        }
    };

    // Excel Export
    const handleExport = async () => {
        setExporting(true);
        try {
            await exportMappingToExcel(
                poAttainment,
                piSelections,
                batchYear,
                subjectId,
                subjectName,
                department,
                poDefs,
                piList
            );
        } catch (err) {
            console.error("Excel export error:", err);
            alert("Failed to export Excel workbook.");
        } finally {
            setExporting(false);
        }
    };

    const pisByPO = useMemo(() => getPIsByPO(piList), [piList]);

    return (
        <div className="space-y-6">
            {/* Top Toolbar */}
            <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
                {/* Navigation Pills */}
                <div className="flex bg-gray-100 p-1.5 rounded-xl border border-gray-200">
                    <button
                        onClick={() => setActiveView("matrix")}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer",
                            activeView === "matrix"
                                ? "bg-white text-indigo-700 shadow-xs ring-1 ring-black/5"
                                : "text-gray-600 hover:text-gray-900"
                        )}
                    >
                        <TableIcon className="w-4 h-4 text-indigo-600" />
                        Course Outcome Matrix
                    </button>
                    <button
                        onClick={() => setActiveView("pi_checklist")}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer",
                            activeView === "pi_checklist"
                                ? "bg-white text-indigo-700 shadow-xs ring-1 ring-black/5"
                                : "text-gray-600 hover:text-gray-900"
                        )}
                    >
                        <Layers className="w-4 h-4 text-violet-600" />
                        CO–PO with PI Checklist
                    </button>
                    <button
                        onClick={() => setActiveView("po_config")}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer",
                            activeView === "po_config"
                                ? "bg-white text-indigo-700 shadow-xs ring-1 ring-black/5"
                                : "text-gray-600 hover:text-gray-900"
                        )}
                    >
                        <Sliders className="w-4 h-4 text-emerald-600" />
                        PO & PSO Statements
                    </button>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2.5 flex-wrap">
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition-all cursor-pointer"
                        title="Reset to standard template"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Reset
                    </button>

                    <button
                        onClick={handleExport}
                        disabled={exporting}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 rounded-xl shadow-xs transition-all cursor-pointer"
                    >
                        {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                        {exporting ? "Generating..." : "Export Excel"}
                    </button>

                    <button
                        onClick={handleSave}
                        disabled={saveStatus === "saving"}
                        className={cn(
                            "flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-all cursor-pointer",
                            saveStatus === "success" ? "bg-emerald-600" :
                            saveStatus === "error" ? "bg-red-600" :
                            saveStatus === "saving" ? "bg-indigo-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"
                        )}
                    >
                        {saveStatus === "saving" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
                         saveStatus === "success" ? <CheckCircle className="w-3.5 h-3.5" /> :
                         saveStatus === "error" ? <AlertCircle className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                        {saveStatus === "success" ? "Saved to Supabase!" : saveStatus === "saving" ? "Saving..." : "Save Mapping"}
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {saveStatus === "error" && saveError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <span>Failed to save mapping: {saveError}</span>
                </div>
            )}

            {/* ───────────────────────────────────────────────────────────── */}
            {/* VIEW 1: COURSE OUTCOME ARTICULATION MATRIX (Screenshot Match) */}
            {/* ───────────────────────────────────────────────────────────── */}
            {activeView === "matrix" && (
                <div className="bg-white rounded-2xl border border-gray-200/90 shadow-sm overflow-hidden animate-in fade-in duration-300">
                    {/* Header Banner */}
                    <div className="p-6 text-center border-b border-gray-100 bg-gradient-to-b from-gray-50/80 to-white">
                        <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">{department}</h2>
                        <div className="flex items-center justify-center gap-3 mt-1.5">
                            <span className="px-2.5 py-0.5 rounded-md bg-indigo-100 text-indigo-800 font-mono text-xs font-black">{subjectId}</span>
                            <span className="text-sm font-bold text-gray-800">{subjectName}</span>
                        </div>
                        <h3 className="text-xs font-black text-gray-700 uppercase tracking-widest mt-3">COURSE OUTCOMES</h3>
                        <p className="text-xs text-gray-500 font-medium">Mapping Course Outcomes to Program Outcomes</p>
                    </div>

                    {/* Output Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-center border-collapse">
                            <thead>
                                {/* Attributes Row */}
                                <tr className="bg-[#D9EAD3] text-gray-900 font-bold border-b border-gray-300">
                                    <th className="p-3 border-r border-gray-300 font-black text-left">Attributes</th>
                                    {poDefs.map(p => (
                                        <th key={p.id} className="p-2.5 border-r border-gray-300 font-bold whitespace-nowrap min-w-[70px]">
                                            {p.attribute}
                                        </th>
                                    ))}
                                </tr>
                                {/* PO Codes Row */}
                                <tr className="bg-[#D9D2E9] text-gray-900 font-bold border-b border-gray-300">
                                    <th className="p-2 border-r border-gray-300 font-black text-left">CO&apos;s</th>
                                    {poDefs.map(p => (
                                        <th key={p.id} className="p-2 border-r border-gray-300 font-extrabold text-indigo-950">
                                            {p.shortCode}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 font-bold">
                                {CO_KEYS.map((co, idx) => {
                                    const coLabel = CO_DISPLAY_LABELS[co];

                                    return (
                                        <tr key={co} className="hover:bg-indigo-50/30 transition-colors">
                                            <td className="p-2.5 border-r border-gray-300 bg-[#FCE5CD] text-gray-900 font-black text-left">
                                                {coLabel}
                                            </td>
                                            {poDefs.map(poDef => {
                                                const poRow = poAttainment.find(r => r.poId === String(poDef.id));
                                                const lvl = poRow?.levels?.[co];

                                                return (
                                                    <td key={poDef.id} className="p-2 border-r border-gray-200">
                                                        {lvl !== null && lvl !== undefined ? (
                                                            <span className={cn(
                                                                "inline-flex items-center justify-center w-7 h-7 rounded-md font-black text-xs shadow-2xs",
                                                                lvl === 3 ? "bg-emerald-100 text-emerald-800 border border-emerald-300" :
                                                                lvl === 2 ? "bg-yellow-100 text-yellow-800 border border-yellow-300" :
                                                                "bg-orange-100 text-orange-800 border border-orange-300"
                                                            )}>
                                                                {lvl}
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-400 font-medium">—</span>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}

                                {/* CO's AVG Row */}
                                <tr className="bg-[#F4CCCC] text-gray-950 font-black border-t-2 border-gray-400 text-sm">
                                    <td className="p-3 border-r border-gray-300 text-left font-black">
                                        CO&apos;s AVG
                                    </td>
                                    {poDefs.map(poDef => {
                                        const poRow = poAttainment.find(r => r.poId === String(poDef.id));
                                        const avg = poRow?.level;

                                        return (
                                            <td key={poDef.id} className="p-2 border-r border-gray-300">
                                                {avg !== null && avg !== undefined ? avg.toFixed(1) : "—"}
                                            </td>
                                        );
                                    })}
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Correlation Legend */}
                    <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
                        <div className="inline-flex items-center border border-gray-300 rounded-xl overflow-hidden bg-[#FFF2CC] text-xs font-bold shadow-2xs">
                            <span className="px-3 py-2 bg-[#FFE599] border-r border-gray-300 font-extrabold text-gray-800">
                                MAPPING CORRELATION
                            </span>
                            <span className="px-3 py-2 border-r border-gray-300">LOW: <strong className="text-indigo-800">1</strong></span>
                            <span className="px-3 py-2 border-r border-gray-300">MED: <strong className="text-indigo-800">2</strong></span>
                            <span className="px-3 py-2 border-r border-gray-300">HIGH: <strong className="text-indigo-800">3</strong></span>
                            <span className="px-3 py-2">NO: <strong className="text-gray-500">—</strong></span>
                        </div>

                        <p className="text-xs text-gray-400 italic">
                            * Levels automatically derived from the Performance Indicators (PIs) Checklist under relative grading rubrics.
                        </p>
                    </div>
                </div>
            )}

            {/* ───────────────────────────────────────────────────────────── */}
            {/* VIEW 2: CO-PO WITH PI CHECKLIST (Live Editor)                 */}
            {/* ───────────────────────────────────────────────────────────── */}
            {activeView === "pi_checklist" && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="bg-indigo-50/70 border border-indigo-100 p-4 rounded-2xl flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <Sparkles className="w-5 h-5 text-indigo-600 shrink-0" />
                            <div>
                                <p className="text-xs font-bold text-indigo-900">Interactive Performance Indicators (PI) Matrix</p>
                                <p className="text-[11px] text-indigo-700">Check/toggle &quot;Yes&quot; for each Course Outcome. The counts, percentages, and Level 1–3 grading update instantly.</p>
                            </div>
                        </div>
                    </div>

                    {poDefs.map(poDef => {
                        const pis = pisByPO[poDef.id] || [];
                        if (pis.length === 0) return null;

                        const attRow = poAttainment.find(r => r.poId === String(poDef.id));

                        return (
                            <div key={poDef.id} className="bg-white rounded-2xl border border-gray-200/90 shadow-xs overflow-hidden">
                                {/* PO Header */}
                                <div className="px-6 py-3.5 bg-gradient-to-r from-gray-900 to-indigo-950 text-white flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex items-center gap-2.5">
                                        <span className="px-2.5 py-0.5 rounded-md bg-indigo-500 text-white font-black text-xs">{poDef.code}</span>
                                        <h4 className="font-bold text-sm text-white">{poDef.title}</h4>
                                        <span className="text-xs text-indigo-300 font-medium">({poDef.attribute})</span>
                                    </div>
                                    <span className="text-xs text-indigo-200 font-medium">{pis.length} Indicators</span>
                                </div>

                                {/* Table */}
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs text-left border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50 text-gray-600 text-[11px] uppercase tracking-wider border-b border-gray-200 font-bold">
                                                <th className="p-3 w-1/4">Competency</th>
                                                <th className="p-3 w-5/12">Performance Indicator (PI)</th>
                                                {CO_KEYS.map((co) => (
                                                    <th key={co} className="p-2.5 text-center uppercase font-black text-indigo-700">
                                                        {co}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {pis.map((pi) => (
                                                <tr key={pi.id} className="hover:bg-indigo-50/30 transition-colors">
                                                    <td className="p-3 text-gray-700 font-medium align-top">
                                                        {pi.competency || "—"}
                                                    </td>
                                                    <td className="p-3 text-gray-900 font-semibold align-top">
                                                        <span className="font-mono font-bold text-indigo-600 mr-1.5">{pi.id}</span>
                                                        <span>{pi.descriptor}</span>
                                                    </td>
                                                    {CO_KEYS.map((co) => {
                                                        const isChecked = !!piSelections[co]?.[pi.id];

                                                        return (
                                                            <td key={co} className="p-2 text-center align-middle">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleTogglePI(co, pi.id)}
                                                                    className={cn(
                                                                        "w-10 h-7 rounded-md text-[11px] font-black transition-all cursor-pointer shadow-2xs select-none",
                                                                        isChecked
                                                                            ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                                                            : "bg-gray-100 text-gray-300 hover:bg-gray-200 hover:text-gray-500"
                                                                    )}
                                                                    title={`Click to toggle ${co.toUpperCase()}`}
                                                                >
                                                                    {isChecked ? "Yes" : "—"}
                                                                </button>
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))}

                                            {/* Summary Rows for this PO */}
                                            {/* 1. Count */}
                                            <tr className="bg-gray-50/80 font-bold border-t-2 border-gray-200 text-gray-700">
                                                <td className="p-2.5 font-bold">Total PIs: {pis.length}</td>
                                                <td className="p-2.5 font-bold text-indigo-900">counting the Number of PI attained</td>
                                                {CO_KEYS.map((co) => (
                                                    <td key={co} className="p-2.5 text-center font-black text-gray-900">
                                                        {attRow?.counts?.[co] ?? 0}
                                                    </td>
                                                ))}
                                            </tr>

                                            {/* 2. % Attained */}
                                            <tr className="bg-gray-50/80 font-bold text-gray-700">
                                                <td className="p-2.5"></td>
                                                <td className="p-2.5 font-bold text-indigo-900">% of PI attained</td>
                                                {CO_KEYS.map((co) => (
                                                    <td key={co} className="p-2.5 text-center font-bold text-gray-700">
                                                        {attRow?.percentages?.[co] ? `${attRow.percentages[co]}%` : "0%"}
                                                    </td>
                                                ))}
                                            </tr>

                                            {/* 3. Level */}
                                            <tr className="bg-[#D9EAD3] font-black text-gray-900 text-sm">
                                                <td colSpan={2} className="p-2.5 font-black text-left">
                                                    Level 1: % &le; 59% &nbsp;|&nbsp; Level 2: 60% &le; % &le; 70% &nbsp;|&nbsp; Level 3: % &ge; 71%
                                                </td>
                                                {CO_KEYS.map((co) => {
                                                    const lvl = attRow?.levels?.[co];
                                                    return (
                                                        <td key={co} className="p-2 text-center">
                                                            {lvl !== null && lvl !== undefined ? (
                                                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-white border border-emerald-400 text-emerald-900 font-black shadow-2xs">
                                                                    {lvl}
                                                                </span>
                                                            ) : (
                                                                <span className="text-gray-400 font-normal">—</span>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ───────────────────────────────────────────────────────────── */}
            {/* VIEW 3: PO & PSO MASTER STATEMENTS (Config & View)           */}
            {/* ───────────────────────────────────────────────────────────── */}
            {activeView === "po_config" && (
                <div className="bg-white rounded-2xl border border-gray-200/90 p-6 shadow-sm space-y-6 animate-in fade-in duration-300">
                    <div className="border-b border-gray-100 pb-4">
                        <h3 className="font-bold text-gray-900 text-base">Program Outcomes (POs) & Program Specific Outcomes (PSOs)</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Official AICTE / Department Graduate Attributes & Statements</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {poDefs.map(poDef => (
                            <div key={poDef.id} className="p-4 rounded-xl border border-gray-200/80 bg-gray-50/50 space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-0.5 rounded-md bg-indigo-600 text-white font-black text-xs font-mono">{poDef.code}</span>
                                        <span className="font-bold text-gray-900 text-xs">{poDef.title}</span>
                                    </div>
                                    <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                                        {poDef.attribute}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-600 leading-relaxed">{poDef.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
