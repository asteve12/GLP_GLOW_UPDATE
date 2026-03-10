import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import { useAuth } from '../context/AuthContext';
import { gsap } from 'gsap';
import Navbar from './Navbar';
import { supabase } from '../lib/supabaseClient';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { signIn, user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            navigate('/dashboard');
        }
        window.scrollTo(0, 0);
        gsap.fromTo('.login-content',
            { y: 32, opacity: 0 },
            { y: 0, opacity: 1, duration: 1.1, ease: 'power4.out' }
        );
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const { error } = await signIn({ email, password });
            if (error) throw error;
            const returnTo = new URLSearchParams(window.location.search).get('returnTo');
            navigate(returnTo || '/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#000000',
            color: '#ffffff',
            fontFamily: 'Inter, system-ui, sans-serif',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <Navbar />

            <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '60px 24px 60px',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Background atmosphere */}
                <div style={{
                    position: 'absolute',
                    top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '600px', height: '600px',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)',
                    pointerEvents: 'none'
                }} />

                <div className="login-content" style={{ width: '100%', maxWidth: '460px', position: 'relative', zIndex: 1 }}>

                    {/* Header */}
                    <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                        <div style={{
                            display: 'inline-block', padding: '6px 20px',
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            border: '1px solid rgba(255,255,255,0.25)',
                            borderRadius: '999px', fontSize: '9px', fontWeight: '900',
                            letterSpacing: '0.4em', textTransform: 'uppercase',
                            color: '#ffffff', marginBottom: '24px'
                        }}>Secure Access</div>

                        <h1 style={{
                            fontSize: 'clamp(36px, 6vw, 58px)', fontWeight: '900',
                            textTransform: 'uppercase', letterSpacing: '-0.04em',
                            lineHeight: '0.92', color: '#ffffff', marginBottom: '16px'
                        }}>
                            Patient<br />
                            <span style={{
                                color: '#ffffff',
                                padding: '2px 14px', display: 'inline-block', marginTop: '8px'
                            }}>
                                Portal
                            </span>
                        </h1>

                        <p style={{
                            color: '#ffffff', fontSize: '13px',
                            lineHeight: '1.7', fontWeight: '500'
                        }}>
                            Access your personalized treatment protocols<br />
                            and communicate with your medical team.
                        </p>
                    </div>

                    {/* Form Card */}
                    <div style={{
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '32px',
                        padding: '40px',
                        backdropFilter: 'blur(20px)'
                    }}>

                        {error && (
                            <div style={{
                                marginBottom: '24px', padding: '14px 18px',
                                backgroundColor: 'rgba(239,68,68,0.1)',
                                border: '1px solid rgba(239,68,68,0.25)',
                                borderRadius: '14px', color: '#f87171',
                                fontSize: '12px', fontWeight: '600', textAlign: 'center'
                            }}>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                            {/* Email */}
                            <div>
                                <label style={{
                                    display: 'block', fontSize: '9px', fontWeight: '900',
                                    textTransform: 'uppercase', letterSpacing: '0.35em',
                                    color: '#ffffff', marginBottom: '10px'
                                }}>Email Address</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    required
                                    className="placeholder-white"
                                    style={{
                                        width: '100%', boxSizing: 'border-box',
                                        backgroundColor: 'rgba(255,255,255,0.05)',
                                        border: '1.5px solid rgba(255,255,255,0.1)',
                                        borderRadius: '14px', padding: '16px 20px',
                                        fontSize: '14px', color: '#ffffff',
                                        outline: 'none', transition: 'border-color 0.2s',
                                        fontFamily: 'inherit'
                                    }}
                                    onFocus={e => e.target.style.borderColor = '#ffffff'}
                                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                                />
                            </div>

                            {/* Password */}
                            <div>
                                <div style={{
                                    display: 'flex', justifyContent: 'space-between',
                                    alignItems: 'center', marginBottom: '10px'
                                }}>
                                    <label style={{
                                        fontSize: '9px', fontWeight: '900',
                                        textTransform: 'uppercase', letterSpacing: '0.35em',
                                        color: '#ffffff'
                                    }}>Password</label>
                                    <Link to="/forgot-password" style={{
                                        fontSize: '9px', fontWeight: '800',
                                        textTransform: 'uppercase', letterSpacing: '0.2em',
                                        color: '#ffffff', textDecoration: 'none'
                                    }}
                                        onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
                                        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                                    >Forgot?</Link>
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        className="placeholder-white"
                                        style={{
                                            width: '100%', boxSizing: 'border-box',
                                            backgroundColor: 'rgba(255,255,255,0.05)',
                                            border: '1.5px solid rgba(255,255,255,0.1)',
                                            borderRadius: '14px', padding: '16px 48px 16px 20px',
                                            fontSize: '14px', color: '#ffffff',
                                            outline: 'none', transition: 'border-color 0.2s',
                                            fontFamily: 'inherit'
                                        }}
                                        onFocus={e => e.target.style.borderColor = '#ffffff'}
                                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{
                                            position: 'absolute', right: '16px', top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: 'none', border: 'none', cursor: 'pointer',
                                            color: '#ffffff', padding: '4px'
                                        }}
                                    >
                                        {showPassword ? (
                                            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        ) : (
                                            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Login Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#f0f0f0'; }}
                                onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#ffffff'; }}
                                style={{
                                    width: '100%', padding: '18px', borderRadius: '999px',
                                    backgroundColor: '#ffffff', color: '#000000',
                                    border: 'none', fontSize: '11px', fontWeight: '900',
                                    textTransform: 'uppercase', letterSpacing: '0.32em',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    opacity: loading ? 0.7 : 1,
                                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                    marginTop: '8px', fontFamily: 'inherit'
                                }}
                            >
                                {loading ? 'Logging in...' : 'Login'}
                            </button>

                            {/* Divider */}
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '16px', margin: '8px 0'
                            }}>
                                <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.08)' }}></div>
                                <span style={{ fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.3em', color: '#ffffff' }}>OR</span>
                                <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.08)' }}></div>
                            </div>

                            {/* Google Sign In */}
                            <button
                                type="button"
                                onClick={async () => {
                                    try {
                                        const returnTo = new URLSearchParams(window.location.search).get('returnTo');
                                        const { error } = await supabase.auth.signInWithOAuth({
                                            provider: 'google',
                                            options: {
                                                redirectTo: window.location.origin + (returnTo || '/dashboard')
                                            }
                                        });
                                        if (error) throw error;
                                    } catch (err) {
                                        setError(err.message);
                                    }
                                }}
                                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
                                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                                style={{
                                    width: '100%', padding: '16px', borderRadius: '999px',
                                    backgroundColor: 'transparent', color: '#ffffff',
                                    border: '1.5px solid rgba(255,255,255,0.1)',
                                    fontSize: '10px', fontWeight: '900',
                                    textTransform: 'uppercase', letterSpacing: '0.22em',
                                    cursor: 'pointer', transition: 'all 0.25s',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px'
                                }}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                Sign in with Google
                            </button>

                            {/* Create Account section */}
                            <div style={{
                                marginTop: '32px',
                                textAlign: 'center',
                                borderTop: '1px solid rgba(255,255,255,0.07)',
                                paddingTop: '24px'
                            }}>
                                <p style={{
                                    fontSize: '11px',
                                    fontWeight: '700',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.15em',
                                    color: '#ffffff',
                                    marginBottom: '16px'
                                }}>New User ?</p>
                                <Link to="/signup" style={{
                                    fontSize: '11px',
                                    fontWeight: '900',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.25em',
                                    color: '#ffffff',
                                    textDecoration: 'none',
                                    transition: 'all 0.3s',
                                    padding: '12px 32px',
                                    borderRadius: '14px',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    display: 'inline-block'
                                }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.backgroundColor = '#ffffff';
                                        e.currentTarget.style.color = '#000000';
                                        e.currentTarget.style.borderColor = '#ffffff';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                        e.currentTarget.style.color = '#ffffff';
                                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                                    }}
                                >
                                    Create Account
                                </Link>
                            </div>



                        </form>
                    </div>

                    <p style={{
                        textAlign: 'center', marginTop: '32px', fontSize: '9px',
                        fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.15em',
                        color: '#ffffff', lineHeight: '1.9'
                    }}>
                        End-to-End Encryption · HIPAA Secure Environment<br />
                        © 2026 <img src={logo} alt="uGlowMD" className="h-3 w-auto inline-block align-middle invert" /> Health. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
