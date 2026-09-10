"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
    getAllBatchYears,
    getAllAcademicYears,
    getSubjectsForBatch,
    getSectionsForBatch,
    getAllFacultyNames,
    getAssessmentsForAdmin,
} from "@/lib/firestoreService";
import { AssessmentDoc, COLabel } from "@/types";
import {
    downloadAssessmentReport,
    downloadAdminSummaryReport,
} from "@/lib/excelReportGenerator";
import {
    Loader2,
    Search,
    X,
    Users,
    BookOpen,
    BarChart3,
    GraduationCap,
    SlidersHorizontal,
    ChevronDown,
    Download,
    FileSpreadsheet,
    Sparkles,
    CheckCircle2,
    AlertCircle,
    Layers
} from "lucide-react";

const CO_KEYS: COLabel[] = ["co1", "co2", "co3", "co4", "co5", "co6"];

const LEVEL_STYLE: Record<string, string> = {
    "3": "bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold",
    "2": "bg-yellow-100 text-yellow-800 border border-yellow-300 font-bold",
    "1": "bg-orange-100 text-orange-800 border border-orange-300 font-bold",
    "0": "bg-rose-100 text-rose-700 border border-rose-300 font-bold",
};

function LevelBadge({ stats }: { stats?: { level: number | "N/A" | null; pct: number | null; scoring60: number; attended: number } | null }) {
    if (!stats || stats.level === null || stats.level === undefined || stats.level === "N/A") {
        const tip = stats ? `No questions mapped to this CO` : `No data`;
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-gray-100 text-gray-400" title={tip}>N/A</span>;
    }
    const r = Math.min(Math.max(Math.round(stats.level as number), 0), 3);
    const tip = `${stats.scoring60}/${stats.attended} students ≥60% → ${stats.pct?.toFixed(1) ?? 0}%`;
    return (
        <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] cursor-help shadow-xs ${LEVEL_STYLE[String(r)]}`}
            title={tip}
        >
            L{r}
        </span>
    );
}

function FilterSelect({ label, value, options, onChange, placeholder, loading }: {
    label: string; value: string; options: string[]; onChange: (v: string) => void;
    placeholder: string; loading?: boolean;
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{label}</label>
            <div className="relative">
                {loading ? (
                    <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-400 bg-gray-50">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading...
                    </div>
                ) : (
                    <select
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="w-full appearance-none border border-gray-200 rounded-xl px-3.5 py-2 pr-8 text-sm bg-gray-50/50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
                    >
                        <option value="">{placeholder}</option>
                        {options.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                )}
                {!loading && <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />}
            </div>
        </div>
    );
}

export default function AdminDashboard() {
    const [academicYear, setAcademicYear] = useState("");
    const [batchYear, setBatchYear] = useState("");
    const [subjectId, setSubjectId] = useState("");
    const [section, setSection] = useState("");
    const [facultyName, setFacultyName] = useState("");

    const [academicYears, setAcademicYears] = useState<string[]>([]);
    const [batchYears, setBatchYears] = useState<string[]>([]);
    const [subjects, setSubjects] = useState<string[]>([]);
    const [sections, setSections] = useState<string[]>([]);
    const [facultyNames, setFacultyNames] = useState<string[]>([]);

    const [loadingOptions, setLoadingOptions] = useState(true);
    const [loadingDocs, setLoadingDocs] = useState(false);
    const [docs, setDocs] = useState<AssessmentDoc[]>([]);
    const [searched, setSearched] = useState(false);

    // In-memory instant quick search & export states
    const [quickQuery, setQuickQuery] = useState("");
    const [exportingId, setExportingId] = useState<string | null>(null);
    const [exportingSummary, setExportingSummary] = useState(false);

    useEffect(() => {
        setLoadingOptions(true);
        Promise.all([getAllAcademicYears(), getAllBatchYears(), getAllFacultyNames()])
            .then(([ay, by, fn]) => {
                setAcademicYears(ay);
                setBatchYears(by);
                setFacultyNames(fn);
            })
            .finally(() => setLoadingOptions(false));
    }, []);

    useEffect(() => {
        setSubjectId(""); setSection("");
        if (!batchYear) { setSubjects([]); setSections([]); return; }
        getSubjectsForBatch(batchYear).then(setSubjects);
    }, [batchYear]);

    useEffect(() => {
        setSection("");
        if (!batchYear) { setSections([]); return; }
        getSectionsForBatch(batchYear, subjectId || undefined).then(setSections);
    }, [batchYear, subjectId]);

    const handleSearch = useCallback(async () => {
        setLoadingDocs(true);
        setSearched(true);
        try {
            const results = await getAssessmentsForAdmin({
                batchYear: batchYear || undefined,
                subjectId: subjectId || undefined,
                section: section || undefined,
                academicYear: academicYear || undefined,
                facultyName: facultyName || undefined,
            });
            setDocs(results);
        } finally {
            setLoadingDocs(false);
        }
    }, [academicYear, batchYear, subjectId, section, facultyName]);

    const handleClear = () => {
        setAcademicYear(""); setBatchYear(""); setSubjectId("");
        setSection(""); setFacultyName("");
        setDocs([]); setSearched(false);
        setQuickQuery("");
    };

    // Client-side quick filter (zero db load)
    const filteredDocs = useMemo(() => {
        if (!quickQuery.trim()) return docs;
        const q = quickQuery.toLowerCase();
        return docs.filter(d =>
            (d.subjectId && d.subjectId.toLowerCase().includes(q)) ||
            (d.examConfig?.facultyName && d.examConfig.facultyName.toLowerCase().includes(q)) ||
            (d.examConfig?.section && d.examConfig.section.toLowerCase().includes(q)) ||
            (d.testType && d.testType.toLowerCase().includes(q)) ||
            (d.batchYear && d.batchYear.toLowerCase().includes(q)) ||
            (d.examConfig?.academicYear && d.examConfig.academicYear.toLowerCase().includes(q))
        );
    }, [docs, quickQuery]);

    // Attainment Level Distribution summary
    const levelStats = useMemo(() => {
        let l3 = 0, l2 = 0, l1 = 0, l0 = 0, total = 0;
        filteredDocs.forEach(d => {
            CO_KEYS.forEach(co => {
                const st = d.computed?.attainment?.[co];
                if (st && st.level !== null && st.level !== undefined && st.level !== "N/A") {
                    const lvl = Math.round(Number(st.level));
                    if (lvl >= 3) l3++;
                    else if (lvl === 2) l2++;
                    else if (lvl === 1) l1++;
                    else l0++;
                    total++;
                }
            });
        });
        return { l3, l2, l1, l0, total };
    }, [filteredDocs]);

    // Export single assessment to Excel
    const handleDownloadSingle = async (d: AssessmentDoc) => {
        const id = d.id || `${d.batchYear}_${d.subjectId}_${d.testType}`;
        setExportingId(id);
        try {
            if (!d.students || !d.questionConfig || !d.examConfig) {
                alert("Assessment data is incomplete for export.");
                return;
            }
            await downloadAssessmentReport(d.students, d.examConfig, d.questionConfig);
        } catch (err) {
            console.error("Single export failed:", err);
            alert("Failed to export assessment report.");
        } finally {
            setExportingId(null);
        }
    };

    // Export batch summary of all filtered assessments
    const handleDownloadSummary = async () => {
        if (filteredDocs.length === 0) {
            alert("No records to export.");
            return;
        }
        setExportingSummary(true);
        try {
            await downloadAdminSummaryReport(filteredDocs, {
                academicYear,
                batchYear,
                subjectId,
                section,
                facultyName,
            });
        } catch (err) {
            console.error("Batch summary export failed:", err);
            alert("Failed to generate summary report.");
        } finally {
            setExportingSummary(false);
        }
    };

    const sectionGroups: Record<string, AssessmentDoc[]> = {};
    filteredDocs.forEach((d) => {
        const sec = d.examConfig?.section || "Unknown";
        if (!sectionGroups[sec]) sectionGroups[sec] = [];
        sectionGroups[sec].push(d);
    });
    const allSections = Object.keys(sectionGroups).sort();
    const showComparison = allSections.length > 1;

    return (
        <div className="space-y-6">
            {/* Filter Panel */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-600 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/10 rounded-xl backdrop-blur-xs">
                            <SlidersHorizontal className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-white font-bold text-base">Filter & Analytics Portal</h2>
                            <p className="text-indigo-100 text-xs mt-0.5">Filter assessments across batches, subjects, sections & faculty</p>
                        </div>
                    </div>
                </div>
                <div className="p-6">
                    {loadingOptions ? (
                        <div className="flex items-center gap-2 text-gray-400 text-sm py-4">
                            <Loader2 className="w-4 h-4 animate-spin" /> Loading filter options...
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            <FilterSelect label="Academic Year" value={academicYear} options={academicYears} onChange={setAcademicYear} placeholder="All Years" />
                            <FilterSelect label="Batch Year" value={batchYear} options={batchYears} onChange={setBatchYear} placeholder="All Batches" />
                            <FilterSelect label="Subject ID" value={subjectId} options={subjects} onChange={setSubjectId} placeholder="All Subjects" />
                            <FilterSelect label="Section" value={section} options={sections} onChange={setSection} placeholder="All Sections" />
                            <FilterSelect label="Faculty" value={facultyName} options={facultyNames} onChange={setFacultyName} placeholder="All Faculty" />
                        </div>
                    )}
                    <div className="flex flex-wrap items-center gap-3 mt-5 pt-4 border-t border-gray-100">
                        <button onClick={handleSearch} disabled={loadingDocs}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm cursor-pointer">
                            {loadingDocs ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                            {loadingDocs ? "Searching..." : "Apply Filters"}
                        </button>
                        {searched && (
                            <button onClick={handleClear}
                                className="flex items-center gap-2 text-gray-500 hover:text-gray-800 text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-gray-100 transition-all cursor-pointer">
                                <X className="w-4 h-4" /> Reset
                            </button>
                        )}
                        {searched && !loadingDocs && (
                            <span className="ml-auto text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">
                                {filteredDocs.length} of {docs.length} record{docs.length !== 1 ? "s" : ""}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Results */}
            {searched && !loadingDocs && (
                <>
                    {docs.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center text-gray-400">
                            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30 text-indigo-500" />
                            <p className="font-semibold text-gray-700 text-base">No assessments found</p>
                            <p className="text-sm mt-1 text-gray-400">Try broadening your search criteria or selecting another batch.</p>
                        </div>
                    ) : (
                        <>
                            {/* Summary KPI Cards */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                {[
                                    { label: "Total Assessments", value: filteredDocs.length, icon: BookOpen, color: "text-indigo-600", bg: "bg-indigo-50 border-indigo-100" },
                                    { label: "Sections Covered", value: allSections.length, icon: GraduationCap, color: "text-violet-600", bg: "bg-violet-50 border-violet-100" },
                                    { label: "Unique Subjects", value: new Set(filteredDocs.map(d => d.subjectId)).size, icon: BarChart3, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100" },
                                    { label: "Faculty Involved", value: new Set(filteredDocs.map(d => d.examConfig?.facultyName).filter(Boolean)).size, icon: Users, color: "text-amber-600", bg: "bg-amber-50 border-amber-100" },
                                ].map(({ label, value, icon: Icon, color, bg }) => (
                                    <div key={label} className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</p>
                                            <p className="text-2xl font-black text-gray-900 mt-1">{value}</p>
                                        </div>
                                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${bg}`}>
                                            <Icon className={`w-5 h-5 ${color}`} />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Attainment Levels Quick Distribution Bar */}
                            {levelStats.total > 0 && (
                                <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs">
                                    <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                                        <div className="flex items-center gap-2">
                                            <Sparkles className="w-4 h-4 text-indigo-500" />
                                            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">CO Attainment Level Distribution</h4>
                                        </div>
                                        <span className="text-xs text-gray-400 font-medium">Based on {levelStats.total} evaluated COs</span>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-black text-sm flex items-center justify-center">L3</div>
                                            <div>
                                                <p className="text-xs font-semibold text-emerald-800">High Attainment</p>
                                                <p className="text-sm font-black text-emerald-950">{levelStats.l3} <span className="text-xs font-normal text-emerald-600">({((levelStats.l3 / levelStats.total) * 100).toFixed(0)}%)</span></p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 p-3 rounded-xl bg-yellow-50 border border-yellow-100">
                                            <div className="w-8 h-8 rounded-lg bg-yellow-500 text-white font-black text-sm flex items-center justify-center">L2</div>
                                            <div>
                                                <p className="text-xs font-semibold text-yellow-800">Moderate</p>
                                                <p className="text-sm font-black text-yellow-950">{levelStats.l2} <span className="text-xs font-normal text-yellow-600">({((levelStats.l2 / levelStats.total) * 100).toFixed(0)}%)</span></p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 p-3 rounded-xl bg-orange-50 border border-orange-100">
                                            <div className="w-8 h-8 rounded-lg bg-orange-500 text-white font-black text-sm flex items-center justify-center">L1</div>
                                            <div>
                                                <p className="text-xs font-semibold text-orange-800">Low Attainment</p>
                                                <p className="text-sm font-black text-orange-950">{levelStats.l1} <span className="text-xs font-normal text-orange-600">({((levelStats.l1 / levelStats.total) * 100).toFixed(0)}%)</span></p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 p-3 rounded-xl bg-rose-50 border border-rose-100">
                                            <div className="w-8 h-8 rounded-lg bg-rose-500 text-white font-black text-sm flex items-center justify-center">L0</div>
                                            <div>
                                                <p className="text-xs font-semibold text-rose-800">Not Attained</p>
                                                <p className="text-sm font-black text-rose-950">{levelStats.l0} <span className="text-xs font-normal text-rose-600">({((levelStats.l0 / levelStats.total) * 100).toFixed(0)}%)</span></p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Overview Table with Instant Search & Batch Export */}
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                                <div className="p-4 sm:px-6 sm:py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                                            <BookOpen className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-sm">Assessment Records Overview</h3>
                                            <p className="text-xs text-gray-400">Detailed course outcome level attainment per assessment</p>
                                        </div>
                                    </div>

                                    {/* Action bar: In-memory filter + Export All Summary */}
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <div className="relative">
                                            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="text"
                                                value={quickQuery}
                                                onChange={(e) => setQuickQuery(e.target.value)}
                                                placeholder="Quick search in table..."
                                                className="pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-400 focus:outline-none w-48 sm:w-60"
                                            />
                                            {quickQuery && (
                                                <button onClick={() => setQuickQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>

                                        <button
                                            onClick={handleDownloadSummary}
                                            disabled={exportingSummary || filteredDocs.length === 0}
                                            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                                            title="Download full executive Excel summary of all filtered records"
                                        >
                                            {exportingSummary ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5" />}
                                            {exportingSummary ? "Generating..." : "Export Filtered Summary"}
                                        </button>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50/80 text-gray-600 text-xs uppercase tracking-wider border-b border-gray-200">
                                                <th className="px-4 py-3.5 font-bold">Batch / Year</th>
                                                <th className="px-4 py-3.5 font-bold">Subject</th>
                                                <th className="px-3 py-3.5 font-bold text-center">Section</th>
                                                <th className="px-4 py-3.5 font-bold">Faculty</th>
                                                <th className="px-4 py-3.5 font-bold">Test Type</th>
                                                <th className="px-3 py-3.5 font-bold text-center">Students</th>
                                                {CO_KEYS.map((co) => (
                                                    <th key={co} className="px-2.5 py-3.5 font-bold text-center uppercase">{co}</th>
                                                ))}
                                                <th className="px-4 py-3.5 font-bold text-center">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {filteredDocs.map((d) => {
                                                const rowId = d.id || `${d.batchYear}_${d.subjectId}_${d.testType}_${d.examConfig?.section}`;
                                                const isRowExporting = exportingId === rowId;

                                                return (
                                                    <tr key={rowId} className="hover:bg-indigo-50/40 transition-colors">
                                                        <td className="px-4 py-3.5">
                                                            <p className="font-bold text-gray-900 text-xs">{d.batchYear}</p>
                                                            <p className="text-[10px] font-medium text-gray-400">{d.examConfig?.academicYear ?? "—"}</p>
                                                        </td>
                                                        <td className="px-4 py-3.5 font-mono text-xs font-bold text-indigo-700">{d.subjectId}</td>
                                                        <td className="px-3 py-3.5 text-center">
                                                            {d.examConfig?.section
                                                                ? <span className="px-2.5 py-0.5 rounded-md bg-violet-100 text-violet-800 text-xs font-extrabold border border-violet-200">{d.examConfig.section}</span>
                                                                : <span className="text-gray-300 text-xs">—</span>}
                                                        </td>
                                                        <td className="px-4 py-3.5 text-gray-800 text-xs font-medium">{d.examConfig?.facultyName ?? "—"}</td>
                                                        <td className="px-4 py-3.5">
                                                            <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-100">{d.testType}</span>
                                                        </td>
                                                        <td className="px-3 py-3.5 text-center text-gray-800 font-bold text-xs">{d.students?.length ?? 0}</td>
                                                        {CO_KEYS.map((co) => (
                                                            <td key={co} className="px-2.5 py-3.5 text-center">
                                                                <LevelBadge stats={d.computed?.attainment?.[co] as any} />
                                                            </td>
                                                        ))}
                                                        <td className="px-4 py-3.5 text-center">
                                                            <button
                                                                onClick={() => handleDownloadSingle(d)}
                                                                disabled={isRowExporting}
                                                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-indigo-50 text-gray-700 hover:text-indigo-700 border border-gray-200 hover:border-indigo-200 transition-all cursor-pointer shadow-2xs"
                                                                title="Download Complete Excel Assessment Report"
                                                            >
                                                                {isRowExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" /> : <Download className="w-3.5 h-3.5 text-indigo-600" />}
                                                                <span>{isRowExporting ? "Exporting..." : "Report"}</span>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Section Comparison */}
                            {showComparison && (
                                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-violet-50 text-violet-600 rounded-lg">
                                                <BarChart3 className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900 text-sm">Section-wise CO Attainment Comparison</h3>
                                                <p className="text-xs text-gray-400">Side-by-side comparison across {allSections.length} sections</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left border-collapse">
                                            <thead>
                                                <tr className="bg-gray-50/80 text-xs font-bold text-gray-600 uppercase border-b border-gray-200">
                                                    <th className="px-4 py-3.5">Section</th>
                                                    <th className="px-4 py-3.5">Subject</th>
                                                    <th className="px-4 py-3.5">Test Type</th>
                                                    <th className="px-4 py-3.5">Faculty</th>
                                                    <th className="px-4 py-3.5 text-center">Students</th>
                                                    {CO_KEYS.map((co) => (
                                                        <th key={co} className="px-3 py-3.5 text-center uppercase font-bold">{co}</th>
                                                    ))}
                                                    <th className="px-4 py-3.5 text-center">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {allSections.map((sec) =>
                                                    sectionGroups[sec].map((d, idx) => {
                                                        const secRowId = `sec_${d.id || `${sec}_${d.subjectId}_${d.testType}`}`;
                                                        const isSecRowExporting = exportingId === secRowId;

                                                        return (
                                                            <tr key={`${sec}-${idx}`} className="hover:bg-violet-50/30 transition-colors">
                                                                {idx === 0 && (
                                                                    <td rowSpan={sectionGroups[sec].length} className="px-4 py-3.5 align-middle border-r border-gray-100 bg-gray-50/30">
                                                                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-violet-100 text-violet-800 text-sm font-black border border-violet-200">{sec}</span>
                                                                    </td>
                                                                )}
                                                                <td className="px-4 py-3.5 font-mono text-xs font-bold text-indigo-700">{d.subjectId}</td>
                                                                <td className="px-4 py-3.5 text-xs text-gray-700 font-medium">{d.testType}</td>
                                                                <td className="px-4 py-3.5 text-xs text-gray-700">{d.examConfig?.facultyName ?? "—"}</td>
                                                                <td className="px-4 py-3.5 text-center font-bold text-gray-800 text-xs">{d.students?.length ?? 0}</td>
                                                                {CO_KEYS.map((co) => (
                                                                    <td key={co} className="px-3 py-3.5 text-center">
                                                                        <LevelBadge stats={d.computed?.attainment?.[co] as any} />
                                                                    </td>
                                                                ))}
                                                                <td className="px-4 py-3.5 text-center">
                                                                    <button
                                                                        onClick={() => {
                                                                            setExportingId(secRowId);
                                                                            handleDownloadSingle(d).finally(() => setExportingId(null));
                                                                        }}
                                                                        disabled={isSecRowExporting}
                                                                        className="p-1.5 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-violet-50 text-gray-600 hover:text-violet-700 border border-gray-200 transition-all cursor-pointer"
                                                                        title="Download Excel Report"
                                                                    >
                                                                        {isSecRowExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </>
            )}

            {!searched && (
                <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-16 text-center text-gray-400">
                    <Search className="w-12 h-12 mx-auto mb-4 opacity-25 text-indigo-500" />
                    <p className="font-bold text-gray-700 text-base">Select filters and click Apply Filters</p>
                    <p className="text-sm mt-1 text-gray-400">Inspect year-wise, subject-wise, and section-wise CO attainment analytics and download full Excel reports.</p>
                </div>
            )}
        </div>
    );
}

