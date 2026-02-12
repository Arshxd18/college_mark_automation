"use client";

import React from "react";
import { Github, Heart } from "lucide-react";

export default function Footer() {
    return (
        <footer className="bg-white border-t border-gray-200 py-8 mt-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">

                    {/* Developer Credit */}
                    <div className="flex flex-col items-center md:items-start space-y-2">
                        <p className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                            Designed and Developed by
                            <a
                                href="https://github.com/Arshxd18"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-600 hover:underline flex items-center gap-1 ml-1"
                            >
                                MOHAMED ARSHAD <Github className="w-3 h-3" />
                            </a>
                        </p>
                        <p className="text-xs text-gray-500">
                            Crafted with care for efficient academic assessment.
                        </p>
                        <p className="text-[10px] text-gray-400 italic">
                            Start an issue on GitHub if any bug is found.
                        </p>
                    </div>

                    {/* Team & Mentor */}
                    <div className="flex flex-col items-center md:items-end space-y-3 text-right">
                        <div className="text-sm text-gray-700">
                            <span className="font-bold text-gray-900 block mb-0.5">Team</span>
                            Diyanth K • Hari Vishnu KC • Mohanakumaran
                        </div>
                        <div className="text-sm text-gray-700 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">
                            <span className="font-bold text-indigo-900 mr-2">Mentored by</span>
                            Dr. A. Joshi M.E., Ph.D.
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
