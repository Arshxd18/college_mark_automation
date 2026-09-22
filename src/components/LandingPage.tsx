"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
    LayoutDashboard, 
    Network, 
    TrendingUp, 
    ShieldCheck, 
    UploadCloud, 
    FileSpreadsheet, 
    CheckCircle2, 
    Layers, 
    Sparkles, 
    ArrowRight, 
    Play, 
    Sliders,
    Zap,
    GraduationCap,
    Cpu,
    Eye
} from "lucide-react";
import { Prism, LightTunnel, StrokeText, ParticleText } from "@/components/3d";

export default function LandingPage() {
    const [bgMode, setBgMode] = useState<"prism" | "tunnel">("tunnel");
    const [simScore, setSimScore] = useState<number>(76);
    const [simType, setSimType] = useState<"IA" | "UT" | "AS">("UT");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Calculate simulated attainment based on slider
    const getSimulatedLevel = (score: number) => {
        if (score >= 80) return { level: "L3", label: "Level 3 (High Attainment)", color: "text-emerald-400 border-emerald-500/40 bg-emerald-950/60" };
        if (score >= 70) return { level: "L2", label: "Level 2 (Medium Attainment)", color: "text-cyan-400 border-cyan-500/40 bg-cyan-950/60" };
        if (score >= 60) return { level: "L1", label: "Level 1 (Low Attainment)", color: "text-amber-400 border-amber-500/40 bg-amber-950/60" };
        return { level: "L0", label: "Level 0 (Unattained / Remedial)", color: "text-rose-400 border-rose-500/40 bg-rose-950/60" };
    };

    const simResult = getSimulatedLevel(simScore);

    const weights = {
        IA: { label: "Internal Exam", weight: "60%", formula: "((Marks / Max) × 100%)" },
        UT: { label: "Unit Test (Best of 3)", weight: "15%", formula: "((Marks / 40) × 15%) × 100" },
        AS: { label: "Assignment", weight: "25%", formula: "((Marks / 10) × 25%) × 100" },
    };

    return (
        <div className="relative min-h-screen bg-[#060814] text-white selection:bg-indigo-500 selection:text-white overflow-x-hidden font-sans">
            {/* ── 3D Canvas Background Layer ─────────────────────────────────── */}
            <div className="fixed inset-0 z-0 pointer-events-auto opacity-75 transition-opacity duration-1000">
                {bgMode === "tunnel" ? (
                    <LightTunnel
                        cableColor="#818CF8"
                        pulseColor="#38BDF8"
                        tunnelColor="#4F46E5"
                        tunnelOpacity={0.15}
                        speed={0.12}
                        pulseSpeed={2.2}
                        cableCount={24}
                        glow={1.2}
                        mouseInteraction={true}
                    />
                ) : (
                    <Prism
                        animationType="hover"
                        timeScale={0.4}
                        height={3.8}
                        baseWidth={6.0}
                        scale={3.2}
                        glow={1.3}
                        noise={0.08}
                        colorFrequency={1.2}
                    />
                )}
            </div>

            {/* Subtle Gradient Fog Overlays */}
            <div className="fixed inset-0 z-1 pointer-events-none bg-gradient-to-b from-[#060814]/80 via-transparent to-[#060814] backdrop-blur-[0.5px]" />
            <div className="fixed inset-0 z-1 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-transparent to-transparent" />

            {/* ── Content Container (z-10) ──────────────────────────────────── */}
            <div className="relative z-10 flex flex-col min-h-screen">

                {/* ── Top Navigation Bar ────────────────────────────────────── */}
                <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#060814]/70 border-b border-white/10 px-4 sm:px-8 py-3.5 transition-all">
                    <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                        {/* Institutional Logo & Title */}
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 p-1 backdrop-blur-md flex items-center justify-center shadow-lg shadow-indigo-500/10">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src="/clg_logo.png"
                                    alt="College Logo"
                                    className="w-full h-full object-contain filter drop-shadow"
                                />
                            </div>
                            <div>
                                <h1 className="text-xs sm:text-sm font-black uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-cyan-300">
                                    Panimalar Engineering College
                                </h1>
                                <p className="text-[10px] font-bold tracking-widest text-indigo-400 uppercase">
                                    Dept of AI & DS • NBA / AICTE R23 Suite
                                </p>
                            </div>
                        </div>

                        {/* Center/Right Actions */}
                        <div className="flex items-center gap-3">
                            {/* 3D BG Switcher Pill */}
                            <div className="hidden md:flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/10 text-xs">
                                <button
                                    onClick={() => setBgMode("tunnel")}
                                    className={`px-3 py-1 rounded-full font-semibold transition-all ${bgMode === "tunnel" ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30" : "text-gray-400 hover:text-white"}`}
                                >
                                    Tunnel 3D
                                </button>
                                <button
                                    onClick={() => setBgMode("prism")}
                                    className={`px-3 py-1 rounded-full font-semibold transition-all ${bgMode === "prism" ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30" : "text-gray-400 hover:text-white"}`}
                                >
                                    Prism 3D
                                </button>
                            </div>

                            {/* Quick Links */}
                            <nav className="hidden lg:flex items-center gap-1 text-xs font-medium text-gray-300">
                                <Link href="/mapping" className="px-3 py-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors">
                                    CO-PO Matrix
                                </Link>
                                <Link href="/attainment" className="px-3 py-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors">
                                    Attainment
                                </Link>
                                <Link href="/admin" className="px-3 py-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors">
                                    Admin
                                </Link>
                            </nav>

                            {/* Launch Dashboard Primary CTA */}
                            <Link
                                href="/dashboard"
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white text-xs sm:text-sm font-bold shadow-lg shadow-indigo-500/25 border border-indigo-400/30 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                                <LayoutDashboard className="w-4 h-4" />
                                <span>Launch Dashboard</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                    </div>
                </header>

                {/* ── Main Hero Section ─────────────────────────────────────── */}
                <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-20 w-full">

                    {/* Hero Header */}
                    <div className="text-center space-y-6 max-w-4xl mx-auto pt-4">
                        {/* Badge Tag */}
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold backdrop-blur-md shadow-inner shadow-indigo-500/20 animate-pulse">
                            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                            <span>AICTE R23 & NBA Autonomous Accreditation Engine</span>
                        </div>

                        {/* Animated Stroke Text Headline */}
                        <div className="py-2">
                            {mounted ? (
                                <StrokeText
                                    text="AUTO ATTAIN R23"
                                    strokeColor="#818CF8"
                                    fillColor="#FFFFFF"
                                    strokeWidth={1.8}
                                    drawDuration={1.8}
                                    fillMode="wipe"
                                    fontSize={64}
                                    fontWeight={900}
                                    letterSpacing={-1}
                                    className="max-w-3xl mx-auto"
                                />
                            ) : (
                                <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight">
                                    AUTO ATTAIN R23
                                </h1>
                            )}
                        </div>

                        {/* Subheadline */}
                        <p className="text-base sm:text-xl text-indigo-200/90 font-medium max-w-2xl mx-auto leading-relaxed">
                            Complete continuous assessment, relative rubric mapping, 96 Performance Indicator checklists, and multi-sheet audit-ready Excel reports.
                        </p>

                        {/* Quick Interactive Particle Branding */}
                        <div className="w-full h-24 sm:h-28 max-w-xl mx-auto rounded-2xl bg-white/[0.03] border border-white/10 p-2 backdrop-blur-md overflow-hidden relative group">
                            <ParticleText
                                text="NBA ACCREDITATION READY"
                                particleSize={2}
                                density={3}
                                color="#E0E7FF"
                                highlightColor="#38BDF8"
                                scatter={140}
                                pointerRepel={35}
                                fontSize="clamp(1.4rem, 4vw, 2.2rem)"
                                fontWeight={800}
                            />
                            <div className="absolute bottom-1 right-2 text-[10px] text-gray-500 font-mono">
                                Hover over particles to interact ✦
                            </div>
                        </div>

                        {/* Hero CTA Action Hub */}
                        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                            <Link
                                href="/dashboard"
                                className="flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-extrabold text-base shadow-xl shadow-indigo-600/30 border border-indigo-400/40 hover:scale-105 active:scale-95 transition-all"
                            >
                                <Play className="w-5 h-5 fill-white" />
                                <span>Enter Assessment Engine</span>
                            </Link>

                            <Link
                                href="/mapping"
                                className="flex items-center gap-2.5 px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-sm backdrop-blur-lg hover:scale-105 active:scale-95 transition-all"
                            >
                                <Network className="w-4 h-4 text-cyan-400" />
                                <span>CO–PO Articulation Matrix</span>
                            </Link>

                            <Link
                                href="/attainment"
                                className="flex items-center gap-2.5 px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-sm backdrop-blur-lg hover:scale-105 active:scale-95 transition-all"
                            >
                                <TrendingUp className="w-4 h-4 text-emerald-400" />
                                <span>Overall Attainment</span>
                            </Link>
                        </div>
                    </div>

                    {/* ── Direct Portal Gateway Cards (Quick Redirects) ─────────── */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {/* 1. Assessment Entry */}
                        <Link
                            href="/dashboard"
                            className="group p-6 rounded-3xl bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/15 hover:border-indigo-400/50 backdrop-blur-xl hover:shadow-2xl hover:shadow-indigo-500/20 hover:-translate-y-1.5 transition-all space-y-4"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                                <LayoutDashboard className="w-6 h-6" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold text-lg text-white group-hover:text-indigo-300 transition-colors flex items-center justify-between">
                                    <span>Marks & CO Entry</span>
                                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-indigo-400" />
                                </h3>
                                <p className="text-xs text-gray-400 leading-relaxed">
                                    Upload Internal 1, Internal 2, Unit Tests, and Assignments with real-time CO score calculations.
                                </p>
                            </div>
                            <div className="pt-2 flex items-center gap-2 text-[11px] font-semibold text-indigo-400">
                                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                                <span>Direct Access →</span>
                            </div>
                        </Link>

                        {/* 2. CO-PO Articulation Matrix */}
                        <Link
                            href="/mapping"
                            className="group p-6 rounded-3xl bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/15 hover:border-cyan-400/50 backdrop-blur-xl hover:shadow-2xl hover:shadow-cyan-500/20 hover:-translate-y-1.5 transition-all space-y-4"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 group-hover:scale-110 group-hover:bg-cyan-500 group-hover:text-white transition-all">
                                <Network className="w-6 h-6" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold text-lg text-white group-hover:text-cyan-300 transition-colors flex items-center justify-between">
                                    <span>PO / PSO Mapping</span>
                                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-cyan-400" />
                                </h3>
                                <p className="text-xs text-gray-400 leading-relaxed">
                                    96 Performance Indicators across 14 outcomes with relative grading logic and live column averaging.
                                </p>
                            </div>
                            <div className="pt-2 flex items-center gap-2 text-[11px] font-semibold text-cyan-400">
                                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                                <span>96 PIs Registered →</span>
                            </div>
                        </Link>

                        {/* 3. Attainment Analytics */}
                        <Link
                            href="/attainment"
                            className="group p-6 rounded-3xl bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/15 hover:border-emerald-400/50 backdrop-blur-xl hover:shadow-2xl hover:shadow-emerald-500/20 hover:-translate-y-1.5 transition-all space-y-4"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold text-lg text-white group-hover:text-emerald-300 transition-colors flex items-center justify-between">
                                    <span>Direct & Indirect</span>
                                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-emerald-400" />
                                </h3>
                                <p className="text-xs text-gray-400 leading-relaxed">
                                    Weighted pipeline (IA 60% + UT 15% + AS 25% → Direct 40% + SEE 60% → Final 90/10%).
                                </p>
                            </div>
                            <div className="pt-2 flex items-center gap-2 text-[11px] font-semibold text-emerald-400">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                                <span>Automated Formula →</span>
                            </div>
                        </Link>

                        {/* 4. HOD & Admin Analytics */}
                        <Link
                            href="/admin"
                            className="group p-6 rounded-3xl bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/15 hover:border-violet-400/50 backdrop-blur-xl hover:shadow-2xl hover:shadow-violet-500/20 hover:-translate-y-1.5 transition-all space-y-4"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-violet-500/20 border border-violet-500/40 flex items-center justify-center text-violet-400 group-hover:scale-110 group-hover:bg-violet-500 group-hover:text-white transition-all">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold text-lg text-white group-hover:text-violet-300 transition-colors flex items-center justify-between">
                                    <span>HOD Admin Portal</span>
                                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-violet-400" />
                                </h3>
                                <p className="text-xs text-gray-400 leading-relaxed">
                                    Multi-section comparison (A vs B vs C), faculty attainment distribution, and batch Excel downloads.
                                </p>
                            </div>
                            <div className="pt-2 flex items-center gap-2 text-[11px] font-semibold text-violet-400">
                                <span className="w-2 h-2 rounded-full bg-violet-400 animate-ping" />
                                <span>Overview Analytics →</span>
                            </div>
                        </Link>
                    </div>

                    {/* ── Interactive Attainment Simulator Widget ───────────────── */}
                    <div className="p-8 rounded-3xl bg-gradient-to-br from-indigo-950/40 via-slate-900/60 to-purple-950/40 border border-white/15 backdrop-blur-2xl shadow-2xl space-y-6">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <h3 className="text-xl font-black text-white flex items-center gap-2.5">
                                    <Zap className="w-5 h-5 text-amber-400" />
                                    <span>Interactive R23 Attainment Simulator</span>
                                </h3>
                                <p className="text-xs text-gray-400 mt-1">
                                    Experiment with assessment scores and observe live NBA level derivation and weighted percentage scaling.
                                </p>
                            </div>

                            {/* Assessment Type Switch */}
                            <div className="flex items-center gap-1.5 bg-black/40 p-1.5 rounded-xl border border-white/10 text-xs">
                                {(["IA", "UT", "AS"] as const).map(type => (
                                    <button
                                        key={type}
                                        onClick={() => setSimType(type)}
                                        className={`px-3 py-1.5 rounded-lg font-bold transition-all ${simType === type ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/40" : "text-gray-400 hover:text-white"}`}
                                    >
                                        {type === "IA" ? "Internal Exam" : type === "UT" ? "Unit Test (15%)" : "Assignment (25%)"}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Interactive Slider & Live Output */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center pt-2">
                            {/* Slider Column */}
                            <div className="md:col-span-2 space-y-3 bg-white/[0.04] p-5 rounded-2xl border border-white/10">
                                <div className="flex justify-between items-center text-sm font-semibold">
                                    <span className="text-gray-300">Class Pass Rate (% of students scoring &ge; 60% in CO):</span>
                                    <span className="text-xl font-mono font-black text-cyan-300">{simScore}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={simScore}
                                    onChange={(e) => setSimScore(Number(e.target.value))}
                                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                />
                                <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                                    <span>0% (L0)</span>
                                    <span>60% (L1)</span>
                                    <span>70% (L2)</span>
                                    <span>80%+ (L3)</span>
                                </div>
                            </div>

                            {/* Live Badge Column */}
                            <div className={`p-5 rounded-2xl border ${simResult.color} space-y-2 flex flex-col justify-center text-center shadow-lg transition-all`}>
                                <div className="text-3xl font-black font-mono tracking-wider">
                                    {simResult.level}
                                </div>
                                <div className="text-xs font-bold leading-tight">
                                    {simResult.label}
                                </div>
                                <div className="text-[10px] font-mono text-gray-300/80 pt-1 border-t border-white/10">
                                    {weights[simType].formula}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Key Feature Highlights ────────────────────────────────── */}
                    <div className="space-y-6">
                        <div className="text-center space-y-2">
                            <h2 className="text-2xl sm:text-3xl font-black text-white">
                                Engineered for Complete NBA Accreditation Excellence
                            </h2>
                            <p className="text-xs sm:text-sm text-gray-400">
                                Built specifically for autonomous engineering colleges adhering to AICTE / NBA R23 regulations.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="p-6 rounded-3xl bg-white/[0.04] border border-white/10 backdrop-blur-md space-y-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-black">
                                    <FileSpreadsheet className="w-5 h-5" />
                                </div>
                                <h4 className="font-bold text-white text-base">Instant Multi-Sheet ExcelJS</h4>
                                <p className="text-xs text-gray-400 leading-relaxed">
                                    Generate 5-sheet formatted workbooks with institutional banners, question blueprints, and summary metrics.
                                </p>
                            </div>

                            <div className="p-6 rounded-3xl bg-white/[0.04] border border-white/10 backdrop-blur-md space-y-3">
                                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-black">
                                    <Layers className="w-5 h-5" />
                                </div>
                                <h4 className="font-bold text-white text-base">Relative Rubric Engine</h4>
                                <p className="text-xs text-gray-400 leading-relaxed">
                                    96 Performance Indicators across 14 outcomes with automatic relative third threshold grading.
                                </p>
                            </div>

                            <div className="p-6 rounded-3xl bg-white/[0.04] border border-white/10 backdrop-blur-md space-y-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
                                    <CheckCircle2 className="w-5 h-5" />
                                </div>
                                <h4 className="font-bold text-white text-base">Top-3 UT & Assignment Weighting</h4>
                                <p className="text-xs text-gray-400 leading-relaxed">
                                    Automatic student-wise best-of-3 unit test selection and formula integration across all continuous assessments.
                                </p>
                            </div>
                        </div>
                    </div>

                </main>

                {/* ── Footer ────────────────────────────────────────────────── */}
                <footer className="border-t border-white/10 bg-[#060814]/80 backdrop-blur-xl py-8 px-4 sm:px-8 text-center text-xs text-gray-500 space-y-3">
                    <div className="flex flex-wrap items-center justify-center gap-6 font-medium text-gray-400">
                        <Link href="/dashboard" className="hover:text-white transition-colors">Assessment Dashboard</Link>
                        <Link href="/mapping" className="hover:text-white transition-colors">CO-PO Matrix</Link>
                        <Link href="/attainment" className="hover:text-white transition-colors">Direct Attainment</Link>
                        <Link href="/admin" className="hover:text-white transition-colors">Admin Portal</Link>
                    </div>
                    <p>
                        © {new Date().getFullYear()} Panimalar Engineering College • Department of Artificial Intelligence and Data Science.
                    </p>
                </footer>
            </div>
        </div>
    );
}
