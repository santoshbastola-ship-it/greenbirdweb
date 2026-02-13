"use client";

import { useState, useEffect } from "react";
import { UserService } from "@/services/user.service";

// Shared cache for user names to minimize Firestore hits
const nameCache: { [id: string]: string } = {};
const pendingRequests: { [id: string]: Promise<string | null>[] } = {};

interface UserNameProps {
    nameOrId: string | null | undefined;
    fallback?: string;
    className?: string;
}

export default function UserName({ nameOrId, fallback = "Admin", className = "" }: UserNameProps) {
    const [displayName, setDisplayName] = useState<string>(() => {
        if (!nameOrId) return fallback;
        if (nameCache[nameOrId]) return nameCache[nameOrId];
        return nameOrId; // Default to showing the string itself (might be a name already)
    });

    useEffect(() => {
        if (!nameOrId) return;

        // If it's already in cache, we're done
        if (nameCache[nameOrId]) {
            setDisplayName(nameCache[nameOrId]);
            return;
        }

        // Logic to determine if it's likely a UID (usually 28 characters for Firebase)
        const isLikelyUid = nameOrId.length >= 20 && !nameOrId.includes(" ");

        if (!isLikelyUid) {
            return;
        }

        // Fetch name for the ID
        const fetchName = async () => {
            try {
                // Check if there's already a pending request for this ID
                if (pendingRequests[nameOrId]) {
                    const result = await new Promise<string | null>((resolve) => {
                        pendingRequests[nameOrId].push(resolve as any);
                    });
                    if (result) setDisplayName(result);
                    return;
                }

                // First request for this ID
                pendingRequests[nameOrId] = [];
                const user = await UserService.getUserById(nameOrId);
                const name = user?.name || fallback;

                nameCache[nameOrId] = name;
                setDisplayName(name);

                // Resolve all pending requests
                const callers = pendingRequests[nameOrId];
                delete pendingRequests[nameOrId];
                callers.forEach((resolve: any) => resolve(name));

            } catch (error) {
                console.error(`Error resolving user name for ${nameOrId}:`, error);
                // Keep the ID as fallback if error
            }
        };

        fetchName();
    }, [nameOrId, fallback]);

    return <span className={className}>{displayName}</span>;
}
