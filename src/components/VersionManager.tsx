'use client';

import { useState } from 'react';

interface VersionManagerProps {
    className?: string;
}

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || '0.1.3';

export function VersionManager({ className }: VersionManagerProps) {
    const [tapCount, setTapCount] = useState(0);

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

                // 3. Clear local storage that might be blocking updates
                localStorage.removeItem('pwa-install-dismissed');

                // 4. Force reload from server
                window.location.reload();
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
            title="Tap 5 times to force update"
        >
            v{APP_VERSION}
        </span>
    );
}
