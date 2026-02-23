import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

const Loader = ({ loaded, onComplete }) => {
    const containerRef = useRef(null);
    const spinnerRef = useRef(null);
    const exitStartedRef = useRef(false);

    useEffect(() => {
        // Set initial state
        gsap.set(spinnerRef.current, { opacity: 0, scale: 0.8 });

        // Entrance animation
        gsap.to(spinnerRef.current, {
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
                .to(spinnerRef.current, {
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
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0a0a0a]"
        >
            <div ref={spinnerRef} className="relative flex items-center justify-center">
                {/* Circular Loader */}
                <div className="w-12 h-12 border-2 border-white/10 border-t-white rounded-full animate-spin"></div>
            </div>
        </div>
    );
};

export default Loader;
