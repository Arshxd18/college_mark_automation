"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, ShieldCheck, AlertCircle } from "lucide-react";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();

    const ALLOWED_EMAILS = ["joshi@pec.in", "arshad@pec.in"];

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (ALLOWED_EMAILS.includes(email.trim().toLowerCase())) {
            localStorage.setItem("co_auth_user", email.trim().toLowerCase());
            router.push("/");
        } else {
            setError("Access verification failed. Authorized personnel only.");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 relative overflow-hidden font-sans">
            {/* Background Decorations */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-200/40 rounded-full blur-3xl" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-200/40 rounded-full blur-3xl" />

            <div className="w-full max-w-md p-8 relative z-10 animate-in fade-in zoom-in duration-500">
                <div className="bg-white/70 backdrop-blur-xl border border-white/50 shadow-2xl rounded-2xl p-8">

                    <div className="flex flex-col items-center mb-8">
                        <div className="p-4 bg-white/80 rounded-2xl shadow-lg shadow-indigo-500/10 mb-4 backdrop-blur-sm">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src="/clg_logo.png"
                                alt="College Logo"
                                className="w-16 h-16 object-contain"
                            />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Admin Portal</h1>
                        <p className="text-sm text-gray-500 font-medium mt-1">SECURED ACCESS REQUIRED</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                                Institutional Email ID
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <ShieldCheck className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl bg-white/50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-medium text-gray-900 placeholder-gray-400"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg bg-red-50 border border-red-100 flex items-center gap-2 text-sm text-red-600 animate-in fade-in slide-in-from-top-1">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-indigo-500/20 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all transform hover:-translate-y-0.5"
                        >
                            VERIFY IDENTITY
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                        <p className="text-xs text-gray-400">
                            Restricted to Dept of AI&DS Faculty
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
