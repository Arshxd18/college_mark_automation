"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
    Save,
    RotateCcw,
    Download,
    CheckCircle,
    AlertCircle,
    Loader2,
    Sparkles,
    Sliders,
    Table as TableIcon,
    Layers
} from "lucide-react";
import { COLabel, POAttainmentRow, COMappingDoc, PIMappingSelection } from "@/types";
import { DEFAULT_PO_DEFINITIONS, PODefinition } from "@/lib/poData";
import { DEFAULT_PI_LIST, ExtendedPIEntry, getPIsByPO, getCompetencyForPI, getJustificationForPI } from "@/lib/piData";
import {
    getDefaultPIMappingSelection,
    computeRelativePOAttainment
} from "@/lib/coPiMatcher";
import { saveCOMapping } from "@/lib/supabaseService";
import { exportMappingToExcel } from "@/lib/exportMappingExcel";
import { cn } from "@/lib/utils";

const CO_KEYS: COLabel[] = ["co1", "co2", "co3", "co4", "co5", "co6"];

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
    const [activeView, setActiveView] = useState<"pi_checklist" | "matrix" | "po_config">("pi_checklist");

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
                subjectName,
                department,
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

    // Format row labels (e.g. C304.1)
    const coRowLabels = useMemo(() => {
        const prefix = subjectId ? subjectId.replace(/[^a-zA-Z0-9]/g, "") : "C101";
        return {
            co1: `${prefix}.1`,
            co2: `${prefix}.2`,
            co3: `${prefix}.3`,
            co4: `${prefix}.4`,
            co5: `${prefix}.5`,
            co6: `${prefix}.6`,
        };
    }, [subjectId]);

    return (
        <div className="space-y-6">
            {/* Top Toolbar */}
            <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
                {/* Navigation Pills */}
                <div className="flex bg-gray-100/90 p-1.5 rounded-xl border border-gray-200">
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
                        onClick={() => setActiveView("po_config")}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer",
                            activeView === "po_config"
                                ? "bg-white text-indigo-700 shadow-xs ring-1 ring-black/5"
                                : "text-gray-600 hover:text-gray-900"
                        )}
                    >
                        <Sliders className="w-4 h-4 text-emerald-600" />
                        PO &amp; PSO Statements
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
                        Reset Template
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
                        {saveStatus === "success" ? "Saved!" : saveStatus === "saving" ? "Saving..." : "Save Mapping"}
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
            {/* VIEW 1: CO–PO WITH PI CHECKLIST (Matches Attached Image)      */}
            {/* ───────────────────────────────────────────────────────────── */}
            {activeView === "pi_checklist" && (
                <div className="space-y-4 animate-in fade-in duration-300">
                    {/* Live Info Banner */}
                    <div className="bg-indigo-50/80 border border-indigo-100 p-3.5 rounded-xl flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2.5">
                           
                            <div>
                                <span className="font-bold text-indigo-950">Interactive Performance Indicators (PI) Matrix:</span>
                                <span className="text-indigo-800 ml-1">Click any cell to toggle <strong className="font-black text-emerald-800">Yes</strong> for each Course Outcome. Attainment counts, percentages, and Level 1–3 grading calculate in real-time.</span>
                            </div>
                        </div>
                    </div>

                    {/* Master Unified Excel-Styled Table Container */}
                    <div className="overflow-x-auto rounded-xl border border-gray-400 shadow-md bg-white">
                        <table className="w-full text-xs border-collapse border border-gray-400">
                            <thead>
                                {/* Top Subject Banner Row (e.g. 23AD1504 | KNOWLEDGE ENGINEERING AND INTELLIGENCE SYSTEM) */}
                                <tr className="border-b border-gray-400 text-sm font-black text-gray-900">
                                    <th
                                        colSpan={2}
                                        className="bg-[#CFE2F3] text-center py-2 px-3 border-r border-gray-400 uppercase tracking-wide font-extrabold"
                                    >
                                        {subjectId || "23AD1504"}
                                    </th>
                                    <th
                                        colSpan={8}
                                        className="bg-[#FFF2CC] text-center py-2 px-4 uppercase tracking-wider font-extrabold"
                                    >
                                        {subjectName || "KNOWLEDGE ENGINEERING AND INTELLIGENCE SYSTEM"}
                                    </th>
                                </tr>

                                {/* Main Column Headers Row */}
                                <tr className="border-b border-gray-400 font-extrabold text-gray-950 text-center">
                                    <th className="bg-[#FFDE59] py-2 px-3 w-[150px] min-w-[130px] border-r border-gray-400 text-left">
                                        POs
                                    </th>
                                    <th className="bg-[#B4C6E7] py-2 px-3 w-[260px] min-w-[220px] border-r border-gray-400 text-left">
                                        Competency
                                    </th>
                                    <th className="bg-[#D9EAD3] py-2 px-3 min-w-[320px] border-r border-gray-400 text-left">
                                        Performance Indicator
                                    </th>
                                    {CO_KEYS.map((co) => (
                                        <th
                                            key={co}
                                            className="bg-[#D9EAD3] py-2 px-2.5 w-[55px] min-w-[50px] border-r border-gray-400 uppercase text-center font-black"
                                        >
                                            {co.toUpperCase()}
                                        </th>
                                    ))}
                                    <th className="bg-[#E6D0DE] py-2 px-3 min-w-[240px] border-r border-gray-400 text-left font-extrabold text-gray-950">
                                        Justification
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {poDefs.map((poDef) => {
                                    const pis = pisByPO[poDef.id] || [];
                                    if (pis.length === 0) return null;

                                    const attRow = poAttainment.find(r => r.poId === String(poDef.id));

                                    // Group PIs by competency
                                    const competencyGroups: { competency: string; pis: ExtendedPIEntry[] }[] = [];
                                    pis.forEach((pi) => {
                                        const compText = getCompetencyForPI(pi);
                                        const existing = competencyGroups.find(g => g.competency === compText);
                                        if (existing) {
                                            existing.pis.push(pi);
                                        } else {
                                            competencyGroups.push({ competency: compText, pis: [pi] });
                                        }
                                    });

                                    return (
                                        <React.Fragment key={poDef.id}>
                                            {/* PO Block Rows */}
                                            {competencyGroups.map((group, gIdx) => (
                                                <React.Fragment key={`${poDef.id}_comp_${gIdx}`}>
                                                    {group.pis.map((pi, piIdx) => {
                                                        const isFirstInPO = gIdx === 0 && piIdx === 0;
                                                        const isFirstInComp = piIdx === 0;

                                                        return (
                                                            <tr
                                                                key={pi.id}
                                                                className="border-b border-gray-300 hover:bg-emerald-50/30 transition-colors"
                                                            >
                                                                {/* PO Side Cell (Spanning top of the PO block) */}
                                                                {isFirstInPO && (
                                                                    <td
                                                                        rowSpan={pis.length}
                                                                        className="bg-[#FFF2CC] p-3 border-r border-gray-400 font-extrabold text-gray-950 align-top text-left text-xs leading-relaxed select-none"
                                                                    >
                                                                        <div className="sticky top-4">
                                                                            <span className="font-black text-sm block mb-1">
                                                                                {poDef.code}
                                                                            </span>
                                                                            <span className="text-[11px] font-bold text-gray-800">
                                                                                {poDef.title}
                                                                            </span>
                                                                        </div>
                                                                    </td>
                                                                )}

                                                                {/* Competency Cell (Spanning its group PIs) */}
                                                                {isFirstInComp && (
                                                                    <td
                                                                        rowSpan={group.pis.length}
                                                                        className="bg-[#CFE2F3] p-2.5 border-r border-gray-400 font-medium text-gray-900 align-top text-[11px] leading-tight"
                                                                    >
                                                                        {group.competency}
                                                                    </td>
                                                                )}

                                                                {/* Performance Indicator Descriptor Cell */}
                                                                <td className="bg-[#E2EFDA] p-2 border-r border-gray-400 text-gray-900 text-[11px] align-middle leading-snug">
                                                                    <span className="font-mono font-bold mr-1.5 text-gray-950">
                                                                        {pi.id}
                                                                    </span>
                                                                    <span>{pi.descriptor}</span>
                                                                </td>

                                                                {/* CO1 to CO6 Interactive Toggle Cells */}
                                                                {CO_KEYS.map((co) => {
                                                                    const isChecked = !!piSelections[co]?.[pi.id];

                                                                    return (
                                                                        <td
                                                                            key={co}
                                                                            onClick={() => handleTogglePI(co, pi.id)}
                                                                            className={cn(
                                                                                "p-1 text-center align-middle border-r border-gray-400 cursor-pointer select-none transition-colors",
                                                                                isChecked
                                                                                    ? "bg-[#D9EAD3] hover:bg-[#C6E0B4]"
                                                                                    : "bg-white hover:bg-gray-100"
                                                                            )}
                                                                            title={`Click to toggle ${co.toUpperCase()} for ${pi.id}`}
                                                                        >
                                                                            {isChecked ? (
                                                                                <span className="font-black text-gray-950 text-xs">
                                                                                    Yes
                                                                                </span>
                                                                            ) : (
                                                                                <span className="text-transparent font-normal">
                                                                                    —
                                                                                </span>
                                                                            )}
                                                                        </td>
                                                                    );
                                                                })}

                                                                {/* Justification Cell */}
                                                                <td className="bg-[#F3E8F0] p-2 border-r border-gray-400 text-[10.5px] text-gray-700 align-middle leading-snug min-w-[240px]">
                                                                    <span className="block text-gray-500 font-bold text-[9px] uppercase tracking-wider mb-0.5">Why mapped?</span>
                                                                    {getJustificationForPI(pi)}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </React.Fragment>
                                            ))}

                                            {/* PO Indicator Count Row under Competencies (e.g. 5, 13, 13) */}
                                            <tr className="border-b border-gray-400 text-[11px] font-black">
                                                <td colSpan={2} className="bg-[#F8CBAD] p-1.5 text-center border-r border-gray-400 font-extrabold text-gray-950">
                                                    {pis.length}
                                                </td>
                                                <td className="bg-[#F8CBAD] p-1.5 border-r border-gray-400 text-gray-900 font-bold">
                                                    Total Indicators for {poDef.code}
                                                </td>
                                                {CO_KEYS.map((co) => (
                                                    <td key={co} className="bg-[#F8CBAD] p-1.5 border-r border-gray-400 text-center font-black text-gray-950">
                                                        —
                                                    </td>
                                                ))}
                                                <td className="bg-[#F8CBAD] p-1.5 border-r border-gray-400" />
                                            </tr>

                                            {/* Summary Row 1: Counting the Number of PI attained */}
                                            <tr className="border-b border-gray-400 text-[11px] font-bold">
                                                <td colSpan={2} className="bg-[#FCE5CD] p-1.5 border-r border-gray-400 text-gray-900"></td>
                                                <td className="bg-[#FCE5CD] p-1.5 border-r border-gray-400 text-gray-950 font-bold italic">
                                                    counting the Number of PI attained
                                                </td>
                                                {CO_KEYS.map((co) => (
                                                    <td
                                                        key={co}
                                                        className="bg-[#FCE5CD] p-1.5 text-center font-black text-gray-950 border-r border-gray-400"
                                                    >
                                                        {attRow?.counts?.[co] ?? 0}
                                                    </td>
                                                ))}
                                                <td className="bg-[#FCE5CD] p-1.5 border-r border-gray-400" />
                                            </tr>

                                            {/* Summary Row 2: % of PI attained */}
                                            <tr className="border-b border-gray-400 text-[11px] font-bold">
                                                <td colSpan={2} className="bg-[#FCE5CD] p-1.5 border-r border-gray-400 text-gray-900"></td>
                                                <td className="bg-[#FCE5CD] p-1.5 border-r border-gray-400 text-gray-950 font-bold italic">
                                                    % of PI attained
                                                </td>
                                                {CO_KEYS.map((co) => {
                                                    const pct = attRow?.percentages?.[co] ?? 0;
                                                    return (
                                                        <td
                                                            key={co}
                                                            className="bg-[#FCE5CD] p-1.5 text-center font-black text-gray-950 border-r border-gray-400"
                                                        >
                                                            {pct > 0 ? (Number.isInteger(pct) ? pct : pct.toFixed(2)) : 0}
                                                        </td>
                                                    );
                                                })}
                                                <td className="bg-[#FCE5CD] p-1.5 border-r border-gray-400" />
                                            </tr>

                                            {/* Summary Row 3: Cyan Level Rule Banner + Level Label */}
                                            <tr className="border-b border-gray-400 bg-[#00B0F0] text-gray-950 font-black text-[11px]">
                                                <td
                                                    colSpan={3}
                                                    className="p-1.5 border-r border-gray-400 text-center font-bold tracking-wide"
                                                >
                                                    Level 1: % of PIs&lt;=59% Level 2: 60&lt;=% of PI&lt;=70 Level 3:% of PI&gt;=71
                                                </td>
                                                <td
                                                    colSpan={6}
                                                    className="p-1.5 text-center font-black uppercase tracking-wider"
                                                >
                                                    Level
                                                </td>
                                                <td className="p-1.5 border-l border-gray-400" />
                                            </tr>

                                            {/* Summary Row 4: Cyan Level Output Row */}
                                            <tr className="border-b-2 border-gray-600 bg-[#00B0F0] text-gray-950 font-black text-sm">
                                                <td colSpan={3} className="p-1 border-r border-gray-400"></td>
                                                {CO_KEYS.map((co) => {
                                                    const lvl = attRow?.levels?.[co];
                                                    return (
                                                        <td
                                                            key={co}
                                                            className="p-1 text-center border-r border-gray-400 font-extrabold text-gray-950"
                                                        >
                                                            {lvl !== null && lvl !== undefined ? lvl : ""}
                                                        </td>
                                                    );
                                                })}
                                                <td className="p-1 border-l border-gray-400" />
                                            </tr>
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ───────────────────────────────────────────────────────────── */}
            {/* VIEW 2: COURSE OUTCOME ARTICULATION MATRIX (Summary Table)    */}
            {/* ───────────────────────────────────────────────────────────── */}
            {activeView === "matrix" && (
                <div className="bg-white rounded-2xl border border-gray-300 shadow-sm overflow-hidden animate-in fade-in duration-300">
                    {/* Header Banner */}
                    <div className="p-6 text-center border-b border-gray-200 bg-gradient-to-b from-gray-50/80 to-white">
                        <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">{department}</h2>
                        <div className="flex items-center justify-center gap-3 mt-1.5">
                            <span className="px-2.5 py-0.5 rounded-md bg-indigo-100 text-indigo-800 font-mono text-xs font-black">{subjectId}</span>
                            <span className="text-sm font-bold text-gray-800">{subjectName}</span>
                        </div>
                        <h3 className="text-xs font-black text-gray-700 uppercase tracking-widest mt-3">COURSE OUTCOMES</h3>
                        <p className="text-xs text-gray-500 font-medium">Mapping Course Outcomes to Program Outcomes (Derived from Relative PI Attainment)</p>
                    </div>

                    {/* Output Table — fills the card width, no horizontal scroll */}
                    <div className="w-full">
                        <table className="w-full text-[11px] text-center border-collapse border border-gray-300 table-fixed">
                            <colgroup>
                                {/* CO label column — fixed width */}
                                <col style={{ width: "68px" }} />
                                {/* One equal-width column per PO/PSO */}
                                {poDefs.map(p => (
                                    <col key={p.id} />
                                ))}
                            </colgroup>
                            <thead>
                                {/* Attributes Row — rotated text to save horizontal space */}
                                <tr className="bg-[#D9EAD3] text-gray-800 font-bold border-b border-gray-300">
                                    <th className="p-1.5 border-r border-gray-300 font-black text-left text-[10px] align-bottom">Attributes</th>
                                    {poDefs.map(p => (
                                        <th
                                            key={p.id}
                                            className="border-r border-gray-300 font-semibold text-[9px] align-bottom pb-1 px-0.5"
                                            style={{ height: "72px" }}
                                        >
                                            <div
                                                className="flex items-end justify-center"
                                                style={{ height: "68px" }}
                                            >
                                                <span
                                                    className="block whitespace-nowrap font-bold text-gray-700"
                                                    style={{
                                                        writingMode: "vertical-rl",
                                                        transform: "rotate(180deg)",
                                                        fontSize: "9px",
                                                        lineHeight: 1.1,
                                                        maxHeight: "66px",
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis"
                                                    }}
                                                >
                                                    {p.attribute}
                                                </span>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                                {/* PO Codes Row */}
                                <tr className="bg-[#D9D2E9] text-gray-900 font-bold border-b border-gray-300">
                                    <th className="p-1.5 border-r border-gray-300 font-black text-left text-[10px]">CO&apos;s</th>
                                    {poDefs.map(p => (
                                        <th key={p.id} className="py-1 px-0.5 border-r border-gray-300 font-extrabold text-indigo-950 text-[10px]">
                                            {p.shortCode}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 font-bold">
                                {CO_KEYS.map((co) => {
                                    const coLabel = coRowLabels[co];

                                    return (
                                        <tr key={co} className="hover:bg-indigo-50/30 transition-colors divide-x divide-gray-200">
                                            <td className="p-1.5 bg-[#FCE5CD] text-gray-900 font-black text-left font-mono text-[10px]">
                                                {coLabel}
                                            </td>
                                            {poDefs.map(poDef => {
                                                const poRow = poAttainment.find(r => r.poId === String(poDef.id));
                                                const lvl = poRow?.levels?.[co];

                                                return (
                                                    <td key={poDef.id} className="p-0.5 text-center">
                                                        {lvl !== null && lvl !== undefined ? (
                                                            <span className={cn(
                                                                "inline-flex items-center justify-center w-5 h-5 rounded font-black text-[10px] shadow-2xs mx-auto",
                                                                lvl === 3 ? "bg-emerald-100 text-emerald-800 border border-emerald-300" :
                                                                lvl === 2 ? "bg-yellow-100 text-yellow-800 border border-yellow-300" :
                                                                "bg-orange-100 text-orange-800 border border-orange-300"
                                                            )}>
                                                                {lvl}
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-300 font-medium text-[10px]">—</span>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}

                                {/* CO's AVG Row */}
                                <tr className="bg-[#F4CCCC] text-gray-950 font-black border-t-2 border-gray-400 divide-x divide-gray-300">
                                    <td className="p-1.5 text-left font-black font-mono text-[10px]">
                                        CO&apos;s AVG
                                    </td>
                                    {poDefs.map(poDef => {
                                        const poRow = poAttainment.find(r => r.poId === String(poDef.id));
                                        const avg = poRow?.level;

                                        return (
                                            <td key={poDef.id} className="p-0.5 font-mono font-black text-[10px]">
                                                {avg !== null && avg !== undefined ? avg.toFixed(1) : "—"}
                                            </td>
                                        );
                                    })}
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Correlation Legend */}
                    <div className="p-5 bg-gray-50/50 border-t border-gray-200 flex flex-wrap items-center justify-between gap-4">
                        <div className="inline-flex items-center border border-gray-300 rounded-xl overflow-hidden bg-[#FFF2CC] text-xs font-bold shadow-2xs">
                            <span className="px-3 py-2 bg-[#FFE599] border-r border-gray-300 font-extrabold text-gray-800">
                                MAPPING CORRELATION
                            </span>
                            <span className="px-3 py-2 border-r border-gray-300">LOW: <strong className="text-indigo-800">1</strong></span>
                            <span className="px-3 py-2 border-r border-gray-300">MED: <strong className="text-indigo-800">2</strong></span>
                            <span className="px-3 py-2 border-r border-gray-300">HIGH: <strong className="text-indigo-800">3</strong></span>
                            <span className="px-3 py-2">NO: <strong className="text-gray-500">—</strong></span>
                        </div>

                        <p className="text-xs text-gray-500 italic">
                            * Levels automatically calculated from the Performance Indicators (PI) Checklist with relative grading rubrics.
                        </p>
                    </div>
                </div>
            )}

            {/* ───────────────────────────────────────────────────────────── */}
            {/* VIEW 3: PO & PSO MASTER STATEMENTS (Config & View)           */}
            {/* ───────────────────────────────────────────────────────────── */}
            {activeView === "po_config" && (
                <div className="bg-white rounded-2xl border border-gray-200/90 p-6 shadow-sm space-y-6 animate-in fade-in duration-300">
                    <div className="border-b border-gray-100 pb-4">
                        <h3 className="font-bold text-gray-900 text-base">Program Outcomes (POs) &amp; Program Specific Outcomes (PSOs)</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Official NBA / Department Graduate Attributes &amp; Descriptors</p>
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
