import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';
import Navbar from './Navbar';
import weightlossVideo from '../assets/weightloss-video.mp4';
import intimateVideo from '../assets/intimate-glow-video.mp4';
import hairVideo from '../assets/hair-glow-video.mp4';
import longevityVideo from '../assets/longevity-glow-video-v3.mp4';
import labTestingImg from '../assets/lab-testing-image.png';
import testosteroneImg from '../assets/testosterone-image-v2.png';
import skincareImg from '../assets/skincare.png';
import glpPromoImg from '../assets/glp-promo-image.png';
import performancePromoImg from '../assets/performance-promo-image.png';
import registrationImg from '../assets/account-registration-image.jpg';
import prescribedImg from '../assets/get-prescribed-image.jpg';
import rxShipmentImg from '../assets/rx-shipment-image.jpg';
import drugImg from '../assets/drug.jpg';
import exerciseImg from '../assets/exercise.jpg';

const NewLandingPage = () => {
    const categories = [
        { text: 'Weight loss', color: 'text-orange-600' },
        { text: 'Better sex', color: 'text-black' },
        { text: 'Hair growth', color: 'text-pink-600' },
        { text: 'Lab testing', color: 'text-green-600' },
    ];

    const [index, setIndex] = useState(0);
    const [animationClass, setAnimationClass] = useState('translate-y-0 opacity-100');

    useEffect(() => {
        const interval = setInterval(() => {
            setAnimationClass('-translate-y-12 opacity-0');
            setTimeout(() => {
                setIndex((prev) => (prev + 1) % categories.length);
                setAnimationClass('translate-y-12 opacity-0');
                setTimeout(() => {
                    setAnimationClass('translate-y-0 opacity-100');
                }, 50);
            }, 500);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const [scrollProgress, setScrollProgress] = useState(0);
    const [hoveredCategory, setHoveredCategory] = useState(null);
    const stepsRef = useRef(null);

    useEffect(() => {
        const handleScroll = () => {
            if (!stepsRef.current) return;
            const element = stepsRef.current;
            const rect = element.getBoundingClientRect();
            const viewportHeight = window.innerHeight;

            // Calculate progress based on how much of the section has passed the center of the screen
            const start = rect.top;
            const height = rect.height;
            const progress = Math.max(0, Math.min(100, ((viewportHeight / 1.5 - start) / height) * 100));
            setScrollProgress(progress);
        };

        window.addEventListener('scroll', handleScroll);
        handleScroll(); // Initial check
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="bg-white font-sans text-[#1a1a1a]">
            <Navbar />

            <main>
                {/* Hero & Treatment Grid */}
                <section className="pt-8 pb-20">
                    <div className="max-w-[1200px] mx-auto px-6">
                        <div className="text-left mb-12 max-w-2xl">
                            <div className="h-[4.5rem] md:h-[6rem] overflow-hidden relative mb-2">
                                <span
                                    className={`absolute left-0 text-5xl md:text-7xl font-extrabold tracking-tight leading-tight transition-all duration-500 ease-in-out block whitespace-nowrap ${categories[index].color} ${animationClass}`}
                                >
                                    {categories[index].text}
                                </span>
                            </div>
                            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight leading-tight text-gray-900">
                                personalized to you
                            </h1>
                            <p className="text-gray-500 text-xl">Customized care starts here</p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl">
                            {[
                                { label: 'GLP-GLOW', title: 'Weight-Loss', slug: 'semaglutide-injection', video: weightlossVideo, img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAGvcK-3tlbjIWtIFzaWM7UB-wTXnw-xcTorW6EKs35Zb_MJiXGdjts9GTFCcPx0XZzTI1Qh1vGq6hb1prDR0eaNEpH4piu0z8vq_PuI7CF4i_owBUEOXYSK6Kup0sSYvQGgj605M_GTD1kkVjaXhmsxgjWiS2yKiOIrVJnvlEWVLgi2LRAkSrjY1pPqBBmtDRX9_9RvXOjXBBFa6XzTnv9GJ0mJjDaXpbdU7PfK6SPuk8oWULv6eZYwFrJQrCHiQve_khcChpRPYRs' },
                                { label: 'INTIMATE GLOW', title: 'Sex Health', slug: 'sildenafil-tadalafil-troche', video: intimateVideo, img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBk-P9ExB4ilqJL1UkZSLqJge4yP48tLNb4NIInHSChVNJ4-tp-eDJmz_C9fH2wGcuTmsRX-rXhip5YNc9X_8WcLdfWLlFag2oVcgukvK6oS-A5DcI7leabU9z7Heb7qDZLmvdRL7-iZ459vXeCgYNsT_qlszT5bSPygOfyiGwNulj_Ru5xtuDkS_lb5N4AJkgu91RhKfxIGz8k7H_wzR3avsYk98Kh_wTj5xciCsgE1QlVr1Sca73uKfdggWstfk-wqvqM-0vZzfSX' },
                                { label: 'HAIR GLOW', title: 'Hair Loss', slug: 'finasteride-tablets', video: hairVideo, img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAv6wve4IaUgF73Lo9B1lOz-pbcNVHhWnowiQfXy-87zYhvAlbWm2widJbI65HI5YwlAf2GzY6OQywDcS3OUvZixeZAoIq2P9qvgUkrXxhTZiYF06bSVuoAXspBMsea0t_am-c326QgzfcLrzcaeP6vQoTj-5Undg5PRT4U70mU39zB-vZZfWfujFbXUNXBXXRWkGDPfZ6d2aUr_NfcHh8D6Bagm_9YXhNGLq0IEeu7TwZAnfyEkRHCmdb_yBwn5j6BYouVBbyLzCHe' },
                                { label: 'LONGEVITY GLOW', title: 'Slows Aging & DNA Repair', slug: 'nad-injection', video: longevityVideo, img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDJ7-ipYFRVrPiuFu-R6Y_Sz-aTOJh48jBupdGHajJ_3zcvE-HEH7Fa-rZJCHUh9FTSkjph_G0F6YOjwrz_JJYRujbnPMWM2l88Qyk7zmNryvB8vONuE5BZg46zVMGF81az-AjwmB06-apba4vUCwfGLi7vygGnzxAkW4bcYSqRInUyYms82vs8AOdBcPEyBVV7mZOqSzjnITQqtC-XkqrjAgtSGEwI1MRDULuhtG6vqyL9VrBOmYFPkPiuDxrBrn6bZAvI2CU5p31V' },
                                { label: 'LAB TESTING', title: 'Biomarkers', slug: 'nad-nasal-spray', img: labTestingImg },
                                { label: 'TESTOSTERONE', title: 'Hormonal Therapy', slug: 'sildenafil-yohimbe-troche', img: testosteroneImg },
                                { label: 'SKIN GLOW', title: 'Skin Care', slug: 'glutathione-injection', img: skincareImg },
                            ]
                                .map((item, i) => {
                                    const categoryMap = {
                                        'semaglutide-injection': 'weight-loss',
                                        'sildenafil-tadalafil-troche': 'sexual-health',
                                        'finasteride-tablets': 'hair-restoration',
                                        'nad-injection': 'longevity',
                                        'nad-nasal-spray': 'longevity',
                                        'sildenafil-yohimbe-troche': 'sexual-health',
                                        'glutathione-injection': 'longevity'
                                    };
                                    const categoryId = categoryMap[item.slug] || 'weight-loss';

                                    return (
                                        <Link key={i} to={`/assessment/${categoryId}`} className="relative rounded-2xl overflow-hidden aspect-square group cursor-pointer transition-all duration-300 hover:shadow-xl">
                                            {item.video ? (
                                                <video
                                                    autoPlay
                                                    loop
                                                    muted
                                                    playsInline
                                                    className="w-full h-full object-cover brightness-[0.85] group-hover:scale-105 transition-transform duration-500"
                                                >
                                                    <source src={item.video} type="video/mp4" />
                                                </video>
                                            ) : (
                                                <img alt={item.title} className="w-full h-full object-cover brightness-[0.85] group-hover:scale-105 transition-transform duration-500" src={item.img} />
                                            )}
                                            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-white">
                                                <span className="text-[10px] tracking-widest uppercase mb-1">{item.label}</span>
                                                <span className="text-lg font-bold text-center">{item.title}</span>
                                            </div>
                                        </Link>
                                    );
                                })}
                            <div
                                onClick={() => window.dispatchEvent(new CustomEvent('openMobileMenu'))}
                                className="relative rounded-2xl overflow-hidden aspect-square group cursor-pointer bg-gray-50 flex items-center justify-center border-2 border-dashed border-gray-200 hover:border-black transition-colors"
                            >
                                <span className="text-sm font-bold text-gray-500 hover:text-black">Browse all treatments →</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Glow Smarter Banner */}
                <section className="py-6 md:py-12">
                    <div className="max-w-[1200px] mx-auto px-0 md:px-6">
                        <div className="relative rounded-none md:rounded-[40px] overflow-hidden bg-[#0a0a0a] group">
                            <img alt="Promotional banner" className="w-full h-auto block transition-transform duration-700 group-hover:scale-105" src={glpPromoImg} />
                            <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-500"></div>
                            <div className="absolute right-8 bottom-8 md:right-12 md:bottom-12 z-10">
                                <Link to="/qualify?category=weight-loss" className="bg-white text-black px-10 py-4 rounded-full text-sm font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-all duration-300 shadow-2xl inline-block scale-110">Get started</Link>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Performance Banner */}
                <section className="py-0">
                    <div className="w-full">
                        <div className="relative overflow-hidden bg-[#0a0a0a] group h-[218vh] md:h-[133vh] flex items-center">
                            <img alt="Performance banner" className="w-full h-full object-cover block transition-transform duration-700 group-hover:scale-105" src={performancePromoImg} />
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500"></div>
                            <div className="absolute right-8 bottom-8 md:right-12 md:bottom-12 z-10">
                                <Link to="/qualify?category=sexual-health" className="bg-white text-black px-10 py-4 rounded-full text-sm font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-all duration-300 shadow-2xl inline-block scale-110">Get started</Link>
                            </div>
                        </div>
                    </div>
                </section>

                {/* How It Works */}
                <section className="py-24 overflow-hidden relative" ref={stepsRef}>
                    <div className="max-w-[1400px] mx-auto px-6">
                        <div className="relative">
                            <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-gray-200 -translate-x-1/2 hidden md:block"></div>
                            <div
                                className="absolute left-1/2 top-0 w-[1px] bg-black -translate-x-1/2 hidden md:block transition-all duration-100 ease-out"
                                style={{ height: `${scrollProgress}%` }}
                            ></div>

                            {/* Step 1 */}
                            <div className="flex flex-col md:flex-row items-center gap-24 mb-48 relative">
                                <div className="w-full md:w-1/2 flex justify-center md:justify-end z-10">
                                    <div className="w-full max-w-[500px] h-[600px] rounded-[32px] overflow-hidden shadow-2xl transition-transform hover:-translate-y-2 duration-500">
                                        <img alt="Account Registration" className="w-full h-full object-cover" src={registrationImg} />
                                    </div>
                                </div>
                                <div className={`absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full border-4 border-white z-20 hidden md:block transition-colors duration-500 ${scrollProgress > 10 ? 'bg-black' : 'bg-gray-300'}`}></div>
                                <div className="w-full md:w-1/2 md:pl-12 text-center md:text-left">
                                    <h3 className="text-2xl font-bold mb-4 italic" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>1. Account Registration</h3>
                                    <p className="text-gray-600 max-w-sm mx-auto md:mx-0 mb-6">Complete a quick online evaluation to determine if this prescription medication is right for you. Our team of licensed professionals will review your information and provide approval within 24-48 business hours.</p>
                                    <Link to="/qualify?category=weight-loss" className="bg-black text-white px-8 py-3 rounded-md text-sm font-bold hover:bg-gray-800 transition-colors inline-block">Get started</Link>
                                </div>
                            </div>

                            {/* Step 2 */}
                            <div className="flex flex-col md:flex-row-reverse items-center gap-24 mb-48 relative">
                                <div className="w-full md:w-1/2 flex justify-center md:justify-start z-10">
                                    <div className="w-full max-w-[500px] h-[600px] rounded-[32px] overflow-hidden shadow-2xl transition-transform hover:-translate-y-2 duration-500">
                                        <img alt="Get Prescribed" className="w-full h-full object-cover" src={prescribedImg} />
                                    </div>
                                </div>
                                <div className={`absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full border-4 border-white z-20 hidden md:block transition-colors duration-500 ${scrollProgress > 50 ? 'bg-black' : 'bg-gray-300'}`}></div>
                                <div className="w-full md:w-1/2 md:pr-4 md:pl-12 text-center md:text-left">
                                    <h3 className="text-2xl font-bold mb-4 italic" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>2. Get Prescribed</h3>
                                    <p className="text-gray-600 max-w-sm mx-auto md:mx-0 mb-6">Once approved, you'll receive personalized care and a prescription to support your weight loss and health goals. Your care plan is designed to help you achieve lasting results safely and effectively.</p>
                                    <Link to="/qualify?category=weight-loss" className="bg-black text-white px-8 py-3 rounded-md text-sm font-bold hover:bg-gray-800 transition-colors inline-block">Get started</Link>
                                </div>
                            </div>

                            {/* Step 3 */}
                            <div className="flex flex-col md:flex-row items-center gap-24 relative">
                                <div className="w-full md:w-1/2 flex justify-center md:justify-end z-10">
                                    <div className="w-full max-w-[500px] h-[600px] rounded-[32px] overflow-hidden shadow-2xl transition-transform hover:-translate-y-2 duration-500">
                                        <img alt="Rx Delivered" className="w-full h-full object-cover" src={rxShipmentImg} />
                                    </div>
                                </div>
                                <div className={`absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full border-4 border-white z-20 hidden md:block transition-colors duration-500 ${scrollProgress > 90 ? 'bg-black' : 'bg-gray-300'}`}></div>
                                <div className="w-full md:w-1/2 md:pl-12 text-center md:text-left">
                                    <h3 className="text-2xl font-bold mb-4 italic" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>3. Rx Shipment Arrived</h3>
                                    <p className="text-gray-600 max-w-sm mx-auto md:mx-0 mb-6">Your medication will be shipped directly to your door for maximum convenience. With uGlowMD, starting your treatment is as simple as opening your package and following our easy-to-use instructions.</p>
                                    <Link to="/qualify?category=weight-loss" className="bg-black text-white px-8 py-3 rounded-md text-sm font-bold hover:bg-gray-800 transition-colors inline-block">Get started</Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Expert Care Section */}
                <section className="py-24 bg-[#fcfcfc]">
                    <div className="max-w-[1200px] mx-auto px-6 text-center">
                        <h2 className="text-3xl md:text-5xl font-bold mb-4 italic" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>The best care <br />by the best in medicine</h2>
                        <p className="text-gray-500 text-sm mb-16 max-w-lg mx-auto">Meet the team of leading specialists with decades of combined experience across key specialties.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16 max-w-4xl mx-auto text-left">
                            {[
                                {
                                    name: "Dr. Craig Primack, MD",
                                    role: "Head of Weight Loss at uGlowMD",
                                    specialty: "Internal Health • Modern Health",
                                    color: "text-orange-600",
                                    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAbijEkmIYX8eDTl0s4vu5Hix0ilIF6AUl_4_4BYJ24T6lrZlGT_1cI-MNcyiMl_al2DTPdL26oDJzheo4he-JooAr1jJUSot0YPKkzMAUD3O-bZWlbjwItseWSKJ0xrWHsHPvKO_rdBgvd_I_kah9kC3fRLfPWjxy5bxXFZuKwUyiei4uoP7URlstzaUAn503RuYPsOQtgazZFn-yMQQSGfeLQhXLKKcmlGgUnXirchz_lZI0F256pu1O7SMVELofWu1Z18WlXvQ1T",
                                    bio: "A nationally recognized obesity specialist, Dr. Primack regularly educates clinicians across the country on evidence-based metabolic and weight management care."
                                },
                                {
                                    name: "Dr. Peter Stahl, MD",
                                    role: "Head of Men's Sexual Health & Urology",
                                    specialty: "Men's Health • Modern Health",
                                    color: "text-black",
                                    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAFE1MsNPrVl7Quf1l_gbqDsBqCWIHHuBMjDmNqLM390g1Y1LIS-6QPgG_of9e1CDVP6PR2MnO62ghpxvwdH578E7fCd8gm2C08nkMPxpyD3Q2O8y2__AOoS7v5LfU4EXFIjzL430BLr6fPTzSouxrWcs-BIOflL0DUGgNN4tV8712fQal5IHnM0CXndKiaxfQBWcbHpU0qYx42LP8OettmuY7k1EhpKf9NOvJhuTwahHmoCR0Mku28g-4GGPvEcQ2W69r9sA7bJ-IU",
                                    bio: "A recognized leader in urology, hormonal health, and complex sexual medicine, Dr. Stahl is focused on clinical-led biological solutions that enhance energy, sexual function, and metabolic performance in men."
                                },
                                {
                                    name: "Dr. Alisa Williams, MD",
                                    role: "Head of Medical Affairs at uGlowMD",
                                    specialty: "Alternative Health • Live & Grow Health",
                                    color: "text-pink-600",
                                    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuC8J4RrNj450LUshg1IZk9FqnLReTbTeGN26x4AacwNSxeI6tH7iqlGj5PrAqfx4ZGv5p7VbwgyWTkN9gDVPfMhxfoHGBly2p3jgCaOS7pSx94VarTepjtIN5tmlJY6wOOu5bbgzG0Nnd247200SZvn0H3KAHmas0N4FYjAhLDGkx6aqzZqPJxBpZghXHuj5RL9OMFm8un5FedjcuOcL2tEKym1dJEKaniUjqzbh_Wa2eGvgwgPybUiw7rr4-bu1fqm9qJ1clmsenBL",
                                    bio: "A board-certified family medicine physician with extensive experience in dermatology, Dr. Williams brings years of clinical expertise to the uGlowMD patient experience."
                                },
                                {
                                    name: "Dr. Alice Marquet, MD",
                                    role: "Endocrinology Advisor",
                                    specialty: "Thyroid Health",
                                    color: "text-green-600",
                                    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDdxwW8rykXbc9G48XoFFYhM232y8ivO8HWuwv-sOTxx81y6QnFIzCdHY-woiPPJrGuYE3FQbUehKB5KEyDAkeDOGEua1fyy5NT3h2Kfa1aIqkhMOHd9KXzYmo5_t_EQ2dF8s2SsvmtyEm1xCEPu1k5Bvh6tWoHclzSNTy6BWC3WxTr49T6aP28kYxfq7yxCUXN5B221O5LN0K5uOuS9OMjCmNfOfarUDlXb7HDi9cK2ZEoToATagdshq58zpXVfgA_rJt7j4OPNmak",
                                    bio: "A specialized physician in urology and office affairs, Dr. Marquet oversees the clinical initiatives at uGlowMD and brings deep expertise in thyroid, metabolic, and endocrine care."
                                }
                            ].map((profile, i) => (
                                <div key={i} className="flex items-start gap-6 group">
                                    <img alt={profile.name} className="w-16 h-16 rounded-full object-cover transition-transform group-hover:scale-110 duration-300" src={profile.img} />
                                    <div>
                                        <p className={`text-[10px] font-bold uppercase tracking-widest ${profile.color} mb-1`}>{profile.role}</p>
                                        <p className="text-gray-400 text-xs mb-2">{profile.specialty}</p>
                                        <h4 className="font-bold text-sm mb-2">{profile.name}</h4>
                                        <p className="text-xs text-gray-600 leading-relaxed">{profile.bio}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Content Sections */}
                <section className="py-24">
                    <div className="max-w-[1200px] mx-auto px-6">
                        {/* Trusted Treatments */}
                        <div className="flex flex-col md:flex-row items-center gap-16 mb-32">
                            <div className="w-full md:w-1/2">
                                <h2 className="text-4xl md:text-5xl font-bold mb-6 italic" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>Trusted treatments,<br />FDA-regulated pharmacies</h2>
                                <p className="text-gray-600 mb-8 max-w-md">Rigorous testing and quality controls for product integrity. Expert teams of licensed pharmacists and technicians. Committed to quality, safety, and transparency.</p>
                                <a className="text-sm font-bold border-b border-black pb-1 hover:text-gray-600 hover:border-gray-600 transition-colors" href="#">Learn more</a>
                            </div>
                            <div className="w-full md:w-1/2">
                                <img alt="FDA Regulated Pharmacy" className="rounded-3xl w-full h-[400px] object-cover shadow-2xl transition-transform hover:scale-[1.02] duration-500" src={drugImg} />
                            </div>
                        </div>

                        {/* Licensed Providers */}
                        <div className="flex flex-col md:flex-row-reverse items-center gap-16">
                            <div className="w-full md:w-1/2">
                                <h2 className="text-4xl md:text-5xl font-bold mb-6 italic" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>Always prescribed by<br />licensed providers</h2>
                                <p className="text-gray-600 mb-8 max-w-md">Access to treatments formulated with doctor-trusted ingredients. Plans prescribed by thousands of real medical professionals licensed in all 50 states. 100% online care on your schedule.</p>
                                <button className="bg-black text-white px-8 py-3 rounded-md text-sm font-bold hover:bg-gray-800 transition-colors">Get personalized treatment</button>
                            </div>
                            <div className="w-full md:w-1/2">
                                <img alt="Professional Doctor" className="rounded-3xl object-cover shadow-xl hover:shadow-2xl transition-shadow" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDFKvDu5E2tiAdDbbw8zc2oTEbwPE9XL4cgxcDT8CTQOU7kgfh7k54-jKTi_-rb1Ad4D_Q-aA1hynAdyBj17395EKIWttZB2CBlVOvugX6ZU4xlyWREqOvKXrIIr9LhGPvGWKlfho3Y7B9zD2nUord8icwoZQQWdipRpua8kxHoV4ITtX_fdamaKcWW77hpzQNTUfwpUSt6d3wwIraLR8olqt2TrG4mUMLc2CdXnrQCemMoBSmelBzF6YUQWK9oGEoHupfcOaVIbnCG" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Testosterone Banner */}
                <section className="py-12">
                    <div className="max-w-[1200px] mx-auto px-6">
                        <div className="bg-[#1a1a1a] rounded-[32px] overflow-hidden flex flex-col md:flex-row group">
                            <div className="p-12 md:p-20 text-white flex-1 flex flex-col justify-center">
                                <p className="text-xs tracking-widest uppercase mb-4 opacity-70">Get your edge back with</p>
                                <h2 className="text-4xl md:text-5xl font-bold mb-10 leading-tight">Testosterone by<br />uGlowMD</h2>
                                <div className="flex gap-4 mb-12">
                                    <button className="bg-white text-black px-8 py-3 rounded-md text-xs font-bold hover:bg-gray-200 transition-colors">Get started</button>
                                    <button className="bg-transparent border border-white/30 text-white px-8 py-3 rounded-md text-xs font-bold hover:bg-white/10 transition-colors">Explore</button>
                                </div>
                                <div className="grid grid-cols-2 gap-8 border-t border-white/10 pt-10">
                                    <div className="cursor-pointer group/item">
                                        <p className="text-xs text-white/50 mb-1">Testosterone Rx</p>
                                        <p className="font-bold mb-1 group-hover/item:text-orange-400 transition-colors">Is it right for you? ↗</p>
                                        <p className="text-xs text-white/30">Learn more</p>
                                    </div>
                                    <div className="cursor-pointer group/item">
                                        <p className="text-xs text-white/50 mb-1">At home lab kits</p>
                                        <p className="font-bold mb-1 group-hover/item:text-orange-400 transition-colors">To check your T levels</p>
                                        <p className="text-xs text-white/30">Start testing →</p>
                                    </div>
                                </div>
                            </div>
                            <div className="w-full md:w-2/5 h-80 md:h-auto overflow-hidden">
                                <img alt="Performance exercise" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" src={exerciseImg} />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Lab Testing Section */}
                <section className="py-24 bg-[#fcfbfa] border-y border-gray-100">
                    <div className="max-w-[1200px] mx-auto px-6 text-center">
                        <p className="text-xs tracking-widest uppercase mb-8 font-bold text-gray-400">LABS BY</p>
                        <div className="flex justify-center mb-12">
                            <div className="bg-white rounded-lg shadow-sm border border-gray-100 flex items-center justify-center w-24 h-10 overflow-visible transition-transform hover:scale-105 duration-300">
                                <img src={logo} alt="Lab Logo" className="h-24 w-auto drop-shadow-sm" />
                            </div>
                        </div>
                        <h2 className="text-4xl md:text-5xl italic mb-10" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>Get your labs.<br />Go for your optimal.</h2>
                        <div className="flex justify-center gap-4 mb-24">
                            <button className="bg-black text-white px-10 py-3 rounded-md text-sm font-bold hover:bg-gray-800 transition-all shadow-lg">Start my labs</button>
                            <button className="bg-white border border-gray-200 text-black px-10 py-3 rounded-md text-sm font-bold hover:border-black transition-all">Learn more</button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-left mb-24 max-w-4xl mx-auto">
                            <div>
                                <h3 className="font-bold text-lg mb-4">Find your baseline</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">Get a clear picture of your health with a simple lab test.</p>
                            </div>
                            <div>
                                <h3 className="font-bold text-lg mb-4">Plan your breakthrough</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">Optimize your health with a doctor-developed action plan.</p>
                                <a className="text-xs font-bold border-b border-black pb-1 inline-block mt-4 hover:text-gray-600 hover:border-gray-600 transition-colors" href="#">Explore the plan →</a>
                            </div>
                        </div>

                        {/* Biomarker Lists */}
                        <div className="bg-gray-50/50 p-12 rounded-3xl border border-gray-100">
                            <p className="text-xs font-bold uppercase tracking-widest mb-10">Test 40+ biomarkers</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-left text-[11px] font-medium text-gray-500">
                                {[
                                    { title: "Heart", markers: ["ApoB / LDL Cholesterol", "LDL Cholesterol • HDL Cholesterol"] },
                                    { title: "Blood Metabolic", markers: ["Hemoglobin A1c • Fasting Insulin", "Uric Acid"] },
                                    { title: "Hormone", markers: ["Estradiol • Luteinizing Hormone", "FSH"] },
                                    { title: "Inflammation & Stress", markers: ["hsCRP • Cortisol • Ferritin"] },
                                    { title: "Thyroid", markers: ["TSH • Free T3 • Free T4"] },
                                    { title: "Liver", markers: ["Blood Urea Nitrogen • Creatinine", "Bilirubin (Direct & Indirect)"] },
                                    { title: "Iron", markers: ["Iron • Serum", "Albumin (Prealbumin)"] },
                                    { title: "General Wellness", markers: ["Vitamin D • Vitamin B12", "White Blood Cell Count"] }
                                ].map((group, i) => (
                                    <ul key={i} className="space-y-3">
                                        <li className="font-bold text-black text-xs mb-4">{group.title}</li>
                                        {group.markers.map((marker, j) => <li key={j}>{marker}</li>)}
                                    </ul>
                                ))}
                            </div>
                            <button className="mt-12 text-xs font-bold border-b border-black pb-1 hover:text-gray-600 hover:border-gray-600 transition-colors">View the markers</button>
                        </div>

                        {/* Cancer Screening Callout */}
                        <div className="mt-16">
                            <div className="bg-[#fdf2f2] py-20 px-10 rounded-[60px] text-center mb-8">
                                <h3 className="text-2xl md:text-3xl mb-10" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>Screen for 50+ types of cancer</h3>
                                <div className="flex justify-center">
                                    <button className="bg-white px-12 py-4 rounded-full text-sm font-bold shadow-sm hover:shadow-md transition-all hover:scale-105">
                                        Learn more
                                    </button>
                                </div>
                            </div>
                            <p className="text-[10px] text-gray-400 max-w-3xl mx-auto leading-relaxed">
                                Not available in all 50 states. Eligibility determination and prescription required for all lab tests. Lab results alone are not intended to diagnose, treat, or cure any condition.
                            </p>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer Section */}
            <footer className="bg-[#121212] text-white py-24">
                <div className="max-w-[1200px] mx-auto px-6">
                    <div className="mb-32">
                        <h2 className="text-3xl mb-4" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>Unlock the free Guide to Protein for Weight Loss</h2>
                        <p className="text-gray-400 text-lg mb-10 font-light">Written by board-certified doctors to support your journey.</p>
                        <form className="flex flex-wrap max-w-xl gap-4" onSubmit={(e) => e.preventDefault()}>
                            <input
                                className="flex-1 bg-[#1e1e1e] border-none rounded-full text-white text-base px-8 py-4 focus:ring-1 focus:ring-white/20 outline-none min-w-[300px]"
                                placeholder="Email"
                                type="email"
                            />
                            <button className="bg-white text-black px-10 py-4 rounded-full font-bold text-sm whitespace-nowrap hover:bg-gray-200 transition-all hover:scale-105" type="submit">
                                Get the guide
                            </button>
                        </form>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 mb-32">
                        <div>
                            <h4 className="text-xl mb-8" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>Treatments</h4>
                            <ul className="space-y-4 text-sm text-gray-400">
                                <li><Link className="hover:text-white transition-colors" to="/product/semaglutide-injection">Weight loss</Link></li>
                                <li><Link className="hover:text-white transition-colors" to="/product/sildenafil-tadalafil-troche">Sexual health</Link></li>
                                <li><Link className="hover:text-white transition-colors" to="/product/finasteride-tablets">Hair loss</Link></li>
                                <li><Link className="hover:text-white transition-colors" to="/product/sildenafil-yohimbe-troche">Testosterone</Link></li>
                                <li><Link className="hover:text-white transition-colors" to="/product/nad-injection">Longevity</Link></li>
                                <li><Link className="hover:text-white transition-colors" to="/product/glutathione-injection">Skin care</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-xl mb-8" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>Resources</h4>
                            <ul className="space-y-4 text-sm text-gray-400">
                                <li><Link className="hover:text-white transition-colors" to="#">Blog</Link></li>
                                <li><Link className="hover:text-white transition-colors" to="#">Reviews</Link></li>
                                <li><Link className="hover:text-white transition-colors" to="#">FAQ</Link></li>
                                <li><Link className="hover:text-white transition-colors" to="#">How it works</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-xl mb-8" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>Company</h4>
                            <ul className="space-y-4 text-sm text-gray-400">
                                <li><Link className="hover:text-white transition-colors" to="#">About us</Link></li>
                                <li><Link className="hover:text-white transition-colors" to="#">Careers</Link></li>
                                <li><Link className="hover:text-white transition-colors" to="#">Press</Link></li>
                                <li><Link className="hover:text-white transition-colors" to="#">Investors</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-xl mb-8" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>Legal</h4>
                            <ul className="space-y-4 text-sm text-gray-400">
                                <li><Link className="hover:text-white transition-colors" to="/terms-conditions">Terms & conditions</Link></li>
                                <li><Link className="hover:text-white transition-colors" to="/privacy-policy">Privacy policy</Link></li>
                                <li><Link className="hover:text-white transition-colors" to="/cookie-policy">Cookie policy</Link></li>
                                <li><Link className="hover:text-white transition-colors" to="/your-privacy-choices">Your privacy choices</Link></li>
                            </ul>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-center text-[10px] text-gray-600 pt-12 border-t border-white/5">
                        <div className="flex gap-6 mb-4 md:mb-0">
                            <a className="hover:text-white transition-colors font-medium tracking-tight" href="#">uGlow™</a>
                            <a className="hover:text-white transition-colors font-medium" href="#">Instagram</a>
                            <a className="hover:text-white transition-colors font-medium" href="#">Twitter</a>
                        </div>
                        <p className="font-medium tracking-tight">© 2024 uGlowMD. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default NewLandingPage;
