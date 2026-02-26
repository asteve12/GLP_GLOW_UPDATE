import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Link, useNavigate } from 'react-router-dom';

const categories = [
    {
        id: 'weight-loss',
        title: 'Weight Loss',
        products: [
            'Semaglutide Injection',
            'Tirzepatide Injection',
            'Semaglutide Sublingual Drops',
            'Tirzepatide Sublingual Drops'
        ]
    },
    {
        id: 'sexual-health',
        title: 'Sexual Health',
        products: [
            'Sildenafil Tablets',
            'Tadalafil Tablets',
            'Sildenafil & Tadalafil Combination',
            'Sildenafil & Yohimbe Troche',
            'Oxytocin Troche',
            'Oxytocin Nasal Spray'
        ]
    },
    {
        id: 'hair-restoration',
        title: 'Hair Restoration',
        products: [
            'Finasteride Tablets',
            'Finasteride & Minoxidil Topical Spray',
            '3-in-1 Hair Solution',
            '5-in-1 Hair Growth Protocol'
        ]
    },
    {
        id: 'longevity',
        title: 'Longevity & Wellness',
        products: [
            'NAD+ Subcutaneous Injection',
            'Glutathione Injection',
            'NAD+ Nasal Spray',
            'CJC-1295 & Ipamorelin'
        ]
    }
];

const SatisfactionSurvey = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Category, 2: Product, 3: Survey
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [formData, setFormData] = useState({
        email: '',
        progressRating: '',
        startingWeight: '',
        weightLost: '',
        startDate: '',
        endDate: '',
        satisfied: '',
        additionalNotes: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState(null);

    const handleCategorySelect = (cat) => {
        setSelectedCategory(cat);
        setStep(2);
    };

    const handleProductSelect = (product) => {
        setSelectedProduct(product);
        setStep(3);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        // Validation: Maximum 31 days check
        if (formData.startDate && formData.endDate) {
            const start = new Date(formData.startDate);
            const end = new Date(formData.endDate);
            const diffTime = Math.abs(end - start);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays > 31) {
                setError('Maximum period allowed is 31 days from start date.');
                setSubmitting(false);
                return;
            }
            if (end < start) {
                setError('End date cannot be before start date.');
                setSubmitting(false);
                return;
            }
        }

        if (!formData.email || !formData.progressRating || !formData.startDate || !formData.endDate) {
            setError('Please fill in all required fields marked with *');
            setSubmitting(false);
            return;
        }

        try {
            const payload = {
                email: formData.email,
                category: selectedCategory.id,
                product: selectedProduct,
                progress_rating: formData.progressRating,
                starting_weight: formData.startingWeight ? parseFloat(formData.startingWeight) : 0,
                weight_lost: formData.weightLost ? parseFloat(formData.weightLost) : 0,
                start_date: formData.startDate,
                end_date: formData.endDate,
                satisfied_with_medication: formData.satisfied || 'Yes',
                additional_notes: formData.additionalNotes,
                submitted_at: new Date().toISOString()
            };

            const { error: submitError } = await supabase
                .from('questionnaire_responses')
                .insert([payload]);

            if (submitError) throw submitError;
            setSubmitted(true);
        } catch (err) {
            console.error('Error submitting survey:', err);
            setError('Failed to submit. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-700">
                <div className="w-24 h-24 bg-accent-green/10 border border-accent-green/20 rounded-full flex items-center justify-center mb-8">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-accent-green">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                </div>
                <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter mb-6">Progress <span className="text-accent-green">Recorded.</span></h2>
                <p className="text-white/40 font-bold uppercase tracking-widest max-w-md mb-12 leading-relaxed">
                    Thank you for sharing your journey. Your update has been logged for medical review.
                </p>
                <button
                    onClick={() => navigate('/')}
                    className="px-10 py-5 bg-accent-green text-black rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-white transition-all shadow-[0_0_40px_rgba(191,255,0,0.3)]"
                >
                    Return Home
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-accent-green selection:text-black pt-32 pb-20">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5 px-8 py-6">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <Link to="/" className="text-2xl font-black uppercase tracking-tighter italic hover:text-accent-green transition-colors">
                        <span className="font-brand font-bold italic-u">u</span><span className="font-brand font-bold">Glow<sup>MD</sup></span>
                    </Link>
                    <button onClick={() => step > 1 ? setStep(step - 1) : navigate('/dashboard')} className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors">
                        {step > 1 ? 'Go Back' : 'Exit'}
                    </button>
                </div>
            </header>

            <div className="max-w-3xl mx-auto px-6">
                <div className="text-center mb-16 animate-in slide-in-from-bottom-8 duration-700">
                    <div className="inline-block py-2 px-6 bg-accent-green/10 border border-accent-green/20 rounded-full text-[10px] font-black uppercase tracking-[0.4em] text-accent-green mb-8">
                        Step {step} of 3
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic mb-6 leading-[0.9]">
                        Track <span className="text-accent-green">Progress.</span>
                    </h1>
                    <p className="text-white/40 font-bold uppercase tracking-widest text-xs max-w-md mx-auto leading-relaxed">
                        {step === 1 ? 'Select your protocol category to begin.' :
                            step === 2 ? `Which ${selectedCategory.title} medication are you using?` :
                                `Help us track your progress by answering a few questions about your ${selectedCategory.title.toLowerCase()} journey.`}
                    </p>
                </div>

                {step === 1 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => handleCategorySelect(cat)}
                                className="bg-white/[0.03] border border-white/5 hover:border-accent-green/50 p-8 rounded-[40px] text-left transition-all hover:bg-white/[0.05] group"
                            >
                                <h3 className="text-2xl font-black uppercase italic tracking-tighter group-hover:text-accent-green transition-colors">{cat.title}</h3>
                                <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mt-2">Select Category</p>
                            </button>
                        ))}
                    </div>
                )}

                {step === 2 && (
                    <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {selectedCategory.products.map((product) => (
                            <button
                                key={product}
                                onClick={() => handleProductSelect(product)}
                                className="bg-white/[0.03] border border-white/5 hover:border-accent-green/50 p-8 rounded-[40px] text-left transition-all hover:bg-white/[0.05] group flex items-center justify-between"
                            >
                                <span className="text-xl font-bold uppercase italic tracking-tight">{product}</span>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-white/20 group-hover:text-accent-green transition-colors">
                                    <path d="M9 18l6-6-6-6" />
                                </svg>
                            </button>
                        ))}
                    </div>
                )}

                {step === 3 && (
                    <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-accent-green/5 border border-accent-green/20 p-6 rounded-3xl flex items-center justify-between">
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-accent-green/60 mb-1">Current Protocol</p>
                                <p className="text-sm font-bold text-accent-green uppercase tracking-wide">{selectedProduct}</p>
                            </div>
                            <button type="button" onClick={() => setStep(2)} className="text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-white underline underline-offset-4">Change</button>
                        </div>

                        {/* Email Address */}
                        <div className="bg-white/[0.03] border border-white/5 p-8 rounded-[40px]">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-4 ml-4">Email Address*</label>
                            <input
                                type="email"
                                name="email"
                                placeholder="your.email@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="w-full bg-black/20 border border-white/10 rounded-2xl py-5 px-8 text-white focus:outline-none focus:border-accent-green transition-all font-bold placeholder:text-white/20"
                            />
                        </div>

                        {/* How is it going? */}
                        <div className="bg-white/[0.03] border border-white/5 p-8 rounded-[40px]">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-6 ml-4">
                                {`How is your ${selectedCategory.title.toLowerCase()} going this month?*`}
                            </label>
                            <div className="space-y-3">
                                {[
                                    { value: 'Excellent', label: 'Excellent - Exceeding my goals' },
                                    { value: 'Good', label: 'Good - Meeting my goals' },
                                    { value: 'Fair', label: 'Fair - Some progress but slower than expected' },
                                    { value: 'Poor', label: 'Poor - Little to no progress' }
                                ].map((opt) => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, progressRating: opt.value }))}
                                        className={`w-full text-left p-6 rounded-2xl border transition-all ${formData.progressRating === opt.value
                                            ? 'bg-accent-green text-black border-accent-green'
                                            : 'bg-white/5 text-white/60 border-transparent hover:bg-white/10'
                                            }`}
                                    >
                                        <span className="font-bold text-xs uppercase tracking-wide">{opt.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Weight Loss Specific Fields */}
                        {selectedCategory.id === 'weight-loss' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white/[0.03] border border-white/5 p-8 rounded-[40px]">
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-4 ml-4">Starting Weight (lbs)</label>
                                    <input
                                        type="number"
                                        name="startingWeight"
                                        placeholder="0"
                                        value={formData.startingWeight}
                                        onChange={handleChange}
                                        className="w-full bg-black/20 border border-white/10 rounded-2xl py-5 px-8 text-white focus:outline-none focus:border-accent-green transition-all font-bold placeholder:text-white/20"
                                    />
                                </div>
                                <div className="bg-white/[0.03] border border-white/5 p-8 rounded-[40px]">
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-4 ml-4">Weight Lost (lbs)</label>
                                    <input
                                        type="number"
                                        name="weightLost"
                                        placeholder="0"
                                        value={formData.weightLost}
                                        onChange={handleChange}
                                        className="w-full bg-black/20 border border-white/10 rounded-2xl py-5 px-8 text-white focus:outline-none focus:border-accent-green transition-all font-bold placeholder:text-white/20"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Date Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white/[0.03] border border-white/5 p-8 rounded-[40px]">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-4 ml-4">Start Date*</label>
                                <input
                                    type="date"
                                    name="startDate"
                                    value={formData.startDate}
                                    onChange={handleChange}
                                    onClick={(e) => e.target.showPicker?.()}
                                    required
                                    className="w-full bg-black/20 border border-white/10 rounded-2xl py-5 px-8 text-white focus:outline-none focus:border-accent-green transition-all font-bold cursor-pointer [color-scheme:dark]"
                                />
                            </div>
                            <div className="bg-white/[0.03] border border-white/5 p-8 rounded-[40px]">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-4 ml-4">End Date*</label>
                                <input
                                    type="date"
                                    name="endDate"
                                    value={formData.endDate}
                                    onChange={handleChange}
                                    onClick={(e) => e.target.showPicker?.()}
                                    required
                                    className="w-full bg-black/20 border border-white/10 rounded-2xl py-5 px-8 text-white focus:outline-none focus:border-accent-green transition-all font-bold cursor-pointer [color-scheme:dark]"
                                />
                                <p className="mt-3 ml-4 text-[8px] font-black uppercase tracking-[0.2em] text-white/20">Maximum 31 days from start date</p>
                            </div>
                        </div>

                        {/* Satisfaction */}
                        <div className="bg-white/[0.03] border border-white/5 p-8 rounded-[40px]">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-6 ml-4">
                                Are you satisfied with your current medication type and/or dosage?
                            </label>
                            <div className="flex flex-col md:flex-row gap-4">
                                {['Yes - I\'m satisfied', 'No - I\'d like to make changes'].map((opt) => (
                                    <button
                                        key={opt}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, satisfied: opt.split(' - ')[0] }))}
                                        className={`flex-1 p-6 rounded-2xl border transition-all ${formData.satisfied === opt.split(' - ')[0]
                                            ? 'bg-accent-green text-black border-accent-green shadow-[0_0_30px_rgba(191,255,0,0.2)]'
                                            : 'bg-white/5 text-white/60 border-transparent hover:bg-white/10'
                                            }`}
                                    >
                                        <span className="font-bold text-xs uppercase tracking-wide">{opt}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Additional Notes */}
                        <div className="bg-white/[0.03] border border-white/5 p-8 rounded-[40px]">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-4 ml-4">Additional Notes (Optional)</label>
                            <textarea
                                name="additionalNotes"
                                placeholder="Any additional information you'd like to share..."
                                value={formData.additionalNotes}
                                onChange={handleChange}
                                rows={4}
                                className="w-full bg-black/20 border border-white/10 rounded-2xl py-5 px-8 text-white focus:outline-none focus:border-accent-green transition-all font-bold placeholder:text-white/20 resize-none"
                            />
                        </div>

                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-center">
                                <p className="text-red-500 text-xs font-black uppercase tracking-widest">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-8 bg-accent-green text-black rounded-3xl font-black text-sm uppercase tracking-[0.4em] hover:bg-white transition-all shadow-[0_0_60px_rgba(191,255,0,0.2)] disabled:opacity-50"
                        >
                            {submitting ? 'Submitting...' : 'Submit Questionnaire'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default SatisfactionSurvey;
