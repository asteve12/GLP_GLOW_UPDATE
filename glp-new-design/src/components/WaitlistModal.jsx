import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';

const WaitlistModal = ({ isOpen, onClose, user, profile }) => {
    const modalRef = useRef(null);
    const overlayRef = useRef(null);
    const contentRef = useRef(null);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: ''
    });

    useEffect(() => {
        if (isOpen) {
            setFormData({
                firstName: profile?.first_name || '',
                lastName: profile?.last_name || '',
                email: user?.email || '',
                phone: profile?.phone_number || ''
            });
            document.body.style.overflow = 'hidden';

            const tl = gsap.timeline();
            tl.to(overlayRef.current, {
                opacity: 1,
                duration: 0.4,
                ease: "power2.out",
                display: 'flex'
            })
                .fromTo(contentRef.current,
                    { scale: 0.8, opacity: 0, y: 40 },
                    { scale: 1, opacity: 1, y: 0, duration: 0.6, ease: "back.out(1.2)" },
                    "-=0.2"
                );
        } else {
            document.body.style.overflow = 'unset';
            gsap.to(overlayRef.current, {
                opacity: 0,
                duration: 0.3,
                ease: "power2.in",
                onComplete: () => {
                    if (overlayRef.current) overlayRef.current.style.display = 'none';
                }
            });
        }
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const { error } = await supabase
                .from('waitlist')
                .insert([{
                    first_name: formData.firstName,
                    last_name: formData.lastName,
                    email: formData.email,
                    phone: formData.phone,
                    product: 'Retatrutide',
                    user_id: user?.id || null
                }]);

            if (error) throw error;
            toast.success('Successfully added to the waitlist!');
            setFormData({ firstName: '', lastName: '', email: '', phone: '' });
            onClose();
        } catch (err) {
            console.error('Waitlist error:', err);
            toast.error('Failed to join waitlist. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen && !overlayRef.current) return null;

    return (
        <div
            ref={overlayRef}
            className="fixed inset-0 z-[100] hidden items-center justify-center p-4 md:p-6 bg-black/80 backdrop-blur-xl"
            onClick={(e) => e.target === overlayRef.current && onClose()}
        >
            <div
                ref={contentRef}
                className="relative w-full max-w-2xl bg-[#170700] rounded-[40px] overflow-hidden shadow-[0_0_50px_rgba(234,88,12,0.2)] border border-[#FFC7A2]/10"
            >
                {/* Decorative Lava Glow */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-orange-600/20 rounded-full blur-[80px]"></div>
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-red-600/10 rounded-full blur-[80px]"></div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-8 right-8 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all z-20"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                <div className="relative z-10 p-8 md:p-12">
                    <div className="inline-block py-2 px-4 bg-orange-600/10 border border-orange-600/20 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-8 text-orange-500 animate-pulse">
                        Coming Late 2026
                    </div>

                    <h2 className="text-4xl md:text-5xl font-black text-[#FAF9F6] mb-6 leading-tight uppercase italic tracking-tighter">
                        Retatruide: <br />
                        <span className="text-[#FFC7A2]">The Successor.</span>
                    </h2>

                    <div className="space-y-6 mb-10 text-[#FAF9F6]/70 leading-relaxed text-lg">
                        <p>
                            Prepare for the next evolution in metabolic science. <span className="text-[#FAF9F6] font-bold">Retatruide</span> is a breakthrough triple-hormone agonist, engineered to be the definitive successor to Tirzepatide.
                        </p>
                        <p>
                            Designed for high-precision <span className="text-[#FFC7A2] italic underline decoration-[#FFC7A2]/30 underline-offset-4">Subcutaneous Injections</span>, this treatment targets three key pathways for unmatched weight management and metabolic optimization.
                        </p>
                    </div>

                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <div className="grid md:grid-cols-2 gap-4">
                            <input
                                type="text"
                                required
                                value={formData.firstName}
                                onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                placeholder="FIRST NAME"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-white/20 focus:outline-none focus:border-[#FFC7A2]/50 transition-colors uppercase text-xs font-bold tracking-widest"
                            />
                            <input
                                type="text"
                                required
                                value={formData.lastName}
                                onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                placeholder="LAST NAME"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-white/20 focus:outline-none focus:border-[#FFC7A2]/50 transition-colors uppercase text-xs font-bold tracking-widest"
                            />
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                            <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                placeholder="EMAIL ADDRESS"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-white/20 focus:outline-none focus:border-[#FFC7A2]/50 transition-colors uppercase text-xs font-bold tracking-widest"
                            />
                            <input
                                type="tel"
                                required
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="PHONE NUMBER"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-white/20 focus:outline-none focus:border-[#FFC7A2]/50 transition-colors uppercase text-xs font-bold tracking-widest"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-2xl flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {submitting ? 'Processing...' : 'Join the Waitlist'} <span>🔥</span>
                        </button>
                    </form>

                    <p className="mt-8 text-center text-[10px] uppercase tracking-widest text-[#FAF9F6]/30 font-bold">
                        Exclusive early access • Limited Slots per drop
                    </p>
                </div>
            </div>
        </div>
    );
};

export default WaitlistModal;

