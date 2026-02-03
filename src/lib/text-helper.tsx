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
