"use client";

import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Brain, Save, RotateCcw, ChevronDown, ChevronUp, Loader2, CheckCircle, AlertTriangle, Info, Download } from "lucide-react";
import { COLabel, MappingCell, MappingDecision, PIEntry, POAttainmentRow, COMappingDoc } from "@/types";
import { matchAllCOs, computePOAttainment, toggleCell, resetOverrides } from "@/lib/coPiMatcher";
import { getCOWarning } from "@/lib/textProcessor";
import { DEFAULT_PI_LIST, getPIsByPO } from "@/lib/piData";
import { saveCOMapping, getAttainmentResult } from "@/lib/firestoreService";
import { exportMappingToExcel } from "@/lib/exportMappingExcel";
import { cn } from "@/lib/utils";

const CO_KEYS: COLabel[] = ["co1", "co2", "co3", "co4", "co5", "co6"];

const CO_LABELS: Record<COLabel, string> = {
    co1: "CO1", co2: "CO2", co3: "CO3", co4: "CO4", co5: "CO5", co6: "CO6",
};

const LEVEL_BADGE: Record<number, string> = {
    0: "bg-red-100 text-red-700 border border-red-200",
    1: "bg-orange-100 text-orange-700 border border-orange-200",
    2: "bg-yellow-100 text-yellow-700 border border-yellow-200",
    3: "bg-emerald-100 text-emerald-700 border border-emerald-200",
};

interface MappingTableProps {
    batchYear: string;
    subjectId: string;
    initialDoc?: COMappingDoc | null;
}

// ── Cell component with confidence tooltip ─────────────────────
function MappingCellUI({
    cell,
    onClick,
    onHover,
    onAcceptAI
}: {
    cell: MappingCell;
    onClick: () => void;
    onHover: () => void;
    onAcceptAI: (level: number) => void;
}) {
    const [showTip, setShowTip] = useState(false);

    // AI Trigger with debounce
    useEffect(() => {
        if (!showTip) return;
        if (cell.value !== null && cell.value !== 1) return;
        if (cell.aiSuggestion && (cell.aiSuggestion.status === "loading" || cell.aiSuggestion.status === "done")) return;

        const timer = setTimeout(() => {
            onHover();
        }, 400);

        return () => clearTimeout(timer);
    }, [showTip, cell, onHover]);

    const baseStyle = useMemo(() => {
        if (cell.overridden) return "bg-yellow-50 border-2 border-yellow-400 text-yellow-800";
        if (cell.value === 3) return "bg-emerald-100 text-emerald-800 border border-emerald-300";
        if (cell.value === 2) return "bg-emerald-50 text-emerald-700 border border-emerald-200";
        if (cell.value === 1) return "bg-amber-50 text-amber-700 border border-amber-200";
        return "bg-gray-50 text-gray-400 border border-gray-100";
    }, [cell]);

    const label = cell.aiSuggestion?.status === "done" ? "💡" : cell.aiSuggestion?.status === "loading" ? "⏳" : cell.value !== null ? cell.value : "-";
    const fullLabel = cell.value !== null ? `Level ${cell.value}` : "Not Mapped";

    const confidenceLabel = cell.confidence >= 0.30 ? "HIGH" : 
                            cell.confidence >= 0.18 ? "MEDIUM" : 
                            cell.confidence >= 0.10 ? "LOW" : "NONE";

    const labelColor = confidenceLabel === "HIGH" ? "text-emerald-400" :
                       confidenceLabel === "MEDIUM" ? "text-yellow-400" :
                       confidenceLabel === "LOW" ? "text-orange-400" : "text-gray-400";

    return (
        <td className="p-0 border-r border-gray-100 relative">
            <div className="relative flex items-center justify-center p-1">
                <button
                    onClick={onClick}
                    onMouseEnter={() => setShowTip(true)}
                    onMouseLeave={() => setShowTip(false)}
                    className={cn(
                        "w-10 h-8 rounded-md text-[11px] font-bold transition-all hover:scale-110 hover:shadow-md cursor-pointer select-none",
                        baseStyle,
                        cell.overridden && "ring-2 ring-yellow-300"
                    )}
                    title="Click to toggle"
                >
                    {label}
                </button>

                {/* Tooltip */}
                {showTip && (
                    <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 bg-gray-900 text-white text-[11px] rounded-lg p-3 shadow-xl pointer-events-none">
                        <div className="font-bold mb-1 text-xs">{fullLabel} {cell.overridden ? "(Manual)" : "(Auto)"}</div>
                        <div className="text-gray-300">Confidence: <span className={cn("font-bold font-mono", labelColor)}>{confidenceLabel}</span></div>
                        <div className="text-gray-300 mt-1">Base: <span className="text-white font-mono">{cell.boost ? (cell.confidence - cell.boost).toFixed(2) : cell.confidence.toFixed(2)}</span></div>
                        {cell.boost ? <div className="text-gray-300">Boost: <span className="text-emerald-400 font-mono">+{cell.boost.toFixed(2)}</span></div> : null}
                        <div className="text-gray-300">Final Score: <span className="text-white font-bold font-mono">{cell.confidence.toFixed(2)}</span></div>
                        {cell.matchedWords.length > 0 && (
                            <div className="mt-1 text-gray-400">
                                Common Tokens: <span className="text-blue-300">{cell.matchedWords.slice(0, 4).join(", ")}</span>
                            </div>
                        )}

                        {cell.aiSuggestion?.status === "done" && (
                            <div className="mt-3 p-2.5 bg-indigo-950 rounded border border-indigo-800 shadow-inner">
                                <div className="text-indigo-400 font-bold mb-1.5 flex items-center gap-1 border-b border-indigo-800/50 pb-1">🧠 AI Insight</div>
                                <div className="text-gray-300">Level: <span className="text-white font-bold">{cell.aiSuggestion.level}</span></div>
                                <div className="text-gray-300">Confidence: <span className={cell.aiSuggestion.confidence === "high" ? "text-emerald-400 font-bold" : "text-yellow-400 font-bold"}>{cell.aiSuggestion.confidence.toUpperCase()}</span></div>
                                
                                <div className="mt-2 text-gray-400 font-medium text-[10px] uppercase">Reason:</div>
                                <div className="text-gray-300 italic pointer-events-auto leading-relaxed text-[11px] bg-indigo-900/40 p-1.5 rounded">"{cell.aiSuggestion.reason}"</div>
                                
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (cell.aiSuggestion) onAcceptAI(cell.aiSuggestion.level);
                                    }}
                                    className="mt-3 w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded text-center font-bold text-white shadow-sm pointer-events-auto transition-colors"
                                >
                                    Accept Suggestion
                                </button>
                            </div>
                        )}

                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 pointer-events-none" />
                    </div>
                )}
            </div>
        </td>
    );
}

// ── Main Component ─────────────────────────────────────────────
export default function MappingTable({ batchYear, subjectId, initialDoc }: MappingTableProps) {
    const defaultDescs: Record<COLabel, string> = {
        co1: "", co2: "", co3: "", co4: "", co5: "", co6: "",
    };

    const [coDescriptions, setCoDescriptions] = useState<Record<COLabel, string>>(
        initialDoc?.coDescriptions ?? defaultDescs
    );
    const [matrix, setMatrix] = useState<Record<COLabel, Record<string, MappingCell>> | null>(
        initialDoc?.matrix ?? null
    );
    const [originalMatrix, setOriginalMatrix] = useState<Record<COLabel, Record<string, MappingCell>> | null>(
        initialDoc?.matrix ?? null
    );
    const [piList] = useState<PIEntry[]>(DEFAULT_PI_LIST);
    const [running, setRunning] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [expandedPO, setExpandedPO] = useState<number | null>(1);
    const [isFinalized, setIsFinalized] = useState(initialDoc?.mappingLocked ?? false);
    
    // AI Cache Map and Throttler
    const aiCache = useRef<Record<string, NonNullable<MappingCell["aiSuggestion"]>>>({});
    const lastAiFetch = useRef<number>(0);

    // Auto-pull global CO Config
    useEffect(() => {
        if (!batchYear || !subjectId) return;
        const load = async () => {
            try {
                const res = await getAttainmentResult(batchYear, subjectId);
                if (res?.coDescriptions) {
                    setCoDescriptions(res.coDescriptions);
                } else if (!initialDoc) {
                    alert("⚠️ Course Outcomes not found in global registry schema. Please open the Dashboard Assessment Setup to definitively submit syllabus fields.");
                }
            } catch (e) {
                console.error(e);
            }
        };
        load();
    }, [batchYear, subjectId, initialDoc]);

    const filledCOs = CO_KEYS.filter(co => coDescriptions[co] && coDescriptions[co].trim().length > 0).length;

    // Group PIs by PO for accordion display
    const pisByPO = useMemo(() => getPIsByPO(piList), [piList]);
    const poNumbers = useMemo(() => Object.keys(pisByPO).map(Number).sort((a, b) => a - b), [pisByPO]);

    // Compute PO attainment from current matrix
    const poAttainment = useMemo<POAttainmentRow[]>(() => {
        if (!matrix) return [];
        return computePOAttainment(matrix, piList, filledCOs);
    }, [matrix, piList, filledCOs]);

    // Run NLP mapping
    const handleRunMapping = useCallback(async () => {
        const hasContent = CO_KEYS.some(co => coDescriptions[co].trim().length > 0);
        if (!hasContent) return;
        setRunning(true);
        // Yield to render loading state
        await new Promise(r => setTimeout(r, 50));
        const result = matchAllCOs(coDescriptions, piList);
        setMatrix(result);
        setOriginalMatrix(result);
        setSaved(false);
        setRunning(false);
    }, [coDescriptions, piList]);

    // Toggle a cell
    const handleToggle = useCallback((co: COLabel, piId: string) => {
        if (!matrix || isFinalized) return;
        setMatrix(prev => prev ? toggleCell(prev, co, piId) : prev);
        setSaved(false);
    }, [matrix, isFinalized]);

    // AI suggestion fetch on hover
    const handleHoverCell = useCallback(async (co: COLabel, piId: string) => {
        if (!matrix || isFinalized) return;
        const cell = matrix[co]?.[piId];
        if (!cell || (cell.value !== null && cell.value !== 1)) return;
        if (cell.aiSuggestion && cell.aiSuggestion.status !== "idle") return; // Already fetching or done

        const coText = coDescriptions[co]?.trim();
        const piText = piList.find(p => p.id === piId)?.descriptor?.trim();
        if (!coText || !piText) return;

        const cacheKey = `${coText}|||${piText}`;

        // 1. Check Cache
        if (aiCache.current[cacheKey]) {
            setMatrix(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    [co]: {
                        ...prev[co],
                        [piId]: { ...prev[co][piId], aiSuggestion: aiCache.current[cacheKey] }
                    }
                };
            });
            return;
        }

        // Throttle Guard (Prevent Rapid API Flooding)
        const now = Date.now();
        if (now - lastAiFetch.current < 300) return;
        lastAiFetch.current = now;

        // 2. Set to Loading
        setMatrix(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                [co]: {
                    ...prev[co],
                    [piId]: { ...prev[co][piId], aiSuggestion: { status: "loading", level: 0, confidence: "low", reason: "" } }
                }
            };
        });

        // 3. Fetch
        try {
            const res = await fetch("/api/ai-mapping", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ coText, piText })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed AI fetch");

            const suggestion: NonNullable<MappingCell["aiSuggestion"]> = {
                status: "done",
                level: data.level,
                reason: data.reason,
                confidence: data.confidence
            };

            aiCache.current[cacheKey] = suggestion;

            setMatrix(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    [co]: {
                        ...prev[co],
                        [piId]: { ...prev[co][piId], aiSuggestion: suggestion }
                    }
                };
            });
        } catch (e) {
            console.error("AI Mapping Failure:", e);
            setMatrix(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    [co]: {
                        ...prev[co],
                        [piId]: { ...prev[co][piId], aiSuggestion: { status: "error", level: 0, confidence: "low", reason: "" } }
                    }
                };
            });
        }
    }, [matrix, coDescriptions, piList, isFinalized]);

    const handleAcceptAI = useCallback((co: COLabel, piId: string, level: number) => {
        if (!matrix || isFinalized) return;
        setMatrix(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                [co]: {
                    ...prev[co],
                    [piId]: {
                        ...prev[co][piId],
                        value: level as MappingDecision,
                        overridden: true,
                        aiMeta: { used: true, source: "ai" }
                    }
                }
            };
        });
        setSaved(false);
    }, [matrix, isFinalized]);

    // Reset overrides
    const handleReset = useCallback(() => {
        if (!matrix || !originalMatrix) return;
        setMatrix(resetOverrides(matrix, originalMatrix));
        setSaved(false);
    }, [matrix, originalMatrix]);

    // Save to Firestore
    const handleSave = useCallback(async () => {
        if (!matrix) return;
        setSaving(true);
        try {
            await saveCOMapping({
                batchYear,
                subjectId,
                coDescriptions,
                matrix,
                poAttainment,
                mappingLocked: isFinalized,
                savedAt: new Date().toISOString(),
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    }, [matrix, batchYear, subjectId, coDescriptions, poAttainment, isFinalized]);

    const handleFinalize = useCallback(async () => {
        if (!matrix) return;
        setIsFinalized(true);
        setSaving(true);
        try {
            await saveCOMapping({
                batchYear,
                subjectId,
                coDescriptions,
                matrix,
                poAttainment,
                mappingLocked: true,
                savedAt: new Date().toISOString(),
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    }, [matrix, batchYear, subjectId, coDescriptions, poAttainment]);

    const handleExport = useCallback(() => {
        if (!matrix) return;
        exportMappingToExcel(matrix, piList, poAttainment, batchYear, subjectId, pisByPO);
    }, [matrix, piList, poAttainment, batchYear, subjectId, pisByPO]);

    const hasOverrides = useMemo(() => {
        if (!matrix) return false;
        return CO_KEYS.some(co =>
            Object.values(matrix[co] ?? {}).some(cell => cell.overridden)
        );
    }, [matrix]);



    return (
        <div className="space-y-6">
            {/* ── CO Description Inputs ─────────────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 rounded-lg">
                        <Brain className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                        <h2 className="font-bold text-gray-900">Course Outcome Descriptions</h2>
                        <p className="text-xs text-gray-500">COs are formally managed in Assessment Setup. Return there to modify the global baseline.</p>
                    </div>
                    <div className="ml-auto text-xs font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                        {filledCOs}/6 filled
                    </div>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {CO_KEYS.map((co) => (
                        <div key={co} className="space-y-1">
                            <label className="block text-xs font-bold text-indigo-700 uppercase tracking-wider">
                                {CO_LABELS[co]}
                            </label>
                            <textarea
                                disabled={true}
                                rows={3}
                                value={coDescriptions[co]}
                                onChange={e => setCoDescriptions(prev => ({ ...prev, [co]: e.target.value }))}
                                placeholder={`Describe what students will be able to do in ${CO_LABELS[co]}...`}
                                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 placeholder:text-gray-300 opacity-80 cursor-not-allowed resize-none transition-all"
                            />
                            {coDescriptions[co]?.trim() && (() => {
                                const txtLength = coDescriptions[co].trim().length;
                                if (txtLength > 0 && txtLength < 20) {
                                    return (
                                        <p className="text-[11px] text-orange-600 flex items-center gap-1">
                                            <AlertTriangle className="w-3 h-3 flex-shrink-0" />CO description too short for accurate mapping
                                        </p>
                                    );
                                }
                                const warn = getCOWarning(coDescriptions[co]);
                                return warn ? (
                                    <p className="text-[11px] text-orange-600 flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3 flex-shrink-0" />{warn}
                                    </p>
                                ) : null;
                            })()}
                        </div>
                    ))}
                </div>

                {/* Action buttons */}
                <div className="px-6 pb-5 flex flex-wrap items-center gap-3">
                    <button
                        onClick={handleRunMapping}
                        disabled={running || filledCOs === 0}
                        className={cn(
                            "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm",
                            running || filledCOs === 0
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md active:scale-95"
                        )}
                    >
                        {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                        {running ? "Running NLP..." : "Run NLP Mapping"}
                    </button>

                    {matrix && (
                        <>
                            {hasOverrides && (
                                <button
                                    onClick={handleReset}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-yellow-300 text-yellow-700 bg-yellow-50 hover:bg-yellow-100 transition-all"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                    Reset Overrides
                                </button>
                            )}
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ml-auto",
                                    saved
                                        ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                                        : "bg-violet-600 text-white hover:bg-violet-700 shadow-sm hover:shadow-md active:scale-95"
                                )}
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                                {saving ? "Saving..." : saved ? "Saved!" : "Save to Firebase"}
                            </button>
                            <button
                                onClick={handleExport}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm hover:shadow-md active:scale-95"
                            >
                                <Download className="w-4 h-4" />
                                Export Excel
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* ── Legend ─────────────────────────────────────────── */}
            {matrix && (
                <div className="flex flex-wrap gap-3 items-center text-xs">
                    <span className="text-gray-500 font-medium">Legend:</span>
                    {[
                        { label: "Level 3 (Strong)", cls: "bg-emerald-100 text-emerald-800 border border-emerald-300" },
                        { label: "Level 2 (Moderate)", cls: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
                        { label: "Level 1 (Slight)", cls: "bg-amber-50 text-amber-700 border border-amber-200" },
                        { label: "Not Mapped (-)", cls: "bg-gray-50 text-gray-400 border border-gray-100" },
                        { label: "Overridden", cls: "bg-yellow-50 text-yellow-800 border-2 border-yellow-400" },
                    ].map(({ label, cls }) => (
                        <span key={label} className={cn("px-2.5 py-1 rounded-md font-medium", cls)}>
                            {label}
                        </span>
                    ))}
                    <span className="ml-2 flex items-center gap-1 text-gray-400">
                        <Info className="w-3 h-3" /> Click any cell to toggle
                    </span>
                </div>
            )}

            {/* ── Matrix Table (grouped by PO) ────────────────────── */}
            {matrix && (
                <div className="space-y-3">
                    {poNumbers.map((po) => {
                        const pisInPO = pisByPO[po] ?? [];
                        const isOpen = expandedPO === po;
                        const competency = pisInPO[0]?.competency ?? `PO${po}`;

                        return (
                            <div key={po} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                                {/* PO Header */}
                                <button
                                    onClick={() => setExpandedPO(isOpen ? null : po)}
                                    className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white text-sm font-bold flex items-center justify-center">
                                            {po}
                                        </span>
                                        <div className="text-left">
                                            <div className="font-semibold text-gray-900 text-sm">PO{po} — {competency}</div>
                                            <div className="text-xs text-gray-400">{pisInPO.length} Programme Indicators</div>
                                        </div>
                                    </div>
                                    {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                                </button>

                                {/* PI rows */}
                                {isOpen && (
                                    <div className="overflow-x-auto border-t border-gray-100">
                                        <table className="w-full text-sm min-w-[700px]">
                                            <thead>
                                                <tr className="bg-gray-50 border-b border-gray-100">
                                                    <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">PI ID</th>
                                                    <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Descriptor</th>
                                                    {CO_KEYS.map(co => (
                                                        <th key={co} className="p-3 text-xs font-bold text-indigo-600 uppercase tracking-wider w-12 text-center">
                                                            {CO_LABELS[co]}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {pisInPO.map((pi, idx) => (
                                                    <tr key={pi.id} className={cn(
                                                        "border-b border-gray-50 hover:bg-gray-50/50 transition-colors",
                                                        idx % 2 === 1 && "bg-gray-50/30"
                                                    )}>
                                                        <td className="p-3 font-mono text-xs text-indigo-600 font-medium border-r border-gray-100">
                                                            {pi.id}
                                                        </td>
                                                        <td className="p-3 text-xs text-gray-600 border-r border-gray-100 max-w-xs leading-relaxed">
                                                            {pi.descriptor}
                                                        </td>
                                                        {CO_KEYS.map(co => (
                                                            <MappingCellUI
                                                                key={co}
                                                                cell={matrix[co]?.[pi.id] ?? { value: null, confidence: 0, matchedWords: [], overridden: false }}
                                                                onClick={() => handleToggle(co, pi.id)}
                                                                onHover={() => handleHoverCell(co, pi.id)}
                                                                onAcceptAI={(lvl) => handleAcceptAI(co, pi.id, lvl)}
                                                            />
                                                        ))}
                                                    </tr>
                                                ))}
                                                {/* FINAL AVG ROW FOR PO */}
                                                <tr className="bg-indigo-50/50 border-t-2 border-indigo-100">
                                                    <td colSpan={2} className="p-3 text-right text-xs font-bold text-indigo-800 uppercase tracking-wider border-r border-indigo-100">
                                                        PO Average
                                                    </td>
                                                    {CO_KEYS.map(co => {
                                                        let sum = 0;
                                                        let count = 0;
                                                        for (const pi of pisInPO) {
                                                            const cell = matrix[co]?.[pi.id];
                                                            if (cell && cell.value !== null) {
                                                                sum += cell.value;
                                                                count++;
                                                            }
                                                        }
                                                        const avg = count > 0 ? (sum / count).toFixed(2) : "-";
                                                        return (
                                                            <td key={co} className="p-3 text-center text-xs font-bold text-indigo-800 bg-indigo-50/80 border-l border-indigo-100 shadow-sm">
                                                                {avg}
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── PO Attainment Summary ─────────────────────────── */}
            {poAttainment.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 overflow-x-auto mt-6">
                    <h2 className="font-bold text-gray-900 mb-4">Final PO Attainment Summary</h2>
                    <table className="w-full border-collapse text-sm text-center">
                        <thead className="bg-gray-100 border-b border-gray-200">
                            <tr>
                                <th className="border-r border-gray-200 px-4 py-3 font-semibold text-gray-700 whitespace-nowrap bg-gray-200">
                                    CO / PO
                                </th>
                                {poAttainment.map(row => (
                                    <th key={row.poId} className="border-r border-gray-200 px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">
                                        {Number(row.poId) > 12 ? `PSO${Number(row.poId) - 12}` : `PO${row.poId}`}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {CO_KEYS.map((co) => (
                                <tr key={co} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                                    <td className="border-r border-gray-200 px-4 py-2 font-bold text-gray-600 bg-gray-50">
                                        {co.toUpperCase()}
                                    </td>
                                    {poAttainment.map((row) => {
                                        const val = row.coMap?.[co];
                                        return (
                                            <td key={`${row.poId}-${co}`} className={cn(
                                                "border-r border-gray-200 px-4 py-2 font-medium text-base",
                                                val === 3 ? "text-emerald-600 bg-emerald-50/20" :
                                                val === 2 ? "text-yellow-600 bg-yellow-50/20" :
                                                val === 1 ? "text-orange-600 bg-orange-50/20" :
                                                "text-gray-400"
                                            )}>
                                                {val !== null && val !== undefined ? val : "-"}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}

                            <tr className="border-t-2 border-gray-300">
                                <td className="border-r border-gray-300 px-4 py-4 font-bold text-indigo-900 bg-indigo-50/80">
                                    FINAL AVG
                                </td>
                                {poAttainment.map(row => (
                                    <td key={`avg-${row.poId}`} className={cn(
                                        "border-r border-gray-300 px-4 py-4 font-bold text-lg",
                                        row.level && row.level >= 2.5 ? "text-emerald-700 bg-emerald-100/50" :
                                        row.level && row.level >= 1.5 ? "text-yellow-700 bg-yellow-100/50" :
                                        row.level && row.level > 0 ? "text-orange-700 bg-orange-100/50" :
                                        row.level === 0 ? "text-red-600 bg-red-100/50" :
                                        "text-gray-400 bg-gray-50/50"
                                    )}>
                                        {row.level !== null ? row.level : "-"}
                                    </td>
                                ))}
                            </tr>
                        </tbody>
                    </table>

                    <div className="mt-4 text-xs text-gray-600 flex gap-4 font-medium">
                        <p><span className="inline-block w-3 h-3 rounded-full bg-emerald-500 mr-1"></span> Level 3 (Strong)</p>
                        <p><span className="inline-block w-3 h-3 rounded-full bg-yellow-500 mr-1"></span> Level 2 (Moderate)</p>
                        <p><span className="inline-block w-3 h-3 rounded-full bg-orange-500 mr-1"></span> Level 1 (Slight)</p>
                        <p><span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-1"></span> Level 0 (Fail)</p>
                    </div>
                </div>
            )}

            {/* ── Empty State ─────────────────────────────────────── */}
            {!matrix && !running && (
                <div className="text-center py-20 text-gray-400">
                    <Brain className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p className="font-medium">Fill in CO descriptions above and click <span className="text-indigo-600 font-bold">Run NLP Mapping</span> to generate the matrix</p>
                </div>
            )}
        </div>
    );
}
