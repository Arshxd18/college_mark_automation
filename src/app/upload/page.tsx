"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Calculator } from "lucide-react";
import UploadAnalyzer from "@/components/UploadAnalyzer";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AuthGuard from "@/components/AuthGuard";

export default function UploadPage() {
    return (
        <AuthGuard>
            <div className="min-h-screen flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900 bg-gray-50">
                <Header />

                <div className="bg-white/60 backdrop-blur-sm border-b border-gray-100 sticky top-20 z-40">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Dashboard
                        </Link>
                    </div>
                </div>

                <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900">Upload Analyzer</h2>
                        <p className="text-gray-500">Automated Course Outcome Calculation from Excel Templates</p>
                    </div>
                    <UploadAnalyzer />
                </main>

                <Footer />
            </div>
        </AuthGuard>
    );
}
