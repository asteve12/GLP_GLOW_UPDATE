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
import registrationImg from '../assets/account-registration-image.jpg';
import prescribedImg from '../assets/get-prescribed-image.jpg';
import rxShipmentImg from '../assets/rx-shipment-image.jpg';
import drugImg from '../assets/drug.jpg';
import exerciseImg from '../assets/exercise.jpg';
import repairImg from '../assets/sec_quote_strenght_img.png';
import medicalTeamImg from '../assets/medical-team.png';
import fdaImg from '../assets/fda_image.webp';
import doctorImg from '../assets/doctor_image.png';
import antiAgingImg from '../assets/ant-aging.png';
import faceSpotImg from '../assets/face-spot.png';
import acneCleanserImg from '../assets/Acne-Cleanser-Cream.png';
import { useNavigate } from 'react-router-dom';
import WaitlistModal from './WaitlistModal';
import { FaInstagram, FaFacebook, FaXTwitter } from 'react-icons/fa6';
import Footer from './Footer';

const categories = [
    { text: 'Weight loss', color: 'text-[#93C5FD]' },
    { text: 'Better sex', color: 'text-[#D8B4FE]' },
    { text: 'Hair loss', color: 'text-[#FCD34D]' },
    { text: 'Longevity', color: 'text-[#FB923C]' },
    { text: 'Testosterone', color: 'text-[#34D399]' },
    { text: 'Skincare', color: 'text-[#FBCFE8]' },
    { text: 'Lab testing', color: 'text-[#4ADE80]' },
];

const NewLandingPage = () => {
    const navigate = useNavigate();
    const [isSkincareModalOpen, setIsSkincareModalOpen] = useState(false);
    const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);

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
                <section className="pt-2 pb-12 md:pb-20">
                    <div className="w-[92%] md:w-[85%] lg:w-[80%] mx-auto px-4 md:px-6">
                        <div className="text-left mb-12">
                            <div className="h-[2.5rem] sm:h-[3.5rem] md:h-[6rem] overflow-hidden relative mb-2">
                                <span
                                    className={`absolute left-0 text-3xl sm:text-4xl md:text-7xl font-extrabold tracking-tight leading-tight transition-all duration-500 ease-in-out block whitespace-nowrap ${categories[index].color} ${animationClass}`}
                                >
                                    {categories[index].text}
                                </span>
                            </div>
                            <h1 className="text-3xl sm:text-4xl md:text-7xl font-extrabold mb-4 md:mb-6 tracking-tight leading-tight text-gray-900">
                                personalized to you
                            </h1>
                            <p className="text-gray-500 text-base md:text-xl">Customized care starts here</p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 w-full mb-16 mx-auto">
                            {[
                                { label: 'GLP-GLOW', title: 'Weight-Loss', slug: 'semaglutide-injection', video: weightlossVideo, img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAGvcK-3tlbjIWtIFzaWM7UB-wTXnw-xcTorW6EKs35Zb_MJiXGdjts9GTFCcPx0XZzTI1Qh1vGq6hb1prDR0eaNEpH4piu0z8vq_PuI7CF4i_owBUEOXYSK6Kup0sSYvQGgj605M_GTD1kkVjaXhmsxgjWiS2yKiOIrVJnvlEWVLgi2LRAkSrjY1pPqBBmtDRX9_9RvXOjXBBFa6XzTnv9GJ0mJjDaXpbdU7PfK6SPuk8oWULv6eZYwFrJQrCHiQve_khcChpRPYRs' },
                                { label: 'INTIMATE GLOW', title: 'Sex Health', slug: 'sildenafil-tadalafil-troche', video: intimateVideo, img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBk-P9ExB4ilqJL1UkZSLqJge4yP48tLNb4NIInHSChVNJ4-tp-eDJmz_C9fH2wGcuTmsRX-rXhip5YNc9X_8WcLdfWLlFag2oVcgukvK6oS-A5DcI7leabU9z7Heb7qDZLmvdRL7-iZ459vXeCgYNsT_qlszT5bSPygOfyiGwNulj_Ru5xtuDkS_lb5N4AJkgu91RhKfxIGz8k7H_wzR3avsYk98Kh_wTj5xciCsgE1QlVr1Sca73uKfdggWstfk-wqvqM-0vZzfSX' },
                                { label: 'HAIR GLOW', title: 'Hair Loss', slug: 'finasteride-tablets', video: hairVideo, img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAv6wve4IaUgF73Lo9B1lOz-pbcNVHhWnowiQfXy-87zYhvAlbWm2widJbI65HI5YwlAf2GzY6OQywDcS3OUvZixeZAoIq2P9qvgUkrXxhTZiYF06bSVuoAXspBMsea0t_am-c326QgzfcLrzcaeP6vQoTj-5Undg5PRT4U70mU39zB-vZZfWfujFbXUNXBXXRWkGDPfZ6d2aUr_NfcHh8D6Bagm_9YXhNGLq0IEeu7TwZAnfyEkRHCmdb_yBwn5j6BYouVBbyLzCHe' },
                                { label: 'LONGEVITY GLOW', title: 'Slows Aging & DNA Repair', slug: 'nad-injection', video: longevityVideo, img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDJ7-ipYFRVrPiuFu-R6Y_Sz-aTOJh48jBupdGHajJ_3zcvE-HEH7Fa-rZJCHUh9FTSkjph_G0F6YOjwrz_JJYRujbnPMWM2l88Qyk7zmNryvB8vONuE5BZg46zVMGF81az-AjwmB06-apba4vUCwfGLi7vygGnzxAkW4bcYSqRInUyYms82vs8AOdBcPEyBVV7mZOqSzjnITQqtC-XkqrjAgtSGEwI1MRDULuhtG6vqyL9VrBOmYFPkPiuDxrBrn6bZAvI2CU5p31V' },
                                { label: 'SKIN GLOW', title: 'Skin Care', slug: 'anti-aging-cream', img: skincareImg },
                                { label: 'TESTOSTERONE', title: 'Hormonal Therapy', slug: 'testosterone', img: testosteroneImg },
                                { label: 'LAB TESTING', title: 'Biomarkers', slug: 'nad-nasal-spray', img: labTestingImg },
                            ]
                                .map((item, i) => {
                                    const categoryMap = {
                                        'semaglutide-injection': 'weight-loss',
                                        'sildenafil-tadalafil-troche': 'sexual-health',
                                        'finasteride-tablets': 'hair-restoration',
                                        'nad-injection': 'longevity',
                                        'nad-nasal-spray': 'longevity',
                                        'sildenafil-yohimbe-troche': 'sexual-health',
                                        'glutathione-injection': 'longevity',
                                        'testosterone': 'testosterone',
                                        'retatrutide': 'retatrutide',
                                        'repair-healing': 'repair-healing',
                                        'anti-aging-cream': 'skin-care'
                                    };
                                    const categoryId = categoryMap[item.slug] || 'weight-loss';

                                    if (categoryId === 'skin-care') {
                                        return (
                                            <div key={i} onClick={() => navigate(`/assessment/skin-care?product=anti-aging-cream`)} className="relative rounded-2xl overflow-hidden aspect-square group cursor-pointer transition-all duration-300 hover:shadow-2xl bg-black">
                                                <img alt={item.title} className="w-full h-full object-cover brightness-[0.85] group-hover:scale-105 group-hover:opacity-0 transition-all duration-500" src={item.img} />
                                                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-white z-10">
                                                    <span className="text-[9px] md:text-[11px] font-serif tracking-widest uppercase mb-1 transition-colors duration-300">
                                                        {item.label}
                                                    </span>
                                                    <span className="text-sm md:text-lg font-bold text-center transition-colors duration-300">
                                                        {item.title}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    }

                                    const linkTo = `/assessment/${categoryId}`;

                                    return (
                                        <Link key={i} to={linkTo} className="relative rounded-2xl overflow-hidden aspect-square group cursor-pointer transition-all duration-300 hover:shadow-2xl bg-black">
                                            {item.video ? (
                                                <video
                                                    autoPlay
                                                    loop
                                                    muted
                                                    playsInline
                                                    className="w-full h-full object-cover brightness-[0.85] group-hover:scale-105 group-hover:opacity-0 transition-all duration-500"
                                                >
                                                    <source src={item.video} type="video/mp4" />
                                                </video>
                                            ) : (
                                                <img alt={item.title} className="w-full h-full object-cover brightness-[0.85] group-hover:scale-105 group-hover:opacity-0 transition-all duration-500" src={item.img} />
                                            )}

                                            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-white z-10">
                                                <span className={`text-[9px] md:text-[11px] font-serif tracking-widest uppercase mb-0.5 md:mb-1 transition-colors duration-300 ${item.label === 'LAB TESTING' ? 'group-hover:text-red-600' : ''}`}>
                                                    {item.label}
                                                </span>
                                                <span className={`text-sm md:text-lg font-bold text-center transition-colors duration-300 ${item.label === 'LAB TESTING' ? 'group-hover:text-red-500' : ''}`}>
                                                    {item.title}
                                                </span>
                                                {item.label === 'LAB TESTING' && (
                                                    <span className="mt-3 px-4 py-1.5 bg-red-600 text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-xl group-hover:bg-white group-hover:text-red-600 transition-all duration-300">
                                                        Coming March 15
                                                    </span>
                                                )}
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

                        {/* Upcoming Products Section */}
                        <div className="mt-20">
                            <h2 className="text-xs font-black uppercase tracking-[0.5em] text-gray-400 mb-8 border-b border-gray-100 pb-4 inline-block">Upcoming Innovations</h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 w-full">
                                <div
                                    onClick={() => setIsWaitlistOpen(true)}
                                    className="relative rounded-2xl overflow-hidden aspect-square group cursor-pointer transition-all duration-300 hover:shadow-2xl bg-black border-2 border-red-500/20"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-red-600/20 to-black z-0"></div>
                                    <div className="absolute top-4 left-4 bg-red-600 text-white text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-sm z-20">New Clinical Research</div>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-white z-10">
                                        <span className="text-[11px] font-serif tracking-widest uppercase mb-1 transition-colors duration-300 opacity-60">Retatrutide</span>
                                        <span className="text-lg font-bold text-center transition-colors duration-300 group-hover:text-red-500">Clinical Breakthrough</span>
                                        <span className="mt-3 px-4 py-1.5 bg-white text-black rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-xl group-hover:bg-red-600 group-hover:text-white transition-all duration-300">
                                            Join the Waitlist
                                        </span>
                                        <span className="mt-2 text-[8px] font-bold text-gray-400 uppercase tracking-widest group-hover:text-white/80 transition-colors">Eligibility Verification: $25</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Glow Smarter Banner */}
                <section className="py-0">
                    {/* No overflow-hidden so the button is never clipped */}
                    <div className="w-full bg-[#0a0a0a] relative">
                        {/* Image at full natural height — no cropping */}
                        <img
                            alt="Promotional banner"
                            className="w-full h-auto block"
                            src={glpPromoImg}
                        />
                        {/* Button sits on top of the image, bottom-right corner */}
                        <div className="absolute bottom-6 right-6 md:bottom-12 md:right-12 z-10">
                            <Link
                                to="/qualify?category=weight-loss"
                                className="bg-white text-black px-8 md:px-10 py-3 md:py-4 rounded-full text-xs md:text-sm font-bold uppercase tracking-widest hover:bg-[#FFDE59] hover:text-black transition-all duration-300 shadow-2xl inline-block text-center whitespace-nowrap"
                            >
                                Get started
                            </Link>
                        </div>
                    </div>
                </section>


                {/* How It Works */}
                <section id="how-it-works" className="py-24 overflow-hidden relative" ref={stepsRef}>
                    <div className="max-w-[1400px] 2xl:max-w-[1800px] mx-auto px-6">
                        <div className="relative">
                            <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-gray-200 -translate-x-1/2 hidden md:block"></div>
                            <div
                                className="absolute left-1/2 top-0 w-[1px] bg-black -translate-x-1/2 hidden md:block transition-all duration-100 ease-out"
                                style={{ height: `${scrollProgress}%` }}
                            ></div>

                            {/* Step 1 */}
                            <div className="flex flex-col md:flex-row items-center gap-24 mb-48 relative">
                                <div className="w-full md:w-1/2 flex justify-center md:justify-end z-10">
                                    <div className="w-full max-w-[500px] h-[350px] md:h-[600px] rounded-[32px] overflow-hidden shadow-2xl transition-transform hover:-translate-y-2 duration-500">
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
                                    <p className="text-gray-600 max-w-sm mx-auto md:mx-0 mb-6">Your medication will be shipped directly to your door for maximum convenience. With <img src={logo} alt="uGlowMD" className="h-[56px] w-auto inline-block align-baseline brightness-0" />, starting your treatment is as simple as opening your package and following our easy-to-use instructions.</p>
                                    <Link to="/qualify?category=weight-loss" className="bg-black text-white px-8 py-3 rounded-md text-sm font-bold hover:bg-gray-800 transition-colors inline-block">Get started</Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Expert Care Section - Bird's Eye View Medical Team */}
                <section className="py-24 animate-in fade-in duration-1000">
                    <div className="max-w-[1400px] 2xl:max-w-[1800px] mx-auto px-6">
                        <div className="relative rounded-[60px] overflow-hidden group shadow-[0_40px_100px_rgba(0,0,0,0.08)] bg-gray-50 aspect-[21/9]">
                            <img
                                src={medicalTeamImg}
                                alt="uGlow MD Medical Team"
                                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-[1.03]"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-6 md:p-20">
                                <div className="max-w-3xl animate-in fade-in slide-in-from-bottom-8 duration-1000">
                                    <h2 className="text-2xl md:text-6xl font-bold mb-4 md:mb-6 text-white leading-tight italic" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                                        The best care <br />by the best in medicine
                                    </h2>
                                    <p className="text-white/80 text-sm md:text-xl font-light max-w-xl">
                                        Meet our network of world-class specialists with decades of combined experience across internal medicine, urology, dermatology, and endocrinology.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Content Sections 2 */}
                <section className="py-24 bg-white">
                    <div className="max-w-[1000px] mx-auto px-6">
                        {/* Trusted Treatments */}
                        <div className="flex flex-col md:flex-row items-center gap-16 mb-32">
                            <div className="w-full md:w-1/2">
                                <h2 className="text-3xl md:text-5xl font-bold mb-4 md:mb-6 italic" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>Trusted treatments,<br />FDA-regulated pharmacies</h2>
                                <p className="text-gray-600 text-sm md:text-base mb-6 md:mb-8 max-w-md">Rigorous testing and quality controls for product integrity. Expert teams of licensed pharmacists and technicians. Committed to quality, safety, and transparency.</p>
                                <a className="text-sm font-bold border-b border-black pb-1 hover:text-gray-600 hover:border-gray-600 transition-colors" href="#">Learn more</a>
                            </div>
                            <div className="w-full md:w-1/2">
                                <img alt="FDA Regulated Pharmacy" className="rounded-3xl w-full h-[400px] object-cover shadow-2xl transition-transform hover:scale-[1.02] duration-500" src={fdaImg} />
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
                                <img alt="Professional Doctor" className="rounded-3xl object-cover shadow-xl hover:shadow-2xl transition-shadow w-full h-[500px]" src={doctorImg} />
                            </div>
                        </div>
                    </div>
                </section>


                {/* Lab Testing Section */}
                <section className="py-32 bg-[#fcfbfa] border-y border-gray-100 transition-all duration-700">
                    <div className="max-w-[1400px] 2xl:max-w-[1800px] mx-auto px-6 text-center">
                        <p className="text-[11px] tracking-[0.4em] uppercase mb-2 font-black text-gray-500 transition-colors">LABS BY</p>

                        <div className="flex justify-center mb-4">
                            <div className="bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.02)] border border-gray-100 flex items-center justify-center px-4 md:px-8 py-2 md:py-4 transition-all hover:scale-105 duration-500">
                                <div className="flex items-center">
                                    <img src={logo} alt="uGlowMD" className="h-20 md:h-32 w-auto brightness-0" />
                                </div>
                            </div>
                        </div>

                        <h2 className="text-4xl md:text-5xl mb-8 tracking-tight leading-[1.15]" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                            <span className="text-black font-bold block transition-colors">Get your labs.</span>
                            <span className="text-gray-400 italic">Go for your optimal.</span>
                        </h2>

                        <div className="mb-12 flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                            <span className="px-6 py-2 bg-[#FFDE59] border border-[#d4b43c] rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-black shadow-md">
                                Coming Soon • March 15th 2026
                            </span>
                            <p className="text-gray-600 text-sm font-medium tracking-tight">
                                Our comprehensive biomarker analysis becomes available mid-month.
                            </p>
                        </div>

                        <div className="flex flex-col md:flex-row justify-center items-center gap-5 mb-24">
                            <button className="bg-[#1a1a1a] text-white px-8 py-3 rounded-full text-[13px] font-bold hover:bg-black hover:shadow-2xl transition-all duration-300 min-w-[160px]">
                                Start my labs
                            </button>
                            <button className="bg-white border border-gray-200 text-[#1a1a1a] px-8 py-3 rounded-full text-[13px] font-medium hover:border-black hover:bg-gray-50 transition-all duration-300 min-w-[160px]">
                                Learn more
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-left mb-24 max-w-4xl mx-auto">
                            <div>
                                <h3 className="font-bold text-lg mb-4 text-gray-900">Find your baseline</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">Get a clear picture of your health with a simple lab test.</p>
                            </div>
                            <div>
                                <h3 className="font-bold text-lg mb-4 text-gray-900">Plan your breakthrough</h3>
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
                        </div>

                        {/* Cancer Screening Callout */}
                        <div className="mt-16">
                            <div className="bg-[#fdf2f2] py-12 md:py-20 px-6 md:px-10 rounded-[40px] md:rounded-[60px] text-center mb-8">
                                <h3 className="text-xl md:text-3xl mb-8 md:mb-10" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>Screen for 50+ types of cancer</h3>
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

                {/* FAQ Section */}
                <section id="faq" className="py-32 bg-white">
                    <div className="max-w-[1000px] mx-auto px-6">
                        <div className="text-center mb-24">
                            <h2 className="text-4xl md:text-6xl font-bold mb-6 italic" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                                Frequently Asked Questions
                            </h2>
                            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
                                Everything you need to know about our physician-guided weight loss solutions.
                            </p>
                        </div>

                        <div className="space-y-4">
                            {[
                                {
                                    q: "What is uGlowMD?",
                                    a: "uGlowMD is an online platform providing tailored weight loss solutions. It connects you with licensed healthcare professionals for telehealth consultations, offers medications such as compounded semaglutide and tirzepatide. All services and medications are conveniently delivered to your doorstep."
                                },
                                {
                                    q: "How does the process work?",
                                    a: "The process involves four key steps: 1. Online Assessment (filling out our secure health survey), 2. Provider Review (a licensed healthcare provider reviews your eligibility within 24 hours), 3. Possible Outcomes (Approved, More Info Required, or Denied), and 4. Prescription & Shipping (once approved, medication is delivered within 5–7 business days)."
                                },
                                {
                                    q: "What medications are offered?",
                                    a: "We currently offer Compounded Semaglutide and Compounded Tirzepatide. These are supplied by a licensed and FDA-compliant compounding pharmacy, adhering to all legal and regulatory standards."
                                },
                                {
                                    q: "Do I automatically get approved if I complete the online form?",
                                    a: "No. Completing the form does not guarantee approval. A licensed healthcare provider must review and verify your medical eligibility before any prescription can be issued. uGlowMD strictly follows medical, ethical, and legal standards."
                                },
                                {
                                    q: "What is the eligibility verification fee?",
                                    a: "There is a $25 non-refundable fee for a licensed healthcare provider to review your online assessment and verify your eligibility. This fee does not guarantee approval, and if approved, additional charges will apply based on the medication and package selected."
                                },
                                {
                                    q: "How is pricing determined?",
                                    a: "Once approved, your provider will determine the most appropriate medication and package length. You'll be automatically charged based on the selected treatment plan. Full pricing and shipping details will be shared along with tracking info."
                                },
                                {
                                    q: "How long does shipping take?",
                                    a: "Once your prescription is approved and ordered, shipping typically takes 5–7 business days. All packages come with tracking information."
                                },
                                {
                                    q: "What are your business hours?",
                                    a: "We operate remotely Monday to Friday, 9:00 AM – 4:00 PM CDT."
                                },
                                {
                                    q: "What states do you currently serve?",
                                    a: "We currently serve patients in 24 U.S. states, including AZ, CO, DC, GA, HI, IL, IN, IA, KS, MD, MO, NE, NY, NC, OK, OR, PA, RI, SD, TN, TX, UT, WA, and WI."
                                },
                                {
                                    q: "Are your medications safe and compliant?",
                                    a: "Yes. All medications are compounded in a licensed, FDA-registered compounding pharmacy in full compliance with U.S. laws and regulations. Your health and safety are our top priorities."
                                },
                                {
                                    q: "Can I speak with someone if I have questions?",
                                    a: "Absolutely! Reach out to us during business hours via Email at americahealthsolutions@gmail.com or via our Customer Care Line at 214-699-7654."
                                },
                                {
                                    q: "What if my eligibility is denied?",
                                    a: "If a provider determines you do not meet the medical criteria, your eligibility will be denied. The $25 verification fee is non-refundable, but we'll notify you of the decision and may recommend alternative solutions if available."
                                },
                                {
                                    q: "Is the provider review instant?",
                                    a: "No. Although the online form is quick, a licensed provider must manually review your information within 24 hours to ensure safety, compliance, and accurate care."
                                },
                                {
                                    q: "Can I cancel my order after approval?",
                                    a: "Once a provider has approved your eligibility and the prescription has been processed, orders cannot be canceled or refunded due to the nature of compounded medication."
                                },
                                {
                                    q: "Is uGlowMD a weight loss clinic?",
                                    a: "uGlowMD is not a traditional clinic. We are a telehealth service platform facilitating remote medical consultations and medication delivery for approved patients seeking weight loss solutions."
                                }
                            ].map((item, i) => (
                                <div key={i} className="group border-b border-gray-100 last:border-0 overflow-hidden transition-all duration-500">
                                    <details className="cursor-pointer py-8">
                                        <summary className="list-none flex items-center justify-between gap-4">
                                            <h3 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900 group-hover:text-black transition-colors">
                                                {item.q}
                                            </h3>
                                            <div className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center shrink-0 group-hover:border-black transition-all">
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-gray-400 group-hover:text-black"><path d="M6 9l6 6 6-6" /></svg>
                                            </div>
                                        </summary>
                                        <div className="mt-6 text-gray-500 text-lg leading-relaxed animate-in fade-in slide-in-from-top-2 duration-300">
                                            {item.a}
                                        </div>
                                    </details>
                                </div>
                            ))}
                        </div>

                        <div className="mt-32 p-12 bg-gray-50 rounded-[40px] text-center">
                            <h3 className="text-2xl font-bold mb-4 italic" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>Still have questions?</h3>
                            <p className="text-gray-500 mb-8">We're here to help! Contact us any time during business hours.</p>
                            <div className="flex flex-wrap justify-center gap-6">
                                <a href="mailto:americahealthsolutions@gmail.com" className="flex items-center gap-3 text-sm font-bold tracking-tight hover:text-gray-600 transition-colors">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><path d="M22 6l-10 7L2 6" /></svg>
                                    americahealthsolutions@gmail.com
                                </a>
                                <a href="tel:214-699-7654" className="flex items-center gap-3 text-sm font-bold tracking-tight hover:text-gray-600 transition-colors">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" /></svg>
                                    214-699-7654
                                </a>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />

            {/* Skincare Category Products Modal */}
            {isSkincareModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsSkincareModalOpen(false)}></div>
                    <div className="relative w-full max-w-4xl bg-white border border-gray-200 rounded-[40px] shadow-2xl p-8 md:p-12 overflow-hidden max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-10">
                            <div className="text-left">
                                <h3 className="text-3xl font-black uppercase tracking-tighter text-gray-900 mb-2">Skin Care <span className="text-gray-400">Collection</span></h3>
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Prescription-grade formulas for clinical results</p>
                            </div>
                            <button
                                onClick={() => setIsSkincareModalOpen(false)}
                                className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-all"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                { title: "Anti-Aging Cream", price: "$69/mo", img: antiAgingImg, slug: "anti-aging-cream", desc: "Tretinoin + Peptides" },
                                { title: "Face Spot Peel", price: "$72/mo", img: faceSpotImg, slug: "face-spot-peel", desc: "Alpha Hydroxy Acids" },
                                { title: "Acne Cleanser", price: "$59/mo", img: acneCleanserImg, slug: "acne-cleanser", desc: "Salicylic Acid + Benzoyl" }
                            ].map((item, i) => (
                                <div key={i} onClick={() => { setIsSkincareModalOpen(false); navigate(`/assessment/skin-care?product=${item.slug}`); }} className="bg-gray-50 border border-gray-100 rounded-3xl p-6 group cursor-pointer hover:border-gray-300 transition-all text-center">
                                    <div className="aspect-square rounded-2xl overflow-hidden mb-6 bg-white shadow-inner">
                                        <img src={item.img} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                    </div>
                                    <h4 className="text-lg font-black uppercase tracking-tight text-gray-900 mb-1">{item.title}</h4>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-[#FFDE59] mb-4 bg-black inline-block px-2 py-1 rounded-full">{item.desc}</p>
                                    <p className="text-sm font-bold text-gray-600 mb-6">{item.price}</p>
                                    <button className="w-full py-3 bg-black text-white rounded-xl text-[9px] font-black uppercase tracking-widest group-hover:bg-[#FFDE59] group-hover:text-black transition-all">
                                        View Details
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            {/* Waitlist Modal */}
            <WaitlistModal isOpen={isWaitlistOpen} onClose={() => setIsWaitlistOpen(false)} />
        </div >
    );
};

export default NewLandingPage;
