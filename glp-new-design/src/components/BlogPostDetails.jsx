import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Navbar from './Navbar';
import Footer from './Footer';

const BlogPostDetails = () => {
    const { id } = useParams();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [relatedPosts, setRelatedPosts] = useState([]);

    useEffect(() => {
        const fetchPost = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('blog_posts')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                console.error('Error fetching blog post:', error);
            } else {
                setPost(data);

                // Fetch related posts (latest 3 excluding current)
                const { data: related } = await supabase
                    .from('blog_posts')
                    .select('*')
                    .eq('status', 'published')
                    .not('id', 'eq', id)
                    .limit(3)
                    .order('created_at', { ascending: false });

                setRelatedPosts(related || []);
            }
            setLoading(false);
        };

        fetchPost();
    }, [id]);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [id]);

    if (loading) {
        return (
            <div className="bg-white min-h-screen">
                <Navbar />
                <div className="py-40 flex flex-col items-center justify-center gap-6">
                    <div className="w-12 h-12 border-4 border-gray-100 border-t-black rounded-full animate-spin"></div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Opening Archive...</p>
                </div>
                <Footer />
            </div>
        );
    }

    if (!post) {
        return (
            <div className="bg-white min-h-screen">
                <Navbar />
                <div className="py-40 text-center">
                    <h2 className="text-3xl font-bold mb-4">Post not found</h2>
                    <Link to="/blog" className="text-black font-bold border-b border-black">Return to all posts</Link>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="bg-white min-h-screen font-sans text-[#1a1a1a]">
            <Navbar />

            <article className="pt-20">
                {/* Post Header */}
                <header className="max-w-[800px] mx-auto px-6 pt-20 pb-16 text-center">
                    <div className="inline-block py-2 px-4 bg-black/5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-8">
                        {new Date(post.published_at || post.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold mb-8 italic tracking-tight leading-tight" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                        {post.title}
                    </h1>
                    <div className="flex items-center justify-center gap-4 text-[11px] font-black uppercase tracking-widest text-gray-400">
                        <span>By {post.author}</span>
                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                        <span>Clinical Research</span>
                    </div>
                </header>

                {/* Featured Image */}
                <div className="max-w-[1200px] mx-auto px-6 mb-20">
                    <div className="aspect-[21/9] rounded-[48px] overflow-hidden shadow-2xl relative">
                        <img
                            src={post.image_url || 'https://images.unsplash.com/photo-1505751172177-51ad18610432?w=1200&q=80'}
                            alt={post.title}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/5"></div>
                    </div>
                </div>

                {/* Content */}
                <div className="max-w-[800px] mx-auto px-6 pb-32">
                    <div className="prose prose-lg prose-black max-w-none prose-headings:font-serif prose-headings:italic prose-headings:tracking-tight prose-p:leading-relaxed prose-p:text-gray-700">
                        {/* 
                            Simple content rendering. 
                            In a real app, you might use a Markdown renderer like react-markdown.
                        */}
                        {post.content.split('\n').map((paragraph, idx) => (
                            paragraph.trim() ? <p key={idx} className="mb-6">{paragraph}</p> : <br key={idx} />
                        ))}
                    </div>

                    <div className="mt-20 pt-10 border-t border-gray-100 flex flex-wrap gap-4 items-center justify-between">
                        <Link to="/blog" className="flex items-center gap-3 text-sm font-bold tracking-tight hover:text-gray-500 transition-colors">
                            <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 8l4 4m0 0l-7 7m7-7H3" />
                            </svg>
                            Back to all posts
                        </Link>

                        <div className="flex gap-4">
                            {/* Share placeholders */}
                            <button className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-all">
                                <span className="text-[10px] font-black uppercase tracking-tight">FB</span>
                            </button>
                            <button className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-all">
                                <span className="text-[10px] font-black uppercase tracking-tight">TW</span>
                            </button>
                            <button className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-all">
                                <span className="text-[10px] font-black uppercase tracking-tight">LN</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Related Posts */}
                {relatedPosts.length > 0 && (
                    <section className="bg-[#fcfbfa] py-32 border-t border-gray-100">
                        <div className="max-w-[1200px] mx-auto px-6">
                            <h2 className="text-3xl font-bold mb-16 italic" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>Related Reads</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {relatedPosts.map(post => (
                                    <Link key={post.id} to={`/blog/${post.id}`} className="group">
                                        <div className="aspect-[16/10] rounded-[24px] overflow-hidden mb-6 shadow-sm group-hover:shadow-md transition-all">
                                            <img src={post.image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        </div>
                                        <h3 className="text-xl font-bold mb-2 leading-snug group-hover:text-gray-600 transition-colors" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>{post.title}</h3>
                                        <p className="text-xs font-black uppercase tracking-widest text-gray-400">{new Date(post.published_at || post.created_at).toLocaleDateString()}</p>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </section>
                )}
            </article>

            <Footer />
        </div>
    );
};

export default BlogPostDetails;
