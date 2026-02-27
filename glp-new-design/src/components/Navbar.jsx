import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import WaitlistModal from './WaitlistModal';
import logo from '../assets/logo.png';

const NAV_ITEMS = [
  {
    name: 'Weight Loss',
    id: 'weight-loss',
    color: '#60A5FA', // Blue
    products: [
      { name: 'Semaglutide (Rx)', path: 'semaglutide-injection' },
      { name: 'Tirzepatide (Rx)', path: 'tirzepatide-injection' },
    ]
  },
  {
    name: 'Better Sex',
    id: 'sexual-health',
    color: '#8B5CF6', // Purple
    products: [
      { name: 'ReadySetGo (2-in-1 RDT) *Men* (Rx)', path: 'readysetgo-men' },
      { name: 'GrowTabs (Sildenafil) *Men* (Rx)', path: 'growtabs-sildenafil' },
      { name: 'GrowTabs (Tadalafil) *Men* (Rx)', path: 'growtabs-tadalafil' },
      { name: 'QuickLover (RDT) *Women* (Rx)', path: 'quicklover-women' },
      { name: 'LoverSpray (Nasal) *Women* (Rx)', path: 'loverspray-women' },
    ]
  },
  {
    name: 'Hair Loss',
    id: 'hair-loss',
    color: '#92400E', // Dark Brown
    products: [
      { name: '3-in-1 Hair Growth Tabs (Rx)', path: 'hair-growth-tabs-3in1' },
      { name: '2-in-1 Hair Growth Tabs (Rx)', path: 'hair-growth-tabs-2in1' },
    ]
  },
  {
    name: 'Longevity',
    id: 'longevity',
    color: '#93C5FD', // Light Blue
    products: [
      { name: 'NAD + Spray (Nasal)', path: 'nad-nasal-spray' },
      { name: 'NAD + (Subq Inj)*', path: 'nad-injection' },
      { name: 'Glutathione (Subq Inj)', path: 'glutathione-injection' },
    ]
  },
  {
    name: 'Testosterone',
    id: 'hormone-therapy',
    color: '#10B981', // Green
    products: [
      { name: 'Testosterone (Rx)', path: 'testosterone-injection' },
      { name: 'Testosterone (RDT) (Rx)', path: 'testosterone-rdt' },
      { name: 'Estradiol Tabs (Rx)', path: 'estradiol-tabs' },
    ]
  },
  {
    name: 'Skin Care',
    id: 'skin-care',
    color: '#F9A8D4', // Light Pink
    products: [
      { name: 'Anti-Aging Cream (Rx)', path: 'anti-aging-cream' },
      { name: 'Face Spot Peel (Rx)', path: 'face-spot-peel' },
      { name: 'Acne Cleanser (Rx)', path: 'acne-cleanser' },
      { name: 'Rosacea Relief Cream (Rx)', path: 'rosacea-red-cream' },
      { name: 'Eye Serum (Rx)', path: 'eye-serum' },
      { name: 'Body Acne Cream (Rx)', path: 'body-acne-cream' },
    ]
  }
];

const DRAWER_ITEMS = [
  {
    name: 'Repair and Strength Healing',
    id: 'repair-healing',
    description: 'Advanced Regenerative Peptide Therapy\nSpecial Access: Non-FDA Approved | Research Only',
    products: [
      { name: 'BPC 157 (Subq Inj)', path: 'bpc-157-injection' },
      { name: 'BPC 157 / TB 500 (Subq Inj)', path: 'bpc-157-tb500-injection' },
    ]
  },
  {
    name: 'Retatrutide (New Innovation)',
    id: 'retatrutide',
    description: 'The Successor to Tirzepatide (Expected Late 2026)\nResearch Based: Non-FDA Approved',
    products: [
      { name: 'Wait List for Retatrutide (Subq Inj)', path: 'retatrutide-waitlist', type: 'waitlist' },
      { name: 'Special Access Program (Today)', path: 'retatrutide-special', subtext: 'Eligibility verification cost: $100', type: 'special' },
    ]
  }
];

const Navbar = ({ isProductDetails = false, customBgColor = null }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSubmenuOpen, setMobileSubmenuOpen] = useState(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    const handleOpenWaitlist = () => setIsWaitlistOpen(true);
    const handleOpenMobileMenu = () => setMobileMenuOpen(true);

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('openWaitlist', handleOpenWaitlist);
    window.addEventListener('openMobileMenu', handleOpenMobileMenu);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('openWaitlist', handleOpenWaitlist);
      window.removeEventListener('openMobileMenu', handleOpenMobileMenu);
    };
  }, []);

  // Determine styles based on state
  const isCustomState = !scrolled && customBgColor;
  const navbarBg = scrolled ? 'bg-white/85 shadow-sm' : isCustomState ? '' : 'bg-transparent';
  const textColorClass = (scrolled || isCustomState) ? 'text-black' : 'text-white';
  const logoClass = (isCustomState || scrolled) ? 'brightness-100' : 'brightness-0 invert';

  return (
    <>
      <header className="sticky top-0 z-50 bg-[#0A0A0A]/95 backdrop-blur-md border-b border-white/5 " >
        <nav className="max-w-[1200px] mx-auto px-6 h-16 md:h-20 relative flex items-center justify-between">
          <div className="flex items-center h-full">
            <Link to="/" className="relative h-full flex items-center">
              <img
                src={logo}
                alt="uGlowMD Logo"
                className=" mt-[8px] h-28 md:h-32 w-auto transition-transform hover:scale-105 object-contain absolute left-0 top-1/2 -translate-y-1/2"
                style={{
                  filter: 'brightness(1.2)',
                  maxWidth: 'none'
                }}
              />
            </Link>
          </div>

          <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center gap-8 text-[12px] font-bold uppercase tracking-widest text-white whitespace-nowrap">
            {NAV_ITEMS.map((item) => (
              <div
                key={item.id}
                className="relative group py-2"
                onMouseEnter={() => setHoveredCategory(item.id)}
                onMouseLeave={() => setHoveredCategory(null)}
              >
                <span
                  className="transition-colors flex-shrink-0 cursor-default select-none hover:opacity-80"
                  style={{ color: item.color || 'white' }}
                >
                  {item.name}
                </span>
                <div className={`absolute top-full left-1/2 -translate-x-1/2 pt-4 w-56 transition-all duration-300 origin-top ${hoveredCategory === item.id ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'}`}>
                  <div className="bg-white rounded-xl shadow-[0_20px_40px_-10px_rgba(0,0,0,0.2)] border border-gray-100 p-5 space-y-4">
                    {item.products.map((prd) => (
                      <Link key={prd.path} to={`/product/${prd.path}`} className="block text-black hover:text-black/70 transition-colors whitespace-normal text-[11px] font-bold leading-tight flex items-center justify-between group/item">
                        {prd.name}
                        <svg className="w-3 h-3 opacity-0 group-hover/item:opacity-100 transition-opacity -rotate-45 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-6 text-[12px] font-bold uppercase tracking-widest text-white">
            <Link
              className="hover:text-white/80 transition-colors"
              to={location.pathname.startsWith('/assessment') ? `/login?returnTo=${encodeURIComponent(location.pathname)}` : "/login"}
            >
              Log in
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-white hover:text-white/80 transition-colors p-1"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></path>
              </svg>
            </button>
          </div>
        </nav>
      </header>

      {/* Side Drawer Modal */}
      <div className={`fixed inset-0 z-[100] transition-all duration-500 ${mobileMenuOpen ? 'visible' : 'invisible'}`}>
        {/* Backdrop (Invisible but functional) */}
        <div
          className="absolute inset-0 bg-transparent"
          onClick={() => setMobileMenuOpen(false)}
        />

        {/* Drawer - Obsidian Black Background */}
        <div className={`absolute top-0 right-0 h-full w-[85%] max-w-[420px] bg-[#0a0a0a] shadow-[-20px_0_60px_rgba(0,0,0,0.6)] transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-8 border-b border-white/5">
              <div className="flex flex-col">
                <span className="text-white font-black text-xl tracking-tighter">SPECIALIZED</span>
                <span className="text-white text-[10px] uppercase tracking-[0.4em] leading-none">Treatments</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-3 text-white/30 hover:text-white hover:bg-white/5 rounded-full transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
              <div className="mb-12">
                <h2 className="text-white text-[10px] uppercase tracking-[0.5em] font-black mb-10 border-b border-white/5 pb-4">
                  Browse All Treatments
                </h2>

                <div className="space-y-10">
                  {[...NAV_ITEMS, ...DRAWER_ITEMS].map((category) => (
                    <div key={category.id} className="group">
                      <div className="mb-4">
                        <h3
                          className="text-lg font-black uppercase tracking-tight mb-1"
                          style={{ color: category.color || (['repair-healing', 'retatrutide'].includes(category.id) ? '#EF4444' : 'white') }}
                        >
                          {category.name}
                        </h3>
                        {category.description && (
                          <p className="text-white text-[10px] uppercase tracking-widest font-bold whitespace-pre-line">
                            {category.description}
                          </p>
                        )}
                      </div>

                      <div className="space-y-3 mt-6">
                        {category.products.map((prd) => (
                          <div key={prd.path} className="relative">
                            <Link
                              to={prd.type === 'waitlist' ? '#' : `/product/${prd.path}`}
                              onClick={(e) => {
                                // Force login for Repair & Strength Healing category
                                if (category.id === 'repair-healing' && !user) {
                                  e.preventDefault();
                                  setMobileMenuOpen(false);
                                  navigate('/login');
                                  return;
                                }

                                if (prd.type === 'waitlist') {
                                  e.preventDefault();
                                  setIsWaitlistOpen(true);
                                }
                                setMobileMenuOpen(false);
                              }}
                              className="group/item block p-5 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] hover:border-white/20 transition-all duration-300"
                            >
                              <div className="flex items-center justify-between gap-4">
                                <div className="flex-1">
                                  <div className="text-[11px] font-black text-white uppercase tracking-widest mb-1 group-hover/item:text-white transition-colors">
                                    {prd.name}
                                  </div>
                                  {prd.subtext && (
                                    <div className="text-[9px] text-white font-bold uppercase tracking-wide opacity-60">
                                      {prd.subtext}
                                    </div>
                                  )}
                                </div>
                                <svg className="w-4 h-4 text-white/20 group-hover/item:text-white group-hover/item:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                              </div>
                            </Link>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer Info */}
              <div className="pt-10 border-t border-white/5">
                <p className="text-[9px] text-white leading-relaxed uppercase tracking-[0.2em] font-bold">
                  <span className="font-brand"><span className="italic">u</span>Glow<sup>MD</sup></span> Specialized Medical Programs. All treatments require physician consultation and medical eligibility verification.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <WaitlistModal isOpen={isWaitlistOpen} onClose={() => setIsWaitlistOpen(false)} />
    </>
  );
};

export default Navbar;
