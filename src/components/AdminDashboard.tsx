"use client";

import React, { useState, useEffect, useCallback } from "react";
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
    Loader2,
    Search,
    X,
    Users,
    BookOpen,
    BarChart3,
    GraduationCap,
    SlidersHorizontal,
    ChevronDown,
} from "lucide-react";

const CO_KEYS: COLabel[] = ["co1", "co2", "co3", "co4", "co5", "co6"];

const LEVEL_STYLE: Record<string, string> = {
    "3": "bg-emerald-100 text-emerald-800 border border-emerald-200",
    "2": "bg-yellow-100 text-yellow-800 border border-yellow-200",
    "1": "bg-orange-100 text-orange-800 border border-orange-200",
    "0": "bg-red-100 text-red-700 border border-red-200",
};

function LevelBadge({ level }: { level: number | "N/A" | null | undefined }) {
    if (level === null || level === undefined || level === "N/A") {
        return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-400">N/A</span>;
    }
    const r = Math.min(Math.max(Math.round(level as number), 0), 3);
    return (
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${LEVEL_STYLE[String(r)]}`}>
            L{r}
        </span>
    );
}

function FilterSelect({ label, value, options, onChange, placeholder, loading }: {
    label: string; value: string; options: string[]; onChange: (v: string) => void;
    placeholder: string; loading?: boolean;
}) {
    return (
        <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{label}</label>
            <div className="relative">
                {loading ? (
                    <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-400 bg-gray-50">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading...
                    </div>
                ) : (
                    <select
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="w-full appearance-none border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
    };

    const sectionGroups: Record<string, AssessmentDoc[]> = {};
    docs.forEach((d) => {
        const sec = d.examConfig?.section || "Unknown";
        if (!sectionGroups[sec]) sectionGroups[sec] = [];
        sectionGroups[sec].push(d);
    });
    const allSections = Object.keys(sectionGroups).sort();
    const showComparison = allSections.length > 1;

    return (
        <div className="space-y-6">
            {/* Filter Panel */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 flex items-center gap-3">
                    <SlidersHorizontal className="w-5 h-5 text-white" />
                    <div>
                        <h2 className="text-white font-bold text-base">Filter Assessments</h2>
                        <p className="text-indigo-200 text-xs mt-0.5">Narrow down by year, subject, section, and faculty</p>
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
                    <div className="flex items-center gap-3 mt-5 pt-4 border-t border-gray-100">
                        <button onClick={handleSearch} disabled={loadingDocs}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm">
                            {loadingDocs ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                            {loadingDocs ? "Searching..." : "Search"}
                        </button>
                        {searched && (
                            <button onClick={handleClear}
                                className="flex items-center gap-2 text-gray-500 hover:text-gray-800 text-sm font-medium px-3 py-2 rounded-lg hover:bg-gray-100 transition-all">
                                <X className="w-4 h-4" /> Clear
                            </button>
                        )}
                        {searched && !loadingDocs && (
                            <span className="ml-auto text-sm text-gray-500">{docs.length} record{docs.length !== 1 ? "s" : ""} found</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Results */}
            {searched && !loadingDocs && (
                <>
                    {docs.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400">
                            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
                            <p className="font-medium">No assessments found.</p>
                            <p className="text-sm mt-1">Try broadening your search criteria.</p>
                        </div>
                    ) : (
                        <>
                            {/* Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    { label: "Total Records", value: docs.length, icon: BookOpen, cls: "indigo" },
                                    { label: "Sections", value: allSections.length, icon: GraduationCap, cls: "violet" },
                                    { label: "Unique Subjects", value: new Set(docs.map(d => d.subjectId)).size, icon: BarChart3, cls: "emerald" },
                                    { label: "Faculty", value: new Set(docs.map(d => d.examConfig?.facultyName).filter(Boolean)).size, icon: Users, cls: "amber" },
                                ].map(({ label, value, icon: Icon, cls }) => (
                                    <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                                        <div className={`w-8 h-8 rounded-lg bg-${cls}-100 flex items-center justify-center mb-2`}>
                                            <Icon className={`w-4 h-4 text-${cls}-600`} />
                                        </div>
                                        <p className="text-2xl font-bold text-gray-900">{value}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Overview Table */}
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                                    <BookOpen className="w-4 h-4 text-indigo-500" />
                                    <h3 className="font-bold text-gray-800 text-sm">Assessment Overview</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide border-b border-gray-200">
                                                <th className="px-4 py-3 font-semibold">Batch / Acad. Year</th>
                                                <th className="px-4 py-3 font-semibold">Subject</th>
                                                <th className="px-4 py-3 font-semibold">Section</th>
                                                <th className="px-4 py-3 font-semibold">Faculty</th>
                                                <th className="px-4 py-3 font-semibold">Test Type</th>
                                                <th className="px-4 py-3 font-semibold text-center">Students</th>
                                                {CO_KEYS.map((co) => (
                                                    <th key={co} className="px-3 py-3 font-semibold text-center uppercase">{co}</th>
                                                ))}
                                                <th className="px-4 py-3 font-semibold">Saved</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {docs.map((d) => (
                                                <tr key={d.id} className="hover:bg-indigo-50/30 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <p className="font-semibold text-gray-800 text-xs">{d.batchYear}</p>
                                                        <p className="text-[10px] text-gray-400">{d.examConfig?.academicYear ?? "—"}</p>
                                                    </td>
                                                    <td className="px-4 py-3 font-mono text-xs font-semibold text-indigo-700">{d.subjectId}</td>
                                                    <td className="px-4 py-3">
                                                        {d.examConfig?.section
                                                            ? <span className="px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 text-xs font-bold">{d.examConfig.section}</span>
                                                            : <span className="text-gray-300 text-xs">—</span>}
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-700 text-xs">{d.examConfig?.facultyName ?? "—"}</td>
                                                    <td className="px-4 py-3">
                                                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-100">{d.testType}</span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center text-gray-700 font-semibold text-xs">{d.students?.length ?? 0}</td>
                                                    {CO_KEYS.map((co) => (
                                                        <td key={co} className="px-3 py-3 text-center">
                                                            <LevelBadge level={d.computed?.attainment?.[co]?.level as any} />
                                                        </td>
                                                    ))}
                                                    <td className="px-4 py-3 text-[10px] text-gray-400 whitespace-nowrap">
                                                        {d.savedAt ? new Date(d.savedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Section Comparison */}
                            {showComparison && (
                                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                                    <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                                        <BarChart3 className="w-4 h-4 text-violet-500" />
                                        <h3 className="font-bold text-gray-800 text-sm">Section-wise CO Attainment Comparison</h3>
                                        <span className="ml-auto text-xs text-gray-400">Side-by-side view across {allSections.length} sections</span>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left border-collapse">
                                            <thead>
                                                <tr className="bg-gray-50 text-xs font-semibold text-gray-600 uppercase border-b border-gray-200">
                                                    <th className="px-4 py-3">Section</th>
                                                    <th className="px-4 py-3">Subject</th>
                                                    <th className="px-4 py-3">Test Type</th>
                                                    <th className="px-4 py-3">Faculty</th>
                                                    <th className="px-4 py-3 text-center">Students</th>
                                                    {CO_KEYS.map((co) => (
                                                        <th key={co} className="px-3 py-3 text-center uppercase">{co}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {allSections.map((sec) =>
                                                    sectionGroups[sec].map((d, idx) => (
                                                        <tr key={`${sec}-${idx}`} className="hover:bg-violet-50/30 transition-colors">
                                                            {idx === 0 && (
                                                                <td rowSpan={sectionGroups[sec].length} className="px-4 py-3 align-middle border-r border-gray-100">
                                                                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-sm font-bold">{sec}</span>
                                                                </td>
                                                            )}
                                                            <td className="px-4 py-3 font-mono text-xs font-semibold text-indigo-700">{d.subjectId}</td>
                                                            <td className="px-4 py-3 text-xs text-gray-600">{d.testType}</td>
                                                            <td className="px-4 py-3 text-xs text-gray-600">{d.examConfig?.facultyName ?? "—"}</td>
                                                            <td className="px-4 py-3 text-center font-semibold text-gray-700 text-xs">{d.students?.length ?? 0}</td>
                                                            {CO_KEYS.map((co) => (
                                                                <td key={co} className="px-3 py-3 text-center">
                                                                    <LevelBadge level={d.computed?.attainment?.[co]?.level as any} />
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    ))
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
                    <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p className="font-semibold text-gray-500">Select filters and click Search</p>
                    <p className="text-sm mt-1">View year-wise and section-wise CO attainment data across all uploaded assessments.</p>
                </div>
            )}
        </div>
    );
}
