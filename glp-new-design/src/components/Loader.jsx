import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

const Loader = ({ loaded, onComplete }) => {
    const containerRef = useRef(null);
    const logoRef = useRef(null);
    const taglineRef = useRef(null);
    const progressBarRef = useRef(null);
    const progressTrackRef = useRef(null);
    const messageRef = useRef(null);
    const dotsRef = useRef([]);
    const exitStartedRef = useRef(false);

    const messages = [
        "Personalized Weight Loss",
        "Clinical Hair Restoration",
        "Sexual Health Solutions",
        "Longevity Protocols"
    ];

    useEffect(() => {
        // Set initial states
        gsap.set(logoRef.current, { opacity: 0, y: 30 });
        gsap.set(taglineRef.current, { opacity: 0, y: 15 });
        gsap.set(progressTrackRef.current, { opacity: 0 });
        gsap.set(progressBarRef.current, { scaleX: 0 });
        gsap.set(messageRef.current, { opacity: 0, y: 10 });
        gsap.set(dotsRef.current, { opacity: 0, scale: 0 });

        // Entrance animation
        const tl = gsap.timeline();

        tl.to(logoRef.current, {
            opacity: 1,
            y: 0,
            duration: 0.9,
            ease: 'power3.out'
        })
            .to(taglineRef.current, {
                opacity: 1,
                y: 0,
                duration: 0.6,
                ease: 'power2.out'
            }, '-=0.4')
            .to(progressTrackRef.current, {
                opacity: 1,
                duration: 0.4,
            }, '-=0.2')
            .to(progressBarRef.current, {
                scaleX: 0.75,
                duration: 1.8,
                ease: 'power1.inOut'
            }, '-=0.2')
            .to(messageRef.current, {
                opacity: 1,
                y: 0,
                duration: 0.5,
                ease: 'power2.out'
            }, '-=1.4')
            .to(dotsRef.current, {
                opacity: 1,
                scale: 1,
                duration: 0.4,
                stagger: 0.15,
                ease: 'back.out(2)',
            }, '-=1.0');

        // Message cycling
        const messageTl = gsap.timeline({ repeat: -1 });
        messages.forEach((msg) => {
            messageTl
                .to(messageRef.current, {
                    opacity: 0,
                    y: -8,
                    duration: 0.3,
                    onComplete: () => {
                        if (messageRef.current) messageRef.current.innerText = msg;
                    }
                })
                .fromTo(messageRef.current,
                    { y: 8, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out' }
                )
                .to(messageRef.current, { opacity: 1, duration: 1.1 });
        });

        // Dot pulse animation
        gsap.to(dotsRef.current, {
            opacity: 0.25,
            scale: 0.65,
            duration: 0.6,
            stagger: { each: 0.2, repeat: -1, yoyo: true },
            ease: 'sine.inOut',
        });

    }, []);

    // Exit when loaded
    useEffect(() => {
        if (loaded && !exitStartedRef.current) {
            exitStartedRef.current = true;

            const exitTl = gsap.timeline({ onComplete });

            exitTl
                .to(progressBarRef.current, {
                    scaleX: 1,
                    duration: 0.4,
                    ease: 'power2.out'
                })
                .to([logoRef.current, taglineRef.current, progressTrackRef.current, messageRef.current, ...dotsRef.current], {
                    opacity: 0,
                    duration: 0.45,
                    ease: 'power2.in'
                }, '+=0.1')
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
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
            style={{ backgroundColor: '#0a0a0a' }}
        >
            {/* Subtle top border accent */}
            <div
                className="absolute top-0 left-0 right-0 h-[2px]"
                style={{ backgroundColor: '#2a2a2a' }}
            />

            <div className="relative w-full max-w-xs px-8 flex flex-col items-center gap-6">

                {/* Logo / Brand name */}
                <div ref={logoRef} className="flex flex-col items-center gap-2">
                    <h1
                        className="text-white font-black uppercase text-3xl"
                        style={{ fontFamily: "'Manrope', sans-serif", letterSpacing: '0.25em' }}
                    >
                        GLP-GLOW
                    </h1>
                    <span
                        ref={taglineRef}
                        className="text-[10px] font-semibold uppercase tracking-[0.4em]"
                        style={{ color: '#555555' }}
                    >
                        Medical
                    </span>
                </div>

                {/* Progress track */}
                <div className="w-full flex flex-col items-center gap-3">
                    <div
                        ref={progressTrackRef}
                        className="w-full h-[2px] rounded-full overflow-hidden"
                        style={{ backgroundColor: '#1e1e1e' }}
                    >
                        <div
                            ref={progressBarRef}
                            className="h-full w-full origin-left rounded-full"
                            style={{ backgroundColor: '#ffffff' }}
                        />
                    </div>

                    {/* Cycling message */}
                    <p
                        ref={messageRef}
                        className="text-[10px] font-bold uppercase tracking-[0.22em] text-center"
                        style={{ color: '#444444' }}
                    >
                        Preparing Your Journey
                    </p>
                </div>

                {/* Animated dots */}
                <div className="flex items-center gap-2">
                    {[0, 1, 2].map((i) => (
                        <div
                            key={i}
                            ref={(el) => (dotsRef.current[i] = el)}
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: '#333333' }}
                        />
                    ))}
                </div>
            </div>

            {/* Subtle bottom border accent */}
            <div
                className="absolute bottom-0 left-0 right-0 h-[1px]"
                style={{ backgroundColor: '#1a1a1a' }}
            />
        </div>
    );
};

export default Loader;
