"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

const ALLOWED_EMAILS = ["joshi@pec.in", "arshad@pec.in"];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        // Skip check for login page
        if (pathname === "/login") {
            setAuthorized(true);
            return;
        }

        // Check local storage
        const user = localStorage.getItem("co_auth_user");

        if (user && ALLOWED_EMAILS.includes(user)) {
            setAuthorized(true);
        } else {
            // Not authenticated, redirect to login
            setAuthorized(false);
            router.push("/login");
        }
    }, [pathname, router]);

    // Show nothing while checking (or a spinner)
    if (!authorized && pathname !== "/login") {
        return null;
    }

    return <>{children}</>;
}
