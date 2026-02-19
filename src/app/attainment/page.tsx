import AuthGuard from "@/components/AuthGuard";
import AttainmentDashboard from "@/components/AttainmentDashboard";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata = {
    title: "CO Attainment | CO Automation System",
    description: "Calculate CO attainment levels for batch-wise assessments.",
};

export default function AttainmentPage() {
    return (
        <AuthGuard>
            <div className="min-h-screen flex flex-col font-sans bg-gray-50">
                <Header />
                <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                    <div className="mb-8">
                        <h1 className="text-2xl font-extrabold text-gray-900">CO Attainment</h1>
                        <p className="text-gray-500 text-sm mt-1">
                            Select a batch and subject to compute Internal, Direct, and Final CO Attainment.
                        </p>
                    </div>
                    <AttainmentDashboard />
                </main>
                <Footer />
            </div>
        </AuthGuard>
    );
}
