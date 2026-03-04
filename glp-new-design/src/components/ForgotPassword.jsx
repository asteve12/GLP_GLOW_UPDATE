import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleReset = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (error) throw error;
            setMessage('Clinical password recovery link transmitted. Please check your inbox.');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
            <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-1000">
                <div className="text-center mb-12">
                    <Link to="/" className="inline-block mb-10">
                        <span className="text-2xl font-black uppercase tracking-tighter">uGlow<span className="text-accent-black">MD</span></span>
                    </Link>
                    <div className="inline-block py-2 px-6 bg-black rounded-full text-[10px] font-black uppercase tracking-[0.4em] text-white mb-8">
                        Security Protocol
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-4 text-[#1a1a1a]">
                        Recover<br />
                        <span style={{ backgroundColor: '#FFDE59', color: '#1a1a1a', padding: '2px 10px', display: 'inline-block' }}>Access.</span>
                    </h1>
                    <p className="font-medium uppercase tracking-[0.2em] text-[10px] text-[#1a1a1a80]">
                        Enter your medical portal email to receive a recovery link.
                    </p>
                </div>

                <div className="bg-[#f9f9f7] border border-black/10 rounded-[40px] p-8 md:p-10 shadow-2xl">
                    {message ? (
                        <div className="text-center space-y-6">
                            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="3">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            </div>
                            <p className="text-sm font-bold text-[#1a1a1a] leading-relaxed">{message}</p>
                            <Link to="/assessment" className="block w-full py-5 bg-black text-white rounded-2xl font-black text-xs uppercase tracking-[0.4em] transition-all hover:bg-accent-black hover:text-black">
                                Back to Portal
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleReset} className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest mb-3 ml-1 text-[#1a1a1a60]">Portal Email</label>
                                <input
                                    type="email"
                                    required
                                    placeholder="name@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full rounded-2xl py-5 px-8 font-bold outline-none transition-all bg-white border border-black/15 text-[#1a1a1a] focus:border-[#FFDE59]"
                                />
                            </div>

                            {error && (
                                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[10px] font-black uppercase tracking-widest text-center">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-6 bg-black text-white rounded-2xl font-black text-xs uppercase tracking-[0.4em] transition-all hover:bg-accent-black hover:text-black disabled:opacity-50 shadow-xl"
                            >
                                {loading ? 'Transmitting...' : 'Send Recovery Link'}
                            </button>

                            <Link to="/assessment" className="block text-center text-[10px] font-black uppercase tracking-widest text-[#1a1a1a60] hover:text-[#1a1a1a] transition-all">
                                ← Back to Sign In
                            </Link>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
