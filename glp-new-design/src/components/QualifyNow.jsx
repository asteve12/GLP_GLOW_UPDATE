import React, { useEffect, useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import Navbar from './Navbar';
import Footer from './Footer';
import { gsap } from 'gsap';

// Assets
import weightLossImg from '../assets/weight-loss.png';
import hairLossImg from '../assets/hair-loss.png';
import mensHealthImg from '../assets/mens-health.png';
import longevityImg from '../assets/longevity.png';

const categories = [
    {
        id: 'weight-loss',
        name: 'Weight Loss',
        desc: 'Precision GLP-1 protocols (Semaglutide & Tirzepatide) for sustainable metabolic transformation.',
        image: weightLossImg,
        color: '#bfff00',
        bg: 'from-accent-green/20'
    },
    {
        id: 'hair-restoration',
        name: 'Hair Restoration',
        desc: 'Advanced topical and oral complexes for clinical-grade hair density and scalp health.',
        image: hairLossImg,
        color: '#5CE1E6',
        bg: 'from-cyan-400/20'
    },
    {
        id: 'sexual-health',
        name: 'Sexual Health',
        desc: 'Optimized performance protocols including Sildenafil, Tadalafil, and Oxytocin boosters.',
        image: mensHealthImg,
        color: '#FFDE59',
        bg: 'from-yellow-400/20'
    },
    {
        id: 'longevity',
        name: 'Longevity',
        desc: 'Cellular health optimization featuring NAD+, Glutathione, and advanced anti-aging science.',
        image: longevityImg,
        color: '#FF7E5F',
        bg: 'from-orange-500/20'
    }
];

const QualifyNow = () => {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const initialCategory = queryParams.get('category');
    const { user } = useAuth();
    const navigate = useNavigate();
    const [userSubmissions, setUserSubmissions] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchUserSubmissions = async () => {
            if (!user) return;
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('form_submissions')
                    .select('selected_drug, approval_status')
                    .eq('user_id', user.id);

                if (!error && data) {
                    setUserSubmissions(data);
                }
            } catch (err) {
                console.error('Error fetching submissions:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchUserSubmissions();
    }, [user]);

    useEffect(() => {
        window.scrollTo(0, 0);

        // Animations
        gsap.fromTo(".qualify-header",
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, duration: 1, ease: "power4.out" }
        );

        gsap.fromTo(".category-card",
            { y: 50, opacity: 0 },
            {
                y: 0,
                opacity: 1,
                duration: 0.8,
                stagger: 0.15,
                ease: "power3.out",
                delay: 0.2
            }
        );
    }, []);

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans">
            <Navbar />

            <main className="pt-32 pb-24 px-6 md:px-12">
                <div className="max-w-[1400px] 2xl:max-w-[1800px] 3xl:max-w-none mx-auto">
                    {/* Header Section */}
                    <div className="qualify-header mb-20 text-center">
                        <div className="inline-block py-2 px-6 bg-accent-green/10 border border-accent-green/20 rounded-full text-[10px] font-black uppercase tracking-[0.4em] text-accent-green mb-8">
                            Clinical Assessment
                        </div>
                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter leading-[0.85] mb-8 italic">
                            Select Your <br />
                            <span className="text-accent-green">Treatment Path.</span>
                        </h1>
                        <p className="max-w-2xl mx-auto text-lg md:text-xl text-white/60 font-medium leading-relaxed">
                            Begin your clinical evaluation. Our board-certified medical team will review your responses to tailor a precision protocol specifically for your biology.
                        </p>
                    </div>

                    {/* Category Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {categories.map((cat) => (
                            <div
                                key={cat.id}
                                className={`category-card group relative h-[500px] md:h-[600px] rounded-[40px] md:rounded-[60px] overflow-hidden border transition-all duration-700 hover:-translate-y-4 shadow-2xl ${initialCategory === cat.id
                                    ? 'border-accent-green bg-[#111] shadow-[0_0_50px_rgba(191,255,0,0.1)]'
                                    : 'border-white/5 bg-[#0A0A0A] hover:border-white/20'
                                    }`}
                            >
                                {/* Active Badge */}
                                {initialCategory === cat.id && (
                                    <div className="absolute top-8 left-8 z-30 bg-accent-green text-black text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest animate-pulse">
                                        Selected Path
                                    </div>
                                )}

                                {/* Image Section */}
                                <div className="absolute inset-0 z-0">
                                    <div className={`absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent z-10 opacity-80`}></div>
                                    <div className={`absolute inset-0 bg-gradient-to-br ${cat.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-1000`}></div>
                                    <img
                                        src={cat.image}
                                        alt={cat.name}
                                        className="w-full h-full object-cover grayscale opacity-30 group-hover:grayscale-0 group-hover:opacity-50 transition-all duration-1000 transform group-hover:scale-110"
                                    />
                                </div>

                                {/* Content Section */}
                                <div className="absolute inset-0 z-20 p-10 flex flex-col justify-end">
                                    <div
                                        className="w-12 h-1.5 mb-6 transition-all duration-500 group-hover:w-20"
                                        style={{ backgroundColor: cat.color }}
                                    ></div>
                                    <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter italic mb-4 text-white leading-none">
                                        {cat.name}
                                    </h2>
                                    <p className="text-white/50 text-sm md:text-base mb-8 font-medium leading-relaxed opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                                        {cat.desc}
                                    </p>

                                    {(() => {
                                        const submission = userSubmissions.find(s => s.selected_drug === cat.id);
                                        if (submission) {
                                            return (
                                                <button
                                                    disabled
                                                    className="w-full py-5 bg-white/10 text-white/40 rounded-full font-black text-xs uppercase tracking-[0.2em] border border-white/5 cursor-not-allowed"
                                                >
                                                    {submission.approval_status === 'approved' ? 'Active Protocol' : 'Submission Pending'}
                                                </button>
                                            );
                                        }
                                        return (
                                            <Link
                                                to={`/assessment/${cat.id}`}
                                                className="w-full py-5 bg-white text-black rounded-full font-black text-xs uppercase tracking-[0.2em] transform transition-all active:scale-95 hover:bg-accent-green hover:shadow-[0_0_30px_rgba(191,255,0,0.4)] text-center"
                                            >
                                                Start Assessment
                                            </Link>
                                        );
                                    })()}
                                </div>

                                {/* Icon Overlay (Subtle) */}
                                <div className="absolute top-10 right-10 opacity-10 group-hover:opacity-30 transition-opacity duration-700">
                                    <div className="text-6xl font-black uppercase tracking-tighter vertical-text text-white">
                                        0{categories.indexOf(cat) + 1}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Help Section */}
                    <div className="mt-32 text-center qualify-header">
                        <p className="text-white/40 font-medium italic text-lg mb-4">Unsure which path is right for you?</p>
                        <a href="mailto:support@glp-glow.com" className="text-accent-green font-bold uppercase tracking-widest text-sm border-b border-accent-green/30 hover:border-accent-green transition-all pb-1">
                            Consult with our triage team
                        </a>
                    </div>
                </div>
            </main>

            <Footer />

            <style dangerouslySetInnerHTML={{
                __html: `
                .vertical-text {
                    writing-mode: vertical-rl;
                    text-orientation: mixed;
                }
            `}} />
        </div>
    );
};

export default QualifyNow;
