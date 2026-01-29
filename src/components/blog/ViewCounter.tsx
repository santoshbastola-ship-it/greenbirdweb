"use client";

import { useEffect } from "react";
import { BlogService } from "@/services/blog.service";

export default function ViewCounter({ postId }: { postId: string }) {
    useEffect(() => {
        // Increment view count on mount
        // We use a simple effect here. In a stricter production app, we might want to debounce or check session storage 
        // to prevent double counting on reload, but for this use case, simple counting is fine.
        if (postId) {
            BlogService.incrementViews(postId);
        }
    }, [postId]);

    return null; // This component is invisible
}
