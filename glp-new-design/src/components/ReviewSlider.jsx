import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const reviews = [
    {
        category: "Weight Loss",
        name: "Sarah M.",
        result: "Lost 45lbs",
        timeline: "4 months",
        quote: "Confidence restored",
        subQuote: "More energy than ever",
        beforeImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop",
        afterImage: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=400&fit=crop"
    },
    {
        category: "Hair Restoration",
        name: "James T.",
        result: "Fuller Hair",
        timeline: "6 months",
        quote: "No more hats",
        subQuote: "Scalp looks amazing",
        beforeImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
        afterImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop"
    },
    {
        category: "Sexual Health",
        name: "Robert L.",
        result: "Peak Performance",
        timeline: "2 weeks",
        quote: "Life changed",
        subQuote: "Improved intimacy",
        beforeImage: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop",
        afterImage: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop"
    },
    {
        category: "Longevity",
        name: "Elena G.",
        result: "Optimal Vitality",
        timeline: "3 months",
        quote: "Feeling 20 again",
        subQuote: "Energy levels skyrocketed",
        beforeImage: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop",
        afterImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop"
    },
];

const ReviewSlider = () => {
    const sectionRef = useRef(null);
    const scrollRef = useRef(null);
    const timeline = useRef(null);

    useEffect(() => {
        const el = sectionRef.current;
        const scrollEl = scrollRef.current;

        // Entry animation for the whole section
        gsap.fromTo(el,
            { opacity: 0, y: 50 },
            {
                opacity: 1,
                y: 0,
                duration: 1,
                scrollTrigger: {
                    trigger: el,
                    start: "top 80%",
                    toggleActions: "play none none reverse"
                }
            }
        );

        // Infinite Scroll Animation using GSAP
        // We move the container by 33.33% because we have 3 copies of the cards
        timeline.current = gsap.to(scrollEl, {
            xPercent: -33.33,
            duration: 40,
            ease: "none",
            repeat: -1
        });

        // Cleanup on unmount
        return () => {
            if (timeline.current) {
                timeline.current.kill();
            }
        };
    }, []);

    const handleMouseEnter = () => {
        if (timeline.current) {
            timeline.current.pause();
        }
    };

    const handleMouseLeave = () => {
        if (timeline.current) {
            timeline.current.play();
        }
    };

    return (
        <section ref={sectionRef} className="w-full py-12 md:py-20 overflow-hidden bg-bg-primary/5 backdrop-blur-sm border-t border-white/5">
            <div className="mb-8 md:mb-12 text-center max-w-[1400px] 2xl:max-w-[1800px] 3xl:max-w-none mx-auto px-4">
                <h2 className="text-3xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter text-white drop-shadow-md mb-4 md:mb-6">Real Results. <br /><span className="text-accent-green">Real Transformations.</span></h2>
                <p className="text-base md:text-lg lg:text-xl text-white/90 font-medium leading-relaxed mb-4 md:mb-8">
                    From weight loss to hair restoration, see how GLP-GLOW is helping patients reclaim their confidence and vitality.
                </p>
            </div>

            <div className="success-stories-container relative w-full overflow-hidden">
                <div
                    ref={scrollRef}
                    className="flex gap-4 md:gap-6 whitespace-nowrap px-4 md:px-6"
                    style={{ width: 'max-content' }}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    {/* Triple the list for seamless infinite scroll */}
                    {[...reviews, ...reviews, ...reviews].map((story, i) => (
                        <div key={i} className="success-story-card inline-block w-[280px] md:w-[350px] lg:w-[400px] bg-white rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl flex-shrink-0 whitespace-normal transition-all duration-500 hover:scale-[1.03] hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)] group cursor-pointer">
                            {/* Category Label */}
                            <div className="bg-bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 text-center group-hover:bg-accent-green group-hover:text-bg-primary transition-colors duration-300">
                                {story.category}
                            </div>

                            {/* Before/After Images */}
                            <div className="flex h-[180px] md:h-[220px] lg:h-[250px] relative overflow-hidden">
                                <div className="w-1/2 h-full relative border-r border-white/20">
                                    <img src={story.beforeImage} alt="Before" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                    <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">Before</span>
                                </div>
                                <div className="w-1/2 h-full relative">
                                    <img src={story.afterImage} alt="After" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                    <span className="absolute bottom-2 right-2 bg-accent-green text-black text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">After</span>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6 md:p-8 text-center bg-[#F7F8F1] transition-colors duration-300 group-hover:bg-white">
                                <div className="inline-block bg-accent-green text-bg-primary font-black text-lg md:text-xl px-3 md:px-4 py-1 rounded-full mb-3 transform -rotate-2 group-hover:rotate-0 transition-transform duration-300">
                                    {story.result}
                                </div>
                                <h3 className="font-bold text-base md:text-lg text-gray-900 mb-1">{story.name}</h3>
                                <p className="text-xs md:text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 md:mb-4">Results in {story.timeline}</p>

                                <div className="border-t border-black/5 pt-4">
                                    <p className="text-base md:text-lg font-serif italic text-gray-800 leading-tight mb-2">"{story.quote}"</p>
                                    <p className="text-xs md:text-sm text-accent-green font-bold uppercase tracking-wider">{story.subQuote}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default ReviewSlider;
