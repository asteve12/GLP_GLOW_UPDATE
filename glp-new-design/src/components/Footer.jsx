import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.webp';
import footerImage from '../assets/footer_image.webp';
import { FaInstagram, FaFacebook, FaXTwitter } from 'react-icons/fa6';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-[#121212] text-white pt-24 pb-[30px] overflow-hidden">
            <div className="max-w-[1400px] 2xl:max-w-[1800px] mx-auto px-6">

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 mb-32 text-white text-center lg:text-left">
                    <div>
                        <h4 className="text-xl mb-8" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>Treatments</h4>
                        <ul className="space-y-4 text-sm">
                            <li><Link className="hover:text-gray-300 transition-colors" to="/product/semaglutide-injection">Weight loss</Link></li>
                            <li><Link className="hover:text-gray-300 transition-colors" to="/product/sildenafil-tadalafil-troche">Sexual health</Link></li>
                            <li><Link className="hover:text-gray-300 transition-colors" to="/product/finasteride-tablets">Hair loss</Link></li>
                            <li><Link className="hover:text-gray-300 transition-colors" to="/product/sildenafil-yohimbe-troche">Testosterone</Link></li>
                            <li><Link className="hover:text-gray-300 transition-colors" to="/product/nad-injection">Longevity</Link></li>
                            <li><Link className="hover:text-gray-300 transition-colors" to="/product/glutathione-injection">Skin care</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-xl mb-8" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>Resources</h4>
                        <ul className="space-y-4 text-sm">
                            <li><Link className="hover:text-gray-300 transition-colors" to="/blog">Peer reviewed blog</Link></li>
                            <li><Link className="hover:text-gray-300 transition-colors" to="#">Reviews</Link></li>
                            <li><a className="hover:text-gray-300 transition-colors" href="/#faq">FAQ</a></li>
                            <li><a className="hover:text-gray-300 transition-colors" href="/#how-it-works">How it works</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-xl mb-8" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>Company</h4>
                        <ul className="space-y-4 text-sm">
                            <li><Link className="hover:text-gray-300 transition-colors" to="#">About us</Link></li>
                            <li><Link className="hover:text-gray-300 transition-colors" to="#">Contact us</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-xl mb-8" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>Legal</h4>
                        <ul className="space-y-4 text-sm">
                            <li><Link className="hover:text-gray-300 transition-colors" to="/terms-conditions">Terms & conditions</Link></li>
                            <li><Link className="hover:text-gray-300 transition-colors" to="/privacy-policy">Privacy policy</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row justify-between items-center text-[10px] text-white pt-12 border-t border-white/5 gap-8 text-center">
                    <div className="flex flex-col sm:flex-row items-center gap-6 md:gap-8">
                        <img src={footerImage} alt="uGlowMD" className="h-[24px] w-auto block" />
                        <div className="flex items-center gap-5">
                            <a className="hover:text-gray-300 transition-colors text-xl" href="https://www.instagram.com/uglowmd?igsh=MXc0bjB5aHR0MGR5Nw%3D%3D&utm_source=qr" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><FaInstagram /></a>
                            <a className="hover:text-gray-300 transition-colors text-xl" href="https://www.facebook.com/share/1CXFW9dXa9/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><FaFacebook /></a>
                            <a className="hover:text-gray-300 transition-colors text-xl" href="https://x.com/uglowmd?s=21&t=AWKB5Ql2CQkOFAgP0xqEJg" target="_blank" rel="noopener noreferrer" aria-label="Twitter/X"><FaXTwitter /></a>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-2 font-black uppercase tracking-[0.2em] opacity-80 text-center">
                        <span>© {currentYear}</span>
                        <img src={footerImage} alt="uGlowMD" className="h-[18px] w-auto block mx-1" />
                        <span>All rights reserved.</span>
                    </div>
                </div>
            </div>

            {/* Massive Styled Footer Logo (uGlow MD Style) */}
            <div className="w-full flex justify-center opacity-[0.05] select-none pointer-events-none overflow-hidden mt-[75px] mb-[30px]">
                <img src={footerImage} alt="uGlowMD" className="w-full h-auto transform scale-[1.5] origin-center" />
            </div>
        </footer>
    );
};

export default Footer;

