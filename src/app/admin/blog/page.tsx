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
    Tag,
    Loader2,
    X,
    Upload
} from "lucide-react";
import Link from "next/link";

export default function AdminBlogPage() {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
    const [saving, setSaving] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        title: "",
        excerpt: "",
        content: "",
        author: "Greenbird Team",
        categories: [] as string[],
        imageUrl: "",
        readTime: 5
    });
    const [newCategory, setNewCategory] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);

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
        setFormData({
            title: "",
            excerpt: "",
            content: "",
            author: "Greenbird Team",
            categories: ["Farm Life"],
            imageUrl: "",
            readTime: 5
        });
        setImageFile(null);
        setShowModal(true);
    };

    const handleEdit = (post: BlogPost) => {
        setEditingPost(post);
        setFormData({
            title: post.title,
            excerpt: post.excerpt,
            content: post.content || "",
            author: post.author,
            categories: post.categories,
            imageUrl: post.imageUrl,
            readTime: post.readTime
        });
        setImageFile(null);
        setShowModal(true);
    };

    const handleDelete = async (post: BlogPost) => {
        if (!confirm(`Are you sure you want to delete "${post.title}"?`)) return;

        try {
            await BlogService.deletePost(post.id, post.imageUrl);
            loadPosts();
        } catch (error) {
            console.error("Error deleting post:", error);
            alert("Failed to delete post");
        }
    };

    const generateSlug = (title: string) => {
        return title.toLowerCase()
            .replace(/[^\w ]+/g, '')
            .replace(/ +/g, '-');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            let finalImageUrl = formData.imageUrl;

            // Handle Image Upload
            if (imageFile) {
                finalImageUrl = await BlogService.uploadImage(imageFile);
            }

            const postData: Omit<BlogPost, "id"> = {
                ...formData,
                imageUrl: finalImageUrl,
                slug: generateSlug(formData.title),
                date: new Date()
            };

            if (editingPost) {
                await BlogService.updatePost(editingPost.id, postData as Partial<BlogPost>);
            } else {
                await BlogService.createPost(postData);
            }

            setShowModal(false);
            loadPosts();
        } catch (error) {
            console.error("Error saving post:", error);
            alert("Failed to save post");
        } finally {
            setSaving(false);
        }
    };

    const filteredPosts = posts.filter(p =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.categories.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Blog Management</h1>
                    <p className="text-gray-500">Manage your farm stories and news</p>
                </div>
                <button
                    onClick={handleAdd}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold flex items-center hover:bg-green-700 transition-colors"
                >
                    <Plus className="h-5 w-5 mr-2" />
                    New Post
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 font-geist">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by title or category..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-green-500 focus:border-green-500"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Posts Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden font-geist">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Image & Title</th>
                                <th className="px-6 py-4">Categories</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Author</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredPosts.map((post) => (
                                <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-16 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                                                <img src={post.imageUrl || "/placeholder.png"} className="h-full w-full object-cover" />
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="font-bold text-gray-900 truncate max-w-xs">{post.title}</h3>
                                                <p className="text-xs text-gray-500 truncate max-w-xs">{post.excerpt}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1">
                                            {post.categories.map(cat => (
                                                <span key={cat} className="px-2 py-0.5 bg-green-50 text-green-700 text-[10px] font-bold rounded-full border border-green-100">
                                                    {cat}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {new Date(post.date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {post.author}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Link
                                                href={`/blog/${post.slug}`}
                                                target="_blank"
                                                className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Link>
                                            <button
                                                onClick={() => handleEdit(post)}
                                                className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(post)}
                                                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredPosts.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-gray-400">
                                        No blog posts found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl animate-in fade-in zoom-in duration-200 my-auto">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
                            <h2 className="text-xl font-bold text-gray-900">
                                {editingPost ? "Edit Post" : "Create New Post"}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Image Upload */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Cover Image</label>
                                <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-6 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer relative group">
                                    <input
                                        type="file"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                                        accept="image/*"
                                    />
                                    {(imageFile || formData.imageUrl) ? (
                                        <div className="relative w-full h-40">
                                            <img
                                                src={imageFile ? URL.createObjectURL(imageFile) : formData.imageUrl}
                                                className="w-full h-full object-cover rounded-lg"
                                            />
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                                                <Upload className="h-8 w-8 text-white" />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center">
                                            <Upload className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                                            <p className="text-sm text-gray-500 font-medium">Click to upload image</p>
                                            <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Title</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-green-500 focus:border-green-500"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Author</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-green-500 focus:border-green-500"
                                        value={formData.author}
                                        onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Read Time (min)</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-green-500 focus:border-green-500"
                                        value={formData.readTime}
                                        onChange={(e) => setFormData({ ...formData, readTime: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Categories</label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {formData.categories.map(cat => (
                                        <span key={cat} className="flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 text-sm font-semibold rounded-full">
                                            {cat}
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, categories: formData.categories.filter(c => c !== cat) })}
                                                className="hover:text-red-500"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-green-500 focus:border-green-500"
                                        placeholder="Add category..."
                                        value={newCategory}
                                        onChange={(e) => setNewCategory(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                if (newCategory) {
                                                    setFormData({ ...formData, categories: [...formData.categories, newCategory] });
                                                    setNewCategory("");
                                                }
                                            }
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (newCategory) {
                                                setFormData({ ...formData, categories: [...formData.categories, newCategory] });
                                                setNewCategory("");
                                            }
                                        }}
                                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-bold"
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Excerpt / Summary</label>
                                <textarea
                                    required
                                    rows={2}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-green-500 focus:border-green-500"
                                    value={formData.excerpt}
                                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                                ></textarea>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Content (Markdown Support)</label>
                                <textarea
                                    required
                                    rows={10}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-green-500 focus:border-green-500 font-mono text-sm"
                                    placeholder="Write your blog post content here..."
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                ></textarea>
                            </div>

                            <div className="flex gap-4 pt-4 sticky bottom-0 bg-white pb-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-6 py-3 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 disabled:opacity-70 flex items-center justify-center"
                                >
                                    {saving ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Save className="h-5 w-5 mr-2" />}
                                    {editingPost ? "Save Changes" : "Publish Post"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function Save(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
        </svg>
    );
}
