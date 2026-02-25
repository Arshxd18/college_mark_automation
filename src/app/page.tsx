import Dashboard from "@/components/Dashboard";
import AuthGuard from "@/components/AuthGuard";
import { update } from "firebase/database";
import { i } from "framer-motion/client";
import { Theater } from "lucide-react";

export default function Home() {
  return (
    <AuthGuard>
      <Dashboard />
    </AuthGuard>
  );
}

