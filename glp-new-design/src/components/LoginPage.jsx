import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { gsap } from 'gsap';
import Navbar from './Navbar';

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
            backgroundColor: '#0A0A0A',
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
                padding: '120px 24px 60px',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Background glow */}
                <div style={{
                    position: 'absolute',
                    top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '600px', height: '600px',
                    background: 'radial-gradient(circle, rgba(255,222,89,0.06) 0%, transparent 70%)',
                    pointerEvents: 'none'
                }} />

                <div className="login-content" style={{ width: '100%', maxWidth: '460px', position: 'relative', zIndex: 1 }}>

                    {/* Header */}
                    <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                        <div style={{
                            display: 'inline-block', padding: '6px 20px',
                            backgroundColor: 'rgba(255,222,89,0.1)',
                            border: '1px solid rgba(255,222,89,0.25)',
                            borderRadius: '999px', fontSize: '9px', fontWeight: '900',
                            letterSpacing: '0.4em', textTransform: 'uppercase',
                            color: '#FFDE59', marginBottom: '24px'
                        }}>Secure Access</div>

                        <h1 style={{
                            fontSize: 'clamp(36px, 6vw, 58px)', fontWeight: '900',
                            textTransform: 'uppercase', letterSpacing: '-0.04em',
                            lineHeight: '0.92', color: '#ffffff', marginBottom: '16px'
                        }}>
                            Patient<br />
                            <span style={{
                                backgroundColor: '#FFDE59', color: '#000',
                                padding: '2px 14px', display: 'inline-block', marginTop: '8px'
                            }}>
                                Portal
                            </span>
                        </h1>

                        <p style={{
                            color: 'rgba(255,255,255,0.4)', fontSize: '13px',
                            lineHeight: '1.7', fontWeight: '500'
                        }}>
                            Access your personalized treatment protocols<br />
                            and communicate with your medical team.
                        </p>
                    </div>

                    {/* Form Card */}
                    <div style={{
                        backgroundColor: 'rgba(255,255,255,0.04)',
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
                                    color: 'rgba(255,255,255,0.3)', marginBottom: '10px'
                                }}>Email Address</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    required
                                    style={{
                                        width: '100%', boxSizing: 'border-box',
                                        backgroundColor: 'rgba(255,255,255,0.05)',
                                        border: '1.5px solid rgba(255,255,255,0.1)',
                                        borderRadius: '14px', padding: '16px 20px',
                                        fontSize: '14px', color: '#ffffff',
                                        outline: 'none', transition: 'border-color 0.2s',
                                        fontFamily: 'inherit'
                                    }}
                                    onFocus={e => e.target.style.borderColor = '#FFDE59'}
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
                                        color: 'rgba(255,255,255,0.3)'
                                    }}>Password</label>
                                    <Link to="/forgot-password" style={{
                                        fontSize: '9px', fontWeight: '800',
                                        textTransform: 'uppercase', letterSpacing: '0.2em',
                                        color: 'rgba(255,222,89,0.6)', textDecoration: 'none'
                                    }}
                                        onMouseEnter={e => e.currentTarget.style.color = '#FFDE59'}
                                        onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,222,89,0.6)'}
                                    >Forgot?</Link>
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        style={{
                                            width: '100%', boxSizing: 'border-box',
                                            backgroundColor: 'rgba(255,255,255,0.05)',
                                            border: '1.5px solid rgba(255,255,255,0.1)',
                                            borderRadius: '14px', padding: '16px 48px 16px 20px',
                                            fontSize: '14px', color: '#ffffff',
                                            outline: 'none', transition: 'border-color 0.2s',
                                            fontFamily: 'inherit'
                                        }}
                                        onFocus={e => e.target.style.borderColor = '#FFDE59'}
                                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{
                                            position: 'absolute', right: '16px', top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: 'none', border: 'none', cursor: 'pointer',
                                            color: 'rgba(255,255,255,0.25)', padding: '4px'
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
                                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#FFDE59'; e.currentTarget.style.color = '#000'; }}
                                onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.color = '#000'; }}
                                style={{
                                    width: '100%', padding: '18px', borderRadius: '999px',
                                    backgroundColor: '#ffffff', color: '#000',
                                    border: 'none', fontSize: '11px', fontWeight: '900',
                                    textTransform: 'uppercase', letterSpacing: '0.32em',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    opacity: loading ? 0.7 : 1,
                                    transition: 'background-color 0.25s, color 0.25s',
                                    marginTop: '8px', fontFamily: 'inherit'
                                }}
                            >
                                {loading ? 'Logging in...' : 'Login'}
                            </button>

                            {/* Divider */}
                            <div style={{
                                paddingTop: '24px', textAlign: 'center',
                                borderTop: '1px solid rgba(255,255,255,0.07)'
                            }}>
                                <p style={{
                                    fontSize: '10px', fontWeight: '800',
                                    textTransform: 'uppercase', letterSpacing: '0.3em',
                                    color: 'rgba(255,255,255,0.25)', marginBottom: '16px'
                                }}>New to <sub>u</sub>Glow<sup>MD</sup>?</p>
                                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                    <Link to="/signup"
                                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#FFDE59'; e.currentTarget.style.color = '#000'; }}
                                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#FFDE59'; }}
                                        style={{
                                            flex: 1, padding: '14px 20px', borderRadius: '999px',
                                            textAlign: 'center', border: '1.5px solid rgba(255,222,89,0.4)',
                                            color: '#FFDE59', textDecoration: 'none',
                                            fontSize: '10px', fontWeight: '900',
                                            textTransform: 'uppercase', letterSpacing: '0.22em',
                                            transition: 'background-color 0.25s, color 0.25s'
                                        }}
                                    >Create Account</Link>
                                    <Link to="/qualify"
                                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                                        style={{
                                            flex: 1, padding: '14px 20px', borderRadius: '999px',
                                            textAlign: 'center', border: '1.5px solid rgba(255,255,255,0.12)',
                                            color: 'rgba(255,255,255,0.6)', textDecoration: 'none',
                                            fontSize: '10px', fontWeight: '900',
                                            textTransform: 'uppercase', letterSpacing: '0.22em',
                                            transition: 'background-color 0.25s'
                                        }}
                                    >Start Assessment</Link>
                                </div>
                            </div>

                            {/* Admin Access Link */}
                            <div style={{
                                marginTop: '32px',
                                textAlign: 'center',
                                borderTop: '1px solid rgba(255,255,255,0.07)',
                                paddingTop: '24px'
                            }}>
                                <Link to="/admin-sign-in"
                                    onMouseEnter={e => { e.currentTarget.style.color = '#ffffff'; e.currentTarget.style.opacity = '1'; }}
                                    onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; e.currentTarget.style.opacity = '0.6'; }}
                                    style={{
                                        fontSize: '9px', fontWeight: '900',
                                        textTransform: 'uppercase', letterSpacing: '0.4em',
                                        color: 'rgba(255,255,255,0.4)', textDecoration: 'none',
                                        opacity: 0.6, transition: 'all 0.3s',
                                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M12 15V3m0 12l-4-4m4 4l4-4M2 17l.621 2.485A2 2 0 004.561 21h14.878a2 2 0 001.94-1.515L22 17" />
                                    </svg>
                                    Administrative Access
                                </Link>
                            </div>
                        </form>
                    </div>

                    {/* Footer note */}
                    <p style={{
                        textAlign: 'center', marginTop: '32px', fontSize: '9px',
                        fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.3em',
                        color: 'rgba(255,255,255,0.18)', lineHeight: '1.9'
                    }}>
                        End-to-End Encryption · HIPAA Secure Environment<br />
                        © 2026 <sub>u</sub>Glow<sup>MD</sup> Health. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
