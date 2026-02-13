'use client';

import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export default function OfflinePage() {
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        setIsOnline(navigator.onLine);

        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    useEffect(() => {
        if (isOnline) {
            // Redirect to home when back online
            window.location.href = '/';
        }
    }, [isOnline]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-cream dark:bg-gray-900 p-4">
            <div className="max-w-md w-full text-center">
                <div className="mb-6 flex justify-center">
                    <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                        <WifiOff className="w-12 h-12 text-gray-400" />
                    </div>
                </div>

                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                    You're Offline
                </h1>

                <p className="text-gray-600 dark:text-gray-300 mb-6">
                    It looks like you've lost your internet connection. Please check your network settings and try again.
                </p>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                    <h2 className="font-semibold text-gray-900 dark:text-white mb-3">
                        What you can do:
                    </h2>
                    <ul className="text-left text-sm text-gray-600 dark:text-gray-300 space-y-2">
                        <li className="flex items-start gap-2">
                            <span className="text-forest-green font-bold">•</span>
                            <span>Check your WiFi or mobile data connection</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-forest-green font-bold">•</span>
                            <span>Try turning airplane mode off</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-forest-green font-bold">•</span>
                            <span>Previously visited pages may still be available</span>
                        </li>
                    </ul>
                </div>

                <button
                    onClick={() => window.location.reload()}
                    className="mt-6 px-6 py-3 bg-forest-green text-white rounded-lg hover:bg-forest-green-dark transition-colors font-medium"
                >
                    Try Again
                </button>
            </div>
        </div>
    );
}
