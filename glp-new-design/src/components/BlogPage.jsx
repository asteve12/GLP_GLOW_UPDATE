import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Navbar from './Navbar';
import Footer from './Footer';

const BlogPage = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPosts = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('blog_posts')
                .select('*')
                .eq('status', 'published')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching blog posts:', error);
            } else {
                setPosts(data || []);
            }
            setLoading(false);
        };

        fetchPosts();
    }, []);

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="bg-white min-h-screen font-sans text-[#1a1a1a]">
            <Navbar />

            <main className="pt-20 pb-32">
                {/* Hero Section */}
                <section className="bg-[#fcfbfa] py-32 border-b border-gray-100 mb-20">
                    <div className="max-w-[1400px] 2xl:max-w-[1800px] mx-auto px-6 text-center">
                        <div className="inline-block py-2 px-4 bg-black/5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-8">
                            Knowledge Base
                        </div>
                        <h1 className="text-5xl md:text-7xl font-bold mb-8 italic tracking-tight leading-tight" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                            Peer reviewed <br />insights & medical updates
                        </h1>
                        <p className="text-gray-500 text-xl max-w-2xl mx-auto leading-relaxed">
                            Evidence-based guides, clinical insights, and the latest in personalized medicine from our medical team.
                        </p>
                    </div>
                </section>

                <div className="max-w-[1400px] 2xl:max-w-[1800px] mx-auto px-6">
                    {loading ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-6">
                            <div className="w-12 h-12 border-4 border-gray-100 border-t-black rounded-full animate-spin"></div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Loading insights...</p>
                        </div>
                    ) : posts.length === 0 ? (
                        <div className="text-center py-40 bg-gray-50 rounded-[60px] border border-dashed border-gray-200">
                            <h3 className="text-2xl font-bold mb-4 italic" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>New insights coming soon</h3>
                            <p className="text-gray-500">Our medical team is currently preparing new peer-reviewed content.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
                            {posts.map((post) => (
                                <Link
                                    key={post.id}
                                    to={`/blog/${post.id}`}
                                    className="group flex flex-col h-full"
                                >
                                    <div className="relative aspect-[16/10] rounded-[32px] overflow-hidden mb-8 shadow-sm transition-all duration-500 group-hover:shadow-xl group-hover:-translate-y-2">
                                        <img
                                            src={post.image_url || 'https://images.unsplash.com/photo-1505751172177-51ad18610432?w=800&q=80'}
                                            alt={post.title}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors"></div>
                                        <div className="absolute top-6 left-6">
                                            <span className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
                                                Clinical Update
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex-1 flex flex-col">
                                        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">
                                            <span>{new Date(post.published_at || post.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                            <span>By {post.author}</span>
                                        </div>

                                        <h2 className="text-2xl font-bold mb-4 group-hover:text-gray-600 transition-colors leading-snug" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                                            {post.title}
                                        </h2>

                                        <p className="text-gray-500 text-sm line-clamp-3 mb-6 flex-1 leading-relaxed">
                                            {post.content.replace(/[#*`]/g, '').substring(0, 160)}...
                                        </p>

                                        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest group/btn">
                                            Read the full study
                                            <svg className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                            </svg>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default BlogPage;
