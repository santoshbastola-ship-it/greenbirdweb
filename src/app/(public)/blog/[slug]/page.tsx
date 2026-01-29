import { BlogService } from "@/services/blog.service";
import { notFound } from "next/navigation";
import { Calendar, User, Clock, ArrowLeft, Eye } from "lucide-react";
import Link from "next/link";
import ViewCounter from "@/components/blog/ViewCounter";

export const dynamicParams = false;

export async function generateStaticParams() {
    console.log("Generating static params for blog posts...");
    // Retrieve all published posts to pre-render their pages
    const posts = await BlogService.getPublishedPosts();

    // Always include 'welcome' if needed, or just map actual posts
    const params = posts.map((post) => ({
        slug: post.slug,
    }));

    if (params.length === 0) {
        return [{ slug: 'welcome' }];
    }

    return params;
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    // Workaround for build-time generation: handle missing slug or dummy slug
    if (!slug || slug === 'welcome') {
        return <div className="p-20 text-center"><h1>Welcome to our Blog</h1></div>;
    }

    const post = await BlogService.getPostBySlug(slug);

    if (!post) {
        notFound();
    }

    return (
        <article className="min-h-screen bg-[#FCF9F1] pb-20">
            <ViewCounter postId={post.id} />

            {/* Post Header with Image */}
            <div className="relative h-[40vh] md:h-[60vh] w-full">
                <img
                    src={post.imageUrl}
                    alt={post.title}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40"></div>
                <div className="absolute inset-x-0 bottom-0 py-12 px-4 bg-gradient-to-t from-black/80 to-transparent">
                    <div className="max-w-4xl mx-auto">
                        <Link
                            href="/blog"
                            className="inline-flex items-center text-white/80 hover:text-white mb-6 gap-2 text-sm font-medium"
                        >
                            <ArrowLeft className="h-4 w-4" /> Back to Blog
                        </Link>
                        <h1 className="text-3xl md:text-5xl font-bold text-white mb-6">
                            {post.title}
                        </h1>
                        <div className="flex flex-wrap items-center gap-6 text-white/90 text-sm">
                            <span className="flex items-center gap-2">
                                <User className="h-4 w-4" /> {post.author}
                            </span>
                            <span className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" /> {new Date(post.date).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-2">
                                <Clock className="h-4 w-4" /> {post.readTime} min read
                            </span>
                            <span className="flex items-center gap-2">
                                <Eye className="h-4 w-4" /> {post.views} views
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Post Content */}
            <div className="max-w-4xl mx-auto px-4 -mt-10 relative">
                <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-[#2D5A27]/5">
                    <div className="flex flex-wrap gap-2 mb-8">
                        {post.categories.map((cat) => (
                            <span key={cat} className="bg-[#2D5A27]/10 text-[#2D5A27] text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">
                                {cat}
                            </span>
                        ))}
                    </div>

                    <div className="prose prose-lg prose-green max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {post.content || post.excerpt}
                    </div>

                    <div className="mt-16 pt-10 border-t border-gray-100 flex justify-between items-center">
                        <div className="flex gap-4">
                            <span className="text-sm font-semibold text-gray-500">Share:</span>
                            {/* Placeholder social share links */}
                            <span className="text-gray-400 hover:text-[#5C4033] cursor-pointer">Facebook</span>
                            <span className="text-gray-400 hover:text-[#5C4033] cursor-pointer">WhatsApp</span>
                        </div>
                    </div>
                </div>
            </div>
        </article>
    );
}
