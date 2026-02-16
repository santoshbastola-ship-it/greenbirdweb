'use client';

import { useState, useEffect } from 'react';

interface VersionManagerProps {
    className?: string;
}

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || '0.1.3';
const BUILD_TIME = new Date().toLocaleString();

export function VersionManager({ className }: VersionManagerProps) {
    const [tapCount, setTapCount] = useState(0);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleTap = () => {
        const newCount = tapCount + 1;
        setTapCount(newCount);

        if (newCount >= 5) {
            handleForceRefresh();
        }

        // Reset count after 3 seconds of inactivity
        setTimeout(() => setTapCount(0), 3000);
    };

    const handleForceRefresh = async () => {
        if (confirm('Force update Greenbird app? This will clear the local cache and reload.')) {
            try {
                // 1. Unregister all service workers
                if ('serviceWorker' in navigator) {
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    for (const registration of registrations) {
                        await registration.unregister();
                    }
                }

                // 2. Clear all caches
                if ('caches' in window) {
                    const cacheNames = await caches.keys();
                    for (const name of cacheNames) {
                        await caches.delete(name);
                    }
                }

                // 3. Clear all storage
                localStorage.clear();
                sessionStorage.clear();

                // 4. Force reload from server with cache busting
                const url = new URL(window.location.href);
                url.searchParams.set('v', Date.now().toString());
                window.location.href = url.toString();
            } catch (error) {
                console.error('Failed to force refresh:', error);
                window.location.reload();
            }
        }
    };

    return (
        <span
            onClick={handleTap}
            className={`${className} cursor-pointer select-none active:opacity-50`}
            title={mounted ? `Build: ${BUILD_TIME}. Tap 5 times to force update` : undefined}
        >
            v{APP_VERSION}
        </span>
    );
}
