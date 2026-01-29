import { db, storage } from "@/lib/firebase";
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDocs,
    getDoc,
    query,
    orderBy,
    where,
    increment,
    Timestamp
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { BlogPost } from "@/types/extra";


const BLOG_COLLECTION = "blog_posts";

export const BlogService = {
    /**
     * Get all blog posts ordered by date descending
     */
    async getAllPosts(): Promise<BlogPost[]> {
        try {
            if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY === 'replace_me') {
                return [];
            }

            const blogRef = collection(db, BLOG_COLLECTION);
            const q = query(blogRef, orderBy("date", "desc"));
            const snapshot = await getDocs(q);

            const firestorePosts = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    date: data.date instanceof Timestamp ? data.date.toDate().toISOString() : data.date,
                    published: data.published ?? true, // Default to true for existing posts
                    views: data.views ?? 0
                } as BlogPost;
            });

            // Return only real posts
            return firestorePosts;
        } catch (error) {
            console.error("Error fetching blog posts:", error);
            return [];
        }
    },

    /**
     * Get all published blog posts ordered by date descending
     */
    async getPublishedPosts(): Promise<BlogPost[]> {
        try {
            if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY === 'replace_me') {
                return [];
            }

            const blogRef = collection(db, BLOG_COLLECTION);
            const q = query(
                blogRef,
                where("published", "==", true),
                orderBy("date", "desc")
            );
            const snapshot = await getDocs(q);

            const firestorePosts = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    date: data.date instanceof Timestamp ? data.date.toDate().toISOString() : data.date,
                    published: data.published ?? true,
                    views: data.views ?? 0
                } as BlogPost;
            });

            return firestorePosts;
        } catch (error) {
            console.error("Error fetching published blog posts:", error);
            // Fallback to client-side filtering if composite index is missing
            // This is a temporary measure until index is created
            const allPosts = await BlogService.getAllPosts();
            return allPosts.filter(p => p.published !== false);
        }
    },

    /**
     * Get a single blog post by slug
     */
    async getPostBySlug(slug: string): Promise<BlogPost | null> {
        try {
            if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY === 'replace_me') {
                return null;
            }

            const blogRef = collection(db, BLOG_COLLECTION);
            const snapshot = await getDocs(query(blogRef)); // Simple approach for now
            const doc = snapshot.docs.find(d => d.data().slug === slug);

            if (!doc) {
                return null;
            }

            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                date: data.date instanceof Timestamp ? data.date.toDate().toISOString() : data.date,
                published: data.published ?? true,
                views: data.views ?? 0
            } as BlogPost;
        } catch (error) {
            console.error("Error fetching blog post by slug:", error);
            return null;
        }
    },

    /**
     * Create a new blog post
     */
    async createPost(post: Omit<BlogPost, "id">): Promise<string> {
        const blogRef = collection(db, BLOG_COLLECTION);
        const docRef = await addDoc(blogRef, {
            ...post,
            date: Timestamp.fromDate(new Date(post.date)),
            createdAt: Timestamp.now(),
            published: post.published ?? true,
            views: 0
        });
        return docRef.id;
    },

    /**
     * Update an existing blog post
     */
    async updatePost(id: string, post: Partial<BlogPost>): Promise<void> {
        const postRef = doc(db, BLOG_COLLECTION, id);
        const updateData: any = { ...post };

        if (post.date) {
            updateData.date = Timestamp.fromDate(new Date(post.date));
        }

        await updateDoc(postRef, updateData);
    },

    /**
     * Delete a blog post and its image from storage
     */
    async deletePost(id: string, imageUrl?: string): Promise<void> {
        // Delete from Firestore
        await deleteDoc(doc(db, BLOG_COLLECTION, id));

        // Delete image from Storage if it's an internal upload
        if (imageUrl && imageUrl.includes("firebasestorage.googleapis.com")) {
            try {
                const imageRef = ref(storage, imageUrl);
                await deleteObject(imageRef);
            } catch (error) {
                console.error("Error deleting image from storage:", error);
            }
        }
    },

    /**
     * Upload blog cover image
     */
    async uploadImage(file: File): Promise<string> {
        const storageRef = ref(storage, `blog/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        return await getDownloadURL(snapshot.ref);
    },

    /**
     * Increment view count for a post
     */
    async incrementViews(id: string): Promise<void> {
        try {
            const postRef = doc(db, BLOG_COLLECTION, id);
            await updateDoc(postRef, {
                views: increment(1)
            });
        } catch (error) {
            // Silently fail for analytics to not disrupt UX
            console.error("Error incrementing views:", error);
        }
    }
};
