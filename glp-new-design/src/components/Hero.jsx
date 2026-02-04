import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';

// Background images
import heroBg1 from '../assets/main_bg.png';
import heroBg2 from '../assets/main_bg_2.png';
import heroBg3 from '../assets/main-bg-3.png';
import heroBg4 from '../assets/main_bg_4.png';

const Hero = () => {
    const heroRef = useRef(null);
    const bgContainerRef = useRef(null);

    const [currentSlide, setCurrentSlide] = useState(0);
    const images = [heroBg1, heroBg2, heroBg3, heroBg4];

    useEffect(() => {
        // Auto-slide effect
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % images.length);
        }, 5000);

        return () => clearInterval(timer);
    }, [images.length]);

    useEffect(() => {
        // Cross-fade animation between slides
        const slides = bgContainerRef.current.children;

        gsap.to(slides, {
            opacity: 0,
            duration: 1.5,
            ease: "power2.inOut"
        });

        gsap.to(slides[currentSlide], {
            opacity: 1,
            duration: 1.5,
            ease: "power2.inOut"
        });

        // Subtle zoom effect for active slide
        gsap.fromTo(slides[currentSlide],
            { scale: 1.1 },
            { scale: 1, duration: 5, ease: "linear" }
        );

    }, [currentSlide]);

    return (
        <section className="relative h-screen w-full overflow-hidden flex items-center justify-center bg-bg-primary" ref={heroRef}>
            {/* Background Slider Container */}
            <div className="absolute top-0 left-0 w-full h-full z-0 " ref={bgContainerRef}>
                {images.map((img, index) => (
                    <div
                        key={index}
                        className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
                        style={{ zIndex: index === currentSlide ? 1 : 0 }}
                    >
                        <img
                            src={img}
                            alt={`Slide ${index + 1}`}
                            className="w-full h-full object-cover"
                        />
                    </div>
                ))}
            </div>

            {/* Mobile Full-Screen Overlay */}
            <div className="md:hidden absolute inset-0 z-20 bg-black/50 backdrop-blur-md flex flex-col items-center justify-center px-6 text-center">
                <div className="inline-block py-2 px-6 bg-accent-green/10 border border-accent-green/20 rounded-full text-[10px] font-black uppercase tracking-[0.4em] text-accent-green mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    Clinical Protocols
                </div>

                <h1 className="text-5xl font-black uppercase tracking-tighter text-white mb-8 italic leading-[0.85] drop-shadow-2xl animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-200">
                    Precision <br />
                    <span className="text-accent-green">Biology.</span> <br />
                    Peak <span className="text-accent-green">Performance.</span>
                </h1>

                <p className="text-lg font-medium text-white/70 mb-12 leading-relaxed max-w-xs animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-400">
                    Medical-grade protocols tailored to your unique genetic blueprint.
                </p>

                <div className="flex flex-col w-full max-w-[300px] gap-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-500">
                    <Link
                        to="/qualify"
                        className="w-full bg-accent-green text-black py-5 rounded-full text-xs font-black uppercase tracking-widest hover:bg-white transition-all shadow-[0_10px_40px_rgba(191,255,0,0.3)]"
                    >
                        Start Assessment
                    </Link>
                    <button
                        onClick={() => {
                            const statsSection = document.querySelector('#stats-section');
                            if (statsSection) statsSection.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="w-full bg-white/5 text-white border border-white/10 py-5 rounded-full text-xs font-black uppercase tracking-widest"
                    >
                        View Treatments
                    </button>
                </div>
            </div>

            <div className="hidden md:block absolute bottom-10 left-0 w-full z-20 px-5">
                <div className="max-w-[1400px] 2xl:max-w-[1800px] 3xl:max-w-none mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-5">
                    {[
                        { title: "Weight Loss", desc: "Semaglutide & Tirzepatide", price: "Starts at $299", path: "weight-loss" },
                        { title: "Hair Restoration", desc: "Finasteride & Minoxidil", price: "Personalized Plans", path: "hair-restoration" },
                        { title: "Sexual Health", desc: "Sildenafil & Oxytocin", price: "Discreet Shipping", path: "sexual-health" }
                    ].map((product, index) => (
                        <Link key={index} to={`/qualify?category=${product.path}`} className="block bg-black/40 backdrop-blur-md border border-white/10 p-4 md:p-6 rounded-xl hover:border-accent-green transition-all duration-300 group cursor-pointer hover:-translate-y-1 text-left">
                            <h3 className="text-base md:text-xl font-bold text-white mb-1 group-hover:text-accent-green transition-colors">{product.title}</h3>
                            <p className="text-text-muted text-xs md:text-sm mb-2 md:mb-3">{product.desc}</p>
                            <div className="flex justify-between items-center flex-wrap gap-2">
                                <span className="text-accent-blue font-semibold text-xs md:text-sm">{product.price}</span>
                                <span className="text-[10px] md:text-xs uppercase font-bold tracking-wider text-white group-hover:text-accent-green flex items-center gap-1 md:gap-2">
                                    Start Assessment <span className="text-sm md:text-lg">→</span>
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Slide Indicators */}
            <div className="absolute bottom-1 md:bottom-4 left-1/2 -translate-x-1/2 z-30 flex gap-2">
                {images.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentSlide(index)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentSlide ? 'bg-accent-green w-8' : 'bg-white/50'}`}
                    />
                ))}
            </div>
        </section>
    );
};

export default Hero;

