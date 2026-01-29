import { BlogService } from "@/services/blog.service";
import Link from "next/link";
import { Calendar, User, Clock, ArrowRight } from "lucide-react";


export default async function BlogPage() {
    const posts = await BlogService.getPublishedPosts();

    return (
        <div className="min-h-screen bg-[#FCF9F1] py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold text-[#2D5A27] mb-6">
                        Stories from the Farm
                    </h1>
                    <p className="text-xl text-gray-600 leading-relaxed">
                        Discover insights about sustainable farming, chicken rearing, and the daily life at Greenbird Homestead.
                    </p>
                </div>

                {/* Blog Grid */}
                {posts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {posts.map((post) => (
                            <Link
                                key={post.id}
                                href={`/blog/${post.slug}`}
                                className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-[#2D5A27]/10 flex flex-col h-full"
                            >
                                {/* Image Container */}
                                <div className="relative h-64 overflow-hidden">
                                    <div className="absolute inset-0 bg-gray-200 animate-pulse" />
                                    <img
                                        src={post.imageUrl || "/placeholder.png"}
                                        alt={post.title}
                                        className="h-full w-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                                        {post.categories.slice(0, 2).map((cat) => (
                                            <span
                                                key={cat}
                                                className="bg-white/90 backdrop-blur-sm text-[#2D5A27] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider"
                                            >
                                                {cat}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6 flex-1 flex flex-col">
                                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                                        <span className="flex items-center gap-1.5">
                                            <Calendar className="h-3.5 w-3.5" />
                                            {new Date(post.date).toLocaleDateString()}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <Clock className="h-3.5 w-3.5" />
                                            {post.readTime} min read
                                        </span>
                                    </div>

                                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-[#2D5A27] transition-colors line-clamp-2">
                                        {post.title}
                                    </h3>

                                    <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 mb-6 flex-1">
                                        {post.excerpt}
                                    </p>

                                    <div className="flex items-center justify-between pt-6 border-t border-gray-100 mt-auto">
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-[#2D5A27]">
                                                <User className="h-4 w-4" />
                                            </div>
                                            <span className="text-sm font-medium text-gray-700">
                                                {post.author}
                                            </span>
                                        </div>
                                        <span className="text-[#2D5A27] font-semibold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                                            Read More <ArrowRight className="h-4 w-4" />
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                        <div className="mb-4">
                            <span className="text-6xl">🌱</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No stories yet</h3>
                        <p className="text-gray-500 max-w-md mx-auto">
                            We're currently writing some amazing content. Check back soon for updates from the farm!
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
