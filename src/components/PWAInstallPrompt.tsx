'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showInstallPrompt, setShowInstallPrompt] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
    const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

    useEffect(() => {
        // Check if running in standalone mode
        const standalone = window.matchMedia('(display-mode: standalone)').matches;
        setIsStandalone(standalone);

        // Check if iOS
        const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
        setIsIOS(ios);

        // Check if user has previously dismissed the prompt
        const dismissed = localStorage.getItem('pwa-install-dismissed');
        const dismissedTime = dismissed ? parseInt(dismissed) : 0;
        const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);

        // Show iOS prompt if on iOS, not standalone, and not recently dismissed
        if (ios && !standalone && daysSinceDismissed > 7) {
            setShowInstallPrompt(true);
        }

        // Listen for the beforeinstallprompt event (Chrome, Edge, etc.)
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            const promptEvent = e as BeforeInstallPromptEvent;
            setDeferredPrompt(promptEvent);

            // Show prompt if not recently dismissed
            if (daysSinceDismissed > 7) {
                setShowInstallPrompt(true);
            }
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Listen for service worker updates
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then((reg) => {
                setRegistration(reg);

                reg.addEventListener('updatefound', () => {
                    const newWorker = reg.installing;
                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                setShowUpdatePrompt(true);
                            }
                        });
                    }
                });
            });

            // Handle controller change (reload after skipWaiting)
            let refreshing = false;
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (!refreshing) {
                    refreshing = true;
                    window.location.reload();
                }
            });
        }

        // Listen for successful installation
        window.addEventListener('appinstalled', () => {
            setShowInstallPrompt(false);
            setDeferredPrompt(null);
            localStorage.removeItem('pwa-install-dismissed');
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleUpdate = () => {
        if (registration?.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        } else {
            // Fallback for some browsers
            window.location.reload();
        }
    };

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        await deferredPrompt.prompt();

        // Wait for the user's response
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        } else {
            console.log('User dismissed the install prompt');
        }

        // Clear the deferred prompt
        setDeferredPrompt(null);
        setShowInstallPrompt(false);
    };

    const handleDismiss = () => {
        setShowInstallPrompt(false);
        localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    };

    // Service Worker Update Prompt (highest priority)
    if (showUpdatePrompt) {
        return (
            <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-green-600 text-white rounded-lg shadow-xl p-4 z-[100] animate-slide-up border border-green-500">
                <div className="flex items-center gap-4">
                    <div className="flex-1">
                        <h3 className="font-bold text-lg">Update Available!</h3>
                        <p className="text-sm opacity-90">
                            A new version of Greenbird Homestead is ready.
                        </p>
                    </div>
                    <button
                        onClick={handleUpdate}
                        className="px-4 py-2 bg-white text-green-700 rounded-lg hover:bg-green-50 transition-colors text-sm font-bold shadow-sm"
                    >
                        Refresh Now
                    </button>
                    <button
                        onClick={() => setShowUpdatePrompt(false)}
                        className="p-1 hover:bg-green-700 rounded-lg transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>
        );
    }

    // Don't show anything if already installed or if prompt is dismissed
    if (isStandalone || !showInstallPrompt) {
        return null;
    }

    // iOS Install Instructions
    if (isIOS) {
        return (
            <div className="fixed bottom-0 left-0 right-0 bg-forest-green text-white p-4 shadow-lg z-50 animate-slide-up">
                <div className="max-w-4xl mx-auto flex items-start gap-3">
                    <div className="flex-1">
                        <h3 className="font-semibold mb-1">Install Greenbird Homestead</h3>
                        <p className="text-sm text-cream opacity-90 mb-2">
                            Install this app on your iPhone: tap{' '}
                            <svg
                                className="inline-block w-4 h-4 mx-1"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z" />
                            </svg>{' '}
                            and then <strong>Add to Home Screen</strong>
                        </p>
                    </div>
                    <button
                        onClick={handleDismiss}
                        className="text-cream hover:text-white transition-colors"
                        aria-label="Dismiss install prompt"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>
        );
    }

    // Chrome/Edge Install Prompt
    if (deferredPrompt) {
        return (
            <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 z-50 animate-slide-up">
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                        <img
                            src="/icons/icon-72x72.png"
                            alt="Greenbird Homestead"
                            className="w-12 h-12 rounded-lg"
                        />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                            Install Greenbird Homestead
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                            Install our app for a faster experience and offline access
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={handleInstallClick}
                                className="px-4 py-2 bg-forest-green text-white rounded-lg hover:bg-forest-green-dark transition-colors text-sm font-medium"
                            >
                                Install
                            </button>
                            <button
                                onClick={handleDismiss}
                                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                            >
                                Not now
                            </button>
                        </div>
                    </div>
                    <button
                        onClick={handleDismiss}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                        aria-label="Dismiss"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>
        );
    }

    return null;
}
