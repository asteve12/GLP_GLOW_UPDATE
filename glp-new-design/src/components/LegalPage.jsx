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
        <div className="bg-white min-h-screen text-black relative">
            <Navbar />

            <div className="pt-40 pb-32 px-6 relative z-10">
                <div className="max-w-4xl mx-auto">
                    <div className="legal-content">
                        <div className="inline-flex items-center gap-3 py-2 px-5 bg-black/5 border border-black/10 rounded-full text-[10px] font-black uppercase tracking-[0.4em] mb-10 text-black">
                            <div className="w-2 h-2 rounded-full bg-black"></div>
                            Clinical Compliance Document
                        </div>
                        <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter mb-16 italic leading-[0.85] text-black">
                            {title.split(' & ').map((part, i) => (
                                <React.Fragment key={i}>
                                    {part} {i === 0 && title.includes('&') && <br />}
                                </React.Fragment>
                            ))}
                        </h1>

                        <div className="prose max-w-none space-y-12 text-black/60 text-xl leading-relaxed font-medium assessment-option-arial">
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
