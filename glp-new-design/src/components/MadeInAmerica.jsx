import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Fallback images from existing assets
import microscopeImg from '../assets/lab_microscope.png';
import labAnalysisImg from '../assets/lab_analysis.png';
import deliveryImg from '../assets/medication_delivery.png';

gsap.registerPlugin(ScrollTrigger);

const MadeInAmerica = () => {
    const sectionRef = useRef(null);
    const titleRef = useRef(null);
    const imagesRef = useRef([]);
    const textRef = useRef(null);

    useEffect(() => {
        const section = sectionRef.current;
        const title = titleRef.current;
        const images = imagesRef.current;
        const text = textRef.current;

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: section,
                start: "top 75%",
                toggleActions: "play none none reverse"
            }
        });

        tl.fromTo(title,
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }
        )
            .fromTo(images,
                { y: 50, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.8, stagger: 0.2, ease: "power3.out" },
                "-=0.4"
            )
            .fromTo(text,
                { y: 20, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" },
                "-=0.4"
            );
    }, []);

    const addToImagesRef = (el) => {
        if (el && !imagesRef.current.includes(el)) {
            imagesRef.current.push(el);
        }
    };

    return (
        <section ref={sectionRef} className="w-full py-24 bg-[#F9F7F2] text-[#1A1A1A] overflow-hidden">
            <div className="max-w-7xl mx-auto px-6">

                {/* Header */}
                <div ref={titleRef} className="text-center mb-16 flex flex-col items-center">

                    <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
                        Made in America
                    </h2>
                </div>

                {/* Image Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                    <div ref={addToImagesRef} className="rounded-2xl overflow-hidden aspect-[4/3] shadow-sm hover:shadow-xl transition-shadow duration-500 border border-black/5">
                        <img src={microscopeImg} alt="Microscope view" className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700" />
                    </div>
                    <div ref={addToImagesRef} className="rounded-2xl overflow-hidden aspect-[4/3] shadow-sm hover:shadow-xl transition-shadow duration-500 border border-black/5">
                        <img src={labAnalysisImg} alt="Lab analysis" className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700" />
                    </div>
                    <div ref={addToImagesRef} className="rounded-2xl overflow-hidden aspect-[4/3] shadow-sm hover:shadow-xl transition-shadow duration-500 border border-black/5">
                        <img src={deliveryImg} alt="Medication pharmacy" className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700" />
                    </div>
                </div>

                {/* Footer Text */}
                <div ref={textRef} className="max-w-3xl mx-auto text-center">
                    <p className="text-lg md:text-2xl font-medium leading-relaxed text-[#4A4A4A]">
                        Our medications are compounded in <span className="font-bold text-[#1A1A1A]">U.S.-based, FDA-regulated</span> pharmacies held to the highest quality control standards.
                    </p>
                </div>
            </div>
        </section>
    );
};

export default MadeInAmerica;
