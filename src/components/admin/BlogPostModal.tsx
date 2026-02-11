"use client";

import { useState, useEffect } from "react";
import { BlogPost } from "@/types/extra";
import { BlogService } from "@/services/blog.service";
import { X, Upload, Save, Loader2 } from "lucide-react";
import { cleanInput } from "@/lib/input-validation";
import ImageCropperModal from "./ImageCropperModal";

import { useAuth } from "@/context/AuthContext";

interface BlogPostModalProps {
    isOpen: boolean;
    onClose: () => void;
    post: BlogPost | null;
    onSave: () => void;
}

export default function BlogPostModal({ isOpen, onClose, post, onSave }: BlogPostModalProps) {
    const { dbUser } = useAuth();
    const triggeredBy = dbUser?.name || "Admin";
    const [saving, setSaving] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [newCategory, setNewCategory] = useState("");

    // Cropping States
    const [croppingImage, setCroppingImage] = useState<{ src: string; file: File } | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        title: "",
        excerpt: "",
        content: "",
        author: "Greenbird Team",
        categories: ["Farm Life"] as string[],
        imageUrl: "",
        readTime: 5,
        published: true
    });

    useEffect(() => {
        if (post) {
            setFormData({
                title: post.title,
                excerpt: post.excerpt,
                content: post.content || "",
                author: post.author,
                categories: post.categories,
                imageUrl: post.imageUrl,
                readTime: post.readTime,
                published: post.published ?? true
            });
            setImageFile(null);
        } else {
            // Reset for new post
            setFormData({
                title: "",
                excerpt: "",
                content: "",
                author: "Greenbird Team",
                categories: ["Farm Life"],
                imageUrl: "",
                readTime: 5,
                published: true
            });
            setImageFile(null);
        }
    }, [post, isOpen]);

    const generateSlug = (title: string) => {
        return title.toLowerCase()
            .replace(/[^\w ]+/g, '')
            .replace(/ +/g, '-');
    };

    const handleImageSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            setCroppingImage({
                src: reader.result as string,
                file: file
            });
        };
        reader.readAsDataURL(file);
    };

    const onCropComplete = (croppedBlob: Blob) => {
        if (!croppingImage) return;

        const croppedFile = new File([croppedBlob], croppingImage.file.name, {
            type: 'image/jpeg'
        });

        setImageFile(croppedFile);
        setCroppingImage(null);
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
                date: new Date(),
                views: post ? post.views : 0
            };

            if (post) {
                await BlogService.updatePost(post.id, postData as Partial<BlogPost>, triggeredBy);
            } else {
                await BlogService.createPost(postData, triggeredBy);
            }

            onSave();
            onClose();
        } catch (error) {
            console.error("Error saving post:", error);
            alert("Failed to save post");
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl animate-in fade-in zoom-in duration-200 my-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
                    {croppingImage && (
                        <ImageCropperModal
                            imageSrc={croppingImage.src}
                            aspect={16 / 9}
                            onCropComplete={onCropComplete}
                            onClose={() => setCroppingImage(null)}
                        />
                    )}
                    <h2 className="text-xl font-bold text-gray-900">
                        {post ? "Edit Post" : "Create New Post"}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
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
                                onChange={handleImageSelection}
                                accept="image/*"
                            />
                            {(imageFile || formData.imageUrl) ? (
                                <div className="relative w-full h-40">
                                    <img
                                        src={imageFile ? URL.createObjectURL(imageFile) : formData.imageUrl}
                                        className="w-full h-full object-cover rounded-lg"
                                        alt="Preview"
                                    />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity rounded-lg">
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
                                onChange={(e) => setFormData({ ...formData, title: cleanInput(e.target.value) })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Author</label>
                            <input
                                type="text"
                                required
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-green-500 focus:border-green-500"
                                value={formData.author}
                                onChange={(e) => setFormData({ ...formData, author: cleanInput(e.target.value) })}
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
                                onChange={(e) => setNewCategory(cleanInput(e.target.value))}
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
                            onChange={(e) => setFormData({ ...formData, excerpt: cleanInput(e.target.value) })}
                        ></textarea>
                    </div>

                    <div>
                        <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                            <input
                                type="checkbox"
                                className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                                checked={formData.published}
                                onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                            />
                            <div>
                                <div className="font-bold text-gray-900">Publish Post</div>
                                <div className="text-sm text-gray-500">Uncheck to save as draft</div>
                            </div>
                        </label>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Content (Markdown Support)</label>
                        <textarea
                            required
                            rows={10}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-green-500 focus:border-green-500 font-mono text-sm"
                            placeholder="Write your blog post content here..."
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: cleanInput(e.target.value) })}
                        ></textarea>
                    </div>

                    <div className="flex gap-4 pt-4 sticky bottom-0 bg-white pb-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 disabled:opacity-70 flex items-center justify-center"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <>
                                    <Save className="h-5 w-5" />
                                    <span>{post ? "Save Changes" : "Publish Post"}</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
