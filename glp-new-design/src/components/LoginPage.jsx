import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { gsap } from 'gsap';
import Navbar from './Navbar';
import Footer from './Footer';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { signIn } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        window.scrollTo(0, 0);

        // Animations
        const tl = gsap.timeline();
        tl.fromTo(".login-content",
            { y: 40, opacity: 0 },
            { y: 0, opacity: 1, duration: 1.2, ease: "power4.out" }
        );

        gsap.fromTo(".login-glow",
            { opacity: 0, scale: 0.8 },
            { opacity: 0.4, scale: 1, duration: 2, ease: "power2.out" }
        );
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await signIn({ email, password });
            if (error) throw error;
            navigate('/'); // or dashboard
        } catch (error) {
            setError(error.message);
            console.error('Login error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans flex flex-col pt-20">
            <Navbar />

            <div className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
                {/* Background Atmosphere */}
                <div className="login-glow absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent-green/10 rounded-full blur-[150px] pointer-events-none"></div>

                <div className="login-content w-full max-w-[480px] relative z-10">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <div className="inline-block py-1.5 px-4 bg-accent-green/10 border border-accent-green/20 rounded-full text-[9px] font-black uppercase tracking-[0.4em] text-accent-green mb-6">
                            Secure Access
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic mb-4">
                            Patient <span className="text-accent-green font-black">Portal</span>
                        </h1>
                        <p className="text-white/40 font-medium">
                            Access your personalized treatment protocols and communicate with your medical team.
                        </p>
                    </div>

                    {/* Form Container */}
                    <div className="bg-[#0A0A0A] border border-white/5 rounded-[40px] p-8 md:p-12 shadow-2xl backdrop-blur-xl relative group">
                        <div className="absolute inset-0 bg-gradient-to-br from-accent-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 rounded-[40px]"></div>

                        {error && (
                            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-medium text-center">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="relative z-10 space-y-8">
                            {/* Email Field */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4">
                                    Clinical ID / Email
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white placeholder:text-white/10 focus:border-accent-green focus:bg-white/10 transition-all outline-none"
                                    required
                                />
                            </div>

                            {/* Password Field */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center ml-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40">
                                        Password
                                    </label>
                                    <Link to="/forgot-password" size="sm" className="text-[10px] font-bold text-accent-green/60 hover:text-accent-green uppercase tracking-widest transition-colors">
                                        Forgot?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white placeholder:text-white/10 focus:border-accent-green focus:bg-white/10 transition-all outline-none pr-12"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
                                    >
                                        {showPassword ? (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                className="w-full py-5 bg-accent-green text-black rounded-full font-black text-sm uppercase tracking-[0.2em] transform transition-all active:scale-95 hover:bg-white hover:shadow-[0_0_40px_rgba(191,255,0,0.3)] mt-4"
                            >
                                {loading ? 'Logging in...' : 'Login'}
                            </button>

                            <div className="pt-8 text-center border-t border-white/5">
                                <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-4 italic">
                                    New to GLP-GLOW?
                                </p>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <Link
                                        to="/signup"
                                        className="flex-1 bg-accent-green/10 border border-accent-green/20 text-accent-green px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-accent-green hover:text-black transition-all"
                                    >
                                        Create Account
                                    </Link>
                                    <Link
                                        to="/qualify"
                                        className="flex-1 bg-white/5 border border-white/10 text-white px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest hover:border-accent-green hover:text-accent-green transition-all"
                                    >
                                        Start Assessment
                                    </Link>
                                </div>
                            </div>
                        </form>
                    </div>


                </div>
            </div>

            {/* Footer */}
            <div className="pb-12 opacity-40">
                <div className="max-w-[480px] mx-auto text-center border-t border-white/5 pt-8">
                    <p className="text-[9px] font-bold text-white uppercase tracking-[0.4em] mb-2 leading-relaxed">
                        End-to-End Encryption • HIPAA Secure Environment
                    </p>
                    <p className="text-[8px] font-medium text-white/40 uppercase tracking-widest">
                        © 2026 GLP-GLOW Health. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
