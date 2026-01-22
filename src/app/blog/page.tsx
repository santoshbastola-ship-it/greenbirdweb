import Link from "next/link";
import { BlogService } from "@/services/blog.service";
import { BlogPost } from "@/types/extra";
import { Calendar, User, Clock, ArrowRight } from "lucide-react";

export default async function BlogPage() {
    const posts = await BlogService.getAllPosts();

    return (
        <div className="min-h-screen bg-[#FCF9F1] py-16 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold text-[#2D5A27] mb-4">Farm Life Blog</h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Stories from the farm, health tips, and our journey in sustainable agriculture.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-10">
                    {posts.map((post) => (
                        <BlogCard key={post.id} post={post} />
                    ))}
                </div>
            </div>
        </div>
    );
}

function BlogCard({ post }: { post: BlogPost }) {
    return (
        <article className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all border border-[#2D5A27]/5 group">
            <Link href={`/blog/${post.slug}`} className="block relative h-64 overflow-hidden">
                <img
                    src={post.imageUrl}
                    alt={post.title}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                    {post.categories.map((cat) => (
                        <span key={cat} className="bg-[#2D5A27] text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                            {cat}
                        </span>
                    ))}
                </div>
            </Link>

            <div className="p-8">
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(post.date).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {post.readTime} min read
                    </span>
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-[#2D5A27] transition-colors">
                    <Link href={`/blog/${post.slug}`}>
                        {post.title}
                    </Link>
                </h2>

                <p className="text-gray-600 mb-6 line-clamp-2">
                    {post.excerpt}
                </p>

                <Link
                    href={`/blog/${post.slug}`}
                    className="inline-flex items-center font-bold text-[#5C4033] hover:text-[#2D5A27] transition-colors gap-2"
                >
                    Read More <ArrowRight className="h-4 w-4" />
                </Link>
            </div>
        </article>
    );
}
