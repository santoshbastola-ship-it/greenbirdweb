"use client";

import { useState, useEffect } from "react";
import { BlogService } from "@/services/blog.service";
import { BlogPost } from "@/types/extra";
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    Eye,
    Calendar,
    User,
    Clock,
    BookOpen,
    EyeOff
} from "lucide-react";
import Link from "next/link";
import LogoLoader from "@/components/ui/LogoLoader";
import BlogPostModal from "@/components/admin/BlogPostModal";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function BlogManagementPage() {
    const { dbUser, loading: authLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && dbUser && dbUser.role !== 'admin') {
            router.push("/admin");
        }
    }, [dbUser, authLoading, router]);

    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editingPost, setEditingPost] = useState<BlogPost | null>(null);

    useEffect(() => {
        loadPosts();
    }, []);

    const loadPosts = async () => {
        setLoading(true);
        try {
            const data = await BlogService.getAllPosts();
            setPosts(data);
        } catch (error) {
            console.error("Error loading posts:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setEditingPost(null);
        setShowModal(true);
    };

    const handleEdit = (post: BlogPost) => {
        setEditingPost(post);
        setShowModal(true);
    };

    const handleTogglePublish = async (post: BlogPost) => {
        const action = post.published ? "unpublish" : "publish";
        if (!confirm(`Are you sure you want to ${action} "${post.title}"?`)) return;

        try {
            await BlogService.updatePost(post.id, { published: !post.published });
            loadPosts();
        } catch (error) {
            console.error(`Error ${action}ing post:`, error);
            alert(`Failed to ${action} post`);
        }
    };

    const filteredPosts = posts.filter(p =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.categories.some((c: string) => c.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <LogoLoader />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Blog Management</h1>
                    <button
                        onClick={handleAdd}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm font-medium"
                    >
                        <Plus className="h-5 w-5" />
                        New Post
                    </button>
                </div>

                {/* Search / Filter */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by title or category..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-green-500 focus:border-green-500 transition-all font-geist"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Posts Grid/List */}
                {filteredPosts.length === 0 ? (
                    <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
                        <BookOpen className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No blog posts found</h3>
                        <p className="text-gray-500">Create a new post to get started.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredPosts.map((post) => (
                            <BlogCard
                                key={post.id}
                                post={post}
                                onEdit={() => handleEdit(post)}
                                onTogglePublish={() => handleTogglePublish(post)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            <BlogPostModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                post={editingPost}
                onSave={loadPosts}
            />
        </div>
    );
}

function BlogCard({
    post,
    onEdit,
    onTogglePublish
}: {
    post: BlogPost;
    onEdit: () => void;
    onTogglePublish: () => void;
}) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
            <div className="flex flex-col sm:flex-row gap-4">
                {/* Image */}
                <div className="h-32 w-full sm:w-48 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                    <img
                        src={post.imageUrl || "/placeholder.png"}
                        alt={post.title}
                        className="h-full w-full object-cover"
                    />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-gray-900 text-lg truncate pr-4">{post.title}</h3>
                            {post.published ? (
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full border border-green-200 uppercase tracking-wider">
                                    Published
                                </span>
                            ) : (
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold rounded-full border border-gray-200 uppercase tracking-wider">
                                    Draft
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                            <Link
                                href={`/blog/${post.slug}`}
                                target="_blank"
                                className="p-2 text-gray-400 hover:text-blue-600 transition-colors rounded-full hover:bg-blue-50"
                                title="View Post"
                            >
                                <Eye className="h-4 w-4" />
                            </Link>
                            <button
                                onClick={onEdit}
                                className="p-2 text-gray-400 hover:text-green-600 transition-colors rounded-full hover:bg-green-50"
                                title="Edit Post"
                            >
                                <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                                onClick={onTogglePublish}
                                className={`p-2 transition-colors rounded-full ${post.published ? 'text-gray-400 hover:text-orange-600 hover:bg-orange-50' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'}`}
                                title={post.published ? "Unpublish Post" : "Publish Post"}
                            >
                                {post.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    <p className="text-gray-500 text-sm mt-1 line-clamp-2">{post.excerpt}</p>
                </div>

                <div className="flex flex-wrap items-center gap-4 mt-3 text-xs sm:text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                        <User className="h-3 w-3 sm:h-4 sm:w-4" />
                        {post.author}
                    </div>
                    <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                        {new Date(post.date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                        {post.readTime} min read
                    </div>
                    <div className="flex items-center gap-1 text-blue-600 font-medium">
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                        {post.views || 0} views
                    </div>

                    <div className="hidden sm:block w-px h-3 bg-gray-300 mx-1"></div>

                    <div className="flex flex-wrap gap-1">
                        {post.categories.map(cat => (
                            <span key={cat} className="px-2 py-0.5 bg-green-50 text-green-700 text-[10px] sm:text-xs font-bold rounded-full border border-green-100">
                                {cat}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
