import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const StatsSection = ({ children }) => {
    const sectionRef = useRef(null);
    const titleRef = useRef(null);
    const textRef = useRef(null);
    const statsRef = useRef([]);

    useEffect(() => {
        const el = sectionRef.current;

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: el,
                start: "top 80%", // Animation starts when top of section hits 80% of viewport
                end: "bottom 20%",
                toggleActions: "play none none reverse"
            }
        });

        tl.fromTo(titleRef.current,
            { y: 50, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }
        )
            .fromTo(textRef.current,
                { y: 30, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" },
                "-=0.6"
            )
            .fromTo(statsRef.current,
                { y: 40, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: "back.out(1.7)" },
                "-=0.6"
            );

    }, []);

    const addToStatsRef = (el) => {
        if (el && !statsRef.current.includes(el)) {
            statsRef.current.push(el);
        }
    };

    return (
        <section id="stats-section" ref={sectionRef} className="relative bg-accent-black text-white py-16 md:py-32 px-5 overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-black/5 rounded-full blur-[120px] -mr-64 -mt-64"></div>
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-white/20 rounded-full blur-[100px] -ml-32 -mb-32"></div>

            <div className="max-w-[1400px] 2xl:max-w-[1800px] 3xl:max-w-none mx-auto relative z-10">
                {/* Upper Content - Header and Stats */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-16 items-center mb-16 md:mb-32">
                    <div className="lg:col-span-6">
                        <div className="inline-block py-2 px-4 bg-black/10 rounded-full text-xs font-bold uppercase tracking-[0.2em] mb-4 md:mb-8">
                            Clinical Excellence
                        </div>
                        <h2 ref={titleRef} className="text-4xl md:text-6xl lg:text-8xl font-black uppercase leading-[0.85] mb-4 md:mb-8 tracking-tighter transform will-change-transform italic">
                            Redefining <br />
                            <span className="text-white drop-shadow-sm">Wellness</span>
                        </h2>
                        <p ref={textRef} className="text-base md:text-xl font-medium text-white/80 max-w-xl leading-relaxed transform will-change-transform">
                            We bridge the gap between rigorous clinical science and premium lifestyle medicine.
                            Our protocols are engineered for those who refuse to settle for average health.
                        </p>
                    </div>

                    <div className="lg:col-span-6">
                        <div className="grid grid-cols-2 gap-4 md:gap-6 lg:gap-8">
                            {[
                                { label: "Active Patients", value: "50k+" },
                                { label: "Success Rate", value: "100%" },
                                { label: "Purity Tested", value: "100%" },
                                { label: "Expert Support", value: "24/7" },
                            ].map((stat, i) => (
                                <div
                                    key={i}
                                    ref={addToStatsRef}
                                    className="bg-black/5 backdrop-blur-sm border border-black/10 p-4 md:p-8 rounded-[20px] md:rounded-[32px] transform will-change-transform hover:bg-black/10 transition-colors duration-500 shadow-sm"
                                >
                                    <div className="text-3xl md:text-4xl lg:text-5xl font-black mb-1 md:mb-2 tracking-tighter">{stat.value}</div>
                                    <div className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] opacity-50">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Vertical Divider */}
                <div className="w-full h-px bg-black/10 mb-16 md:mb-32 relative">
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-accent-black px-6 py-2">
                        <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                    </div>
                </div>

                {/* Nested Treatments */}
                {children}
            </div>
        </section>
    );
};

export default StatsSection;
