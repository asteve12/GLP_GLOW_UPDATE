import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const doctors = [
    {
        name: "Dr. Jonathan Smith",
        specialty: "Metabolic Specialist",
        image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=800&q=80",
    },
    {
        name: "Dr. Sarah Chen",
        specialty: "Endocrinologist",
        image: "https://images.unsplash.com/photo-1559839734-2b71f1e3c77b?w=800&q=80",
    },
    {
        name: "Dr. Michael Ross",
        specialty: "Integrative Medicine",
        image: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=800&q=80",
    },
    {
        name: "Dr. Elena Rodriguez",
        specialty: "Longevity Expert",
        image: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=800&q=80",
    },
    {
        name: "Dr. David Liu",
        specialty: "Internal Medicine",
        image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=800&q=80",
    },
];

const DoctorSlider = () => {
    const sectionRef = useRef(null);
    const scrollRef = useRef(null);
    const timeline = useRef(null);

    useEffect(() => {
        const el = sectionRef.current;
        const scrollEl = scrollRef.current;

        // Entrance animations for header content
        gsap.fromTo(".doctor-header-content",
            { y: 50, opacity: 0 },
            {
                y: 0,
                opacity: 1,
                duration: 1,
                stagger: 0.2,
                scrollTrigger: {
                    trigger: el,
                    start: "top 80%",
                    toggleActions: "play none none reverse"
                }
            }
        );

        // Infinite Scroll Animation using GSAP
        timeline.current = gsap.to(scrollEl, {
            xPercent: -50,
            duration: 30,
            ease: "none",
            repeat: -1
        });

        return () => {
            if (timeline.current) timeline.current.kill();
        };
    }, []);

    const handleMouseEnter = () => {
        if (timeline.current) timeline.current.pause();
    };

    const handleMouseLeave = () => {
        if (timeline.current) timeline.current.play();
    };

    return (
        <section ref={sectionRef} className="w-full py-32 bg-[#170700] text-[#FAF9F6] overflow-hidden relative">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#FFC7A2]/10 rounded-full blur-[120px] -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-black/40 rounded-full blur-[100px] -ml-32 -mb-32"></div>

            <div className="max-w-[1400px] 2xl:max-w-[1800px] 3xl:max-w-none mx-auto px-6 mb-20 relative z-10">
                <div className="grid lg:grid-cols-12 gap-12 items-end">
                    <div className="lg:col-span-7 doctor-header-content">
                        <div className="inline-block py-2 px-4 bg-[#FFC7A2]/10 border border-[#FFC7A2]/20 rounded-full text-[10px] font-bold uppercase tracking-[0.3em] mb-8 text-[#FFC7A2]">
                            World Class Expertise
                        </div>
                        <h2 className="text-5xl md:text-7xl font-black leading-[0.9] tracking-tighter uppercase italic">
                            Meet the <span className="text-[#FFC7A2] underline decoration-wavy decoration-1 underline-offset-8">incredible</span> doctors <br />
                            we've partnered with.
                        </h2>
                    </div>
                    <div className="lg:col-span-5 doctor-header-content space-y-8">
                        <p className="text-xl text-[#FAF9F6]/60 leading-relaxed font-medium">
                            <span className="font-brand font-bold italic-u">u</span><span className="font-brand font-bold">Glow<sup>MD</sup></span> physicians are here to guide you every step of the way, bringing both their expertise and genuine care to keep you supported.
                        </p>
                        <button className="bg-[#FFC7A2] text-[#170700] px-10 py-5 rounded-full font-black uppercase tracking-widest hover:bg-[#FAF9F6] transition-all shadow-2xl transform hover:scale-105 active:scale-95 text-xs">
                            Take the Assessment
                        </button>
                    </div>
                </div>
            </div>

            {/* Sliding Doctors Section */}
            <div className="relative w-full z-10">
                <div
                    ref={scrollRef}
                    className="flex gap-10 whitespace-nowrap px-6"
                    style={{ width: 'max-content' }}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    {/* Double the list for seamless scroll */}
                    {[...doctors, ...doctors].map((doc, i) => (
                        <div key={i} className="relative w-[320px] md:w-[480px] h-[550px] md:h-[650px] rounded-[48px] overflow-hidden group cursor-pointer flex-shrink-0 border border-white/5 shadow-2xl">
                            <img
                                src={doc.image}
                                alt={doc.name}
                                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                            />
                            {/* Sophisticated Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#170700] via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-700"></div>
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-700"></div>

                            {/* Floating Badge */}
                            <div className="absolute top-8 left-8 bg-white/10 backdrop-blur-xl border border-white/20 px-4 py-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 transform -translate-y-4 group-hover:translate-y-0">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-[#FFC7A2]">Certified Provider</span>
                            </div>

                            {/* Text Content */}
                            <div className="absolute bottom-12 left-12 right-12 text-[#FAF9F6] transform transition-transform duration-500 group-hover:-translate-y-2">
                                <h3 className="text-3xl md:text-4xl font-black mb-3 tracking-tight">{doc.name}</h3>
                                <div className="flex items-center gap-3">
                                    <div className="h-px w-8 bg-[#FFC7A2]"></div>
                                    <p className="text-sm text-[#FFC7A2] uppercase tracking-[0.2em] font-bold">{doc.specialty}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom Glow */}
            <div className="absolute bottom-0 right-0 w-full h-px bg-gradient-to-r from-transparent via-[#FFC7A2]/20 to-transparent"></div>
        </section>
    );
};

export default DoctorSlider;
