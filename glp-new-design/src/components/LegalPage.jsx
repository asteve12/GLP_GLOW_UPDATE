import React, { useEffect } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import gsap from 'gsap';

const LegalPage = ({ title, content }) => {
    useEffect(() => {
        window.scrollTo(0, 0);
        gsap.fromTo(".legal-content",
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }
        );
    }, [title]);

    return (
        <div className="bg-bg-primary min-h-screen text-white">
            <Navbar />

            <div className="pt-32 pb-24 px-6">
                <div className="max-w-4xl mx-auto">
                    <div className="legal-content">
                        <div className="inline-block py-2 px-4 bg-accent-green/10 border border-accent-green/20 rounded-full text-[10px] font-bold uppercase tracking-[0.3em] mb-8 text-accent-green">
                            Compliance Document
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-12 italic">
                            {title}
                        </h1>

                        <div className="prose prose-invert max-w-none space-y-8 text-white/70 text-lg leading-relaxed font-medium">
                            {content}
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default LegalPage;
