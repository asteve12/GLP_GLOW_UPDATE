import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { useNavigate, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { intakeQuestions, categoryQuestions } from '../data/questions';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { toast } from 'react-hot-toast';

const stripePromise = loadStripe('pk_test_51RNxytRZvtknfMGgwf0Tsuvx6jguIyVph5rWBAMFzFcfpj9SuWUWIdm06eCsxwAhbeQE69EFOo7ExXCqyLBpHVvl00Kr3ycplu');

import weightLossImg from '../assets/weightloss-quote-img.png';
import hairLossImg from '../assets/hair-loss-first-quote.png';
import sexualHealthImg from '../assets/sexual_health_first_quote.png';
import longevityImg from '../assets/longetivity_first_quote_img.png';
import testosteroneImg from '../assets/testosterone-image-v2.png';
import skinCareImg from '../assets/skincare.png';
import retatrutideImg from '../assets/clinical_breakthrough.png';
import repairImg from '../assets/sec_quote_strenght_img.png';


// Helper to get category ID from drug name for intake questions
const getMedicationCategoryId = (drugName) => {
    const drug = (drugName || '').toLowerCase();
    if (drug.includes('semaglutide') || drug.includes('tirzepatide') || drug.includes('weight') || drug.includes('retatrutide')) return 'weight-loss';
    if (drug.includes('hair') || drug.includes('finasteride') || drug.includes('minoxidil')) return 'hair-restoration';
    if (drug.includes('sexual') || drug.includes('sildenafil') || drug.includes('tadalafil')) return 'sexual-health';
    if (drug.includes('nad') || drug.includes('longevity')) return 'longevity';
    if (drug.includes('testosterone')) return 'testosterone';
    if (drug.includes('skin')) return 'skin-care';
    if (drug.includes('repair') || drug.includes('healing') || drug.includes('strength')) return 'repair-healing';
    return drugName; // Fallback
};

const getMedicationCategory = (drugName) => {
    const drug = (drugName || '').toLowerCase();

    // Weight Loss
    if (drug.includes('semaglutide') || drug.includes('tirzepatide') || drug.includes('weight')) {
        return 'Weight Loss';
    }

    // Sexual Health
    if (drug.includes('sildenafil') || drug.includes('tadalafil') || drug.includes('oxytocin') ||
        drug.includes('pt-141') || drug.includes('sexual') || drug.includes('yohimbe') ||
        drug.includes('scream') || drug.includes('cream')) {
        return 'Sexual Health';
    }

    // Hair Restoration
    if (drug.includes('finasteride') || drug.includes('minoxidil') || drug.includes('hair') ||
        drug.includes('dutasteride') || drug.includes('spironolactone') || drug.includes('latanoprost') ||
        drug.includes('tretinoin')) {
        return 'Hair Restoration';
    }

    // Longevity
    if (drug.includes('nad') || drug.includes('glutathione') || drug.includes('sermorelin') ||
        drug.includes('longevity') || drug.includes('lipo') || drug.includes('b12') ||
        drug.includes('methylcobalamin') || drug.includes('glycine')) {
        return 'Longevity';
    }

    return 'Other';
};


const DosageChangePaymentForm = ({ onComplete, amount = 500 }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [error, setError] = useState(null);
    const [processing, setProcessing] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!stripe || !elements) return;

        setProcessing(true);
        setError(null);

        try {
            const { error: submitError } = await elements.submit();
            if (submitError) {
                setError(submitError.message);
                setProcessing(false);
                return;
            }

            const { paymentIntent, error: confirmError } = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    return_url: `${window.location.origin}/dashboard`
                },
                redirect: 'if_required'
            });

            if (confirmError) {
                setError(confirmError.message);
            } else if (paymentIntent && paymentIntent.status === 'succeeded') {
                onComplete();
            }
        } catch (err) {
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white/5 border border-white/10 p-5 rounded-xl">
                <PaymentElement options={{ theme: 'night' }} />
            </div>
            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[10px] font-black uppercase tracking-widest text-center">
                    {error}
                </div>
            )}
            <button
                type="submit"
                disabled={!stripe || processing}
                className="w-full py-5 bg-[#FFDE59] text-black rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-[#111111] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
            >
                {processing ? (
                    <>
                        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                        Processing Securely...
                    </>
                ) : `Pay $${(amount / 100).toFixed(2)} & Submit Change`}
            </button>
        </form>
    );
};

const MedicationActionModal = ({ isOpen, type, medication, onClose, onSubmit, loading }) => {
    const [value, setValue] = useState('');
    const [reason, setReason] = useState('');
    const [step, setStep] = useState(1); // 1: Details, 2: Payment
    const [clientSecret, setClientSecret] = useState(null);
    const [preparingPayment, setPreparingPayment] = useState(false);

    // Reset state when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setClientSecret(null);
            setValue('');
            setReason('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const dosageOptions = ['0.25mg', '0.5mg', '1.0mg', '1.7mg', '2.4mg'];
    const medicationOptions = ['Semaglutide', 'Tirzepatide', 'Liraglutide', 'Retatruide'];

    const handleProceed = async (e) => {
        e.preventDefault();

        // For Cancellation or Activation
        if (type === 'cancel' || type === 'activate') {
            onSubmit();
            return;
        }

        // Only require payment for Dosage Changes
        if (type === 'dosage') {
            setPreparingPayment(true);
            try {
                // Create Payment Intent
                const { data, error } = await supabase.functions.invoke('create-payment-intent', {
                    body: {
                        amount: 500, // $5.00
                        type: 'dosage_change',
                        categoryId: medication.selected_drug,
                        metadata: {
                            medication_id: medication.id,
                            new_dosage: value
                        }
                    }
                });

                if (error || !data?.clientSecret) {
                    throw new Error(error?.message || 'Failed to initialize payment');
                }

                setClientSecret(data.clientSecret);
                setStep(2);
            } catch (err) {
                console.error('Payment init error:', err);
                alert('Could not initialize secure payment. Please try again.');
            } finally {
                setPreparingPayment(false);
            }
        } else {
            // For other types (e.g. medication change), possibly skip payment or use different logic
            // For now, assume direct submit
            onSubmit(value, reason);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
            <div className="absolute inset-0 bg-[#111111]/95 backdrop-blur-xl" onClick={onClose}></div>
            <div className="relative w-full max-w-xl bg-[#0A0A0A] border border-white/10 rounded-[32px] md:rounded-[40px] shadow-2xl dashboard-card flex flex-col max-h-[90vh] overflow-hidden">
                <div className="p-8 border-b border-white/10 flex items-center justify-between bg-[#080808]">
                    <div>
                        <h3 className="text-2xl font-black uppercase tracking-tighter  mb-1">
                            {type === 'cancel' ? 'Cancel' : type === 'activate' ? 'Reactivate' : (step === 1 ? 'Request' : 'Secure Payment')} <span className={type === 'cancel' ? 'text-red-500' : 'text-white'}>
                                {type === 'dosage' ? 'Dosage Adjustment' : (type === 'cancel' || type === 'activate') ? 'Subscription' : 'Medication Change'}
                            </span>
                        </h3>
                        <p className="text-[10px] text-white/50 font-black uppercase tracking-widest">
                            {type === 'cancel' ? `Discontinuing your ${medication?.selected_drug} protocol` :
                                type === 'activate' ? `Resuming your ${medication?.selected_drug} protocol` :
                                    (step === 1 ? medication?.selected_drug : `Confirming changes for ${medication?.selected_drug}`)}
                        </p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/5 transition-all text-white/50 hover:text-white">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-8 overflow-y-auto">
                    {type === 'cancel' || type === 'activate' ? (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className={`${type === 'cancel' ? 'bg-red-500/10 border-red-500/20' : 'bg-white/5 border-white/20'} border rounded-3xl p-8 text-center`}>
                                <div className={`w-16 h-16 rounded-full ${type === 'cancel' ? 'bg-red-500/10 border-red-500/20' : 'bg-white/5 border-white/20'} flex items-center justify-center border mx-auto mb-6`}>
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={type === 'cancel' ? 'text-red-500' : 'text-white'}>
                                        {type === 'cancel' ? (
                                            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.33 1.732-2.66L13.732 4c-.77-1.33-2.694-1.33-3.464 0L3.34 16.34c-.77 1.33.192 2.66 1.732 2.66z" />
                                        ) : (
                                            <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        )}
                                    </svg>
                                </div>
                                <h4 className="text-xl font-black uppercase tracking-tighter  mb-4">{type === 'cancel' ? 'Are you sure?' : 'Welcome Back'}</h4>
                                <p className="text-xs text-white/60 leading-relaxed font-bold uppercase tracking-wider mx-auto max-w-sm">
                                    {type === 'cancel'
                                        ? "Cancelling will pause your automatic renewals and medication deliveries. You will still have access to the protocol until the end of your current billing cycle."
                                        : "Activating your subscription will resume your protocol and schedule your next delivery. You will be charged the monthly protocol fee immediately."}
                                </p>
                            </div>
                            <div className="space-y-4 pt-4">
                                <button
                                    onClick={handleProceed}
                                    disabled={loading}
                                    className={`w-full py-6 ${type === 'cancel' ? 'bg-red-500 hover:bg-red-600' : 'bg-[#FFDE59] hover:bg-[#111111]'} text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all transform hover:scale-[1.02] flex items-center justify-center gap-3 shadow-lg`}
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            {type === 'cancel' ? 'Processing Cancellation...' : 'Reactivating...'}
                                        </>
                                    ) : (
                                        type === 'cancel' ? 'Confirm Cancellation' : 'Confirm Reactivation'
                                    )}
                                </button>
                                <button
                                    onClick={onClose}
                                    className="w-full py-4 bg-white/5 border border-white/10 text-white/60 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:text-white transition-all"
                                >
                                    {type === 'cancel' ? 'Keep My Subscription' : 'Not Now, Maybe Later'}
                                </button>
                            </div>
                        </div>
                    ) : step === 1 ? (
                        <form onSubmit={handleProceed} className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-white/50 mb-4 ml-2">
                                    {type === 'dosage' ? 'Select New Dosage' : 'Select Replacement Medication'}
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    {(type === 'dosage' ? dosageOptions : medicationOptions).map((opt) => (
                                        <button
                                            key={opt}
                                            type="button"
                                            onClick={() => setValue(opt)}
                                            className={`py-4 rounded-2xl font-bold text-xs transition-all border ${value === opt
                                                ? 'bg-[#FFDE59] text-black border-accent-blue'
                                                : 'bg-white/5 text-white/60 border-white/10 hover:border-white/20'
                                                }`}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-white/50 mb-4 ml-2">
                                    Reason for change
                                </label>
                                <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    required
                                    placeholder="Please describe why you'd like to make this change..."
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-white text-sm focus:outline-none focus:border-[#FFDE59] transition-all min-h-[120px] resize-none font-medium"
                                />
                            </div>

                            {type === 'dosage' && (
                                <div className="bg-white/5 border border-white/20 rounded-2xl p-5">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-white">Dosage Change Fee</span>
                                        <span className="text-lg font-black text-white">$5.00</span>
                                    </div>
                                    <p className="text-[10px] text-white/50 leading-relaxed font-medium">
                                        Covering the clinical review and updated prescription processing.
                                    </p>
                                </div>
                            )}



                            <button
                                type="submit"
                                disabled={!value || !reason || preparingPayment}
                                className="w-full py-6 bg-[#111111] text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-[#FFDE59] hover:text-black transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                            >
                                {preparingPayment ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                                        Preparing Secure Checkout...
                                    </>
                                ) : (
                                    type === 'dosage' ? 'Proceed to Payment ($5.00)' : 'Submit Request'
                                )}
                            </button>
                        </form>
                    ) : (
                        <div className="space-y-6">
                            {clientSecret && (
                                <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'night', variables: { colorPrimary: '#bfff00', colorBackground: 'transparent' } } }}>
                                    <DosageChangePaymentForm
                                        onComplete={() => onSubmit(value, reason)}
                                        amount={500}
                                    />
                                </Elements>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


const SettingsView = ({ profile, user, onUpdate, setLastOptimisticUpdate }) => {
    const { updateUser } = useAuth();
    const [form, setForm] = React.useState({
        first_name: profile?.first_name || '',
        last_name: profile?.last_name || '',
        phone: profile?.phone || user?.phone || '',
        date_of_birth: profile?.date_of_birth || '',
    });
    const [pwForm, setPwForm] = React.useState({ current: '', newPw: '', confirm: '' });
    const [saving, setSaving] = React.useState(false);
    const [pwSaving, setPwSaving] = React.useState(false);
    const [msg, setMsg] = React.useState(null);
    const [pwMsg, setPwMsg] = React.useState(null);

    const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMsg(null);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    first_name: form.first_name,
                    last_name: form.last_name,
                    phone: form.phone,
                    date_of_birth: form.date_of_birth,
                })
                .eq('id', user.id);
            if (error) throw error;

            if (setLastOptimisticUpdate) setLastOptimisticUpdate(Date.now());
            setMsg({ type: 'success', text: 'Profile updated successfully.' });
            if (onUpdate) onUpdate();
        } catch (err) {
            setMsg({ type: 'error', text: err.message });
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (pwForm.newPw !== pwForm.confirm) {
            setPwMsg({ type: 'error', text: 'New passwords do not match.' });
            return;
        }
        setPwSaving(true);
        setPwMsg(null);
        try {
            const { error } = await updateUser({ password: pwForm.newPw });
            if (error) throw error;
            setPwMsg({ type: 'success', text: 'Password updated successfully.' });
            setPwForm({ current: '', newPw: '', confirm: '' });
        } catch (err) {
            setPwMsg({ type: 'error', text: err.message });
        } finally {
            setPwSaving(false);
        }
    };

    const inputStyle = {
        width: '100%', boxSizing: 'border-box',
        backgroundColor: 'rgba(255,255,255,0.05)',
        border: '1.5px solid rgba(255,255,255,0.1)',
        borderRadius: '14px', padding: '14px 18px',
        fontSize: '14px', color: '#fff', outline: 'none',
        transition: 'border-color 0.2s', fontFamily: 'inherit'
    };
    const labelStyle = {
        display: 'block', fontSize: '9px', fontWeight: '900',
        textTransform: 'uppercase', letterSpacing: '0.3em',
        color: 'rgba(255,255,255,0.4)', marginBottom: '8px'
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div>
                <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter  mb-2">
                    Account <span style={{ backgroundColor: '#FFDE59', color: '#000', padding: '0 8px' }}>Settings</span>
                </h2>
                <p className="text-xs text-white/40 font-bold uppercase tracking-widest">Manage your personal information and preferences</p>
            </div>

            {/* Personal Info */}
            <form onSubmit={handleSave}>
                <div className="dashboard-card bg-white/5 border border-white/10 rounded-[32px] p-8 space-y-8">
                    <h3 className="text-lg font-black uppercase tracking-tight text-white/80 border-b border-white/10 pb-4">Personal Information</h3>

                    {msg && (
                        <div style={{
                            padding: '12px 18px', borderRadius: '12px', fontSize: '12px', fontWeight: '700',
                            backgroundColor: msg.type === 'success' ? 'rgba(255,222,89,0.1)' : 'rgba(239,68,68,0.1)',
                            border: `1px solid ${msg.type === 'success' ? 'rgba(255,222,89,0.3)' : 'rgba(239,68,68,0.3)'}`,
                            color: msg.type === 'success' ? '#FFDE59' : '#f87171'
                        }}>
                            {msg.text}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[
                            { label: 'First Name', name: 'first_name', type: 'text', placeholder: 'John' },
                            { label: 'Last Name', name: 'last_name', type: 'text', placeholder: 'Doe' },
                            { label: 'Phone Number', name: 'phone', type: 'tel', placeholder: '+1 (555) 000-0000' },
                            { label: 'Date of Birth', name: 'date_of_birth', type: 'date', placeholder: '' },
                        ].map(field => (
                            <div key={field.name}>
                                <label style={labelStyle}>{field.label}</label>
                                <input
                                    type={field.type}
                                    name={field.name}
                                    value={form[field.name]}
                                    onChange={handleChange}
                                    placeholder={field.placeholder}
                                    style={inputStyle}
                                    onFocus={e => e.target.style.borderColor = '#FFDE59'}
                                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                                />
                            </div>
                        ))}
                    </div>

                    <div>
                        <label style={labelStyle}>Email Address</label>
                        <input
                            type="email"
                            value={user?.email || ''}
                            disabled
                            style={{ ...inputStyle, opacity: 0.4, cursor: 'not-allowed' }}
                        />
                        <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '6px', fontWeight: '700', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                            Contact support to change your email address
                        </p>
                    </div>



                    <button
                        type="submit"
                        disabled={saving}
                        style={{
                            padding: '16px 40px', borderRadius: '999px',
                            backgroundColor: '#FFDE59', color: '#000',
                            border: 'none', fontSize: '11px', fontWeight: '900',
                            textTransform: 'uppercase', letterSpacing: '0.3em',
                            cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
                            transition: 'opacity 0.2s', fontFamily: 'inherit'
                        }}
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>

            {/* Password Change */}
            <form onSubmit={handlePasswordChange}>
                <div className="dashboard-card bg-white/5 border border-white/10 rounded-[32px] p-8 space-y-6">
                    <h3 className="text-lg font-black uppercase tracking-tight text-white/80 border-b border-white/10 pb-4">Change Password</h3>

                    {pwMsg && (
                        <div style={{
                            padding: '12px 18px', borderRadius: '12px', fontSize: '12px', fontWeight: '700',
                            backgroundColor: pwMsg.type === 'success' ? 'rgba(255,222,89,0.1)' : 'rgba(239,68,68,0.1)',
                            border: `1px solid ${pwMsg.type === 'success' ? 'rgba(255,222,89,0.3)' : 'rgba(239,68,68,0.3)'}`,
                            color: pwMsg.type === 'success' ? '#FFDE59' : '#f87171'
                        }}>
                            {pwMsg.text}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label style={labelStyle}>New Password</label>
                            <input type="password" value={pwForm.newPw}
                                onChange={e => setPwForm(f => ({ ...f, newPw: e.target.value }))}
                                placeholder="Min 8 characters" style={inputStyle} required minLength={8}
                                onFocus={e => e.target.style.borderColor = '#FFDE59'}
                                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                        </div>
                        <div>
                            <label style={labelStyle}>Confirm New Password</label>
                            <input type="password" value={pwForm.confirm}
                                onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                                placeholder="Repeat new password" style={inputStyle} required minLength={8}
                                onFocus={e => e.target.style.borderColor = '#FFDE59'}
                                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={pwSaving}
                        style={{
                            padding: '16px 40px', borderRadius: '999px',
                            backgroundColor: 'transparent', color: '#FFDE59',
                            border: '1.5px solid rgba(255,222,89,0.4)',
                            fontSize: '11px', fontWeight: '900',
                            textTransform: 'uppercase', letterSpacing: '0.3em',
                            cursor: pwSaving ? 'not-allowed' : 'pointer', opacity: pwSaving ? 0.7 : 1,
                            transition: 'all 0.2s', fontFamily: 'inherit'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#FFDE59'; e.currentTarget.style.color = '#000'; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#FFDE59'; }}
                    >
                        {pwSaving ? 'Updating...' : 'Update Password'}
                    </button>
                </div>
            </form>
        </div>
    );
};

const MedicationCard = ({ submission, isSubscriptionActive = true, onAction, onRetake }) => {

    // Determine if user can manage subscription (must be approved by provider)
    const isApproved = submission.approval_status === 'approved';

    return (
        <div className="bg-[#111111] border border-white/10 rounded-[32px] p-8 hover:border-white/20 transition-all font-sans relative overflow-hidden group mb-6 dashboard-card">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#FFDE59]/5 blur-[100px] -mr-32 -mt-32 rounded-full transition-opacity opacity-0 group-hover:opacity-100"></div>

            <div className="flex flex-col md:flex-row justify-between items-start gap-8 relative z-10">
                <div className="flex flex-col md:flex-row items-start gap-6">
                    <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center border border-white/20 group-hover:border-white/20 transition-all">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white">
                            <path d="M10.5 21l-7.5-7.5 3.5-3.5 7.5 7.5-3.5 3.5z" />
                            <path d="M14.5 7L21 13.5l-3.5 3.5L11 10.5 14.5 7z" />
                            <path d="M12 12l2.5-2.5" strokeLinecap="round" />
                        </svg>
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <h3 className="text-2xl font-black uppercase tracking-tighter  text-white">
                                {(() => {
                                    const drug = submission.selected_drug || submission.dosage_preference || '';
                                    return getMedicationCategory(drug) || drug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'Active Protocol';
                                })()}
                            </h3>
                            <div className="flex gap-2">
                                {/* Subscription Status Badge - based on billing state */}
                                {isSubscriptionActive ? (
                                    <span className="px-3 py-1 bg-white/5 border border-white/20 text-white text-[9px] font-black uppercase tracking-widest rounded-full">
                                        Active
                                    </span>
                                ) : (
                                    <span className="px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-500 text-[9px] font-black uppercase tracking-widest rounded-full">
                                        Inactive
                                    </span>
                                )}
                                {/* Approval Status Badge - based on provider decision */}
                                <span className={`px-3 py-1 border text-[9px] font-black uppercase tracking-widest rounded-full ${submission.approval_status === 'approved' ? 'bg-white/5 border-white/10 text-white/50' :
                                    submission.approval_status === 'pending' ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' :
                                        'bg-red-500/10 border-red-500/20 text-red-500'
                                    }`}>
                                    {submission.approval_status}
                                </span>
                            </div>
                        </div>
                        <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-6">
                            Submitted on {new Date(submission.submitted_at).toLocaleDateString()}
                        </p>

                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-1">Current Medication</p>
                                <p className="text-sm font-bold text-white  capitalize">
                                    {submission.dosage_preference || submission.selected_drug || 'Standard Protocol'}
                                </p>
                            </div>

                            <div className="hidden lg:block">
                                <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-1">Next Delivery</p>
                                <p className="text-sm font-bold text-white ">Feb 14, 2026</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-3 w-full md:w-auto self-center">
                    {isApproved ? (
                        isSubscriptionActive ? (
                            <>
                                <button
                                    onClick={() => onAction('dosage', submission)}
                                    className="w-full md:w-56 px-8 py-4 bg-[#FFDE59] text-black rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-[#111111] transition-all transform hover:scale-[1.02]"
                                >
                                    Adjust Dosage
                                </button>
                                <button
                                    onClick={() => onAction('medication', submission)}
                                    className="w-full md:w-56 px-8 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white/5 transition-all"
                                >
                                    Change Medication
                                </button>
                                <button
                                    onClick={() => onAction('cancel', submission)}
                                    className="w-full md:w-56 px-8 py-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-red-500 hover:text-white transition-all"
                                >
                                    Cancel Subscription
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => onAction('activate', submission)}
                                className="w-full md:w-56 px-8 py-4 bg-[#FFDE59] text-black rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-[#111111] transition-all transform hover:scale-[1.02] "
                            >
                                Activate Subscription
                            </button>
                        )
                    ) : (
                        <div className="w-full md:w-56 px-8 py-4 bg-white/5 border border-white/10 text-white/50 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] text-center">
                            Awaiting Approval
                        </div>
                    )}
                    <button
                        onClick={() => onRetake && onRetake(submission)}
                        className="w-full md:w-56 px-8 py-4 bg-white/5 border border-white/10 text-white/30 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white/5 hover:text-white/50 transition-all opacity-50 hover:opacity-100"
                    >
                        Retake Assessment
                    </button>
                </div>
            </div>
        </div>
    );
};


const OrdersView = ({ orders }) => {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div>
                <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter  mb-2">Order <span className="text-white">History</span></h2>
                <p className="text-xs text-white/50 font-bold uppercase tracking-widest">Track your clinical shipments and deliveries</p>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {orders.length === 0 ? (
                    <div className="bg-[#111111] border border-dashed border-white/20 rounded-[40px] p-20 text-center">
                        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/30">
                                <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                        </div>
                        <p className="text-white/50 font-black uppercase tracking-widest text-xs">No active orders found</p>
                        <p className="text-[10px] text-white/30 mt-2 uppercase tracking-[0.2em]">Orders appear here once your assessment is approved and processed</p>
                    </div>
                ) : (
                    orders.map(order => (
                        <div key={order.id} className="bg-[#111111] border border-white/10 rounded-[40px] p-8 md:p-10 hover:border-[#FFDE59]/50 transition-all group relative overflow-hidden">
                            {/* Decorative Background Element */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-[#FFDE59]/5 blur-3xl -mr-32 -mt-32 transition-opacity group-hover:opacity-20 opacity-0"></div>

                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                                <div className="flex flex-col md:flex-row items-start gap-6">
                                    <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-white/30 group-hover:text-white group-hover:bg-white/5 transition-all flex-shrink-0">
                                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <p className={`text-[10px] font-black uppercase tracking-[0.3em] px-3 py-1 rounded-full ${order.delivery_status === 'delivered' ? 'bg-white/5 text-white' :
                                                order.delivery_status === 'cancelled' ? 'bg-red-500/10 text-red-500' :
                                                    'bg-blue-500/10 text-blue-400'
                                                }`}>{order.delivery_status}</p>
                                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">ORD-{order.id.slice(0, 8).toUpperCase()}</span>
                                        </div>
                                        <h3 className="text-xl font-black uppercase  tracking-tighter mb-1">{order.drug_name}</h3>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-white/50">Ordered on {new Date(order.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>

                                <div className="flex flex-col md:items-end gap-6">
                                    <div className="text-right">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-2">Tracking ID</p>
                                        <p className="text-sm font-bold text-white tracking-widest">{order.tracking_id || 'Pending Generate'}</p>
                                    </div>
                                    {order.tracking_url ? (
                                        <a
                                            href={order.tracking_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-3 px-8 py-4 bg-[#111111] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#FFDE59] hover:text-black transition-all shadow-[0_0_40px_rgba(255,255,255,0.05)]"
                                        >
                                            Track Package
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                <path d="M5 12h14M12 5l7 7-7 7" />
                                            </svg>
                                        </a>
                                    ) : (
                                        <div className="px-8 py-4 bg-white/5 border border-white/10 text-white/30 rounded-2xl font-black text-[10px] uppercase tracking-widest cursor-not-allowed">
                                            Processing...
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

const UpdatePaymentForm = ({ onCancel, onComplete, profile, user }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!stripe || !elements) return;

        setLoading(true);
        setError(null);

        try {
            const { error: submitError } = await elements.submit();
            if (submitError) {
                setError(submitError.message);
                setLoading(false);
                return;
            }

            // 1. Fetch Client Secret
            const { data, error: intentError } = await supabase.functions.invoke('create-setup-intent', {
                method: 'POST',
                headers: {
                    'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
                }
            });

            if (intentError || !data?.clientSecret) {
                throw new Error(data?.error || intentError?.message || 'Failed to initialize security vault.');
            }

            // 2. Confirm Setup
            const { setupIntent, error: confirmError } = await stripe.confirmSetup({
                elements,
                clientSecret: data.clientSecret,
                confirmParams: {
                    return_url: `${window.location.origin}/dashboard?payment=updated`,
                },
                redirect: 'if_required'
            });

            if (confirmError) {
                setError(confirmError.message);
            } else {
                // 3. Update profile with payment method ID
                const pmId = typeof setupIntent.payment_method === 'string'
                    ? setupIntent.payment_method
                    : setupIntent.payment_method?.id;

                if (setupIntent && pmId) {
                    console.log('Captured setup payment method:', pmId);

                    // Call the new update-payment-method edge function
                    const { data: updateData, error: updateError } = await supabase.functions.invoke('update-payment-method', {
                        method: 'POST',
                        body: {
                            stripe_customer_id: profile?.stripe_customer_id,
                            stripe_payment_method_id: pmId,
                            stripe_subscription_id: profile?.stripe_subscription_id,
                            user_id: user?.id,
                            payment_type: null,
                            card_number: null
                        },
                        headers: {
                            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
                        }
                    });

                    if (updateError) {
                        console.error('Edge function update failed:', updateError.message);
                        throw new Error(updateData?.error || updateError.message || 'Failed to sync payment information.');
                    }

                    // Optional: Still update local profile as backup if function doesn't do it
                    if (user) {
                        const { error: profileError } = await supabase
                            .from('profiles')
                            .update({ stripe_payment_method_id: pmId })
                            .eq('id', user.id);

                        if (profileError) {
                            console.error('Local profile update failed:', profileError.message);
                        }
                    }
                }

                onComplete();
            }
        } catch (err) {
            console.error('Setup error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white/5 border border-white/10 p-6 rounded-[24px] focus-within:border-[#FFDE59] transition-all">
                <PaymentElement
                    options={{
                        layout: 'tabs',
                        theme: 'night',
                        variables: {
                            colorPrimary: '#bfff00',
                            colorBackground: 'transparent',
                            colorText: '#ffffff',
                            colorDanger: '#df1b41',
                            fontFamily: 'Outfit, sans-serif',
                            spacingUnit: '4px',
                            borderRadius: '16px',
                        },
                        rules: {
                            '.Input': {
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                            },
                        }
                    }}
                />
            </div>

            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-[10px] font-black uppercase tracking-widest text-center ">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="py-6 border border-white/10 rounded-[24px] font-black text-[10px] uppercase tracking-[0.3em] hover:bg-white/5 transition-all"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={!stripe || loading}
                    className="py-6 bg-[#111111] text-white rounded-[24px] font-black text-[10px] uppercase tracking-[0.3em] hover:bg-[#FFDE59] hover:text-black transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] relative overflow-hidden group"
                >
                    <span className="relative z-10">{loading ? 'Processing...' : 'Confirm Update'}</span>
                    <div className="absolute inset-0 bg-[#FFDE59] translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                </button>
            </div>
        </form>
    );
};

const BillingView = ({ profile, user }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [billingHistory, setBillingHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [paymentMethod, setPaymentMethod] = useState({
        brand: profile?.card_name || 'Visa',
        last4: profile?.last_four_digits_of_card || '4242',
        expiry: '12/26'
    });

    const handleRemoveCard = async () => {
        if (!window.confirm('Are you sure you want to remove your primary payment method?')) return;

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    card_name: null,
                    last_four_digits_of_card: null
                })
                .eq('id', user.id);

            if (error) throw error;

            setPaymentMethod({ brand: 'None', last4: '••••', expiry: '--/--' });
            toast.success('Payment method removed successfully');
        } catch (err) {
            console.error('Error removing card:', err);
            toast.error('Could not remove payment method');
        }
    };

    useEffect(() => {
        const fetchBillingHistory = async () => {
            if (!user) return;
            try {
                const { data, error } = await supabase
                    .from('billing_history')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setBillingHistory(data || []);
            } catch (err) {
                console.error('Error fetching billing history:', err);
            } finally {
                setLoadingHistory(false);
            }
        };

        fetchBillingHistory();
    }, [user]);

    // Format the plan name (handles JSON format like {"weight_loss":"Semaglutide Injection"})
    const formatPlanName = (plan) => {
        if (!plan || plan === 'None' || plan === '{ }') return 'Monthly Maintenance';

        // If it's already an object (not a string)
        if (typeof plan === 'object' && plan !== null) {
            const plans = Object.values(plan);
            return plans.length > 0 ? plans.join(' + ') : 'Monthly Maintenance';
        }

        try {
            const parsed = JSON.parse(plan);
            if (typeof parsed === 'object' && parsed !== null) {
                const plans = Object.values(parsed);
                return plans.length > 0 ? plans.join(' + ') : 'Monthly Maintenance';
            }
            return String(parsed);
        } catch {
            // If not JSON string, return as is (if it's a string)
            return typeof plan === 'string' ? plan : 'Protocol Plan';
        }
    };

    const stripeOptions = {
        mode: 'setup',
        currency: 'usd',
        appearance: {
            theme: 'night',
            variables: {
                colorPrimary: '#bfff00',
                colorBackground: '#0A0A0A',
                colorText: '#ffffff',
                colorDanger: '#df1b41',
                fontFamily: 'Outfit, sans-serif',
                borderRadius: '24px',
            },
        },
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter  mb-2">Financial <span className="text-white">Portal</span></h2>
                    <p className="text-xs text-white/50 font-bold uppercase tracking-widest">Manage your payment methods and history</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
                {/* Active Payment Method */}
                <div className="bg-white/5 border border-white/10 rounded-[40px] p-8 md:p-12 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 md:p-12">
                        <div className="w-16 h-16 rounded-3xl bg-[#FFDE59]/5 flex items-center justify-center border border-accent-blue/10">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white opacity-40">
                                <path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                        </div>
                    </div>

                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/50 mb-16">Primary Payment Method</h3>

                    <div className="space-y-12">
                        <div className="flex items-center gap-8">
                            <div className="w-24 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center font-black  text-sm tracking-tighter">
                                {paymentMethod.brand.toUpperCase()}
                            </div>
                            <div>
                                <p className="text-2xl font-black tracking-tight mb-1">•••• •••• •••• {paymentMethod.last4}</p>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Card expires on {paymentMethod.expiry}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setIsEditing(true)}
                                className="px-8 py-4 bg-[#111111] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#FFDE59] hover:text-black transition-all shadow-[0_0_40px_rgba(255,255,255,0.05)]"
                            >
                                Update Method
                            </button>
                            <button
                                onClick={handleRemoveCard}
                                className="px-8 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:border-red-500/50 hover:text-red-400 transition-all font-brand"
                            >
                                Remove Card
                            </button>
                        </div>
                    </div>
                </div>


            </div>

            {/* Invoices */}
            <div className="mt-12">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/50">Statement History</h3>
                </div>
                <div className="grid grid-cols-1 gap-4">
                    {loadingHistory ? (
                        <div className="text-center py-12">
                            <div className="w-8 h-8 border-2 border-[#FFDE59] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">Loading statements...</p>
                        </div>
                    ) : billingHistory.length === 0 ? (
                        <div className="text-center py-12 border border-dashed border-white/10 rounded-3xl">
                            <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">No transaction records found</p>
                        </div>
                    ) : (
                        billingHistory.map(inv => (
                            <div key={inv?.id || Math.random()} className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-white/10 transition-all group">
                                <div className="flex items-center gap-6">
                                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/30 group-hover:bg-[#FFDE59]/20 group-hover:text-white transition-all">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-xs font-black uppercase  tracking-tight mb-1">{inv?.description || inv?.plan_name || 'Protocol Verification'}</p>
                                        <div className="flex items-center gap-3">
                                            <p className="text-[9px] text-white/30 font-black uppercase tracking-widest">{inv?.id ? String(inv.id).slice(0, 8).toUpperCase() : 'INV-TRX'}</p>
                                            <span className="w-1 h-1 bg-white/5 rounded-full"></span>
                                            <p className="text-[9px] text-white/30 font-black uppercase tracking-widest">{inv?.created_at ? new Date(inv.created_at).toLocaleDateString() : 'Recent'}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between md:text-right gap-8">
                                    <div>
                                        <p className="text-sm font-black mb-1">${Number(inv?.amount || 0).toFixed(2)}</p>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-white flex items-center gap-1.5 md:justify-end">
                                            <span className="w-1 h-1 bg-[#FFDE59] rounded-full"></span>
                                            {inv?.status || 'Paid'}
                                        </p>
                                    </div>
                                    <button className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 hover:bg-[#111111] hover:text-white transition-all">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <path d="M12 5v14m0 0l-7-7m7 7l7-7" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Update Modal */}
            {isEditing && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-6">
                    <div className="absolute inset-0 bg-[#111111]/95 backdrop-blur-3xl" onClick={() => setIsEditing(false)}></div>
                    <div className="relative w-full max-w-xl max-h-[90vh] bg-[#0A0A0A] border border-white/10 rounded-[32px] md:rounded-[48px] shadow-2xl dashboard-card flex flex-col overflow-hidden">
                        <div className="overflow-y-auto p-8 md:p-12 no-scrollbar">
                            <div className="text-center mb-10 md:mb-16">
                                <h3 className="text-3xl font-black uppercase tracking-tighter  mb-4">Secure <span className="text-white">Vault</span></h3>
                                <p className="text-[10px] text-white/50 font-black uppercase tracking-[0.2em] leading-relaxed max-w-xs mx-auto">Update your primary clinical protocol payment method</p>
                            </div>

                            <Elements stripe={stripePromise} options={stripeOptions}>
                                <UpdatePaymentForm
                                    onCancel={() => setIsEditing(false)}
                                    profile={profile}
                                    user={user}
                                    onComplete={() => {
                                        setIsEditing(false);
                                        window.location.reload(); // Refresh to show new card if needed or just alert
                                    }}
                                />
                            </Elements>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const ReferralView = ({ profile, user, onUpdate }) => {
    const [generating, setGenerating] = useState(false);
    const referralLink = profile?.referral_code
        ? `https://quiz.americahealthsolutions.com/?ref=${profile.referral_code}`
        : null;

    const generateReferral = async () => {
        setGenerating(true);
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ referral_code: code })
                .eq('id', user.id);

            if (error) {
                console.error('Update failed. Check if referral_code column exists in profiles table.');
                // Fallback for demo if column doesn't exist
                if (onUpdate) onUpdate();
            } else {
                if (onUpdate) onUpdate();
            }
        } catch (err) {
            console.error('Error generating referral:', err);
        } finally {
            setGenerating(false);
        }
    };

    const copyToClipboard = () => {
        if (!referralLink) return;
        navigator.clipboard.writeText(referralLink);
        alert('Referral link copied to clipboard!');
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter  mb-2">Referral <span className="text-white">Programme</span></h2>
                    <p className="text-xs text-white/50 font-bold uppercase tracking-widest">Give $25, Get $25 – Share your journey</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-[40px] p-8 md:p-12 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 md:p-12 text-white opacity-20 group-hover:opacity-40 transition-opacity">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 00-3-3.87" />
                            <path d="M16 3.13a4 4 0 010 7.75" />
                        </svg>
                    </div>

                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/50 mb-12">Your Exclusive Invite</h3>

                    {!referralLink ? (
                        <div className="py-12 border-2 border-dashed border-white/10 rounded-3xl text-center">
                            <h4 className="text-xl font-bold mb-4  tracking-tight uppercase">Ready to start referring?</h4>
                            <p className="text-xs text-white/50 mb-8 max-w-sm mx-auto uppercase tracking-widest font-bold">Generate your unique link below and start earning credits for every successful transformation.</p>
                            <button
                                onClick={generateReferral}
                                disabled={generating}
                                className="px-10 py-5 bg-[#FFDE59] text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#111111] transition-all shadow-[0_0_50px_rgba(191,255,0,0.2)]"
                            >
                                {generating ? 'Generating...' : 'Generate My Link →'}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-12">
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-4">Your Unique Link</p>
                                <div className="flex flex-col md:flex-row gap-4">
                                    <div className="flex-1 bg-black p-5 rounded-2xl border border-white/10 font-mono text-xs text-white truncate">
                                        {referralLink}
                                    </div>
                                    <button
                                        onClick={copyToClipboard}
                                        className="px-8 py-5 bg-[#111111] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#FFDE59] hover:text-black transition-all whitespace-nowrap"
                                    >
                                        Copy Link
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-6 pt-12 border-t border-white/10">
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-2">Total Referrals</p>
                                    <p className="text-2xl font-black ">0</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-2">Credits Earned</p>
                                    <p className="text-2xl font-black  text-white">$0</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-2">Pending</p>
                                    <p className="text-2xl font-black ">0</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="bg-white/5 border border-white/10 rounded-[40px] p-8">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/50 mb-8">How it works</h3>
                        <div className="space-y-8">
                            <div className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-[#FFDE59]/30 flex-shrink-0 flex items-center justify-center text-[10px] font-black text-white border border-[#FFDE59]/40">01</div>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-tight mb-1 ">Share Your Link</p>
                                    <p className="text-[10px] text-white/50 leading-relaxed font-bold uppercase tracking-widest">Invite friends to start their journey with uGlowMD.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-[#FFDE59]/30 flex-shrink-0 flex items-center justify-center text-[10px] font-black text-white border border-[#FFDE59]/40">02</div>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-tight mb-1 ">They Get $25 Off</p>
                                    <p className="text-[10px] text-white/50 leading-relaxed font-bold uppercase tracking-widest">Friends receive $25 off their first medical assessment.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-[#FFDE59]/30 flex-shrink-0 flex items-center justify-center text-[10px] font-black text-white border border-[#FFDE59]/40">03</div>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-tight mb-1 ">You Earn $25 Credit</p>
                                    <p className="text-[10px] text-white/50 leading-relaxed font-bold uppercase tracking-widest">Get $25 credit once their first assessment is processed.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


const SubmissionCard = ({ submission, setSelectedAssessment, navigate, onPrescriptionClick }) => {
    const statusConfig = {
        pending: {
            color: 'orange',
            label: 'Under Review',
            icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
        },
        approved: {
            color: '[#FFDE59]',
            label: 'Approved',
            icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
        },
        rejected: {
            color: 'red',
            label: 'Needs Attention',
            icon: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z'
        }
    };

    const status = statusConfig[submission.approval_status] || statusConfig.pending;
    const submittedDate = new Date(submission.submitted_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });

    return (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all font-sans">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="flex flex-col md:flex-row items-start gap-4">
                    <div className={`w-12 h-12 rounded-full bg-${status.color === '[#FFDE59]' ? '[#FFDE59]' : status.color}-500/10 flex items-center justify-center flex-shrink-0`}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`text-${status.color === '[#FFDE59]' ? '[#FFDE59]' : status.color + '-400'}`}>
                            <path d={status.icon} />
                        </svg>
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                            <h4 className="text-lg font-black uppercase tracking-tight">
                                {submission.selected_drug || submission.recommended_treatment || 'Assessment'}
                            </h4>
                            <button
                                onClick={() => setSelectedAssessment(submission)}
                                className="text-[10px] bg-white/5 hover:bg-white/5 text-white/50 hover:text-white px-3 py-1 rounded-full border border-white/10 transition-all font-black uppercase tracking-widest"
                            >
                                View Data
                            </button>
                        </div>
                        <p className="text-xs text-white/50 font-medium">
                            Submitted {submittedDate}
                        </p>
                    </div>
                </div>

                <div className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest self-start ${submission.approval_status === 'approved'
                    ? 'bg-[#FFDE59]/20 border border-[#FFDE59]/40 text-white'
                    : submission.approval_status === 'pending'
                        ? 'bg-orange-500/10 border border-orange-500/20 text-orange-400'
                        : 'bg-red-500/10 border border-red-500/20 text-red-400'
                    }`}>
                    {status.label}
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-6">
                {submission.goals && submission.goals.length > 0 && (
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-white/50 mb-1">Goals</p>
                        <p className="text-xs font-bold text-white truncate">{submission.goals[0]}</p>
                    </div>
                )}
                {submission.weight && (
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-white/50 mb-1">Weight</p>
                        <p className="text-xs font-bold text-white">{submission.weight} lbs</p>
                    </div>
                )}
                {submission.bmi && (
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-white/50 mb-1">BMI</p>
                        <p className="text-xs font-bold text-white">{submission.bmi}</p>
                    </div>
                )}
                {submission.state && (
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-white/50 mb-1">State</p>
                        <p className="text-xs font-bold text-white">{submission.state}</p>
                    </div>
                )}
            </div>

            {submission.approval_status === 'approved' && (
                <div className="pt-4 border-t border-white/10 flex gap-3">
                    <button
                        onClick={() => onPrescriptionClick(submission.provider_id)}
                        className="flex-1 bg-[#FFDE59] text-black py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#111111] transition-all"
                    >
                        Prescription info
                    </button>
                    <button
                        onClick={() => navigate('/dashboard/orders')}
                        className="px-6 bg-white/5 border border-white/10 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:border-[#FFDE59] transition-all"
                    >
                        Shipment
                    </button>
                </div>
            )}

            {submission.approval_status === 'pending' && (
                <div className="pt-4 border-t border-white/10">
                    <p className="text-[10px] text-white/60 font-medium leading-relaxed">
                        <span className="text-white">⏱</span> Review in progress. Average turnaround is 24-48 hours.
                    </p>
                </div>
            )}
        </div>
    );
};

const NotificationsView = ({ submissions, orders }) => {
    const notifications = [];

    // Derive notifications from submissions
    submissions.forEach(sub => {
        if (sub.approval_status === 'approved') {
            notifications.push({
                id: `sub-app-${sub.id}`,
                title: 'Clinical Approval',
                message: `Your assessment for ${sub.selected_drug || 'treatment'} has been approved by the medical board.`,
                time: sub.submitted_at,
                type: 'success',
                icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
            });
        } else if (sub.approval_status === 'rejected') {
            notifications.push({
                id: `sub-rej-${sub.id}`,
                title: 'Action Required',
                message: `Your assessment for ${sub.selected_drug || 'treatment'} requires additional information.`,
                time: sub.submitted_at,
                type: 'warning',
                icon: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
            });
        }
    });

    // Derive notifications from orders
    orders.forEach(order => {
        notifications.push({
            id: `ord-${order.id}`,
            title: 'Order Update',
            message: `Your order #${order.id.slice(0, 8)} status is now ${order.delivery_status || 'Processing'}.`,
            time: order.created_at,
            type: 'info',
            icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'
        });
    });

    // Sort by time
    const sortedNotifications = notifications.sort((a, b) => new Date(b.time) - new Date(a.time));

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div>
                <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter  mb-2">Patient <span className="text-white">Notifications</span></h2>
                <p className="text-xs text-white/50 font-bold uppercase tracking-widest">Real-time updates on your clinical journey</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {sortedNotifications.length === 0 ? (
                    <div className="bg-[#111111] border border-dashed border-white/20 rounded-[40px] p-20 text-center">
                        <p className="text-white/30 font-black uppercase tracking-widest text-xs">No active notifications</p>
                    </div>
                ) : (
                    sortedNotifications.map(notif => (
                        <div key={notif.id} className="bg-white/5 border border-white/10 rounded-3xl p-6 flex gap-6 hover:border-white/20 transition-all items-start group">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${notif.type === 'success' ? 'bg-[#FFDE59]/20 text-white' : notif.type === 'warning' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d={notif.icon} />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className="text-sm font-black uppercase tracking-tight">{notif.title}</h4>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-white/30">{new Date(notif.time).toLocaleDateString()}</span>
                                </div>
                                <p className="text-xs text-white/60 leading-relaxed font-bold uppercase tracking-widest">{notif.message}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

const Dashboard = () => {
    const { user, signOut, verifyOtp, updateUser } = useAuth();
    const navigate = useNavigate();
    const [vitalityScore, setVitalityScore] = useState(0);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Phone verification state
    const [showPhoneVerificationModal, setShowPhoneVerificationModal] = useState(false);
    const [otp, setOtp] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [phoneVerified, setPhoneVerified] = useState(true); // Default to true to avoid flash

    useEffect(() => {
        if (user) {
            // Check if phone matches and is confirmed
            const isConfirmed = !!user.phone_confirmed_at;
            setPhoneVerified(isConfirmed);

            // Get phone number from user record or metadata (stored during signup)
            const phoneNumber = user.phone || user.user_metadata?.phone_number;

            // If phone exists but not confirmed, show modal and trigger SMS automatically
            if (phoneNumber && !isConfirmed) {
                setShowPhoneVerificationModal(true);

                // Only trigger SMS once per session to avoid spamming
                const hasSentSms = sessionStorage.getItem('otp_auto_sent');
                if (!hasSentSms) {
                    // Set flag immediately to prevent race conditions during React Strict Mode / re-renders
                    sessionStorage.setItem('otp_auto_sent', 'true');

                    const autoTriggerSms = async () => {
                        try {
                            console.log('[Dashboard] Triggering OTP for:', phoneNumber);
                            // Update phone will trigger the SMS. 
                            // This specifically requires 'phone_change' type for verification.
                            const { error } = await updateUser({ phone: phoneNumber });
                            if (error) {
                                // If it fails, clear the flag so user can retry or resend
                                sessionStorage.removeItem('otp_auto_sent');
                                throw error;
                            }
                            toast.success('Verification code sent to your phone!');
                        } catch (err) {
                            console.error('Failed to auto-send OTP:', err);
                            toast.error(`Couldn't send code: ${err.message}`);
                        }
                    };
                    autoTriggerSms();
                }
            }
        }
    }, [user, updateUser]);

    const handleVerifyPhone = async (e) => {
        if (e) e.preventDefault();
        setVerifying(true);
        try {
            const phoneNumber = user.phone || user.user_metadata?.phone_number;
            if (!phoneNumber) throw new Error("No phone number found for verification.");

            console.log('[Dashboard] Verifying OTP for:', phoneNumber, 'Token:', otp);

            // CRITICAL: When triggered via updateUser({phone}), the type MUST be 'phone_change'
            const { error } = await verifyOtp({
                phone: phoneNumber,
                token: otp,
                type: 'phone_change'
            });

            if (error) throw error;

            // Optional: Update profile table to reflect verification
            await supabase.from('profiles').update({
                phone_number: phoneNumber,
                updated_at: new Date().toISOString()
            }).eq('id', user.id);

            setPhoneVerified(true);
            setShowPhoneVerificationModal(false);
            toast.success('Phone verified successfully!');

            // Reload user to get updated confirmed_at
            window.location.reload();
        } catch (error) {
            console.error('Verification failed:', error);
            // If phone_change fails, try 'sms' as a fallback for standard signups
            if (error.message.includes('invalid') || error.message.includes('expired')) {
                try {
                    const phoneNumber = user.phone || user.user_metadata?.phone_number;
                    const { error: fallbackError } = await verifyOtp({
                        phone: phoneNumber,
                        token: otp,
                        type: 'sms'
                    });
                    if (!fallbackError) {
                        setPhoneVerified(true);
                        setShowPhoneVerificationModal(false);
                        toast.success('Phone verified!');
                        window.location.reload();
                        return;
                    }
                } catch (e) {
                    // ignore fallback error and show original
                }
            }
            toast.error(error.message);
        } finally {
            setVerifying(false);
        }
    };

    const resendOtp = async () => {
        try {
            const phoneNumber = user.phone || user.user_metadata?.phone_number;
            const { error } = await updateUser({
                phone: phoneNumber
            });
            if (error) throw error;
            toast.success('Verification code resent.');
        } catch (error) {
            toast.error(error.message);
        }
    };

    const getTab = () => {
        const path = location.pathname;
        if (path.includes('/medications')) return 'medications';
        if (path.includes('/assessments')) return 'assessments';
        if (path.includes('/orders')) return 'orders';
        if (path.includes('/billing')) return 'billing';
        if (path.includes('/settings')) return 'settings';
        if (path.includes('/referral')) return 'referral';
        if (path.includes('/notifications')) return 'notifications';
        return 'overview';
    };
    const currentTab = getTab();

    const [retakeModal, setRetakeModal] = useState({ isOpen: false, submission: null });

    const handleRetakeSubmit = async () => {
        if (!retakeModal.submission) return;

        const isSynthetic = retakeModal.submission.id === 'plan-from-profile';

        if (!isSynthetic) {
            try {
                const { error } = await supabase
                    .from('form_submissions')
                    .delete()
                    .eq('id', retakeModal.submission.id);

                if (error) throw error;
            } catch (err) {
                console.error('Error deleting submission:', err);
                alert('Failed to delete submission. Please try again.');
                return;
            }
        }

        setRetakeModal({ isOpen: false, submission: null });
        navigate('/qualify');
    };

    console.log('[Dashboard] Render:', { currentTab, userId: user?.id, loading });

    const [submissions, setSubmissions] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loadingSubmissions, setLoadingSubmissions] = useState(true);
    const [loadingOrders, setLoadingOrders] = useState(true);
    const [hasAnimated, setHasAnimated] = useState(false);
    const [selectedAssessment, setSelectedAssessment] = useState(null);
    const [selectedPhysician, setSelectedPhysician] = useState(null);
    const [loadingPhysician, setLoadingPhysician] = useState(false);
    const [actionModal, setActionModal] = useState({ isOpen: false, type: null, medication: null });
    const [actionLoading, setActionLoading] = useState(false);
    const [lastOptimisticUpdate, setLastOptimisticUpdate] = useState(null);

    const handleActionSubmit = async (value, reason) => {
        setActionLoading(true);
        try {
            const originalSubmission = actionModal.medication;
            const drug = originalSubmission.selected_drug || '';
            let catSlug = 'weight_loss';
            const dLow = drug.toLowerCase();
            if (dLow.includes('hair') || dLow.includes('finasteride') || dLow.includes('minoxidil')) catSlug = 'hair_restoration';
            else if (dLow.includes('sex') || dLow.includes('erectile') || dLow.includes('sildenafil') || dLow.includes('tadalafil') || dLow.includes('oxytocin')) catSlug = 'sexual_health';
            else if (dLow.includes('longevity') || dLow.includes('nad') || dLow.includes('cjc') || dLow.includes('ipamorelin')) catSlug = 'longevity';
            else if (dLow.includes('weight') || dLow.includes('semaglutide') || dLow.includes('tirzepatide')) catSlug = 'weight_loss';

            if (actionModal.type === 'cancel') {
                let subscriptionId = originalSubmission.stripe_subscription_id || profile?.stripe_subscription_id;

                // Handle cases where stripe_subscription_id might be a JSON map in the profile
                if (subscriptionId && typeof subscriptionId === 'string' && subscriptionId.startsWith('{')) {
                    try {
                        const subMap = JSON.parse(subscriptionId);
                        subscriptionId = subMap[catSlug] || subscriptionId;
                    } catch (e) {
                        console.error('Error parsing subscription map:', e);
                    }
                } else if (subscriptionId && typeof subscriptionId === 'object') {
                    subscriptionId = subscriptionId[catSlug] || subscriptionId;
                }

                if (!subscriptionId || (typeof subscriptionId === 'string' && subscriptionId.startsWith('{'))) {
                    throw new Error('No active subscription ID found for this protocol.');
                }

                const { data, error } = await supabase.functions.invoke('cancel-subscription', {
                    method: 'POST',
                    body: {
                        userId: user.id,
                        subscriptionId: subscriptionId,
                        category: catSlug
                    }
                });

                if (error) throw error;

                alert(`Your subscription for ${originalSubmission.selected_drug?.replace(/-/g, ' ')} has been canceled. Access ends: ${data.accessEnds}`);
                setActionModal({ isOpen: false, type: null, medication: null });

                // Optimistic Update for Cancel
                if (profile) {
                    setProfile(prev => {
                        let currentMap = {};
                        try {
                            const pStatus = prev.subscription_status;
                            if (pStatus === true || pStatus === 'true' || (typeof pStatus === 'string' && !pStatus.startsWith('{'))) {
                                currentMap = { 'weight_loss': true };
                            } else {
                                currentMap = typeof pStatus === 'string' ? JSON.parse(pStatus) : (pStatus || {});
                            }
                        } catch { currentMap = {}; }

                        currentMap[catSlug] = false;

                        return {
                            ...prev,
                            subscription_status: JSON.stringify(currentMap)
                        };
                    });
                }

                // Mark that we just did an optimistic update
                setLastOptimisticUpdate(Date.now());

                fetchSubmissions();
                // fetchProfile is handled via optimistic update + 2s guard
                return;
            }

            if (actionModal.type === 'activate') {
                const shippingAddress = profile ?
                    `${profile.shipping_address || ''}, ${profile.shipping_city || ''}, ${profile.shipping_state || ''} ${profile.shipping_zip || ''}`.trim()
                    : '';

                const { data, error } = await supabase.functions.invoke('charge-customer-responder', {
                    method: 'POST',
                    body: {
                        userId: user.id,
                        product_name: `${originalSubmission.selected_drug?.replace(/-/g, ' ')} - $180`,
                        product_price: 18000,
                        product_category: getMedicationCategory(originalSubmission.selected_drug),
                        request_type: "activate subscription",
                        shipping_address: shippingAddress,
                        form_submission_id: (originalSubmission.id && !originalSubmission.id.toString().startsWith('plan-from-profile')) ? originalSubmission.id : null
                    }
                });

                if (error) throw error;
                if (data?.error) throw new Error(data.error);

                alert('Subscription reactivated successfully! Welcome back.');
                setActionModal({ isOpen: false, type: null, medication: null });

                // Optimistic Update for Activate
                if (profile) {
                    setProfile(prev => {
                        let currentMap = {};
                        try {
                            const pStatus = prev.subscription_status;
                            if (pStatus === true || pStatus === 'true' || (typeof pStatus === 'string' && !pStatus.startsWith('{'))) {
                                currentMap = { 'weight_loss': true };
                            } else {
                                currentMap = typeof pStatus === 'string' ? JSON.parse(pStatus) : (pStatus || {});
                            }
                        } catch { currentMap = {}; }

                        currentMap[catSlug] = true;

                        return {
                            ...prev,
                            subscription_status: JSON.stringify(currentMap),
                            subscribe_status: true
                        };
                    });
                }

                // Mark that we just did an optimistic update
                setLastOptimisticUpdate(Date.now());

                fetchSubmissions();
                return;
            }

            const currentDosage = originalSubmission.dosage_preference || 'Standard';

            // Clone the submission data for dosage/medication changes
            const newSubmissionPayload = {
                ...originalSubmission,
                id: undefined,
                created_at: undefined,
                submitted_at: new Date().toISOString(),
                approval_status: 'pending',

                dosage_preference: actionModal.type === 'dosage' ? value : currentDosage,
                selected_drug: actionModal.type === 'medication' ? (value.toLowerCase().replace(/\s+/g, '-')) : originalSubmission.selected_drug,
                submission_type: actionModal.type === 'dosage' ? 'dosage_change' : 'medication_change',
                additional_health_info: `[${actionModal.type === 'dosage' ? 'DOSAGE' : 'MEDICATION'} CHANGE REQUEST]
            ${actionModal.type === 'dosage' ? 'New Dosage' : 'New Medication'}: ${value}
            Reason: ${reason}
            Previous ${actionModal.type === 'dosage' ? 'Dosage' : 'Medication'}: ${actionModal.type === 'dosage' ? currentDosage : originalSubmission.selected_drug}
            Original Submission ID: ${originalSubmission.id}`
            };

            delete newSubmissionPayload.id;
            delete newSubmissionPayload.created_at;
            delete newSubmissionPayload.previous_dosage;
            delete newSubmissionPayload.submission_type;

            const { error: insertError } = await supabase
                .from('form_submissions')
                .insert([newSubmissionPayload]);

            if (insertError) throw insertError;

            alert('Your request has been submitted securely and is under clinical review.');
            setActionModal({ isOpen: false, type: null, medication: null });
            fetchSubmissions();
        } catch (err) {
            console.error('Request error:', err);
            alert(`Failed to submit request: ${err.message}`);
        } finally {
            setActionLoading(false);
        }
    };

    const fetchProfile = async () => {
        if (!user) return;

        // Skip fetch if we just did an optimistic update (within 2 seconds)
        // This gives the database/edge functions time to propagate changes
        if (lastOptimisticUpdate && (Date.now() - lastOptimisticUpdate < 2000)) {
            console.log('[Dashboard] Skipping profile fetch - recent optimistic update');
            return;
        }

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .maybeSingle(); // Use maybeSingle to handle missing profiles gracefully

            if (error) {
                console.error('Error fetching profile:', error);
            } else {
                const meta = user.user_metadata || {};

                // If profile doesn't exist OR is missing key data, perform a sync
                if (!data || (!data.phone_number && meta.phone_number) || (!data.first_name && meta.first_name)) {
                    console.log('[Dashboard] Syncing identity from Auth to Public Profile...');
                    const profileData = {
                        id: user.id,
                        email: user.email,
                        first_name: data?.first_name || meta.first_name || '',
                        last_name: data?.last_name || meta.last_name || '',
                        phone_number: data?.phone_number || meta.phone_number || '',
                        date_of_birth: data?.date_of_birth || meta.date_of_birth || meta.birthday || '',
                        updated_at: new Date().toISOString()
                    };

                    const { data: updatedProfile, error: upsertError } = await supabase
                        .from('profiles')
                        .upsert(profileData, { onConflict: 'id' })
                        .select()
                        .single();

                    if (!upsertError) {
                        setProfile(updatedProfile);
                    } else {
                        console.error('Sync failed:', upsertError);
                    }
                } else {
                    setProfile(data);
                }
            }
        } catch (err) {
            console.error('Profile fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchSubmissions = async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('form_submissions')
                .select('*')
                .eq('user_id', user.id)
                .order('submitted_at', { ascending: false });

            if (error) {
                console.error('Error fetching submissions:', error);
            } else {
                setSubmissions(data || []);
            }
        } catch (err) {
            console.error('Submissions fetch error:', err);
        } finally {
            setLoadingSubmissions(false);
        }
    };

    const fetchOrders = async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching orders:', error);
            } else {
                setOrders(data || []);
            }
        } catch (err) {
            console.error('Orders fetch error:', err);
        } finally {
            setLoadingOrders(false);
        }
    };

    useEffect(() => {
        if (user) fetchProfile();
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchSubmissions();
            fetchOrders();
        }
    }, [user]);

    // Handle Stripe Redirect Recovery
    useEffect(() => {
        const handleStripeRedirect = async () => {
            const query = new URLSearchParams(location.search);
            const setupIntentSecret = query.get('setup_intent_client_secret');
            const paymentIntentSecret = query.get('payment_intent_client_secret');

            if ((setupIntentSecret || paymentIntentSecret) && user) {
                console.log('Detected Stripe redirect. Verifying intent...');
                const stripe = await stripePromise;

                let pmId = null;
                if (setupIntentSecret) {
                    const { setupIntent } = await stripe.retrieveSetupIntent(setupIntentSecret);
                    if (setupIntent?.status === 'succeeded') {
                        pmId = typeof setupIntent.payment_method === 'string' ? setupIntent.payment_method : setupIntent.payment_method?.id;
                    }
                } else if (paymentIntentSecret) {
                    const { paymentIntent } = await stripe.retrievePaymentIntent(paymentIntentSecret);
                    if (paymentIntent?.status === 'succeeded') {
                        pmId = typeof paymentIntent.payment_method === 'string' ? paymentIntent.payment_method : paymentIntent.payment_method?.id;
                    }
                }

                if (pmId) {
                    console.log('Post-redirect: Captured payment method:', pmId);
                    const { error } = await supabase.from('profiles').update({ stripe_payment_method_id: pmId }).eq('id', user.id);
                    if (!error) {
                        console.log('Profile updated via redirect recovery.');
                        fetchProfile();
                    } else {
                        console.error('Redirect recovery update failed:', error.message);
                    }
                }

                // Clean up URL to prevent repeated processing
                navigate(location.pathname, { replace: true });
            }
        };

        handleStripeRedirect();
    }, [location.search, user]);

    const signupDate = profile?.created_at ? new Date(profile.created_at) : new Date();

    useEffect(() => {
        // ONLY run animations once data is ready and we haven't animated yet
        if (loading || loadingSubmissions || hasAnimated) return;

        window.scrollTo(0, 0);

        const calculateVitalityScore = () => {
            let score = 0;
            const daysSinceSignup = Math.floor((new Date() - signupDate) / (1000 * 60 * 60 * 24));
            const accountAgeScore = Math.min(20, Math.floor(daysSinceSignup / 7) * 2);
            score += accountAgeScore;

            if (submissions.length > 0) {
                score += 15;
                if (submissions.length > 1) score += Math.min(15, submissions.length * 5);
            }

            const approvedCount = submissions.filter(s => s.approval_status === 'approved').length;
            if (approvedCount > 0) {
                score += 20;
                score += Math.min(10, (approvedCount - 1) * 5);
            }

            if (profile?.subscribe_status === true && profile?.subscription_status === 'active') {
                score += 20;
            } else if (approvedCount > 0) {
                score += 10;
            }

            return Math.min(100, score);
        };

        const finalScore = calculateVitalityScore();

        // Animate count-up
        gsap.to({}, {
            duration: 1.5,
            ease: "power2.out",
            onUpdate: function () {
                setVitalityScore(Math.floor(this.progress() * finalScore));
            }
        });

        // Entrance stagger for cards
        gsap.fromTo(".dashboard-card",
            { opacity: 0, y: 20 },
            {
                opacity: 1,
                y: 0,
                duration: 0.8,
                stagger: 0.08,
                ease: "power3.out"
            }
        );

        setHasAnimated(true);
    }, [loading, loadingSubmissions, submissions, profile, hasAnimated, signupDate]);

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    if (!user || loading) {
        return (
            <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center text-white">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-[#FFDE59] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                </div>
            </div>
        );
    }

    const userName = profile?.first_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Patient';
    const fullName = profile?.first_name && profile?.last_name ? `${profile.first_name} ${profile.last_name}` : userName;
    const weekNumber = Math.floor((new Date() - signupDate) / (1000 * 60 * 60 * 24 * 7)) + 1;

    // Check for active medications from submissions
    const approvedSubmissions = submissions.filter(s => s.approval_status === 'approved');
    const pendingSubmissions = submissions.filter(s => s.approval_status === 'pending');

    // Calculate active categories
    const activeCategories = Array.from(new Set(
        approvedSubmissions.map(s => getMedicationCategory(s.selected_drug || s.dosage_preference))
            .filter(Boolean)
    ));

    // Only show active protocol banner if there's a real current_plan or approved submissions
    const hasActiveProtocol = (approvedSubmissions.length > 0 && approvedSubmissions[0]) ||
        (profile?.current_plan && profile.current_plan !== 'None' && profile.current_plan !== '{ }');

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white font-sans">
            {/* Sidebar Navigation */}
            <aside className="fixed left-0 top-0 h-screen w-72 bg-[#1a1a1a] border-r border-white/10 p-6 hidden lg:flex flex-col">
                <div className="flex-shrink-0 mb-12">
                    <button
                        onClick={() => navigate('/')}
                        className="text-2xl font-black uppercase tracking-tighter text-white hover:text-[#FFDE59] transition-colors"
                    >
                        <sub className="font-brand lowercase italic opacity-80">u</sub>Glow<sup className="text-[0.6em] font-bold ml-0.5">MD</sup>
                    </button>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-white/30 mt-2">Patient Portal</p>
                </div>

                <nav className="flex-1 overflow-y-auto space-y-2 mb-8 pr-2 custom-scrollbar">
                    {[
                        { id: 'overview', label: 'Overview', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
                        { id: 'medications', label: 'Medications', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
                        { id: 'assessments', label: 'Assessments', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
                        { id: 'orders', label: 'Orders', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
                        { id: 'notifications', label: 'Notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
                        { id: 'billing', label: 'Billing', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
                        { id: 'statements', label: 'Statements', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
                        { id: 'settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z' },
                    ].map(item => (
                        <button
                            key={item.id}
                            onClick={() => navigate(`/dashboard/${item.id}`)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-black uppercase tracking-wider transition-all ${currentTab === item.id
                                ? 'bg-[#FFDE59] text-black shadow-[0_4px_15px_rgba(255,222,89,0.2)]'
                                : 'text-white/50 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d={item.icon} />
                            </svg>
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div className="flex-shrink-0 mt-auto border-t border-white/5 pt-6">
                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all cursor-pointer group">
                        <div className="w-10 h-10 rounded-full bg-[#FFDE59]/20 border-2 border-[#FFDE59]/40 flex items-center justify-center font-black text-white">
                            {userName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-xs font-black uppercase tracking-tight text-white truncate">{userName}</p>
                            <p className="text-[9px] text-white/40 font-medium uppercase tracking-widest">Week {weekNumber}</p>
                        </div>
                        <button
                            onClick={handleSignOut}
                            className="p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/10 rounded-lg text-red-400"
                            title="Sign Out"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
                            </svg>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="lg:ml-72 min-h-screen">
                {/* Top Bar (Mobile) */}
                <div className="lg:hidden sticky top-0 z-40 bg-[#111111]/95 backdrop-blur-xl border-b border-white/10 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setMobileMenuOpen(true)}
                                className="p-2 -ml-2 text-white/60 hover:text-white transition-colors"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                            <button
                                onClick={() => navigate('/')}
                                className="text-xl font-black uppercase tracking-tighter "
                            >
                                <span className="font-brand lowercase italic opacity-80">u</span>Glow<sup className="text-[0.6em] font-bold ml-0.5">MD</sup>
                            </button>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-[#FFDE59]/20 border-2 border-[#FFDE59]/40 flex items-center justify-center font-black text-white">
                            {userName.charAt(0).toUpperCase()}
                        </div>
                    </div>
                </div>

                {/* Mobile Menu Overlay */}
                {mobileMenuOpen && (
                    <div className="fixed inset-0 z-50 lg:hidden">
                        <div
                            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                            onClick={() => setMobileMenuOpen(false)}
                        ></div>
                        <div className="absolute top-0 left-0 w-[80%] max-w-sm h-full bg-[#0A0A0A] border-r border-white/10 p-6 shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
                            <div className="flex items-center justify-between mb-10">
                                <button
                                    onClick={() => navigate('/')}
                                    className="text-2xl font-black uppercase tracking-tighter text-white"
                                >
                                    <span className="font-brand lowercase italic opacity-80">u</span>Glow<sup className="text-[0.6em] font-bold ml-0.5">MD</sup>
                                </button>
                                <button
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="p-2 text-white/50 hover:text-white transition-colors"
                                >
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </button>
                            </div>

                            <nav className="space-y-2 flex-1">
                                {[
                                    { id: 'overview', label: 'Overview', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
                                    { id: 'medications', label: 'Medications', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
                                    { id: 'assessments', label: 'Assessments', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
                                    { id: 'orders', label: 'Orders', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
                                    { id: 'notifications', label: 'Notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
                                    { id: 'billing', label: 'Billing', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
                                    { id: 'statements', label: 'Statements', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
                                ].map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            navigate(`/dashboard/${item.id}`);
                                            setMobileMenuOpen(false);
                                        }}
                                        className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl text-sm font-black uppercase tracking-wider transition-all ${currentTab === item.id
                                            ? 'bg-[#FFDE59] text-black'
                                            : 'text-white/50 hover:text-white hover:bg-[#111111]/10'
                                            }`}
                                    >
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d={item.icon} />
                                        </svg>
                                        {item.label}
                                    </button>
                                ))}
                            </nav>

                            <div className="pt-6 border-t border-white/10 mt-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-full bg-[#FFDE59]/20 border-2 border-[#FFDE59]/40 flex items-center justify-center font-black text-white">
                                        {userName.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-tight text-white">{userName}</p>
                                        <p className="text-[9px] text-white/50 font-medium">Week {weekNumber}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleSignOut}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#111111]/5 hover:bg-red-500/20 text-white/60 hover:text-red-400 rounded-xl transition-all font-bold uppercase tracking-widest text-xs"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
                                    </svg>
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Content Area */}
                <div className="max-w-[1400px] 2xl:max-w-[1800px] 3xl:max-w-none mx-auto p-6 md:p-12">


                    {/* Renewal Management Section - High Visibility Placement */}
                    {location.pathname === '/dashboard/overview' && hasActiveProtocol && (
                        <div className="dashboard-card bg-white/5 border border-white/10 rounded-[32px] overflow-hidden relative group mb-12">
                            <div className="flex flex-col lg:flex-row items-center">
                                <div className="w-full lg:w-1/2 p-10 md:p-14 order-2 lg:order-1 relative z-10">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-2 h-2 rounded-full bg-[#FFDE59] animate-pulse"></div>
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Protocol Status: Active</span>
                                    </div>

                                    <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter  mb-4 leading-none">
                                        Congratulations <br />
                                        <span className="text-white/50">
                                            {activeCategories.length === 1
                                                ? `On your ${activeCategories[0]} Approval`
                                                : activeCategories.length > 1
                                                    ? `On your ${activeCategories.join(' & ')} Approvals`
                                                    : `On your ${approvedSubmissions[0]?.dosage_preference || approvedSubmissions[0]?.selected_drug || 'Protocol'} Approval`}
                                        </span>
                                    </h2>

                                    <p className="text-sm text-white/60 mb-10 font-medium leading-relaxed max-w-md">
                                        The clinical board has officially approved your transformation journey. Your protocol is now active and moving toward fulfillment. Here is how you can optimize your journey:
                                    </p>

                                    <div className="flex flex-wrap gap-4">
                                        <button
                                            onClick={() => navigate('/dashboard/medications')}
                                            className="px-8 py-5 bg-[#111111] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#FFDE59] hover:shadow-[0_0_40px_rgba(255,222,89,0.4)] transition-all"
                                        >
                                            Request Dosage Change
                                        </button>
                                        <button
                                            onClick={() => window.open('https://trustpilot.com', '_blank')}
                                            className="px-8 py-5 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/5 transition-all"
                                        >
                                            Submit Wellness Review
                                        </button>
                                    </div>
                                </div>
                                <div className="w-full lg:w-1/2 min-h-[400px] relative order-1 lg:order-2 overflow-hidden">
                                    <img
                                        src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=2070&auto=format&fit=crop"
                                        alt="Renewal Management"
                                        className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-1000"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-r lg:bg-gradient-to-l from-transparent via-white/40 to-white"></div>
                                </div>
                            </div>
                        </div>
                    )}


                    {/* Tabbed Content */}
                    <Routes>
                        <Route path="/" element={<Navigate to="overview" replace />} />

                        <Route path="overview" element={
                            <>
                                {/* Welcome Header */}
                                <div className="mb-12">
                                    <h1 className="text-[30px] font-black uppercase tracking-tighter mb-2">
                                        Welcome Back, <span style={{ backgroundColor: "#FFDE59", padding: "0 8px", color: "#000" }}>{userName}</span>
                                    </h1>
                                    <p className="text-white/50 text-sm font-bold uppercase tracking-widest">
                                        {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </p>

                                    {!phoneVerified && user?.phone && (
                                        <div className="mt-8 bg-orange-500/10 border border-orange-500/20 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 animate-pulse">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500">
                                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.33 1.732-2.66L13.732 4c-.77-1.33-2.694-1.33-3.464 0L3.34 16.34c-.77 1.33.192 2.66 1.732 2.66z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black uppercase tracking-tight text-orange-400">Phone Verification Required</p>
                                                    <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest">Please verify your phone number to access all clinical features.</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setShowPhoneVerificationModal(true)}
                                                className="px-6 py-3 bg-orange-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#111111] transition-all shadow-lg"
                                            >
                                                Verify Now
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                                    <div
                                        onClick={() => navigate('/dashboard/medications')}
                                        className="dashboard-card bg-[#FFDE59]/10 border border-[#FFDE59]/40 rounded-3xl p-6 cursor-pointer hover:scale-[1.02] transition-transform"
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="w-12 h-12 rounded-full bg-[#FFDE59]/30 flex items-center justify-center">
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
                                                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                                                </svg>
                                            </div>
                                            <span className="text-xs font-black uppercase tracking-widest text-white/50">Active</span>
                                        </div>
                                        <p className="text-3xl font-black text-white mb-1">{approvedSubmissions.length}</p>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-white/50">Your Medications</p>
                                    </div>

                                    <div
                                        onClick={() => navigate('/dashboard/assessments')}
                                        className="dashboard-card bg-white/5 border border-white/10 rounded-3xl p-6 cursor-pointer hover:border-white/20 transition-all font-sans relative overflow-hidden group"
                                    >
                                        {submissions.length > 0 ? (
                                            <>
                                                {/* Status Background Glow */}
                                                <div className={`absolute -right-4 -top-4 w-24 h-24 bg-${submissions[0].approval_status === 'approved' ? '[#FFDE59]' :
                                                    (submissions[0].approval_status === 'pending' || submissions[0].approval_status === 'under_review') ? 'orange' : 'red'
                                                    }-500/10 blur-3xl group-hover:bg-opacity-20 transition-all duration-500`}></div>

                                                <div className="flex items-center justify-between mb-4 relative z-10">
                                                    <div className={`w-12 h-12 rounded-full bg-${submissions[0].approval_status === 'approved' ? '[#FFDE59]/20' :
                                                        (submissions[0].approval_status === 'pending' || submissions[0].approval_status === 'under_review') ? 'orange-500/10' : 'red-500/10'
                                                        } flex items-center justify-center`}>
                                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={
                                                            submissions[0].approval_status === 'approved' ? 'text-white' :
                                                                (submissions[0].approval_status === 'pending' || submissions[0].approval_status === 'under_review') ? 'text-orange-400' : 'text-red-400'
                                                        }>
                                                            <path d={
                                                                submissions[0].approval_status === 'approved' ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" :
                                                                    (submissions[0].approval_status === 'pending' || submissions[0].approval_status === 'under_review') ? "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" :
                                                                        "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                                                            } />
                                                        </svg>
                                                    </div>
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${submissions[0].approval_status === 'approved' ? 'text-white/50' :
                                                        (submissions[0].approval_status === 'pending' || submissions[0].approval_status === 'under_review') ? 'text-orange-400/60' : 'text-red-400/60'
                                                        }`}>
                                                        {submissions[0].approval_status === 'approved' ? 'Approved' :
                                                            (submissions[0].approval_status === 'pending' || submissions[0].approval_status === 'under_review') ? 'In Review' : 'Attention'}
                                                    </span>
                                                </div>
                                                <p className="text-3xl font-black text-white mb-1 relative z-10">
                                                    {submissions[0].selected_drug || submissions[0].recommended_treatment || 'Protocol'}
                                                </p>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-white/50 relative z-10">Latest Assessment</p>
                                            </>
                                        ) : (
                                            <>
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/30">
                                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    </div>
                                                    <span className="text-xs font-black uppercase tracking-widest text-white/30">Empty</span>
                                                </div>
                                                <p className="text-3xl font-black text-white/50 mb-1">0</p>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-white/50">No History</p>
                                            </>
                                        )}
                                    </div>

                                    <div
                                        onClick={() => navigate('/dashboard/orders')}
                                        className="dashboard-card bg-white/5 border border-white/10 rounded-3xl p-6 cursor-pointer hover:border-white/20 transition-all group overflow-hidden relative"
                                    >
                                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/5 blur-3xl transition-opacity group-hover:opacity-20 opacity-0"></div>
                                        <div className="flex items-center justify-between mb-4 relative z-10">
                                            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-400">
                                                    <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                                </svg>
                                            </div>
                                            <span className="text-xs font-black uppercase tracking-widest text-blue-400/60">Live</span>
                                        </div>
                                        <p className="text-3xl font-black text-white mb-1 relative z-10">{orders.length}</p>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-white/50 relative z-10">Active Orders</p>
                                    </div>
                                </div>
                                {/* Product Recommendations Carousel */}
                                <div className="dashboard-card bg-white/5 border border-white/10 rounded-[32px] p-8 overflow-hidden relative group mb-12">
                                    <div className="flex items-center justify-between mb-8">
                                        <div>
                                            <h2 className="text-2xl font-black uppercase tracking-tighter  mb-1">
                                                {approvedSubmissions.length > 0 ? "Explore Other Treatments" : "Explore Treatments"}
                                            </h2>
                                            <p className="text-xs text-white/50 font-bold uppercase tracking-widest">Enhanced wellness solutions</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button className="p-2 rounded-full bg-white/5 hover:bg-white/5 text-white transition-all">
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M15 18l-6-6 6-6" />
                                                </svg>
                                            </button>
                                            <button className="p-2 rounded-full bg-white/5 hover:bg-white/5 text-white transition-all">
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M9 18l6-6-6-6" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar snap-x">
                                        {[
                                            {
                                                id: 'weight-loss',
                                                title: "Medical Weight Loss",
                                                image: weightLossImg,
                                                path: "/assessment/weight-loss",
                                                accent: '#FFDE59'
                                            },
                                            {
                                                id: 'hair-restoration',
                                                title: "Hair Restoration",
                                                image: hairLossImg,
                                                path: "/assessment/hair-restoration",
                                                accent: '#60A5FA'
                                            },
                                            {
                                                id: 'sexual-health',
                                                title: "Sexual Health",
                                                image: sexualHealthImg,
                                                path: "/assessment/sexual-health",
                                                accent: '#F472B6'
                                            },
                                            {
                                                id: 'longevity',
                                                title: "Longevity & NAD+",
                                                image: longevityImg,
                                                path: "/assessment/longevity",
                                                accent: '#A78BFA'
                                            },
                                            {
                                                id: 'testosterone',
                                                title: "Testosterone & Hormones",
                                                image: testosteroneImg,
                                                path: "/assessment/testosterone",
                                                accent: '#FB923C'
                                            },
                                            {
                                                id: 'retatrutide',
                                                title: "Retatrutide (New Innovation)",
                                                image: retatrutideImg,
                                                path: "/assessment/weight-loss",
                                                accent: '#FFDE59'
                                            },
                                            {
                                                id: 'repair-healing',
                                                title: "Repair & Strength Healing",
                                                image: repairImg,
                                                path: "/assessment/repair-healing",
                                                accent: '#EF4444'
                                            },
                                            {
                                                id: 'skin-care',
                                                title: "Skin Care",
                                                image: skinCareImg,
                                                path: "/qualify",
                                                accent: '#34D399'
                                            }
                                        ].map((product, i) => {
                                            const sub = submissions.find(s => s.selected_drug === product.id);
                                            const isPending = sub?.approval_status === 'pending' || sub?.approval_status === 'under_review';
                                            const isApproved = sub?.approval_status === 'approved';
                                            const isDisabled = isPending || isApproved;

                                            let desc = "Start Consultation";
                                            if (isPending) desc = "Review in Progress";
                                            if (isApproved) desc = "Active Protocol";
                                            if (sub && !isPending && !isApproved) desc = "Retake Assessment";

                                            return (
                                                <div
                                                    key={i}
                                                    onClick={() => !isDisabled && navigate(product.path)}
                                                    className={`min-w-[240px] h-[320px] rounded-3xl relative overflow-hidden transition-all snap-start ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer group/card hover:scale-[0.98]'}`}
                                                >
                                                    <img
                                                        src={product.image}
                                                        alt={product.title}
                                                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-110 opacity-60 group-hover/card:opacity-40"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>

                                                    <div className="absolute bottom-6 left-6 right-6">
                                                        <div className="w-8 h-8 rounded-full mb-3 flex items-center justify-center shadow-lg border border-white/20" style={{ backgroundColor: product.accent || '#FFDE59' }}>
                                                            {isDisabled ? (
                                                                <div className={`w-2 h-2 rounded-full ${isApproved ? 'bg-black' : 'bg-black animate-pulse'}`}></div>
                                                            ) : (
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5">
                                                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                                                </svg>
                                                            )}
                                                        </div>
                                                        <h3 className="text-lg font-black uppercase tracking-tighter  mb-1 leading-tight">{product.title}</h3>
                                                        <p className={`text-[10px] font-black uppercase tracking-widest ${isPending ? 'text-orange-400' : isApproved ? 'text-white' : 'text-white/60'}`}>
                                                            {desc}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>


                                {/* Recently Relocated Section */}


                                {/* Recent Assessments in Overview */}
                                <div className="dashboard-card bg-white/5 border border-white/10 rounded-[32px] p-8 md:p-12">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 md:gap-0">
                                        <div>
                                            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter  mb-2">Recent Records</h2>
                                            <p className="text-xs text-white/50 font-bold uppercase tracking-widest">Your clinical journey history</p>
                                        </div>
                                        <button onClick={() => navigate('/dashboard/assessments')} className="hidden md:block px-6 py-3 bg-white/5 border border-white/20 text-white rounded-full font-black text-xs uppercase tracking-widest hover:bg-[#FFDE59] hover:text-black hover:text-black transition-all">
                                            View All
                                        </button>
                                    </div>

                                    {submissions.length === 0 ? (
                                        <div className="text-center py-16">
                                            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
                                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/30">
                                                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                                                </svg>
                                            </div>
                                            <h4 className="text-xl font-black uppercase tracking-tighter  mb-3">No Records Yet</h4>
                                            {submissions.length === 0 ? (
                                                <button
                                                    onClick={() => navigate('/qualify')}
                                                    className="px-10 py-4 bg-[#FFDE59] text-black rounded-full font-black text-xs uppercase tracking-widest hover:bg-[#111111] transition-all shadow-[0_0_30px_rgba(92,225,230,0.1)]"
                                                >
                                                    Start Assessment →
                                                </button>
                                            ) : (submissions[0]?.approval_status !== 'pending' && submissions[0]?.approval_status !== 'under_review') ? (
                                                <button
                                                    onClick={() => navigate('/qualify')}
                                                    className="px-10 py-4 bg-[#111111] text-white rounded-full font-black text-xs uppercase tracking-widest hover:bg-[#FFDE59] hover:text-black transition-all"
                                                >
                                                    Retake Assessment
                                                </button>
                                            ) : (
                                                <div className="inline-flex items-center gap-3 px-8 py-4 bg-white/5 border border-white/10 rounded-full">
                                                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(249,115,22,0.3)]"></div>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Clinical Review in Progress</span>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {submissions.slice(0, 3).map((submission) => (
                                                <SubmissionCard key={submission.id} submission={submission} setSelectedAssessment={setSelectedAssessment} navigate={navigate} />
                                            ))}
                                        </div>
                                    )}

                                    <button onClick={() => navigate('/dashboard/assessments')} className="md:hidden w-full mt-8 px-6 py-3 bg-white/5 border border-white/20 text-white rounded-full font-black text-xs uppercase tracking-widest hover:bg-[#FFDE59] hover:text-black hover:text-black transition-all">
                                        View All
                                    </button>
                                </div>
                            </>
                        } />

                        <Route path="medications" element={
                            <div className="dashboard-card bg-white/5 border border-white/10 rounded-[32px] p-8 md:p-12">
                                <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6 md:gap-0">
                                    <div>
                                        <h2 className="text-3xl font-black uppercase tracking-tighter  mb-2">
                                            {activeCategories.length === 1
                                                ? activeCategories[0]
                                                : activeCategories.length > 1
                                                    ? 'My Protocols'
                                                    : 'My Medications'}
                                        </h2>
                                        <p className="text-xs text-white/50 font-bold uppercase tracking-widest">
                                            {activeCategories.length === 1
                                                ? `Managing your active ${activeCategories[0]} protocol`
                                                : activeCategories.length > 1
                                                    ? `Managing your ${activeCategories.length} active clinical protocols`
                                                    : "Manage your active clinical protocols"}
                                        </p>
                                    </div>
                                    {submissions.length === 0 ? (
                                        <button onClick={() => navigate('/qualify')} className="px-8 py-4 bg-[#FFDE59] text-black rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-[#111111] transition-all shadow-[0_0_40px_rgba(92,225,230,0.2)]">
                                            Request New Consultation
                                        </button>
                                    ) : (submissions[0]?.approval_status === 'pending' || submissions[0]?.approval_status === 'under_review') ? (
                                        <div className="flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 rounded-full">
                                            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(249,115,22,0.5)]"></div>
                                            <span className="text-[9px] font-black uppercase tracking-widest text-white/50">Clinical Review in Progress</span>
                                        </div>
                                    ) : null}
                                </div>
                                <div className="space-y-6">
                                    {(() => {
                                        // LOGIC: Show ALL active/approved submissions so users can manage multiple protocols (e.g. Weight Loss + Hair)
                                        // Use approvedSubmissions as the source of truth.
                                        let activeDisplayList = approvedSubmissions;

                                        // Fallback: If no approved submissions but profile has a plan, parse it and show legacy/synthetic cards
                                        if (activeDisplayList.length === 0 && profile?.current_plan && profile.current_plan !== 'None') {
                                            try {
                                                // Try parsing as JSON (new format with multiple categories)
                                                const parsedPlans = JSON.parse(profile.current_plan);
                                                activeDisplayList = Object.entries(parsedPlans).map(([category, plan]) => ({
                                                    id: `plan-from-profile-${category}`,
                                                    selected_drug: plan,
                                                    dosage_preference: plan,
                                                    submitted_at: profile.updated_at || new Date().toISOString(),
                                                    approval_status: 'approved',
                                                    dosage: 'Standard Protocol'
                                                }));
                                            } catch {
                                                // If parsing fails, it's the old string format
                                                activeDisplayList = [{
                                                    id: 'plan-from-profile',
                                                    selected_drug: profile.current_plan,
                                                    dosage_preference: profile.current_plan,
                                                    submitted_at: profile.updated_at || new Date().toISOString(),
                                                    approval_status: 'approved',
                                                    dosage: 'Standard Protocol'
                                                }];
                                            }
                                        }

                                        return activeDisplayList.length === 0 ? (
                                            <div className="text-center py-24 border border-dashed border-white/10 rounded-[40px] bg-[#111111]/[0.01]">
                                                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
                                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/30">
                                                        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                    </svg>
                                                </div>
                                                <p className="text-white/30 font-black uppercase tracking-widest text-[10px] mb-8">
                                                    {submissions.length > 0
                                                        ? (submissions[0]?.approval_status === 'pending' || submissions[0]?.approval_status === 'under_review')
                                                            ? "Your initial assessment is currently under clinical review"
                                                            : "No active clinical protocols found"
                                                        : "No active medications found"}
                                                </p>
                                                {submissions.length === 0 ? (
                                                    <button
                                                        onClick={() => navigate('/qualify')}
                                                        className="px-10 py-4 bg-[#FFDE59] text-black rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-[#111111] transition-all"
                                                    >
                                                        Start Assessment
                                                    </button>
                                                ) : (submissions[0]?.approval_status !== 'pending' && submissions[0]?.approval_status !== 'under_review') ? (
                                                    <button
                                                        onClick={() => navigate('/qualify')}
                                                        className="px-10 py-4 bg-[#FFDE59] text-black rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-[#111111] transition-all shadow-[0_0_30px_rgba(92,225,230,0.2)]"
                                                    >
                                                        Retake Assessment
                                                    </button>
                                                ) : (
                                                    <div className="flex flex-col items-center gap-4">
                                                        <div className="flex items-center gap-3 px-8 py-4 bg-white/5 border border-white/10 rounded-full">
                                                            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Clinical Review in Progress</span>
                                                        </div>
                                                        <button
                                                            onClick={() => navigate('/dashboard/assessments')}
                                                            className="text-[9px] font-black uppercase tracking-widest text-white hover:text-white transition-all"
                                                        >
                                                            View Assessment Status →
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            activeDisplayList.map(submission => {
                                                // Determine subscription active status from granular profile map
                                                let isSubscriptionActive = true; // Default to active

                                                if (profile?.subscription_status) {
                                                    try {
                                                        const drug = submission.selected_drug || '';
                                                        let catSlug = 'weight_loss';
                                                        const dLow = drug.toLowerCase();
                                                        if (dLow.includes('hair') || dLow.includes('finasteride') || dLow.includes('minoxidil')) catSlug = 'hair_restoration';
                                                        else if (dLow.includes('sex') || dLow.includes('erectile') || dLow.includes('sildenafil') || dLow.includes('tadalafil') || dLow.includes('oxytocin')) catSlug = 'sexual_health';
                                                        else if (dLow.includes('longevity') || dLow.includes('nad') || dLow.includes('cjc') || dLow.includes('ipamorelin')) catSlug = 'longevity';
                                                        else if (dLow.includes('weight') || dLow.includes('semaglutide') || dLow.includes('tirzepatide')) catSlug = 'weight_loss';

                                                        let statusMap = {};
                                                        const pStatus = profile.subscription_status;
                                                        if (pStatus === true || pStatus === 'true' || (typeof pStatus === 'string' && !pStatus.startsWith('{'))) {
                                                            statusMap = { 'weight_loss': true };
                                                        } else {
                                                            try {
                                                                statusMap = typeof pStatus === 'string' ? JSON.parse(pStatus) : (pStatus || {});
                                                            } catch (err) { statusMap = {}; }
                                                        }

                                                        // Check if subscription is active for this category
                                                        isSubscriptionActive = !!statusMap[catSlug];
                                                    } catch (e) { console.error("Error determining subscription status", e); }
                                                }

                                                return (
                                                    <MedicationCard
                                                        key={submission.id}
                                                        submission={submission}
                                                        isSubscriptionActive={isSubscriptionActive}
                                                        onAction={(type, med) => setActionModal({ isOpen: true, type, medication: med })}
                                                        onRetake={(med) => setRetakeModal({ isOpen: true, submission: med })}
                                                    />
                                                );
                                            })
                                        );
                                    })()}
                                </div>
                            </div>
                        } />

                        <Route path="assessments" element={
                            <div className="dashboard-card bg-white/5 border border-white/10 rounded-[32px] p-8 md:p-12">
                                <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6 md:gap-0">
                                    <div>
                                        <h2 className="text-3xl font-black uppercase tracking-tighter  mb-2">Assessment History</h2>
                                        <p className="text-xs text-white/50 font-bold uppercase tracking-widest">Complete clinical log</p>
                                    </div>
                                    {submissions.length === 0 ? (
                                        <button onClick={() => navigate('/qualify')} className="px-8 py-4 bg-[#FFDE59] text-black rounded-full font-black text-xs uppercase tracking-widest hover:bg-[#111111] transition-all">
                                            New Assessment +
                                        </button>
                                    ) : (submissions[0]?.approval_status !== 'pending' && submissions[0]?.approval_status !== 'under_review') ? (
                                        <button onClick={() => navigate('/qualify')} className="px-8 py-4 bg-[#FFDE59] text-black rounded-full font-black text-xs uppercase tracking-widest hover:bg-[#111111] transition-all shadow-[0_0_30px_rgba(92,225,230,0.1)]">
                                            Retake Assessment
                                        </button>
                                    ) : (
                                        <div className="flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 rounded-full">
                                            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Review in Progress</span>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-6">
                                    {submissions.length === 0 ? (
                                        <div className="text-center py-20 border border-dashed border-white/10 rounded-[32px]">
                                            <p className="text-white/30 font-black uppercase tracking-widest mb-6">No records found</p>
                                        </div>
                                    ) : (
                                        submissions.map(submission => (
                                            <SubmissionCard
                                                key={submission.id}
                                                submission={submission}
                                                setSelectedAssessment={setSelectedAssessment}
                                                navigate={navigate}
                                                onPrescriptionClick={async (providerId) => {
                                                    if (!providerId) {
                                                        alert('Clinician information not yet assigned to this record.');
                                                        return;
                                                    }
                                                    setLoadingPhysician(true);
                                                    const { data, error } = await supabase
                                                        .from('supervising_physicians')
                                                        .select('*')
                                                        .eq('provider_id', providerId)
                                                        .single();

                                                    if (error) {
                                                        console.error('Error fetching physician:', error);
                                                        alert('Could not retrieve clinician details.');
                                                    } else {
                                                        setSelectedPhysician(data);
                                                    }
                                                    setLoadingPhysician(false);
                                                }}
                                            />
                                        ))
                                    )}
                                </div>
                            </div>
                        } />

                        <Route path="orders" element={
                            <OrdersView orders={orders} />
                        } />

                        <Route path="billing" element={
                            <BillingView profile={profile} user={user} />
                        } />

                        <Route path="statements" element={
                            <ProviderStatementsView />
                        } />

                        <Route path="notifications" element={
                            <NotificationsView submissions={submissions} orders={orders} />
                        } />

                        <Route path="settings" element={
                            <SettingsView
                                profile={profile}
                                user={user}
                                onUpdate={fetchProfile}
                                setLastOptimisticUpdate={setLastOptimisticUpdate}
                            />
                        } />
                    </Routes>
                </div>
            </main>

            {/* Phone Verification Modal */}
            {showPhoneVerificationModal && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 md:p-6">
                    <div className="absolute inset-0 bg-[#111111]/95 backdrop-blur-xl" onClick={() => setShowPhoneVerificationModal(false)}></div>
                    <div className="relative w-full max-w-md bg-[#111111] rounded-[40px] shadow-2xl p-10 text-center" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8" style={{ backgroundColor: '#FFDE5915', border: '2px solid #FFDE5940' }}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FFDE59" strokeWidth="2">
                                <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                        </div>
                        <div className="inline-block py-1.5 px-4 bg-black rounded-full text-[9px] font-black uppercase tracking-[0.4em] text-white mb-6">
                            Identity Verification
                        </div>
                        <h3 className="text-3xl font-black uppercase tracking-tighter mb-4" style={{ color: '#ffffff' }}>
                            One Last{' '}
                            <span style={{ backgroundColor: '#FFDE59', color: '#000', padding: '2px 8px', display: 'inline-block' }}>Thing</span>
                        </h3>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-8 leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
                            We've sent a 6-digit code to{' '}
                            <span className="font-black" style={{ color: '#ffffff' }}>{user?.phone}</span>. Please enter it below to confirm your clinical registration.
                        </p>

                        <form onSubmit={handleVerifyPhone} className="space-y-6">
                            <input
                                type="text"
                                maxLength="6"
                                placeholder="0 0 0 0 0 0"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                className="w-full rounded-2xl py-6 text-2xl font-black tracking-[0.5em] text-center outline-none transition-all"
                                style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '2px solid #1a1a1a15', color: '#ffffff' }}
                                onFocus={e => e.target.style.borderColor = '#FFDE59'}
                                onBlur={e => e.target.style.borderColor = '#1a1a1a15'}
                                required
                            />

                            <button
                                type="submit"
                                disabled={verifying || otp.length < 6}
                                className="w-full py-6 rounded-2xl font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50"
                                style={{ backgroundColor: '#000', color: '#fff' }}
                                onMouseEnter={e => { if (!e.currentTarget.disabled) { e.currentTarget.style.backgroundColor = '#FFDE59'; e.currentTarget.style.color = '#1a1a1a'; } }}
                                onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#000'; e.currentTarget.style.color = '#fff'; }}
                            >
                                {verifying ? 'Verifying...' : 'Verify Number →'}
                            </button>
                        </form>

                        <button
                            onClick={resendOtp}
                            className="mt-8 text-[10px] font-black uppercase tracking-widest transition-all hover:opacity-70"
                            style={{ color: 'rgba(255,255,255,0.4)' }}
                        >
                            Didn't receive a code?{' '}
                            <span className="font-black" style={{ color: '#ffffff' }}>Resend</span>
                        </button>
                    </div>
                </div>
            )}


            {/* Assessment Details Modal */}
            {
                selectedAssessment && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 md:p-12">
                        <div
                            className="absolute inset-0 bg-[#111111]/90 backdrop-blur-xl"
                            onClick={() => setSelectedAssessment(null)}
                        ></div>

                        <div className="relative w-full max-w-4xl bg-[#0A0A0A] border border-white/10 rounded-[40px] overflow-hidden shadow-2xl dashboard-card h-[80vh] flex flex-col">
                            {/* Modal Header */}
                            <div className="p-8 border-b border-white/10 flex items-center justify-between">
                                <div>
                                    <h3 className="text-2xl font-black uppercase tracking-tighter  mb-1">
                                        Assessment <span className="text-white">Record</span>
                                    </h3>
                                    <p className="text-[10px] text-white/50 font-black uppercase tracking-widest">
                                        Submitted {new Date(selectedAssessment.submitted_at).toLocaleString()}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedAssessment(null)}
                                    className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/5 transition-all"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                        <path d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                    {/* Left Column: Core Info */}
                                    <div className="space-y-8">
                                        <section>
                                            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white mb-6 border-b border-white/20 pb-2">Protocol Details</h4>
                                            <div className="space-y-4">
                                                <div>
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-1">Target Treatment</p>
                                                    <p className="text-sm font-bold uppercase tracking-tight">{selectedAssessment.selected_drug}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-1">Status</p>
                                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${selectedAssessment.approval_status === 'approved' ? 'bg-[#FFDE59] text-black' : 'bg-orange-500/10 text-orange-400'
                                                        }`}>
                                                        {selectedAssessment.approval_status}
                                                    </span>
                                                </div>
                                            </div>
                                        </section>

                                        <section>
                                            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white mb-6 border-b border-white/20 pb-2">Clinical Biometrics</h4>
                                            <div className="grid grid-cols-2 gap-6">
                                                <div>
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-1">Sex</p>
                                                    <p className="text-sm font-bold capitalize">{selectedAssessment.sex || 'Not provided'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-1">Birthday</p>
                                                    <p className="text-sm font-bold">{(() => {
                                                        const raw = selectedAssessment.birthday
                                                            || selectedAssessment.intake_data?.date_of_birth
                                                            || selectedAssessment.intake_data?.eligibility?.dob
                                                            || selectedAssessment.intake_data?.dob;
                                                        if (!raw) return 'Not provided';
                                                        // Format ISO dates (YYYY-MM-DD) to a readable form
                                                        const d = new Date(raw);
                                                        if (!isNaN(d.getTime())) {
                                                            return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
                                                        }
                                                        return raw;
                                                    })()}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-1">Weight</p>
                                                    <p className="text-sm font-bold">{selectedAssessment.weight ? `${selectedAssessment.weight} lbs` : 'Not provided'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-1">BMI Score</p>
                                                    <p className="text-sm font-bold">{selectedAssessment.bmi || 'Not computed'}</p>
                                                </div>
                                            </div>
                                        </section>
                                    </div>

                                    {/* Right Column: Goals & Shipping */}
                                    <div className="space-y-8">
                                        <section>
                                            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white mb-6 border-b border-white/20 pb-2">Wellness Goals</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedAssessment.goals?.map((goalId, i) => {
                                                    const categoryId = getMedicationCategoryId(selectedAssessment.selected_drug);
                                                    const goalName = categoryQuestions[categoryId]?.improvements?.find(imp => imp.id === goalId)?.name || goalId;
                                                    return (
                                                        <span key={i} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-tight">
                                                            {goalName}
                                                        </span>
                                                    );
                                                }) || <p className="text-white/50 text-xs ">No goals listed</p>}

                                                {/* Custom Goal Rendering */}
                                                {(selectedAssessment.custom_goal || selectedAssessment.other_goal_details || (selectedAssessment.intake_data && (selectedAssessment.intake_data.other_goal_details || selectedAssessment.intake_data.other_goals))) && (
                                                    <div className="mt-4 w-full p-6 bg-white/5 rounded-2xl border border-white/10 border-dashed">
                                                        <p className="text-[9px] font-black uppercase tracking-widest text-[#FFDE59] mb-2">Narrative / Custom Goal</p>
                                                        <p className="text-xs text-white/70 italic leading-relaxed font-medium">
                                                            "{selectedAssessment.custom_goal || selectedAssessment.other_goal_details || (selectedAssessment.intake_data?.other_goal_details || selectedAssessment.intake_data?.other_goals)}"
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </section>

                                        <section>
                                            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white mb-6 border-b border-white/20 pb-2">Fulfillment Details</h4>
                                            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                                                <div className="space-y-4">
                                                    <div>
                                                        <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-1">Recipient</p>
                                                        <p className="text-sm font-bold">{selectedAssessment.shipping_first_name} {selectedAssessment.shipping_last_name}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-1">Address</p>
                                                        <p className="text-xs text-white/60 leading-relaxed uppercase tracking-tight font-medium">
                                                            {selectedAssessment.shipping_address}<br />
                                                            {selectedAssessment.shipping_city}, {selectedAssessment.shipping_state} {selectedAssessment.shipping_zip}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </section>
                                    </div>
                                </div>

                                {/* Clinical Intake Responses */}
                                <div className="mt-12 pt-12 border-t border-white/10">
                                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white mb-8 border-b border-white/20 pb-2">Clinical Intake Responses</h4>

                                    {(() => {
                                        // Robust data merging to catch all answers across different schemas
                                        const combinedData = {
                                            ...selectedAssessment,
                                            ...(selectedAssessment.intake_data || {}),
                                            ...(selectedAssessment.medical_responses || {}),
                                        };

                                        // Deep merge common sub-objects if they exist
                                        if (selectedAssessment.intake_data?.eligibility) {
                                            Object.assign(combinedData, selectedAssessment.intake_data.eligibility);
                                        }
                                        if (selectedAssessment.intake_data?.shipping) {
                                            Object.assign(combinedData, selectedAssessment.intake_data.shipping);
                                        }

                                        const categoryId = getMedicationCategoryId(selectedAssessment.selected_drug);
                                        const questions = intakeQuestions[categoryId] || intakeQuestions['weight-loss'];

                                        // Track displayed keys to identify "unmapped" data
                                        const displayedKeys = new Set([
                                            'id', 'user_id', 'submitted_at', 'approval_status', 'shipping_address', 'shipping_city',
                                            'shipping_state', 'shipping_zip', 'shipping_first_name', 'shipping_last_name',
                                            'shipping_phone', 'shipping_email', 'selected_drug', 'category', 'intake_data',
                                            'medical_responses', 'lab_results_url', 'glp1_prescription_url', 'identification_url',
                                            'height_feet', 'height_inches', 'weight', 'bmi', 'sex', 'birthday', 'goals', 'email', 'custom_goal'
                                        ]);

                                        return (
                                            <div className="space-y-6">
                                                <div className="grid grid-cols-1 gap-4">
                                                    {questions.map((q) => {
                                                        if (q.type === 'info') return null;

                                                        let answer = combinedData[q.id];
                                                        if (answer === undefined || answer === null || answer === '') return null;

                                                        displayedKeys.add(q.id);
                                                        const details = combinedData[`${q.id}_details`] || combinedData[`${q.id}_info`];
                                                        if (details) displayedKeys.add(`${q.id}_details`);

                                                        return (
                                                            <div key={q.id} className="group/resp p-6 bg-white/5 border border-white/10 rounded-3xl hover:border-[#FFDE59]/30 transition-all">
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                                                                    <div>
                                                                        <p className="text-[10px] font-black uppercase tracking-widest text-[#FFDE59] mb-3">Clinical Question</p>
                                                                        <p className="text-xs font-bold text-white/90 leading-relaxed">{q.question}</p>
                                                                    </div>
                                                                    <div className="md:pl-8 md:border-l border-white/10">
                                                                        <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-3">Patient Response</p>
                                                                        <div className="text-xs font-black uppercase tracking-tight text-white leading-relaxed">
                                                                            {Array.isArray(answer) ? (
                                                                                <ul className="list-disc list-inside space-y-2">
                                                                                    {answer.map((item, i) => <li key={i}>{item}</li>)}
                                                                                </ul>
                                                                            ) : (
                                                                                <span className="bg-[#FFDE59]/10 text-[#FFDE59] px-3 py-1.5 rounded-lg border border-[#FFDE59]/20">
                                                                                    {answer.toString()}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        {details && (
                                                                            <div className="mt-6 pt-6 border-t border-white/10">
                                                                                <p className="text-[9px] text-white/40 font-black uppercase tracking-widest mb-3">Internal Narrative</p>
                                                                                <p className="text-[11px] text-white/70 font-medium leading-relaxed italic">"{details}"</p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                {/* Overflow Section for unmapped data */}
                                                {Object.entries(combinedData).some(([key, val]) => {
                                                    if (displayedKeys.has(key) || key.startsWith('__')) return false;
                                                    if (typeof val === 'object' && val !== null) return false;
                                                    if (val === undefined || val === null || val === '') return false;
                                                    return true;
                                                }) && (
                                                        <div className="mt-12">
                                                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-6 flex items-center gap-4">
                                                                <span>Supplementry Clinical Markers</span>
                                                                <div className="h-px flex-1 bg-white/5"></div>
                                                            </h4>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                {Object.entries(combinedData).map(([key, val]) => {
                                                                    if (displayedKeys.has(key) || key.startsWith('__')) return null;
                                                                    if (typeof val === 'object' && val !== null) return null;
                                                                    if (val === undefined || val === null || val === '') return null;

                                                                    return (
                                                                        <div key={key} className="p-4 bg-white/5 border border-white/5 rounded-2xl flex justify-between items-center">
                                                                            <p className="text-[9px] font-black uppercase tracking-widest text-white/40">{key.replace(/_/g, ' ')}</p>
                                                                            <p className="text-[11px] font-bold text-white uppercase tracking-tight">{val.toString()}</p>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-8 border-t border-white/10 bg-[#111111]/50">
                                <button
                                    onClick={() => setSelectedAssessment(null)}
                                    className="w-full bg-[#111111] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#FFDE59] hover:text-black transition-all"
                                >
                                    Close Record
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }



            {/* Retake Warning Modal */}
            {retakeModal.isOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm">
                    <div className="bg-[#111111] border border-red-500/20 rounded-[32px] max-w-md w-full p-8 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 blur-[80px] -mr-32 -mt-32 rounded-full pointer-events-none"></div>

                        <div className="w-16 h-16 rounded-3xl bg-red-500/10 flex items-center justify-center border border-red-500/20 mb-6 mx-auto">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500">
                                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>

                        <div className="text-center mb-8">
                            <h3 className="text-2xl font-black uppercase tracking-tighter  text-white mb-3">Warning: Action Cannot Be Undone</h3>
                            <p className="text-sm text-white/60 font-medium leading-relaxed">
                                Are you sure you want to retake your assessment? This will <span className="text-red-400 font-bold">permanently delete</span> your previous submission and approval status for this protocol.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={handleRetakeSubmit}
                                className="w-full py-4 bg-red-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-600 transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                            >
                                Confirm & Delete
                            </button>
                            <button
                                onClick={() => setRetakeModal({ isOpen: false, submission: null })}
                                className="w-full py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/5 transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <MedicationActionModal
                isOpen={actionModal.isOpen}
                type={actionModal.type}
                medication={actionModal.medication}
                loading={actionLoading}
                onClose={() => setActionModal({ isOpen: false, type: null, medication: null })}
                onSubmit={handleActionSubmit}
            />
            {/* Physician Details Modal */}
            {selectedPhysician && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-[#111111]/95 backdrop-blur-2xl" onClick={() => setSelectedPhysician(null)}></div>
                    <div className="relative w-full max-w-lg bg-[#0A0A0A] border border-white/10 rounded-[40px] overflow-hidden shadow-2xl dashboard-card p-10">
                        <div className="text-center mb-10">
                            <div className="w-20 h-20 rounded-full bg-white/5 border border-white/20 flex items-center justify-center mx-auto mb-6">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white">
                                    <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-black uppercase tracking-tighter  mb-2">Prescribing <span className="text-white">Authority</span></h3>
                            <p className="text-[10px] text-white/50 font-black uppercase tracking-widest">Official Clinical Credentials</p>
                        </div>

                        <div className="space-y-6">
                            <div className="p-6 bg-white/5 border border-white/10 rounded-3xl group hover:border-[#FFDE59]/40 transition-all">
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 mb-2">Full Name & Title</p>
                                <p className="text-lg font-bold text-white tracking-tight">{selectedPhysician.supervising_physician_name}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-5 bg-white/5 border border-white/10 rounded-3xl">
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 mb-2">License #</p>
                                    <p className="text-xs font-black tracking-widest text-white">{selectedPhysician.supervising_license_number}</p>
                                </div>
                                <div className="p-5 bg-white/5 border border-white/10 rounded-3xl">
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 mb-2">NPI #</p>
                                    <p className="text-xs font-black tracking-widest text-white">{selectedPhysician.supervising_npi_number}</p>
                                </div>
                            </div>

                            <div className="p-6 bg-white/5 border border-white/10 rounded-3xl border-dashed">
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-red-400/60 mb-2">DEA Registration</p>
                                <p className="text-sm font-black tracking-[0.3em] text-white/80">{selectedPhysician.supervising_dea_number}</p>
                            </div>
                        </div>

                        <button
                            onClick={() => setSelectedPhysician(null)}
                            className="w-full mt-10 py-5 bg-[#111111] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#FFDE59] hover:text-black transition-all"
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────
// PROVIDER STATEMENTS VIEW
// ─────────────────────────────────────────────────────────────
const ProviderStatementsView = () => {
    const { user } = useAuth();
    const [statements, setStatements] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [selectedStmt, setSelectedStmt] = React.useState(null);

    React.useEffect(() => {
        const fetchStatements = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('provider_statements')
                    .select('*')
                    .eq('status', 'approved')
                    .order('year', { ascending: false })
                    .order('month', { ascending: false });
                if (!error) setStatements(data || []);
            } catch (err) {
                console.error('Provider statements error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchStatements();
    }, []);

    const fmtMoney = (v) => `$${Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    if (loading) return (
        <div className="py-20 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-[#FFDE59]/30 border-t-[#FFDE59] rounded-full animate-spin" />
        </div>
    );

    if (statements.length === 0) return (
        <div className="text-center py-24 border-2 border-dashed border-white/10 rounded-3xl">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" className="mx-auto mb-4">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/30">No statements available yet</p>
            <p className="text-[9px] text-white/20 mt-2">Statements are released on the 5th of each month after admin review</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div>
                <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-2">
                    Monthly <span style={{ backgroundColor: '#FFDE59', color: '#000', padding: '0 8px' }}>Statements</span>
                </h2>
                <p className="text-xs text-white/40 font-bold uppercase tracking-widest">Your monthly compensation statements — released on the 5th of each month</p>
            </div>

            <div className="space-y-4">
                {statements.map(stmt => (
                    <div key={stmt.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-white/20 transition-all">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-[#FFDE59]/10 flex items-center justify-center shrink-0">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFDE59" strokeWidth="2.5">
                                    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-base font-black text-white">{stmt.period_label || `${stmt.month_name} ${stmt.year}`}</p>
                                <p className="text-[10px] text-white/40 uppercase tracking-wider mt-0.5">{stmt.statement_number} · {stmt.new_patient_count ?? 0} new + {stmt.recurring_patient_count ?? 0} recurring</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <p className="text-[9px] text-white/30 uppercase font-black tracking-widest mb-1">Total Payout</p>
                                <p className="text-2xl font-black text-[#FFDE59]">{fmtMoney(stmt.total_payout)}</p>
                            </div>
                            <button
                                onClick={() => setSelectedStmt(stmt)}
                                className="px-5 py-2.5 bg-[#FFDE59] text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all"
                            >
                                View Statement
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Statement Document Modal */}
            {selectedStmt && (
                <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-3xl flex items-start justify-center p-4 md:p-8 overflow-y-auto animate-in fade-in duration-300">
                    <div className="w-full max-w-4xl">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tight text-white">{selectedStmt.period_label}</h3>
                                <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">{selectedStmt.statement_number}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => window.print()}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                                    Print
                                </button>
                                <button
                                    onClick={() => setSelectedStmt(null)}
                                    className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/5 transition-all"
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
                                </button>
                            </div>
                        </div>

                        {/* Render the Statement Document */}
                        <div style={{ backgroundColor: '#e5e7eb', padding: '32px', borderRadius: '24px' }}>
                            {/* Inline statement rendering — same style as StatementDocument */}
                            {(() => {
                                const stmt = selectedStmt;
                                const rates = { new_patient_rate: stmt.new_patient_rate ?? 5, recurring_patient_rate: stmt.recurring_patient_rate ?? 5 };
                                const periodLabel = stmt.period_label || `${stmt.month_name} ${stmt.year}`;
                                const newTotal = rates.new_patient_rate * (stmt.new_patient_count ?? 0);
                                const recurringTotal = rates.recurring_patient_rate * (stmt.recurring_patient_count ?? 0);
                                const grandTotal = stmt.total_payout ?? (newTotal + recurringTotal);
                                const pageStyle = { backgroundColor: '#fff', color: '#111', fontFamily: 'Georgia, serif', padding: '48px 56px', minHeight: '900px', position: 'relative', borderRadius: '24px', border: '1px solid rgba(0,0,0,0.08)', marginBottom: '24px' };

                                return (
                                    <div>
                                        {/* Page 1 */}
                                        <div style={pageStyle}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '48px' }}>
                                                <div>
                                                    <div style={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.3em', color: '#888', marginBottom: '6px' }}>PROVIDER COMPENSATION STATEMENT</div>
                                                    <div style={{ fontSize: '28px', fontWeight: '900', color: '#111', letterSpacing: '-0.03em' }}>{periodLabel}</div>
                                                    <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>Statement #{stmt.statement_number || stmt.id?.slice(0, 8).toUpperCase()}</div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontSize: '36px', fontWeight: '900', letterSpacing: '-0.04em', color: '#111', lineHeight: 1 }}>
                                                        <span style={{ fontStyle: 'italic', fontWeight: '400', opacity: 0.7 }}>u</span>Glow<sup style={{ fontSize: '16px', fontWeight: '700' }}>MD</sup>
                                                    </div>
                                                    <div style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.35em', color: '#999', marginTop: '4px' }}>uGlowMD · Provider Portal</div>
                                                </div>
                                            </div>
                                            <div style={{ height: '1px', backgroundColor: '#e5e5e5', marginBottom: '40px' }} />
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', marginBottom: '48px' }}>
                                                <div><div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#888', marginBottom: '4px' }}>Statement Period</div><div style={{ fontSize: '14px', fontWeight: '700', color: '#111' }}>{periodLabel}</div></div>
                                                <div><div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#888', marginBottom: '4px' }}>Release Date</div><div style={{ fontSize: '14px', fontWeight: '700', color: '#111' }}>{stmt.release_date ? new Date(stmt.release_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'}</div></div>
                                                <div><div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#888', marginBottom: '4px' }}>Status</div><div style={{ display: 'inline-block', padding: '4px 14px', borderRadius: '999px', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', backgroundColor: '#dcfce7', color: '#16a34a' }}>Approved</div></div>
                                            </div>
                                            <div style={{ backgroundColor: '#f9f9f9', borderRadius: '16px', overflow: 'hidden', marginBottom: '32px' }}>
                                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                                                    <thead>
                                                        <tr style={{ backgroundColor: '#111', color: '#fff' }}>
                                                            <th style={{ padding: '16px 24px', textAlign: 'left', fontWeight: '900', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Description</th>
                                                            <th style={{ padding: '16px 24px', textAlign: 'center', fontWeight: '900', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Count</th>
                                                            <th style={{ padding: '16px 24px', textAlign: 'center', fontWeight: '900', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Rate</th>
                                                            <th style={{ padding: '16px 24px', textAlign: 'right', fontWeight: '900', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Amount</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <tr style={{ borderBottom: '1px solid #e5e5e5' }}>
                                                            <td style={{ padding: '20px 24px' }}><div style={{ fontWeight: '700' }}>New Patient Eligibility</div><div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>Patients enrolled for the first time in {periodLabel}</div></td>
                                                            <td style={{ padding: '20px 24px', textAlign: 'center', fontWeight: '900', fontSize: '18px' }}>{stmt.new_patient_count ?? 0}</td>
                                                            <td style={{ padding: '20px 24px', textAlign: 'center', color: '#555' }}>{fmtMoney(rates.new_patient_rate)} / patient</td>
                                                            <td style={{ padding: '20px 24px', textAlign: 'right', fontWeight: '900', fontSize: '16px' }}>{fmtMoney(newTotal)}</td>
                                                        </tr>
                                                        <tr>
                                                            <td style={{ padding: '20px 24px' }}><div style={{ fontWeight: '700' }}>Recurring Active Subscribers</div><div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>Active subscribers with recurring billing in {periodLabel}</div></td>
                                                            <td style={{ padding: '20px 24px', textAlign: 'center', fontWeight: '900', fontSize: '18px' }}>{stmt.recurring_patient_count ?? 0}</td>
                                                            <td style={{ padding: '20px 24px', textAlign: 'center', color: '#555' }}>{fmtMoney(rates.recurring_patient_rate)} / subscriber</td>
                                                            <td style={{ padding: '20px 24px', textAlign: 'right', fontWeight: '900', fontSize: '16px' }}>{fmtMoney(recurringTotal)}</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                                <div style={{ backgroundColor: '#111', color: '#fff', borderRadius: '16px', padding: '24px 40px', textAlign: 'right', minWidth: '280px' }}>
                                                    <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.3em', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>Total Payout to Provider</div>
                                                    <div style={{ fontSize: '40px', fontWeight: '900', letterSpacing: '-0.03em', color: '#FFDE59' }}>{fmtMoney(grandTotal)}</div>
                                                </div>
                                            </div>
                                            <div style={{ position: 'absolute', bottom: '32px', left: '56px', right: '56px', borderTop: '1px solid #eee', paddingTop: '16px', display: 'flex', justifyContent: 'space-between' }}>
                                                <div style={{ fontSize: '11px', color: '#bbb' }}>uGlowMD · Provider Compensation · Confidential</div>
                                                <div style={{ fontSize: '11px', color: '#bbb' }}>Page 1 of 2</div>
                                            </div>
                                        </div>

                                        {/* Page 2 — Patient Roster */}
                                        <div style={{ ...pageStyle, marginBottom: 0 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
                                                <div><div style={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.3em', color: '#888', marginBottom: '6px' }}>PATIENT DETAIL — {periodLabel}</div><div style={{ fontSize: '22px', fontWeight: '900', color: '#111', letterSpacing: '-0.02em' }}>New & Recurring Patient Roster</div></div>
                                                <div style={{ fontSize: '30px', fontWeight: '900', letterSpacing: '-0.04em', color: '#111', lineHeight: 1 }}><span style={{ fontStyle: 'italic', fontWeight: '400', opacity: 0.7 }}>u</span>Glow<sup style={{ fontSize: '14px', fontWeight: '700' }}>MD</sup></div>
                                            </div>
                                            <div style={{ height: '1px', backgroundColor: '#e5e5e5', marginBottom: '32px' }} />

                                            {/* New Patients */}
                                            <div style={{ marginBottom: '40px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                                    <div style={{ fontSize: '13px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#111' }}>New Patients — {stmt.new_patient_count ?? 0} total</div>
                                                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#555' }}>{fmtMoney(rates.new_patient_rate)} each</div>
                                                </div>
                                                {(stmt.new_patients_list?.length > 0) ? (
                                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                                        <thead><tr style={{ backgroundColor: '#f3f4f6' }}><th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#666' }}>#</th><th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#666' }}>Patient Name</th><th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#666' }}>Email</th><th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#666' }}>Join Date</th><th style={{ padding: '10px 16px', textAlign: 'right', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#666' }}>Amount</th></tr></thead>
                                                        <tbody>{stmt.new_patients_list.map((p, i) => (<tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}><td style={{ padding: '10px 16px', color: '#888' }}>{i + 1}</td><td style={{ padding: '10px 16px', fontWeight: '600' }}>{p.name || 'N/A'}</td><td style={{ padding: '10px 16px', color: '#555', fontSize: '12px' }}>{p.email || '—'}</td><td style={{ padding: '10px 16px', color: '#555', fontSize: '12px' }}>{p.joined ? new Date(p.joined).toLocaleDateString() : '—'}</td><td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: '700' }}>{fmtMoney(rates.new_patient_rate)}</td></tr>))}</tbody>
                                                    </table>
                                                ) : <div style={{ padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '12px', textAlign: 'center', color: '#aaa', fontSize: '12px' }}>Roster not available for this period</div>}
                                            </div>

                                            {/* Recurring Patients */}
                                            <div style={{ marginBottom: '40px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                                    <div style={{ fontSize: '13px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#111' }}>Recurring Subscribers — {stmt.recurring_patient_count ?? 0} total</div>
                                                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#555' }}>{fmtMoney(rates.recurring_patient_rate)} each</div>
                                                </div>
                                                {(stmt.recurring_patients_list?.length > 0) ? (
                                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                                        <thead><tr style={{ backgroundColor: '#f3f4f6' }}><th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#666' }}>#</th><th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#666' }}>Patient Name</th><th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#666' }}>Email</th><th style={{ padding: '10px 16px', textAlign: 'right', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#666' }}>Amount</th></tr></thead>
                                                        <tbody>{stmt.recurring_patients_list.map((p, i) => (<tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}><td style={{ padding: '10px 16px', color: '#888' }}>{i + 1}</td><td style={{ padding: '10px 16px', fontWeight: '600' }}>{p.name || 'N/A'}</td><td style={{ padding: '10px 16px', color: '#555', fontSize: '12px' }}>{p.email || '—'}</td><td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: '700' }}>{fmtMoney(rates.recurring_patient_rate)}</td></tr>))}</tbody>
                                                    </table>
                                                ) : <div style={{ padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '12px', textAlign: 'center', color: '#aaa', fontSize: '12px' }}>Roster not available for this period</div>}
                                            </div>

                                            {/* Grand Total Page 2 */}
                                            <div style={{ borderTop: '2px solid #111', paddingTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.3em', color: '#888', marginBottom: '8px' }}>Total Payout to Provider</div>
                                                    <div style={{ fontSize: '36px', fontWeight: '900', letterSpacing: '-0.03em', color: '#111' }}>{fmtMoney(grandTotal)}</div>
                                                    <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>{stmt.new_patient_count ?? 0} new + {stmt.recurring_patient_count ?? 0} recurring patients</div>
                                                </div>
                                            </div>
                                            <div style={{ position: 'absolute', bottom: '32px', left: '56px', right: '56px', borderTop: '1px solid #eee', paddingTop: '16px', display: 'flex', justifyContent: 'space-between' }}>
                                                <div style={{ fontSize: '11px', color: '#bbb' }}>uGlowMD · Provider Compensation · Confidential</div>
                                                <div style={{ fontSize: '11px', color: '#bbb' }}>Page 2 of 2</div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;

