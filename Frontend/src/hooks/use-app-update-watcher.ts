import { useEffect, useState } from "react";
import pkg from "../../package.json";

const POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes

interface UpdateState {
    updateAvailable: boolean;
    serverVersion?: string;
}

/**
 * Simple semver-like comparison
 * Returns true if server version is strictly greater than client version
 */
function isNewer(server?: string, client?: string): boolean {
    if (!server || !client) return false;
    if (server === client) return false;

    const sParts = server.split('.').map(part => parseInt(part, 10));
    const cParts = client.split('.').map(part => parseInt(part, 10));

    for (let i = 0; i < Math.max(sParts.length, cParts.length); i++) {
        const s = sParts[i] || 0;
        const c = cParts[i] || 0;
        if (s > c) return true;
        if (s < c) return false;
    }
    return false;
}

// Polls /api/app-build and compares the latest APPROVED version from DB
// with the version baked into this client's bundle.
export function useAppUpdateWatcher() {
    const [state, setState] = useState<UpdateState>({ updateAvailable: false });

    useEffect(() => {
        // Skip polling in local dev — builds change on every save
        if (process.env.NODE_ENV === "development") return;

        async function check() {
            try {
                const res = await fetch("/api/app-build", { cache: "no-store" });
                if (!res.ok) return;
                const { latestApprovedVersion } = await res.json();

                // Compare client version (from package.json) with latest approved version from DB
                // If DB has a newer approved version, show the banner
                if (isNewer(latestApprovedVersion, pkg.version)) {
                    setState({ updateAvailable: true, serverVersion: latestApprovedVersion });
                } else {
                    // If no longer newer (e.g. user refreshed or version was reverted), hide banner
                    setState({ updateAvailable: false });
                }
            } catch { /* silent — non-critical */ }
        }

        // Check once on load
        check();

        const interval = setInterval(check, POLL_INTERVAL);
        return () => clearInterval(interval);
    }, []);

    return state;
}
