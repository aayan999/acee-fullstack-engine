import { useState, useEffect, useRef } from 'react';

const API_URL = `${import.meta.env.VITE_API_URL || ''}/api/v1/health`;
const KEEP_ALIVE_INTERVAL = 5 * 60 * 1000; // Ping every 5 minutes
const BANNER_HIDE_DELAY = 2000;             // Show "ready" banner for 2s

/**
 * Pings the backend health endpoint on mount and every 5 minutes.
 * Shows a "Waking up server..." banner until the first successful response.
 */
export function useServerWakeUp() {
    const [isWaking, setIsWaking] = useState(true);
    const [isServerUp, setIsServerUp] = useState(false);
    const intervalRef = useRef(null);

    useEffect(() => {
        let mounted = true;

        const ping = async () => {
            try {
                const res = await fetch(API_URL, { method: 'GET' });
                if (res.ok && mounted) {
                    setIsServerUp(true);
                    // Hide the banner after a short delay
                    setTimeout(() => {
                        if (mounted) setIsWaking(false);
                    }, BANNER_HIDE_DELAY);
                }
            } catch {
                // Server still waking up — keep trying
            }
        };

        // Initial ping
        ping();

        // Keep-alive interval (prevents Render from sleeping)
        intervalRef.current = setInterval(ping, KEEP_ALIVE_INTERVAL);

        return () => {
            mounted = false;
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    return { isWaking, isServerUp };
}
