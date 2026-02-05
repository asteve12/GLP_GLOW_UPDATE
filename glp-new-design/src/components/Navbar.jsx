import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import WaitlistModal from './WaitlistModal';

const NAV_ITEMS = [
  {
    name: 'Weight Loss',
    path: 'weight-loss',
    description: 'Achieve your ideal weight with GLP-1 medications.',
    products: [
      { name: 'Semaglutide Injection', path: 'semaglutide-injection' },
      { name: 'Tirzepatide Injection', path: 'tirzepatide-injection' },
      { name: 'Semaglutide Drops', path: 'semaglutide-drops' },
      { name: 'Tirzepatide Drops', path: 'tirzepatide-drops' },
    ]
  },
  {
    name: 'Hair Restoration',
    path: 'hair-restoration',
    description: 'Clinically proven formulas to stop hair loss.',
    products: [
      { name: 'Finasteride Tablets', path: 'finasteride-tablets' },
      { name: 'Finasteride / Minoxidil (2-in-1)', path: 'finasteride-minoxidil-liquid' },
      { name: 'Finasteride / Minox / Tret (3-in-1)', path: 'finasteride-minoxidil-tretinoin-liquid' },
      { name: 'Max Growth (5-in-1)', path: 'minoxidil-max-compound-liquid' },
    ]
  },
  {
    name: 'Sexual Health',
    path: 'sexual-health',
    description: "Restore vitality with prescription treatments.",
    products: [
      { name: 'Sildenafil / Tadalafil Troche', path: 'sildenafil-tadalafil-troche' },
      { name: 'Sildenafil / Yohimbe Troche', path: 'sildenafil-yohimbe-troche' },
      { name: 'Sildenafil / Tadalafil Tablets', path: 'sildenafil-tadalafil-tablets' },
      { name: 'Oxytocin Troche', path: 'oxytocin-troche' },
      { name: 'Oxytocin Nasal Spray', path: 'oxytocin-nasal-spray' },
    ]
  },
  {
    name: 'Longevity',
    path: 'longevity',
    description: 'Optimize cellular health and lifespan.',
    products: [
      { name: 'NAD+ Nasal Spray', path: 'nad-nasal-spray' },
      { name: 'NAD+ Injection', path: 'nad-injection' },
      { name: 'Glutathione Injection', path: 'glutathione-injection' },
    ]
  }
];

const Navbar = ({ isProductDetails = false, customBgColor = null }) => {
  const { user } = useAuth();
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

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('openWaitlist', handleOpenWaitlist);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('openWaitlist', handleOpenWaitlist);
    };
  }, []);

  // Determine styles based on state
  const isCustomState = !scrolled && customBgColor;
  const navClasses = scrolled || isProductDetails
    ? 'bg-bg-primary/85 backdrop-blur-md h-[70px] border-b border-white/5'
    : isCustomState
      ? 'h-20 transition-colors duration-300'
      : 'bg-transparent h-20 transition-colors duration-300';

  const textColorClass = isCustomState ? 'text-black' : 'text-white';

  return (
    <>
      <nav
        className={`fixed top-0 left-0 w-full flex items-center z-50 transition-all duration-300 ease-out ${navClasses}`}
        style={isCustomState ? { backgroundColor: customBgColor } : {}}
      >
        <div className="max-w-[1400px] 2xl:max-w-[1800px] 3xl:max-w-none mx-auto px-5 md:px-8 lg:px-10 w-full flex justify-between items-center">
          <div className={`text-xl md:text-2xl font-extrabold tracking-[2px] uppercase ${textColorClass}`}>
            <Link to="/">GLP-GLOW</Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex gap-10">
            {NAV_ITEMS.map((item) => (
              <div
                key={item.name}
                className="relative h-full flex items-center"
                onMouseEnter={() => setHoveredCategory(item.name)}
                onMouseLeave={() => setHoveredCategory(null)}
              >
                <Link
                  to={`/products/${item.path}`}
                  className={`text-sm font-medium uppercase tracking-wider opacity-80 relative transition-colors hover:opacity-100 ${isCustomState ? '' : 'hover:text-accent-green'} group ${textColorClass} py-6`}
                >
                  {item.name}
                  <span className={`absolute bottom-4 left-0 w-0 h-[2px] ${isCustomState ? 'bg-black' : 'bg-accent-green'} transition-[width] duration-300 ease-out group-hover:w-full`}></span>
                </Link>

                {/* Dropdown Menu */}
                <div
                  className={`absolute top-[80%] left-1/2 -translate-x-1/2 pt-4 w-72 transition-all duration-300 origin-top ${hoveredCategory === item.name
                    ? 'opacity-100 translate-y-0 visible'
                    : 'opacity-0 -translate-y-2 invisible pointer-events-none'
                    }`}
                >
                  <div className="bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 rounded-xl p-5 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)]">
                    {/* Decorative arrow/triangle */}
                    <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#0a0a0a]/95 rotate-45 border-l border-t border-white/10 hidden"></div>

                    <div className="mb-3 pb-3 border-b border-white/10">
                      <h3 className="text-accent-green text-xs font-bold uppercase tracking-widest mb-1">
                        {item.name}
                      </h3>
                      <p className="text-gray-400 text-[10px] leading-relaxed font-medium">
                        {item.description}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2">
                      {item.products.map((product) => (
                        <Link
                          key={product.path}
                          to={`/product/${product.path}`}
                          className="text-gray-300 text-sm font-medium hover:text-white hover:bg-white/5 px-3 py-2 rounded-lg transition-all flex items-center justify-between group/link"
                        >
                          <span>{product.name}</span>
                          <span className="opacity-0 -translate-x-2 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all text-accent-green text-xs">→</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Action Buttons */}
          <div className="hidden lg:flex items-center gap-6">
            <button
              onClick={() => setIsWaitlistOpen(true)}
              className="group relative flex items-center gap-2 bg-gradient-to-r from-orange-600 via-red-600 to-orange-600 bg-[length:200%_auto] animate-gradient-x px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-[0_0_15px_rgba(234,88,12,0.4)] hover:shadow-[0_0_25px_rgba(234,88,12,0.6)] transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              Retatruide
              <span className="group-hover:animate-bounce">🔥</span>
            </button>

            {user ? (
              <Link to="/dashboard" className={`text-sm font-medium uppercase tracking-wider opacity-80 hover:opacity-100 ${isCustomState ? '' : 'hover:text-accent-green'} transition-colors ${textColorClass}`}>
                Account
              </Link>
            ) : (
              <>
                <Link to="/login" className={`text-sm font-medium uppercase tracking-wider opacity-80 hover:opacity-100 ${isCustomState ? '' : 'hover:text-accent-green'} transition-colors ${textColorClass}`}>
                  Login
                </Link>
              </>
            )}
            <Link to="/qualify" className="bg-accent-green text-black px-6 py-2.5 rounded-full text-sm font-bold uppercase tracking-wider hover:bg-white transition-colors shadow-[0_0_15px_rgba(191,255,0,0.3)] hover:shadow-[0_0_20px_rgba(255,255,255,0.4)]">
              Qualify Now
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden w-10 h-10 flex flex-col items-center justify-center gap-1.5 z-50"
            aria-label="Toggle menu"
          >
            <span className={`w-6 h-0.5 ${textColorClass === 'text-black' ? 'bg-black' : 'bg-white'} transition-all duration-300 ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
            <span className={`w-6 h-0.5 ${textColorClass === 'text-black' ? 'bg-black' : 'bg-white'} transition-all duration-300 ${mobileMenuOpen ? 'opacity-0' : ''}`}></span>
            <span className={`w-6 h-0.5 ${textColorClass === 'text-black' ? 'bg-black' : 'bg-white'} transition-all duration-300 ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div className={`lg:hidden fixed inset-0 z-40 bg-black/95 backdrop-blur-xl transition-all duration-300 ${mobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}>
        <div className="flex flex-col h-full pt-24 px-5 pb-8 overflow-y-auto">
          {/* Mobile Navigation Items */}
          <div className="space-y-2">
            {NAV_ITEMS.map((item) => (
              <div key={item.name} className="border-b border-white/10 pb-2">
                <button
                  onClick={() => setMobileSubmenuOpen(mobileSubmenuOpen === item.name ? null : item.name)}
                  className="w-full flex items-center justify-between py-4 text-left"
                >
                  <Link
                    to={`/products/${item.path}`}
                    className="text-lg font-bold uppercase text-white tracking-wider"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                  <svg
                    className={`w-5 h-5 text-white transition-transform ${mobileSubmenuOpen === item.name ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Mobile Submenu */}
                <div className={`overflow-hidden transition-all duration-300 ${mobileSubmenuOpen === item.name ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="pl-4 py-2 space-y-2">
                    <p className="text-sm text-gray-400 mb-3">{item.description}</p>
                    {item.products.map((product) => (
                      <Link
                        key={product.path}
                        to={`/product/${product.path}`}
                        className="block py-2 text-sm text-gray-300 hover:text-accent-green transition-colors"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setMobileSubmenuOpen(null);
                        }}
                      >
                        {product.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile Action Buttons */}
          <div className="mt-8 space-y-4">
            <button
              onClick={() => {
                setIsWaitlistOpen(true);
                setMobileMenuOpen(false);
              }}
              className="w-full group relative flex items-center justify-center gap-2 bg-gradient-to-r from-orange-600 via-red-600 to-orange-600 bg-[length:200%_auto] animate-gradient-x px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest text-white shadow-[0_0_15px_rgba(234,88,12,0.4)]"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              Retatruide
              <span>🔥</span>
            </button>

            {user ? (
              <Link
                to="/dashboard"
                className="block w-full text-center py-3 px-6 border border-white/20 rounded-full text-sm font-bold uppercase text-white hover:bg-white/10 transition-all"
                onClick={() => setMobileMenuOpen(false)}
              >
                Account
              </Link>
            ) : (
              <Link
                to="/login"
                className="block w-full text-center py-3 px-6 border border-white/20 rounded-full text-sm font-bold uppercase text-white hover:bg-white/10 transition-all"
                onClick={() => setMobileMenuOpen(false)}
              >
                Login
              </Link>
            )}

            <Link
              to="/qualify"
              className="block w-full text-center bg-accent-green text-black px-6 py-3 rounded-full text-sm font-bold uppercase tracking-wider hover:bg-white transition-colors shadow-[0_0_15px_rgba(191,255,0,0.3)]"
              onClick={() => setMobileMenuOpen(false)}
            >
              Qualify Now
            </Link>
          </div>
        </div>
      </div>

      <WaitlistModal isOpen={isWaitlistOpen} onClose={() => setIsWaitlistOpen(false)} />
    </>
  );
};

export default Navbar;
