import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

const WaitlistModal = ({ isOpen, onClose }) => {
    const modalRef = useRef(null);
    const overlayRef = useRef(null);
    const contentRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';

            const tl = gsap.timeline();
            tl.to(overlayRef.current, {
                opacity: 1,
                duration: 0.4,
                ease: "power2.out",
                display: 'flex'
            })
                .fromTo(contentRef.current,
                    { scale: 0.8, opacity: 0, y: 40 },
                    { scale: 1, opacity: 1, y: 0, duration: 0.6, ease: "back.out(1.2)" },
                    "-=0.2"
                );
        } else {
            document.body.style.overflow = 'unset';
            gsap.to(overlayRef.current, {
                opacity: 0,
                duration: 0.3,
                ease: "power2.in",
                onComplete: () => {
                    if (overlayRef.current) overlayRef.current.style.display = 'none';
                }
            });
        }
    }, [isOpen]);

    if (!isOpen && !overlayRef.current) return null;

    return (
        <div
            ref={overlayRef}
            className="fixed inset-0 z-[100] hidden items-center justify-center p-4 md:p-6 bg-black/80 backdrop-blur-xl"
            onClick={(e) => e.target === overlayRef.current && onClose()}
        >
            <div
                ref={contentRef}
                className="relative w-full max-w-2xl bg-[#170700] rounded-[40px] overflow-hidden shadow-[0_0_50px_rgba(234,88,12,0.2)] border border-[#FFC7A2]/10"
            >
                {/* Decorative Lava Glow */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-orange-600/20 rounded-full blur-[80px]"></div>
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-red-600/10 rounded-full blur-[80px]"></div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-8 right-8 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all z-20"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                <div className="relative z-10 p-8 md:p-12">
                    <div className="inline-block py-2 px-4 bg-orange-600/10 border border-orange-600/20 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-8 text-orange-500 animate-pulse">
                        Coming Late 2026
                    </div>

                    <h2 className="text-4xl md:text-5xl font-black text-[#FAF9F6] mb-6 leading-tight uppercase italic tracking-tighter">
                        Retatruide: <br />
                        <span className="text-[#FFC7A2]">The Successor.</span>
                    </h2>

                    <div className="space-y-6 mb-10 text-[#FAF9F6]/70 leading-relaxed text-lg">
                        <p>
                            Prepare for the next evolution in metabolic science. <span className="text-[#FAF9F6] font-bold">Retatruide</span> is a breakthrough triple-hormone agonist, engineered to be the definitive successor to Tirzepatide.
                        </p>
                        <p>
                            Designed for high-precision <span className="text-[#FFC7A2] italic underline decoration-[#FFC7A2]/30 underline-offset-4">Subcutaneous Injections</span>, this treatment targets three key pathways for unmatched weight management and metabolic optimization.
                        </p>
                    </div>

                    <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                        <div className="grid md:grid-cols-2 gap-4">
                            <input
                                type="text"
                                placeholder="FIRST NAME"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-white/20 focus:outline-none focus:border-[#FFC7A2]/50 transition-colors uppercase text-xs font-bold tracking-widest"
                            />
                            <input
                                type="email"
                                placeholder="EMAIL ADDRESS"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-white/20 focus:outline-none focus:border-[#FFC7A2]/50 transition-colors uppercase text-xs font-bold tracking-widest"
                            />
                        </div>
                        <button className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-2xl flex items-center justify-center gap-3">
                            Join the Waitlist <span>🔥</span>
                        </button>
                    </form>

                    <p className="mt-8 text-center text-[10px] uppercase tracking-widest text-[#FAF9F6]/30 font-bold">
                        Exclusive early access • Limited Slots per drop
                    </p>
                </div>
            </div>
        </div>
    );
};

export default WaitlistModal;
