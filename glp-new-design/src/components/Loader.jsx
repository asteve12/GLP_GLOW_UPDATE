import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

const Loader = ({ loaded, onComplete }) => {
    const containerRef = useRef(null);
    const titleRef = useRef(null);
    const progressRef = useRef(null);
    const messageRef = useRef(null);
    const exitStartedRef = useRef(false);

    const messages = [
        "Personalized Weight Loss",
        "Clinical Hair Restoration",
        "Sexual Health Solutions",
        "Longevity Protocols"
    ];

    useEffect(() => {
        const tl = gsap.timeline();

        // Initial state
        gsap.set(titleRef.current, { opacity: 0, y: 20 });
        gsap.set(progressRef.current, { scaleX: 0 });
        gsap.set(messageRef.current, { opacity: 0, y: 10 });

        // Entrance & Loading Simulation
        tl.to(titleRef.current, {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power3.out"
        })
            .to(progressRef.current, {
                scaleX: 0.8,
                duration: 1.5,
                ease: "power1.inOut"
            }, "-=0.4");

        // Message Cycling Loop
        const messageTl = gsap.timeline({ repeat: -1 });

        messages.forEach((msg) => {
            messageTl.to(messageRef.current, {
                opacity: 0,
                y: -10,
                duration: 0.3,
                onComplete: () => {
                    if (messageRef.current) messageRef.current.innerText = msg;
                }
            })
                .fromTo(messageRef.current,
                    { y: 10, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" }
                )
                .to(messageRef.current, {
                    opacity: 1,
                    duration: 1.2
                });
        });

    }, []);

    // Watch for loaded state only
    useEffect(() => {
        if (loaded && !exitStartedRef.current) {
            exitStartedRef.current = true;

            const exitTl = gsap.timeline({
                onComplete: onComplete
            });

            exitTl.to(progressRef.current, {
                scaleX: 1,
                duration: 0.5,
                ease: "power1.out"
            })
                .to([titleRef.current, progressRef.current.parentElement, messageRef.current], {
                    opacity: 0,
                    duration: 0.5,
                    ease: "power2.in"
                })
                .to(containerRef.current, {
                    yPercent: -100,
                    duration: 0.8,
                    ease: "power4.inOut"
                });
        }
    }, [loaded, onComplete]);

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 z-[9999] bg-bg-primary flex flex-col items-center justify-center"
        >
            <div className="w-full max-w-sm px-8 flex flex-col items-center">
                <h2
                    ref={titleRef}
                    className="text-4xl text-white font-black uppercase tracking-[0.2em] text-center mb-8"
                >
                    GLP-GLOW
                </h2>
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mb-4">
                    <div
                        ref={progressRef}
                        className="h-full bg-accent-green origin-left w-full"
                    ></div>
                </div>
                <p
                    ref={messageRef}
                    className="text-accent-green text-xs font-bold uppercase tracking-[0.2em] h-4"
                >
                    Preparing Your Journey
                </p>
            </div>
        </div>
    );
};

export default Loader;
