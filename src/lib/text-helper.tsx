import React, { ReactNode } from 'react';

/**
 * Formats a product description string into React nodes.
 * Supports:
 * - **text** for bold text
 * - Newlines are preserved as paragraphs or line breaks
 * 
 * @param description The raw description string
 * @returns ReactNode array
 */
export function formatProductDescription(description: string): ReactNode {
    if (!description) return null;

    return description.split('\n').map((line, index) => {
        // If line is empty string, render a break/spacer
        if (line.trim() === '') {
            return <div key={index} className="h-4" />;
        }

        // Parse **bold** syntax using simple regex split
        // Split by markers and map
        const parts = line.split(/(\*\*.*?\*\*)/g);

        return (
            <p key={index} className="mb-1 last:mb-0">
                {parts.map((part, i) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                        return (
                            <strong key={i} className="font-bold text-gray-900">
                                {part.slice(2, -2)}
                            </strong>
                        );
                    }
                    return part;
                })}
            </p>
        );
    });
}

/**
 * Formats a string into React nodes, detecting and making URLs clickable.
 * Also preserves newlines.
 * 
 * @param text The raw text string
 * @returns ReactNode array
 */
export function formatTextWithLinks(text: string): ReactNode {
    if (!text) return null;

    // Split by newlines first to preserve paragraph structure
    return text.split('\n').map((line, lineIndex) => {
        if (line.trim() === '') {
            return <div key={lineIndex} className="h-4" />;
        }

        // Regex to detect URLs (simple version)
        // This regex matches http://, https://, or www. followed by non-whitespace characters
        const urlRegex = /((?:https?:\/\/|www\.)[^\s]+)/g;

        const parts = line.split(urlRegex);

        return (
            <p key={lineIndex} className="mb-1 last:mb-0">
                {parts.map((part, partIndex) => {
                    if (part.match(urlRegex)) {
                        let href = part;
                        if (!href.startsWith('http://') && !href.startsWith('https://')) {
                            href = `https://${href}`;
                        }
                        return (
                            <a
                                key={partIndex}
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline break-all"
                                onClick={(e) => e.stopPropagation()} // Prevent triggering row click if any
                            >
                                {part}
                            </a>
                        );
                    }
                    return <span key={partIndex}>{part}</span>;
                })}
            </p>
        );
    });
}
