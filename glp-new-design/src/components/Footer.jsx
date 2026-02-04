import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-[#050505] text-[#FAF9F6] pt-24 pb-12 px-6 border-t border-white/5">
            <div className="max-w-[1400px] 2xl:max-w-[1800px] 3xl:max-w-none mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 mb-20">
                    {/* Brand & Stats/Badges */}
                    <div className="lg:col-span-4 space-y-8">
                        <div className="relative z-10">
                            <span className="text-3xl font-black uppercase tracking-tighter italic leading-none">GLP-GLOW</span>
                        </div>
                        <p className="text-[#FAF9F6]/50 text-sm leading-relaxed max-w-xs">
                            Leading the revolution in personalized metabolic science and longevity.
                            Built for peak performance and sustainable health.
                        </p>
                        <div className="flex flex-wrap gap-4 pt-4">
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl group hover:border-[#FFC7A2]/30 transition-colors">
                                    <div className="w-8 h-8 rounded-full bg-[#FFC7A2]/10 flex items-center justify-center border border-[#FFC7A2]/20">
                                        <div className="w-2 h-2 rounded-full bg-[#FFC7A2] animate-pulse"></div>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black tracking-widest uppercase text-white/80">LegitScript</span>
                                        <span className="text-[8px] font-bold tracking-widest uppercase text-white/30">Certified</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl group hover:border-accent-green/30 transition-colors">
                                    <div className="w-8 h-8 rounded-full bg-accent-green/10 flex items-center justify-center border border-accent-green/20">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-accent-green">
                                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                                        </svg>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black tracking-widest uppercase text-white/80">HIPAA</span>
                                        <span className="text-[8px] font-bold tracking-widest uppercase text-white/30">Compliant</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Links Sub-Grid */}
                    <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-12 md:gap-16">
                        {/* Products Links */}
                        <div>
                            <h4 className="text-sm font-black uppercase tracking-[0.2em] mb-8 text-[#FFC7A2]">Treatments</h4>
                            <ul className="space-y-4">
                                {[
                                    { name: 'Weight Loss', path: 'weight-loss' },
                                    { name: 'Hair Restoration', path: 'hair-restoration' },
                                    { name: 'Sexual Health', path: 'sexual-health' },
                                    { name: 'Longevity', path: 'longevity' }
                                ].map((link) => (
                                    <li key={link.name}>
                                        <Link to={`/products/${link.path}`} className="text-white/60 hover:text-white transition-colors text-sm font-medium uppercase tracking-wide">
                                            {link.name}
                                        </Link>
                                    </li>
                                ))}
                                <li>
                                    <Link to="/" onClick={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent('openWaitlist')); }} className="text-orange-500 hover:text-orange-400 transition-colors text-sm font-black uppercase tracking-widest flex items-center gap-2 group">
                                        Retatruide
                                        <span className="animate-pulse">🔥</span>
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* Company Links */}
                        <div>
                            <h4 className="text-sm font-black uppercase tracking-[0.2em] mb-8 text-[#FFC7A2]">About Us</h4>
                            <ul className="space-y-4">
                                {['Blog', 'FAQ', 'Science', 'Reviews', 'Careers'].map((link) => (
                                    <li key={link}>
                                        <Link to={`/${link.toLowerCase()}`} className="text-white/60 hover:text-white transition-colors text-sm font-medium uppercase tracking-wide">
                                            {link}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Contact Info */}
                        <div>
                            <h4 className="text-sm font-black uppercase tracking-[0.2em] mb-8 text-[#FFC7A2]">Contact Us</h4>
                            <div className="space-y-6 text-sm">
                                <div className="space-y-1">
                                    <p className="text-white font-bold">Email</p>
                                    <a href="mailto:customercare@rugiet.com" className="text-white/60 hover:text-white">customercare@rugiet.com</a>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-white font-bold">Phone</p>
                                    <a href="tel:8555819620" className="text-white/60 hover:text-white">(855) 581 9620</a>
                                </div>
                                <div className="space-y-2 pt-2">
                                    <p className="text-white font-bold uppercase text-[10px] tracking-widest">Support Hours</p>
                                    <div className="text-white/40 text-[12px] space-y-1">
                                        <p>Monday – Friday, 8:30am – 5:30pm CT</p>
                                        <p>Saturday, 11:00am – 4:00pm CT</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Fine Print / Compliance Section */}
                <div className="pt-16 pb-12 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 text-[10px] font-medium uppercase tracking-widest text-white/30 leading-relaxed">
                    <div className="space-y-4">
                        <h5 className="text-white/60 font-black tracking-[0.2em] mb-4">Patient Safety & Risk</h5>
                        <p>Patient Risk Prevention Protocols are integrated into every treatment cycle. GLP-GLOW ensures all protocols meet the highest safety standards for metabolic and lifestyle medicine.</p>
                        <p>All medications are sourced exclusively from FDA Approved Pharmacies and compounded under strict quality control.</p>
                    </div>
                    <div className="space-y-4">
                        <h5 className="text-white/60 font-black tracking-[0.2em] mb-4">Legal & Protection</h5>
                        <p>Provider Protection & Company Protection modules are active across the platform. Usage of this platform constitutes agreement to our comprehensive terms and conditions.</p>
                        <p>Consultations are performed by a Licensed Provider in each state where we operate, ensuring full legal and medical compliance.</p>
                    </div>
                    <div className="space-y-4">
                        <h5 className="text-white/60 font-black tracking-[0.2em] mb-4">Data Privacy & HIPAA</h5>
                        <p>PHI (Personal Health Information) is secured using military-grade encryption. We are 100% HIPAA (Health Insurance Portability and Accountability Act) compliant.</p>
                        <p>Our platform usage guidelines ensure clear communication between patients and medical boards for optimized health outcomes.</p>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/20">
                        &copy; {currentYear} GLP-GLOW. All Rights Reserved.
                    </div>

                    <div className="flex flex-wrap justify-center gap-8 md:gap-10">
                        {['Terms & Conditions', 'Privacy Policy', 'Telehealth Consent', 'Privacy Choices'].map((legal) => (
                            <Link key={legal} to={`/${legal.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}`} className="text-[10px] font-bold uppercase tracking-widest text-white/30 hover:text-white transition-colors">
                                {legal}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
