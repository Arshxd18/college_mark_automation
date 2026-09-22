"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
    LayoutDashboard, 
    Layers, 
    ArrowRight, 
    CheckCircle2,
    FileSpreadsheet,
    ShieldCheck,
    Network,
    TrendingUp,
    Github
} from "lucide-react";
import { LightTunnel, StrokeText, ShinyText, FuseButton } from "@/components/3d";

export default function LandingPage() {
    const router = useRouter();
    const [simScore, setSimScore] = useState<number>(76);
    const [simType, setSimType] = useState<"IA" | "UT" | "AS">("UT");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Calculate simulated attainment based on slider with soft, calm styling
    const getSimulatedLevel = (score: number) => {
        if (score >= 80) return { level: "L3", label: "Level 3 (High Attainment)", color: "text-emerald-300 border-emerald-500/20 bg-emerald-950/30" };
        if (score >= 70) return { level: "L2", label: "Level 2 (Medium Attainment)", color: "text-indigo-300 border-indigo-500/20 bg-indigo-950/30" };
        if (score >= 60) return { level: "L1", label: "Level 1 (Low Attainment)", color: "text-amber-300 border-amber-500/20 bg-amber-950/30" };
        return { level: "L0", label: "Level 0 (Unattained / Remedial)", color: "text-rose-300 border-rose-500/20 bg-rose-950/30" };
    };

    const simResult = getSimulatedLevel(simScore);

    const weights = {
        IA: { label: "Internal Exam", weight: "60%", formula: "((Marks / Max) × 100%)" },
        UT: { label: "Unit Test (Best of 3)", weight: "15%", formula: "((Marks / 40) × 15%) × 100" },
        AS: { label: "Assignment", weight: "25%", formula: "((Marks / 10) × 25%) × 100" },
    };

    return (
        <div className="relative min-h-screen bg-[#090D16] text-slate-200 selection:bg-indigo-900/60 selection:text-indigo-200 overflow-x-hidden font-sans">
            {/* ── 3D Light Tunnel Background (Soft, Calm & Cinematic) ────── */}
            <div className="fixed inset-0 z-0 pointer-events-auto opacity-55 transition-opacity duration-1000">
                <LightTunnel
                    cableColor="#6366F1"
                    pulseColor="#818CF8"
                    tunnelColor="#1E1B4B"
                    tunnelOpacity={0.12}
                    speed={0.08}
                    pulseSpeed={1.4}
                    cableCount={20}
                    glow={0.65}
                    brightness={0.85}
                    mouseInteraction={true}
                    mouseStrength={0.08}
                />
            </div>

            {/* Soft Ambient Depth Overlays */}
            <div className="fixed inset-0 z-1 pointer-events-none bg-gradient-to-b from-[#090D16]/90 via-[#090D16]/40 to-[#090D16] backdrop-blur-[0.5px]" />
            <div className="fixed inset-0 z-1 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/30 via-transparent to-transparent" />

            {/* ── Content Container (z-10) ──────────────────────────────────── */}
            <div className="relative z-10 flex flex-col min-h-screen">

                {/* ── Top Navigation Bar ────────────────────────────────────── */}
                <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#090D16]/80 border-b border-white/[0.06] px-4 sm:px-8 py-3.5 transition-all">
                    <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                        {/* Institutional Logo & Title (Logo box removed) */}
                        <div className="flex items-center gap-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src="/clg_logo.png"
                                alt="College Logo"
                                className="w-10 h-10 object-contain filter drop-shadow opacity-95"
                            />
                            <div>
                                <ShinyText
                                    text="Panimalar Engineering College"
                                    color="#E2E8F0"
                                    shineColor="#818CF8"
                                    speed={3}
                                    className="text-xs sm:text-sm font-semibold tracking-wide"
                                />
                                <p className="text-[10px] font-medium tracking-wider text-slate-400 uppercase">
                                    Dept of AI &amp; DS • NBA / AICTE R23 Suite
                                </p>
                            </div>
                        </div>

                        {/* Top Action - FuseButton to Dashboard */}
                        <div className="flex items-center gap-3">
                            <FuseButton
                                label="Go to Dashboard"
                                doneLabel="Opening..."
                                undoLabel="Cancel"
                                icon={<LayoutDashboard size={14} className="text-indigo-200" />}
                                size="sm"
                                color="#F8FAFC"
                                background="#4F46E5"
                                fuseColor="#818CF8"
                                radius={12}
                                undoWindow={1500}
                                onCommit={() => router.push('/dashboard')}
                                onFuseEnd={() => router.push('/dashboard')}
                            />
                        </div>
                    </div>
                </header>

                {/* ── Main Hero Section ─────────────────────────────────────── */}
                <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-16 w-full">

                    {/* Hero Header */}
                    <div className="text-center space-y-5 max-w-3xl mx-auto pt-4">

                        {/* Animated Stroke Text Headline */}
                        <div className="py-2">
                            {mounted ? (
                                <StrokeText
                                    text="AUTO ATTAIN R23"
                                    strokeColor="#6366F1"
                                    fillColor="#F8FAFC"
                                    strokeWidth={1.5}
                                    drawDuration={1.8}
                                    fillMode="wipe"
                                    fontSize={58}
                                    fontWeight={800}
                                    letterSpacing={-1}
                                    className="max-w-3xl mx-auto"
                                />
                            ) : (
                                <h1 className="text-4xl sm:text-5xl font-bold text-slate-100 tracking-tight">
                                    AUTO ATTAIN R23
                                </h1>
                            )}
                        </div>

                        {/* Subheadline */}
                        <p className="text-sm sm:text-base text-slate-300/90 font-normal max-w-2xl mx-auto leading-relaxed">
                            Continuous assessment calculations, relative rubric mapping, 96 Performance Indicator matrix, and NBA audit-ready multi-sheet Excel generation.
                        </p>

                        {/* Primary Dashboard CTA with FuseButton */}
                        <div className="flex items-center justify-center pt-3">
                            <FuseButton
                                label="Open Assessment Dashboard"
                                doneLabel="Opening..."
                                undoLabel="Cancel"
                                icon={<ArrowRight size={16} />}
                                size="lg"
                                color="#F8FAFC"
                                background="#4F46E5"
                                fuseColor="#818CF8"
                                radius={16}
                                undoWindow={2000}
                                onCommit={() => router.push('/dashboard')}
                                onFuseEnd={() => router.push('/dashboard')}
                            />
                        </div>
                    </div>

                    {/* ── Feature Portal Cards (All link exclusively to /dashboard) ── */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* 1. Assessment Entry */}
                        <Link
                            href="/dashboard"
                            className="group p-5 rounded-2xl bg-white/[0.025] hover:bg-white/[0.04] border border-white/[0.08] hover:border-indigo-500/30 backdrop-blur-md shadow-sm hover:-translate-y-1 transition-all space-y-3.5"
                        >
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center text-indigo-300 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                <LayoutDashboard className="w-5 h-5" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-semibold text-base text-slate-100 group-hover:text-indigo-200 transition-colors flex items-center justify-between">
                                    <span>Marks &amp; CO Entry</span>
                                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-indigo-300" />
                                </h3>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    Internal 1, Internal 2, Unit Tests, and Assignments with real-time continuous CO evaluation.
                                </p>
                            </div>
                            <div className="pt-1 flex items-center gap-1.5 text-[11px] font-medium text-indigo-300">
                                <span>Launch module →</span>
                            </div>
                        </Link>

                        {/* 2. CO-PO Articulation Matrix */}
                        <Link
                            href="/dashboard"
                            className="group p-5 rounded-2xl bg-white/[0.025] hover:bg-white/[0.04] border border-white/[0.08] hover:border-indigo-500/30 backdrop-blur-md shadow-sm hover:-translate-y-1 transition-all space-y-3.5"
                        >
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center text-indigo-300 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                <Network className="w-5 h-5" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-semibold text-base text-slate-100 group-hover:text-indigo-200 transition-colors flex items-center justify-between">
                                    <span>PO / PSO Mapping</span>
                                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-indigo-300" />
                                </h3>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    96 Performance Indicators across 14 program outcomes with relative grading logic and live matrix averaging.
                                </p>
                            </div>
                            <div className="pt-1 flex items-center gap-1.5 text-[11px] font-medium text-indigo-300">
                                <span>Launch module →</span>
                            </div>
                        </Link>

                        {/* 3. Attainment Analytics */}
                        <Link
                            href="/dashboard"
                            className="group p-5 rounded-2xl bg-white/[0.025] hover:bg-white/[0.04] border border-white/[0.08] hover:border-indigo-500/30 backdrop-blur-md shadow-sm hover:-translate-y-1 transition-all space-y-3.5"
                        >
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center text-indigo-300 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                <TrendingUp className="w-5 h-5" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-semibold text-base text-slate-100 group-hover:text-indigo-200 transition-colors flex items-center justify-between">
                                    <span>Direct &amp; Indirect</span>
                                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-indigo-300" />
                                </h3>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    Continuous weight pipeline: IA 60% + UT 15% + AS 25% → Direct 40% + SEE 60% → Final 90/10%.
                                </p>
                            </div>
                            <div className="pt-1 flex items-center gap-1.5 text-[11px] font-medium text-indigo-300">
                                <span>Launch module →</span>
                            </div>
                        </Link>

                        {/* 4. HOD & Admin Analytics */}
                        <Link
                            href="/dashboard"
                            className="group p-5 rounded-2xl bg-white/[0.025] hover:bg-white/[0.04] border border-white/[0.08] hover:border-indigo-500/30 backdrop-blur-md shadow-sm hover:-translate-y-1 transition-all space-y-3.5"
                        >
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center text-indigo-300 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-semibold text-base text-slate-100 group-hover:text-indigo-200 transition-colors flex items-center justify-between">
                                    <span>Administration</span>
                                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-indigo-300" />
                                </h3>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    Faculty assessment distribution, multi-section performance, and complete audit Excel downloads.
                                </p>
                            </div>
                            <div className="pt-1 flex items-center gap-1.5 text-[11px] font-medium text-indigo-300">
                                <span>Launch module →</span>
                            </div>
                        </Link>
                    </div>

                    {/* ── Attainment Level Threshold Guide Widget ────────────────── */}
                    <div className="p-6 sm:p-7 rounded-2xl bg-white/[0.02] border border-white/[0.08] backdrop-blur-xl shadow-sm space-y-5">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <ShinyText
                                    text="NBA Attainment Level Guide & Formula"
                                    color="#F1F5F9"
                                    shineColor="#818CF8"
                                    speed={2.8}
                                    className="text-base sm:text-lg font-semibold"
                                />
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Adjust target percentages to verify NBA level attainment and calculation weighting.
                                </p>
                            </div>

                            {/* Assessment Type Switch */}
                            <div className="flex items-center gap-1 bg-black/30 p-1 rounded-xl border border-white/[0.06] text-xs">
                                {(["IA", "UT", "AS"] as const).map(type => (
                                    <button
                                        key={type}
                                        onClick={() => setSimType(type)}
                                        className={`px-3 py-1 rounded-lg font-medium transition-all ${simType === type ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"}`}
                                    >
                                        {type === "IA" ? "Internal Exam" : type === "UT" ? "Unit Test (15%)" : "Assignment (25%)"}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Interactive Slider & Live Output */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center">
                            {/* Slider Column */}
                            <div className="md:col-span-2 space-y-2.5 bg-white/[0.02] p-4 rounded-xl border border-white/[0.06]">
                                <div className="flex justify-between items-center text-xs sm:text-sm font-medium">
                                    <span className="text-slate-300">Class Pass Percentage (% of students scoring &ge; 60% in CO):</span>
                                    <span className="text-base font-mono font-semibold text-indigo-300">{simScore}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={simScore}
                                    onChange={(e) => setSimScore(Number(e.target.value))}
                                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                />
                                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                                    <span>&lt;60% (L0)</span>
                                    <span>60% (L1)</span>
                                    <span>70% (L2)</span>
                                    <span>&ge;80% (L3)</span>
                                </div>
                            </div>

                            {/* Live Badge Column */}
                            <div className={`p-4 rounded-xl border ${simResult.color} space-y-1.5 flex flex-col justify-center text-center transition-all`}>
                                <div className="text-2xl font-bold font-mono">
                                    {simResult.level}
                                </div>
                                <div className="text-xs font-medium leading-tight">
                                    {simResult.label}
                                </div>
                                <div className="text-[10px] font-mono text-slate-400 pt-1 border-t border-white/[0.06]">
                                    {weights[simType].formula}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Key Feature Highlights ────────────────────────────────── */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-sm space-y-2.5">
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/15 text-indigo-300 flex items-center justify-center font-bold">
                                <FileSpreadsheet className="w-4 h-4" />
                            </div>
                            <h4 className="font-semibold text-slate-200 text-sm">Instant Multi-Sheet Excel</h4>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Generates comprehensive Excel workbooks with institutional headers, student blueprints, and final metrics.
                            </p>
                        </div>

                        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-sm space-y-2.5">
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/15 text-indigo-300 flex items-center justify-center font-bold">
                                <Layers className="w-4 h-4" />
                            </div>
                            <h4 className="font-semibold text-slate-200 text-sm">Relative Rubric Engine</h4>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                96 Performance Indicators across 14 outcomes with relative third threshold grading and live matrix aggregation.
                            </p>
                        </div>

                        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-sm space-y-2.5">
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/15 text-indigo-300 flex items-center justify-center font-bold">
                                <CheckCircle2 className="w-4 h-4" />
                            </div>
                            <h4 className="font-semibold text-slate-200 text-sm">Continuous Assessment Weighting</h4>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Automatic best-of-3 unit test selection and weighted formula integration across continuous assessments.
                            </p>
                        </div>
                    </div>

                </main>

                {/* ── Footer ────────────────────────────────────────────────── */}
                <footer className="border-t border-white/[0.06] bg-[#090D16]/90 backdrop-blur-xl py-6 px-4 sm:px-8 text-center text-xs text-slate-500 space-y-3">
                    <p className="text-[11px] text-slate-400">
                        &copy; {new Date().getFullYear()} Panimalar Engineering College &bull; Department of Artificial Intelligence and Data Science.
                    </p>
                    <div className="pt-1 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                        <span>Developed by</span>
                        <a
                            href="https://github.com/Arshxd18"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors"
                        >
                            <Github className="w-3.5 h-3.5 text-indigo-400" />
                            <ShinyText
                                text="Mohamed Arshad"
                                color="#CBD5E1"
                                shineColor="#818CF8"
                                speed={2.5}
                                className="font-medium hover:underline"
                            />
                        </a>
                    </div>
                </footer>
            </div>
        </div>
    );
}


