import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.webp';
import { toast } from 'react-hot-toast';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState(1); // 1: Email, 2: OTP
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSendOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Check if user exists in our profiles table first
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('id')
                .eq('email', email.trim().toLowerCase())
                .maybeSingle();

            if (profileError) {
                console.error('Profile check error:', profileError);
            }

            if (!profile) {
                throw new Error('This email is not registered in our clinical portal.');
            }

            const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
            if (error) throw error;

            setStep(2);
            toast.success('Security code transmitted to your email.');
        } catch (err) {
            setError(err.message);
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { error } = await supabase.auth.verifyOtp({
                email,
                token: otp,
                type: 'recovery'
            });

            if (error) throw error;

            toast.success('Identity verified.');
            navigate('/reset-password');
        } catch (err) {
            setError(err.message);
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ backgroundColor: '#000000' }}>
            <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-1000">
                <div className="text-center mb-12">
                    <Link to="/" className="inline-block mb-10 flex justify-center">
                        <img src={logo} alt="uGlowMD Logo" className="h-16 w-auto object-contain invert" />
                    </Link>
                    <div className="inline-block py-2 px-6 bg-white/10 border border-white/20 rounded-full text-[10px] font-black uppercase tracking-[0.4em] text-white mb-8">
                        {step === 1 ? 'Security Protocol' : 'Identity Verification'}
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-4 text-white">
                        {step === 1 ? 'Recover' : 'Verify'}<br />
                        <span style={{ color: '#ffffff', padding: '2px 0', display: 'inline-block' }}>Access.</span>
                    </h1>
                    <p className="font-medium uppercase tracking-[0.2em] text-[10px] text-white">
                        {step === 1
                            ? 'Enter your medical portal email to receive a recovery code.'
                            : 'Enter the 6-digit security code sent to your email.'}
                    </p>
                </div>

                <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-[40px] p-8 md:p-10 shadow-2xl">
                    <form onSubmit={step === 1 ? handleSendOTP : handleVerifyOTP} className="space-y-6">
                        {step === 1 ? (
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest mb-3 ml-1 text-white">Portal Email</label>
                                <input
                                    type="email"
                                    required
                                    placeholder="name@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full rounded-2xl py-5 px-8 font-bold outline-none transition-all bg-white/5 border border-white/10 text-white focus:border-white placeholder-white"
                                />
                            </div>
                        ) : (
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest mb-3 ml-1 text-white">Security Code</label>
                                <input
                                    type="text"
                                    required
                                    maxLength={6}
                                    placeholder="000000"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    className="w-full rounded-2xl py-5 px-8 font-bold outline-none transition-all bg-white/5 border border-white/10 text-white focus:border-white placeholder-white text-center text-2xl tracking-[0.5em]"
                                />
                            </div>
                        )}

                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[10px] font-black uppercase tracking-widest text-center">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-6 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-[0.4em] transition-all hover:bg-white/90 disabled:opacity-50 shadow-xl"
                        >
                            {loading ? 'Processing...' : step === 1 ? 'Send Recovery Code' : 'Verify Identity'}
                        </button>

                        {step === 2 && (
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="w-full text-center text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all mt-4"
                            >
                                ← Change Email
                            </button>
                        )}

                        <Link to="/login" className="block text-center text-[10px] font-black uppercase tracking-widest text-white hover:opacity-70 transition-all">
                            {step === 1 ? '← Back to Sign In' : 'Cancel Verification'}
                        </Link>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
