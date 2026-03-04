import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';
import { useNavigate, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { intakeQuestions } from '../data/questions';
import { gsap } from 'gsap';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// --- Sub-components ---
const RevenueChart = ({ data, chartKey = 'amount', label = 'Gross Revenue', period = 'all_time' }) => {
    const color = chartKey === 'net' ? '#FFDE59' : '#bfff00';
    const gradientId = chartKey === 'net' ? 'colorNet' : 'colorRevenue';

    const periodLabels = {
        day: 'Today by Hour',
        week: '7 Day Breakdown',
        '30_days': '30 Day Trend',
        year: '12 Month Trend',
        all_time: 'All Time Trend'
    };
    const trendLabel = periodLabels[period] || 'Revenue Trend';
    const xKey = data?.[0]?.hour !== undefined ? 'hour' : (data?.[0]?.date !== undefined ? 'date' : 'month');
    return (
        <div className="h-[340px] w-full bg-white/5 border border-white/10 rounded-[32px] p-6 md:p-8 lg:p-10 relative overflow-hidden group">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-8 gap-3">
                <h3 className="text-lg sm:text-xl font-black uppercase tracking-tighter">{label} � {trendLabel}</h3>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: color }}></div>
                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-white/30">Live Stripe Data</span>
                </div>
            </div>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis dataKey={xKey} axisLine={false} tickLine={false} tick={{ fill: '#ffffff40', fontSize: 10, fontWeight: 900 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#ffffff40', fontSize: 10, fontWeight: 900 }} tickFormatter={(v) => `$${v}`} />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid #ffffff10', borderRadius: '16px', fontSize: '12px', fontWeight: 'bold' }}
                        itemStyle={{ color }}
                        cursor={{ stroke: '#ffffff20', strokeWidth: 1 }}
                        formatter={(v) => [`$${Number(v).toLocaleString()}`, label]}
                    />
                    <Area type="monotone" dataKey={chartKey} stroke={color} strokeWidth={3} fillOpacity={1} fill={`url(#${gradientId})`} animationDuration={2000} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

// --- Analytics View ---
const AdminOverview = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        totalPatients: 0,
        pendingReviews: 0,
        activeSubscriptions: 0,
    });
    const [earnings, setEarnings] = useState({
        gross: null,
        net: null,
        fees: null,
        transactionCount: 0,
        loading: true,
        error: null,
    });
    const [period, setPeriod] = useState('all_time');
    const [chartData, setChartData] = useState([]);
    const [chartView, setChartView] = useState('amount'); // 'amount' = gross, 'net'

    // Supabase stats
    useEffect(() => {
        const fetchStats = async () => {
            const { count: patientCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
            const { count: pendingCount } = await supabase.from('form_submissions').select('*', { count: 'exact', head: true }).eq('approval_status', 'pending');
            const { count: activeCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscribe_status', true);
            setStats({ totalPatients: patientCount || 0, pendingReviews: pendingCount || 0, activeSubscriptions: activeCount || 0 });
        };
        fetchStats();
    }, []);

    // Stripe earnings via Edge Function
    useEffect(() => {
        const fetchStripeEarnings = async () => {
            setEarnings(e => ({ ...e, loading: true, error: null }));
            setChartData([]); // Clear stale chart data when period changes
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session?.access_token) throw new Error('Not authenticated');

                const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
                if (!supabaseUrl) throw new Error('VITE_SUPABASE_URL not set');

                const res = await fetch(
                    `${supabaseUrl}/functions/v1/get-stripe-earnings?period=${period}`,
                    { headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' } }
                );

                if (!res.ok) {
                    const errData = await res.json();
                    throw new Error(errData.error || 'Failed to fetch earnings from Stripe');
                }

                const data = await res.json();
                setEarnings({ gross: data.gross, net: data.net, fees: data.fees, transactionCount: data.transactionCount, loading: false, error: null });

                // Always update chart � use the returned chart data or build a single-point fallback
                const chartArray = data.monthlyChart || data.dailyChart || data.chart || [];
                if (chartArray.length > 0) {
                    setChartData(chartArray);
                } else if (data.gross != null) {
                    // Fallback: build a single data point from the totals for periods with no breakdown
                    const labelMap = { day: 'Today', week: 'This Week', '30_days': 'Last 30d', year: 'This Year', all_time: 'All Time' };
                    setChartData([{ month: labelMap[period] || period, amount: data.gross || 0, net: data.net || 0 }]);
                } else {
                    setChartData([]);
                }
            } catch (err) {
                console.error('Stripe earnings error:', err);
                setEarnings(e => ({ ...e, loading: false, error: err.message }));
            }
        };
        fetchStripeEarnings();
    }, [period]);

    const fmtMoney = (val) => val === null ? '�' : `$${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const stripeRate = (earnings.gross && earnings.gross > 0) ? ((earnings.fees / earnings.gross) * 100).toFixed(1) : '2.9';

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Header + Period Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-2xl font-black uppercase tracking-tighter">Platform Overview</h2>
                <div className="flex gap-2">
                    {[
                        { k: 'day', l: 'Daily' },
                        { k: 'week', l: '1 Week' },
                        { k: '30_days', l: '30 Days' },
                        { k: 'year', l: '1 Year' },
                        { k: 'all_time', l: 'All Time' }
                    ].map(opt => (
                        <button
                            key={opt.k}
                            onClick={() => setPeriod(opt.k)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${period === opt.k ? 'bg-[#FFDE59] text-black' : 'bg-white/5 border border-white/10 text-white/50 hover:text-white'}`}
                        >{opt.l}</button>
                    ))}
                </div>
            </div>

            {/* Core Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {[
                    { label: 'Total Patients', value: stats.totalPatients, color: 'blue', icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 110-8 4 4 0 010 8z' },
                    { label: 'Pending Reviews', value: stats.pendingReviews, color: 'orange', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
                    { label: 'Active Subs', value: stats.activeSubscriptions, color: 'accent-black', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
                    { label: 'Stripe Txns', value: earnings.loading ? '...' : earnings.transactionCount, color: 'purple', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 rounded-2xl md:rounded-3xl p-4 md:p-6 hover:border-white/20 transition-all group overflow-hidden relative">
                        <div className={`absolute -right-4 -top-4 w-24 h-24 bg-${stat.color === 'accent-black' ? 'accent-black' : stat.color}-500/5 blur-3xl transition-opacity group-hover:opacity-10 opacity-0`}></div>
                        <div className="flex items-center justify-between mb-4">
                            <div className={`w-12 h-12 rounded-2xl bg-${stat.color === 'accent-black' ? 'accent-black' : stat.color}-500/10 flex items-center justify-center`}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`text-${stat.color === 'accent-black' ? 'accent-black' : stat.color}-400`}>
                                    <path d={stat.icon} />
                                </svg>
                            </div>
                        </div>
                        <p className="text-2xl md:text-3xl font-black tracking-tighter mb-1">{stat.value}</p>
                        <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white/50">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Earnings Cards � Live Stripe Data */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                {/* Gross Earnings */}
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 relative overflow-hidden hover:border-white/20 transition-all">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#bfff00]/5 to-transparent pointer-events-none rounded-3xl" />
                    <div className="flex items-center justify-between mb-6">
                        <div className="w-11 h-11 rounded-2xl bg-[#bfff00]/10 flex items-center justify-center">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#bfff00" strokeWidth="2">
                                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                            </svg>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-[#bfff00]/10 rounded-full">
                            <div className="w-1.5 h-1.5 bg-[#bfff00] rounded-full animate-pulse" />
                            <span className="text-[8px] font-black uppercase tracking-widest text-[#bfff00]">Stripe Live</span>
                        </div>
                    </div>
                    {earnings.loading ? (
                        <div className="w-7 h-7 border-2 border-[#bfff00]/30 border-t-[#bfff00] rounded-full animate-spin mb-4" />
                    ) : earnings.error ? (
                        <p className="text-red-400 text-xs font-bold mb-4" title={earnings.error}>Error loading</p>
                    ) : (
                        <p className="text-3xl md:text-4xl font-black tracking-tighter text-[#bfff00] mb-2">{fmtMoney(earnings.gross)}</p>
                    )}
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Gross Revenue</p>
                    <p className="text-[9px] text-white/25 mt-1 uppercase tracking-wider">Total charged before fees</p>
                </div>

                {/* Stripe Fees */}
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 relative overflow-hidden hover:border-white/20 transition-all">
                    <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent pointer-events-none rounded-3xl" />
                    <div className="flex items-center justify-between mb-6">
                        <div className="w-11 h-11 rounded-2xl bg-red-500/10 flex items-center justify-center">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2">
                                <path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                        </div>
                        <span className="text-[8px] font-black uppercase tracking-widest text-red-400/70 px-3 py-1 bg-red-500/10 rounded-full">~{stripeRate}% rate</span>
                    </div>
                    {earnings.loading ? (
                        <div className="w-7 h-7 border-2 border-red-500/30 border-t-red-400 rounded-full animate-spin mb-4" />
                    ) : (
                        <p className="text-3xl md:text-4xl font-black tracking-tighter text-red-400 mb-2">- {fmtMoney(earnings.fees)}</p>
                    )}
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Stripe Processing Fees</p>
                    <p className="text-[9px] text-white/25 mt-1 uppercase tracking-wider">2.9% + $0.30 per transaction</p>
                </div>

                {/* Net Earnings */}
                <div className="bg-white/5 border border-[#FFDE59]/20 rounded-3xl p-6 md:p-8 relative overflow-hidden hover:border-[#FFDE59]/40 transition-all">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#FFDE59]/8 to-transparent pointer-events-none rounded-3xl" />
                    <div className="flex items-center justify-between mb-6">
                        <div className="w-11 h-11 rounded-2xl bg-[#FFDE59]/10 flex items-center justify-center">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFDE59" strokeWidth="2">
                                <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                            </svg>
                        </div>
                        <span className="text-[8px] font-black uppercase tracking-widest text-[#FFDE59] px-3 py-1 bg-[#FFDE59]/10 rounded-full">Take Home</span>
                    </div>
                    {earnings.loading ? (
                        <div className="w-7 h-7 border-2 border-[#FFDE59]/30 border-t-[#FFDE59] rounded-full animate-spin mb-4" />
                    ) : (
                        <p className="text-3xl md:text-4xl font-black tracking-tighter text-[#FFDE59] mb-2">{fmtMoney(earnings.net)}</p>
                    )}
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Net Earnings</p>
                    <p className="text-[9px] text-white/25 mt-1 uppercase tracking-wider">After all Stripe charges</p>
                </div>
            </div>

            {/* Chart + Toggle */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Chart View:</span>
                    <button
                        onClick={() => setChartView('amount')}
                        className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${chartView === 'amount' ? 'bg-[#bfff00] text-black' : 'bg-white/5 border border-white/10 text-white/50 hover:text-white'}`}
                    >Gross</button>
                    <button
                        onClick={() => setChartView('net')}
                        className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${chartView === 'net' ? 'bg-[#FFDE59] text-black' : 'bg-white/5 border border-white/10 text-white/50 hover:text-white'}`}
                    >Net</button>
                </div>
                <RevenueChart data={chartData} chartKey={chartView} label={chartView === 'net' ? 'Net Earnings' : 'Gross Revenue'} period={period} />
            </div>
        </div>
    );
};


// --- Patient Manager ---
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

const formatPlanName = (plan) => {
    try {
        if (!plan || plan === 'None' || plan === '{}' || plan === 'null') return null; // Return null so caller can show 'No Plan'
        if (typeof plan === 'object' && plan !== null) {
            const plans = Object.values(plan).filter(v => !!v && typeof v === 'string');
            return plans.length > 0 ? plans.join(' + ') : null;
        }
        if (typeof plan === 'string') {
            try {
                const parsed = JSON.parse(plan);
                if (typeof parsed === 'object' && parsed !== null) {
                    const plans = Object.values(parsed).filter(v => !!v && typeof v === 'string');
                    return plans.length > 0 ? plans.join(' + ') : null;
                }
            } catch {
                return plan.trim() || null;
            }
        }
        return null;
    } catch (err) {
        console.error('[formatPlanName] Error:', err);
        return null;
    }
};

const PatientPortalManager = () => {
    const { user } = useAuth();
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [cardFilter, setCardFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const categories = [
        'Weight Loss',
        'Hair Restoration',
        'Sexual Health',
        'Longevity',
        'Testosterone',
        'Skin Care',
        'Repair & Healing'
    ];
    const [selectedPatientId, setSelectedPatientId] = useState(null);
    const [isDossierOpen, setIsDossierOpen] = useState(false);
    const [renderError, setRenderError] = useState(null);

    useEffect(() => {
        const fetchPatients = async () => {
            console.log('[PatientPortalManager] Initializing simplified fetch...');
            try {
                // Fetch profiles first to see if we have ANY data
                const { data: profiles, error: profilesError } = await supabase
                    .from('profiles')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(50);

                if (profilesError) {
                    console.error('[PatientPortalManager] Profiles Fetch Error:', profilesError);
                    setLoading(false);
                    return;
                }

                if (!profiles || profiles.length === 0) {
                    console.warn('[PatientPortalManager] No profiles found in database.');
                    setPatients([]);
                    setLoading(false);
                    return;
                }

                console.log('[PatientPortalManager] Found profiles:', profiles.length);
                const userIds = profiles.map(p => p.id);
                const emails = profiles.map(p => p.email).filter(Boolean);

                console.log('[PatientPortalManager] Running distributed fetch for data correlation...');

                // Fetch submissions, billing, and questionnaire responses using parallel queries for consistency
                const [
                    { data: subsById },
                    { data: subsByEmail },
                    { data: billById },
                    { data: questById }
                ] = await Promise.all([
                    supabase.from('form_submissions').select('*').in('user_id', userIds),
                    supabase.from('form_submissions').select('*').in('email', emails),
                    supabase.from('billing_history').select('*').in('user_id', userIds),
                    supabase.from('questionnaire_responses').select('*').in('user_id', userIds)
                ]);

                // Combine results and remove duplicates using a Map for O(n) deduplication
                const submissions = Array.from(new Map([...(subsById || []), ...(subsByEmail || [])].map(item => [item.id, item])).values())
                    .sort((a, b) => new Date(b.submitted_at || b.created_at) - new Date(a.submitted_at || a.created_at));

                const billing = (billById || [])
                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

                const questionnaires = (questById || [])
                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

                console.log(`[PatientPortalManager] Correlation complete: ${submissions.length} Submissions, ${billing.length} Payments`);

                const combinedData = (profiles || []).map(profile => {
                    const userSubmissions = (submissions || []).filter(s =>
                        (s.user_id && s.user_id === profile.id) ||
                        (s.email && s.email.toLowerCase() === profile.email?.toLowerCase())
                    );
                    const userBilling = (billing || []).filter(b =>
                        (b.user_id && b.user_id === profile.id) ||
                        (b.email && b.email.toLowerCase() === profile.email?.toLowerCase())
                    );
                    const userQuestionnaires = (questionnaires || []).filter(q =>
                        (q.user_id && q.user_id === profile.id) ||
                        (q.email && q.email.toLowerCase() === profile.email?.toLowerCase())
                    );

                    // Ensure names are populated from submissions if profile is empty
                    const latestSub = userSubmissions[0] || {};

                    return {
                        ...profile,
                        first_name: profile.first_name || latestSub.shipping_first_name || '',
                        last_name: profile.last_name || latestSub.shipping_last_name || '',
                        form_submissions: userSubmissions,
                        submission_count: userSubmissions.length,
                        billing_history: userBilling,
                        questionnaire_responses: userQuestionnaires,
                        last_active: userSubmissions[0]?.created_at || profile.created_at
                    };
                });

                console.log('[PatientPortalManager] Combined data:', combinedData.length, 'records');
                setPatients(combinedData);

                // Categories are fixed now as per requirements
                // No need to derive from data anymore as we want the system categories listed 


            } catch (err) {
                console.error('[PatientPortalManager] Fetch exception:', err);
            } finally {
                setLoading(false);
                console.log('[PatientPortalManager] Fetch completed');
            }
        };
        fetchPatients();
    }, []);

    if (renderError) return <div className="p-20 text-center text-red-500 font-black">COMPONENT CRASH: {renderError}</div>;

    if (loading) return (
        <div className="py-32 flex flex-col items-center justify-center gap-6 animate-pulse">
            <div className="w-12 h-12 border-4 border-accent-black/20 border-t-accent-black rounded-full animate-spin"></div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Decrypting Patient Records...</p>
        </div>
    );

    const filteredPatients = (patients || []).filter(p => {
        if (patients.length > 0 && !window.hasLoggedPatients) {
            console.log('[PatientPortalManager] Sample patient keys:', Object.keys(patients[0]));
            window.hasLoggedPatients = true;
        }
        if (!p) return false;
        const firstName = p.first_name || '';
        const lastName = p.last_name || '';
        const name = `${firstName} ${lastName}`.toLowerCase();
        const email = (p.email || '').toLowerCase();
        const searchTerm = (search || '').toLowerCase();

        const matchesSearch = name.includes(searchTerm) || email.includes(searchTerm);

        const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? p.subscribe_status : !p.subscribe_status);

        let matchesCard = true;
        if (cardFilter === 'has_card') matchesCard = !!(p.last_four_digits_of_card || p.card_name || p.stripe_payment_method_id);
        if (cardFilter === 'no_card') matchesCard = !(p.last_four_digits_of_card || p.card_name || p.stripe_payment_method_id);

        let matchesCategory = true;
        if (categoryFilter !== 'all') {
            const plan = p.current_plan;
            if (!plan || plan === 'None' || plan === '{}') {
                matchesCategory = false;
            } else {
                let planObj = {};
                try {
                    planObj = typeof plan === 'string' ? JSON.parse(plan) : (plan || {});
                } catch (e) { planObj = {}; }

                const categoryMap = {
                    'Weight Loss': ['weight_loss', 'semaglutide', 'tirzepatide', 'weight'],
                    'Hair Restoration': ['hair_restoration', 'hair', 'finasteride', 'minoxidil'],
                    'Sexual Health': ['sexual_health', 'sexual', 'sildenafil', 'tadalafil'],
                    'Longevity': ['longevity', 'nad', 'cjc', 'ipamorelin'],
                    'Testosterone': ['testosterone'],
                    'Skin Care': ['skin_care', 'skin'],
                    'Repair & Healing': ['repair_healing', 'repair', 'healing', 'strength']
                };

                const keywords = categoryMap[categoryFilter] || [];
                const keys = Object.keys(planObj).map(k => k.toLowerCase());
                const values = Object.values(planObj).map(v => (v || '').toString().toLowerCase());

                matchesCategory = keywords.some(kw =>
                    keys.some(k => k.includes(kw)) ||
                    values.some(v => v.includes(kw))
                );
            }
        }

        return matchesSearch && matchesStatus && matchesCard && matchesCategory;
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-700">


            {/* Restructured Filters Section */}
            <div className="flex flex-col gap-4 md:gap-6 max-w-full">
                {/* Mobile: Make label more compact */}
                {/* Search Row */}
                <div className="relative group max-w-full">
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl md:rounded-3xl px-6 md:px-8 py-3 md:py-5 text-sm font-bold text-white focus:outline-none focus:border-accent-black focus:bg-[#111111]/[0.08] transition-all placeholder:text-white/30 shadow-2xl"
                    />
                    <div className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-white transition-colors">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                    </div>
                </div>

                {/* Filters Row */}
                <div className="flex flex-wrap gap-3 md:gap-4">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-xl md:rounded-2xl px-4 md:px-6 py-3 md:py-4 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white/60 focus:outline-none focus:border-accent-black hover:bg-white/5 transition-all cursor-pointer appearance-none flex-1 min-w-[120px] md:min-w-[160px]"
                    >
                        <option value="all" className="bg-[#111111]">All Statuses</option>
                        <option value="active" className="bg-[#111111]">Active Only</option>
                        <option value="inactive" className="bg-[#111111]">Inactive Only</option>
                    </select>

                    <select
                        value={cardFilter}
                        onChange={(e) => setCardFilter(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-xl md:rounded-2xl px-4 md:px-6 py-3 md:py-4 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white/60 focus:outline-none focus:border-accent-black hover:bg-white/5 transition-all cursor-pointer appearance-none flex-1 min-w-[120px] md:min-w-[160px]"
                    >
                        <option value="all" className="bg-[#111111]">All Cards</option>
                        <option value="has_card" className="bg-[#111111]">Has Card</option>
                        <option value="no_card" className="bg-[#111111]">No Card</option>
                    </select>

                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-xl md:rounded-2xl px-4 md:px-6 py-3 md:py-4 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white/60 focus:outline-none focus:border-accent-black hover:bg-white/5 transition-all cursor-pointer appearance-none flex-1 min-w-[140px] md:min-w-[180px]"
                    >
                        <option value="all" className="bg-[#111111]">All Categories</option>
                        {categories.map(cat => (
                            <option key={cat} value={cat} className="bg-[#111111]">{cat}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Patient Table - Responsive with horizontal scroll on mobile */}
            <div className="bg-[#111111] border border-white/10 rounded-2xl md:rounded-[40px] p-4 md:p-6 lg:p-8 xl:p-10 overflow-x-auto max-w-full">
                <table className="w-full text-left min-w-[900px]">
                    <thead>
                        <tr className="border-b border-white/10">
                            <th className="pb-4 md:pb-6 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white/50 w-[20%]">Patient</th>
                            <th className="pb-4 md:pb-6 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white/50 w-[20%]">Email</th>
                            <th className="pb-4 md:pb-6 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white/50 w-[12%]">Subscription</th>
                            <th className="pb-4 md:pb-6 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white/50 w-[15%]">Current Plan</th>
                            <th className="pb-4 md:pb-6 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white/50 w-[10%]">Assessments</th>
                            <th className="pb-4 md:pb-6 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white/50 w-[10%]">Card on File</th>
                            <th className="pb-4 md:pb-6 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white/50 w-[10%]">Joined</th>
                            <th className="pb-4 md:pb-6 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white/50 text-right w-[3%]"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredPatients.map((p) => {
                            const fullName = [p.first_name, p.last_name].filter(Boolean).join(' ').trim();
                            const planLabel = formatPlanName(p.current_plan);
                            const hasCard = !!(p.last_four_digits_of_card || p.card_name || p.stripe_payment_method_id);
                            const cardDisplay = p.last_four_digits_of_card
                                ? `${p.card_name ? p.card_name + ' ' : ''}���� ${p.last_four_digits_of_card}`
                                : (p.card_name || (p.stripe_payment_method_id ? 'Vaulted' : null));

                            return (
                                <tr key={p.id} className="group hover:bg-white/[0.02] transition-all border-b border-white/5 last:border-0">
                                    {/* Patient Name */}
                                    <td className="py-4 md:py-5 pr-4">
                                        <div className="flex flex-col gap-0.5">
                                            <p className="font-bold text-xs md:text-sm text-white leading-tight">
                                                {fullName || <span className="text-white/30 italic">No Name</span>}
                                            </p>
                                            {fullName && (
                                                <p className="text-[9px] text-white/30 font-medium">{p.id?.slice(0, 8)}...</p>
                                            )}
                                        </div>
                                    </td>
                                    {/* Email */}
                                    <td className="py-4 md:py-5 pr-4">
                                        <p className="text-[10px] md:text-xs text-white/60 break-all">{p.email || '�'}</p>
                                    </td>
                                    {/* Subscription */}
                                    <td className="py-4 md:py-5 pr-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-wider ${p.subscribe_status
                                            ? 'bg-[#bfff00]/10 text-[#bfff00] border border-[#bfff00]/20'
                                            : 'bg-white/5 text-white/40 border border-white/10'
                                            }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${p.subscribe_status ? 'bg-[#bfff00]' : 'bg-white/30'}`} />
                                            {p.subscribe_status ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    {/* Current Plan */}
                                    <td className="py-4 md:py-5 pr-4">
                                        {planLabel ? (
                                            <span className="text-[10px] md:text-xs font-semibold text-white/80 leading-snug">{planLabel}</span>
                                        ) : (
                                            <span className="text-[10px] font-black uppercase tracking-widest text-white/25">No Plan</span>
                                        )}
                                    </td>
                                    {/* Assessments */}
                                    <td className="py-4 md:py-5 pr-4">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-xs font-bold text-white/80">{p.submission_count || 0}</span>
                                            <span className="text-[8px] uppercase tracking-widest text-white/30 font-black">Submitted</span>
                                        </div>
                                    </td>
                                    {/* Card on File */}
                                    <td className="py-4 md:py-5 pr-4">
                                        {hasCard ? (
                                            <div className="flex flex-col gap-0.5">
                                                <span className="flex items-center gap-1.5 text-[10px] font-black text-[#bfff00]">
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
                                                    {cardDisplay}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-[9px] font-black uppercase tracking-widest text-white/25">No Card</span>
                                        )}
                                    </td>
                                    {/* Joined */}
                                    <td className="py-4 md:py-5 pr-4">
                                        <p className="text-[10px] md:text-xs text-white/50">
                                            {p.created_at ? new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '�'}
                                        </p>
                                    </td>
                                    {/* Action */}
                                    <td className="py-4 md:py-5 text-right">
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                const id = p.user_id || p.id;
                                                setSelectedPatientId(id);
                                                setIsDossierOpen(true);
                                            }}
                                            className="text-[9px] font-black uppercase tracking-widest text-[#bfff00] hover:bg-[#bfff00] hover:text-black transition-all bg-[#bfff00]/10 px-3 py-2 rounded-lg border border-[#bfff00]/20 whitespace-nowrap"
                                        >
                                            View
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        {filteredPatients.length === 0 && (
                            <tr>
                                <td colSpan="8" className="py-20 text-center text-xs font-black uppercase tracking-widest text-white/30">
                                    No patients found matching your filters
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isDossierOpen && selectedPatientId && (
                <PatientDossierModal
                    patientId={selectedPatientId}
                    onClose={() => {
                        console.log('[PatientPortalManager] Closing dossier');
                        setIsDossierOpen(false);
                        setSelectedPatientId(null);
                    }}
                />
            )}
        </div>
    );

};

// --- Patient Dossier Modal ---
const PatientDossierModal = ({ patientId, onClose }) => {
    console.log('[PatientDossierModal] Mounting with patientId:', patientId);

    useEffect(() => {
        return () => console.log('[PatientDossierModal] Unmounting - patientId was:', patientId);
    }, [patientId]);

    const handleClose = () => {
        console.log('[PatientDossierModal] handleClose triggered');
        console.trace('[PatientDossierModal] Trace for close:');
        onClose();
    };

    const [patient, setPatient] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [orders, setOrders] = useState([]);
    const [billing, setBilling] = useState([]);
    const [questionnaires, setQuestionnaires] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('profile');

    useEffect(() => {
        console.log('[PatientDossierModal] Effect triggered for ID:', patientId);
        const fetchDossierData = async () => {
            console.log('[PatientDossierModal] Starting fetch for patientId:', patientId);
            setLoading(true);
            try {
                // Fetch Profile - Try finding by ID first
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', patientId)
                    .maybeSingle();

                if (profileError) {
                    console.error('[PatientDossierModal] Profile fetch error (try 1 - id):', profileError);
                }

                let finalProfile = profile;

                // Fallback: If not found, check if it's a user_id (though usually id is the PK)
                if (!finalProfile) {
                    const { data: profileByUserId, error: error2 } = await supabase
                        .from('profiles')
                        .select('*')
                        .filter('user_id', 'eq', patientId)
                        .maybeSingle();

                    if (profileByUserId) {
                        finalProfile = profileByUserId;
                    } else if (error2) {
                        console.error('[PatientDossierModal] Profile fetch error (try 2 - user_id):', error2);
                    }
                }

                if (!finalProfile) {
                    console.warn('[PatientDossierModal] No profile found for patientId:', patientId);
                    setPatient(null);
                    setLoading(false);
                    return;
                }

                setPatient(finalProfile);
                console.log('[PatientDossierModal] Profile found:', finalProfile.email);

                const uid = finalProfile.id || patientId;
                const email = finalProfile.email;

                console.log('[PatientDossierModal] Fetching history for:', { uid, email });

                // Fetch Submissions, Orders, Billing, and Questionnaires in parallel
                const [
                    { data: subsById, error: eSubs1 },
                    { data: subsByEmail, error: eSubs2 },
                    { data: ords, error: eOrds },
                    { data: bill, error: eBill },
                    { data: quest, error: eQuest }
                ] = await Promise.all([
                    supabase.from('form_submissions').select('*').eq('user_id', uid),
                    email ? supabase.from('form_submissions').select('*').eq('email', email) : Promise.resolve({ data: [] }),
                    supabase.from('orders').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
                    supabase.from('billing_history').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
                    supabase.from('questionnaire_responses').select('*').eq('user_id', uid).order('created_at', { ascending: false })
                ]);

                if (eSubs1) console.error('[PatientDossierModal] Submissions (ID) error:', eSubs1);
                if (eSubs2) console.error('[PatientDossierModal] Submissions (Email) error:', eSubs2);
                if (eOrds) console.error('[PatientDossierModal] Orders error:', eOrds);
                if (eBill) console.error('[PatientDossierModal] Billing error:', eBill);
                if (eQuest) console.error('[PatientDossierModal] Questions error:', eQuest);

                // Merge and deduplicate submissions
                const allSubs = Array.from(new Map([...(subsById || []), ...(subsByEmail || [])].map(item => [item.id, item])).values())
                    .sort((a, b) => new Date(b.submitted_at || b.created_at) - new Date(a.submitted_at || a.created_at));

                setSubmissions(allSubs);
                setOrders(ords || []);
                setBilling(bill || []);
                setQuestionnaires(quest || []);
            } catch (err) {
                console.error("[PatientDossierModal] Dossier fetch exception:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDossierData();
    }, [patientId]);

    if (loading) return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 backdrop-blur-3xl">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-accent-black/20 border-t-accent-black rounded-full animate-spin"></div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50">Accessing Archive...</p>
            </div>
        </div>
    );

    if (!patient) {
        console.error('[PatientDossierModal] No profile found for ID:', patientId);
        return (
            <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/90 backdrop-blur-3xl p-12">
                <div className="bg-[#111111] border border-white/10 rounded-[32px] p-12 text-center max-w-md">
                    <p className="text-red-500 font-bold mb-4">Patient Profile Not Found</p>
                    <p className="text-xs text-white/50 uppercase font-black mb-8">No medical record exists in the system for ID: {patientId}</p>
                    <button onClick={handleClose} className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase text-white/60 hover:text-white transition-all">Close</button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 md:p-12 bg-black/95 backdrop-blur-3xl animate-in fade-in duration-500">
            <div className="w-full max-w-6xl max-h-[90vh] bg-[#0A0A0A] border border-white/10 rounded-[48px] shadow-2xl overflow-hidden flex flex-col border-glow border-accent-black/20">
                {/* Header */}
                <div className="p-8 md:p-12 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-8 bg-[#080808]">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-accent-black/10 border border-accent-black/20 rounded-3xl flex items-center justify-center text-3xl font-black  text-white shrink-0">
                            {patient.first_name?.[0]}{patient.last_name?.[0]}
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h3 className="text-3xl md:text-4xl font-black uppercase  tracking-tighter leading-none ">
                                    {patient.first_name} <span className="text-white">{patient.last_name}</span>
                                </h3>
                                <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${patient.subscribe_status ? 'bg-accent-black text-white' : 'bg-white/5 text-white/50'}`}>
                                    {patient.subscribe_status ? 'Active' : 'Inactive'}
                                </div>
                            </div>
                            <p className="text-[11px] text-white/50 uppercase font-black tracking-[0.2em]">Patient Dossier � {patient.email}</p>
                        </div>
                    </div>
                    <div className="hidden md:flex items-center gap-4">
                        <button onClick={handleClose} className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-all text-white/50 hover:text-white shrink-0">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12" /></svg>
                        </button>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="px-12 py-2 border-b border-white/10 flex gap-6 items-center bg-[#070707] overflow-x-auto scrollbar-hide">
                    {[
                        { id: 'profile', label: 'Overview' },
                        { id: 'subscription', label: 'Subscription' },
                        { id: 'submissions', label: `Assessments (${submissions.length})` },
                        { id: 'documents', label: 'Documents' },
                        { id: 'rx', label: 'GLP-1 Rx' },
                        { id: 'billing', label: `Billing (${billing.length})` },
                        { id: 'dosage', label: 'Dosage Req' },
                        { id: 'surveys', label: `Surveys (${questionnaires.length})` }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`text-[9px] font-black uppercase tracking-[0.2em] transition-all relative py-4 whitespace-nowrap ${activeTab === tab.id ? 'text-white' : 'text-white/30 hover:text-white/50'}`}
                        >
                            {tab.label}
                            {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-black shadow-[0_0_20px_rgba(191,255,0,0.5)]"></div>}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-8 md:p-12">
                    {activeTab === 'profile' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 animate-in slide-in-from-bottom-4 transition-all duration-700">
                            {/* Personal Info */}
                            <div className="space-y-12">
                                <div>
                                    <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-white mb-8 bg-accent-black/5 py-3 px-6 rounded-xl inline-block">Personal Identity</h4>
                                    <div className="space-y-6">
                                        <DossierRow label="Gender" value={patient.sex || submissions[0]?.sex || 'Not Specified'} />
                                        <DossierRow label="Date of Birth" value={patient.date_of_birth || submissions[0]?.birthday || 'Not Stored'} />
                                        <DossierRow label="Phone" value={patient.phone_number || submissions[0]?.shipping_phone || '�'} />
                                        <DossierRow label="Joined Data" value={new Date(patient.created_at).toLocaleDateString()} />

                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-white mb-8 bg-accent-black/5 py-3 px-6 rounded-xl inline-block">Contact & Shipping</h4>
                                    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-4">
                                        <p className="text-[10px] text-white/30 uppercase font-black tracking-widest leading-none">Registered Address</p>
                                        <p className="text-sm font-bold text-white/80 leading-relaxed uppercase tracking-widest">
                                            {patient.legal_address || (submissions[0]?.shipping_street ?
                                                `${submissions[0].shipping_street}, ${submissions[0].shipping_city}, ${submissions[0].shipping_state} ${submissions[0].shipping_zip}` :
                                                'No Address Stored')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Medical Summary */}
                            <div className="space-y-12">
                                <div>
                                    <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-white mb-8 bg-accent-black/5 py-3 px-6 rounded-xl inline-block">Active Medication</h4>
                                    <div className="bg-accent-black/5 border-l-4 border-accent-black p-8 rounded-tr-3xl rounded-br-3xl space-y-4">
                                        {(() => {
                                            // Get approved submissions
                                            const approvedMeds = submissions.filter(sub => sub.approval_status === 'approved');

                                            if (approvedMeds.length === 0) {
                                                return (
                                                    <>
                                                        <p className="text-[10px] text-white/60 uppercase font-black tracking-widest mb-2 ">Current Plan</p>
                                                        <h5 className="text-2xl font-black uppercase  tracking-tighter text-white">
                                                            {formatPlanName(patient.current_plan)}
                                                        </h5>
                                                    </>
                                                );
                                            }

                                            return approvedMeds.map((med, idx) => (
                                                <div key={med.id} className={idx > 0 ? 'pt-4 border-t border-accent-black/20' : ''}>
                                                    <p className="text-[10px] text-white/60 uppercase font-black tracking-widest mb-2 ">
                                                        {med.dosage_preference || med.selected_drug || 'Medication'}
                                                    </p>
                                                    <h5 className="text-xl font-black uppercase  tracking-tighter text-white">
                                                        {med.selected_drug || formatPlanName(patient.current_plan)}
                                                    </h5>
                                                </div>
                                            ));
                                        })()}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-white mb-8 bg-accent-black/5 py-3 px-6 rounded-xl inline-block">Vital Statistics</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center w-full">
                                            <p className="text-[9px] text-white/30 uppercase font-black tracking-widest mb-1">Height</p>
                                            <p className="text-xl font-black text-white">
                                                {patient.height_feet && patient.height_inches ? `${patient.height_feet}'${patient.height_inches}"` :
                                                    patient.height_ft && patient.height_in ? `${patient.height_ft}'${patient.height_in}"` :
                                                        submissions[0]?.height_feet && submissions[0]?.height_inches ? `${submissions[0].height_feet}'${submissions[0].height_inches}"` :
                                                            submissions[0]?.height_ft && submissions[0]?.height_in ? `${submissions[0].height_ft}'${submissions[0].height_in}"` :
                                                                submissions[0]?.height || patient.height || '�'}
                                            </p>
                                        </div>
                                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center w-full">
                                            <p className="text-[9px] text-white/30 uppercase font-black tracking-widest mb-1">Weight</p>
                                            <p className="text-xl font-black text-white">
                                                {patient.weight || submissions[0]?.weight || '�'}
                                            </p>
                                        </div>
                                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center w-full">
                                            <p className="text-[9px] text-white/30 uppercase font-black tracking-widest mb-1">BMI</p>
                                            <p className="text-xl font-black text-white">
                                                {patient.bmi ? Number(patient.bmi).toFixed(1) : (submissions[0]?.bmi ? Number(submissions[0].bmi).toFixed(1) : '�')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'submissions' && (
                        <div className="space-y-4 animate-in slide-in-from-bottom-4 transition-all duration-700">
                            {submissions.length === 0 ? (
                                <div className="text-center py-20 border-2 border-dashed border-white/10 rounded-3xl">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/30">No clinical submissions found for this identity.</p>
                                </div>
                            ) : (
                                submissions.map(sub => (
                                    <div key={sub.id} className="bg-[#111111]/[0.02] border border-white/10 rounded-3xl p-6 hover:bg-[#111111]/[0.05] transition-all group flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="flex flex-col md:flex-row md:items-center gap-6">
                                            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white/30 group-hover:text-white transition-all shrink-0">
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h5 className="text-sm font-black uppercase text-white">{sub.selected_drug || 'General Consult'}</h5>
                                                    <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase ${sub.approval_status === 'approved' ? 'bg-accent-black/10 text-white' : sub.approval_status === 'pending' ? 'bg-orange-500/10 text-orange-500' : 'bg-red-500/10 text-red-500'}`}>
                                                        {sub.approval_status}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-white/30 uppercase font-black tracking-widest">ID: {String(sub.id).substring(0, 8)}... � {new Date(sub.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {sub.approval_status === 'approved' && (
                                                <span className="flex items-center gap-2 text-[10px] font-black uppercase text-white bg-accent-black/5 px-4 py-2 rounded-xl">
                                                    <div className="w-1.5 h-1.5 bg-accent-black rounded-full"></div>
                                                    Clinically Cleared
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === 'subscription' && (
                        <div className="animate-in slide-in-from-bottom-4 transition-all duration-700">
                            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-8">
                                <div className="flex flex-col md:flex-row md:justify-between md:items-center border-b border-white/10 pb-8 gap-6">
                                    <div>
                                        <p className="text-[10px] text-white font-black uppercase tracking-widest mb-1 ">Current Status</p>
                                        <h5 className="text-3xl font-black uppercase  tracking-tighter text-white">
                                            {patient.subscribe_status ? 'Active Medication' : 'No Active Subscription'}
                                        </h5>
                                    </div>
                                    <div className="md:text-right">
                                        <p className="text-[10px] text-white/30 font-black uppercase tracking-widest mb-1">Plan Name</p>
                                        <p className="text-lg font-black text-white ">{formatPlanName(patient.current_plan)}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                                    <DossierStat label="Renewal Date" value={patient.current_sub_end_date ? new Date(patient.current_sub_end_date).toLocaleDateString() : '�'} />
                                    <DossierStat label="Payment" value={patient.last_four_digits_of_card ? `Ends in ${patient.last_four_digits_of_card}` : 'No Card'} />
                                    <DossierStat label="Auto-Pay" value={patient.stripe_payment_method_id ? 'Enabled' : 'Disabled'} />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'documents' && (
                        <div className="text-center py-24 animate-in slide-in-from-bottom-4">
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-white/30"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                            </div>
                            <h5 className="text-[11px] font-black uppercase tracking-[0.3em] text-white/50 mb-2">Document Archive Empty</h5>
                            <p className="text-[9px] text-white/10 uppercase font-black tracking-widest leading-loose">No supplemental clinical records or laboratory<br />uploads found in this patient's vault.</p>
                        </div>
                    )}

                    {activeTab === 'rx' && (
                        <div className="space-y-4 animate-in slide-in-from-bottom-4">
                            {orders.length === 0 ? (
                                <div className="text-center py-20 border-2 border-dashed border-white/10 rounded-3xl">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/30">No active prescriptions or fulfillment history.</p>
                                </div>
                            ) : (
                                orders.map(order => (
                                    <div key={order.id} className="bg-[#0D0D0D] border border-white/10 rounded-3xl p-8 flex flex-col md:flex-row md:items-center justify-between gap-8">
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-white font-black uppercase tracking-[0.2em] ">GLP-1 RX SHIPPED</p>
                                            <h5 className="text-2xl font-black uppercase  tracking-tighter text-white">{order.product_name}</h5>
                                            <p className="text-[11px] text-white/30 uppercase font-black tracking-[0.2em]">FEDEX: {order.tracking_id || 'PENDING ASSIGNMENT'}</p>
                                        </div>
                                        <div className="px-6 py-3 bg-white/5 rounded-2xl border border-white/10 text-center">
                                            <p className="text-[9px] text-white/50 uppercase font-black tracking-widest mb-1">Status</p>
                                            <p className="text-[10px] font-black uppercase text-white ">{order.delivery_status || 'PROCESSING'}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === 'billing' && (
                        <div className="space-y-3 animate-in slide-in-from-bottom-4">
                            {billing.length === 0 ? (
                                <div className="text-center py-20 border-2 border-dashed border-white/10 rounded-3xl text-white/30 uppercase font-black tracking-widest text-[10px]">No transaction history recorded.</div>
                            ) : (
                                billing.map(item => (
                                    <div key={item.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between group hover:bg-[#111111]/[0.08] transition-all gap-4">
                                        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
                                            <div className="w-10 h-10 bg-accent-black/10 rounded-xl flex items-center justify-center text-white shrink-0">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                                            </div>
                                            <div>
                                                <h6 className="text-[11px] font-black uppercase text-white tracking-widest leading-none mb-1.5">{item.description || 'Service Charge'}</h6>
                                                <p className="text-[9px] text-white/50 uppercase font-black tracking-widest">{new Date(item.created_at).toLocaleDateString()} � {String(item.id).substring(0, 8)}</p>
                                            </div>
                                        </div>
                                        <div className="md:text-right pt-2 md:pt-0 border-t border-white/10 md:border-t-0">
                                            <p className="text-sm font-black text-white">${(item.amount / 100).toFixed(2)}</p>
                                            <p className="text-[8px] font-black uppercase text-white ">Confirmed</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === 'dosage' && (
                        <div className="space-y-4 animate-in slide-in-from-bottom-4">
                            {submissions.filter(s => s.type === 'dosage_change' || s.submission_type === 'dosage_change').length === 0 ? (
                                <div className="text-center py-20 border-2 border-dashed border-white/10 rounded-3xl">
                                    <h5 className="text-[11px] font-black uppercase tracking-[0.3em] text-white/50 mb-2">No Dosage Requests</h5>
                                    <p className="text-[9px] text-white/10 uppercase font-black tracking-widest leading-loose">No active or historical requests for protocol<br />adjustments found in clinical records.</p>
                                </div>
                            ) : (
                                submissions.filter(s => s.type === 'dosage_change' || s.submission_type === 'dosage_change').map(req => (
                                    <div key={req.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <h6 className="text-sm font-black uppercase text-white tracking-widest">Dosage Adjustment Request</h6>
                                                <span className="text-[8px] px-2 py-0.5 bg-accent-black/10 text-white rounded-full font-black uppercase">Pending Review</span>
                                            </div>
                                            <p className="text-[10px] text-white/50 uppercase font-black tracking-widest">Requested on {new Date(req.created_at).toLocaleDateString()}</p>
                                        </div>
                                        <button className="px-6 py-2 bg-accent-black/10 border border-accent-black/20 rounded-xl text-[9px] font-black uppercase text-white hover:bg-accent-black transition-all hover:text-white">
                                            Process Request
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === 'surveys' && (
                        <div className="space-y-4 animate-in slide-in-from-bottom-4">
                            {questionnaires.length === 0 ? (
                                <div className="text-center py-20 border-2 border-dashed border-white/10 rounded-3xl text-white/30 uppercase font-black tracking-widest text-[10px]">No survey responses found.</div>
                            ) : (
                                questionnaires.map(q => (
                                    <div key={q.id} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h6 className="text-xs font-black uppercase text-white tracking-widest mb-1">{q.survey_name || 'Patient Feedback'}</h6>
                                                <p className="text-[9px] text-white/50 uppercase font-black tracking-widest">{new Date(q.created_at).toLocaleDateString()}</p>
                                            </div>
                                            <span className="text-[8px] px-2 py-1 bg-accent-black/10 text-white rounded-full font-black uppercase">Captured</span>
                                        </div>
                                        <p className="text-xs text-white/60 leading-relaxed line-clamp-2 ">{q.response_summary || 'View full response in clinical history...'}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-6 md:p-8 border-t border-white/10 bg-[#111111] flex items-center justify-end">
                    <button onClick={handleClose} className="md:hidden px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/5 transition-all">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

const DossierRow = ({ label, value, isCode }) => (
    <div className="flex items-baseline justify-between py-4 border-b border-white/10">
        <span className="text-[10px] text-white/30 uppercase font-black tracking-widest shrink-0">{label}</span>
        <span className={`text-xs font-bold text-white/80 text-right ${isCode ? 'font-mono uppercase tracking-tighter bg-white/5 px-2 py-1 rounded' : ''}`}>
            {value}
        </span>
    </div>
);

const DossierStat = ({ label, value }) => (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
        <p className="text-[8px] text-white/30 uppercase font-black tracking-widest mb-1">{label}</p>
        <p className="text-[11px] font-black text-white  truncate">{value}</p>
    </div>
);

// --- Generate Provider Report Modal ---
const GenerateReportModal = ({ submission, onClose, onAction }) => {
    const { session } = useAuth();
    const [generating, setGenerating] = useState(false);
    const [reportData, setReportData] = useState({
        // Provider Info
        provider_first_name: '',
        provider_last_name: '',
        provider_type: 'MD',

        // Lipid Panel
        total_cholesterol: '',
        ldl: '',
        hdl: '',
        triglycerides: '',

        // A1C Test
        a1c_value: '',

        // Notes
        notes: '',
    });

    const handleChange = (field, value) => {
        setReportData(prev => ({ ...prev, [field]: value }));
    };

    const handleGenerateReport = async () => {
        if (!reportData.provider_first_name || !reportData.provider_last_name) {
            toast.error('Please enter provider name');
            return;
        }

        setGenerating(true);
        try {
            const today = new Date().toISOString().split('T')[0];

            // Build a combined data source: merge top-level fields with intake_data JSON
            const intakeBlob = submission.intake_data || submission.medical_responses || {};
            const allergies = submission.allergies ||
                intakeBlob.allergies ||
                'None reported';

            const payload = {
                userId: submission.id,
                answers: {
                    "First Name": submission.shipping_first_name || '',
                    "Last Name": submission.shipping_last_name || '',
                    "Email": submission.email || submission.shipping_email || '',
                    "Sex": submission.sex || intakeBlob.sex || 'N/A',
                    "Date of Birth": intakeBlob.date_of_birth || intakeBlob.dob || submission.birthday || 'N/A',
                    "State": submission.state || submission.shipping_state || intakeBlob.state || 'N/A',
                    "Height (feet)": submission.height_feet || '0',
                    "Height (inches)": submission.height_inches || '0',
                    "Weight (lbs)": submission.weight || '0',
                    "BMI": submission.bmi || '0',
                    "Health Goals": (Array.isArray(submission.goals) ? submission.goals.join(', ') : submission.health_goals) || (Array.isArray(intakeBlob.goals) ? intakeBlob.goals.join(', ') : '') || 'N/A',
                    "Diabetes Status": submission.diabetes_status || intakeBlob.diabetes || 'N/A',
                    "Allergies": allergies,
                    "Current Medications": submission.current_medications ||
                        (Array.isArray(intakeBlob.current_meds) ? intakeBlob.current_meds.join(', ') : intakeBlob.current_meds) ||
                        'None'
                },
                labs: {
                    lipid: {
                        total: Number(reportData.total_cholesterol) || 0,
                        ldl: Number(reportData.ldl) || 0,
                        hdl: Number(reportData.hdl) || 0,
                        triglycerides: Number(reportData.triglycerides) || 0
                    },
                    a1c: {
                        value: Number(reportData.a1c_value) || 0
                    }
                },
                notes: reportData.notes || '',
                provider: {
                    first_name: reportData.provider_first_name,
                    last_name: reportData.provider_last_name,
                    type: reportData.provider_type
                }
            };

            console.log('Generating report with payload:', payload);

            const { data, error: invokeError } = await supabase.functions.invoke('generate-provider-note', {
                body: payload
            });

            if (invokeError) {
                console.error('Invoke Error:', invokeError);
                throw new Error(`Failed to generate report: ${invokeError.message || 'Unknown error'}`);
            }

            console.log('Invoke Response Data:', data);

            let responseData = data;
            if (typeof data === 'string') {
                try {
                    responseData = JSON.parse(data);
                    console.log('Parsed Response Data:', responseData);
                } catch (e) {
                    console.error('Failed to parse response data as JSON:', data);
                }
            }

            if (responseData?.success && responseData?.url) {
                console.log('Report URL received:', responseData.url);
                window.open(responseData.url, '_blank');
                alert('Report generated successfully!');
                if (onAction) onAction();
                onClose();
            } else {
                throw new Error(responseData?.error || 'Report generation succeeded but no download link was generated.');
            }
        } catch (error) {
            console.error('Error generating report:', error);
            alert(`Failed to generate report: ${error.message}`);
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-8 bg-black/95 backdrop-blur-3xl animate-in fade-in duration-300">
            <div className="w-full max-w-4xl max-h-[90vh] bg-[#0A0A0A] border border-white/10 rounded-[40px] shadow-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-8 border-b border-white/10 flex items-center justify-between bg-[#080808] shrink-0">
                    <div>
                        <h3 className="text-2xl font-black uppercase  tracking-tighter leading-none mb-1">
                            Generate <span className="text-white">Provider Report</span>
                        </h3>
                        <p className="text-[10px] text-white/50 uppercase font-black tracking-[0.2em]">
                            Enter lab test results for {submission.shipping_first_name} {submission.shipping_last_name}
                        </p>
                    </div>
                    <button onClick={onClose} className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-all text-white/50 hover:text-white">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8">

                    {/* Provider Information */}
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                        <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-white mb-6">Provider Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-white/50 mb-2">First Name</label>
                                <input
                                    type="text"
                                    value={reportData.provider_first_name}
                                    onChange={(e) => handleChange('provider_first_name', e.target.value)}
                                    placeholder="John"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent-black"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-white/50 mb-2">Last Name</label>
                                <input
                                    type="text"
                                    value={reportData.provider_last_name}
                                    onChange={(e) => handleChange('provider_last_name', e.target.value)}
                                    placeholder="Smith"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent-black"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-white/50 mb-2">Provider Type</label>
                                <select
                                    value={reportData.provider_type}
                                    onChange={(e) => handleChange('provider_type', e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent-black"
                                >
                                    <option value="MD" className="bg-[#111111]">MD</option>
                                    <option value="DO" className="bg-[#111111]">DO</option>
                                    <option value="NP" className="bg-[#111111]">NP</option>
                                    <option value="PA" className="bg-[#111111]">PA</option>
                                    <option value="nurse_practitioner" className="bg-[#111111]">Nurse Practitioner</option>
                                    <option value="physician_assistant" className="bg-[#111111]">Physician Assistant</option>
                                    <option value="back_office" className="bg-[#111111]">Back Office</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Lab Results */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Lipid Panel */}
                        <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                            <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-white mb-6">Lipid Panel</h4>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-white/50 mb-2">Total Cholesterol (mg/dL)</label>
                                    <input type="number" value={reportData.total_cholesterol} onChange={(e) => handleChange('total_cholesterol', e.target.value)} placeholder="0" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent-black" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-white/50 mb-2">LDL</label>
                                        <input type="number" value={reportData.ldl} onChange={(e) => handleChange('ldl', e.target.value)} placeholder="0" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent-black" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-white/50 mb-2">HDL</label>
                                        <input type="number" value={reportData.hdl} onChange={(e) => handleChange('hdl', e.target.value)} placeholder="0" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent-black" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-white/50 mb-2">Triglycerides (mg/dL)</label>
                                    <input type="number" value={reportData.triglycerides} onChange={(e) => handleChange('triglycerides', e.target.value)} placeholder="0" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent-black" />
                                </div>
                            </div>
                        </div>

                        {/* A1C & Notes */}
                        <div className="space-y-6">
                            <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                                <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-white mb-6">A1C Test</h4>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-white/50 mb-2">A1C Value (%)</label>
                                    <input type="number" step="0.1" value={reportData.a1c_value} onChange={(e) => handleChange('a1c_value', e.target.value)} placeholder="0" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent-black" />
                                </div>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                                <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-white mb-4">Internal Notes</h4>
                                <textarea
                                    value={reportData.notes}
                                    onChange={(e) => handleChange('notes', e.target.value)}
                                    placeholder="Provider comments..."
                                    rows={3}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent-black resize-none"
                                />
                            </div>
                        </div>
                    </div>

                </div>


                {/* Footer Actions */}
                <div className="p-6 border-t border-white/10 flex gap-4 bg-[#111111] shrink-0">
                    <button
                        onClick={onClose}
                        className="flex-1 py-5 border border-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-white/5 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleGenerateReport}
                        disabled={generating}
                        className="flex-[2] py-5 bg-accent-black text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-[#111111] hover:shadow-[0_0_60px_rgba(191,255,0,0.4)] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                        {generating ? (
                            <>
                                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                                Generating...
                            </>
                        ) : (
                            <>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                                Generate & Download PDF
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Create Order Modal ---
const CreateOrderModal = ({ submission, onClose, onApprove }) => {
    // All current products from the navbar/site, grouped by category
    const PRODUCT_MAP = {
        // Weight Loss
        'semaglutide-injection': { name: 'Semaglutide Injection', dosage: '0.25–2.4 mg/wk', price: '299' },
        'tirzepatide-injection': { name: 'Tirzepatide Injection', dosage: '2.5–15 mg/wk', price: '399' },
        'semaglutide-drops': { name: 'Semaglutide Sublingual Drops', dosage: '(Sublingual)', price: '249' },
        'tirzepatide-drops': { name: 'Tirzepatide Sublingual Drops', dosage: '(Sublingual)', price: '349' },
        // Hair Restoration
        'finasteride-tablets': { name: 'Finasteride', dosage: '1 mg Oral Tablet', price: '49' },
        'finasteride-minoxidil-liquid': { name: 'Dual Growth Formula', dosage: 'Finasteride + Minoxidil Topical', price: '79' },
        'finasteride-minoxidil-tretinoin-liquid': { name: 'Triple Growth Liquid', dosage: 'Finasteride + Minoxidil + Tretinoin 3-in-1', price: '99' },
        'minoxidil-max-compound-liquid': { name: 'Max Growth Compound', dosage: 'Minoxidil 5-in-1 Topical', price: '129' },
        // Sexual Health
        'sildenafil-tadalafil-troche': { name: 'Dual Performance Formula', dosage: 'Sildenafil + Tadalafil Troche', price: '89' },
        'sildenafil-yohimbe-troche': { name: 'Synergy Performance Formula', dosage: 'Sildenafil + Yohimbe Troche', price: '79' },
        'sildenafil-tadalafil-tablets': { name: 'Dual Action Tablets', dosage: 'Sildenafil + Tadalafil Oral', price: '69' },
        'oxytocin-troche': { name: 'Oxytocin', dosage: 'Sublingual Troche', price: '129' },
        'oxytocin-nasal-spray': { name: 'Oxytocin', dosage: 'Nasal Spray', price: '119' },
        // Longevity
        'nad-injection': { name: 'NAD+', dosage: '200 mg/mL Subcutaneous Injection', price: '119.99' },
        'nad-nasal-spray': { name: 'NAD+ Nasal Spray', dosage: '100 mg/mL (15 mL)', price: '124.99' },
        'glutathione-injection': { name: 'Glutathione', dosage: '200 mg/mL Subcutaneous Injection', price: '64.99' },
        // Testosterone
        'testosterone-injection': { name: 'Testosterone Cypionate', dosage: 'Subcutaneous Injection', price: '149' },
        'testosterone-rdt': { name: 'Testosterone RDT', dosage: 'Rapid Dissolve Tablet', price: '99' },
        // Repair & Healing
        'bpc157-injection': { name: 'BPC-157', dosage: 'Subcutaneous Injection', price: '199' },
        'bpc157-tb500-injection': { name: 'BPC-157 + TB-500', dosage: 'Subcutaneous Injection', price: '249' },
    };

    const [price, setPrice] = useState('');
    const [coupon, setCoupon] = useState('');
    const [product, setProduct] = useState('');
    const [charging, setCharging] = useState(false);

    // Provider & Status State
    const [orderData, setOrderData] = useState({
        provider_first_name: '',
        provider_last_name: '',
        provider_type: '',
        delivery_status: 'Not delivered'
    });

    const handleDataChange = (field, value) => {
        setOrderData(prev => ({ ...prev, [field]: value }));
    };

    const handleProductChange = (val) => {
        setProduct(val);
        if (PRODUCT_MAP[val]) {
            setPrice(PRODUCT_MAP[val].price);
        }
    };

    // Derived address
    const address = [
        submission.shipping_street || submission.shipping_address,
        submission.shipping_city,
        submission.shipping_state,
        submission.shipping_zip
    ].filter(Boolean).join(', ');

    const handleCharge = async () => {
        if (!product) {
            toast.error('Please select a product');
            return;
        }
        if (!price || isNaN(parseFloat(price))) {
            toast.error('Please enter a valid price');
            return;
        }

        const selectedProductLabel = document.querySelector(`select option[value="${product}"]`)?.textContent || product;
        const chargePriceCents = Math.round(parseFloat(price) * 100);
        const basePriceCents = 29900; // Sample real_price from curl

        const patientId = submission.user_id;

        if (!patientId) {
            toast.error('Error: This submission is not linked to a User ID. Cannot process charge.');
            return;
        }

        // Determine category for metadata
        const drug = (submission.selected_drug || '').toLowerCase();
        let category = 'Weight Loss';

        if (drug.includes('hair-restoration') || drug.includes('finasteride') || drug.includes('minoxidil')) {
            category = 'Hair Restoration';
        } else if (drug.includes('sexual-health') || drug.includes('sildenafil') || drug.includes('tadalafil') || drug.includes('oxytocin')) {
            category = 'Sexual Health';
        } else if (drug.includes('longevity') || drug.includes('nad') || drug.includes('glutathione')) {
            category = 'Longevity';
        } else if (drug.includes('weight-loss') || drug.includes('semaglutide') || drug.includes('tirzepatide')) {
            category = 'Weight Loss';
        }

        const payload = {
            userId: patientId,
            product_name: `uGlowMD ${selectedProductLabel}`,
            product_price: chargePriceCents,
            product_category: category,
            real_price: basePriceCents,
            form_submission_id: submission.id,
            shipping_address: {
                line1: submission.shipping_street || submission.shipping_address || '',
                line2: '', // Optional/additional info
                city: submission.shipping_city || '',
                state: submission.shipping_state || '',
                postal_code: submission.shipping_zip || '',
                country: 'US' // Assume US as default for this platform
            }
        };

        setCharging(true);
        try {
            console.log('Initiating charge with payload:', payload);

            const { data, error: invokeError } = await supabase.functions.invoke('charge-customer-responder', {
                method: 'POST',
                body: payload
            });

            // If there's an invoke error, it usually means a non-2xx status
            if (invokeError) {
                // Extract error message: check if 'data' is a string or an object with error/message
                let errorMsg = invokeError.message;
                if (typeof data === 'string') {
                    errorMsg = data;
                } else if (data && (data.error || data.message)) {
                    errorMsg = data.error || data.message;
                }
                throw new Error(errorMsg);
            }

            if (data?.success || data?.status === 'succeeded' || data?.id) {
                toast.success('Charge successfully!');
                await onApprove();
                onClose();
            } else {
                // The function returned 200 but the logic failed (e.g. Stripe declined)
                throw new Error(data?.error || data?.message || 'Payment was not successful.');
            }
        } catch (error) {
            console.error('Charge process failed:', error);
            toast.error(`Charge Failed: ${error.message}`);
        } finally {
            setCharging(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="w-full max-w-lg bg-[#0A0A0A] border border-white/10 rounded-[40px] overflow-hidden flex flex-col shadow-2xl border-glow border-accent-black/20">
                {/* Header */}
                <div className="p-8 border-b border-white/10 bg-[#080808]">
                    <h3 className="text-2xl font-black uppercase  tracking-tighter text-white">Create <span className="text-white">Order</span></h3>
                    <p className="text-[10px] text-white/50 uppercase font-black tracking-widest mt-1">
                        Fill in the order details for <span className="text-white">{submission.shipping_first_name} {submission.shipping_last_name}</span>
                    </p>
                </div>

                {/* Content */}
                <div className="p-8 space-y-6 flex-1 overflow-y-auto max-h-[60vh] no-scrollbar">
                    {/* Product Selection */}
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-white/50 mb-2">Product Name</label>
                        <select
                            value={product}
                            onChange={(e) => handleProductChange(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent-black cursor-pointer"
                        >
                            <option value="">Select a product...</option>

                            <optgroup label="── Weight Loss" style={{ color: '#bfff00', backgroundColor: '#111' }}>
                                {Object.entries(PRODUCT_MAP).filter(([id]) => ['semaglutide-injection', 'tirzepatide-injection', 'semaglutide-drops', 'tirzepatide-drops'].includes(id)).map(([id, data]) => (
                                    <option key={id} value={id} className="bg-[#111111] text-white">
                                        {data.name}{data.dosage ? ` — ${data.dosage}` : ''} — ${data.price}
                                    </option>
                                ))}
                            </optgroup>

                            <optgroup label="── Hair Restoration" style={{ color: '#bfff00', backgroundColor: '#111' }}>
                                {Object.entries(PRODUCT_MAP).filter(([id]) => ['finasteride-tablets', 'finasteride-minoxidil-liquid', 'finasteride-minoxidil-tretinoin-liquid', 'minoxidil-max-compound-liquid'].includes(id)).map(([id, data]) => (
                                    <option key={id} value={id} className="bg-[#111111] text-white">
                                        {data.name}{data.dosage ? ` — ${data.dosage}` : ''} — ${data.price}
                                    </option>
                                ))}
                            </optgroup>

                            <optgroup label="── Sexual Health" style={{ color: '#bfff00', backgroundColor: '#111' }}>
                                {Object.entries(PRODUCT_MAP).filter(([id]) => ['sildenafil-tadalafil-troche', 'sildenafil-yohimbe-troche', 'sildenafil-tadalafil-tablets', 'oxytocin-troche', 'oxytocin-nasal-spray'].includes(id)).map(([id, data]) => (
                                    <option key={id} value={id} className="bg-[#111111] text-white">
                                        {data.name}{data.dosage ? ` — ${data.dosage}` : ''} — ${data.price}
                                    </option>
                                ))}
                            </optgroup>

                            <optgroup label="── Longevity" style={{ color: '#bfff00', backgroundColor: '#111' }}>
                                {Object.entries(PRODUCT_MAP).filter(([id]) => ['nad-injection', 'nad-nasal-spray', 'glutathione-injection'].includes(id)).map(([id, data]) => (
                                    <option key={id} value={id} className="bg-[#111111] text-white">
                                        {data.name}{data.dosage ? ` — ${data.dosage}` : ''} — ${data.price}
                                    </option>
                                ))}
                            </optgroup>

                            <optgroup label="── Testosterone" style={{ color: '#bfff00', backgroundColor: '#111' }}>
                                {Object.entries(PRODUCT_MAP).filter(([id]) => ['testosterone-injection', 'testosterone-rdt'].includes(id)).map(([id, data]) => (
                                    <option key={id} value={id} className="bg-[#111111] text-white">
                                        {data.name}{data.dosage ? ` — ${data.dosage}` : ''} — ${data.price}
                                    </option>
                                ))}
                            </optgroup>

                            <optgroup label="── Repair & Healing" style={{ color: '#bfff00', backgroundColor: '#111' }}>
                                {Object.entries(PRODUCT_MAP).filter(([id]) => ['bpc157-injection', 'bpc157-tb500-injection'].includes(id)).map(([id, data]) => (
                                    <option key={id} value={id} className="bg-[#111111] text-white">
                                        {data.name}{data.dosage ? ` — ${data.dosage}` : ''} — ${data.price}
                                    </option>
                                ))}
                            </optgroup>
                        </select>
                    </div>

                    {/* Price */}
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-white/50 mb-2">Price ($)</label>
                        <input
                            type="text"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent-black"
                        />
                    </div>

                    {/* Shipping Address */}
                    <div className="p-5 bg-white/5 rounded-3xl border border-white/10">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-3">Shipping Address</label>
                        <p className="text-[11px] text-white/70 font-bold uppercase tracking-widest leading-relaxed">
                            {submission.shipping_first_name} {submission.shipping_last_name}<br />
                            {address}
                        </p>
                    </div>

                    {/* Coupon */}
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-white/50 mb-2">Apply Coupon Code</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Enter coupon code"
                                value={coupon}
                                onChange={(e) => setCoupon(e.target.value)}
                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent-black"
                            />
                            <button className="px-6 py-3 bg-white/5 hover:bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all border border-white/10">Apply</button>
                        </div>
                    </div>

                    {/* Provider Information Section */}
                    <div className="pt-4 border-t border-white/10">
                        <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-white/60 mb-6">Provider Information</label>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-white/50 mb-2">First Name</label>
                                <input
                                    type="text"
                                    value={orderData.provider_first_name}
                                    onChange={(e) => handleDataChange('provider_first_name', e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent-black"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-white/50 mb-2">Last Name</label>
                                <input
                                    type="text"
                                    value={orderData.provider_last_name}
                                    onChange={(e) => handleDataChange('provider_last_name', e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent-black"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-white/50 mb-2">Provider Type</label>
                                <input
                                    type="text"
                                    value={orderData.provider_type}
                                    onChange={(e) => handleDataChange('provider_type', e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent-black"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-white/50 mb-2">Delivery Status</label>
                                <select
                                    value={orderData.delivery_status}
                                    onChange={(e) => handleDataChange('delivery_status', e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white focus:outline-none focus:border-accent-black cursor-pointer"
                                >
                                    <option value="Not delivered" className="bg-[#111111]">1. Not delivered</option>
                                    <option value="Processing" className="bg-[#111111]">2. Processing</option>
                                    <option value="Shipped" className="bg-[#111111]">3. Shipped</option>
                                    <option value="Delivered" className="bg-[#111111]">4. Delivered</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-8 border-t border-white/10 bg-[#111111] flex gap-4 shrink-0">
                    <button
                        onClick={onClose}
                        className="flex-1 py-5 border border-white/10 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white/5 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCharge}
                        disabled={charging}
                        className="flex-[2] py-5 bg-accent-black text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-[#111111] hover:shadow-[0_0_40px_rgba(191,255,0,0.4)] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                        {charging ? (
                            <>
                                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                                Processing...
                            </>
                        ) : 'Charge'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Submission Review Modal ---
const SectionHeader = ({ title }) => (
    <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-white mb-6 mt-12 bg-accent-black/5 py-3 px-6 rounded-lg inline-block whitespace-nowrap">{title}</h4>
);

const InfoRow = ({ label, value, isFile, field, type = 'text', options = [], isEditing, formData, onChange }) => (
    <div className="flex flex-col md:flex-row md:items-center justify-between py-4 border-b border-white/10 group hover:bg-[#111111]/[0.02] px-4 transition-all duration-300">
        <span className="text-[10px] text-white/30 uppercase font-black tracking-widest leading-none shrink-0 md:w-1/3">{label}</span>
        <div className="flex-1 md:text-right">
            {isEditing && field && !isFile ? (
                type === 'select' ? (
                    <select
                        value={formData[field] || ''}
                        onChange={(e) => onChange(field, e.target.value)}
                        className="bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-accent-black w-full md:w-auto"
                    >
                        <option value="">Select...</option>
                        {options.map((opt, i) => {
                            const optValue = typeof opt === 'object' ? opt.value : opt;
                            const optLabel = typeof opt === 'object' ? opt.label : opt;
                            return (
                                <option key={i} value={optValue} className="bg-[#111111]">{optLabel}</option>
                            );
                        })}
                    </select>
                ) : (
                    <input
                        type={type}
                        value={formData[field] || ''}
                        onChange={(e) => onChange(field, e.target.value)}
                        onBlur={(e) => onChange(field, e.target.value)} // Ensure value is committed on blur
                        className="bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-accent-black w-full md:w-auto text-right"
                    />
                )
            ) : isFile ? (
                <div className="flex flex-wrap gap-2 mt-2 md:mt-0 justify-start md:justify-end">
                    {Array.isArray(value) ? (
                        value.map((url, i) => (
                            <a key={i} href={url} target="_blank" rel="noreferrer" className="px-4 py-2 bg-accent-green text-black border border-accent-green/20 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all">
                                View {value.length > 1 ? `Doc ${i + 1}` : 'Document'}
                            </a>
                        ))
                    ) : (
                        <a href={value} target="_blank" rel="noreferrer" className="px-4 py-2 bg-accent-green text-black border border-accent-green/20 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all">
                            View Document
                        </a>
                    )}
                </div>
            ) : (
                <span className="mt-1 md:mt-0 text-sm font-bold text-white/90">
                    {Array.isArray(value) ? value.join(', ') : (value || 'None')}
                </span>
            )}
        </div>
    </div>
);

const SubmissionModal = ({ submission, onClose, onAction }) => {
    if (!submission) return null;

    const [processing, setProcessing] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState(() => JSON.parse(JSON.stringify(submission)));
    const [showReportModal, setShowReportModal] = useState(false);
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [profileData, setProfileData] = useState(null);
    const [hasPaymentMethod, setHasPaymentMethod] = useState(true); // Default to true to avoid flash, or check immediately

    // Check for payment method on load
    useEffect(() => {
        const syncProfileData = async () => {
            if (!submission?.user_id) return;
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('stripe_customer_id, date_of_birth')
                    .eq('id', submission.user_id)
                    .single();

                if (data) {
                    setProfileData(data);
                    setHasPaymentMethod(!!data.stripe_customer_id);
                    // Seed DOB into formData if not already present
                    if (data.date_of_birth) {
                        setFormData(prev => ({
                            ...prev,
                            date_of_birth: prev.date_of_birth || data.date_of_birth
                        }));
                    }
                }
            } catch (err) {
                console.error('Error syncing profile meta:', err);
                setHasPaymentMethod(false);
            }
        };
        syncProfileData();
    }, [submission.user_id]);

    // Use a ref to track save state - this won't trigger re-renders 
    // and won't be affected by React batching
    const justSavedRef = React.useRef(false);
    const submissionIdRef = React.useRef(submission.id);

    // Only sync formData from props when:
    // 1. NOT currently editing
    // 2. NOT just saved (to prevent overwriting our update)
    // 3. The submission ID matches (same record)
    useEffect(() => {
        // If the submission ID changed, always reset (opening a different record)
        if (submission.id !== submissionIdRef.current) {
            submissionIdRef.current = submission.id;
            justSavedRef.current = false;
            setFormData(JSON.parse(JSON.stringify(submission)));
            setIsEditing(false);
            return;
        }

        // If we just saved, don't overwrite with potentially stale props
        if (justSavedRef.current) {
            console.log('Skipping prop sync - just saved');
            return;
        }

        // If editing, don't overwrite user's changes
        if (isEditing) {
            console.log('Skipping prop sync - currently editing');
            return;
        }

        // Safe to sync from props
        console.log('Syncing formData from props');
        setFormData(JSON.parse(JSON.stringify(submission)));
    }, [submission, isEditing]);

    // Normalize data sources for display, but editing will target specific fields
    const intake = formData.medical_responses || formData.intake_data || {};

    const handleUpdateStatus = async (status) => {
        setProcessing(true);
        try {
            // 1. Update the status in the database
            const { error } = await supabase
                .from('form_submissions')
                .update({ approval_status: status })
                .eq('id', submission.id);

            if (error) throw error;

            // 2. If approved, update the user's current_plan in profiles table
            if (status === 'approved' && submission.user_id) {
                // Determine the category for this submission
                const drug = (formData.selected_drug || '').toLowerCase();
                let category = 'weight_loss';

                if (drug.includes('hair-restoration') || drug.includes('finasteride') || drug.includes('minoxidil')) {
                    category = 'hair_restoration';
                } else if (drug.includes('sexual-health') || drug.includes('sildenafil') || drug.includes('tadalafil') || drug.includes('oxytocin')) {
                    category = 'sexual_health';
                } else if (drug.includes('longevity') || drug.includes('nad') || drug.includes('glutathione')) {
                    category = 'longevity';
                } else if (drug.includes('weight-loss') || drug.includes('semaglutide') || drug.includes('tirzepatide')) {
                    category = 'weight_loss';
                }

                // Fetch current profile
                const { data: profileData, error: profileFetchError } = await supabase
                    .from('profiles')
                    .select('current_plan')
                    .eq('id', submission.user_id)
                    .single();

                if (profileFetchError && profileFetchError.code !== 'PGRST116') {
                    console.warn('Could not fetch profile:', profileFetchError);
                }

                // Parse existing current_plan (handle both old string format and new JSON format)
                let currentPlans = {};
                if (profileData?.current_plan) {
                    try {
                        // Try parsing as JSON first (new format)
                        currentPlans = JSON.parse(profileData.current_plan);

                        // Remove any "legacy" entries that were created by old migration logic
                        if (currentPlans.legacy) {
                            delete currentPlans.legacy;
                        }
                    } catch {
                        // If parsing fails, it's the old string format
                        // Instead of migrating it, just start fresh with the new entry
                        // (The old format is being replaced by the new categorized system)
                        currentPlans = {};
                    }
                }

                // Update the plan for this category
                currentPlans[category] = formData.dosage_preference || formData.selected_drug;

                // Save back as stringified JSON
                const { error: profileUpdateError } = await supabase
                    .from('profiles')
                    .update({ current_plan: JSON.stringify(currentPlans) })
                    .eq('id', submission.user_id);

                if (profileUpdateError) {
                    console.warn('Submission approved but profile update failed:', profileUpdateError);
                }

                // 2.1 Send Approval SMS
                console.log('Submission approved. Sending status SMS...');
                await supabase.functions.invoke('send-sms', {
                    method: 'POST',
                    body: {
                        phone: formData.shipping_phone || submission.shipping_phone,
                        message: `Congratulations ${formData.shipping_first_name || 'Valued Patient'}! Your GLP-GLOW assessment has been APPROVED. Log in to your dashboard to complete your checkout and start treatment.`
                    }
                }).catch(err => console.warn('Approval SMS failed:', err));
            }

            // 3. If rejected, send email & SMS notification
            if (status === 'rejected') {
                console.log('Submission rejected. Sending notification email & SMS...');
                const { error: emailError } = await supabase.functions.invoke('send-email', {
                    method: 'POST',
                    body: {
                        type: 'REJECTION',
                        email: formData.email || submission.email || formData.shipping_email,
                        first_name: formData.shipping_first_name || submission.shipping_first_name || 'Valued'
                    }
                });

                if (emailError) {
                    console.warn('Rejection saved, but email notification failed:', emailError);
                } else {
                    console.log('Rejection email sent successfully.');
                }

                // Send Rejection SMS
                await supabase.functions.invoke('send-sms', {
                    method: 'POST',
                    body: {
                        phone: formData.shipping_phone || submission.shipping_phone,
                        message: `Hello ${formData.shipping_first_name || 'Valued Patient'}. Your GLP-GLOW assessment results are available. Unfortunately, we cannot proceed with your treatment at this time based on medical guidelines. Please check your email for more details.`
                    }
                }).catch(err => console.warn('Rejection SMS failed:', err));
            }

            onAction(); // Refresh data
            if (status !== 'pending') onClose();
        } catch (err) {
            console.error('Error updating status:', err);
            alert('Failed to update submission status.');
        } finally {
            setProcessing(false);
        }
    };

    const handleSaveChanges = async () => {
        console.log('=== SAVE STARTED ===');
        console.log('Current formData:', formData);
        setProcessing(true);

        // CRITICAL: Set this BEFORE any async operations
        justSavedRef.current = true;

        try {
            // Calculate BMI if height and weight are available
            const heightInInches = (Number(formData.height_feet) * 12) + Number(formData.height_inches);
            const weightVal = Number(formData.weight);
            const calculatedBmi = heightInInches > 0 && weightVal > 0
                ? parseFloat(((weightVal / (heightInInches * heightInInches)) * 703).toFixed(1))
                : formData.bmi;

            // Prepare a comprehensive update object with ALL editable fields
            const updatePayload = {
                // Personal Information
                shipping_first_name: formData.shipping_first_name,
                shipping_last_name: formData.shipping_last_name,
                email: formData.email,
                shipping_email: formData.shipping_email || formData.email,
                sex: formData.sex,
                date_of_birth: formData.date_of_birth,
                state: formData.state || formData.shipping_state,
                race_ethnicity: formData.race_ethnicity,

                // Physical Measurements
                height_feet: formData.height_feet ? Number(formData.height_feet) : null,
                height_inches: formData.height_inches ? Number(formData.height_inches) : null,
                weight: formData.weight ? Number(formData.weight) : null,
                bmi: calculatedBmi,

                // Shipping Information
                shipping_state: formData.shipping_state,
                shipping_city: formData.shipping_city,
                shipping_street: formData.shipping_street || formData.shipping_address,
                shipping_address: formData.shipping_address || formData.shipping_street,
                shipping_zip: formData.shipping_zip,
                shipping_phone: formData.shipping_phone,

                // Goals & Drug Selection
                goals: formData.goals,
                selected_drug: formData.selected_drug,
                dosage_preference: formData.dosage_preference,
                other_health_goals: formData.other_health_goals,

                // Clinical Data
                seen_pcp: formData.seen_pcp,
                medical_responses: formData.medical_responses,

                // Identification
                identification_type: formData.identification_type,
                identification_number: formData.identification_number,
            };

            console.log('Update payload:', updatePayload);

            const { data, error } = await supabase
                .from('form_submissions')
                .update(updatePayload)
                .eq('id', submission.id)
                .select();

            if (error) {
                console.error('Supabase update error:', error);
                justSavedRef.current = false; // Reset on error
                throw error;
            }

            console.log('Supabase update response:', data);

            if (data && data.length > 0) {
                // Update local state with the confirmed server response
                console.log('Setting formData from server response:', data[0]);
                setFormData(data[0]);
            }

            setIsEditing(false);

            // Refresh parent data to sync the queue
            console.log('Refreshing parent queue...');
            await onAction();
            console.log('Parent queue refreshed');

            // Keep justSavedRef true for a bit longer to prevent prop sync
            setTimeout(() => {
                justSavedRef.current = false;
                console.log('justSavedRef reset to false');
            }, 2000);

            alert('Submission updated successfully!');
            console.log('=== SAVE COMPLETED ===');
        } catch (err) {
            console.error('Error saving changes:', err);
            justSavedRef.current = false;
            alert(`Failed to save changes: ${err.message || 'Unknown error'}`);
        } finally {
            setProcessing(false);
        }
    };

    const handleChange = (field, value) => {
        console.log('Field change:', field, '=', value);
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleIntakeChange = (questionId, value) => {
        console.log('Intake change:', questionId, '=', value);
        setFormData(prev => {
            // Get current responses, prioritizing medical_responses
            const currentResponses = prev.medical_responses || prev.intake_data || {};

            // Create a new object for responses to alert React of the change
            const newResponses = { ...currentResponses, [questionId]: value };

            return {
                ...prev,
                medical_responses: newResponses,
                // If specific top-level fields are mapped from questions, update them too
                ...(questionId === 'dosage_preference' && { dosage_preference: value }),
                ...(questionId === 'other_health_goals' && { other_health_goals: value })
            };
        });
    };



    return (
        <>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 2xl:p-12 bg-black/95 backdrop-blur-3xl animate-in fade-in duration-500">
                <div className="w-full max-w-5xl 2xl:max-w-7xl 3xl:max-w-[90vw] max-h-[92vh] bg-[#0A0A0A] border border-white/10 rounded-[40px] shadow-2xl overflow-hidden flex flex-col border-glow border-accent-black/20">
                    {/* Header */}
                    <div className="p-8 md:p-10 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between bg-[#080808] shrink-0 gap-8">
                        <div>
                            <div className="flex items-center gap-4 mb-2">
                                <h3 className="text-3xl font-black uppercase  tracking-tighter leading-none">Review <span className="text-white">Assessment</span></h3>
                                <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[8px] font-black text-white/50 uppercase tracking-widest">{String(submission.id).substring(0, 8)}</span>
                            </div>
                            <p className="text-[10px] text-white/50 uppercase font-black tracking-[0.2em]">Complete Clinical Intelligence for <span className="text-white">{formData.shipping_first_name} {formData.shipping_last_name}</span></p>
                        </div>
                        <div className="flex flex-wrap items-center gap-4">
                            {!isEditing ? (
                                <>
                                    {formData.provider_note_report ? (
                                        <div className="flex gap-2">
                                            <a
                                                href={formData.provider_note_report}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="px-6 py-2 bg-accent-black/10 border border-accent-black/30 rounded-xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-accent-black hover:text-white transition-all flex items-center gap-2"
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                                                View Report
                                            </a>
                                            <button
                                                onClick={() => setShowReportModal(true)}
                                                className="px-6 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/50 hover:text-white hover:bg-white/5 transition-all flex items-center gap-2"
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M23 4v6h-6" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>
                                                Regenerate
                                            </button>
                                        </div>
                                    ) : (
                                        (formData.selected_drug?.includes('weight') || formData.selected_drug?.includes('semaglutide') || formData.selected_drug?.includes('tirzepatide')) && (
                                            <button
                                                onClick={() => setShowReportModal(true)}
                                                className="px-6 py-2 bg-blue-500/10 border border-blue-500/30 rounded-xl text-[10px] font-black uppercase tracking-widest text-blue-400 hover:bg-blue-500 hover:text-white transition-all flex items-center gap-2"
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                                                Generate Report
                                            </button>
                                        )
                                    )}
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="px-6 py-2 bg-accent-black border border-accent-black rounded-xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-[#111111] hover:text-white transition-all shadow-[0_0_20px_rgba(191,255,0,0.3)]"
                                    >
                                        Edit Details
                                    </button>
                                </>
                            ) : (
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => { setIsEditing(false); setFormData(JSON.parse(JSON.stringify(submission))); }}
                                        className="px-4 py-2 border border-red-500/30 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500/10 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSaveChanges(); }}
                                        disabled={processing}
                                        className="px-6 py-2 bg-accent-black rounded-xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-[#111111] transition-all disabled:opacity-50"
                                    >
                                        {processing ? 'Saving...' : 'Save'}
                                    </button>
                                </div>
                            )}
                            <button onClick={onClose} className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-all text-white/50 hover:text-white group">
                                <svg className="group-hover:rotate-90 transition-transform duration-500" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
                            </button>
                        </div>
                    </div>

                    {/* Content - Wrapped in Form */}
                    <form className="flex flex-col flex-1 overflow-hidden" onSubmit={(e) => { e.preventDefault(); handleSaveChanges(); }}>
                        <div className="flex-1 overflow-y-auto p-10 md:p-14 no-scrollbar bg-[#090909]">
                            <div className="max-w-4xl mx-auto">

                                {/* Change Request Details */}
                                {formData.additional_health_info && (formData.additional_health_info.includes('CHANGE REQUEST') || formData.additional_health_info.includes('Dosage')) && (
                                    <>
                                        <SectionHeader title="Change Request Details" />
                                        <div className="p-8 bg-purple-500/5 border border-purple-500/20 rounded-[32px] mb-8">
                                            <div className="flex items-start gap-4">
                                                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M12 4v16m8-8H4" />
                                                    </svg>
                                                </div>
                                                <pre className="text-sm font-bold text-white/90 whitespace-pre-wrap font-sans leading-relaxed">
                                                    {formData.additional_health_info}
                                                </pre>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Personal Information */}
                                <SectionHeader title="Personal Information" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
                                    <InfoRow label="First Name" field="shipping_first_name" value={formData.shipping_first_name} isEditing={isEditing} formData={formData} onChange={handleChange} />
                                    <InfoRow label="Last Name" field="shipping_last_name" value={formData.shipping_last_name} isEditing={isEditing} formData={formData} onChange={handleChange} />
                                    <InfoRow label="Email" field="email" value={formData.email || formData.shipping_email} isEditing={isEditing} formData={formData} onChange={handleChange} />
                                    <InfoRow label="Sex" field="sex" value={formData.sex || intake.sex || intake.assigned_sex_intake || (intake.eligibility && intake.eligibility.sex)} type="select" options={['male', 'female', 'other']} isEditing={isEditing} formData={formData} onChange={handleChange} />
                                    <InfoRow label="Date of Birth" field="date_of_birth" value={formData.date_of_birth ||
                                        profileData?.date_of_birth ||
                                        (typeof intake.dob === 'object' ? `${intake.dob.month}/${intake.dob.day}/${intake.dob.year}` : intake.dob) ||
                                        (typeof intake.date_of_birth === 'object' ? `${intake.date_of_birth.month}/${intake.date_of_birth.day}/${intake.date_of_birth.year}` : intake.date_of_birth) ||
                                        (intake.eligibility && (typeof intake.eligibility.dob === 'object' ? `${intake.eligibility.dob.month}/${intake.eligibility.dob.day}/${intake.eligibility.dob.year}` : intake.eligibility.dob)) ||
                                        formData.dob ||
                                        submission.birthday} type="date" isEditing={isEditing} formData={formData} onChange={handleChange} />
                                    <InfoRow label="State" field="shipping_state" value={formData.shipping_state || formData.state || (intake.eligibility && intake.eligibility.state)} isEditing={isEditing} formData={formData} onChange={handleChange} />
                                    <InfoRow label="Race/Ethnicity" field="race_ethnicity" value={formData.race_ethnicity || intake.ethnicity || intake.race || 'Not specified'} isEditing={isEditing} formData={formData} onChange={handleChange} />
                                </div>

                                {/* Physical Measurements */}
                                <SectionHeader title="Physical Measurements" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
                                    {isEditing ? (
                                        <div className="flex flex-col md:flex-row md:items-center justify-between py-4 border-b border-white/10 px-4">
                                            <span className="text-[10px] text-white/30 uppercase font-black tracking-widest leading-none shrink-0 md:w-1/3">Height</span>
                                            <div className="flex gap-2 justify-end flex-1">
                                                <input
                                                    type="number"
                                                    placeholder="Ft"
                                                    value={formData.height_feet || ''}
                                                    onChange={(e) => handleChange('height_feet', e.target.value)}
                                                    className="w-16 bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-accent-black text-right"
                                                />
                                                <input
                                                    type="number"
                                                    placeholder="In"
                                                    value={formData.height_inches || ''}
                                                    onChange={(e) => handleChange('height_inches', e.target.value)}
                                                    className="w-16 bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-accent-black text-right"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <InfoRow label="Height" value={
                                            formData.height_feet && formData.height_inches
                                                ? `${formData.height_feet}'${formData.height_inches}"`
                                                : (intake.height ||
                                                    (intake.height_feet && intake.height_inches ? `${intake.height_feet}'${intake.height_inches}"` : null) ||
                                                    (intake.bmi_height_feet && intake.bmi_height_inches ? `${intake.bmi_height_feet}'${intake.bmi_height_inches}"` : null) ||
                                                    (intake.bmi_height ? intake.bmi_height : null) ||
                                                    'N/A')
                                        } isEditing={isEditing} formData={formData} onChange={handleChange} />
                                    )}

                                    <InfoRow label="Weight (lbs)" field="weight" value={formData.weight || intake.weight || intake.bmi_weight || intake.bmiWeight || 'N/A'} type="number" isEditing={isEditing} formData={formData} onChange={handleChange} />

                                    <div className="md:col-span-2 mt-4">
                                        <div className="flex items-center justify-between p-8 bg-accent-black/[0.03] border border-accent-black/10 rounded-[32px]">
                                            <div>
                                                <p className="text-[10px] text-white uppercase font-black tracking-widest mb-1">Advanced Metric</p>
                                                <h5 className="text-sm font-black uppercase text-white/80">Body Mass Index (BMI)</h5>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-4xl font-black  tracking-tighter text-white leading-none mb-1">
                                                    {/* Recalculate BMI if editing */}
                                                    {(() => {
                                                        const hFeet = formData.height_feet || (intake.height_feet) || (intake.bmi_height_feet);
                                                        const hInches = formData.height_inches || (intake.height_inches) || (intake.bmi_height_inches) || 0;
                                                        const wVal = formData.weight || intake.weight || intake.bmi_weight || intake.bmiWeight;

                                                        const hTotal = (Number(hFeet) * 12) + Number(hInches);
                                                        const w = Number(wVal);
                                                        if (hTotal > 0 && w > 0) return ((w / (hTotal * hTotal)) * 703).toFixed(1);
                                                        return formData.bmi || 'N/A';
                                                    })()}
                                                </p>
                                                <p className="text-[8px] font-black uppercase tracking-widest text-white/40">Clinical Grade</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Goals & Selection */}
                                <SectionHeader title="Goals & Drug Selection" />
                                <div className="space-y-4">
                                    <div className="p-8 bg-white/5 rounded-[32px] border border-white/10">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-4">Patient-Defined Objectives</p>
                                        <div className="flex flex-wrap gap-3">
                                            {(formData.goals || []).map((goal, i) => (
                                                <span key={i} className="px-5 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/80">{goal.replace(/-/g, ' ')}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
                                        <InfoRow
                                            label="Program Category"
                                            field="selected_drug"
                                            value={formData.selected_drug}
                                            type="select"
                                            options={[
                                                { value: 'weight-loss', label: 'Weight Loss' },
                                                { value: 'hair-restoration', label: 'Hair Restoration' },
                                                { value: 'sexual-health', label: 'Sexual Health' },
                                                { value: 'longevity', label: 'Longevity' },
                                                { value: 'testosterone', label: 'Testosterone' },
                                                { value: 'repair-healing', label: 'Repair & Healing' }
                                            ]}
                                            isEditing={isEditing} formData={formData} onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                {/* Comprehensive Clinical Assessment */}
                                <SectionHeader title="Comprehensive Clinical Assessment" />
                                <div className="space-y-8 mt-6">

                                    {/* Digital Prescription */}
                                    {formData.prescription_pdf_url && (
                                        <div className="flex flex-col gap-2 border-b border-white/10 pb-6">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">
                                                Digital Prescription
                                            </p>
                                            <div>
                                                <a
                                                    href={formData.prescription_pdf_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-sm font-bold text-white hover:underline break-all"
                                                >
                                                    Prescription PDF: {formData.prescription_pdf_url}
                                                </a>
                                            </div>
                                        </div>
                                    )}

                                    {/* Manual entry for Eligibility Check */}
                                    {formData.seen_pcp && (
                                        <div className="flex flex-col gap-2 border-b border-white/10 pb-6">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">
                                                Have you seen a primary care physician in the last 6 months?
                                            </p>
                                            {isEditing ? (
                                                <select
                                                    value={formData.seen_pcp}
                                                    onChange={(e) => handleChange('seen_pcp', e.target.value)}
                                                    className="bg-white/5 border border-white/10 rounded px-2 py-2 text-sm text-white focus:outline-none focus:border-accent-black w-full"
                                                >
                                                    <option value="Yes">Yes</option>
                                                    <option value="No">No</option>
                                                </select>
                                            ) : (
                                                <p className="text-sm font-bold text-white/90 leading-relaxed">
                                                    {formData.seen_pcp}
                                                </p>
                                            )}
                                        </div>
                                    )}



                                    {(() => {
                                        const categoryId = getMedicationCategoryId(formData.selected_drug);
                                        const questions = intakeQuestions[categoryId] || intakeQuestions['weight-loss'];
                                        const answers = (formData.medical_responses && Object.keys(formData.medical_responses).length > 0)
                                            ? formData.medical_responses
                                            : (formData.intake_data || {});

                                        return questions
                                            .filter(q => q.id !== 'other_health_goals' && q.id !== 'selected_medication' && q.id !== 'medication_preference' && q.id !== 'dosage_preference')
                                            .map((q) => {
                                                if (q.type === 'info') return null;

                                                let answer = answers[q.id];

                                                // Fallback for top-level keys if not in medical_responses
                                                if (answer === undefined && formData[q.id]) answer = formData[q.id];

                                                if ((answer === undefined || answer === null || answer === '') && !isEditing) return null;

                                                return (
                                                    <div key={q.id} className="flex flex-col gap-2 border-b border-white/10 pb-6 last:border-0">
                                                        <p className="text-[10px] font-black tracking-widest text-white/50 mb-1">{q.question}</p>
                                                        {isEditing ? (
                                                            q.type === 'select' || q.type === 'boolean' || (q.options?.length > 0) ? (
                                                                <select
                                                                    value={answer || ''}
                                                                    onChange={(e) => handleIntakeChange(q.id, e.target.value)}
                                                                    className="bg-white/5 border border-white/10 rounded px-2 py-2 text-sm text-white focus:outline-none focus:border-accent-black w-full"
                                                                >
                                                                    <option value="">Select...</option>
                                                                    {q.options ? q.options.map(opt => (
                                                                        <option key={typeof opt === 'string' ? opt : opt.value} value={typeof opt === 'string' ? opt : opt.value}>
                                                                            {typeof opt === 'string' ? opt : opt.label}
                                                                        </option>
                                                                    )) : (
                                                                        <>
                                                                            <option value="Yes">Yes</option>
                                                                            <option value="No">No</option>
                                                                        </>
                                                                    )}
                                                                </select>
                                                            ) : (
                                                                <textarea
                                                                    value={answer || ''}
                                                                    onChange={(e) => handleIntakeChange(q.id, e.target.value)}
                                                                    className="bg-white/5 border border-white/10 rounded px-2 py-2 text-sm text-white focus:outline-none focus:border-accent-black w-full h-24"
                                                                />
                                                            )
                                                        ) : (
                                                            <div className="text-sm font-bold text-white/90 leading-relaxed">
                                                                {Array.isArray(answer) ? (
                                                                    <ul className="list-disc list-inside space-y-1 marker:text-white">
                                                                        {answer.map((item, i) => <li key={i}>{item}</li>)}
                                                                    </ul>
                                                                ) : (
                                                                    answer?.toString()
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* Edit details if applicable */}
                                                        {(q.details || answers[`${q.id}_details`]) && (
                                                            <div className="mt-3 pl-4 border-l-2 border-accent-black/30">
                                                                <p className="text-[9px] text-white font-bold uppercase tracking-wider mb-1">Details:</p>
                                                                {isEditing ? (
                                                                    <textarea
                                                                        value={answers[`${q.id}_details`] || ''}
                                                                        onChange={(e) => handleIntakeChange(`${q.id}_details`, e.target.value)}
                                                                        className="bg-white/5 border border-white/10 rounded px-2 py-2 text-sm text-white focus:outline-none focus:border-accent-black w-full"
                                                                    />
                                                                ) : (
                                                                    <p className="text-sm text-white/80">{answers[`${q.id}_details`]}</p>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* Files (e.g. current_meds upload, lab results, ID) */}
                                                        {q.upload && (() => {
                                                            // Collect all possible file URLs for this question
                                                            const fileUrls = [
                                                                answers[`${q.id}_file`],
                                                                q.id === 'current_medications' && formData.glp1_prescription_url,
                                                                q.id === 'lab_results' && formData.lab_results_url,
                                                                q.id === 'identification' && formData.identification_url,
                                                            ].filter(Boolean).flat();

                                                            if (fileUrls.length === 0) return null;

                                                            return (
                                                                <div className="mt-3 flex flex-wrap gap-2">
                                                                    {fileUrls.map((url, fi) => (
                                                                        <a
                                                                            key={fi}
                                                                            href={url}
                                                                            target="_blank"
                                                                            rel="noreferrer"
                                                                            className="inline-flex items-center gap-2 px-4 py-2 bg-accent-black/10 border border-accent-black/30 rounded-lg text-[10px] font-black uppercase tracking-widest text-white hover:bg-accent-black hover:text-white transition-all"
                                                                        >
                                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                                                                            {fileUrls.length > 1 ? `View Document ${fi + 1}` : 'View Document'}
                                                                        </a>
                                                                    ))}
                                                                </div>
                                                            );
                                                        })()}
                                                    </div>
                                                );
                                            });
                                    })()}
                                </div>

                                {/* Identification */}
                                <SectionHeader title="Security & Verification" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
                                    <InfoRow label="ID Type" field="identification_type" value={formData.identification_type || 'License'} isEditing={isEditing} formData={formData} onChange={handleChange} />
                                    <InfoRow label="ID Number" field="identification_number" value={formData.identification_number || '��������'} isEditing={isEditing} formData={formData} onChange={handleChange} />
                                    <InfoRow label="Identification Document" value={formData.identification_url} isFile={!!formData.identification_url} isEditing={isEditing} formData={formData} onChange={handleChange} />
                                </div>

                                {/* Shipping & Logistics */}
                                <SectionHeader title="Shipping & Logistics" />
                                <div className="p-8 md:p-10 bg-white/5 rounded-[40px] border border-white/10">
                                    <div className="flex flex-col md:flex-row md:items-start gap-6 md:gap-8">
                                        <div className="w-16 h-16 bg-accent-black/10 rounded-3xl flex items-center justify-center border border-accent-black/20 shrink-0">
                                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#bfff00" strokeWidth="2"><path d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                                        </div>
                                        {isEditing ? (
                                            <div className="flex-1 grid grid-cols-1 gap-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <input type="text" placeholder="First Name" value={formData.shipping_first_name || ''} onChange={(e) => handleChange('shipping_first_name', e.target.value)} className="bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white" />
                                                    <input type="text" placeholder="Last Name" value={formData.shipping_last_name || ''} onChange={(e) => handleChange('shipping_last_name', e.target.value)} className="bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white" />
                                                </div>
                                                <input type="text" placeholder="Address" value={formData.shipping_street || formData.shipping_address || ''} onChange={(e) => handleChange('shipping_address', e.target.value)} className="bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white" />
                                                <div className="grid grid-cols-3 gap-4">
                                                    <input type="text" placeholder="City" value={formData.shipping_city || ''} onChange={(e) => handleChange('shipping_city', e.target.value)} className="bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white" />
                                                    <input type="text" placeholder="State" value={formData.shipping_state || ''} onChange={(e) => handleChange('shipping_state', e.target.value)} className="bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white" />
                                                    <input type="text" placeholder="Zip" value={formData.shipping_zip || ''} onChange={(e) => handleChange('shipping_zip', e.target.value)} className="bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white" />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <input type="text" placeholder="Phone" value={formData.shipping_phone || ''} onChange={(e) => handleChange('shipping_phone', e.target.value)} className="bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white" />
                                                    <input type="text" placeholder="Email" value={formData.shipping_email || ''} onChange={(e) => handleChange('shipping_email', e.target.value)} className="bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white" />
                                                </div>
                                            </div>
                                        ) : (
                                            <div>
                                                <h5 className="text-xl font-black uppercase  tracking-tighter mb-2">{formData.shipping_first_name} {formData.shipping_last_name}</h5>
                                                <p className="text-[11px] text-white/70 leading-[1.8] font-bold uppercase tracking-widest">
                                                    {formData.shipping_street || formData.shipping_address}<br />
                                                    {formData.shipping_city}, {formData.shipping_state} {formData.shipping_zip}<br />
                                                    <span className="text-white">PH: {formData.shipping_phone}</span><br />
                                                    <span className="text-white/50">{formData.shipping_email}</span>
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="h-20"></div>

                            </div>
                        </div>
                    </form>

                    {/* Actions */}
                    <div className="p-10 border-t border-white/10 bg-[#111111] shrink-0">
                        {!hasPaymentMethod && submission.approval_status === 'pending' && (
                            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
                                <p className="text-red-500 text-[10px] font-black uppercase tracking-widest">
                                    ?? Action Required: User has not added a payment method
                                </p>
                            </div>
                        )}
                        <div className="flex gap-6">
                            {submission.approval_status === 'pending' ? (
                                <>
                                    <button
                                        onClick={() => handleUpdateStatus('rejected')}
                                        disabled={processing || isEditing}
                                        className="flex-1 py-7 border border-red-500/30 text-red-500 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-red-500/10 transition-all disabled:opacity-50"
                                    >
                                        Deny Submission
                                    </button>
                                    <button
                                        onClick={() => setShowOrderModal(true)}
                                        disabled={processing || isEditing || !hasPaymentMethod}
                                        className="flex-[2] py-7 bg-accent-black text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-[#111111] hover:shadow-[0_0_60px_rgba(191,255,0,0.4)] transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                                    >
                                        {processing ? 'Clinical Verification...' : 'Verify & Approve Submission'}
                                    </button>
                                </>
                            ) : (
                                <div className="w-full flex flex-col md:flex-row md:items-center justify-between p-7 bg-white/5 rounded-[24px] border border-white/10 gap-6">
                                    <div className="flex items-center gap-6">
                                        <div className={`w-4 h-4 rounded-full shrink-0 ${submission.approval_status === 'approved' ? 'bg-accent-black shadow-[0_0_20px_rgba(191,255,0,0.5)]' : 'bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]'}`}></div>
                                        <div>
                                            <p className="text-[10px] text-white/30 uppercase font-black tracking-widest mb-1">Regulatory decision finalized</p>
                                            <p className="text-xl font-black uppercase  tracking-tighter leading-none">
                                                Clinical Status: <span className={submission.approval_status === 'approved' ? 'text-white' : 'text-red-500'}>{submission.approval_status}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleUpdateStatus('pending')}
                                        disabled={processing || isEditing}
                                        className="w-full md:w-auto px-10 py-5 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#111111] hover:text-white transition-all"
                                    >
                                        Re-open to Triage
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Generate Report Modal */}
            {showReportModal && (
                <GenerateReportModal
                    submission={formData}
                    onClose={() => setShowReportModal(false)}
                    onAction={onAction}
                />
            )}
            {/* Create Order Modal */}
            {showOrderModal && (
                <CreateOrderModal
                    submission={formData}
                    onClose={() => setShowOrderModal(false)}
                    onApprove={() => handleUpdateStatus('approved')}
                />
            )}
        </>
    );
};

// --- Clinical Queue ---
const ClinicalQueue = () => {
    const [queue, setQueue] = useState([]);
    const [filteredQueue, setFilteredQueue] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('pending');
    const [reviewingSubmission, setReviewingSubmission] = useState(null);

    const categories = [
        { id: 'all', name: 'All Submissions', color: 'white' },
        { id: 'weight-loss', name: 'Weight Loss', color: '#bfff00' },
        { id: 'hair-restoration', name: 'Hair Restoration', color: '#5CE1E6' },
        { id: 'sexual-health', name: 'Sexual Health', color: '#FFDE59' },
        { id: 'longevity', name: 'Longevity', color: '#FF7E5F' },
        { id: 'testosterone', name: 'Testosterone', color: '#FFD700' },
        { id: 'repair-healing', name: 'Repair & Healing', color: '#32CD32' }
    ];

    const [pendingCounts, setPendingCounts] = useState({});

    const fetchPendingCounts = async () => {
        const { data, error } = await supabase
            .from('form_submissions')
            .select('selected_drug')
            .eq('approval_status', 'pending');

        if (!error && data) {
            const counts = {};
            data.forEach(item => {
                const drug = (item.selected_drug || '').toLowerCase();
                let category = 'unknown';

                if (drug.includes('weight') || drug.includes('semaglutide') || drug.includes('tirzepatide')) {
                    category = 'weight-loss';
                } else if (drug.includes('hair') || drug.includes('finasteride') || drug.includes('minoxidil')) {
                    category = 'hair-restoration';
                } else if (drug.includes('sexual') || drug.includes('sildenafil') || drug.includes('tadalafil') || drug.includes('oxytocin')) {
                    category = 'sexual-health';
                } else if (drug.includes('longevity') || drug.includes('nad') || drug.includes('glutathione')) {
                    category = 'longevity';
                } else if (drug.includes('testosterone')) {
                    category = 'testosterone';
                } else if (drug.includes('repair') || drug.includes('bpc')) {
                    category = 'repair-healing';
                } else {
                    category = item.selected_drug || 'all';
                }

                counts[category] = (counts[category] || 0) + 1;
            });
            setPendingCounts(counts);
        }
    };

    const fetchQueue = async () => {
        console.log('=== FETCHING QUEUE ===');
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('form_submissions')
                .select('*')
                .eq('approval_status', statusFilter)
                .order('submitted_at', { ascending: true });

            if (!error && data) {
                console.log('Queue fetched, items:', data.length);
                // Log first item's key fields for debugging
                if (data.length > 0) {
                    console.log('First item sample:', {
                        id: data[0].id,
                        firstName: data[0].shipping_first_name,
                        lastName: data[0].shipping_last_name,
                        phone: data[0].shipping_phone
                    });
                }
                setQueue(data);
                setFilteredQueue(data);
            } else if (error) {
                console.error('Queue fetch error:', error);
            }
            fetchPendingCounts();
        } catch (err) {
            console.error('Error fetching queue:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQueue();
    }, [statusFilter]);

    // Update reviewingSubmission when queue updates (to reflect changes in the modal)
    useEffect(() => {
        if (reviewingSubmission) {
            const updatedItem = queue.find(item => item.id === reviewingSubmission.id);
            if (updatedItem) {
                console.log('Syncing reviewingSubmission from queue:', {
                    id: updatedItem.id,
                    firstName: updatedItem.shipping_first_name
                });
                // Always update with the latest from the queue to ensure sync
                setReviewingSubmission(updatedItem);
            }
        }
    }, [queue]);

    useEffect(() => {
        if (filter === 'all') {
            setFilteredQueue(queue);
        } else {
            setFilteredQueue(queue.filter(q => q.selected_drug === filter));
        }
    }, [filter, queue]);

    if (loading) return (
        <div className="py-20 flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-2 border-accent-black border-t-transparent animate-spin rounded-full"></div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Syncing Clinical Reservoir...</p>
        </div>
    );

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Filter Tabs */}
            <div className="flex overflow-x-auto no-scrollbar whitespace-nowrap pb-4 gap-3 -mx-2 px-2">
                {categories.map(cat => {
                    // Calculate badge count:
                    // For 'all', sum of all pending. For specific category, get from map.
                    const count = cat.id === 'all'
                        ? Object.values(pendingCounts).reduce((a, b) => a + b, 0)
                        : (pendingCounts[cat.id] || 0);

                    return (
                        <button
                            key={cat.id}
                            onClick={() => setFilter(cat.id)}
                            className={`inline-flex px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border items-center gap-2 ${filter === cat.id
                                ? 'bg-[#111111] text-white border-white'
                                : 'bg-white/5 text-white/50 border-white/10 hover:border-white/20'
                                }`}
                        >
                            {cat.name}
                            {count > 0 && (
                                <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-black ${filter === cat.id
                                    ? 'bg-accent-green text-black'
                                    : 'bg-white/10 text-white/70'
                                    }`}>
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Status Tabs */}
            <div className="flex gap-1 p-1 bg-white/5 border border-white/10 rounded-2xl w-fit">
                {['pending', 'approved', 'rejected'].map(status => (
                    <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`px-8 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${statusFilter === status
                            ? 'bg-[#111111] text-white shadow-lg shadow-white/5'
                            : 'text-white/30 hover:text-white/60'
                            }`}
                    >
                        {status}
                    </button>
                ))}
            </div>

            <div className="space-y-4">
                {filteredQueue.length === 0 ? (
                    <div className="py-24 text-center border-2 border-dashed border-white/10 rounded-[40px] flex flex-col items-center">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-white/10 mb-4">
                            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="opacity-20 uppercase font-black text-xs tracking-widest">No pending {filter !== 'all' ? filter.replace('-', ' ') : ''} submissions</p>
                    </div>
                ) : (
                    filteredQueue.map(item => {
                        const catInfo = categories.find(c => c.id === item.selected_drug) || categories[0];
                        return (
                            <div key={item.id} className="group p-8 bg-white/5 border border-white/10 rounded-[40px] hover:border-white/20 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="flex flex-col md:flex-row md:items-center gap-6">
                                    <div
                                        className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl  border border-white/10 shrink-0"
                                        style={{ color: catInfo.color, backgroundColor: `${catInfo.color}10` }}
                                    >
                                        {item.shipping_first_name?.charAt(0) || '?'}
                                    </div>
                                    <div>
                                        <div className="flex flex-wrap items-center gap-3 mb-1">
                                            <p className="text-lg font-black uppercase tracking-tighter ">{item.shipping_first_name} {item.shipping_last_name}</p>
                                            <span
                                                className="px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border"
                                                style={{ borderColor: `${catInfo.color}40`, color: catInfo.color, backgroundColor: `${catInfo.color}05` }}
                                            >
                                                {item.selected_drug?.replace('-', ' ')}
                                            </span>
                                            {/* Dosage/Medication Change Tags */}
                                            {item.additional_health_info && item.additional_health_info.includes('[DOSAGE CHANGE REQUEST]') && (
                                                <span className="px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border border-purple-500/40 text-purple-400 bg-purple-500/10">
                                                    Dosage Change
                                                </span>
                                            )}
                                            {item.additional_health_info && item.additional_health_info.includes('[MEDICATION CHANGE REQUEST]') && (
                                                <span className="px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border border-blue-500/40 text-blue-400 bg-blue-500/10">
                                                    Medication Change
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4 text-[10px] text-white/50 uppercase font-black tracking-widest">
                                            <span>Received {new Date(item.submitted_at).toLocaleDateString()}</span>
                                            <span className="w-1 h-1 bg-white/5 rounded-full"></span>
                                            <span>{item.shipping_state}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => setReviewingSubmission(item)}
                                        className="px-8 py-5 bg-[#111111] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-accent-black hover:shadow-[0_0_40px_rgba(255,222,89,0.4)] transition-all"
                                    >
                                        {statusFilter === 'pending' ? 'Review Submission' : 'View Record'}
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Review Modal */}
            {reviewingSubmission && (
                <SubmissionModal
                    submission={reviewingSubmission}
                    onClose={() => setReviewingSubmission(null)}
                    onAction={fetchQueue}
                />
            )}
        </div>
    );
};

// --- Discount Manager ---
const DiscountManager = () => {
    const { user } = useAuth();
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newCoupon, setNewCoupon] = useState({
        code: '',
        description: '',
        discount_value: '',
        discount_type: 'percentage',
        coupon_type: 'eligibility',
        expiration_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year default
        is_active: true
    });
    const [adding, setAdding] = useState(false);

    const fetchCoupons = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('coupons')
            .select('*')
            .order('created_at', { ascending: false });
        if (!error) setCoupons(data || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchCoupons();
    }, []);

    const handleCreateCoupon = async (e) => {
        e.preventDefault();
        setAdding(true);
        try {
            const { error } = await supabase
                .from('coupons')
                .insert([{
                    code: newCoupon.code.toUpperCase(),
                    description: newCoupon.description,
                    discount_value: parseFloat(newCoupon.discount_value),
                    discount_type: newCoupon.discount_type,
                    coupon_type: newCoupon.coupon_type,
                    expiration_date: new Date(newCoupon.expiration_date).toISOString(),
                    is_active: newCoupon.is_active,
                    created_by: user?.id
                }]);

            if (error) throw error;

            setNewCoupon({
                code: '',
                description: '',
                discount_value: '',
                discount_type: 'percentage',
                coupon_type: 'eligibility',
                expiration_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                is_active: true
            });
            fetchCoupons();
            alert('Coupon created successfully.');
        } catch (err) {
            console.error('Error creating coupon:', err);
            alert(`Failed to create coupon: ${err.message || 'Check database connection'}`);
        } finally {
            setAdding(false);
        }
    };

    const handleDeleteCoupon = async (id) => {
        if (!window.confirm('Are you sure you want to delete this coupon?')) return;
        const { error } = await supabase.from('coupons').delete().eq('id', id);
        if (!error) fetchCoupons();
    };

    return (
        <div className="flex flex-col-reverse md:flex-col gap-12 animate-in fade-in duration-700">
            {/* Create Coupon Card */}
            <div className="bg-white/5 border border-white/10 rounded-[40px] p-8 md:p-12 relative overflow-hidden group">
                <div className="flex flex-col md:block">
                    <div className="relative md:absolute top-0 right-0 p-0 md:p-12 mb-8 md:mb-0 text-white opacity-10 group-hover:opacity-20 transition-opacity">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                        </svg>
                    </div>

                    <h3 className="text-2xl font-black uppercase tracking-tighter  mb-8">Generate <span className="text-white">Discount Token</span></h3>
                </div>

                <form onSubmit={handleCreateCoupon} className="space-y-6 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-white/50 mb-3 ml-2">Coupon Code</label>
                            <input
                                type="text"
                                value={newCoupon.code}
                                onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value })}
                                placeholder="GLOW50"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm focus:outline-none focus:border-accent-black transition-all"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-white/50 mb-3 ml-2">Discount Value</label>
                            <input
                                type="number"
                                value={newCoupon.discount_value}
                                onChange={(e) => setNewCoupon({ ...newCoupon, discount_value: e.target.value })}
                                placeholder="25"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm focus:outline-none focus:border-accent-black transition-all"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-white/50 mb-3 ml-2">Type</label>
                            <div className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm font-bold opacity-60 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-accent-black"></span>
                                Percent (%)
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-white/50 mb-3 ml-2">Category</label>
                            <select
                                value={newCoupon.coupon_type}
                                onChange={(e) => setNewCoupon({ ...newCoupon, coupon_type: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm focus:outline-none focus:border-accent-black transition-all appearance-none"
                            >
                                <option value="eligibility" className="bg-[#111111]">Eligibility Fee</option>
                                <option value="product" className="bg-[#111111]">Product Discount</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-white/50 mb-3 ml-2">Description</label>
                            <input
                                type="text"
                                value={newCoupon.description}
                                onChange={(e) => setNewCoupon({ ...newCoupon, description: e.target.value })}
                                placeholder="Summer campaign discount for weight loss eligibility"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm focus:outline-none focus:border-accent-black transition-all"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-white/50 mb-3 ml-2">Expiration Date</label>
                            <input
                                type="date"
                                value={newCoupon.expiration_date}
                                onChange={(e) => setNewCoupon({ ...newCoupon, expiration_date: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm focus:outline-none focus:border-accent-black transition-all"
                                required
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={adding}
                            className="px-12 py-5 bg-accent-black text-white rounded-2xl font-black text-[12px] uppercase tracking-widest hover:bg-[#111111] transition-all shadow-[0_0_50px_rgba(191,255,0,0.2)]"
                        >
                            {adding ? 'Synchronizing Archive...' : 'Launch Promo Code ?'}
                        </button>
                    </div>
                </form>
            </div>

            {/* List Table */}
            <div className="bg-[#111111] border border-white/10 rounded-[40px] overflow-hidden">
                <div className="p-8 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-white/50 mb-1">Active Coupons Reservoir</h4>
                        <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest">Managing clinical and marketing incentives</p>
                    </div>
                    <div className="flex justify-start md:justify-end">
                        <span className="text-[10px] text-white font-bold px-3 py-1 bg-accent-black/10 rounded-full">{coupons.length} TOKENS</span>
                    </div>
                </div>
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-white/5">
                            <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-white/50">Code / Description</th>
                            <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-white/50">Value</th>
                            <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-white/50">Expires</th>
                            <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-white/50 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {loading ? (
                            <tr><td colSpan="4" className="p-12 text-center text-xs text-white/30 uppercase font-black tracking-widest">Hydrating table...</td></tr>
                        ) : coupons.length === 0 ? (
                            <tr><td colSpan="4" className="p-12 text-center text-xs text-white/30 uppercase font-black tracking-widest">No promo codes generated</td></tr>
                        ) : (
                            coupons.map(coupon => (
                                <tr key={coupon.id} className="group hover:bg-[#111111]/[0.02] transition-colors">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3 mb-1">
                                            <div className="w-2 h-2 rounded-full bg-accent-black shadow-[0_0_10px_rgba(255,222,89,0.5)]"></div>
                                            <span className="text-sm font-black tracking-widest ">{coupon.code}</span>
                                            <span className="text-[8px] font-black uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded text-white/50">{coupon.coupon_type}</span>
                                        </div>
                                        <p className="text-[10px] text-white/30 font-bold ml-5">{coupon.description}</p>
                                    </td>
                                    <td className="px-8 py-6 text-sm font-bold">
                                        {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `$${coupon.discount_value}`}
                                    </td>
                                    <td className="px-8 py-6 text-[10px] font-bold text-white/50 uppercase tracking-widest">
                                        {new Date(coupon.expiration_date).toLocaleDateString()}
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <button
                                            onClick={() => handleDeleteCoupon(coupon.id)}
                                            className="px-4 py-2 border border-red-500/20 text-[9px] font-black uppercase tracking-widest text-red-400 hover:bg-red-500 hover:text-white transition-all rounded-lg"
                                        >
                                            Purge
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- Subscriber Analytics ---
const SubscriberAnalytics = () => {
    const [activeTab, setActiveTab] = useState('active');
    const [subscribers, setSubscribers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const pageSize = 10;

    useEffect(() => {
        const fetchSubscribers = async () => {
            try {
                // Fetch profiles that have either active status OR a stripe id (meaning they were subscribed)
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .or('subscribe_status.eq.true,stripe_subscription_id.neq.null')
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setSubscribers(data || []);
            } catch (err) {
                console.error('Error fetching subscribers:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchSubscribers();
    }, []);

    // Reset pagination when tab changes
    useEffect(() => {
        setPage(1);
    }, [activeTab]);

    const activeSubs = subscribers.filter(s => s.subscribe_status === true);
    const expiredSubs = subscribers.filter(s => !s.subscribe_status);

    const fullList = activeTab === 'active' ? activeSubs : expiredSubs;
    const totalPages = Math.ceil(fullList.length / pageSize);
    const currentList = fullList.slice((page - 1) * pageSize, page * pageSize);

    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            {/* Stats Header */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                <div
                    onClick={() => setActiveTab('active')}
                    className={`p-8 rounded-[32px] border cursor-pointer transition-all relative overflow-hidden group ${activeTab === 'active' ? 'bg-accent-black/10 border-accent-black' : 'bg-white/5 border-white/10 hover:border-white/20'}`}
                >
                    <div className={`absolute -right-10 -top-10 w-32 h-32 blur-3xl transition-opacity opacity-0 group-hover:opacity-20 ${activeTab === 'active' ? 'bg-accent-black' : 'bg-[#111111]'}`}></div>
                    <div className="flex items-center gap-4 mb-6">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${activeTab === 'active' ? 'bg-accent-black text-white' : 'bg-white/5 text-white'}`}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${activeTab === 'active' ? 'text-white' : 'text-white/50'}`}>Tracking Active</span>
                    </div>
                    <p className={`text-4xl font-black  tracking-tighter ${activeTab === 'active' ? 'text-white' : 'text-white/60'}`}>{activeSubs.length}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mt-1">Active Subscriptions</p>
                </div>

                <div
                    onClick={() => setActiveTab('expired')}
                    className={`p-8 rounded-[32px] border cursor-pointer transition-all relative overflow-hidden group ${activeTab === 'expired' ? 'bg-red-500/10 border-red-500' : 'bg-white/5 border-white/10 hover:border-white/20'}`}
                >
                    <div className="absolute -right-10 -top-10 w-32 h-32 blur-3xl transition-opacity opacity-0 group-hover:opacity-20 bg-red-500"></div>
                    <div className="flex items-center gap-4 mb-6">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${activeTab === 'expired' ? 'bg-red-500 text-white' : 'bg-white/5 text-white'}`}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${activeTab === 'expired' ? 'text-red-500' : 'text-white/50'}`}>Tracking Churn</span>
                    </div>
                    <p className={`text-4xl font-black  tracking-tighter ${activeTab === 'expired' ? 'text-white' : 'text-white/60'}`}>{expiredSubs.length}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mt-1">Expired / Cancelled</p>
                </div>
            </div>

            {/* List Table */}
            <div className="bg-[#111111] border border-white/10 rounded-[40px] overflow-hidden">
                <div className="p-8 border-b border-white/10 flex items-center justify-between">
                    <div>
                        <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-white/50 mb-1">
                            {activeTab === 'active' ? 'Active Membership Roster' : 'Inactive / Expired Accounts'}
                        </h4>
                        <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest">
                            {activeTab === 'active' ? 'Revenue generating accounts' : 'Historical subscription data'}
                        </p>
                    </div>
                    {/* Pagination Summary */}
                    <div className="text-[9px] text-white/50 font-black uppercase tracking-widest">
                        Showing {currentList.length} of {fullList.length}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white/5">
                                <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-white/50">Subscriber</th>
                                <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-white/50">Current / Last Plan</th>
                                <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-white/50">
                                    {activeTab === 'active' ? 'Next Billing' : 'Expiration Date'}
                                </th>
                                <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-white/50 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr><td colSpan="4" className="p-12 text-center text-xs text-white/30 uppercase font-black tracking-widest">Loading subscription data...</td></tr>
                            ) : currentList.length === 0 ? (
                                <tr><td colSpan="4" className="p-12 text-center text-xs text-white/30 uppercase font-black tracking-widest">No records found in this category</td></tr>
                            ) : (
                                currentList.map(sub => (
                                    <tr key={sub.id} className="group hover:bg-[#111111]/[0.02] transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center font-black text-xs text-white/60">
                                                    {(sub.first_name || sub.email || '?').charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-white mb-0.5">{sub.first_name} {sub.last_name}</p>
                                                    <p className="text-[10px] text-white/50 font-medium">{sub.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-xs font-bold text-white/80">{formatPlanName(sub.current_plan)}</p>
                                            <p className="text-[9px] text-white/30 uppercase tracking-widest font-bold mt-1">
                                                ID: {sub.stripe_subscription_id ? String(sub.stripe_subscription_id).substring(0, 12) + '...' : '�'}
                                            </p>
                                        </td>
                                        <td className="px-8 py-6 text-[10px] font-bold text-white/60 uppercase tracking-widest">
                                            {sub.current_sub_end_date ? new Date(sub.current_sub_end_date).toLocaleDateString() : '�'}
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${activeTab === 'active'
                                                ? 'bg-accent-black/10 text-white border border-accent-black/20'
                                                : 'bg-red-500/10 text-red-500 border border-red-500/20'
                                                }`}>
                                                {activeTab === 'active' ? 'Active' : 'Expired'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="p-6 border-t border-white/10 flex items-center justify-between bg-[#111111]/[0.02]">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-6 py-3 bg-white/5 disabled:opacity-30 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all flex items-center gap-2"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
                            Prev
                        </button>
                        <div className="flex gap-2">
                            <span className="text-[10px] font-black text-white/50 uppercase tracking-widest bg-white/5 px-4 py-2 rounded-lg">
                                Page <span className="text-white">{page}</span> of {totalPages}
                            </span>
                        </div>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="px-6 py-3 bg-white/5 disabled:opacity-30 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all flex items-center gap-2"
                        >
                            Next
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Patient Express Entry ---
const PatientExpressEntry = () => {
    const { user } = useAuth();
    const [step, setStep] = useState('category'); // category, email, form, success
    const [selectedCategory, setSelectedCategory] = useState('');
    const [patientEmail, setPatientEmail] = useState('');
    const [checking, setChecking] = useState(false);
    const [existingInfo, setExistingInfo] = useState(null);
    const [answers, setAnswers] = useState({});
    const [submitting, setSubmitting] = useState(false);

    const categories = [
        { id: 'weight-loss', label: 'Weight Loss', icon: 'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3' },
        { id: 'hair-restoration', label: 'Hair Restoration', icon: 'M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
        { id: 'sexual-health', label: 'Sexual Health', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
        { id: 'longevity', label: 'Longevity', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
        { id: 'testosterone', label: 'Testosterone', icon: 'M12 21a9 9 0 100-18 9 9 0 000 18zm0 0l-4-4m4 4l4-4' },
        { id: 'repair-healing', label: 'Repair & Healing', icon: 'M13 10V3L4 14h7v7l9-11h-7z' }
    ];

    const handleCategorySelect = (id) => {
        setSelectedCategory(id);
        setStep('email');
    };

    const checkEmail = async (e) => {
        e.preventDefault();
        if (!patientEmail) return;
        setChecking(true);
        setExistingInfo(null);

        try {
            // Check for existing submissions with this email and category
            const { data, error } = await supabase
                .from('form_submissions')
                .select('*')
                .eq('email', patientEmail)
                .eq('selected_drug', selectedCategory)
                .order('submitted_at', { ascending: false })
                .limit(1);

            if (data && data.length > 0) {
                setExistingInfo(data[0]);
            }
            setStep('form');
        } catch (err) {
            console.error('Error checking email:', err);
            alert('Error validating email');
        } finally {
            setChecking(false);
        }
    };

    const handleAnswerChange = (qId, value, type) => {
        setAnswers(prev => {
            if (type === 'multiselect') {
                const current = prev[qId] || [];
                if (current.includes(value)) {
                    return { ...prev, [qId]: current.filter(item => item !== value) };
                } else {
                    return { ...prev, [qId]: [...current, value] };
                }
            }
            return { ...prev, [qId]: value };
        });
    };

    // Prescription State
    const [prescription, setPrescription] = useState({
        providerName: '',
        date: new Date().toISOString().split('T')[0],
        patientName: 'EE E',
        patientDob: '2026-02-02',
        patientAddress: 'EE, E, E, E 333',
        patientPhone: '(444) 333-3333',
        patientEmail: '',
        allergies: 'ggg',
        medication: 'Semaglutide', // Semaglutide | Tirzepatide
        titration: 'Month 1', // Month 1, Month 2...
        diagnosis: [],
        medicalNecessity: [],
        signature: '',
        signatureDate: new Date().toISOString().split('T')[0]
    });

    const medications = {
        'Semaglutide': [
            { label: 'Month 1', dose: 'Inject 0.1 mL [10 UNITS] (0.25 mg) subq weekly for 4 weeks.', qty: '0.5 mL' },
            { label: 'Month 2', dose: 'Inject 0.2 mL [20 UNITS] (0.5 mg) subq weekly for 4 weeks.', qty: '1 mL' },
            { label: 'Month 3', dose: 'Inject 0.4 mL [40 UNITS] (1 mg) subq weekly for 4 weeks.', qty: '2 mL' },
            { label: 'Month 4', dose: 'Inject 0.6 mL [60 UNITS] (1.5 mg) subq weekly for 4 weeks.', qty: '3 mL' },
            { label: 'Month 5', dose: 'Inject 0.8 mL [80 UNITS] (2 mg) subq weekly for 4 weeks.', qty: '4 mL' },
            { label: 'Month 6', dose: 'Inject 0.96 mL [96 UNITS] (2.4 mg) subq weekly for 4 weeks.', qty: '4 mL' }
        ],
        'Tirzepatide': [
            { label: 'Month 1', dose: 'Inject 0.08 mL [8 UNITS] (2.5 mg) subq weekly for 4 weeks.', qty: '0.5 mL' },
            { label: 'Month 2', dose: 'Inject 0.17 mL [17 UNITS] (5 mg) subq weekly for 4 weeks.', qty: '1 mL' },
            { label: 'Month 3', dose: 'Inject 0.25 mL [25 UNITS] (7.5 mg) subq weekly for 4 weeks.', qty: '1 mL' },
            { label: 'Month 4', dose: 'Inject 0.33 mL [33 UNITS] (10 mg) subq weekly for 4 weeks.', qty: '1.5 mL' },
            { label: 'Month 5', dose: 'Inject 0.42 mL [42 UNITS] (12.5 mg) subq weekly for 4 weeks.', qty: '2 mL' },
            { label: 'Month 6', dose: 'Inject 0.5 mL [50 UNITS] (15 mg) subq weekly for 4 weeks.', qty: '2 mL' }
        ]
    };

    const handlePrescriptionChange = (field, value) => {
        setPrescription(prev => ({ ...prev, [field]: value }));
    };

    const toggleCheckbox = (field, value) => {
        setPrescription(prev => {
            const current = prev[field] || [];
            if (current.includes(value)) {
                return { ...prev, [field]: current.filter(item => item !== value) };
            } else {
                return { ...prev, [field]: [...current, value] };
            }
        });
    };

    const handleSubmit = async () => {
        if (selectedCategory === 'weight-loss') {
            // Pre-fill email in prescription
            setPrescription(prev => ({ ...prev, patientEmail: patientEmail }));
            setStep('prescription');
            return;
        }
        await finalSubmit();
    };

    const finalSubmit = async () => {
        setSubmitting(true);
        try {
            // Basic structure mirroring Assessment.jsx submission
            const submissionData = {
                user_id: user?.id,
                email: patientEmail,
                selected_drug: selectedCategory,
                approval_status: 'approved',
                submitted_at: new Date().toISOString(),
                medical_responses: answers,
                shipping_email: patientEmail,
                shipping_first_name: 'Express',
                shipping_last_name: 'Entry',
                shipping_street: 'Clinic Entry',
                shipping_city: '-',
                shipping_state: '-',
                shipping_zip: '-',
                shipping_phone: '-',
                // Store prescription data if available
                ...(selectedCategory === 'weight-loss' && {
                    additional_health_info: { prescription: prescription }, // Storing in JSONB column
                    prescription_pdf_url: pdfUrl // Save the generated PDF URL
                })
            };

            const { error } = await supabase.from('form_submissions').insert([submissionData]);
            if (error) throw error;

            // Send User Setup Email
            try {
                const { error: emailError } = await supabase.functions.invoke('send-email', {
                    body: {
                        type: 'USER_SETUP',
                        email: patientEmail
                    }
                });
                if (emailError) console.error('Error sending setup email:', emailError);
            } catch (emailErr) {
                console.error('Failed to invoke email function:', emailErr);
            }

            setStep('success');
        } catch (err) {
            console.error('Error submitting express entry:', err);
            alert('Failed to submit form: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const [generatingPdf, setGeneratingPdf] = useState(false);
    const [pdfUrl, setPdfUrl] = useState(null);

    const generatePDF = () => {
        setGeneratingPdf(true);
        setPdfUrl(null);

        // 1. Construct the payload
        // Helper to check if item is in array
        const hasDiag = (str) => prescription.diagnosis.includes(str);
        const hasNec = (str) => prescription.medicalNecessity.includes(str);

        // Get selected medication details
        const selectedMed = prescription.medication; // 'Semaglutide' or 'Tirzepatide'
        const medOptions = medications[selectedMed] || [];
        const selectedDose = medOptions.find(m => m.label === prescription.titration);

        // Format the row as expected by backend: Label includes Full Text, Qty includes prefix
        const medRow = selectedDose ? [{
            label: `${selectedDose.label}: ${selectedDose.dose}`,
            qty: `Qty: ${selectedDose.qty}`
        }] : [];

        const payload = {
            provider_name: prescription.providerName,
            date: prescription.date,
            patient_name: prescription.patientName,
            patient_dob: prescription.patientDob,
            patient_address: prescription.patientAddress,
            patient_phone: prescription.patientPhone,
            patient_email: prescription.patientEmail,
            drug_allergies: prescription.allergies || 'N/A',

            // Medication Arrays
            semaglutideRows: selectedMed === 'Semaglutide' ? medRow : [],
            tirzepatideRows: selectedMed === 'Tirzepatide' ? medRow : [],

            // Diagnoses mappings
            diag_e11_8: hasDiag('E11.8 Type 2 Diabetes Mellitus'),
            diag_e66_9: hasDiag('E66.9 Obesity'),
            diag_e66_3: hasDiag('E66.3 Overweight'),

            // Necessity mappings
            nec_vitb12_deficiency: hasNec('Vit B12 Deficiency'),
            nec_lack_of_adequate_food: hasNec('Lack of Adequate Food'),
            nec_adverse_effect_appetite_suppressant: hasNec('Adverse Effect of Appetite Suppressant'),
            nec_adverse_effect_medication: hasNec('Adverse Effect of Medication'),

            dispense_as_written_signature: prescription.signature,
            signature_date: prescription.signatureDate
        };

        console.log('Generating PDF with payload:', payload);

        // 2. Call Supabase Function
        // Using invoke is cleaner and handles auth automatically
        const callFunction = async () => {
            try {
                const { data, error } = await supabase.functions.invoke('generate-prescription-pdf', {
                    body: payload
                });

                if (error) throw error;

                if (data && data.url) {
                    setPdfUrl(data.url);
                } else {
                    console.error('No URL returned:', data);
                    toast.error('PDF generated but no URL returned.');
                }

            } catch (err) {
                console.error('Error generating PDF:', err);
                toast.error('Failed to generate PDF: ' + err.message);
            } finally {
                setGeneratingPdf(false);
            }
        };

        callFunction();
    };

    const reset = () => {
        setStep('category');
        setSelectedCategory('');
        setPatientEmail('');
        setAnswers({});
        setExistingInfo(null);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700 max-w-4xl mx-auto">
            {/* Header / Breadcrumbs */}
            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-white/50 mb-8 max-w-2xl mx-auto">
                <span className={step === 'category' ? 'text-white' : ''}>1. Select Category</span>
                <span>/</span>
                <span className={step === 'email' ? 'text-white' : ''}>2. Patient ID</span>
                <span>/</span>
                <span className={step === 'form' ? 'text-white' : ''}>3. Clinical Assessment</span>
            </div>

            {step === 'category' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl mx-auto">
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => handleCategorySelect(cat.id)}
                            className="bg-white/5 border border-white/10 rounded-[32px] p-8 hover:bg-white/5 hover:border-accent-black/50 hover:scale-[1.02] transition-all group text-left"
                        >
                            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-white/60 mb-6 group-hover:bg-accent-black group-hover:text-white transition-colors">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={cat.icon} /></svg>
                            </div>
                            <h3 className="text-xl font-black uppercase  tracking-tighter mb-2">{cat.label}</h3>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Start new assessment</p>
                        </button>
                    ))}
                </div>
            )}

            {step === 'email' && (
                <div className="max-w-md mx-auto bg-white/5 border border-white/10 rounded-[40px] p-12 text-center">
                    <h3 className="text-2xl font-black uppercase  tracking-tighter mb-2">Patient <span className="text-white">Identity</span></h3>
                    <p className="text-[10px] uppercase tracking-widest text-white/50 mb-8 font-bold">Enter patient email to verify records</p>

                    <form onSubmit={checkEmail} className="space-y-6">
                        <input
                            type="email"
                            required
                            placeholder="patient@example.com"
                            value={patientEmail}
                            onChange={(e) => setPatientEmail(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-2xl py-4 px-6 text-center text-white font-bold focus:outline-none focus:border-accent-black transition-all"
                        />
                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => setStep('category')}
                                className="flex-1 py-4 rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all"
                            >
                                Back
                            </button>
                            <button
                                type="submit"
                                disabled={checking}
                                className="flex-[2] py-4 bg-accent-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#111111] hover:shadow-[0_0_20px_rgba(191,255,0,0.4)] transition-all disabled:opacity-50"
                            >
                                {checking ? 'Verifying...' : 'Proceed to Intake'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {step === 'form' && (
                <div className="space-y-8">
                    {/* Existing Record Warning */}
                    {existingInfo && (
                        <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-6 flex items-start gap-4">
                            <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500 shrink-0 mt-1">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            </div>
                            <div>
                                <h4 className="text-sm font-black uppercase text-orange-500 mb-1">Existing Submission Found</h4>
                                <p className="text-[11px] text-white/60 font-medium leading-relaxed">
                                    This user already submitted a request for {selectedCategory} on <span className="text-white font-bold">{new Date(existingInfo.submitted_at).toLocaleDateString()}</span>.
                                    Proceeding will create a new entry.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="bg-white/5 border border-white/10 rounded-[40px] p-8 md:p-12">
                        <div className="flex flex-col-reverse md:flex-row md:items-center justify-between mb-12 border-b border-white/10 pb-8 gap-6 md:gap-0">
                            <div>
                                <h3 className="text-2xl font-black uppercase  tracking-tighter">Clinical <span className="text-white">Intake</span></h3>
                                <p className="text-[10px] uppercase tracking-widest text-white/50 font-bold mt-1">Filling as Admin for: {patientEmail}</p>
                            </div>
                            <div className="md:text-right">
                                <span className="bg-accent-black/10 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">{selectedCategory}</span>
                            </div>
                        </div>

                        <div className="space-y-12">
                            {intakeQuestions[selectedCategory]?.map((q) => {
                                // Check condition
                                if (q.condition && !q.condition(answers)) return null;
                                if (q.type === 'info') return (
                                    <div key={q.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                                        <p className="text-sm font-bold text-white/80">{q.content}</p>
                                    </div>
                                );

                                return (
                                    <div key={q.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <label className="block text-sm font-bold text-white mb-4">
                                            {q.question}
                                        </label>

                                        {/* Render based on type */}
                                        {q.type === 'text' && (
                                            <input
                                                type="text"
                                                value={answers[q.id] || ''}
                                                onChange={(e) => handleAnswerChange(q.id, e.target.value, 'text')}
                                                placeholder={q.placeholder || "Enter details..."}
                                                className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-accent-black transition-all"
                                            />
                                        )}

                                        {q.type === 'choice' && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {q.options.map(opt => (
                                                    <div
                                                        key={opt}
                                                        onClick={() => handleAnswerChange(q.id, opt, 'choice')}
                                                        className={`p-4 rounded-xl border cursor-pointer transition-all ${answers[q.id] === opt ? 'bg-accent-black text-white border-accent-black font-bold' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/5'}`}
                                                    >
                                                        <span className="text-xs uppercase tracking-wide">{opt}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {q.type === 'multiselect' && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {q.options.map(opt => (
                                                    <div
                                                        key={opt}
                                                        onClick={() => handleAnswerChange(q.id, opt, 'multiselect')}
                                                        className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${answers[q.id]?.includes(opt) ? 'bg-white/5 border-accent-black text-white' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/5'}`}
                                                    >
                                                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${answers[q.id]?.includes(opt) ? 'border-accent-black bg-accent-black text-white' : 'border-white/30'}`}>
                                                            {answers[q.id]?.includes(opt) && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M20 6L9 17l-5-5" /></svg>}
                                                        </div>
                                                        <span className="text-xs uppercase tracking-wide">{opt}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-16 pt-8 border-t border-white/10 flex gap-4">
                            <button
                                onClick={() => setStep('email')}
                                className="flex-1 py-5 rounded-2xl border border-white/10 text-xs font-black uppercase tracking-widest hover:bg-white/5 transition-all"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="flex-[3] py-5 bg-accent-black text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[#111111] hover:shadow-[0_0_30px_rgba(191,255,0,0.5)] transition-all disabled:opacity-50"
                            >
                                {submitting ? 'Submitting to Clinical Queue...' : 'Finalize Express Entry'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {step === 'prescription' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-white/5 border border-white/10 rounded-[40px] p-8 md:p-12">
                        <div className="mb-12 border-b border-white/10 pb-8">
                            <h3 className="text-2xl font-black uppercase  tracking-tighter mb-2">Digital <span className="text-white">Prescription</span></h3>
                            <p className="text-[10px] uppercase tracking-widest text-white/50 font-bold">Fill in to generate PDF record</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            <div className="space-y-4">
                                <h4 className="text-xs font-black uppercase tracking-widest text-white/60">Provider Information</h4>
                                <input placeholder="Provider Full Name" value={prescription.providerName} onChange={e => handlePrescriptionChange('providerName', e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-accent-black" />
                                <input type="date" value={prescription.date} onChange={e => handlePrescriptionChange('date', e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-accent-black" />
                            </div>
                            <div className="space-y-4">
                                <h4 className="text-xs font-black uppercase tracking-widest text-white/60">Patient Information</h4>
                                <input placeholder="Patient Full Name" value={prescription.patientName} onChange={e => handlePrescriptionChange('patientName', e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-accent-black" />
                                <input type="date" placeholder="DOB" value={prescription.patientDob} onChange={e => handlePrescriptionChange('patientDob', e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-accent-black" />
                                <input placeholder="Address" value={prescription.patientAddress} onChange={e => handlePrescriptionChange('patientAddress', e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-accent-black" />
                                <input placeholder="Phone" value={prescription.patientPhone} onChange={e => handlePrescriptionChange('patientPhone', e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-accent-black" />
                                <input placeholder="Email" value={prescription.patientEmail} onChange={e => handlePrescriptionChange('patientEmail', e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-accent-black" />
                                <textarea placeholder="Drug Allergies" value={prescription.allergies} onChange={e => handlePrescriptionChange('allergies', e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-accent-black h-24" />
                            </div>
                        </div>

                        {/* Medication Selection */}
                        <div className="mb-8 space-y-4">
                            <h4 className="text-xs font-black uppercase tracking-widest text-white/60">Medication & Dosage Protocol</h4>
                            <div className="flex gap-4 mb-4">
                                {['Semaglutide', 'Tirzepatide'].map(med => (
                                    <button
                                        key={med}
                                        onClick={() => handlePrescriptionChange('medication', med)}
                                        className={`flex-1 py-3 rounded-xl border text-xs font-black uppercase tracking-widest transition-all ${prescription.medication === med ? 'bg-accent-black text-white border-accent-black' : 'bg-white/5 border-white/10 hover:bg-white/5'}`}
                                    >
                                        {med}
                                    </button>
                                ))}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {medications[prescription.medication].map(opt => (
                                    <div
                                        key={opt.label}
                                        onClick={() => handlePrescriptionChange('titration', opt.label)}
                                        className={`p-4 rounded-xl border cursor-pointer transition-all ${prescription.titration === opt.label ? 'bg-white/5 border-accent-black' : 'bg-white/5 border-white/10 hover:bg-white/5'}`}
                                    >
                                        <div className="flex justify-between items-center mb-2">
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${prescription.titration === opt.label ? 'text-white' : 'text-white/50'}`}>{opt.label}</span>
                                            <span className="text-[10px] font-bold text-white/50">{opt.qty}</span>
                                        </div>
                                        <p className="text-xs text-white/80 leading-relaxed">{opt.dose}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Diagnostics */}
                        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h4 className="text-xs font-black uppercase tracking-widest text-white/60 mb-4">Diagnosis (Select at least one)</h4>
                                {['E11.8 Type 2 Diabetes Mellitus', 'E66.9 Obesity', 'E66.3 Overweight'].map(item => (
                                    <label key={item} className="flex items-center gap-3 mb-3 cursor-pointer group">
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${prescription.diagnosis.includes(item) ? 'bg-accent-black border-accent-black' : 'border-white/20 group-hover:border-white/40'}`}>
                                            {prescription.diagnosis.includes(item) && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="4"><path d="M20 6L9 17l-5-5" /></svg>}
                                        </div>
                                        <input type="checkbox" className="hidden" checked={prescription.diagnosis.includes(item)} onChange={() => toggleCheckbox('diagnosis', item)} />
                                        <span className="text-sm text-white/80">{item}</span>
                                    </label>
                                ))}
                            </div>
                            <div>
                                <h4 className="text-xs font-black uppercase tracking-widest text-white/60 mb-4">Medical Necessity (Select at least one)</h4>
                                {['Vit B12 Deficiency', 'Lack of Adequate Food', 'Adverse Effect of Appetite Suppressant', 'Adverse Effect of Medication'].map(item => (
                                    <label key={item} className="flex items-center gap-3 mb-3 cursor-pointer group">
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${prescription.medicalNecessity.includes(item) ? 'bg-accent-black border-accent-black' : 'border-white/20 group-hover:border-white/40'}`}>
                                            {prescription.medicalNecessity.includes(item) && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="4"><path d="M20 6L9 17l-5-5" /></svg>}
                                        </div>
                                        <input type="checkbox" className="hidden" checked={prescription.medicalNecessity.includes(item)} onChange={() => toggleCheckbox('medicalNecessity', item)} />
                                        <span className="text-sm text-white/80">{item}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Signature */}
                        <div className="bg-black/20 border border-white/10 rounded-2xl p-6 mb-8">
                            <h4 className="text-xs font-black uppercase tracking-widest text-white/60 mb-4">Dispense As Written � Prescriber Electronic Signature</h4>
                            <div className="space-y-4">
                                <input placeholder="Type your full legal name to sign" value={prescription.signature} onChange={e => handlePrescriptionChange('signature', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-accent-black" />
                                <p className="text-[10px] text-white/50">By typing your name above, you are electronically signing this prescription and certifying that you are the authorized prescriber.</p>
                                <input type="date" value={prescription.signatureDate} onChange={e => handlePrescriptionChange('signatureDate', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-accent-black max-w-[200px]" />
                            </div>
                            <div className="mt-4 pt-4 border-t border-white/10">
                                <p className="text-[10px]  text-white/30 leading-relaxed">
                                    The sterile compound medications above are made at the request of the signed prescribing practitioner below due to a patient-specific medical need and the preparation producing a clinically significant therapeutic response compared to a commercially available product.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-4 md:items-center">
                            <button onClick={() => setStep('form')} className="w-full md:w-auto px-8 py-4 rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all">Back</button>

                            <div className="flex-1 flex flex-col md:flex-row gap-4 md:justify-end md:items-center">
                                {pdfUrl && (
                                    <a
                                        href={pdfUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[10px] font-black uppercase tracking-widest text-white hover:underline text-center md:text-right md:mr-4"
                                    >
                                        View Generated PDF
                                    </a>
                                )}
                                <button onClick={generatePDF} className="w-full md:w-auto px-8 py-4 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all flex items-center justify-center gap-2">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                                    {pdfUrl ? 'Regenerate PDF' : 'Generate PDF'}
                                </button>
                                <button onClick={finalSubmit} disabled={submitting} className="w-full md:w-auto px-12 py-4 rounded-xl bg-accent-black text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#111111] hover:shadow-[0_0_20px_rgba(191,255,0,0.4)] transition-all">Proceed</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {step === 'success' && (
                <div className="text-center py-20 bg-white/5 border border-white/10 rounded-[40px]">
                    <div className="w-20 h-20 bg-accent-black rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(191,255,0,0.4)]">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>
                    </div>
                    <h3 className="text-3xl font-black uppercase  tracking-tighter mb-4">Submission <span className="text-white">Success</span></h3>
                    <p className="text-xs font-bold uppercase tracking-widest text-white/50 mb-12">The assessment has been added to the clinical queue.</p>
                    <button
                        onClick={reset}
                        className="px-12 py-4 bg-[#111111] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-accent-black transition-all"
                    >
                        Start New Entry
                    </button>
                </div>
            )}

            {/* PDF Loading Modal */}
            {generatingPdf && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-[#111111] border border-white/10 rounded-3xl p-12 text-center max-w-sm mx-4 shadow-2xl">
                        <div className="w-16 h-16 border-4 border-white/10 border-t-accent-black rounded-full animate-spin mx-auto mb-8"></div>
                        <h4 className="text-xl font-black uppercase  tracking-tighter mb-2">Generating PDF</h4>
                        <p className="text-xs uppercase tracking-widest text-white/50 font-bold">Please wait while we prepare the prescription document...</p>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Survey Management ---
const SurveyManagement = () => {
    const [surveys, setSurveys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [selectedSurvey, setSelectedSurvey] = useState(null);

    const fetchSurveys = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('questionnaire_responses')
                .select('*')
                .order('submitted_at', { ascending: false });

            if (categoryFilter !== 'all') {
                query = query.eq('category', categoryFilter);
            }

            const { data, error } = await query;

            if (error) throw error;
            setSurveys(data || []);
        } catch (err) {
            console.error('Error fetching surveys:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSurveys();

        // Set up realtime subscription
        const subscription = supabase
            .channel('survey_updates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'questionnaire_responses' }, fetchSurveys)
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [categoryFilter]);

    const categories = [
        { id: 'all', label: 'All Categories' },
        { id: 'weight-loss', label: 'Weight Loss' },
        { id: 'hair-restoration', label: 'Hair Restoration' },
        { id: 'sexual-health', label: 'Sexual Health' },
        { id: 'longevity', label: 'Longevity' }
    ];

    const getRatingColor = (rating) => {
        switch (rating) {
            case 'Excellent': return 'bg-accent-black/20 text-white border-accent-black/30';
            case 'Good': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'Fair': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            case 'Poor': return 'bg-red-500/20 text-red-400 border-red-500/30';
            default: return 'bg-white/5 text-white/60 border-white/20';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-12 h-12 border-4 border-white/10 border-t-accent-black rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setCategoryFilter(cat.id)}
                        className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${categoryFilter === cat.id
                            ? 'bg-accent-black text-white'
                            : 'bg-white/5 text-white/50 hover:bg-white/5 hover:text-white border border-white/10'
                            }`}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Response Table */}
            <div className="bg-[#111111]/[0.03] border border-white/10 rounded-[40px] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/10 bg-[#111111]/[0.02]">
                                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-white/50">Email</th>
                                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-white/50">Progress</th>
                                {categoryFilter === 'weight-loss' && (
                                    <>
                                        <th className="p-8 text-[10px] font-black uppercase tracking-widest text-white/50">Starting Weight</th>
                                        <th className="p-8 text-[10px] font-black uppercase tracking-widest text-white/50">Weight Lost</th>
                                    </>
                                )}
                                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-white/50">Date Range</th>
                                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-white/50">Satisfied</th>
                                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-white/50">Submitted</th>
                                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-white/50 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {surveys.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="p-20 text-center">
                                        <p className="text-white/30 font-black uppercase tracking-widest text-xs">No responses logged yet</p>
                                    </td>
                                </tr>
                            ) : (
                                surveys.map(survey => (
                                    <tr key={survey.id} className="hover:bg-[#111111]/[0.02] transition-colors group">
                                        <td className="p-8">
                                            <p className="font-bold text-white group-hover:text-white transition-colors">{survey.email}</p>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mt-1">{survey.product}</p>
                                        </td>
                                        <td className="p-8">
                                            <span className={`px-4 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest ${getRatingColor(survey.progress_rating)}`}>
                                                {survey.progress_rating}
                                            </span>
                                        </td>
                                        {categoryFilter === 'weight-loss' && (
                                            <>
                                                <td className="p-8">
                                                    <p className="text-sm font-bold text-white/60">{survey.starting_weight ? `${survey.starting_weight} lbs` : '�'}</p>
                                                </td>
                                                <td className="p-8">
                                                    <p className={`text-sm font-black ${survey.weight_lost > 0 ? 'text-white' : 'text-white/50'}`}>
                                                        {survey.weight_lost ? `${survey.weight_lost} lbs` : '�'}
                                                    </p>
                                                </td>
                                            </>
                                        )}
                                        <td className="p-8">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-white/50 whitespace-nowrap">
                                                {new Date(survey.start_date).toLocaleDateString(undefined, { month: 'short', day: '2-digit' })} - {new Date(survey.end_date).toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' })}
                                            </p>
                                        </td>
                                        <td className="p-8">
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${survey.satisfied_with_medication === 'Yes' ? 'text-white' : 'text-red-400'}`}>
                                                {survey.satisfied_with_medication === 'Yes' ? 'yes' : 'no'}
                                            </span>
                                        </td>
                                        <td className="p-8">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-white/50">
                                                {new Date(survey.submitted_at || survey.created_at).toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' })}
                                            </p>
                                        </td>
                                        <td className="p-8 text-right">
                                            <button
                                                onClick={() => setSelectedSurvey(survey)}
                                                className="px-6 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-white group-hover:bg-accent-black group-hover:text-white group-hover:border-accent-black transition-all"
                                            >
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detail Modal Overlay */}
            {selectedSurvey && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300" onClick={() => setSelectedSurvey(null)}>
                    <div
                        className="bg-[#111111] border border-white/10 rounded-[48px] p-12 max-w-2xl w-full max-h-[85vh] overflow-y-auto relative shadow-[0_0_100px_rgba(0,0,0,0.5)]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setSelectedSurvey(null)}
                            className="absolute top-8 right-8 w-12 h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/5 transition-all text-white/50 hover:text-white"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
                        </button>

                        <div className="mb-12">
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white mb-4">Patient Encounter</p>
                            <h3 className="text-4xl font-black uppercase  tracking-tighter text-white mb-2 leading-none">Survey Results</h3>
                            <p className="text-white/50 font-bold uppercase tracking-widest text-[11px]">{selectedSurvey.email}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
                                <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-2">Protocol</p>
                                <p className="text-sm font-black text-white uppercase ">{selectedSurvey.product}</p>
                            </div>
                            <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
                                <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-2">Progress</p>
                                <span className={`inline-block px-4 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${getRatingColor(selectedSurvey.progress_rating)}`}>
                                    {selectedSurvey.progress_rating}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className={`bg-[#111111]/[0.02] border border-white/10 p-8 rounded-[32px] grid ${selectedSurvey.category === 'weight-loss' ? 'grid-cols-2 gap-12' : 'grid-cols-1 gap-6'}`}>
                                {selectedSurvey.category === 'weight-loss' && (
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-2">Weight Tracking</p>
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-[10px] font-black text-white/50 uppercase mb-1">Start Weight</p>
                                                <p className="text-2xl font-black ">{selectedSurvey.starting_weight || '0'} lbs</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-white/50 uppercase mb-1">Weight Lost</p>
                                                <p className="text-2xl font-black  text-white">-{selectedSurvey.weight_lost || '0'} lbs</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-2">Medical Status</p>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-[10px] font-black text-white/50 uppercase mb-1">Satisfied w/ Dose</p>
                                            <p className={`text-2xl font-black  ${selectedSurvey.satisfied_with_medication === 'Yes' ? 'text-white' : 'text-red-400'}`}>
                                                {selectedSurvey.satisfied_with_medication}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-white/50 uppercase mb-1">Reporting Period</p>
                                            <p className="text-sm font-black whitespace-nowrap">
                                                {new Date(selectedSurvey.start_date).toLocaleDateString()} - {new Date(selectedSurvey.end_date).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {selectedSurvey.additional_notes && (
                                <div className="bg-[#111111]/[0.02] border border-white/10 p-8 rounded-[32px]">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-4">Patient Notes</p>
                                    <p className="text-white/80 font-medium leading-relaxed ">"{selectedSurvey.additional_notes}"</p>
                                </div>
                            )}

                            <div className="pt-8 border-t border-white/10 flex items-center justify-between">
                                <p className="text-[9px] font-black uppercase tracking-widest text-white/30">Record ID: {selectedSurvey.id.substring(0, 13)}...</p>
                                <button
                                    onClick={() => setSelectedSurvey(null)}
                                    className="px-10 py-4 bg-[#111111] text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-accent-black transition-all"
                                >
                                    Dismiss
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Staff Management ---
const StaffManagement = () => {
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showProviderModal, setShowProviderModal] = useState(false);
    const [showBackOfficeModal, setShowBackOfficeModal] = useState(false);
    const [creating, setCreating] = useState(false);

    const [providerForm, setProviderForm] = useState({
        firstName: '',
        lastName: '',
        dob: '',
        address: '',
        phone: '',
        email: '',
        password: '',
        licenseType: '',
        licenseNumber: '',
        npiNumber: '',
        deaNumber: '',
        deaCertFile: null
    });

    const [backOfficeForm, setBackOfficeForm] = useState({
        firstName: '',
        lastName: '',
        dob: '',
        address: '',
        phone: '',
        email: '',
        password: ''
    });

    const fetchStaff = async () => {
        setLoading(true);
        try {
            // 1. Fetch authorized staff roles first
            const { data: roles, error: rolesError } = await supabase
                .from('user_roles')
                .select('user_id, role')
                .in('role', ['physician', 'nurse_practitioner', 'physician_assistant', 'back_office']);

            if (rolesError) throw rolesError;
            if (!roles || roles.length === 0) {
                setStaff([]);
                return;
            }

            // 2. Extract unique user IDs
            const userIds = roles.map(r => r.user_id);

            // 3. Fetch profiles for these users
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .in('id', userIds);

            if (profileError) throw profileError;

            // 4. Fetch provider specific data
            const { data: providerData, error: providerError } = await supabase
                .from('provider_profiles')
                .select('*')
                .in('user_id', userIds);

            if (providerError) throw providerError;

            // 5. Merge all data
            const staffMembers = roles.map(roleEntry => {
                const profile = (profileData || []).find(p => p.id === roleEntry.user_id);
                const providerEntry = (providerData || []).find(p => p.user_id === roleEntry.user_id);

                return {
                    ...profile,
                    ...providerEntry,
                    id: roleEntry.user_id, // IMPORTANT: Ensure the UUID id is not overwritten by provider_profiles.id
                    role: roleEntry.role
                };
            }).filter(member => member.email || member.first_name) // Ensure we have something to display
                .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

            setStaff(staffMembers);
        } catch (err) {
            console.error('Error fetching staff:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStaff();

        // Listen for changes across all three tables to keep staff list in sync
        const profileSubscription = supabase
            .channel('staff_profile_updates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchStaff)
            .subscribe();

        const roleSubscription = supabase
            .channel('staff_role_updates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'user_roles' }, fetchStaff)
            .subscribe();

        const providerSubscription = supabase
            .channel('provider_profile_updates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'provider_profiles' }, fetchStaff)
            .subscribe();

        return () => {
            profileSubscription.unsubscribe();
            roleSubscription.unsubscribe();
            providerSubscription.unsubscribe();
        };
    }, []);

    const handleProviderSubmit = async (e) => {
        e.preventDefault();
        setCreating(true);

        try {
            // Convert DEA file to base64 if it exists
            let deaFileData = null;
            if (providerForm.deaCertFile) {
                const reader = new FileReader();
                deaFileData = await new Promise((resolve, reject) => {
                    reader.onload = () => {
                        const base64String = reader.result.split(',')[1];
                        resolve({
                            fileData: base64String,
                            fileExt: providerForm.deaCertFile.name.split('.').pop()
                        });
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(providerForm.deaCertFile);
                });
            }

            // Call edge function
            const { data, error } = await supabase.functions.invoke('create-staff-user', {
                body: {
                    email: providerForm.email,
                    password: providerForm.password,
                    firstName: providerForm.firstName,
                    lastName: providerForm.lastName,
                    phone: providerForm.phone,
                    dob: providerForm.dob,
                    address: providerForm.address,
                    role: providerForm.licenseType === 'MD' || providerForm.licenseType === 'DO' ? 'physician' :
                        providerForm.licenseType === 'NP' ? 'nurse_practitioner' : 'physician_assistant',
                    providerData: {
                        licenseNumber: providerForm.licenseNumber,
                        licenseType: providerForm.licenseType,
                        npiNumber: providerForm.npiNumber,
                        deaNumber: providerForm.deaNumber,
                        supervisingPhysician: null
                    },
                    deaFile: deaFileData
                }
            });

            if (error) throw error;

            toast.success('Provider created successfully!');
            setShowProviderModal(false);
            setProviderForm({
                firstName: '',
                lastName: '',
                dob: '',
                address: '',
                phone: '',
                email: '',
                password: '',
                licenseType: '',
                licenseNumber: '',
                npiNumber: '',
                deaNumber: '',
                deaCertFile: null
            });
            fetchStaff();
        } catch (err) {
            console.error('Error creating provider:', err);
            toast.error('Failed to create provider: ' + (err.message || 'Unknown error'));
        } finally {
            setCreating(false);
        }
    };

    const handleBackOfficeSubmit = async (e) => {
        e.preventDefault();
        setCreating(true);

        try {
            const { data, error } = await supabase.functions.invoke('create-staff-user', {
                body: {
                    email: backOfficeForm.email,
                    password: backOfficeForm.password,
                    firstName: backOfficeForm.firstName,
                    lastName: backOfficeForm.lastName,
                    phone: backOfficeForm.phone,
                    dob: backOfficeForm.dob,
                    address: backOfficeForm.address,
                    role: 'back_office',
                    providerData: null
                }
            });

            if (error) throw error;

            toast.success('Back office staff created successfully!');
            setShowBackOfficeModal(false);
            setBackOfficeForm({
                firstName: '',
                lastName: '',
                dob: '',
                address: '',
                phone: '',
                email: '',
                password: ''
            });
            fetchStaff();
        } catch (err) {
            console.error('Error creating back office staff:', err);
            toast.error('Failed to create staff: ' + (err.message || 'Unknown error'));
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteStaff = async (userId, name) => {
        if (!window.confirm(`Are you sure you want to remove ${name}? This action cannot be undone.`)) return;

        try {
            const { error } = await supabase.functions.invoke('delete-staff-user', {
                body: { user_id: userId }
            });

            if (error) throw error;

            toast.success('Staff member removed successfully');
            fetchStaff();
        } catch (err) {
            console.error('Error deleting staff:', err);
            toast.error('Failed to delete staff: ' + (err.message || 'Unknown error'));
        }
    };

    const getRoleBadge = (role) => {
        switch (role) {
            case 'physician':
                return 'bg-accent-black/20 text-white border-accent-black/30';
            case 'nurse_practitioner':
                return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'physician_assistant':
                return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
            case 'back_office':
                return 'bg-white/5 text-white/60 border-white/20';
            default:
                return 'bg-white/5 text-white/60 border-white/20';
        }
    };

    const getRoleLabel = (role) => {
        switch (role) {
            case 'physician': return 'Physician';
            case 'nurse_practitioner': return 'Nurse Practitioner';
            case 'physician_assistant': return 'Physician Assistant';
            case 'back_office': return 'Back Office';
            default: return role;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-12 h-12 border-4 border-white/10 border-t-accent-black rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header Actions */}
            <div className="flex gap-4">
                <button
                    onClick={() => setShowProviderModal(true)}
                    className="px-8 py-4 bg-accent-black text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#111111] transition-all shadow-[0_0_30px_rgba(191,255,0,0.2)]"
                >
                    + Add Provider
                </button>
                <button
                    onClick={() => setShowBackOfficeModal(true)}
                    className="px-8 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/5 transition-all"
                >
                    + Add Back Office Staff
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-[#111111]/[0.03] border border-white/10 rounded-[32px] p-8">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-2">Total Staff</p>
                    <p className="text-4xl font-black uppercase  tracking-tighter text-white">{staff.length}</p>
                </div>
                <div className="bg-[#111111]/[0.03] border border-white/10 rounded-[32px] p-8">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-2">Providers</p>
                    <p className="text-4xl font-black uppercase  tracking-tighter text-white">
                        {staff.filter(s => ['physician', 'nurse_practitioner', 'physician_assistant'].includes(s.role)).length}
                    </p>
                </div>
                <div className="bg-[#111111]/[0.03] border border-white/10 rounded-[32px] p-8">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-2">Back Office</p>
                    <p className="text-4xl font-black uppercase  tracking-tighter text-white">
                        {staff.filter(s => s.role === 'back_office').length}
                    </p>
                </div>
                <div className="bg-[#111111]/[0.03] border border-white/10 rounded-[32px] p-8">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-2">Active Today</p>
                    <p className="text-4xl font-black uppercase  tracking-tighter text-white">
                        {staff.filter(s => s.last_sign_in_at && new Date(s.last_sign_in_at).toDateString() === new Date().toDateString()).length}
                    </p>
                </div>
            </div>

            {/* Staff Table */}
            <div className="bg-[#111111]/[0.03] border border-white/10 rounded-[32px] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/10">
                                <th className="text-left p-6 text-[10px] font-black uppercase tracking-widest text-white/50">Name</th>
                                <th className="text-left p-6 text-[10px] font-black uppercase tracking-widest text-white/50">Email</th>
                                <th className="text-left p-6 text-[10px] font-black uppercase tracking-widest text-white/50">Phone</th>
                                <th className="text-left p-6 text-[10px] font-black uppercase tracking-widest text-white/50">Role</th>
                                <th className="text-left p-6 text-[10px] font-black uppercase tracking-widest text-white/50">OTP Status</th>
                                <th className="text-left p-6 text-[10px] font-black uppercase tracking-widest text-white/50">Created</th>
                                <th className="text-left p-6 text-[10px] font-black uppercase tracking-widest text-white/50">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {staff.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-20">
                                        <p className="text-white/30 font-black uppercase tracking-widest text-xs">No staff members found</p>
                                    </td>
                                </tr>
                            ) : (
                                staff.map(member => (
                                    <tr key={member.id} className="border-b border-white/10 hover:bg-[#111111]/[0.02] transition-colors">
                                        <td className="p-6">
                                            <p className="font-bold text-white">{member.first_name} {member.last_name}</p>
                                        </td>
                                        <td className="p-6">
                                            <p className="text-sm text-white/60">{member.email || 'N/A'}</p>
                                        </td>
                                        <td className="p-6">
                                            <p className="text-sm text-white/60">{member.phone_number || member.phone || 'N/A'}</p>
                                        </td>
                                        <td className="p-6">
                                            <span className={`px-3 py-1 rounded-xl border text-[10px] font-black uppercase tracking-wide ${getRoleBadge(member.role)}`}>
                                                {getRoleLabel(member.role)}
                                            </span>
                                        </td>
                                        <td className="p-6">
                                            <span className={`px-3 py-1 rounded-xl border text-[10px] font-black uppercase tracking-wide ${member.otp_verified ? 'bg-accent-black/20 text-white border-accent-black/30' : 'bg-red-500/20 text-red-400 border-red-500/30'
                                                }`}>
                                                {member.otp_verified ? 'Verified' : 'Pending'}
                                            </span>
                                        </td>
                                        <td className="p-6">
                                            <p className="text-sm text-white/60">
                                                {new Date(member.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </p>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-2">
                                                <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all">
                                                    View
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteStaff(member.id, `${member.first_name} ${member.last_name}`)}
                                                    className="p-2 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all group"
                                                    title="Delete Staff"
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Provider Modal */}
            {showProviderModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-6" onClick={() => setShowProviderModal(false)}>
                    <div className="bg-[#111111] border border-white/10 rounded-[40px] p-10 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-3xl font-black uppercase  tracking-tighter mb-8">
                            Add Licensed <span className="text-white">Provider</span>
                        </h3>

                        <form onSubmit={handleProviderSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-white/50 mb-2">Legal First Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={providerForm.firstName}
                                        onChange={(e) => setProviderForm({ ...providerForm, firstName: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-accent-black"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-white/50 mb-2">Legal Last Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={providerForm.lastName}
                                        onChange={(e) => setProviderForm({ ...providerForm, lastName: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-accent-black"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-white/50 mb-2">Date of Birth *</label>
                                <input
                                    type="date"
                                    required
                                    value={providerForm.dob}
                                    onChange={(e) => setProviderForm({ ...providerForm, dob: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-accent-black [color-scheme:dark]"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-white/50 mb-2">Legal Address *</label>
                                <input
                                    type="text"
                                    required
                                    value={providerForm.address}
                                    onChange={(e) => setProviderForm({ ...providerForm, address: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-accent-black"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-white/50 mb-2">Phone Number *</label>
                                <input
                                    type="tel"
                                    required
                                    value={providerForm.phone}
                                    onChange={(e) => setProviderForm({ ...providerForm, phone: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-accent-black"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-white/50 mb-2">Email *</label>
                                <input
                                    type="email"
                                    required
                                    value={providerForm.email}
                                    onChange={(e) => setProviderForm({ ...providerForm, email: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-accent-black"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-white/50 mb-2">Password *</label>
                                <input
                                    type="password"
                                    required
                                    value={providerForm.password}
                                    onChange={(e) => setProviderForm({ ...providerForm, password: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-accent-black"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-white/50 mb-2">License Type *</label>
                                <select
                                    required
                                    value={providerForm.licenseType}
                                    onChange={(e) => setProviderForm({ ...providerForm, licenseType: e.target.value })}
                                    className="w-full bg-white border border-white/10 rounded-xl p-4 text-black font-bold focus:outline-none focus:border-accent-black"
                                >
                                    <option value="">Select license type</option>
                                    <option value="MD">MD - Medical Doctor</option>
                                    <option value="DO">DO - Doctor of Osteopathic Medicine</option>
                                    <option value="NP">NP - Nurse Practitioner</option>
                                    <option value="PA">PA - Physician Assistant</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-white/50 mb-2">License # *</label>
                                    <input
                                        type="text"
                                        required
                                        value={providerForm.licenseNumber}
                                        onChange={(e) => setProviderForm({ ...providerForm, licenseNumber: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-accent-black"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-white/50 mb-2">NPI # *</label>
                                    <input
                                        type="text"
                                        required
                                        value={providerForm.npiNumber}
                                        onChange={(e) => setProviderForm({ ...providerForm, npiNumber: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-accent-black"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-white/50 mb-2">DEA # *</label>
                                    <input
                                        type="text"
                                        required
                                        value={providerForm.deaNumber}
                                        onChange={(e) => setProviderForm({ ...providerForm, deaNumber: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-accent-black"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-white/50 mb-2">DEA Certification (Optional)</label>
                                <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) => setProviderForm({ ...providerForm, deaCertFile: e.target.files[0] })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-accent-black file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-accent-black file:text-white file:font-bold file:text-xs file:uppercase"
                                />
                            </div>

                            <div className="flex flex-col md:flex-row gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowProviderModal(false)}
                                    className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-white/5 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="flex-1 py-4 bg-accent-black text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[#111111] transition-all disabled:opacity-50"
                                >
                                    {creating ? 'Creating...' : 'Create Provider'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Back Office Modal */}
            {showBackOfficeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-6" onClick={() => setShowBackOfficeModal(false)}>
                    <div className="bg-[#111111] border border-white/10 rounded-[40px] p-10 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-3xl font-black uppercase  tracking-tighter mb-8">
                            Add Back Office <span className="text-white">Staff</span>
                        </h3>

                        <form onSubmit={handleBackOfficeSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-white/50 mb-2">Legal First Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={backOfficeForm.firstName}
                                        onChange={(e) => setBackOfficeForm({ ...backOfficeForm, firstName: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-accent-black"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-white/50 mb-2">Legal Last Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={backOfficeForm.lastName}
                                        onChange={(e) => setBackOfficeForm({ ...backOfficeForm, lastName: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-accent-black"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-white/50 mb-2">Date of Birth *</label>
                                <input
                                    type="date"
                                    required
                                    value={backOfficeForm.dob}
                                    onChange={(e) => setBackOfficeForm({ ...backOfficeForm, dob: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-accent-black [color-scheme:dark]"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-white/50 mb-2">Legal Address *</label>
                                <input
                                    type="text"
                                    required
                                    value={backOfficeForm.address}
                                    onChange={(e) => setBackOfficeForm({ ...backOfficeForm, address: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-accent-black"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-white/50 mb-2">Phone Number *</label>
                                <input
                                    type="tel"
                                    required
                                    value={backOfficeForm.phone}
                                    onChange={(e) => setBackOfficeForm({ ...backOfficeForm, phone: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-accent-black"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-white/50 mb-2">Email *</label>
                                <input
                                    type="email"
                                    required
                                    value={backOfficeForm.email}
                                    onChange={(e) => setBackOfficeForm({ ...backOfficeForm, email: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-accent-black"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-white/50 mb-2">Password *</label>
                                <input
                                    type="password"
                                    required
                                    value={backOfficeForm.password}
                                    onChange={(e) => setBackOfficeForm({ ...backOfficeForm, password: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-accent-black"
                                />
                            </div>

                            <div className="flex flex-col md:flex-row gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowBackOfficeModal(false)}
                                    className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-white/5 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="flex-1 py-4 bg-accent-black text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[#111111] transition-all disabled:opacity-50"
                                >
                                    {creating ? 'Creating...' : 'Create Staff Member'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Order Management ---
const OrderManagement = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [page, setPage] = useState(1);
    const pageSize = 10;
    const [updatingId, setUpdatingId] = useState(null);
    const [trackingInputs, setTrackingInputs] = useState({});
    const [editingTrackingId, setEditingTrackingId] = useState(null);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('*, profiles(id, first_name, last_name, email)')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOrders(data || []);
        } catch (err) {
            console.error('Error fetching orders:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleUpdateStatus = async (orderId, updates) => {
        setUpdatingId(orderId);
        try {
            const { error } = await supabase
                .from('orders')
                .update(updates)
                .eq('id', orderId);

            if (error) throw error;
            await fetchOrders();
        } catch (err) {
            console.error('Status update failed:', err);
            toast.error(`Update failed: ${err.message}`);
        } finally {
            setUpdatingId(null);
        }
    };

    const handleUpdateTracking = async (order, trackingId) => {
        if (!trackingId) return toast.error('Please enter a tracking number.');
        setUpdatingId(order.id);

        try {
            const trackingUrl = `https://www.fedex.com/fedextrack/?tracknumbers=${trackingId}`;
            const { error: updateError } = await supabase
                .from('orders')
                .update({
                    tracking_id: trackingId,
                    tracking_url: trackingUrl,
                    delivery_status: 'in transit',
                    processing_status: 'processed'
                })
                .eq('id', order.id);

            if (updateError) throw updateError;

            // 2. Send Email Notification
            const { error: emailError } = await supabase.functions.invoke('send-email', {
                method: 'POST',
                body: {
                    userId: order.user_id,
                    email: order.profiles?.email,
                    first_name: order.profiles?.first_name || 'Valued',
                    last_name: order.profiles?.last_name || 'Customer',
                    type: 'TRACKING_ID',
                    tracking_id: trackingId
                }
            });

            if (emailError) {
                console.warn('Tracking saved, but email notification failed:', emailError);
                toast.error('Tracking updated, but email notification failed to send.');
            } else {
                toast.success('Tracking updated and patient has been notified.');
            }

            await fetchOrders();
            setEditingTrackingId(null);
        } catch (err) {
            console.error('Failed to update tracking:', err);
            toast.error(`Error updating tracking: ${err.message}`);
        } finally {
            setUpdatingId(null);
        }
    };

    const filteredOrders = orders.filter(o => {
        if (filter === 'all') return true;
        if (filter === 'processing') return o.processing_status === 'not processed' || (o.delivery_status !== 'delivered' && o.delivery_status !== 'in transit');
        if (filter === 'shipped') return o.delivery_status === 'in transit';
        if (filter === 'delivered') return o.delivery_status === 'delivered';
        return true;
    });

    const totalPages = Math.ceil(filteredOrders.length / pageSize);
    const paginatedOrders = filteredOrders.slice((page - 1) * pageSize, page * pageSize);

    if (loading) return (
        <div className="py-24 flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-2 border-accent-black border-t-transparent animate-spin rounded-full"></div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Syncing Fulfillment Records...</p>
        </div>
    );

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Filter Header */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white/5 border border-white/10 rounded-[32px] p-6 overflow-hidden">
                <div className="flex gap-2 overflow-x-auto no-scrollbar whitespace-nowrap pb-2 md:pb-0 w-full md:w-auto -mx-2 px-2">
                    {['all', 'processing', 'shipped', 'delivered'].map(f => (
                        <button
                            key={f}
                            onClick={() => { setFilter(f); setPage(1); }}
                            className={`inline-flex px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filter === f ? 'bg-[#111111] text-white' : 'text-white/50 hover:text-white/60 hover:bg-white/5'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/30">
                    Showing {paginatedOrders.length} of {filteredOrders.length} Orders
                </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 3xl:grid-cols-3 gap-6">
                {paginatedOrders.length === 0 ? (
                    <div className="py-32 text-center border-2 border-dashed border-white/10 rounded-[40px] flex flex-col items-center">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-white/10 mb-4">
                            <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        <p className="opacity-20 uppercase font-black text-xs tracking-widest">No matching records detected</p>
                    </div>
                ) : (
                    paginatedOrders.map(order => (
                        <div key={order.id} className="group p-8 bg-white/5 border border-white/10 rounded-[40px] hover:border-white/20 transition-all flex flex-col gap-8 relative overflow-hidden">
                            {/* Decorative Background Element */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-accent-black/5 blur-3xl -mr-32 -mt-32 transition-opacity group-hover:opacity-20 opacity-0"></div>

                            {/* Icon at the Top */}
                            <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-white/30 group-hover:text-white group-hover:bg-accent-black/10 transition-all shrink-0">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                            </div>

                            {/* Stacked Details Below Icon */}
                            <div className="flex flex-col gap-6 relative z-10">
                                <div className="space-y-4">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <h3 className="text-2xl font-black uppercase tracking-tighter ">
                                            {order.profiles?.first_name} {order.profiles?.last_name || 'User'}
                                        </h3>
                                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-accent-black/30 text-white bg-accent-black/5 whitespace-nowrap`}>
                                            {order.delivery_status || 'In Transit'}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-[11px] text-white/60 uppercase font-black tracking-widest">
                                        <div className="flex items-center gap-3">
                                            <span className="text-white/30">ID:</span>
                                            <span>#{order.id.slice(0, 12).toUpperCase()}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-white/30">Date:</span>
                                            <span>{new Date(order.created_at).toLocaleDateString()}</span>
                                        </div>
                                        {order.profiles?.email && (
                                            <div className="flex items-center gap-3 col-span-full">
                                                <span className="text-white/30">Email:</span>
                                                <span className="lowercase normal-case font-medium text-white/80">{order.profiles.email}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Price and Product on Own Row */}
                                <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex flex-col gap-1">
                                        <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.2em]">Clinical Protocol</p>
                                        <h4 className="text-xl font-black text-white  tracking-tighter uppercase">{order.drug_name || <><span className="font-brand lowercase italic opacity-80">u</span>Glow<sup className="text-[0.6em] font-bold ml-0.5">MD</sup> Latanoprost Solution</>}</h4>
                                    </div>
                                    <div className="flex flex-col sm:items-end gap-1">
                                        <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.2em]">Fee Amount</p>
                                        <p className="text-3xl font-black text-white  tracking-tighter">${parseFloat(order.drug_price || 299).toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-[#111111]/[0.02] border border-white/10 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6">
                                {(order.tracking_id && editingTrackingId !== order.id) ? (
                                    <>
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-accent-black/10 flex items-center justify-center text-white">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-1">FedEx Tracking ID</p>
                                                <p className="text-xs font-black text-white tracking-widest">{order.tracking_id}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-4 w-full md:w-auto">
                                            <a
                                                href={order.tracking_url || `https://www.fedex.com/fedextrack/?tracknumbers=${order.tracking_id}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-1 md:flex-none px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white/5 text-white flex items-center justify-center gap-2"
                                            >
                                                Track Shipment
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" /></svg>
                                            </a>
                                            <button
                                                onClick={() => {
                                                    setEditingTrackingId(order.id);
                                                    setTrackingInputs({ ...trackingInputs, [order.id]: order.tracking_id });
                                                }}
                                                className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest hover:text-white"
                                            >
                                                Edit
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex-1 w-full flex items-center gap-4">
                                            <input
                                                type="text"
                                                placeholder="Enter FedEx Tracking Number..."
                                                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-6 py-3 text-xs font-bold tracking-widest placeholder:text-white/10 focus:outline-none focus:border-accent-black/40"
                                                value={trackingInputs[order.id] || ''}
                                                onChange={(e) => setTrackingInputs({ ...trackingInputs, [order.id]: e.target.value.trim() })}
                                            />
                                            {editingTrackingId === order.id && (
                                                <button
                                                    onClick={() => setEditingTrackingId(null)}
                                                    className="p-3 text-[10px] uppercase font-black tracking-widest text-white/30 hover:text-white transition-all"
                                                >
                                                    Cancel
                                                </button>
                                            )}
                                        </div>
                                        <button
                                            disabled={updatingId === order.id}
                                            onClick={() => handleUpdateTracking(order, trackingInputs[order.id])}
                                            className="w-full md:w-auto px-8 py-3 bg-accent-black text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#111111] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {updatingId === order.id ? (
                                                <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                                            ) : (order.tracking_id ? 'Update & Re-notify' : 'Finalize & Notify')}
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Manual Status Controls */}
                            <div className="flex flex-wrap items-center gap-4 pt-8 border-t border-white/10">
                                <div className="flex flex-col gap-2">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-white/30">Flow Stage</p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleUpdateStatus(order.id, { processing_status: order.processing_status === 'processed' ? 'not processed' : 'processed' })}
                                            className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${order.processing_status === 'processed' ? 'bg-accent-black text-white' : 'bg-white/5 text-white/50 border border-white/10 hover:border-white/20'}`}
                                        >
                                            {order.processing_status === 'processed' ? '? Processed' : 'Mark Processed'}
                                        </button>
                                    </div>
                                </div>

                                <div className="w-px h-8 bg-white/5 hidden md:block"></div>

                                <div className="flex flex-col gap-2">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-white/30">Delivery Phase</p>
                                    <div className="flex gap-2">
                                        {['pending', 'in transit', 'delivered'].map((status) => (
                                            <button
                                                key={status}
                                                onClick={() => handleUpdateStatus(order.id, { delivery_status: status })}
                                                className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${order.delivery_status === status ? 'bg-[#111111] text-white' : 'bg-white/5 text-white/50 border border-white/10 hover:border-white/20'}`}
                                            >
                                                {status}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-12 pb-20">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                        className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center disabled:opacity-20 hover:bg-white/5 transition-all text-white"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6" /></svg>
                    </button>
                    <div className="flex gap-2">
                        {Array.from({ length: totalPages }).map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setPage(i + 1)}
                                className={`w-12 h-12 rounded-2xl border font-black text-[10px] transition-all ${page === i + 1 ? 'bg-[#111111] text-white border-white' : 'bg-white/5 text-white/50 border-white/10 hover:border-white/20'}`}
                            >
                                {i + 1}
                            </button>
                        ))}
                    </div>
                    <button
                        disabled={page === totalPages}
                        onClick={() => setPage(p => p + 1)}
                        className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center disabled:opacity-20 hover:bg-white/5 transition-all text-white"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6" /></svg>
                    </button>
                </div>
            )}
        </div>
    );
};

// --- Profit Tracker ---
const DRUGS_CATALOG = [
    { name: 'Semaglutide', dosage: 'Injections', price: '$299', category: 'Weight Loss' },
    { name: 'Tirzepatide', dosage: 'Injections', price: '$399', category: 'Weight Loss' },
    { name: 'Semaglutide', dosage: 'Drops', price: '$249', category: 'Weight Loss' },
    { name: 'Tirzepatide', dosage: 'Drops', price: '$349', category: 'Weight Loss' },
    { name: 'Retatrutide', dosage: 'Research', price: '$499', category: 'Weight Loss' },
    { name: 'ReadySetGo (2-in-1 RDT)', dosage: 'Men', price: '$89', category: 'Better Sex' },
    { name: 'GrowTabs (Sildenafil)', dosage: 'Men', price: '$49', category: 'Better Sex' },
    { name: 'GrowTabs (Tadalafil)', dosage: 'Men', price: '$49', category: 'Better Sex' },
    { name: 'Sildenafil / Tadalafil', dosage: '2-in-1 Troche', price: '$89', category: 'Better Sex' },
    { name: '3-in-1 Hair Growth Tabs', dosage: 'Rx', price: '$99', category: 'Hair Loss' },
    { name: '2-in-1 Hair Growth Tabs', dosage: 'Rx', price: '$79', category: 'Hair Loss' },
    { name: 'Finasteride', dosage: 'Oral', price: '$49', category: 'Hair Loss' },
    { name: 'NAD + Spray', dosage: 'Nasal', price: '$99', category: 'Longevity' },
    { name: 'NAD +', dosage: 'Subq Inj', price: '$199', category: 'Longevity' },
    { name: 'Glutathione', dosage: 'Subq Inj', price: '$149', category: 'Longevity' },
    { name: 'Testosterone', dosage: 'Injection', price: '$199', category: 'Testosterone' },
    { name: 'Testosterone', dosage: 'RDT', price: '$159', category: 'Testosterone' },
    { name: 'BPC 157', dosage: 'Subq Inj', price: '$149', category: 'Repair & Strength' },
    { name: 'BPC 157 / TB 500', dosage: 'Subq Inj', price: '$199', category: 'Repair & Strength' },
];

const ProfitTrackerView = () => {
    const [purchases, setPurchases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState(null);
    const [drugSearch, setDrugSearch] = useState('');
    const [drugDropdownOpen, setDrugDropdownOpen] = useState(false);
    const [profitSummary, setProfitSummary] = useState([]);
    const drugInputRef = React.useRef(null);

    const [form, setForm] = useState({
        drug_name: '',
        pharmacy_name: '',
        cost_per_unit: '',
        quantity: '',
        selling_price: '',
        purchase_date: new Date().toISOString().split('T')[0],
        notes: '',
    });

    const filteredDrugs = DRUGS_CATALOG.filter(d =>
        d.name.toLowerCase().includes(drugSearch.toLowerCase()) ||
        d.category.toLowerCase().includes(drugSearch.toLowerCase())
    );

    const fetchPurchases = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('pharmacy_purchases')
                .select('*')
                .order('purchase_date', { ascending: false });
            if (error) throw error;
            setPurchases(data || []);

            // Build profit summary per drug
            const summary = {};
            (data || []).forEach(p => {
                if (!summary[p.drug_name]) summary[p.drug_name] = { totalCost: 0, totalUnits: 0, totalRevenue: 0, totalProfit: 0 };
                summary[p.drug_name].totalCost += Number(p.total_cost) || 0;
                summary[p.drug_name].totalUnits += Number(p.quantity) || 0;
                summary[p.drug_name].totalRevenue += Number(p.selling_price) || 0;
                summary[p.drug_name].totalProfit += Number(p.profit) || 0;
            });

            const drugNames = Object.keys(summary);
            const summaryArr = drugNames.map(drug => ({
                drug,
                totalCost: summary[drug].totalCost,
                totalUnits: summary[drug].totalUnits,
                avgCostPerUnit: summary[drug].totalUnits > 0 ? summary[drug].totalCost / summary[drug].totalUnits : 0,
                revenue: summary[drug].totalRevenue,
                profit: summary[drug].totalProfit,
                margin: summary[drug].totalRevenue > 0
                    ? ((summary[drug].totalProfit / summary[drug].totalRevenue) * 100).toFixed(1)
                    : 'N/A'
            })).sort((a, b) => b.profit - a.profit);

            setProfitSummary(summaryArr);
        } catch (err) {
            console.error('Fetch purchases error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPurchases(); }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        if (!form.drug_name) return setMsg({ type: 'error', text: 'Please select a drug.' });
        setSaving(true); setMsg(null);
        try {
            const totalCost = parseFloat(form.cost_per_unit) * parseInt(form.quantity);
            const sellingPrice = parseFloat(form.selling_price) || 0;
            const stripeFee = sellingPrice > 0 ? (sellingPrice * 0.029 + 0.30) : 0;
            const profit = sellingPrice - stripeFee - totalCost;

            const { error } = await supabase.from('pharmacy_purchases').insert([{
                drug_name: form.drug_name,
                pharmacy_name: form.pharmacy_name,
                cost_per_unit: parseFloat(form.cost_per_unit),
                quantity: parseInt(form.quantity),
                total_cost: totalCost,
                selling_price: sellingPrice,
                stripe_fee: stripeFee,
                profit: profit,
                purchase_date: form.purchase_date,
                notes: form.notes,
            }]);
            if (error) throw error;
            setMsg({ type: 'success', text: 'Purchase recorded successfully!' });
            setForm({ drug_name: '', pharmacy_name: '', cost_per_unit: '', quantity: '', selling_price: '', purchase_date: new Date().toISOString().split('T')[0], notes: '' });
            setDrugSearch('');
            setShowForm(false);
            fetchPurchases();
        } catch (err) {
            setMsg({ type: 'error', text: err.message });
        } finally {
            setSaving(false);
        }
    };

    const fmtMoney = (v) => `$${Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const totalCostAll = purchases.reduce((s, p) => s + (Number(p.total_cost) || 0), 0);
    const totalRevAll = profitSummary.reduce((s, p) => s + p.revenue, 0);
    const totalProfitAll = totalRevAll - totalCostAll;

    const inputStyle = {
        width: '100%', boxSizing: 'border-box',
        backgroundColor: 'rgba(255,255,255,0.05)',
        border: '1.5px solid rgba(255,255,255,0.1)',
        borderRadius: '14px', padding: '14px 18px',
        fontSize: '13px', color: '#fff', outline: 'none',
        transition: 'border-color 0.2s', fontFamily: 'inherit'
    };
    const labelStyle = {
        display: 'block', fontSize: '9px', fontWeight: '900',
        textTransform: 'uppercase', letterSpacing: '0.3em',
        color: 'rgba(255,255,255,0.35)', marginBottom: '8px'
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white/5 border border-red-500/20 rounded-3xl p-6">
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-3">Total Purchase Cost</p>
                    <p className="text-3xl font-black tracking-tighter text-red-400">{fmtMoney(totalCostAll)}</p>
                    <p className="text-[9px] text-white/25 mt-1 uppercase">Pharmacy spend</p>
                </div>
                <div className="bg-white/5 border border-[#bfff00]/20 rounded-3xl p-6">
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-3">Total Drug Revenue</p>
                    <p className="text-3xl font-black tracking-tighter text-[#bfff00]">{fmtMoney(totalRevAll)}</p>
                    <p className="text-[9px] text-white/25 mt-1 uppercase">From billing records</p>
                </div>
                <div className={`bg-white/5 border rounded-3xl p-6 ${totalProfitAll >= 0 ? 'border-[#FFDE59]/30' : 'border-red-500/30'}`}>
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-3">Estimated Profit</p>
                    <p className={`text-3xl font-black tracking-tighter ${totalProfitAll >= 0 ? 'text-[#FFDE59]' : 'text-red-400'}`}>
                        {totalProfitAll >= 0 ? '' : '-'}{fmtMoney(Math.abs(totalProfitAll))}
                    </p>
                    <p className="text-[9px] text-white/25 mt-1 uppercase">Revenue minus cost</p>
                </div>
            </div>

            {/* Add Purchase Button */}
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-widest text-white/50">Pharmacy Purchase Log</h3>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 px-6 py-3 bg-[#FFDE59] text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M12 5v14M5 12h14" />
                    </svg>
                    {showForm ? 'Cancel' : 'Log Purchase'}
                </button>
            </div>

            {/* Add Purchase Form */}
            {showForm && (
                <form onSubmit={handleSave} className="bg-white/5 border border-white/10 rounded-[32px] p-8 space-y-6 animate-in fade-in duration-300">
                    <h4 className="text-base font-black uppercase tracking-tight text-white/80">Record New Purchase</h4>

                    {msg && (
                        <div style={{
                            padding: '12px 18px', borderRadius: '12px', fontSize: '12px', fontWeight: '700',
                            backgroundColor: msg.type === 'success' ? 'rgba(255,222,89,0.1)' : 'rgba(239,68,68,0.1)',
                            border: `1px solid ${msg.type === 'success' ? 'rgba(255,222,89,0.3)' : 'rgba(239,68,68,0.3)'}`,
                            color: msg.type === 'success' ? '#FFDE59' : '#f87171'
                        }}>{msg.text}</div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Searchable Drug Dropdown */}
                        <div className="md:col-span-2">
                            <label style={labelStyle}>Drug / Product *</label>
                            <div className="relative">
                                <input
                                    ref={drugInputRef}
                                    type="text"
                                    value={form.drug_name || drugSearch}
                                    onChange={e => { setDrugSearch(e.target.value); setForm(f => ({ ...f, drug_name: '' })); setDrugDropdownOpen(true); }}
                                    onFocus={() => setDrugDropdownOpen(true)}
                                    placeholder="Search for a drug or product..."
                                    style={inputStyle}
                                    onFocus={e => { e.target.style.borderColor = '#FFDE59'; setDrugDropdownOpen(true); }}
                                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; setTimeout(() => setDrugDropdownOpen(false), 200); }}
                                    required={!form.drug_name}
                                />
                                {form.drug_name && (
                                    <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)' }}>
                                        <div style={{ width: '8px', height: '8px', backgroundColor: '#FFDE59', borderRadius: '50%' }} />
                                    </div>
                                )}
                                {drugDropdownOpen && filteredDrugs.length > 0 && (
                                    <div style={{
                                        position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, zIndex: 999,
                                        backgroundColor: '#111111', border: '1.5px solid rgba(255,255,255,0.12)',
                                        borderRadius: '16px', overflow: 'hidden', maxHeight: '240px', overflowY: 'auto',
                                        boxShadow: '0 20px 60px rgba(0,0,0,0.6)'
                                    }}>
                                        {Object.entries(
                                            filteredDrugs.reduce((acc, d) => { (acc[d.category] = acc[d.category] || []).push(d); return acc; }, {})
                                        ).map(([category, drugs]) => (
                                            <div key={category}>
                                                <div style={{ padding: '8px 16px', fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.25em', color: 'rgba(255,255,255,0.25)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                    {category}
                                                </div>
                                                <button
                                                    key={drug.name + drug.dosage}
                                                    type="button"
                                                    onMouseDown={() => {
                                                        const formattedName = `${drug.name}${drug.dosage ? ' ' + drug.dosage : ''} ${drug.price}`;
                                                        setForm(f => ({ ...f, drug_name: formattedName }));
                                                        setDrugSearch(formattedName);
                                                        setDrugDropdownOpen(false);
                                                    }}
                                                    style={{
                                                        width: '100%', textAlign: 'left', padding: '12px 16px',
                                                        fontSize: '13px', fontWeight: '600', color: form.drug_name === `${drug.name} ${drug.dosage} ${drug.price}` ? '#FFDE59' : '#ffffff',
                                                        backgroundColor: form.drug_name === `${drug.name} ${drug.dosage} ${drug.price}` ? 'rgba(255,222,89,0.08)' : 'transparent',
                                                        border: 'none', cursor: 'pointer', display: 'block',
                                                        transition: 'background-color 0.15s'
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = form.drug_name === `${drug.name} ${drug.dosage} ${drug.price}` ? 'rgba(255,222,89,0.08)' : 'transparent'}
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <div className="flex flex-col">
                                                            <span className="text-white font-bold">{drug.name}</span>
                                                            <span className="text-[10px] text-white/40 uppercase tracking-widest">{drug.dosage}</span>
                                                        </div>
                                                        <span className="text-[#FFDE59] font-black">{drug.price}</span>
                                                    </div>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {drugDropdownOpen && filteredDrugs.length === 0 && (
                                    <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, zIndex: 999, backgroundColor: '#111111', border: '1.5px solid rgba(255,255,255,0.12)', borderRadius: '16px', padding: '16px', fontSize: '12px', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
                                        No drugs found
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <label style={labelStyle}>Pharmacy Name *</label>
                            <input
                                type="text"
                                list="pharmacies"
                                value={form.pharmacy_name}
                                onChange={e => setForm(f => ({ ...f, pharmacy_name: e.target.value }))}
                                placeholder="e.g. Empower Pharmacy"
                                style={inputStyle}
                                required
                                onFocus={e => e.target.style.borderColor = '#FFDE59'}
                                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                            />
                            <datalist id="pharmacies">
                                <option value="Empower Pharmacy" />
                                <option value="Hallandale Pharmacy" />
                                <option value="Strive Pharmacy" />
                                <option value="Red Rock Pharmacy" />
                                <option value="APS Pharmacy" />
                                <option value="University Compounding" />
                            </datalist>
                        </div>

                        <div>
                            <label style={labelStyle}>Purchase Date *</label>
                            <input type="date" value={form.purchase_date} onChange={e => setForm(f => ({ ...f, purchase_date: e.target.value }))} style={inputStyle} required onFocus={e => e.target.style.borderColor = '#FFDE59'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                        </div>

                        <div>
                            <label style={labelStyle}>Cost Per Unit ($) *</label>
                            <input type="number" step="0.01" min="0" value={form.cost_per_unit} onChange={e => setForm(f => ({ ...f, cost_per_unit: e.target.value }))} placeholder="e.g. 45.00" style={inputStyle} required onFocus={e => e.target.style.borderColor = '#FFDE59'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                        </div>

                        <div>
                            <label style={labelStyle}>Quantity *</label>
                            <input type="number" min="1" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} placeholder="e.g. 50" style={inputStyle} required onFocus={e => e.target.style.borderColor = '#FFDE59'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                        </div>

                        <div>
                            <label style={labelStyle}>Expected Selling Price ($) *</label>
                            <input type="number" step="0.01" min="0" value={form.selling_price} onChange={e => setForm(f => ({ ...f, selling_price: e.target.value }))} placeholder="e.g. 15000.00" style={inputStyle} required onFocus={e => e.target.style.borderColor = '#FFDE59'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                        </div>

                        {form.cost_per_unit && form.quantity && (
                            <div className="md:col-span-2 bg-[#FFDE59]/10 border border-[#FFDE59]/20 rounded-2xl p-4 flex items-center gap-4">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFDE59" strokeWidth="2">
                                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                                </svg>
                                <div>
                                    <p style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.25em', color: 'rgba(255,222,89,0.7)', marginBottom: '2px' }}>Total Purchase Cost</p>
                                    <p style={{ fontSize: '22px', fontWeight: '900', color: '#FFDE59', letterSpacing: '-0.03em' }}>
                                        ${(parseFloat(form.cost_per_unit || 0) * parseInt(form.quantity || 0)).toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="md:col-span-2">
                            <label style={labelStyle}>Notes (Optional)</label>
                            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Batch number, supplier contact, etc." rows={3} style={{ ...inputStyle, resize: 'vertical' }} onFocus={e => e.target.style.borderColor = '#FFDE59'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                        </div>
                    </div>

                    <button type="submit" disabled={saving} style={{ padding: '16px 40px', borderRadius: '999px', backgroundColor: '#FFDE59', color: '#000', border: 'none', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.3em', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, fontFamily: 'inherit' }}>
                        {saving ? 'Saving...' : 'Save Purchase'}
                    </button>
                </form>
            )}

            {/* Profit Comparison Table */}
            {profitSummary.length > 0 && (
                <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-white/50 mb-4">Profit Breakdown by Drug</h3>
                    <div className="bg-[#111111] border border-white/10 rounded-[32px] overflow-x-auto">
                        <table className="w-full text-left min-w-[800px]">
                            <thead>
                                <tr className="border-b border-white/10">
                                    {['Drug / Product', 'Units Purchased', 'Total Cost', 'Gross Revenue', 'Stripe Fees (Est)', 'Net Profit', 'Margin'].map(h => (
                                        <th key={h} className="p-6 text-[9px] font-black uppercase tracking-widest text-white/40">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {profitSummary.map((row, i) => {
                                    const totalStripeFees = row.revenue * 0.029 + (row.totalUnits > 0 ? (row.revenue / (row.revenue / 100) * 0.3) : 0); // rough est
                                    // Actually we stored profit in the DB now, but for retrospective or consistency:
                                    return (
                                        <tr key={i} className="hover:bg-white/[0.02] transition-all">
                                            <td className="p-6">
                                                <p className="text-sm font-bold text-white">{row.drug}</p>
                                            </td>
                                            <td className="p-6 text-xs font-bold text-white/60">{row.totalUnits.toLocaleString()}</td>
                                            <td className="p-6 text-xs font-bold text-red-500">{fmtMoney(row.totalCost)}</td>
                                            <td className="p-6 text-xs font-bold text-[#bfff00]">{fmtMoney(row.revenue)}</td>
                                            <td className="p-6 text-xs font-bold text-red-400/60">{fmtMoney(row.revenue * 0.029 + (row.revenue > 0 ? 0.30 : 0))}</td>
                                            <td className="p-6">
                                                <span className={`text-sm font-black ${row.profit > 0 ? 'text-[#FFDE59]' : row.profit < 0 ? 'text-red-400' : 'text-white/30'}`}>
                                                    {row.profit !== 0 ? `${row.profit > 0 ? '+' : ''}${fmtMoney(row.profit)}` : '$0.00'}
                                                </span>
                                            </td>
                                            <td className="p-6">
                                                {row.margin !== 'N/A' ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden max-w-[80px]">
                                                            <div className={`h-full rounded-full ${parseFloat(row.margin) > 0 ? 'bg-[#FFDE59]' : 'bg-red-400'}`} style={{ width: `${Math.min(100, Math.abs(parseFloat(row.margin)))}%` }} />
                                                        </div>
                                                        <span className={`text-xs font-black ${parseFloat(row.margin) > 0 ? 'text-[#FFDE59]' : 'text-red-400'}`}>{row.margin}%</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] text-white/25 uppercase font-black">No revenue data</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Purchase History */}
            {loading ? (
                <div className="py-20 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-[#FFDE59]/30 border-t-[#FFDE59] rounded-full animate-spin" />
                </div>
            ) : purchases.length > 0 && (
                <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-white/50 mb-4">Purchase History</h3>
                    <div className="space-y-3">
                        {purchases.map(p => (
                            <div key={p.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-white/20 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-[#FFDE59]/10 flex items-center justify-center shrink-0">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFDE59" strokeWidth="2.5">
                                            <path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zM8 7h8M8 11h8M8 15h4" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-white">{p.drug_name}</p>
                                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider">{p.pharmacy_name} � {new Date(p.purchase_date).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6 text-right">
                                    <div>
                                        <p className="text-[9px] text-white/30 uppercase font-black tracking-widest">Qty</p>
                                        <p className="text-sm font-black text-white">{p.quantity}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] text-white/30 uppercase font-black tracking-widest">Per Unit</p>
                                        <p className="text-sm font-black text-white">{fmtMoney(p.cost_per_unit)}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] text-white/30 uppercase font-black tracking-widest">Total Cost</p>
                                        <p className="text-sm font-black text-red-400">{fmtMoney(p.total_cost)}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {!loading && purchases.length === 0 && (
                <div className="text-center py-20 border-2 border-dashed border-white/10 rounded-3xl">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" className="mx-auto mb-4">
                        <path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zM12 8v8M8 12h8" />
                    </svg>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/30">No purchases logged yet</p>
                    <p className="text-[9px] text-white/20 mt-2">Click "Log Purchase" to record your first pharmacy purchase</p>
                </div>
            )}
        </div>
    );
};

// -------------------------------------------------------------
// STATEMENTS � Admin View
// -------------------------------------------------------------
const StatementDocument = ({ stmt, rates }) => {
    const LOGO_TEXT = ['u', 'Glow', 'MD'];
    const fmtMoney = (v) => `$${Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const periodLabel = stmt.period_label || `${stmt.month_name} ${stmt.year}`;
    const newTotal = (rates?.new_patient_rate ?? stmt.new_patient_rate ?? 5) * (stmt.new_patient_count ?? 0);
    const recurringTotal = (rates?.recurring_patient_rate ?? stmt.recurring_patient_rate ?? 5) * (stmt.recurring_patient_count ?? 0);
    const grandTotal = stmt.total_payout ?? (newTotal + recurringTotal);

    const pageStyle = {
        backgroundColor: '#fff',
        color: '#111',
        fontFamily: 'Georgia, serif',
        padding: '48px 56px',
        minHeight: '1050px',
        position: 'relative',
        pageBreakAfter: 'always',
        borderRadius: '24px',
        border: '1px solid rgba(0,0,0,0.08)',
        marginBottom: '24px',
    };
    const labelSt = { fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#888', marginBottom: '4px' };
    const valueSt = { fontSize: '14px', fontWeight: '700', color: '#111' };

    return (
        <div>
            {/* PAGE 1 � Summary Statement */}
            <div style={pageStyle}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '48px' }}>
                    <div>
                        <div style={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.3em', color: '#888', marginBottom: '6px' }}>PROVIDER COMPENSATION STATEMENT</div>
                        <div style={{ fontSize: '28px', fontWeight: '900', color: '#111', letterSpacing: '-0.03em' }}>{periodLabel}</div>
                        <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>Statement #{stmt.statement_number || stmt.id?.slice(0, 8).toUpperCase()}</div>
                    </div>
                    {/* uGlowMD Logo � top right, large */}
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '36px', fontWeight: '900', letterSpacing: '-0.04em', color: '#111', lineHeight: 1 }}>
                            <span style={{ fontStyle: 'italic', fontWeight: '400', opacity: 0.7 }}>u</span>Glow<sup style={{ fontSize: '16px', fontWeight: '700' }}>MD</sup>
                        </div>
                        <div style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.35em', color: '#999', marginTop: '4px' }}>uGlowMD � Provider Portal</div>
                    </div>
                </div>

                <div style={{ height: '1px', backgroundColor: '#e5e5e5', marginBottom: '40px' }} />

                {/* Statement Period & Generated Info */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', marginBottom: '48px' }}>
                    <div>
                        <div style={labelSt}>Statement Period</div>
                        <div style={valueSt}>{periodLabel}</div>
                    </div>
                    <div>
                        <div style={labelSt}>Release Date</div>
                        <div style={valueSt}>{stmt.release_date ? new Date(stmt.release_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '5th of the month'}</div>
                    </div>
                    <div>
                        <div style={labelSt}>Status</div>
                        <div style={{ display: 'inline-block', padding: '4px 14px', borderRadius: '999px', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.15em', backgroundColor: stmt.status === 'approved' ? '#dcfce7' : stmt.status === 'pending_review' ? '#fef9c3' : '#f3f4f6', color: stmt.status === 'approved' ? '#16a34a' : stmt.status === 'pending_review' ? '#ca8a04' : '#6b7280' }}>
                            {stmt.status === 'approved' ? 'Approved' : stmt.status === 'pending_review' ? 'Pending Review' : stmt.status || 'Draft'}
                        </div>
                    </div>
                </div>

                {/* Compensation Table */}
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
                                <td style={{ padding: '20px 24px' }}>
                                    <div style={{ fontWeight: '700' }}>New Patient Eligibility</div>
                                    <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>Patients enrolled for the first time in {periodLabel}</div>
                                </td>
                                <td style={{ padding: '20px 24px', textAlign: 'center', fontWeight: '900', fontSize: '18px' }}>{stmt.new_patient_count ?? 0}</td>
                                <td style={{ padding: '20px 24px', textAlign: 'center', color: '#555' }}>{fmtMoney(rates?.new_patient_rate ?? stmt.new_patient_rate ?? 5)} / patient</td>
                                <td style={{ padding: '20px 24px', textAlign: 'right', fontWeight: '900', fontSize: '16px' }}>{fmtMoney(newTotal)}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '20px 24px' }}>
                                    <div style={{ fontWeight: '700' }}>Recurring Active Subscribers</div>
                                    <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>Active subscribers with recurring billing in {periodLabel}</div>
                                </td>
                                <td style={{ padding: '20px 24px', textAlign: 'center', fontWeight: '900', fontSize: '18px' }}>{stmt.recurring_patient_count ?? 0}</td>
                                <td style={{ padding: '20px 24px', textAlign: 'center', color: '#555' }}>{fmtMoney(rates?.recurring_patient_rate ?? stmt.recurring_patient_rate ?? 5)} / subscriber</td>
                                <td style={{ padding: '20px 24px', textAlign: 'right', fontWeight: '900', fontSize: '16px' }}>{fmtMoney(recurringTotal)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Grand Total */}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <div style={{ backgroundColor: '#111', color: '#fff', borderRadius: '16px', padding: '24px 40px', textAlign: 'right', minWidth: '280px' }}>
                        <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.3em', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>Total Payout to Provider</div>
                        <div style={{ fontSize: '40px', fontWeight: '900', letterSpacing: '-0.03em', color: '#FFDE59' }}>{fmtMoney(grandTotal)}</div>
                    </div>
                </div>

                {/* Footer */}
                <div style={{ position: 'absolute', bottom: '40px', left: '56px', right: '56px', borderTop: '1px solid #eee', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '11px', color: '#bbb' }}>uGlowMD � Provider Compensation � Confidential</div>
                    <div style={{ fontSize: '11px', color: '#bbb' }}>Page 1 of 2</div>
                </div>
            </div>

            {/* PAGE 2 � Patient Lists */}
            <div style={{ ...pageStyle, pageBreakAfter: 'auto' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
                    <div>
                        <div style={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.3em', color: '#888', marginBottom: '6px' }}>PATIENT DETAIL � {periodLabel}</div>
                        <div style={{ fontSize: '22px', fontWeight: '900', color: '#111', letterSpacing: '-0.02em' }}>New & Recurring Patient Roster</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '30px', fontWeight: '900', letterSpacing: '-0.04em', color: '#111', lineHeight: 1 }}>
                            <span style={{ fontStyle: 'italic', fontWeight: '400', opacity: 0.7 }}>u</span>Glow<sup style={{ fontSize: '14px', fontWeight: '700' }}>MD</sup>
                        </div>
                    </div>
                </div>

                <div style={{ height: '1px', backgroundColor: '#e5e5e5', marginBottom: '32px' }} />

                {/* New Patients */}
                <div style={{ marginBottom: '40px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div style={{ fontSize: '13px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#111' }}>New Patients � {stmt.new_patient_count ?? 0} total</div>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#555' }}>{fmtMoney(rates?.new_patient_rate ?? stmt.new_patient_rate ?? 5)} each</div>
                    </div>
                    {(stmt.new_patients_list && stmt.new_patients_list.length > 0) ? (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f3f4f6' }}>
                                    <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: '700', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#666' }}>#</th>
                                    <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: '700', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#666' }}>Patient Name</th>
                                    <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: '700', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#666' }}>Email</th>
                                    <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: '700', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#666' }}>Join Date</th>
                                    <th style={{ padding: '10px 16px', textAlign: 'right', fontWeight: '700', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#666' }}>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stmt.new_patients_list.map((p, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                        <td style={{ padding: '10px 16px', color: '#888' }}>{i + 1}</td>
                                        <td style={{ padding: '10px 16px', fontWeight: '600' }}>{p.name || `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || 'N/A'}</td>
                                        <td style={{ padding: '10px 16px', color: '#555', fontSize: '12px' }}>{p.email || '�'}</td>
                                        <td style={{ padding: '10px 16px', color: '#555', fontSize: '12px' }}>{p.joined ? new Date(p.joined).toLocaleDateString() : '�'}</td>
                                        <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: '700' }}>{fmtMoney(rates?.new_patient_rate ?? stmt.new_patient_rate ?? 5)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div style={{ padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '12px', textAlign: 'center', color: '#aaa', fontSize: '12px' }}>
                            Detailed roster will appear once statement is generated from live patient data
                        </div>
                    )}
                </div>

                {/* Recurring Patients */}
                <div style={{ marginBottom: '40px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div style={{ fontSize: '13px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#111' }}>Recurring Subscribers � {stmt.recurring_patient_count ?? 0} total</div>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#555' }}>{fmtMoney(rates?.recurring_patient_rate ?? stmt.recurring_patient_rate ?? 5)} each</div>
                    </div>
                    {(stmt.recurring_patients_list && stmt.recurring_patients_list.length > 0) ? (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f3f4f6' }}>
                                    <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: '700', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#666' }}>#</th>
                                    <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: '700', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#666' }}>Patient Name</th>
                                    <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: '700', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#666' }}>Email</th>
                                    <th style={{ padding: '10px 16px', textAlign: 'right', fontWeight: '700', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#666' }}>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stmt.recurring_patients_list.map((p, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                        <td style={{ padding: '10px 16px', color: '#888' }}>{i + 1}</td>
                                        <td style={{ padding: '10px 16px', fontWeight: '600' }}>{p.name || `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || 'N/A'}</td>
                                        <td style={{ padding: '10px 16px', color: '#555', fontSize: '12px' }}>{p.email || '�'}</td>
                                        <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: '700' }}>{fmtMoney(rates?.recurring_patient_rate ?? stmt.recurring_patient_rate ?? 5)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div style={{ padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '12px', textAlign: 'center', color: '#aaa', fontSize: '12px' }}>
                            Detailed roster will appear once statement is generated from live patient data
                        </div>
                    )}
                </div>

                {/* Grand Total � Page 2 */}
                <div style={{ borderTop: '2px solid #111', paddingTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.3em', color: '#888', marginBottom: '8px' }}>Total Payout to Provider</div>
                        <div style={{ fontSize: '36px', fontWeight: '900', letterSpacing: '-0.03em', color: '#111' }}>{fmtMoney(grandTotal)}</div>
                        <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>{stmt.new_patient_count ?? 0} new + {stmt.recurring_patient_count ?? 0} recurring patients</div>
                    </div>
                </div>

                {/* Footer */}
                <div style={{ position: 'absolute', bottom: '40px', left: '56px', right: '56px', borderTop: '1px solid #eee', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '11px', color: '#bbb' }}>uGlowMD � Provider Compensation � Confidential</div>
                    <div style={{ fontSize: '11px', color: '#bbb' }}>Page 2 of 2</div>
                </div>
            </div>
        </div>
    );
};

const StatementsAdminView = () => {
    const [statements, setStatements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [saving, setSaving] = useState(false);
    const [selectedStmt, setSelectedStmt] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [previewMode, setPreviewMode] = useState(false);
    const [msg, setMsg] = useState(null);

    const [rates, setRates] = useState({ new_patient_rate: 5, recurring_patient_rate: 5 });
    const [ratesSaving, setRatesSaving] = useState(false);
    const [ratesMsg, setRatesMsg] = useState(null);

    const [editForm, setEditForm] = useState({});

    const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const getPriorMonthRange = () => {
        const now = new Date();
        const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
        const month = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
        const start = new Date(year, month, 1);
        const end = new Date(year, month + 1, 0, 23, 59, 59);
        return { year, month, month_name: MONTHS[month], start: start.toISOString(), end: end.toISOString() };
    };

    const fetchStatements = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('provider_statements')
                .select('*')
                .order('year', { ascending: false })
                .order('month', { ascending: false });
            if (error) throw error;
            setStatements(data || []);

            // Fetch rates from settings
            const { data: settingsData } = await supabase
                .from('statement_settings')
                .select('*')
                .single();
            if (settingsData) setRates({ new_patient_rate: settingsData.new_patient_rate ?? 5, recurring_patient_rate: settingsData.recurring_patient_rate ?? 5 });
        } catch (err) {
            console.error('Fetch statements error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchStatements(); }, []);

    const handleGenerate = async () => {
        setGenerating(true); setMsg(null);
        try {
            const { year, month, month_name, start, end } = getPriorMonthRange();

            // Check if already exists
            const { data: existing } = await supabase
                .from('provider_statements')
                .select('id')
                .eq('year', year)
                .eq('month', month)
                .maybeSingle();
            if (existing) {
                setMsg({ type: 'error', text: `Statement for ${month_name} ${year} already exists.` });
                setGenerating(false);
                return;
            }

            // Count new patients (profiles created in range)
            const { data: newPatients } = await supabase
                .from('profiles')
                .select('id, first_name, last_name, email, created_at')
                .gte('created_at', start)
                .lte('created_at', end);

            // Count recurring active subscribers (subscribe_status = true, subscribed before end of prior month)
            const { data: recurringPatients } = await supabase
                .from('profiles')
                .select('id, first_name, last_name, email, created_at')
                .eq('subscribe_status', true)
                .lt('created_at', start); // active but not new this month

            const newCount = (newPatients || []).length;
            const recurringCount = (recurringPatients || []).length;
            const newRate = rates.new_patient_rate;
            const recurringRate = rates.recurring_patient_rate;
            const totalPayout = (newCount * newRate) + (recurringCount * recurringRate);

            const releaseDate = new Date(year, month + 1, 5).toISOString(); // 5th of following month

            const newStmt = {
                year, month, month_name,
                period_label: `${month_name} ${year}`,
                statement_number: `STMT-${year}${String(month + 1).padStart(2, '0')}-001`,
                new_patient_count: newCount,
                recurring_patient_count: recurringCount,
                new_patient_rate: newRate,
                recurring_patient_rate: recurringRate,
                total_payout: totalPayout,
                status: 'pending_review',
                release_date: releaseDate,
                new_patients_list: (newPatients || []).map(p => ({ name: `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim(), email: p.email, joined: p.created_at })),
                recurring_patients_list: (recurringPatients || []).map(p => ({ name: `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim(), email: p.email })),
            };

            const { error } = await supabase.from('provider_statements').insert([newStmt]);
            if (error) throw error;
            setMsg({ type: 'success', text: `Statement for ${month_name} ${year} generated successfully! ${newCount} new + ${recurringCount} recurring = ${fmtMoney(totalPayout)}` });
            fetchStatements();
        } catch (err) {
            setMsg({ type: 'error', text: err.message });
        } finally {
            setGenerating(false);
        }
    };

    const handleApprove = async (id) => {
        setSaving(true);
        try {
            const { error } = await supabase.from('provider_statements').update({ status: 'approved', approved_at: new Date().toISOString() }).eq('id', id);
            if (error) throw error;
            setMsg({ type: 'success', text: 'Statement approved and released to provider.' });
            fetchStatements();
            if (selectedStmt?.id === id) setSelectedStmt(prev => ({ ...prev, status: 'approved' }));
        } catch (err) {
            setMsg({ type: 'error', text: err.message });
        } finally {
            setSaving(false);
        }
    };

    const handleSaveEdit = async () => {
        setSaving(true);
        try {
            const newPayout = (Number(editForm.new_patient_rate) * Number(editForm.new_patient_count)) +
                (Number(editForm.recurring_patient_rate) * Number(editForm.recurring_patient_count));
            const updates = { ...editForm, total_payout: editForm.total_payout_override ? Number(editForm.total_payout_override) : newPayout };
            const { error } = await supabase.from('provider_statements').update(updates).eq('id', selectedStmt.id);
            if (error) throw error;
            setMsg({ type: 'success', text: 'Statement updated successfully.' });
            setEditMode(false);
            fetchStatements();
            setSelectedStmt(prev => ({ ...prev, ...updates }));
        } catch (err) {
            setMsg({ type: 'error', text: err.message });
        } finally {
            setSaving(false);
        }
    };

    const handleSaveRates = async () => {
        setRatesSaving(true); setRatesMsg(null);
        try {
            const { data: existing } = await supabase.from('statement_settings').select('id').maybeSingle();
            if (existing) {
                const { error } = await supabase.from('statement_settings').update(rates).eq('id', existing.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('statement_settings').insert([rates]);
                if (error) throw error;
            }
            setRatesMsg({ type: 'success', text: 'Rates saved.' });
        } catch (err) {
            setRatesMsg({ type: 'error', text: err.message });
        } finally {
            setRatesSaving(false);
        }
    };

    const fmtMoney = (v) => `$${Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const inputStyle = { width: '100%', boxSizing: 'border-box', backgroundColor: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px 16px', fontSize: '14px', color: '#fff', outline: 'none', fontFamily: 'inherit' };
    const labelStyle = { display: 'block', fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.3em', color: 'rgba(255,255,255,0.35)', marginBottom: '6px' };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {msg && (
                <div style={{ padding: '14px 20px', borderRadius: '14px', fontSize: '13px', fontWeight: '700', backgroundColor: msg.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${msg.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`, color: msg.type === 'success' ? '#4ade80' : '#f87171' }}>
                    {msg.text}
                </div>
            )}

            {/* Rate Settings Card */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-black uppercase tracking-tight">Compensation Rates</h3>
                        <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">Set the per-patient payout amounts for provider statements</p>
                    </div>
                    <button onClick={handleSaveRates} disabled={ratesSaving} className="px-6 py-3 bg-[#FFDE59] text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all disabled:opacity-50">
                        {ratesSaving ? 'Saving...' : 'Save Rates'}
                    </button>
                </div>
                {ratesMsg && <div style={{ marginBottom: '16px', padding: '10px 16px', borderRadius: '10px', fontSize: '12px', fontWeight: '700', backgroundColor: ratesMsg.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${ratesMsg.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`, color: ratesMsg.type === 'success' ? '#4ade80' : '#f87171' }}>{ratesMsg.text}</div>}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label style={labelStyle}>New Patient Rate ($ per patient)</label>
                        <input type="number" step="0.01" min="0" value={rates.new_patient_rate} onChange={e => setRates(r => ({ ...r, new_patient_rate: parseFloat(e.target.value) }))} style={inputStyle} onFocus={e => e.target.style.borderColor = '#FFDE59'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                    </div>
                    <div>
                        <label style={labelStyle}>Recurring Subscriber Rate ($ per patient)</label>
                        <input type="number" step="0.01" min="0" value={rates.recurring_patient_rate} onChange={e => setRates(r => ({ ...r, recurring_patient_rate: parseFloat(e.target.value) }))} style={inputStyle} onFocus={e => e.target.style.borderColor = '#FFDE59'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                    </div>
                </div>
            </div>

            {/* Generate Statement */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-black uppercase tracking-tight">Monthly Statements</h3>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">Statements auto-release on the 5th of each month for the prior full calendar month</p>
                </div>
                <button onClick={handleGenerate} disabled={generating} className="flex items-center gap-2 px-6 py-3 bg-[#FFDE59] text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all disabled:opacity-50">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12h14" /></svg>
                    {generating ? 'Generating...' : 'Generate Statement'}
                </button>
            </div>

            {/* Statement List */}
            {loading ? (
                <div className="py-20 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-[#FFDE59]/30 border-t-[#FFDE59] rounded-full animate-spin" />
                </div>
            ) : statements.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-white/10 rounded-3xl">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" className="mx-auto mb-4"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/30">No statements generated yet</p>
                    <p className="text-[9px] text-white/20 mt-2">Click "Generate Statement" to create this month's provider statement</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {statements.map(stmt => (
                        <div key={stmt.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-white/20 transition-all">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-[#FFDE59]/10 flex items-center justify-center shrink-0">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFDE59" strokeWidth="2.5"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                </div>
                                <div>
                                    <p className="text-sm font-black text-white">{stmt.period_label || `${stmt.month_name} ${stmt.year}`}</p>
                                    <p className="text-[10px] text-white/40 uppercase tracking-wider">{stmt.statement_number} � {stmt.new_patient_count ?? 0} new � {stmt.recurring_patient_count ?? 0} recurring</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 flex-wrap">
                                <div className="text-right">
                                    <p className="text-[9px] text-white/30 uppercase font-black tracking-widest">Payout</p>
                                    <p className="text-lg font-black text-[#FFDE59]">{fmtMoney(stmt.total_payout)}</p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${stmt.status === 'approved' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                                    {stmt.status === 'approved' ? 'Approved' : 'Pending Review'}
                                </span>
                                <button onClick={() => { setSelectedStmt(stmt); setEditMode(false); setPreviewMode(false); setEditForm({ new_patient_count: stmt.new_patient_count, recurring_patient_count: stmt.recurring_patient_count, new_patient_rate: stmt.new_patient_rate, recurring_patient_rate: stmt.recurring_patient_rate, total_payout_override: '' }); }} className="px-4 py-2 bg-accent-black/10 border border-accent-black/20 text-accent-black rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-accent-black/20 transition-all">Review</button>
                                {stmt.status !== 'approved' && (
                                    <button onClick={() => handleApprove(stmt.id)} disabled={saving} className="px-4 py-2 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-green-500/20 transition-all disabled:opacity-50">Approve</button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Statement Review Panel */}
            {selectedStmt && (
                <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-3xl flex items-start justify-center p-4 md:p-8 overflow-y-auto animate-in fade-in duration-300">
                    <div className="w-full max-w-5xl">
                        {/* Review Header */}
                        <div className="bg-[#111111] border border-white/10 rounded-[32px] p-6 md:p-8 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tight">Statement Review</h3>
                                <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">{selectedStmt.period_label} � {selectedStmt.statement_number}</p>
                            </div>
                            <div className="flex items-center gap-3 flex-wrap">
                                {!editMode && <button onClick={() => setPreviewMode(!previewMode)} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${previewMode ? 'bg-[#FFDE59] text-black' : 'bg-white/10 text-white/60 hover:text-white'}`}>{previewMode ? 'Hide Preview' : 'Preview Document'}</button>}
                                {!previewMode && <button onClick={() => setEditMode(!editMode)} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${editMode ? 'bg-white/20 text-white' : 'bg-white/10 text-white/60 hover:text-white'}`}>{editMode ? 'Cancel Edit' : 'Edit Values'}</button>}
                                {selectedStmt.status !== 'approved' && !editMode && !previewMode && <button onClick={() => handleApprove(selectedStmt.id)} disabled={saving} className="px-5 py-2.5 bg-green-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-400 transition-all disabled:opacity-50">? Approve & Release</button>}
                                {editMode && <button onClick={handleSaveEdit} disabled={saving} className="px-5 py-2.5 bg-[#FFDE59] text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all disabled:opacity-50">{saving ? 'Saving...' : 'Save Changes'}</button>}
                                <button onClick={() => { setSelectedStmt(null); setEditMode(false); setPreviewMode(false); }} className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/5 transition-all">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
                                </button>
                            </div>
                        </div>

                        {/* Edit Form */}
                        {editMode && (
                            <div className="bg-[#111111] border border-white/10 rounded-3xl p-6 md:p-8 mb-6">
                                <h4 className="text-sm font-black uppercase tracking-wider text-white/60 mb-6">Edit Statement Values</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div><label style={labelStyle}>New Patient Count</label><input type="number" min="0" value={editForm.new_patient_count} onChange={e => setEditForm(f => ({ ...f, new_patient_count: e.target.value }))} style={inputStyle} onFocus={e => e.target.style.borderColor = '#FFDE59'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} /></div>
                                    <div><label style={labelStyle}>New Patient Rate ($)</label><input type="number" step="0.01" min="0" value={editForm.new_patient_rate} onChange={e => setEditForm(f => ({ ...f, new_patient_rate: e.target.value }))} style={inputStyle} onFocus={e => e.target.style.borderColor = '#FFDE59'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} /></div>
                                    <div><label style={labelStyle}>Recurring Patient Count</label><input type="number" min="0" value={editForm.recurring_patient_count} onChange={e => setEditForm(f => ({ ...f, recurring_patient_count: e.target.value }))} style={inputStyle} onFocus={e => e.target.style.borderColor = '#FFDE59'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} /></div>
                                    <div><label style={labelStyle}>Recurring Patient Rate ($)</label><input type="number" step="0.01" min="0" value={editForm.recurring_patient_rate} onChange={e => setEditForm(f => ({ ...f, recurring_patient_rate: e.target.value }))} style={inputStyle} onFocus={e => e.target.style.borderColor = '#FFDE59'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} /></div>
                                    <div className="md:col-span-2">
                                        <label style={labelStyle}>Override Total Payout ($ � leave blank to auto-calculate)</label>
                                        <input type="number" step="0.01" min="0" value={editForm.total_payout_override} onChange={e => setEditForm(f => ({ ...f, total_payout_override: e.target.value }))} placeholder="Auto-calculated if blank" style={inputStyle} onFocus={e => e.target.style.borderColor = '#FFDE59'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                                        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '6px' }}>
                                            Auto: {fmtMoney((Number(editForm.new_patient_rate) * Number(editForm.new_patient_count)) + (Number(editForm.recurring_patient_rate) * Number(editForm.recurring_patient_count)))}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Document Preview */}
                        {previewMode && (
                            <div style={{ backgroundColor: '#e5e7eb', padding: '32px', borderRadius: '24px' }}>
                                <StatementDocument stmt={selectedStmt} rates={rates} />
                            </div>
                        )}

                        {/* Statement Quick-View (no preview mode) */}
                        {!previewMode && !editMode && (
                            <div className="bg-[#111111] border border-white/10 rounded-3xl p-6 md:p-8">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                                    {[
                                        { label: 'New Patients', value: selectedStmt.new_patient_count ?? 0 },
                                        { label: 'New Rate', value: fmtMoney(selectedStmt.new_patient_rate ?? 5) },
                                        { label: 'Recurring Subscribers', value: selectedStmt.recurring_patient_count ?? 0 },
                                        { label: 'Recurring Rate', value: fmtMoney(selectedStmt.recurring_patient_rate ?? 5) },
                                    ].map((item, i) => (
                                        <div key={i} className="bg-white/5 rounded-2xl p-4">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-2">{item.label}</p>
                                            <p className="text-2xl font-black text-white">{item.value}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-end">
                                    <div className="bg-[#FFDE59]/10 border border-[#FFDE59]/20 rounded-2xl p-6 text-right">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-[#FFDE59]/60 mb-2">Total Payout</p>
                                        <p className="text-4xl font-black text-[#FFDE59]">{fmtMoney(selectedStmt.total_payout)}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};


// --- Blog Management ---
const BlogManagement = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentPost, setCurrentPost] = useState(null);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
            const filePath = `blog-images/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('blog-posts')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('blog-posts')
                .getPublicUrl(filePath);

            setCurrentPost({ ...currentPost, image_url: publicUrl });
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Error uploading image: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    useEffect(() => {
        const fetchPosts = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('blog_posts')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) console.error('Fetch posts error:', error);
            else setPosts(data || []);
            setLoading(false);
        };
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('blog_posts')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) console.error('Fetch posts error:', error);
        else setPosts(data || []);
        setLoading(false);
    };

    const handleEdit = (post) => {
        setCurrentPost(post || {
            title: '',
            content: '',
            author: 'uGlow MD Team',
            status: 'draft',
            image_url: ''
        });
        setIsEditing(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this post?')) return;
        const { error } = await supabase.from('blog_posts').delete().eq('id', id);
        if (error) toast.error('Error deleting post');
        else fetchPosts();
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        const { error } = currentPost.id
            ? await supabase.from('blog_posts').update(currentPost).eq('id', currentPost.id)
            : await supabase.from('blog_posts').insert([currentPost]);

        if (error) {
            console.error('Save error:', error);
            toast.error('Error saving post');
        } else {
            setIsEditing(false);
            fetchPosts();
        }
        setSaving(false);
    };

    if (loading) return (
        <div className="py-20 flex flex-col items-center justify-center gap-6 animate-pulse">
            <div className="w-12 h-12 border-4 border-accent-black/20 border-t-accent-black rounded-full animate-spin"></div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Scanning Archives...</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="text-xl font-black uppercase tracking-tighter">Peer reviewed blog Content</h3>
                <div className="flex gap-4">
                    <button
                        onClick={() => handleEdit(null)}
                        className="px-6 py-3 bg-[#FFDE59] text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg"
                    >
                        Create New Post
                    </button>
                </div>
            </div>

            {isEditing ? (
                <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 md:p-10 space-y-8 animate-in zoom-in-95 duration-300">
                    <form onSubmit={handleSave} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-white/50 px-2">Post Title</label>
                                <input
                                    value={currentPost.title}
                                    onChange={e => setCurrentPost({ ...currentPost, title: e.target.value })}
                                    required
                                    className="w-full bg-[#111111] border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white focus:outline-none focus:border-[#FFDE59] transition-all"
                                    placeholder="Enter title..."
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-white/50 px-2">Author</label>
                                <input
                                    value={currentPost.author}
                                    onChange={e => setCurrentPost({ ...currentPost, author: e.target.value })}
                                    className="w-full bg-[#111111] border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white focus:outline-none focus:border-[#FFDE59] transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-white/50 px-2">Featured Image</label>
                            <div className="flex flex-col md:flex-row gap-6 items-start">
                                {currentPost.image_url ? (
                                    <div className="relative group shrink-0">
                                        <img src={currentPost.image_url} alt="" className="w-40 h-40 rounded-3xl object-cover border border-white/10 shadow-2xl" />
                                        <button
                                            type="button"
                                            onClick={() => setCurrentPost({ ...currentPost, image_url: '' })}
                                            className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="w-40 h-40 rounded-3xl bg-[#111111] border border-dashed border-white/10 flex flex-col items-center justify-center gap-3 shrink-0">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/20"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        <p className="text-[8px] font-black uppercase tracking-widest text-white/20">No Image</p>
                                    </div>
                                )}

                                <div className="flex-1 space-y-4 w-full">
                                    <div className="relative">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            disabled={uploading}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        />
                                        <div className={`w-full bg-[#111111] border border-white/5 rounded-2xl px-6 py-5 flex items-center justify-center gap-4 transition-all shadow-xl ${uploading ? 'opacity-50' : 'hover:border-[#FFDE59]/50 hover:bg-white/5'}`}>
                                            {uploading ? (
                                                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                            ) : (
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-white/60"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>
                                            )}
                                            <span className="text-[10px] font-black uppercase tracking-widest text-white/80">
                                                {uploading ? 'Transmitting Data...' : 'Choose File to Upload'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-white/50 px-2">Status</label>
                            <select
                                value={currentPost.status}
                                onChange={e => setCurrentPost({ ...currentPost, status: e.target.value })}
                                className="w-full bg-[#111111] border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white focus:outline-none focus:border-[#FFDE59] transition-all appearance-none"
                            >
                                <option value="draft">Draft</option>
                                <option value="published">Published</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-white/50 px-2">Post Content (HTML/Markdown support)</label>
                            <textarea
                                value={currentPost.content}
                                onChange={e => setCurrentPost({ ...currentPost, content: e.target.value })}
                                required
                                rows="12"
                                className="w-full bg-[#111111] border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white focus:outline-none focus:border-[#FFDE59] transition-all resize-none"
                                placeholder="Write your post content here..."
                            />
                        </div>

                        <div className="flex justify-end gap-4 pt-4">
                            <button
                                type="button"
                                onClick={() => setIsEditing(false)}
                                className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-12 py-4 bg-[#FFDE59] text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl disabled:opacity-50"
                            >
                                {saving ? 'Saving...' : 'Save Post'}
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="bg-white/5 border border-white/10 rounded-[32px] p-4 md:p-8 xl:p-10 overflow-x-auto max-w-full">
                    <table className="w-full text-left min-w-[800px]">
                        <thead>
                            <tr className="border-b border-white/10">
                                <th className="pb-6 text-[10px] font-black uppercase tracking-widest text-white/40">Post Title</th>
                                <th className="pb-6 text-[10px] font-black uppercase tracking-widest text-white/40">Author</th>
                                <th className="pb-6 text-[10px] font-black uppercase tracking-widest text-white/40">Status</th>
                                <th className="pb-6 text-[10px] font-black uppercase tracking-widest text-white/40">Created</th>
                                <th className="pb-6 text-[10px] font-black uppercase tracking-widest text-white/40 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {posts.map(post => (
                                <tr key={post.id} className="group hover:bg-white/5 transition-all">
                                    <td className="py-6">
                                        <div className="flex items-center gap-4">
                                            {post.image_url ? (
                                                <img src={post.image_url} alt="" className="w-12 h-12 rounded-xl object-cover border border-white/10 shadow-lg" />
                                            ) : (
                                                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/20"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                </div>
                                            )}
                                            <p className="font-bold text-sm tracking-tight text-white">{post.title}</p>
                                        </div>
                                    </td>
                                    <td className="py-6 text-xs text-white/60 font-medium">{post.author}</td>
                                    <td className="py-6">
                                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${post.status === 'published' ? 'bg-[#bfff00]/10 text-[#bfff00] border border-[#bfff00]/20' : 'bg-white/5 text-white/40 border border-white/10'}`}>
                                            {post.status}
                                        </span>
                                    </td>
                                    <td className="py-6 text-xs text-white/40 font-mono tracking-tighter">
                                        {post.created_at ? new Date(post.created_at).toLocaleDateString() : '�'}
                                    </td>
                                    <td className="py-6 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            <button
                                                onClick={() => handleEdit(post)}
                                                className="text-[10px] font-black uppercase tracking-widest text-[#FFDE59] px-4 py-2 rounded-xl bg-[#FFDE59]/10 border border-[#FFDE59]/20 hover:bg-[#FFDE59] hover:text-black transition-all"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(post.id)}
                                                className="text-[10px] font-black uppercase tracking-widest text-red-500 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {posts.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="py-32 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-30">
                                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                                            <p className="text-[10px] font-black uppercase tracking-[0.3em]">Vault is Empty</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

// --- Main Admin Dashboard ---
const AdminDashboard = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        const checkRole = async () => {
            try {
                const { data, error } = await supabase.from('user_roles').select('role').eq('user_id', user?.id).single();
                if (error) console.error('[AdminDashboard] Role check error:', error);
                if (data) {
                    console.log('[AdminDashboard] Current user role:', data.role);
                    setRole(data.role);
                } else {
                    console.warn('[AdminDashboard] No role data found for UID:', user?.id);
                }
            } catch (err) {
                console.error('[AdminDashboard] Role check exception:', err);
            } finally {
                setLoading(false);
            }
        };

        const fetchPendingCount = async () => {
            const { count } = await supabase
                .from('form_submissions')
                .select('*', { count: 'exact', head: true })
                .eq('approval_status', 'pending');
            setPendingCount(count || 0);
        };

        if (user) {
            checkRole();
            fetchPendingCount();

            // Set up realtime subscription for badge updates
            const subscription = supabase
                .channel('admin_badge_updates')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'form_submissions' }, fetchPendingCount)
                .subscribe();

            return () => {
                subscription.unsubscribe();
            };
        }
    }, [user]);

    const currentTab = location.pathname.split('/').pop() || 'overview';

    if (loading) return <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center text-accent-black">LOADING OS...</div>;
    const isSubAdmin = ['physician', 'nurse_practitioner', 'physician_assistant', 'back_office', 'provider'].includes(role);
    if (role !== 'admin' && !isSubAdmin) return <Navigate to="/dashboard" replace />;

    const navItems = role === 'admin' ? [
        { id: 'overview', label: 'Overview', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
        { id: 'patients', label: 'Patients', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
        { id: 'clinical', label: 'Submissions', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', badge: pendingCount },
        { id: 'orders', label: 'Orders', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
        { id: 'discounts', label: 'Discounts', icon: 'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z' },
        { id: 'users', label: 'Users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
        { id: 'subscribers', label: 'Subscribers', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
        { id: 'profit-tracker', label: 'Profit Tracker', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
        { id: 'patient-express', label: 'Patient Express', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
        { id: 'surveys', label: 'Surveys', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
        { id: 'statements', label: 'Statements', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
        { id: 'blog', label: 'Peer reviewed blog', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' }
    ] : [
        { id: 'orders', label: 'Orders', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
        { id: 'subscribers', label: 'Subscribers', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
        { id: 'discounts', label: 'Discounts', icon: 'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z' },
        { id: 'patient-express', label: 'Patient Express', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
        { id: 'settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
    ];

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white font-sans flex">
            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A] border-b border-white/10 px-4 py-3 flex items-center justify-between">
                <h1 className="text-xl font-black uppercase tracking-tighter" onClick={() => navigate('/')}>
                    <span className="font-brand lowercase italic opacity-80">u</span>Glow<sup className="text-[0.6em] font-bold ml-0.5">MD</sup>
                </h1>
                <button
                    onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
                    className="w-10 h-10 flex flex-col items-center justify-center gap-1.5"
                >
                    <span className={`w-6 h-0.5 bg-[#111111] transition-all duration-300 ${mobileSidebarOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
                    <span className={`w-6 h-0.5 bg-[#111111] transition-all duration-300 ${mobileSidebarOpen ? 'opacity-0' : ''}`}></span>
                    <span className={`w-6 h-0.5 bg-[#111111] transition-all duration-300 ${mobileSidebarOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
                </button>
            </div>

            {/* Sidebar - Desktop and Mobile */}
            <aside className={`w-72 border-r border-white/10 bg-[#0A0A0A] lg:sticky lg:top-0 fixed h-screen p-6 md:p-8 z-40 transition-transform duration-300 lg:translate-x-0 ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:block`}>
                <div className="mb-8 md:mb-12 pt-16 lg:pt-0">
                    <h1 className="text-2xl font-black uppercase tracking-tighter cursor-pointer" onClick={() => navigate('/')}>
                        <span className="font-brand lowercase italic opacity-80">u</span>Glow<sup className="text-[0.6em] font-bold ml-0.5">MD</sup>
                    </h1>
                </div>
                <nav className="space-y-1">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => {
                                navigate(`/admin/${item.id}`);
                                setMobileSidebarOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl md:rounded-2xl text-[10px] md:text-[11px] font-black uppercase tracking-widest transition-all ${currentTab === item.id ? 'bg-white/10 text-white shadow-[0_4px_20px_rgba(0,0,0,0.2)]' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
                        >
                            <div className="flex items-center gap-2 md:gap-3">
                                <svg width="16" height="16" className="md:w-[18px] md:h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d={item.icon} /></svg>
                                {item.label}
                            </div>
                            {item.badge > 0 && (
                                <span className="bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-pulse">
                                    {item.badge}
                                </span>
                            )}
                        </button>
                    ))}

                    <div className="pt-6 md:pt-8 mt-6 md:mt-8 border-t border-white/10">
                        <button
                            onClick={() => {
                                navigate('/dashboard');
                                setMobileSidebarOpen(false);
                            }}
                            className="w-full flex items-center gap-2 md:gap-3 px-4 py-3 rounded-xl md:rounded-2xl text-[10px] md:text-[11px] font-black uppercase tracking-widest text-accent-black hover:bg-accent-black/10 transition-all"
                        >
                            <svg width="16" height="16" className="md:w-[18px] md:h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Patient Portal
                        </button>
                    </div>
                </nav>
            </aside>

            {/* Mobile Overlay */}
            {mobileSidebarOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-30"
                    onClick={() => setMobileSidebarOpen(false)}
                />
            )}

            <main className="flex-1 pt-20 lg:pt-12 w-full overflow-x-hidden">
                <div className="max-w-[1400px] 2xl:max-w-[1800px] mx-auto px-4 py-4 md:px-6 md:py-8 lg:px-8 lg:py-12">
                    <header className="mb-8 md:mb-16">
                        <h2 className="text-2xl md:text-3xl lg:text-4xl font-black uppercase  tracking-tighter">
                            {currentTab === 'overview' && ''}
                            {currentTab === 'patients' && 'Patient Directory'}
                            {currentTab === 'clinical' && 'Submissions'}
                            {currentTab === 'orders' && 'Order Management'}
                            {currentTab === 'discounts' && 'Discount Management'}
                            {currentTab === 'users' && 'Admin & User Roles'}
                            {currentTab === 'subscribers' && 'Subscriber Base'}
                            {currentTab === 'profit-tracker' && 'Profit Tracker'}
                            {currentTab === 'patient-express' && 'Patient Express Entry'}
                            {currentTab === 'surveys' && 'Feedback & Surveys'}
                            {currentTab === 'statements' && 'Statements'}
                            {currentTab === 'blog' && 'Peer reviewed blog'}
                            {currentTab === 'settings' && 'Settings'}
                        </h2>
                    </header>

                    <Routes>
                        <Route path="/" element={<Navigate to={role === 'admin' ? 'overview' : 'orders'} replace />} />
                        {role === 'admin' && <Route path="overview" element={<AdminOverview />} />}
                        {role === 'admin' && <Route path="patients" element={<PatientPortalManager />} />}
                        {role === 'admin' && <Route path="clinical" element={<ClinicalQueue />} />}
                        <Route path="orders" element={<OrderManagement />} />
                        <Route path="discounts" element={<DiscountManager />} />
                        {role === 'admin' && <Route path="users" element={<StaffManagement />} />}
                        <Route path="subscribers" element={<SubscriberAnalytics />} />
                        {role === 'admin' && <Route path="profit-tracker" element={<ProfitTrackerView />} />}
                        <Route path="patient-express" element={<PatientExpressEntry />} />
                        {role === 'admin' && <Route path="surveys" element={<SurveyManagement />} />}
                        {role === 'admin' && <Route path="statements" element={<StatementsAdminView />} />}
                        {role === 'admin' && <Route path="blog" element={<BlogManagement />} />}
                        <Route path="settings" element={
                            <div className="space-y-12">
                                <div className="bg-[#111111]/[0.03] border border-white/10 rounded-[32px] p-8 md:p-12">
                                    <h3 className="text-xl font-black uppercase tracking-tighter mb-8 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-accent-black/20 flex items-center justify-center text-accent-black">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                        </div>
                                        Profile Settings
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Legal Name</p>
                                            <p className="text-sm font-bold text-white/90">{user?.user_metadata?.first_name} {user?.user_metadata?.last_name}</p>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Email Address</p>
                                            <p className="text-sm font-bold text-white/90">{user?.email}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-[#111111]/[0.03] border border-white/10 rounded-[32px] p-8 md:p-12">
                                    <h3 className="text-xl font-black uppercase tracking-tighter mb-8 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                        </div>
                                        License & DEA Details
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-white/50 text-[10px] uppercase font-black">
                                        <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                                            <p className="mb-1 text-white/30">Role</p>
                                            <p className="text-sm text-white">{role?.replace('_', ' ')}</p>
                                        </div>
                                        <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                                            <p className="mb-1 text-white/30">Status</p>
                                            <p className="text-sm text-accent-black">Verified & Active</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-[#111111]/[0.03] border border-white/10 rounded-[32px] p-8 md:p-12">
                                    <h3 className="text-xl font-black uppercase tracking-tighter mb-8 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center text-red-500">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
                                        </div>
                                        Security Section
                                    </h3>
                                    <button className="px-6 py-3 bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/20 transition-all">
                                        Reset Administrative Password
                                    </button>
                                </div>
                            </div>
                        } />
                    </Routes>
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;
