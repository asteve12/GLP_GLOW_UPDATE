import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import logo from '../assets/logo.png';

const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Log to verify we hit this page
        console.log('Reset Password page loaded');

        // Check if we have an active session (Supabase handles the recovery session automatically)
        const checkSession = async () => {
            const { data } = await supabase.auth.getSession();
            if (!data.session) {
                // If no session, the link might be expired or invalid
                console.warn('No active session found for password reset');
            }
        };
        checkSession();
    }, []);

    const handleUpdatePassword = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) throw error;

            setSuccess(true);
            toast.success('Medical portal password successfully updated.');

            // Redirect to login after 3 seconds
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            setError(err.message);
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-1000">
                <div className="text-center mb-12">
                    <div className="flex justify-center mb-10">
                        <Link to="/">
                            <img src={logo} alt="uGlowMD Logo" className="h-16 w-auto object-contain invert" />
                        </Link>
                    </div>
                    <div className="inline-block py-2 px-6 bg-white/10 border border-white/20 rounded-full text-[10px] font-black uppercase tracking-[0.4em] text-white mb-8">
                        Identity Sync
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-4 text-white">
                        New<br />
                        <span style={{ color: '#ffffff', padding: '2px 0', display: 'inline-block' }}>Credentials.</span>
                    </h1>
                    <p className="font-medium uppercase tracking-[0.2em] text-[10px] text-white/50">
                        Establish your updated clinical access credentials below.
                    </p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-[40px] p-8 md:p-10 shadow-2xl relative overflow-hidden backdrop-blur-xl">

                    {success ? (
                        <div className="text-center space-y-6 py-4">
                            <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/20">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-black uppercase tracking-tighter text-white">Sync Complete</h3>
                            <p className="text-sm font-bold text-white/60 leading-relaxed">
                                Your medical portal access has been restored. Redirecting to login...
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleUpdatePassword} className="space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest mb-3 ml-1 text-white/40">New Password</label>
                                    <input
                                        type="password"
                                        required
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full rounded-2xl py-5 px-8 font-bold outline-none transition-all bg-white/5 border border-white/10 text-white focus:border-white placeholder-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest mb-3 ml-1 text-white/40">Confirm Password</label>
                                    <input
                                        type="password"
                                        required
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full rounded-2xl py-5 px-8 font-bold outline-none transition-all bg-white/5 border border-white/10 text-white focus:border-white placeholder-white"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[10px] font-black uppercase tracking-widest text-center">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-6 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-[0.4em] transition-all hover:bg-white/90 disabled:opacity-50 shadow-xl transform active:scale-[0.98]"
                            >
                                {loading ? 'Restoring Access...' : 'Update & Restrict Access'}
                            </button>
                        </form>
                    )}
                </div>

                {!success && (
                    <div className="mt-8 text-center">
                        <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.3em]">
                            Global 256-bit AES Clinical Encryption Active
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResetPassword;
