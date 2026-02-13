"use client";

import { Share2, Link as LinkIcon, Check, Facebook, Twitter, Phone } from "lucide-react";
import { useState } from "react";

interface ShareButtonProps {
    title: string;
    text: string;
    url?: string;
    className?: string;
}

export default function ShareButton({ title, text, url, className = "" }: ShareButtonProps) {
    const [showOptions, setShowOptions] = useState(false);
    const [copied, setCopied] = useState(false);

    const getUrl = () => {
        if (url) return url;
        if (typeof window !== 'undefined') return window.location.href;
        return '';
    };

    const handleShare = async () => {
        const shareUrl = getUrl();
        if (typeof navigator !== 'undefined' && navigator.share) {
            try {
                await navigator.share({
                    title,
                    text,
                    url: shareUrl
                });
            } catch (error) {
                console.error("Error sharing:", error);
            }
        } else {
            setShowOptions(!showOptions);
        }
    };

    const copyToClipboard = () => {
        if (typeof navigator !== 'undefined') {
            navigator.clipboard.writeText(getUrl());
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            setTimeout(() => setShowOptions(false), 1000);
        }
    };

    const shareToSocial = (platform: 'facebook' | 'twitter' | 'whatsapp') => {
        const urlToShare = getUrl();
        const encodedUrl = encodeURIComponent(urlToShare);
        const encodedText = encodeURIComponent(text);

        let socialShareUrl = '';

        switch (platform) {
            case 'facebook':
                socialShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
                break;
            case 'twitter':
                socialShareUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
                break;
            case 'whatsapp':
                socialShareUrl = `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
                break;
        }

        window.open(socialShareUrl, '_blank', 'noopener,noreferrer');
        setShowOptions(false);
    };

    return (
        <div className={`relative inline-block text-left ${className}`}>

            {showOptions && (
                <div className="fixed inset-0 z-40 cursor-default" onClick={() => setShowOptions(false)} />
            )}

            <button
                onClick={handleShare}
                className="p-2.5 rounded-full bg-white/10 dark:bg-gray-800/10 hover:bg-green-50 dark:hover:bg-green-900/30 text-gray-600 dark:text-gray-300 hover:text-green-700 dark:hover:text-green-400 transition-all border border-transparent hover:border-green-100 dark:hover:border-green-900 shadow-sm hover:shadow"
                title="Share"
                aria-label="Share"
            >
                <Share2 className="w-5 h-5" />
            </button>

            {showOptions && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl ring-1 ring-black ring-opacity-5 dark:ring-white dark:ring-opacity-10 py-2 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right border border-gray-100 dark:border-gray-700">
                    <button
                        onClick={() => shareToSocial('whatsapp')}
                        className="w-full text-left px-4 py-3 hover:bg-green-50 dark:hover:bg-green-900/20 text-sm text-gray-700 dark:text-gray-300 flex items-center gap-3 transition-colors"
                    >
                        <Phone className="w-5 h-5 text-green-600 dark:text-green-400" />
                        <span className="font-medium">WhatsApp</span>
                    </button>
                    <button
                        onClick={() => shareToSocial('facebook')}
                        className="w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-sm text-gray-700 dark:text-gray-300 flex items-center gap-3 transition-colors"
                    >
                        <Facebook className="w-5 h-5 text-blue-600 dark:text-blue-500" />
                        <span className="font-medium">Facebook</span>
                    </button>
                    <button
                        onClick={() => shareToSocial('twitter')}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-300 flex items-center gap-3 transition-colors"
                    >
                        <Twitter className="w-5 h-5 text-sky-500 dark:text-sky-400" />
                        <span className="font-medium">X (Twitter)</span>
                    </button>
                    <div className="h-px bg-gray-100 dark:bg-gray-700 my-1" />
                    <button
                        onClick={copyToClipboard}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-300 flex items-center gap-3 transition-colors"
                    >
                        {copied ? (
                            <>
                                <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                                <span className="text-green-600 dark:text-green-400 font-medium">Copied!</span>
                            </>
                        ) : (
                            <>
                                <LinkIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                                <span className="font-medium">Copy Link</span>
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}
