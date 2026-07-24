import AdminDashboard from "@/components/AdminDashboard";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AuthGuard from "@/components/AuthGuard";
import { ShieldCheck } from "lucide-react";

export const metadata = {
    title: "Admin Analytics | CO Automation",
    description: "Year-wise and section-wise CO attainment analytics for administrators.",
};

export default function AdminPage() {
    return (
        <AuthGuard>
            <div className="min-h-screen flex flex-col font-sans bg-gray-50">
                <Header />
                <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="bg-indigo-100 p-2 rounded-xl">
                                <ShieldCheck className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Admin Analytics</h1>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    View and compare CO attainment data by academic year, batch, subject, section, and faculty.
                                </p>
                            </div>
                        </div>
                    </div>
                    <AdminDashboard />
                </main>
                <Footer />
            </div>
        </AuthGuard>
    );
}
