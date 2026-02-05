import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import weightLossImg from '../assets/weight-loss.png';
import hairLossImg from '../assets/hair-loss.png';
import mensHealthImg from '../assets/mens-health.png';
import longevityImg from '../assets/longevity.png';

gsap.registerPlugin(ScrollTrigger);

const categories = [
    {
        id: 'weight-loss',
        title: 'Weight Loss',
        description: 'Semaglutide & Tirzepatide Injections and Drops',
        image: weightLossImg,
        products: ['Semaglutide', 'Tirzepatide', 'Retatruide (Waitlist)']
    },
    {
        id: 'hair-loss',
        title: 'Hair Loss',
        description: 'Finasteride, Minoxidil & Tretinoin Complexes',
        image: hairLossImg,
        products: ['Finasteride', 'Minoxidil', 'Tretinoin']
    },
    {
        id: 'mens-health',
        title: 'Sexual Health',
        description: 'Sildenafil, Tadalafil & Oxytocin Performance Boosters',
        image: mensHealthImg,
        products: ['Sildenafil', 'Tadalafil', 'Oxytocin']
    },
    {
        id: 'longevity',
        title: 'Longevity',
        description: 'NAD+ & Glutathione for Cellular Repair',
        image: longevityImg,
        products: ['NAD+', 'Glutathione', 'Retatruide']
    }
];

const ProductShowcase = () => {
    const sectionRef = useRef(null);

    useEffect(() => {
        const cards = gsap.utils.toArray('.product-card');

        gsap.fromTo(cards,
            { y: 50, opacity: 0 },
            {
                y: 0,
                opacity: 1,
                stagger: 0.2,
                duration: 1,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: sectionRef.current,
                    start: 'top 70%',
                    toggleActions: 'play none none reverse'
                }
            }
        );
    }, []);

    return (
        <div ref={sectionRef} id="treatments" className="w-full pb-24">
            <div className="max-w-[1400px] 2xl:max-w-[1800px] 3xl:max-w-none mx-auto px-5">
                <div className="mb-16 text-center">
                    <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-4 text-black text-center">
                        Clinical Treatments
                    </h2>
                    <p className="text-black max-w-2xl mx-auto font-bold uppercase tracking-widest text-sm">
                        Explore our comprehensive range of medical-grade treatments designed for your specific goals.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {categories.map((cat, index) => (
                        <div id={cat.id} key={cat.id} className="product-card group relative overflow-hidden rounded-2xl bg-[#020617] border border-white/5 hover:border-white/20 transition-all duration-500 shadow-2xl">
                            {/* Image Background with Overlay */}
                            <div className="absolute inset-0 z-0">
                                <img
                                    src={cat.image}
                                    alt={cat.title}
                                    className="w-full h-full object-cover opacity-30 transition-transform duration-700 group-hover:scale-110 group-hover:opacity-20"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/80 to-transparent"></div>
                            </div>

                            {/* Content */}
                            <div className="relative z-10 p-8 h-full flex flex-col justify-end min-h-[400px]">
                                <h3 className="text-3xl font-bold mb-2 text-white group-hover:text-accent-green transition-colors">{cat.title}</h3>
                                <p className="text-white/60 mb-6 text-lg">{cat.description}</p>

                                <div className="space-y-2 mb-8 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                                    {cat.products.map((p, i) => (
                                        <div key={i} className="flex items-center gap-2 text-sm font-medium text-white/80">
                                            <span className="w-1.5 h-1.5 rounded-full bg-accent-green"></span>
                                            {p}
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={() => window.location.href = `/qualify?category=${cat.id}`}
                                    className="w-full py-4 bg-white/5 border border-white/10 text-white hover:bg-accent-green hover:border-accent-green hover:text-black rounded text-sm uppercase font-bold tracking-widest transition-all duration-300 flex items-center justify-center gap-2 group/btn"
                                >
                                    Qualify Now <span className="group-hover/btn:translate-x-1 transition-transform">→</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ProductShowcase;
