import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Link, useNavigate, useParams } from 'react-router-dom';

const ProgressQuestionnaire = () => {
    const navigate = useNavigate();
    const { category } = useParams(); // e.g. 'weight-loss', 'hair-restoration', 'sexual-health', 'longevity'

    // Normalize category title
    const getCategoryTitle = (cat) => {
        if (!cat) return 'Weight Loss';
        return cat.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const title = getCategoryTitle(category);

    const [formData, setFormData] = useState({
        email: '',
        progressRating: '',
        // Weight Loss Specific
        startingWeight: '',
        weightLost: '',
        // Generic / Other
        symptomImprovement: '',
        sideEffects: '',

        startDate: '',
        endDate: '',
        satisfied: '',
        notes: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleRatingSelect = (rating) => {
        setFormData(prev => ({ ...prev, progressRating: rating }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        // Basic validation
        if (!formData.email || !formData.progressRating) {
            setError('Please fill in all required fields.');
            setSubmitting(false);
            return;
        }

        try {
            // Construct payload
            const payload = {
                questionnaire_type: `${title} Progress`,
                category: category || 'weight-loss',
                email: formData.email,
                responses: formData,
                submitted_at: new Date().toISOString()
            };

            const { error: submitError } = await supabase
                .from('questionnaire_responses')
                .insert([payload]);

            if (submitError) throw submitError;

            setSubmitted(true);
        } catch (err) {
            console.error('Error submitting questionnaire:', err);
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
                <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter mb-6">Thank <span className="text-accent-green">You.</span></h2>
                <p className="text-white/40 font-bold uppercase tracking-widest max-w-md mb-12 leading-relaxed">
                    Your {title} progress has been recorded. Our clinical team will review your update shortly.
                </p>
                <div className="flex gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="px-10 py-5 bg-white/5 border border-white/10 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-white/10 transition-all"
                    >
                        Return Home
                    </button>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="px-10 py-5 bg-accent-green text-black rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-white transition-all shadow-[0_0_40px_rgba(191,255,0,0.3)]"
                    >
                        Go to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const renderCategorySpecificFields = () => {
        switch (category) {
            case 'weight-loss':
            default: // Default to weight loss if undefined (or use specific fallback)
                if (category && category !== 'weight-loss') break; // Don't show weight fields for others
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white/[0.03] border border-white/5 p-8 rounded-[40px] hover:border-white/10 transition-colors">
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
                        <div className="bg-white/[0.03] border border-white/5 p-8 rounded-[40px] hover:border-white/10 transition-colors">
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
                );
        }

        // Generic fields for non-weight loss categories if needed
        return (
            <div className="bg-white/[0.03] border border-white/5 p-8 rounded-[40px] hover:border-white/10 transition-colors">
                <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-4 ml-4">Symptom Improvement</label>
                <textarea
                    name="symptomImprovement"
                    placeholder="Describe any improvements you've noticed..."
                    value={formData.symptomImprovement}
                    onChange={handleChange}
                    rows={2}
                    className="w-full bg-black/20 border border-white/10 rounded-2xl py-5 px-8 text-white focus:outline-none focus:border-accent-green transition-all font-bold placeholder:text-white/20 resize-none"
                />
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-accent-green selection:text-black pt-32 pb-20">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5 px-8 py-6">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <Link to="/" className="text-2xl font-black uppercase tracking-tighter italic hover:text-accent-green transition-colors">
                        uGlowMD
                    </Link>
                    <Link to="/dashboard" className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors">
                        Exit
                    </Link>
                </div>
            </header>

            <div className="max-w-3xl mx-auto px-6">
                <div className="text-center mb-16 animate-in slide-in-from-bottom-8 duration-700">
                    <div className="inline-block py-2 px-6 bg-accent-green/10 border border-accent-green/20 rounded-full text-[10px] font-black uppercase tracking-[0.4em] text-accent-green mb-8">
                        Check-in
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic mb-6 leading-[0.9]">
                        {title} <span className="text-accent-green">Progress.</span>
                    </h1>
                    <p className="text-white/40 font-bold uppercase tracking-widest text-xs max-w-md mx-auto leading-relaxed">
                        Help us track your progress by answering a few questions about your {title.toLowerCase()} journey.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-12 animate-in slide-in-from-bottom-12 duration-1000 delay-100">

                    {/* Email */}
                    <div className="bg-white/[0.03] border border-white/5 p-8 rounded-[40px] hover:border-white/10 transition-colors">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-4 ml-4">Email Address</label>
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

                    {/* Progress Rating */}
                    <div className="bg-white/[0.03] border border-white/5 p-8 rounded-[40px] hover:border-white/10 transition-colors">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-6 ml-4">How is your progress going this month?</label>
                        <div className="space-y-4">
                            {[
                                { value: 'Excellent', label: 'Excellent - Exceeding my goals' },
                                { value: 'Good', label: 'Good - Meeting my goals' },
                                { value: 'Fair', label: 'Fair - Some progress but slower than expected' },
                                { value: 'Poor', label: 'Poor - Little to no progress' }
                            ].map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => handleRatingSelect(option.value)}
                                    className={`w-full text-left p-6 rounded-2xl border transition-all duration-300 group ${formData.progressRating === option.value
                                        ? 'bg-accent-green text-black border-accent-green shadow-[0_0_30px_rgba(191,255,0,0.2)]'
                                        : 'bg-white/5 text-white border-transparent hover:bg-white/10'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-sm uppercase tracking-wide">{option.label}</span>
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${formData.progressRating === option.value ? 'border-black' : 'border-white/20 group-hover:border-white/40'
                                            }`}>
                                            {formData.progressRating === option.value && <div className="w-3 h-3 bg-black rounded-full" />}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Category Specific Fields */}
                    {renderCategorySpecificFields()}

                    {/* Date Grid - Common for all to track checking period */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white/[0.03] border border-white/5 p-8 rounded-[40px] hover:border-white/10 transition-colors">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-4 ml-4">Start Date</label>
                            <input
                                type="date"
                                name="startDate"
                                value={formData.startDate}
                                onChange={handleChange}
                                className="w-full bg-black/20 border border-white/10 rounded-2xl py-5 px-8 text-white focus:outline-none focus:border-accent-green transition-all font-bold placeholder:text-white/20 cursor-pointer"
                            />
                        </div>
                        <div className="bg-white/[0.03] border border-white/5 p-8 rounded-[40px] hover:border-white/10 transition-colors">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-4 ml-4">End Date</label>
                            <input
                                type="date"
                                name="endDate"
                                value={formData.endDate}
                                onChange={handleChange}
                                className="w-full bg-black/20 border border-white/10 rounded-2xl py-5 px-8 text-white focus:outline-none focus:border-accent-green transition-all font-bold placeholder:text-white/20 cursor-pointer"
                            />
                            <p className="mt-3 ml-4 text-[9px] font-black uppercase tracking-widest text-white/20">Approximate period for this check-in</p>
                        </div>
                    </div>

                    {/* Satisfaction */}
                    <div className="bg-white/[0.03] border border-white/5 p-8 rounded-[40px] hover:border-white/10 transition-colors">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-6 ml-4">Are you satisfied with your current medication type and/or dosage?</label>
                        <div className="flex flex-col md:flex-row gap-4">
                            {['Yes - I\'m satisfied', 'No - I\'d like to make changes'].map((option) => (
                                <button
                                    key={option}
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, satisfied: option.split(' - ')[0] }))}
                                    className={`flex-1 p-6 rounded-2xl border transition-all duration-300 ${formData.satisfied === option.split(' - ')[0]
                                        ? 'bg-accent-green text-black border-accent-green shadow-[0_0_30px_rgba(191,255,0,0.2)]'
                                        : 'bg-white/5 text-white border-transparent hover:bg-white/10'
                                        }`}
                                >
                                    <span className="font-bold text-sm uppercase tracking-wide">{option}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="bg-white/[0.03] border border-white/5 p-8 rounded-[40px] hover:border-white/10 transition-colors">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-4 ml-4">Additional Notes (Optional)</label>
                        <textarea
                            name="notes"
                            placeholder="Any additional information you'd like to share..."
                            value={formData.notes}
                            onChange={handleChange}
                            rows={4}
                            className="w-full bg-black/20 border border-white/10 rounded-2xl py-5 px-8 text-white focus:outline-none focus:border-accent-green transition-all font-bold placeholder:text-white/20 resize-none"
                        />
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-center">
                            <p className="text-red-500 text-xs font-black uppercase tracking-widest">{error}</p>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-8 bg-accent-green text-black rounded-3xl font-black text-sm uppercase tracking-[0.4em] hover:bg-white transition-all shadow-[0_0_60px_rgba(191,255,0,0.2)] disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
                    >
                        <span className="relative z-10">{submitting ? 'Submitting...' : 'Submit Questionnaire'}</span>
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                    </button>

                </form>
            </div>
        </div>
    );
};

export default ProgressQuestionnaire;
