import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Link } from 'react-router-dom';
import happyPeopleImg from '../assets/happy_people.png';

gsap.registerPlugin(ScrollTrigger);

const WellnessSection = () => {
    const sectionRef = useRef(null);
    const contentRef = useRef(null);
    const imageRef = useRef(null);

    useEffect(() => {
        const section = sectionRef.current;
        const content = contentRef.current;
        const image = imageRef.current;

        gsap.fromTo(content,
            { x: -50, opacity: 0 },
            {
                x: 0,
                opacity: 1,
                duration: 1.2,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: section,
                    start: "top 70%",
                    toggleActions: "play none none reverse"
                }
            }
        );

        gsap.fromTo(image,
            { x: 50, opacity: 0 },
            {
                x: 0,
                opacity: 1,
                duration: 1.2,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: section,
                    start: "top 70%",
                    toggleActions: "play none none reverse"
                }
            }
        );
    }, []);

    return (
        <section ref={sectionRef} className="relative w-full py-24 pb-0 overflow-hidden bg-gradient-to-r from-[#011612] via-[#043329] to-[#011612] animate-gradient-x text-white">
            <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16 mb-24">
                <div className="grid md:grid-cols-2 gap-16 items-center">

                    {/* Left Column: Content */}
                    <div ref={contentRef} className="space-y-10">
                        <div className="space-y-4">
                            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none mb-6">
                                Personalized health <br />
                                <span className="text-accent-green">made simple</span>
                            </h2>
                            <p className="text-xl text-text-muted font-medium mb-8">
                                Specialized care for Weight Loss, Hair Restoration, Sexual Health, and Longevity.
                            </p>
                        </div>

                        <div className="space-y-8">
                            <div className="flex gap-6 group">
                                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-accent-green/10 flex items-center justify-center border border-accent-green/20 group-hover:bg-accent-green/20 transition-colors">
                                    <span className="text-accent-green font-bold text-xl">01</span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold mb-2 uppercase tracking-wide">100% online experience</h3>
                                    <p className="text-text-muted text-lg leading-relaxed">
                                        Skip the waiting room. Access specialized treatments and consult with medical experts from the comfort of your home.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-6 group">
                                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-accent-green/10 flex items-center justify-center border border-accent-green/20 group-hover:bg-accent-green/20 transition-colors">
                                    <span className="text-accent-green font-bold text-xl">02</span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold mb-2 uppercase tracking-wide">Expert medical support</h3>
                                    <p className="text-text-muted text-lg leading-relaxed">
                                        Get unlimited follow-up support and direct access to board-certified doctors who specialize in your specific health goals.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-6 group">
                                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-accent-green/10 flex items-center justify-center border border-accent-green/20 group-hover:bg-accent-green/20 transition-colors">
                                    <span className="text-accent-green font-bold text-xl">03</span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold mb-2 uppercase tracking-wide">Tailored medications</h3>
                                    <p className="text-text-muted text-lg leading-relaxed">
                                        Science-backed protocols and compounded medications designed to optimize your health, performance, and longevity.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <Link to="/qualify" className="bg-white text-bg-primary px-10 py-5 rounded-full font-black uppercase tracking-widest hover:bg-accent-green transition-all shadow-2xl transform hover:scale-105 active:scale-95 inline-block">
                            Start My Assessment
                        </Link>
                    </div>

                    {/* Right Column: Image */}
                    <div ref={imageRef} className="relative">
                        <div className="absolute -inset-4 bg-accent-green/20 blur-3xl rounded-full opacity-30"></div>
                        <div className="relative rounded-[40px] overflow-hidden shadow-2xl border border-white/10 group">
                            <img
                                src={happyPeopleImg}
                                alt="GLP-GLOW Success Stories"
                                className="w-full h-full object-cover aspect-[4/5] transform transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-bg-primary/80 to-transparent opacity-60"></div>

                            <div className="absolute bottom-8 left-8 right-8 bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-2xl transform flex items-center gap-4">
                                <div className="w-12 h-12 bg-accent-green rounded-full flex items-center justify-center flex-shrink-0 animate-pulse">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-white font-bold uppercase text-sm tracking-widest">Medical Board Review</p>
                                    <p className="text-white/60 text-xs uppercase tracking-wider">Certified Physicians</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Full Width Trust Bar */}
            <div className="w-full border-t border-white/10 bg-black/20 backdrop-blur-sm py-8">
                <div className="w-full px-8 md:px-16 flex flex-nowrap justify-between items-center gap-6 md:gap-12 overflow-x-auto scrollbar-hide">
                    <div className="flex items-center gap-3 text-[9px] md:text-[11px] font-black uppercase tracking-[0.3em] text-white/90 whitespace-nowrap">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent-green shadow-[0_0_8px_rgba(191,255,0,0.6)]"></div>
                        LegitScript Certified
                    </div>
                    <div className="flex items-center gap-3 text-[9px] md:text-[11px] font-black uppercase tracking-[0.3em] text-white/90 whitespace-nowrap">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent-green shadow-[0_0_8px_rgba(191,255,0,0.6)]"></div>
                        HIPAA Compliant
                    </div>
                    <div className="flex items-center gap-3 text-[9px] md:text-[11px] font-black uppercase tracking-[0.3em] text-white/90 whitespace-nowrap">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent-green shadow-[0_0_8px_rgba(191,255,0,0.6)]"></div>
                        FDA-regulated Pharmacies
                    </div>
                    <div className="flex items-center gap-3 text-[9px] md:text-[11px] font-black uppercase tracking-[0.3em] text-white/90 whitespace-nowrap">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent-green shadow-[0_0_8px_rgba(191,255,0,0.6)]"></div>
                        Eligible HSA/FSA expense
                    </div>
                </div>
            </div>
        </section>
    );
};

export default WellnessSection;
