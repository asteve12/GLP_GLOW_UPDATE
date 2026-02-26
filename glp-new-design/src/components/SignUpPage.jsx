import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { gsap } from 'gsap';
import Navbar from './Navbar';
import Footer from './Footer';
import { toast } from 'react-hot-toast';

const SignUpPage = () => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [countryCode, setCountryCode] = useState('+1');
    const [phone, setPhone] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showVerificationMessage, setShowVerificationMessage] = useState(false);
    const [showOtpInput, setShowOtpInput] = useState(false);
    const [otp, setOtp] = useState('');
    const [verifying, setVerifying] = useState(false);
    const { signUp, verifyOtp, updateUser } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        window.scrollTo(0, 0);

        // Animations
        const tl = gsap.timeline();
        tl.fromTo(".signup-content",
            { y: 40, opacity: 0 },
            { y: 0, opacity: 1, duration: 1.2, ease: "power4.out" }
        );
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            toast.error('Please enter a valid email address.');
            setLoading(false);
            return;
        }

        let formattedPhone = `${countryCode.trim()}${phone.replace(/\D/g, '')}`;
        if (!formattedPhone.startsWith('+')) formattedPhone = `+${formattedPhone}`;

        try {
            // Check if email already exists
            const { data: existingUser, error: checkError } = await supabase
                .from('profiles')
                .select('id')
                .eq('email', email)
                .maybeSingle();

            if (checkError) {
                console.warn('Email check error:', checkError);
            }

            if (existingUser) {
                toast.error('This email is already registered. Please sign in instead.');
                setLoading(false);
                return;
            }

            // 1. Sign up with email and password
            // Check for returnTo parameter to redirect back to assessment after verification
            const queryParams = new URLSearchParams(window.location.search);
            const returnTo = queryParams.get('returnTo');
            const redirectTo = returnTo
                ? `${window.location.origin}${returnTo}`
                : `${window.location.origin}/dashboard`;

            const { data: signUpData, error: signUpError } = await signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: `${firstName} ${lastName}`,
                        first_name: firstName,
                        last_name: lastName,
                        email: email,
                        phone_number: formattedPhone // Store for later verification
                    },
                    emailRedirectTo: redirectTo
                }
            });

            if (signUpError) throw signUpError;

            // 2. Create/Update Profile record immediately
            // This ensures the data is in our public profiles table even before email verification
            if (signUpData?.user) {
                try {
                    const { error: profileError } = await supabase
                        .from('profiles')
                        .upsert({
                            id: signUpData.user.id,
                            email: email,
                            first_name: firstName,
                            last_name: lastName,
                            phone_number: formattedPhone,
                            updated_at: new Date().toISOString()
                        }, { onConflict: 'id' });

                    if (profileError) {
                        console.warn('Initial profile sync warning:', profileError.message);
                    }
                } catch (err) {
                    console.warn('Profile upsert failed:', err);
                }
            }

            // Notify user to check email
            toast.success('Account created! Please verify your email to continue.');
            setShowVerificationMessage(true);
            return;
        } catch (error) {
            toast.error(error.message);
            console.error('Signup error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setVerifying(true);
        setError(null);

        let formattedPhone = `${countryCode.trim()}${phone.replace(/\D/g, '')}`;
        if (!formattedPhone.startsWith('+')) formattedPhone = `+${formattedPhone}`;

        try {
            const { data, error } = await verifyOtp({
                phone: formattedPhone,
                token: otp,
                type: 'sms'
            });

            if (error) throw error;

            setShowOtpInput(false);

            // Handle redirection after successful verification
            const queryParams = new URLSearchParams(window.location.search);
            const returnTo = queryParams.get('returnTo');

            if (returnTo) {
                navigate(returnTo);
            } else {
                setShowVerificationMessage(true);
            }
            toast.success('Phone number verified successfully!');
        } catch (error) {
            toast.error(error.message);
        } finally {
            setVerifying(false);
        }
    };

    return (
        <div className="min-h-screen font-sans flex flex-col pt-20" style={{ backgroundColor: showOtpInput || showVerificationMessage ? '#ffffff' : '#050505', color: showOtpInput || showVerificationMessage ? '#1a1a1a' : '#ffffff' }}>
            <Navbar />

            <div className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
                {/* Background Atmosphere */}
                <div
                    className="signup-glow absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[150px] pointer-events-none"
                    style={{ backgroundColor: showOtpInput || showVerificationMessage ? '#FFDE5920' : 'transparent' }}
                ></div>

                <div className="signup-content w-full max-w-[480px] relative z-10">
                    {showOtpInput ? (
                        /* OTP Verification */
                        <div className="text-center animate-in fade-in duration-500 bg-white rounded-[40px] p-10 shadow-sm" style={{ border: '1px solid #1a1a1a08' }}>
                            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8" style={{ backgroundColor: '#FFDE5915', border: '2px solid #FFDE5940' }}>
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2.5">
                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                                </svg>
                            </div>
                            <div className="inline-block py-1.5 px-4 bg-black rounded-full text-[9px] font-black uppercase tracking-[0.4em] text-white mb-6">
                                Identity Verification
                            </div>
                            <h1 className="text-4xl font-black uppercase tracking-tighter mb-4" style={{ color: '#1a1a1a' }}>
                                Verify Your{' '}
                                <span style={{ backgroundColor: '#FFDE59', color: '#1a1a1a', padding: '2px 8px', display: 'inline-block' }}>Phone</span>
                            </h1>
                            <p className="text-sm leading-relaxed mb-8 max-w-sm mx-auto" style={{ color: '#1a1a1a80' }}>
                                We've sent a 6-digit code to{' '}
                                <span className="font-bold" style={{ color: '#1a1a1a' }}>{phone}</span>.
                                Enter it below to verify your identity.
                            </p>

                            <form onSubmit={handleVerifyOtp} className="space-y-6">
                                <div className="space-y-2">
                                    <input
                                        type="text"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        placeholder="0 0 0 0 0 0"
                                        className="w-full rounded-2xl py-5 text-center text-3xl font-black tracking-[0.5em] outline-none transition-all"
                                        style={{ backgroundColor: '#f9f9f7', border: '2px solid #1a1a1a15', color: '#1a1a1a' }}
                                        onFocus={e => e.target.style.borderColor = '#FFDE59'}
                                        onBlur={e => e.target.style.borderColor = '#1a1a1a15'}
                                        required
                                    />
                                </div>

                                {error && (
                                    <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-xs font-medium">
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={verifying || otp.length < 6}
                                    className="w-full py-5 rounded-full font-black text-sm uppercase tracking-[0.2em] transition-all disabled:opacity-50"
                                    style={{ backgroundColor: '#000', color: '#fff' }}
                                    onMouseEnter={e => { if (!e.currentTarget.disabled) { e.currentTarget.style.backgroundColor = '#FFDE59'; e.currentTarget.style.color = '#1a1a1a'; } }}
                                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#000'; e.currentTarget.style.color = '#fff'; }}
                                >
                                    {verifying ? 'Verifying...' : 'Verify & Continue'}
                                </button>
                            </form>

                            <button
                                onClick={() => setShowOtpInput(false)}
                                className="mt-8 text-xs uppercase font-black tracking-widest transition-opacity hover:opacity-60"
                                style={{ color: '#1a1a1a60' }}
                            >
                                ← Back to signup
                            </button>
                        </div>
                    ) : showVerificationMessage ? (
                        /* Verification Success Message */
                        <div className="text-center bg-white rounded-[40px] p-10 shadow-sm" style={{ border: '1px solid #1a1a1a08' }}>
                            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8" style={{ backgroundColor: '#FFDE5915', border: '2px solid #FFDE5940' }}>
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="3">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                </svg>
                            </div>
                            <div className="inline-block py-1.5 px-4 bg-black rounded-full text-[9px] font-black uppercase tracking-[0.4em] text-white mb-6">
                                Verification Sent
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4" style={{ color: '#1a1a1a' }}>
                                Check Your{' '}
                                <span style={{ backgroundColor: '#FFDE59', color: '#1a1a1a', padding: '2px 8px', display: 'inline-block' }}>Email</span>
                            </h1>
                            <p className="text-sm leading-relaxed mb-8 max-w-md mx-auto" style={{ color: '#1a1a1a80' }}>
                                We've sent a verification link to{' '}
                                <span className="font-bold" style={{ color: '#1a1a1a' }}>{email}</span>.
                                Click the link in the email to verify your account and access your dashboard.
                            </p>
                            <div className="rounded-[24px] p-6 mb-8 text-left" style={{ backgroundColor: '#f9f9f7', border: '1px solid #1a1a1a08' }}>
                                <p className="text-[10px] font-black uppercase tracking-widest mb-4" style={{ color: '#1a1a1a60' }}>Next Steps:</p>
                                <ol className="text-sm space-y-3" style={{ color: '#1a1a1a80' }}>
                                    <li className="flex gap-3">
                                        <span className="font-black" style={{ color: '#1a1a1a' }}>1.</span>
                                        <span>Open the email from uGlowMD</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="font-black" style={{ color: '#1a1a1a' }}>2.</span>
                                        <span>Click the verification link</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="font-black" style={{ color: '#1a1a1a' }}>3.</span>
                                        <span>You'll be redirected to your dashboard</span>
                                    </li>
                                </ol>
                            </div>
                            <p className="text-xs mb-6" style={{ color: '#1a1a1a60' }}>
                                Didn't receive the email? Check your spam folder or{' '}
                                <button
                                    onClick={() => setShowVerificationMessage(false)}
                                    className="font-bold hover:underline"
                                    style={{ color: '#1a1a1a' }}
                                >
                                    try again
                                </button>
                            </p>
                            <Link
                                to="/login"
                                className="inline-block px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all"
                                style={{ backgroundColor: 'transparent', border: '1px solid #1a1a1a20', color: '#1a1a1a' }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = '#1a1a1a'}
                                onMouseLeave={e => e.currentTarget.style.borderColor = '#1a1a1a20'}
                            >
                                Back to Login
                            </Link>
                        </div>

                    ) : (
                        <>
                            {/* Header */}
                            <div className="text-center mb-12">
                                <div className="inline-block py-1.5 px-4 bg-white/5 border border-white/10 rounded-full text-[9px] font-black uppercase tracking-[0.4em] text-white/60 mb-6">
                                    Start Your Journey
                                </div>
                                <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic mb-4">
                                    Create <span className="text-white font-black">Account</span>
                                </h1>
                                <p className="text-white/40 font-medium">
                                    Join <span className="font-brand font-bold italic-u">u</span><span className="font-brand font-bold">Glow<sup>MD</sup></span> to manage your transformative health journey.
                                </p>
                            </div>

                            {/* Form Container */}
                            <div className="bg-[#0A0A0A] border border-white/5 rounded-[40px] p-8 md:p-12 shadow-2xl backdrop-blur-xl relative group">
                                <div className="absolute inset-0 bg-gradient-to-br from-accent-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 rounded-[40px]"></div>

                                {error && (
                                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-medium text-center">
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="relative z-10 space-y-8">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4">
                                                First Name
                                            </label>
                                            <input
                                                type="text"
                                                value={firstName}
                                                onChange={(e) => setFirstName(e.target.value)}
                                                placeholder="John"
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white placeholder:text-white/10 focus:border-accent-black focus:bg-white/10 transition-all outline-none"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4">
                                                Last Name
                                            </label>
                                            <input
                                                type="text"
                                                value={lastName}
                                                onChange={(e) => setLastName(e.target.value)}
                                                placeholder="Doe"
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white placeholder:text-white/10 focus:border-accent-black focus:bg-white/10 transition-all outline-none"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Email Field */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4">
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="Enter your email"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white placeholder:text-white/10 focus:border-accent-black focus:bg-white/10 transition-all outline-none"
                                            required
                                        />
                                    </div>

                                    {/* Phone Field */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4">
                                            Phone Number
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={countryCode}
                                                onChange={(e) => {
                                                    let val = e.target.value;
                                                    if (!val.startsWith('+') && val.length > 0) val = '+' + val;
                                                    setCountryCode(val.replace(/[^\d+]/g, '').slice(0, 5));
                                                }}
                                                placeholder="+1"
                                                className="w-24 bg-white/5 border border-white/10 rounded-2xl py-4 text-center text-white placeholder:text-white/10 focus:border-accent-black focus:bg-white/10 transition-all outline-none font-bold"
                                                required
                                            />
                                            <input
                                                type="tel"
                                                value={phone}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setPhone(val.replace(/\D/g, '').slice(0, 15));
                                                }}
                                                placeholder="555 000 0000"
                                                className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white placeholder:text-white/10 focus:border-accent-black focus:bg-white/10 transition-all outline-none"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Password Field */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4">
                                            Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder="Create a strong password"
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white placeholder:text-white/10 focus:border-accent-black focus:bg-white/10 transition-all outline-none pr-12"
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
                                        disabled={loading}
                                        className="w-full py-5 bg-accent-black text-white rounded-full font-black text-sm uppercase tracking-[0.2em] transform transition-all active:scale-95 hover:bg-white hover:text-black hover:shadow-[0_0_40px_rgba(19,91,236,0.3)] mt-4 disabled:opacity-50"
                                    >
                                        {loading ? 'Creating Account...' : 'Create Account'}
                                    </button>

                                    {/* Divider */}
                                    <div className="flex items-center gap-4 py-6">
                                        <div className="h-px flex-1 bg-white/5"></div>
                                        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20">OR</span>
                                        <div className="h-px flex-1 bg-white/5"></div>
                                    </div>

                                    {/* Google Sign Up */}
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            try {
                                                const { error } = await signUp({ provider: 'google' });
                                                if (error) throw error;
                                            } catch (err) {
                                                setError(err.message);
                                            }
                                        }}
                                        className="w-full flex items-center justify-center gap-3 bg-white text-black py-4 rounded-full font-black text-xs uppercase tracking-widest hover:bg-accent-black hover:text-white transition-all"
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                        </svg>
                                        Sign Up with Google
                                    </button>
                                </form>
                            </div>

                            {/* Footer Links */}
                            <div className="mt-12 text-center">
                                <p className="text-white/40 text-sm font-medium mb-4 italic">
                                    Already have an account?
                                </p>
                                <Link
                                    to="/login"
                                    className="inline-block bg-white/5 border border-white/10 text-white px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest hover:border-white hover:bg-white/10 transition-all"
                                >
                                    Sign In
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="pb-12 opacity-40">
                <div className="max-w-[480px] mx-auto text-center border-t border-white/5 pt-8">
                    <p className="text-[9px] font-bold text-white uppercase tracking-[0.4em] mb-2 leading-relaxed">
                        End-to-End Encryption • HIPAA Secure Environment
                    </p>
                    <p className="text-[8px] font-medium text-white/40 uppercase tracking-widest">
                        © 2026 uGlowMD Health. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SignUpPage;
