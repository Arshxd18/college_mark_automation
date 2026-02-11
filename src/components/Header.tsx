"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Calculator, Upload, LayoutDashboard, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Header() {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = () => {
        // Clear auth state
        localStorage.removeItem("co_auth_user");
        // Redirect to login
        router.push("/login");
    };

    return (
        <header className="glass-header shadow-sm border-b border-white/50 backdrop-blur-xl sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                {/* Logo & College Name */}
                <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src="/clg_logo.png"
                            alt="College Logo"
                            className="w-12 h-12 object-contain filter drop-shadow-sm"
                        />
                    </div>
                    <div>
                        <h1 className="text-sm md:text-lg font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-900 to-indigo-700 uppercase tracking-tight leading-tight">
                            Panimalar Engineering College
                        </h1>
                        <p className="text-[10px] md:text-xs text-indigo-600 font-bold tracking-widest uppercase">
                            Dept of AI&DS
                        </p>
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex items-center gap-4">
                    {pathname === "/upload" ? (
                        <Link
                            href="/"
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-100/50 rounded-lg transition-all"
                        >
                            <LayoutDashboard className="w-4 h-4" />
                            <span className="hidden sm:inline">Dashboard</span>
                        </Link>
                    ) : (
                        <Link
                            href="/upload"
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow transition-all hover:-translate-y-0.5"
                        >
                            <Upload className="w-4 h-4" />
                            <span className="hidden sm:inline">Upload Analyzer</span>
                        </Link>
                    )}

                    {/* Logout Button */}
                    <button
                        onClick={handleLogout}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Logout"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </header>
    );
}
