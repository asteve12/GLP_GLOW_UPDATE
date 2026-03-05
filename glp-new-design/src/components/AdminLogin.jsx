import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { gsap } from 'gsap';
import { supabase } from '../lib/supabaseClient';

const SUB_ADMIN_ROLES = ['physician', 'nurse_practitioner', 'physician_assistant', 'back_office', 'provider'];

const AdminLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Unified states
    const [step, setStep] = useState('login'); // 'login' | 'otp' | 'totp'
    const [otpCode, setOtpCode] = useState('');
    const [otpSending, setOtpSending] = useState(false);
    const [otpTimer, setOtpTimer] = useState(0);
    const [pendingRole, setPendingRole] = useState(null);

    // MFA states
    const [mfaFactor, setMfaFactor] = useState(null);
    const [totpCode, setTotpCode] = useState('');

    const { signIn, user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const checkExistingAuth = async () => {
            if (user) {
                const { data } = await supabase
                    .from('user_roles')
                    .select('role')
                    .eq('user_id', user.id)
                    .single();

                const isAuthorized = data && (data.role === 'admin' || SUB_ADMIN_ROLES.includes(data.role));
                if (isAuthorized) {
                    navigate('/admin/overview');
                } else {
                    navigate('/dashboard');
                }
            }
        };
        checkExistingAuth();
        window.scrollTo(0, 0);
        gsap.fromTo('.admin-login-content',
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, duration: 1.2, ease: 'power4.out' }
        );
    }, [user, navigate]);

    // Countdown timer for OTP resend
    useEffect(() => {
        if (otpTimer > 0) {
            const t = setTimeout(() => setOtpTimer(t => t - 1), 1000);
            return () => clearTimeout(t);
        }
    }, [otpTimer]);

    // Send OTP via Supabase email OTP
    const sendOtp = async (emailAddr) => {
        setOtpSending(true);
        try {
            const { error } = await supabase.auth.signInWithOtp({
                email: emailAddr,
                options: { shouldCreateUser: false }
            });
            if (error) throw error;
            setOtpTimer(60);
        } catch (err) {
            console.error('OTP send failed:', err);
            setError('Failed to send OTP. Please try again.');
        } finally {
            setOtpSending(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const { data: authData, error: authError } = await signIn({ email, password });
            if (authError) throw authError;

            // Check if MFA is required
            const { data: aalData, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
            if (aalError) throw aalError;

            if (aalData.nextLevel === 'aal2' && aalData.nextLevel !== aalData.currentLevel) {
                // MFA required
                const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
                if (factorsError) throw factorsError;

                const totpFactor = factors.totp[0];
                if (totpFactor) {
                    setMfaFactor(totpFactor);
                    setStep('totp');
                    return;
                }
            }

            // If no MFA but is sub-admin, proceed with email OTP
            const { data: roleData, error: roleError } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
                .single();

            const isAdmin = roleData?.role === 'admin';
            const isSubAdmin = SUB_ADMIN_ROLES.includes(roleData?.role);

            if (roleError || (!isAdmin && !isSubAdmin)) {
                throw new Error('Unauthorized: Administrative / Staff privileges required.');
            }

            setPendingRole(roleData.role);

            if (isSubAdmin) {
                await sendOtp(email);
                setStep('otp');
            } else {
                navigate('/admin/overview');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const { error } = await supabase.auth.verifyOtp({
                email,
                token: otpCode.trim(),
                type: 'email'
            });
            if (error) throw error;
            navigate('/admin/overview');
        } catch (err) {
            setError('Invalid or expired OTP code. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyTotp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
                factorId: mfaFactor.id
            });
            if (challengeError) throw challengeError;

            const { error: verifyError } = await supabase.auth.mfa.verify({
                factorId: mfaFactor.id,
                challengeId: challengeData.id,
                code: totpCode.trim()
            });
            if (verifyError) throw verifyError;

            navigate('/admin/overview');
        } catch (err) {
            setError('Invalid Google Authenticator code. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Shared styles
    const inputStyle = {
        width: '100%',
        boxSizing: 'border-box',
        backgroundColor: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        padding: '18px 24px',
        fontSize: '14px',
        color: '#ffffff',
        outline: 'none',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        fontFamily: 'inherit'
    };
    const labelStyle = {
        display: 'block',
        fontSize: '9px',
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: '0.4em',
        color: 'rgba(255,255,255,0.25)',
        marginBottom: '12px'
    };

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#050505',
            color: '#ffffff',
            fontFamily: 'Outfit, Inter, sans-serif',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Background Elements */}
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                background: 'radial-gradient(circle at 50% 50%, rgba(191,255,0,0.03) 0%, transparent 70%)',
                pointerEvents: 'none'
            }} />
            <div style={{
                position: 'absolute', top: '10%', right: '10%',
                width: '400px', height: '400px',
                background: 'radial-gradient(circle, rgba(255,255,255,0.01) 0%, transparent 80%)',
                borderRadius: '50%', pointerEvents: 'none'
            }} />

            <div className="admin-login-content" style={{ width: '100%', maxWidth: '440px', position: 'relative', zIndex: 1 }}>

                {/* Brand */}
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <h1 style={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.6em', color: '#bfff00', marginBottom: '16px', opacity: 0.8 }}>
                        Console Management
                    </h1>
                    <h2 style={{ fontSize: '42px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '-0.04em', lineHeight: '1', marginBottom: '12px' }}>
                        uGlow<span style={{ color: '#bfff00' }}>Admin</span>
                    </h2>
                    <p style={{ fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        {step === 'otp' ? 'OTP Verification Required' : 'Restricted Personnel Only'}
                    </p>
                </div>

                {/* Card */}
                <div style={{
                    backgroundColor: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '32px',
                    padding: '48px',
                    backdropFilter: 'blur(40px)',
                    boxShadow: '0 24px 80px rgba(0,0,0,0.5)'
                }}>
                    {error && (
                        <div style={{
                            marginBottom: '28px', padding: '16px',
                            backgroundColor: 'rgba(239,68,68,0.08)',
                            border: '1px solid rgba(239,68,68,0.2)',
                            borderRadius: '16px', color: '#f87171',
                            fontSize: '11px', fontWeight: '700',
                            textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.05em'
                        }}>
                            {error}
                        </div>
                    )}

                    {/* ─── LOGIN STEP ─── */}
                    {step === 'login' && (
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                            <div>
                                <label style={labelStyle}>System Identifier</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="name@uglowmd.com"
                                    required
                                    style={inputStyle}
                                    onFocus={e => { e.target.style.borderColor = '#bfff00'; e.target.style.backgroundColor = 'rgba(191,255,0,0.02)'; }}
                                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.backgroundColor = 'rgba(255,255,255,0.03)'; }}
                                />
                            </div>

                            <div>
                                <label style={labelStyle}>Secure Cipher</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder="••••••••••••"
                                        required
                                        style={{ ...inputStyle, paddingRight: '56px' }}
                                        onFocus={e => { e.target.style.borderColor = '#bfff00'; e.target.style.backgroundColor = 'rgba(191,255,0,0.02)'; }}
                                        onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.backgroundColor = 'rgba(255,255,255,0.03)'; }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.2)', padding: '4px', transition: 'color 0.2s' }}
                                        onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                                        onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.2)'}
                                    >
                                        {showPassword ? (
                                            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                        ) : (
                                            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    width: '100%', padding: '20px', borderRadius: '16px',
                                    backgroundColor: loading ? 'rgba(255,255,255,0.1)' : '#bfff00',
                                    color: '#000', border: 'none', fontSize: '11px', fontWeight: '900',
                                    textTransform: 'uppercase', letterSpacing: '0.4em',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.4s cubic-bezier(0.175,0.885,0.32,1.275)',
                                    marginTop: '12px',
                                    boxShadow: loading ? 'none' : '0 10px 40px rgba(191,255,0,0.2)'
                                }}
                                onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 15px 50px rgba(191,255,0,0.3)'; } }}
                                onMouseLeave={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 40px rgba(191,255,0,0.2)'; } }}
                            >
                                {loading ? 'Authenticating...' : 'Establish Connection'}
                            </button>
                        </form>
                    )}

                    {/* ─── OTP STEP ─── */}
                    {step === 'otp' && (
                        <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                            {/* Info Banner */}
                            <div style={{
                                padding: '16px 20px',
                                backgroundColor: 'rgba(191,255,0,0.05)',
                                border: '1px solid rgba(191,255,0,0.15)',
                                borderRadius: '16px',
                                fontSize: '11px', fontWeight: '600',
                                color: 'rgba(191,255,0,0.8)',
                                textAlign: 'center'
                            }}>
                                A verification code was sent to<br />
                                <strong style={{ fontSize: '12px' }}>{email}</strong>
                            </div>

                            <div>
                                <label style={labelStyle}>6-Digit OTP Code</label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]{6}"
                                    maxLength={6}
                                    value={otpCode}
                                    onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                                    placeholder="000000"
                                    required
                                    autoFocus
                                    style={{
                                        ...inputStyle,
                                        fontSize: '28px',
                                        fontWeight: '900',
                                        letterSpacing: '0.4em',
                                        textAlign: 'center',
                                        paddingTop: '22px',
                                        paddingBottom: '22px'
                                    }}
                                    onFocus={e => { e.target.style.borderColor = '#bfff00'; e.target.style.backgroundColor = 'rgba(191,255,0,0.02)'; }}
                                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.backgroundColor = 'rgba(255,255,255,0.03)'; }}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading || otpCode.length < 6}
                                style={{
                                    width: '100%', padding: '20px', borderRadius: '16px',
                                    backgroundColor: (loading || otpCode.length < 6) ? 'rgba(255,255,255,0.1)' : '#bfff00',
                                    color: '#000', border: 'none', fontSize: '11px', fontWeight: '900',
                                    textTransform: 'uppercase', letterSpacing: '0.4em',
                                    cursor: (loading || otpCode.length < 6) ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.4s cubic-bezier(0.175,0.885,0.32,1.275)',
                                    boxShadow: (loading || otpCode.length < 6) ? 'none' : '0 10px 40px rgba(191,255,0,0.2)'
                                }}
                            >
                                {loading ? 'Verifying...' : 'Verify & Enter Portal'}
                            </button>

                            {/* Resend + Back */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <button
                                    type="button"
                                    onClick={() => sendOtp(email)}
                                    disabled={otpSending || otpTimer > 0}
                                    style={{
                                        background: 'none', border: 'none',
                                        fontSize: '9px', fontWeight: '900',
                                        textTransform: 'uppercase', letterSpacing: '0.3em',
                                        color: (otpSending || otpTimer > 0) ? 'rgba(255,255,255,0.15)' : 'rgba(191,255,0,0.6)',
                                        cursor: (otpSending || otpTimer > 0) ? 'not-allowed' : 'pointer',
                                        transition: 'color 0.3s'
                                    }}
                                >
                                    {otpSending ? 'Sending...' : otpTimer > 0 ? `Resend in ${otpTimer}s` : 'Resend Code'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setStep('login'); setError(null); setOtpCode(''); }}
                                    style={{
                                        background: 'none', border: 'none',
                                        fontSize: '9px', fontWeight: '900',
                                        textTransform: 'uppercase', letterSpacing: '0.3em',
                                        color: 'rgba(255,255,255,0.2)', cursor: 'pointer', transition: 'color 0.3s'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
                                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.2)'}
                                >
                                    Back to Login
                                </button>
                            </div>
                        </form>
                    )}

                    {/* ─── TOTP (GOOGLE AUTHENTICATOR) STEP ─── */}
                    {step === 'totp' && (
                        <form onSubmit={handleVerifyTotp} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                            {/* Info Banner */}
                            <div style={{
                                padding: '16px 20px',
                                backgroundColor: 'rgba(59, 130, 246, 0.08)',
                                border: '1px solid rgba(59, 130, 246, 0.2)',
                                borderRadius: '16px',
                                fontSize: '11px', fontWeight: '600',
                                color: '#60a5fa',
                                textAlign: 'center'
                            }}>
                                Verification required via<br />
                                <strong style={{ fontSize: '12px' }}>Google Authenticator</strong>
                            </div>

                            <div>
                                <label style={labelStyle}>6-Digit Security Code</label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]{6}"
                                    maxLength={6}
                                    value={totpCode}
                                    onChange={e => setTotpCode(e.target.value.replace(/\D/g, ''))}
                                    placeholder="000 000"
                                    required
                                    autoFocus
                                    style={{
                                        ...inputStyle,
                                        fontSize: '28px',
                                        fontWeight: '900',
                                        letterSpacing: '0.4em',
                                        textAlign: 'center',
                                        paddingTop: '22px',
                                        paddingBottom: '22px'
                                    }}
                                    onFocus={e => { e.target.style.borderColor = '#60a5fa'; e.target.style.backgroundColor = 'rgba(59, 130, 246, 0.03)'; }}
                                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.backgroundColor = 'rgba(255,255,255,0.03)'; }}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading || totpCode.length < 6}
                                style={{
                                    width: '100%', padding: '20px', borderRadius: '16px',
                                    backgroundColor: (loading || totpCode.length < 6) ? 'rgba(255,255,255,0.1)' : '#60a5fa',
                                    color: '#000', border: 'none', fontSize: '11px', fontWeight: '900',
                                    textTransform: 'uppercase', letterSpacing: '0.4em',
                                    cursor: (loading || totpCode.length < 6) ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.4s cubic-bezier(0.175,0.885,0.32,1.275)',
                                    boxShadow: (loading || totpCode.length < 6) ? 'none' : '0 10px 40px rgba(59, 130, 246, 0.2)'
                                }}
                            >
                                {loading ? 'Verifying...' : 'Authenticate & Enter'}
                            </button>

                            <button
                                type="button"
                                onClick={() => { setStep('login'); setTotpCode(''); setError(null); }}
                                style={{
                                    background: 'none', border: 'none',
                                    fontSize: '9px', fontWeight: '900',
                                    color: 'rgba(255,255,255,0.3)',
                                    textTransform: 'uppercase', letterSpacing: '0.2em',
                                    cursor: 'pointer', textAlign: 'center'
                                }}
                            >
                                ← Back to Login
                            </button>
                        </form>
                    )}
                </div>

                {/* Return Link */}
                <div style={{ textAlign: 'center', marginTop: '32px' }}>
                    <button
                        onClick={() => navigate('/login')}
                        style={{
                            background: 'none', border: 'none',
                            fontSize: '9px', fontWeight: '900',
                            textTransform: 'uppercase', letterSpacing: '0.3em',
                            color: 'rgba(255,255,255,0.2)', cursor: 'pointer', transition: 'color 0.3s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.2)'}
                    >
                        Switch to Patient Portal
                    </button>
                </div>
            </div>

            {/* Footer */}
            <div style={{
                position: 'absolute', bottom: '32px', left: '0', right: '0',
                textAlign: 'center', fontSize: '8px', fontWeight: '800',
                textTransform: 'uppercase', letterSpacing: '0.4em',
                color: 'rgba(255,255,255,0.1)', pointerEvents: 'none'
            }}>
                Authorization Trace Enabled • ISO-27001 Verified System
            </div>
        </div>
    );
};

export default AdminLogin;
