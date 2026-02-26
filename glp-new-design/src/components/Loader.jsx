import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

const Loader = ({ loaded, onComplete }) => {
    const containerRef = useRef(null);
    const contentRef = useRef(null);
    const exitStartedRef = useRef(false);

    useEffect(() => {
        // Set initial state
        gsap.set(contentRef.current, { opacity: 0, scale: 0.8 });

        // Entrance animation
        gsap.to(contentRef.current, {
            opacity: 1,
            scale: 1,
            duration: 0.8,
            ease: 'power3.out'
        });
    }, []);

    // Exit when loaded
    useEffect(() => {
        if (loaded && !exitStartedRef.current) {
            exitStartedRef.current = true;

            const exitTl = gsap.timeline({ onComplete });

            exitTl
                .to(contentRef.current, {
                    opacity: 0,
                    scale: 0.8,
                    duration: 0.4,
                    ease: 'power2.in'
                })
                .to(containerRef.current, {
                    yPercent: -100,
                    duration: 0.75,
                    ease: 'power4.inOut'
                });
        }
    }, [loaded, onComplete]);

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#050505] overflow-hidden"
        >

            <div ref={contentRef} className="relative z-10 flex flex-col items-center justify-center gap-6">
                {/* Heartbeat Circle with 'u' */}
                <div className="relative flex items-center justify-center">
                    {/* Pulsing Outer Glow */}
                    <div className="absolute w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse"></div>

                    {/* Main Circle and 'u' */}
                    <div className="w-28 h-28 border border-white/30 rounded-full flex items-center justify-center animate-heartbeat shadow-[0_0_40px_rgba(255,255,255,0.1)] backdrop-blur-[2px]">
                        <span
                            className="text-white text-7xl font-medium italic select-none"
                            style={{
                                fontFamily: '"Cormorant Garamond", serif',
                                transform: 'translateY(-4px)'
                            }}
                        >
                            u
                        </span>
                    </div>
                </div>

                {/* Loading Text (Optional but adds premium feel) */}
                <span className="text-white/50 text-xs uppercase tracking-[0.3em] font-medium">
                    Initializing Glow
                </span>
            </div>
        </div>
    );
};

export default Loader;
