import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { useNavigate, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { intakeQuestions } from '../data/questions';
import { gsap } from 'gsap';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// --- Sub-components ---
const RevenueChart = ({ data }) => {
    return (
        <div className="h-[300px] w-full bg-white/5 border border-white/10 rounded-[32px] p-6 md:p-8 lg:p-10 relative overflow-hidden group">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-8 gap-3">
                <h3 className="text-lg sm:text-xl font-black uppercase tracking-tighter italic">Monthly Earnings</h3>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-accent-green rounded-full animate-pulse"></div>
                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-white/20">Live Revenue Stream</span>
                </div>
            </div>

            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#bfff00" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#bfff00" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#ffffff40', fontSize: 10, fontWeight: 900 }}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#ffffff40', fontSize: 10, fontWeight: 900 }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#0A0A0A',
                            border: '1px solid #ffffff10',
                            borderRadius: '16px',
                            fontSize: '12px',
                            fontWeight: 'bold'
                        }}
                        itemStyle={{ color: '#bfff00' }}
                        cursor={{ stroke: '#ffffff20', strokeWidth: 1 }}
                    />
                    <Area
                        type="monotone"
                        dataKey="amount"
                        stroke="#bfff00"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                        animationDuration={2000}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

// --- Analytics View ---
const AdminOverview = () => {
    const [stats, setStats] = useState({
        totalPatients: 0,
        pendingReviews: 0,
        activeSubscriptions: 0,
        monthlyRevenue: 0
    });
    const [chartData, setChartData] = useState([]);

    useEffect(() => {
        const fetchStats = async () => {
            const { count: patientCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
            const { count: pendingCount } = await supabase.from('form_submissions').select('*', { count: 'exact', head: true }).eq('approval_status', 'pending');
            const { count: activeCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscribe_status', true);

            // Calculate MRR from billing_history
            const now = new Date().toISOString();
            const { data: billingData } = await supabase
                .from('billing_history')
                .select('amount, recurring, start, end')
                .eq('recurring', true)
                .lte('start', now)
                .gte('end', now);

            let calculatedMRR = 0;
            if (billingData) {
                calculatedMRR = billingData.reduce((sum, record) => {
                    const amount = Number(record.amount) || 0;
                    if (!record.start || !record.end) return sum + amount;

                    const start = new Date(record.start);
                    const end = new Date(record.end);
                    const diffDays = Math.max(1, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                    const months = Math.max(1, Math.round(diffDays / 30.4375));
                    return sum + (amount / months);
                }, 0);
            }

            setStats({
                totalPatients: patientCount || 0,
                pendingReviews: pendingCount || 0,
                activeSubscriptions: activeCount || 0,
                monthlyRevenue: Math.round(calculatedMRR)
            });

            // Fetch Billing History for the last 6 months to populate the chart
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
            sixMonthsAgo.setDate(1);
            sixMonthsAgo.setHours(0, 0, 0, 0);

            const { data: historyData } = await supabase
                .from('billing_history')
                .select('amount, created_at')
                .gte('created_at', sixMonthsAgo.toISOString())
                .order('created_at', { ascending: true });

            const monthlyAggregation = {};
            const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

            // Initialize last 6 months with 0
            for (let i = 0; i < 6; i++) {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                const monthName = months[d.getMonth()];
                monthlyAggregation[monthName] = 0;
            }

            if (historyData) {
                historyData.forEach(record => {
                    const date = new Date(record.created_at);
                    const monthName = months[date.getMonth()];
                    if (monthlyAggregation[monthName] !== undefined) {
                        monthlyAggregation[monthName] += Number(record.amount) || 0;
                    }
                });
            }

            // Convert aggregation object to sorted array for the chart
            const chartArray = Object.entries(monthlyAggregation)
                .map(([month, amount]) => ({ month, amount: Math.round(amount) }))
                .reverse(); // Since we built it backwards

            setChartData(chartArray);
        };
        fetchStats();
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-6 3xl:grid-cols-8 gap-4 md:gap-6">
                {[
                    { label: 'Total Patients', value: stats.totalPatients, color: 'blue', icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 110-8 4 4 0 010 8z' },
                    { label: 'Pending Reviews', value: stats.pendingReviews, color: 'orange', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
                    { label: 'Active Subs', value: stats.activeSubscriptions, color: 'accent-green', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
                    { label: 'Est. MRR', value: `$${stats.monthlyRevenue.toLocaleString()}`, color: 'purple', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' }
                ].map((stat, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 rounded-2xl md:rounded-3xl p-4 md:p-6 hover:border-white/20 transition-all group overflow-hidden relative">
                        <div className={`absolute -right-4 -top-4 w-24 h-24 bg-${stat.color === 'accent-green' ? 'accent-green' : stat.color}-500/5 blur-3xl transition-opacity group-hover:opacity-10 opacity-0`}></div>
                        <div className="flex items-center justify-between mb-4">
                            <div className={`w-12 h-12 rounded-2xl bg-${stat.color === 'accent-green' ? 'accent-green' : stat.color}-500/10 flex items-center justify-center`}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`text-${stat.color === 'accent-green' ? 'accent-green' : stat.color}-400`}>
                                    <path d={stat.icon} />
                                </svg>
                            </div>
                        </div>
                        <p className="text-2xl md:text-3xl font-black italic tracking-tighter mb-1">{stat.value}</p>
                        <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white/40">{stat.label}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-8 max-w-full">
                <div className="max-w-full">
                    <RevenueChart data={chartData} />
                </div>
            </div>
        </div>
    );
};

// --- Patient Manager ---
const formatPlanName = (plan) => {
    try {
        if (!plan || plan === 'None' || plan === '{}') return 'Monthly Maintenance';
        if (typeof plan === 'object' && plan !== null) {
            const plans = Object.values(plan).filter(v => !!v && typeof v === 'string');
            return plans.length > 0 ? plans.join(' + ') : 'Monthly Maintenance';
        }
        if (typeof plan === 'string') {
            try {
                const parsed = JSON.parse(plan);
                if (typeof parsed === 'object' && parsed !== null) {
                    const plans = Object.values(parsed).filter(v => !!v && typeof v === 'string');
                    return plans.length > 0 ? plans.join(' + ') : 'Monthly Maintenance';
                }
            } catch {
                return plan;
            }
        }
        return 'Protocol Plan';
    } catch (err) {
        console.error('[formatPlanName] Error:', err);
        return 'Protocol Plan';
    }
};

const PatientPortalManager = () => {
    const { user } = useAuth();
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [cardFilter, setCardFilter] = useState('all');
    const [planFilter, setPlanFilter] = useState('all');
    const [availablePlans, setAvailablePlans] = useState([]);
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

                    return {
                        ...profile,
                        form_submissions: userSubmissions,
                        submission_count: userSubmissions.length,
                        billing_history: userBilling,
                        questionnaire_responses: userQuestionnaires,
                        last_active: userSubmissions[0]?.created_at || profile.created_at
                    };
                });

                console.log('[PatientPortalManager] Combined data:', combinedData.length, 'records');
                setPatients(combinedData);

                // Extract unique plans for the filter
                const plans = new Set();
                combinedData.forEach(p => {
                    if (p.current_plan) {
                        const name = formatPlanName(p.current_plan);
                        if (name && name !== 'Monthly Maintenance' && name !== 'Protocol Plan' && name !== 'None') {
                            plans.add(name);
                        }
                    }
                });
                setAvailablePlans(Array.from(plans).sort());

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
            <div className="w-12 h-12 border-4 border-accent-green/20 border-t-accent-green rounded-full animate-spin"></div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Decrypting Patient Records...</p>
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

        let matchesStatus = true;
        if (statusFilter === 'active') matchesStatus = p.subscribe_status === true;
        if (statusFilter === 'inactive') matchesStatus = p.subscribe_status === false;

        let matchesCard = true;
        if (cardFilter === 'vaulted') matchesCard = !!p.stripe_payment_method_id;
        if (cardFilter === 'none') matchesCard = !p.stripe_payment_method_id;

        let matchesPlan = true;
        if (planFilter !== 'all') {
            const planName = formatPlanName(p.current_plan).toLowerCase();
            matchesPlan = planName.includes(planFilter.toLowerCase());
        }

        return matchesSearch && matchesStatus && matchesCard && matchesPlan;
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
                        className="w-full bg-white/5 border border-white/10 rounded-2xl md:rounded-3xl px-6 md:px-8 py-3 md:py-5 text-sm font-bold text-white focus:outline-none focus:border-accent-green focus:bg-white/[0.08] transition-all placeholder:text-white/20 shadow-2xl"
                    />
                    <div className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-accent-green transition-colors">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                    </div>
                </div>

                {/* Filters Row */}
                <div className="flex flex-wrap gap-3 md:gap-4">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-xl md:rounded-2xl px-4 md:px-6 py-3 md:py-4 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white/60 focus:outline-none focus:border-accent-green hover:bg-white/10 transition-all cursor-pointer appearance-none flex-1 min-w-[120px] md:min-w-[160px]"
                    >
                        <option value="all" className="bg-[#0A0A0A]">All Statuses</option>
                        <option value="active" className="bg-[#0A0A0A]">Active Only</option>
                        <option value="inactive" className="bg-[#0A0A0A]">Inactive Only</option>
                    </select>

                    <select
                        value={cardFilter}
                        onChange={(e) => setCardFilter(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-xl md:rounded-2xl px-4 md:px-6 py-3 md:py-4 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white/60 focus:outline-none focus:border-accent-green hover:bg-white/10 transition-all cursor-pointer appearance-none flex-1 min-w-[120px] md:min-w-[160px]"
                    >
                        <option value="all" className="bg-[#0A0A0A]">All Cards</option>
                        <option value="vaulted" className="bg-[#0A0A0A]">Card Vaulted</option>
                        <option value="none" className="bg-[#0A0A0A]">No Card</option>
                    </select>

                    <select
                        value={planFilter}
                        onChange={(e) => setPlanFilter(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-xl md:rounded-2xl px-4 md:px-6 py-3 md:py-4 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white/60 focus:outline-none focus:border-accent-green hover:bg-white/10 transition-all cursor-pointer appearance-none flex-1 min-w-[140px] md:min-w-[180px]"
                    >
                        <option value="all" className="bg-[#0A0A0A]">All Plans</option>
                        <option value="Monthly Maintenance" className="bg-[#0A0A0A]">Monthly Maintenance</option>
                        {availablePlans.map(plan => (
                            <option key={plan} value={plan} className="bg-[#0A0A0A]">{plan}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Patient Table - Responsive with horizontal scroll on mobile */}
            <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl md:rounded-[40px] p-4 md:p-6 lg:p-8 xl:p-10 overflow-x-auto max-w-full">
                <table className="w-full text-left min-w-[900px]">
                    <thead>
                        <tr className="border-b border-white/5">
                            <th className="pb-4 md:pb-6 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white/40 w-[20%]">Patient</th>
                            <th className="pb-4 md:pb-6 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white/40 w-[20%]">Email</th>
                            <th className="pb-4 md:pb-6 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white/40 w-[12%]">Subscription</th>
                            <th className="pb-4 md:pb-6 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white/40 w-[15%]">Current Plan</th>
                            <th className="pb-4 md:pb-6 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white/40 w-[10%]">Assessments</th>
                            <th className="pb-4 md:pb-6 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white/40 w-[10%]">Card on File</th>
                            <th className="pb-4 md:pb-6 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white/40 w-[10%]">Joined</th>
                            <th className="pb-4 md:pb-6 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white/40 text-right w-[3%]"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredPatients.map((p) => (
                            <tr key={p.id} className="group hover:bg-white/[0.02] transition-all">
                                <td className="py-4 md:py-6">
                                    <p className="font-bold text-xs md:text-sm text-white">{p.first_name} {p.last_name}</p>
                                </td>
                                <td className="py-4 md:py-6 text-[10px] md:text-xs text-white/60">{p.email}</td>
                                <td className="py-4 md:py-6">
                                    <span className={`px-2 py-1 rounded-full text-[7px] md:text-[8px] font-black uppercase ${p.subscribe_status ? 'bg-accent-green/10 text-accent-green' : 'bg-white/5 text-white/40'}`}>
                                        {p.subscribe_status ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="py-4 md:py-6 text-[10px] md:text-xs text-white/80 italic">{formatPlanName(p.current_plan)}</td>
                                <td className="py-4 md:py-6">
                                    <span className="text-[10px] md:text-xs font-bold text-white/40">
                                        {p.submission_count || 0} Submitted
                                    </span>
                                </td>
                                <td className="py-4 md:py-6">
                                    {p.stripe_payment_method_id || p.last_four_digits_of_card ? (
                                        <span className="flex items-center gap-1.5 text-[9px] md:text-[10px] font-black uppercase text-accent-green">
                                            <div className="w-1.5 h-1.5 bg-accent-green rounded-full"></div>
                                            •••• {p.last_four_digits_of_card || 'VAULT'}
                                        </span>
                                    ) : (
                                        <span className="text-[9px] md:text-[10px] font-black uppercase text-white/20 italic">None</span>
                                    )}
                                </td>
                                <td className="py-4 md:py-6 text-[10px] md:text-xs text-white/40">
                                    {p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}
                                </td>
                                <td className="py-4 md:py-6 text-right">
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            const id = p.user_id || p.id;
                                            console.log('[PatientPortalManager] Opening dossier for ID:', id);
                                            setSelectedPatientId(id);
                                            setIsDossierOpen(true);
                                        }}
                                        className="text-[9px] md:text-[10px] font-black uppercase text-accent-green hover:text-white transition-all bg-accent-green/10 px-3 md:px-4 py-2 md:py-2.5 rounded-lg md:rounded-xl border border-accent-green/20 whitespace-nowrap"
                                    >
                                        View More
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {filteredPatients.length === 0 && (
                            <tr>
                                <td colSpan="8" className="py-20 text-center text-xs font-black uppercase tracking-widest text-white/20">
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
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-3xl">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-accent-green/20 border-t-accent-green rounded-full animate-spin"></div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Accessing Archive...</p>
            </div>
        </div>
    );

    if (!patient) {
        console.error('[PatientDossierModal] No profile found for ID:', patientId);
        return (
            <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/90 backdrop-blur-3xl p-12">
                <div className="bg-[#0A0A0A] border border-white/10 rounded-[32px] p-12 text-center max-w-md">
                    <p className="text-red-500 font-bold mb-4">Patient Profile Not Found</p>
                    <p className="text-xs text-white/40 uppercase font-black mb-8">No medical record exists in the system for ID: {patientId}</p>
                    <button onClick={handleClose} className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase text-white/60 hover:text-white transition-all">Close</button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 md:p-12 bg-black/95 backdrop-blur-3xl animate-in fade-in duration-500">
            <div className="w-full max-w-6xl max-h-[90vh] bg-[#0A0A0A] border border-white/10 rounded-[48px] shadow-2xl overflow-hidden flex flex-col border-glow border-accent-green/20">
                {/* Header */}
                <div className="p-8 md:p-12 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-8 bg-[#080808]">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-accent-green/10 border border-accent-green/20 rounded-3xl flex items-center justify-center text-3xl font-black italic text-accent-green shrink-0">
                            {patient.first_name?.[0]}{patient.last_name?.[0]}
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h3 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter leading-none italic">
                                    {patient.first_name} <span className="text-accent-green">{patient.last_name}</span>
                                </h3>
                                <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${patient.subscribe_status ? 'bg-accent-green text-black' : 'bg-white/10 text-white/40'}`}>
                                    {patient.subscribe_status ? 'Active' : 'Inactive'}
                                </div>
                            </div>
                            <p className="text-[11px] text-white/40 uppercase font-black tracking-[0.2em]">Patient Dossier • {patient.email}</p>
                        </div>
                    </div>
                    <div className="hidden md:flex items-center gap-4">
                        <button onClick={handleClose} className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all text-white/40 hover:text-white shrink-0">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12" /></svg>
                        </button>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="px-12 py-2 border-b border-white/5 flex gap-6 items-center bg-[#070707] overflow-x-auto scrollbar-hide">
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
                            className={`text-[9px] font-black uppercase tracking-[0.2em] transition-all relative py-4 whitespace-nowrap ${activeTab === tab.id ? 'text-white' : 'text-white/20 hover:text-white/40'}`}
                        >
                            {tab.label}
                            {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-green shadow-[0_0_20px_rgba(191,255,0,0.5)]"></div>}
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
                                    <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-accent-green mb-8 bg-accent-green/5 py-3 px-6 rounded-xl inline-block">Personal Identity</h4>
                                    <div className="space-y-6">
                                        <DossierRow label="Gender" value={patient.sex || patient.gender || submissions[0]?.sex || 'Not Specified'} />
                                        <DossierRow label="Date of Birth" value={patient.date_of_birth || submissions[0]?.birthday || 'Not Stored'} />
                                        <DossierRow label="Phone" value={patient.phone_number || submissions[0]?.shipping_phone || '—'} />
                                        <DossierRow label="Joined Data" value={new Date(patient.created_at).toLocaleDateString()} />

                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-accent-green mb-8 bg-accent-green/5 py-3 px-6 rounded-xl inline-block">Contact & Shipping</h4>
                                    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-4">
                                        <p className="text-[10px] text-white/20 uppercase font-black tracking-widest leading-none">Registered Address</p>
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
                                    <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-accent-green mb-8 bg-accent-green/5 py-3 px-6 rounded-xl inline-block">Active Medication</h4>
                                    <div className="bg-accent-green/5 border-l-4 border-accent-green p-8 rounded-tr-3xl rounded-br-3xl space-y-4">
                                        {(() => {
                                            // Get approved submissions
                                            const approvedMeds = submissions.filter(sub => sub.approval_status === 'approved');

                                            if (approvedMeds.length === 0) {
                                                return (
                                                    <>
                                                        <p className="text-[10px] text-accent-green/60 uppercase font-black tracking-widest mb-2 italic">Current Plan</p>
                                                        <h5 className="text-2xl font-black uppercase italic tracking-tighter text-white">
                                                            {formatPlanName(patient.current_plan)}
                                                        </h5>
                                                    </>
                                                );
                                            }

                                            return approvedMeds.map((med, idx) => (
                                                <div key={med.id} className={idx > 0 ? 'pt-4 border-t border-accent-green/20' : ''}>
                                                    <p className="text-[10px] text-accent-green/60 uppercase font-black tracking-widest mb-2 italic">
                                                        {med.dosage_preference || med.selected_drug || 'Medication'}
                                                    </p>
                                                    <h5 className="text-xl font-black uppercase italic tracking-tighter text-white">
                                                        {med.selected_drug || formatPlanName(patient.current_plan)}
                                                    </h5>
                                                </div>
                                            ));
                                        })()}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-accent-green mb-8 bg-accent-green/5 py-3 px-6 rounded-xl inline-block">Vital Statistics</h4>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                                            <p className="text-[9px] text-white/20 uppercase font-black tracking-widest mb-1">Height</p>
                                            <p className="text-xl font-black text-white">
                                                {patient.height_feet && patient.height_inches ? `${patient.height_feet}'${patient.height_inches}"` :
                                                    patient.height_ft && patient.height_in ? `${patient.height_ft}'${patient.height_in}"` :
                                                        submissions[0]?.height_feet && submissions[0]?.height_inches ? `${submissions[0].height_feet}'${submissions[0].height_inches}"` :
                                                            submissions[0]?.height_ft && submissions[0]?.height_in ? `${submissions[0].height_ft}'${submissions[0].height_in}"` :
                                                                submissions[0]?.height || patient.height || '—'}
                                            </p>
                                        </div>
                                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                                            <p className="text-[9px] text-white/20 uppercase font-black tracking-widest mb-1">Weight</p>
                                            <p className="text-xl font-black text-white">
                                                {patient.weight || submissions[0]?.weight || '—'}
                                            </p>
                                        </div>
                                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                                            <p className="text-[9px] text-white/20 uppercase font-black tracking-widest mb-1">BMI</p>
                                            <p className="text-xl font-black text-accent-green">
                                                {patient.bmi ? Number(patient.bmi).toFixed(1) : (submissions[0]?.bmi ? Number(submissions[0].bmi).toFixed(1) : '—')}
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
                                <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-3xl">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/20">No clinical submissions found for this identity.</p>
                                </div>
                            ) : (
                                submissions.map(sub => (
                                    <div key={sub.id} className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 hover:bg-white/[0.05] transition-all group flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="flex items-center gap-6">
                                            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white/20 group-hover:text-accent-green transition-all">
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h5 className="text-sm font-black uppercase text-white">{sub.selected_drug || 'General Consult'}</h5>
                                                    <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase ${sub.approval_status === 'approved' ? 'bg-accent-green/10 text-accent-green' : sub.approval_status === 'pending' ? 'bg-orange-500/10 text-orange-500' : 'bg-red-500/10 text-red-500'}`}>
                                                        {sub.approval_status}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-white/30 uppercase font-black tracking-widest">ID: {String(sub.id).substring(0, 8)}... • {new Date(sub.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {sub.approval_status === 'approved' && (
                                                <span className="flex items-center gap-2 text-[10px] font-black uppercase text-accent-green bg-accent-green/5 px-4 py-2 rounded-xl">
                                                    <div className="w-1.5 h-1.5 bg-accent-green rounded-full"></div>
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
                                <div className="flex justify-between items-center border-b border-white/5 pb-8">
                                    <div>
                                        <p className="text-[10px] text-accent-green font-black uppercase tracking-widest mb-1 italic">Current Status</p>
                                        <h5 className="text-3xl font-black uppercase italic tracking-tighter text-white">
                                            {patient.subscribe_status ? 'Active Medication' : 'No Active Subscription'}
                                        </h5>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-white/20 font-black uppercase tracking-widest mb-1">Plan Name</p>
                                        <p className="text-lg font-black text-white italic">{formatPlanName(patient.current_plan)}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">

                                    <DossierStat label="Renewal Date" value={patient.current_sub_end_date ? new Date(patient.current_sub_end_date).toLocaleDateString() : '—'} />
                                    <DossierStat label="Payment" value={patient.last_four_digits_of_card ? `Ends in ${patient.last_four_digits_of_card}` : 'No Card'} />
                                    <DossierStat label="Auto-Pay" value={patient.stripe_payment_method_id ? 'Enabled' : 'Disabled'} />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'documents' && (
                        <div className="text-center py-24 animate-in slide-in-from-bottom-4">
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-white/20"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                            </div>
                            <h5 className="text-[11px] font-black uppercase tracking-[0.3em] text-white/40 mb-2">Document Archive Empty</h5>
                            <p className="text-[9px] text-white/10 uppercase font-black tracking-widest leading-loose">No supplemental clinical records or laboratory<br />uploads found in this patient's vault.</p>
                        </div>
                    )}

                    {activeTab === 'rx' && (
                        <div className="space-y-4 animate-in slide-in-from-bottom-4">
                            {orders.length === 0 ? (
                                <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-3xl">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/20">No active prescriptions or fulfillment history.</p>
                                </div>
                            ) : (
                                orders.map(order => (
                                    <div key={order.id} className="bg-[#0D0D0D] border border-white/10 rounded-3xl p-8 flex flex-col md:flex-row md:items-center justify-between gap-8">
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-accent-green font-black uppercase tracking-[0.2em] italic">GLP-1 RX SHIPPED</p>
                                            <h5 className="text-2xl font-black uppercase italic tracking-tighter text-white">{order.product_name}</h5>
                                            <p className="text-[11px] text-white/30 uppercase font-black tracking-[0.2em]">FEDEX: {order.tracking_id || 'PENDING ASSIGNMENT'}</p>
                                        </div>
                                        <div className="px-6 py-3 bg-white/5 rounded-2xl border border-white/10 text-center">
                                            <p className="text-[9px] text-white/40 uppercase font-black tracking-widest mb-1">Status</p>
                                            <p className="text-[10px] font-black uppercase text-accent-green italic">{order.delivery_status || 'PROCESSING'}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === 'billing' && (
                        <div className="space-y-3 animate-in slide-in-from-bottom-4">
                            {billing.length === 0 ? (
                                <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-3xl text-white/20 uppercase font-black tracking-widest text-[10px]">No transaction history recorded.</div>
                            ) : (
                                billing.map(item => (
                                    <div key={item.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center justify-between group hover:bg-white/[0.08] transition-all">
                                        <div className="flex items-center gap-6">
                                            <div className="w-10 h-10 bg-accent-green/10 rounded-xl flex items-center justify-center text-accent-green">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                                            </div>
                                            <div>
                                                <h6 className="text-[11px] font-black uppercase text-white tracking-widest leading-none mb-1.5">{item.description || 'Service Charge'}</h6>
                                                <p className="text-[9px] text-white/40 uppercase font-black tracking-widest">{new Date(item.created_at).toLocaleDateString()} • {String(item.id).substring(0, 8)}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-black text-white">${(item.amount / 100).toFixed(2)}</p>
                                            <p className="text-[8px] font-black uppercase text-accent-green italic">Confirmed</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === 'dosage' && (
                        <div className="space-y-4 animate-in slide-in-from-bottom-4">
                            {submissions.filter(s => s.type === 'dosage_change' || s.submission_type === 'dosage_change').length === 0 ? (
                                <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-3xl">
                                    <h5 className="text-[11px] font-black uppercase tracking-[0.3em] text-white/40 mb-2">No Dosage Requests</h5>
                                    <p className="text-[9px] text-white/10 uppercase font-black tracking-widest leading-loose">No active or historical requests for protocol<br />adjustments found in clinical records.</p>
                                </div>
                            ) : (
                                submissions.filter(s => s.type === 'dosage_change' || s.submission_type === 'dosage_change').map(req => (
                                    <div key={req.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <h6 className="text-sm font-black uppercase text-white tracking-widest">Dosage Adjustment Request</h6>
                                                <span className="text-[8px] px-2 py-0.5 bg-accent-green/10 text-accent-green rounded-full font-black uppercase">Pending Review</span>
                                            </div>
                                            <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">Requested on {new Date(req.created_at).toLocaleDateString()}</p>
                                        </div>
                                        <button className="px-6 py-2 bg-accent-green/10 border border-accent-green/20 rounded-xl text-[9px] font-black uppercase text-accent-green hover:bg-accent-green transition-all hover:text-black">
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
                                <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-3xl text-white/20 uppercase font-black tracking-widest text-[10px]">No survey responses found.</div>
                            ) : (
                                questionnaires.map(q => (
                                    <div key={q.id} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h6 className="text-xs font-black uppercase text-white tracking-widest mb-1">{q.survey_name || 'Patient Feedback'}</h6>
                                                <p className="text-[9px] text-white/40 uppercase font-black tracking-widest">{new Date(q.created_at).toLocaleDateString()}</p>
                                            </div>
                                            <span className="text-[8px] px-2 py-1 bg-accent-green/10 text-accent-green rounded-full font-black uppercase">Captured</span>
                                        </div>
                                        <p className="text-xs text-white/60 leading-relaxed line-clamp-2 italic">{q.response_summary || 'View full response in clinical history...'}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-6 md:p-8 border-t border-white/5 bg-[#050505] flex items-center justify-end">
                    <button onClick={handleClose} className="md:hidden px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/10 transition-all">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

const DossierRow = ({ label, value, isCode }) => (
    <div className="flex items-baseline justify-between py-4 border-b border-white/5">
        <span className="text-[10px] text-white/20 uppercase font-black tracking-widest shrink-0">{label}</span>
        <span className={`text-xs font-bold text-white/80 text-right ${isCode ? 'font-mono uppercase tracking-tighter bg-white/5 px-2 py-1 rounded' : 'italic'}`}>
            {value}
        </span>
    </div>
);

const DossierStat = ({ label, value }) => (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
        <p className="text-[8px] text-white/20 uppercase font-black tracking-widest mb-1">{label}</p>
        <p className="text-[11px] font-black text-white italic truncate">{value}</p>
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
            alert('Please enter provider name');
            return;
        }

        setGenerating(true);
        try {
            const today = new Date().toISOString().split('T')[0];

            // Build allergies string from submission
            const allergies = submission.allergies ||
                (submission.medical_responses?.allergies) ||
                'None reported';

            const payload = {
                userId: submission.id,
                answers: {
                    "First Name": submission.shipping_first_name || '',
                    "Last Name": submission.shipping_last_name || '',
                    "Email": submission.email || submission.shipping_email || '',
                    "Sex": submission.sex || 'N/A',
                    "Date of Birth": submission.birthday || 'N/A',
                    "State": submission.state || submission.shipping_state || 'N/A',
                    "Height (feet)": submission.height_feet || '0',
                    "Height (inches)": submission.height_inches || '0',
                    "Weight (lbs)": submission.weight || '0',
                    "BMI": submission.bmi || '0',
                    "Health Goals": submission.health_goals || 'N/A',
                    "Selected Medication": submission.medication_preference || 'N/A',
                    "Diabetes Status": submission.diabetes_status || 'N/A',
                    "Allergies": allergies,
                    "Current Medications": submission.current_medications || 'None'
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
                <div className="p-8 border-b border-white/5 flex items-center justify-between bg-[#080808] shrink-0">
                    <div>
                        <h3 className="text-2xl font-black uppercase italic tracking-tighter leading-none mb-1">
                            Generate <span className="text-accent-green">Provider Report</span>
                        </h3>
                        <p className="text-[10px] text-white/40 uppercase font-black tracking-[0.2em]">
                            Enter lab test results for {submission.shipping_first_name} {submission.shipping_last_name}
                        </p>
                    </div>
                    <button onClick={onClose} className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all text-white/40 hover:text-white">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8">

                    {/* Provider Information */}
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                        <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-accent-green mb-6">Provider Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">First Name</label>
                                <input
                                    type="text"
                                    value={reportData.provider_first_name}
                                    onChange={(e) => handleChange('provider_first_name', e.target.value)}
                                    placeholder="John"
                                    className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent-green"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Last Name</label>
                                <input
                                    type="text"
                                    value={reportData.provider_last_name}
                                    onChange={(e) => handleChange('provider_last_name', e.target.value)}
                                    placeholder="Smith"
                                    className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent-green"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Provider Type</label>
                                <select
                                    value={reportData.provider_type}
                                    onChange={(e) => handleChange('provider_type', e.target.value)}
                                    className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent-green"
                                >
                                    <option value="MD" className="bg-[#0A0A0A]">MD</option>
                                    <option value="DO" className="bg-[#0A0A0A]">DO</option>
                                    <option value="NP" className="bg-[#0A0A0A]">NP</option>
                                    <option value="PA" className="bg-[#0A0A0A]">PA</option>
                                    <option value="nurse_practitioner" className="bg-[#0A0A0A]">Nurse Practitioner</option>
                                    <option value="physician_assistant" className="bg-[#0A0A0A]">Physician Assistant</option>
                                    <option value="back_office" className="bg-[#0A0A0A]">Back Office</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Lab Results */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Lipid Panel */}
                        <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                            <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-accent-green mb-6">Lipid Panel</h4>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Total Cholesterol (mg/dL)</label>
                                    <input type="number" value={reportData.total_cholesterol} onChange={(e) => handleChange('total_cholesterol', e.target.value)} placeholder="0" className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent-green" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">LDL</label>
                                        <input type="number" value={reportData.ldl} onChange={(e) => handleChange('ldl', e.target.value)} placeholder="0" className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent-green" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">HDL</label>
                                        <input type="number" value={reportData.hdl} onChange={(e) => handleChange('hdl', e.target.value)} placeholder="0" className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent-green" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Triglycerides (mg/dL)</label>
                                    <input type="number" value={reportData.triglycerides} onChange={(e) => handleChange('triglycerides', e.target.value)} placeholder="0" className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent-green" />
                                </div>
                            </div>
                        </div>

                        {/* A1C & Notes */}
                        <div className="space-y-6">
                            <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                                <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-accent-green mb-6">A1C Test</h4>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">A1C Value (%)</label>
                                    <input type="number" step="0.1" value={reportData.a1c_value} onChange={(e) => handleChange('a1c_value', e.target.value)} placeholder="0" className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent-green" />
                                </div>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                                <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-accent-green mb-4">Internal Notes</h4>
                                <textarea
                                    value={reportData.notes}
                                    onChange={(e) => handleChange('notes', e.target.value)}
                                    placeholder="Provider comments..."
                                    rows={3}
                                    className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent-green resize-none"
                                />
                            </div>
                        </div>
                    </div>

                </div>


                {/* Footer Actions */}
                <div className="p-6 border-t border-white/5 flex gap-4 bg-[#050505] shrink-0">
                    <button
                        onClick={onClose}
                        className="flex-1 py-5 border border-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-white/5 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleGenerateReport}
                        disabled={generating}
                        className="flex-[2] py-5 bg-accent-green text-black rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-white hover:shadow-[0_0_60px_rgba(191,255,0,0.4)] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
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
    const [price, setPrice] = useState('299');
    const [coupon, setCoupon] = useState('');
    const [product, setProduct] = useState('');
    const [charging, setCharging] = useState(false);

    // Provider & Status State
    const [orderData, setOrderData] = useState({
        provider_first_name: 'John',
        provider_last_name: 'Smith',
        provider_type: 'MD',
        delivery_status: 'Not Delivered'
    });

    const handleDataChange = (field, value) => {
        setOrderData(prev => ({ ...prev, [field]: value }));
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
            alert('Please select a product');
            return;
        }

        const selectedProductLabel = document.querySelector(`select option[value="${product}"]`)?.textContent || product;
        const chargePriceCents = Math.round(parseFloat(price) * 100);
        const basePriceCents = 29900; // Sample real_price from curl

        const patientId = submission.user_id;

        if (!patientId) {
            alert('Error: This submission is not linked to a User ID. Cannot process charge.');
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
            product_name: `GLP-GLOW ${selectedProductLabel}`,
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
                alert('Payment captured successfully!');
                await onApprove();
                onClose();
            } else {
                // The function returned 200 but the logic failed (e.g. Stripe declined)
                throw new Error(data?.error || data?.message || 'Payment was not successful.');
            }
        } catch (error) {
            console.error('Charge process failed:', error);
            alert(`Charge Failed: ${error.message}`);
        } finally {
            setCharging(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="w-full max-w-lg bg-[#0A0A0A] border border-white/10 rounded-[40px] overflow-hidden flex flex-col shadow-2xl border-glow border-accent-green/20">
                {/* Header */}
                <div className="p-8 border-b border-white/5 bg-[#080808]">
                    <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">Create <span className="text-accent-green">Order</span></h3>
                    <p className="text-[10px] text-white/40 uppercase font-black tracking-widest mt-1">
                        Fill in the order details for <span className="text-white">{submission.shipping_first_name} {submission.shipping_last_name}</span>
                    </p>
                </div>

                {/* Content */}
                <div className="p-8 space-y-6 flex-1 overflow-y-auto max-h-[60vh] no-scrollbar">
                    {/* Product Selection */}
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Product Name</label>
                        <select
                            value={product}
                            onChange={(e) => setProduct(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent-green cursor-pointer"
                        >
                            <option value="">Select a product</option>

                            {(() => {
                                // Helper to determine category
                                const cat = (submission.selected_drug || '').toLowerCase();

                                // Weight Loss Products
                                if (cat.includes('semaglutide') || cat.includes('tirzepatide') || cat.includes('weight')) {
                                    return (
                                        <>
                                            <option value="semaglutide-injection" className="bg-[#0A0A0A]">Semaglutide Injection</option>
                                            <option value="tirzepatide-injection" className="bg-[#0A0A0A]">Tirzepatide Injection</option>
                                            <option value="semaglutide-lozenges" className="bg-[#0A0A0A]">Semaglutide Lozenges</option>
                                        </>
                                    );
                                }
                                // Sexual Health
                                if (cat.includes('sildenafil') || cat.includes('tadalafil') || cat.includes('oxytocin') || cat.includes('pt-141') || cat.includes('sexual')) {
                                    return (
                                        <>
                                            <option value="sildenafil-tadalafil-troche" className="bg-[#0A0A0A]">Sildenafil / Tadalafil Troche</option>
                                            <option value="sildenafil-yohimbe-troche" className="bg-[#0A0A0A]">Sildenafil / Yohimbe Troche</option>
                                            <option value="tadalafil-yohimbe-troche" className="bg-[#0A0A0A]">Tadalafil / Yohimbe Troche</option>
                                            <option value="sildenafil-tadalafil-tablets" className="bg-[#0A0A0A]">Sildenafil / Tadalafil Tablets</option>
                                            <option value="sildenafil-tablets" className="bg-[#0A0A0A]">Sildenafil Tablets</option>
                                            <option value="tadalafil-tablets" className="bg-[#0A0A0A]">Tadalafil Tablets</option>
                                            <option value="oxytocin-troche" className="bg-[#0A0A0A]">Oxytocin Troche</option>
                                            <option value="oxytocin-nasal-spray" className="bg-[#0A0A0A]">Oxytocin Nasal Spray</option>
                                            <option value="pt-141-nasal-spray" className="bg-[#0A0A0A]">PT-141 Nasal Spray</option>
                                            <option value="pt-141-injection" className="bg-[#0A0A0A]">PT-141 Injection</option>
                                            <option value="scream-cream-gel" className="bg-[#0A0A0A]">Scream Cream Gel</option>
                                        </>
                                    );
                                }
                                // Hair Restoration
                                if (cat.includes('finasteride') || cat.includes('minoxidil') || cat.includes('hair')) {
                                    return (
                                        <>
                                            <option value="minoxidil-finasteride-solution" className="bg-[#0A0A0A]">Minoxidil 5-10% / Finasteride 0.1% Solution</option>
                                            <option value="minoxidil-solution" className="bg-[#0A0A0A]">Minoxidil 5-10% Solution</option>
                                            <option value="finasteride-minoxidil-shampoo" className="bg-[#0A0A0A]">Finasteride / Minoxidil Shampoo</option>
                                            <option value="tretinoin-minoxidil-solution" className="bg-[#0A0A0A]">Tretinoin / Minoxidil Solution</option>
                                            <option value="latanoprost-solution" className="bg-[#0A0A0A]">Latanoprost Solution (Eyelash)</option>
                                            <option value="finasteride-capsules" className="bg-[#0A0A0A]">Finasteride Capsules</option>
                                            <option value="dutasteride-capsules" className="bg-[#0A0A0A]">Dutasteride Capsules</option>
                                            <option value="oral-minoxidil" className="bg-[#0A0A0A]">Oral Minoxidil</option>
                                            <option value="spironolactone-capsules" className="bg-[#0A0A0A]">Spironolactone Capsules</option>
                                        </>
                                    );
                                }
                                // Longevity
                                if (cat.includes('nad') || cat.includes('glutathione') || cat.includes('sermorelin') || cat.includes('longevity')) {
                                    return (
                                        <>
                                            <option value="nad-injection" className="bg-[#0A0A0A]">NAD+ Injection</option>
                                            <option value="nad-nasal-spray" className="bg-[#0A0A0A]">NAD+ Nasal Spray</option>
                                            <option value="glutathione-injection" className="bg-[#0A0A0A]">Glutathione Injection</option>
                                            <option value="lipo-c-injection" className="bg-[#0A0A0A]">Lipo-C Injection</option>
                                            <option value="b12-injection" className="bg-[#0A0A0A]">B12 Injection (Methylcobalamin)</option>
                                            <option value="sermorelin-injection" className="bg-[#0A0A0A]">Sermorelin Injection</option>
                                            <option value="sermorelin-glycine-injection" className="bg-[#0A0A0A]">Sermorelin / Glycine Injection</option>
                                        </>
                                    );
                                }

                                // Fallback / Unknown Category
                                return (
                                    <>
                                        <option value="semaglutide-injection" className="bg-[#0A0A0A]">Semaglutide Injection</option>
                                        <option value="tirzepatide-injection" className="bg-[#0A0A0A]">Tirzepatide Injection</option>
                                    </>
                                );
                            })()}
                        </select>
                    </div>

                    {/* Price */}
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Price ($)</label>
                        <input
                            type="text"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent-green"
                        />
                    </div>

                    {/* Shipping Address */}
                    <div className="p-5 bg-white/5 rounded-3xl border border-white/5">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-white/20 mb-3">Shipping Address</label>
                        <p className="text-[11px] text-white/70 font-bold uppercase tracking-widest leading-relaxed">
                            {submission.shipping_first_name} {submission.shipping_last_name}<br />
                            {address}
                        </p>
                    </div>

                    {/* Coupon */}
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Apply Coupon Code</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Enter coupon code"
                                value={coupon}
                                onChange={(e) => setCoupon(e.target.value)}
                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent-green"
                            />
                            <button className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all border border-white/5">Apply</button>
                        </div>
                    </div>

                    {/* Provider Information Section */}
                    <div className="pt-4 border-t border-white/5">
                        <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-accent-green/60 mb-6">Provider Information</label>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">First Name</label>
                                <input
                                    type="text"
                                    value={orderData.provider_first_name}
                                    onChange={(e) => handleDataChange('provider_first_name', e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent-green"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Last Name</label>
                                <input
                                    type="text"
                                    value={orderData.provider_last_name}
                                    onChange={(e) => handleDataChange('provider_last_name', e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent-green"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Provider Type</label>
                                <input
                                    type="text"
                                    value={orderData.provider_type}
                                    onChange={(e) => handleDataChange('provider_type', e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent-green"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Delivery Status</label>
                                <select
                                    value={orderData.delivery_status}
                                    onChange={(e) => handleDataChange('delivery_status', e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-widest text-accent-green focus:outline-none focus:border-accent-green cursor-pointer"
                                >
                                    <option value="Not Delivered" className="bg-[#0A0A0A]">Not Delivered</option>
                                    <option value="Packaging" className="bg-[#0A0A0A]">Packaging</option>
                                    <option value="Shipped" className="bg-[#0A0A0A]">Shipped</option>
                                    <option value="Delivered" className="bg-[#0A0A0A]">Delivered</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-8 border-t border-white/5 bg-[#050505] flex gap-4 shrink-0">
                    <button
                        onClick={onClose}
                        className="flex-1 py-5 border border-white/10 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white/5 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCharge}
                        disabled={charging}
                        className="flex-[2] py-5 bg-accent-green text-black rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white hover:shadow-[0_0_40px_rgba(191,255,0,0.4)] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
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
    <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-accent-green mb-6 mt-12 bg-accent-green/5 py-3 px-6 rounded-lg inline-block whitespace-nowrap">{title}</h4>
);

const InfoRow = ({ label, value, isFile, field, type = 'text', options = [], isEditing, formData, onChange }) => (
    <div className="flex flex-col md:flex-row md:items-center justify-between py-4 border-b border-white/5 group hover:bg-white/[0.02] px-4 transition-all duration-300">
        <span className="text-[10px] text-white/30 uppercase font-black tracking-widest leading-none shrink-0 md:w-1/3">{label}</span>
        <div className="flex-1 md:text-right">
            {isEditing && field && !isFile ? (
                type === 'select' ? (
                    <select
                        value={formData[field] || ''}
                        onChange={(e) => onChange(field, e.target.value)}
                        className="bg-white/10 border border-white/10 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-accent-green w-full md:w-auto"
                    >
                        <option value="">Select...</option>
                        {options.map((opt, i) => {
                            const optValue = typeof opt === 'object' ? opt.value : opt;
                            const optLabel = typeof opt === 'object' ? opt.label : opt;
                            return (
                                <option key={i} value={optValue} className="bg-[#0A0A0A]">{optLabel}</option>
                            );
                        })}
                    </select>
                ) : (
                    <input
                        type={type}
                        value={formData[field] || ''}
                        onChange={(e) => onChange(field, e.target.value)}
                        onBlur={(e) => onChange(field, e.target.value)} // Ensure value is committed on blur
                        className="bg-white/10 border border-white/10 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-accent-green w-full md:w-auto text-right"
                    />
                )
            ) : isFile ? (
                <div className="flex flex-wrap gap-2 mt-2 md:mt-0 justify-end">
                    {Array.isArray(value) ? (
                        value.map((url, i) => (
                            <a key={i} href={url} target="_blank" rel="noreferrer" className="px-4 py-2 bg-accent-green/10 text-accent-green border border-accent-green/20 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-accent-green hover:text-black transition-all">
                                View {value.length > 1 ? `Doc ${i + 1}` : 'Document'}
                            </a>
                        ))
                    ) : (
                        <a href={value} target="_blank" rel="noreferrer" className="px-4 py-2 bg-accent-green/10 text-accent-green border border-accent-green/20 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-accent-green hover:text-black transition-all">
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
    const [hasPaymentMethod, setHasPaymentMethod] = useState(true); // Default to true to avoid flash, or check immediately

    // Check for payment method on load
    useEffect(() => {
        const checkPaymentMethod = async () => {
            if (!submission?.user_id) return;
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('stripe_customer_id')
                    .eq('id', submission.user_id)
                    .single();

                if (data && data.stripe_customer_id) {
                    setHasPaymentMethod(true);
                } else {
                    setHasPaymentMethod(false);
                }
            } catch (err) {
                console.error('Error checking payment status:', err);
                // Fallback: assume true or handle error? 
                // Better safe: assume false if we can't verify, or true to not block if DB error.
                // Assuming false to be strict based on user request.
                setHasPaymentMethod(false);
            }
        };
        checkPaymentMethod();
    }, [submission]);

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
            }

            // 3. If rejected, send email notification
            if (status === 'rejected') {
                console.log('Submission rejected. Sending notification email...');
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
                birthday: formData.birthday,
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
                <div className="w-full max-w-5xl 2xl:max-w-7xl 3xl:max-w-[90vw] max-h-[92vh] bg-[#0A0A0A] border border-white/10 rounded-[40px] shadow-2xl overflow-hidden flex flex-col border-glow border-accent-green/20">
                    {/* Header */}
                    <div className="p-8 md:p-10 border-b border-white/5 flex items-center justify-between bg-[#080808] shrink-0">
                        <div>
                            <div className="flex items-center gap-4 mb-2">
                                <h3 className="text-3xl font-black uppercase italic tracking-tighter leading-none">Submission <span className="text-accent-green">Dossier</span></h3>
                                <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[8px] font-black text-white/40 uppercase tracking-widest">{String(submission.id).substring(0, 8)}</span>
                            </div>
                            <p className="text-[10px] text-white/40 uppercase font-black tracking-[0.2em]">Complete Clinical Intelligence for <span className="text-white">{formData.shipping_first_name} {formData.shipping_last_name}</span></p>
                        </div>
                        <div className="flex items-center gap-4">
                            {!isEditing ? (
                                <>
                                    {formData.provider_note_report ? (
                                        <div className="flex gap-2">
                                            <a
                                                href={formData.provider_note_report}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="px-6 py-2 bg-accent-green/10 border border-accent-green/30 rounded-xl text-[10px] font-black uppercase tracking-widest text-accent-green hover:bg-accent-green hover:text-black transition-all flex items-center gap-2"
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                                                View Report
                                            </a>
                                            <button
                                                onClick={() => setShowReportModal(true)}
                                                className="px-6 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2"
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
                                        className="px-6 py-2 bg-accent-green border border-accent-green rounded-xl text-[10px] font-black uppercase tracking-widest text-black hover:bg-white hover:text-black transition-all shadow-[0_0_20px_rgba(191,255,0,0.3)]"
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
                                        className="px-6 py-2 bg-accent-green rounded-xl text-[10px] font-black uppercase tracking-widest text-black hover:bg-white transition-all disabled:opacity-50"
                                    >
                                        {processing ? 'Saving...' : 'Save'}
                                    </button>
                                </div>
                            )}
                            <button onClick={onClose} className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all text-white/40 hover:text-white group">
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
                                    <InfoRow label="Sex" field="sex" value={formData.sex} type="select" options={['male', 'female', 'other']} isEditing={isEditing} formData={formData} onChange={handleChange} />
                                    <InfoRow label="Date of Birth" field="birthday" value={formData.birthday} type="date" isEditing={isEditing} formData={formData} onChange={handleChange} />
                                    <InfoRow label="State" field="shipping_state" value={formData.shipping_state} isEditing={isEditing} formData={formData} onChange={handleChange} />
                                    <InfoRow label="Race/Ethnicity" field="race_ethnicity" value={formData.race_ethnicity || intake.ethnicity || 'Not specified'} isEditing={isEditing} formData={formData} onChange={handleChange} />
                                </div>

                                {/* Physical Measurements */}
                                <SectionHeader title="Physical Measurements" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
                                    {isEditing ? (
                                        <div className="flex flex-col md:flex-row md:items-center justify-between py-4 border-b border-white/5 px-4">
                                            <span className="text-[10px] text-white/30 uppercase font-black tracking-widest leading-none shrink-0 md:w-1/3">Height</span>
                                            <div className="flex gap-2 justify-end flex-1">
                                                <input
                                                    type="number"
                                                    placeholder="Ft"
                                                    value={formData.height_feet || ''}
                                                    onChange={(e) => handleChange('height_feet', e.target.value)}
                                                    className="w-16 bg-white/10 border border-white/10 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-accent-green text-right"
                                                />
                                                <input
                                                    type="number"
                                                    placeholder="In"
                                                    value={formData.height_inches || ''}
                                                    onChange={(e) => handleChange('height_inches', e.target.value)}
                                                    className="w-16 bg-white/10 border border-white/10 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-accent-green text-right"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <InfoRow label="Height" value={
                                            formData.height_feet && formData.height_inches
                                                ? `${formData.height_feet}'${formData.height_inches}"`
                                                : (intake.height || 'N/A')
                                        } isEditing={isEditing} formData={formData} onChange={handleChange} />
                                    )}

                                    <InfoRow label="Weight (lbs)" field="weight" value={formData.weight || intake.weight || 'N/A'} type="number" isEditing={isEditing} formData={formData} onChange={handleChange} />

                                    <div className="md:col-span-2 mt-4">
                                        <div className="flex items-center justify-between p-8 bg-accent-green/[0.03] border border-accent-green/10 rounded-[32px]">
                                            <div>
                                                <p className="text-[10px] text-accent-green uppercase font-black tracking-widest mb-1">Advanced Metric</p>
                                                <h5 className="text-sm font-black uppercase text-white/80">Body Mass Index (BMI)</h5>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-4xl font-black italic tracking-tighter text-accent-green leading-none mb-1">
                                                    {/* Recalculate BMI if editing */}
                                                    {(() => {
                                                        const h = (Number(formData.height_feet) * 12) + Number(formData.height_inches);
                                                        const w = Number(formData.weight);
                                                        if (h > 0 && w > 0) return ((w / (h * h)) * 703).toFixed(1);
                                                        return formData.bmi || 'N/A';
                                                    })()}
                                                </p>
                                                <p className="text-[8px] font-black uppercase tracking-widest text-accent-green/40">Clinical Grade</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Goals & Selection */}
                                <SectionHeader title="Goals & Drug Selection" />
                                <div className="space-y-4">
                                    <div className="p-8 bg-white/5 rounded-[32px] border border-white/5">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-4">Patient-Defined Objectives</p>
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
                                                { value: 'longevity', label: 'Longevity' }
                                            ]}
                                            isEditing={isEditing} formData={formData} onChange={handleChange}
                                        />
                                        <InfoRow label="Selected Medication" field="dosage_preference" value={formData.dosage_preference || intake.dosage_preference || 'Standard'} isEditing={isEditing} formData={formData} onChange={handleChange} />
                                        <InfoRow label="Other Health Goals" field="other_health_goals" value={formData.other_health_goals || intake.other_goals || 'None'} isEditing={isEditing} formData={formData} onChange={handleChange} />
                                    </div>
                                </div>

                                {/* Comprehensive Clinical Assessment */}
                                <SectionHeader title="Comprehensive Clinical Assessment" />
                                <div className="space-y-8 mt-6">

                                    {/* Digital Prescription */}
                                    {formData.prescription_pdf_url && (
                                        <div className="flex flex-col gap-2 border-b border-white/5 pb-6">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">
                                                Digital Prescription
                                            </p>
                                            <div>
                                                <a
                                                    href={formData.prescription_pdf_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-sm font-bold text-accent-green hover:underline break-all"
                                                >
                                                    Prescription PDF: {formData.prescription_pdf_url}
                                                </a>
                                            </div>
                                        </div>
                                    )}

                                    {/* Manual entry for Eligibility Check */}
                                    {formData.seen_pcp && (
                                        <div className="flex flex-col gap-2 border-b border-white/5 pb-6">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">
                                                Have you seen a primary care physician in the last 6 months?
                                            </p>
                                            {isEditing ? (
                                                <select
                                                    value={formData.seen_pcp}
                                                    onChange={(e) => handleChange('seen_pcp', e.target.value)}
                                                    className="bg-white/10 border border-white/10 rounded px-2 py-2 text-sm text-white focus:outline-none focus:border-accent-green w-full"
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

                                    {/* Lab Results */}
                                    {formData.lab_results_url && formData.lab_results_url.length > 0 && (
                                        <div className="flex flex-col gap-2 border-b border-white/5 pb-6">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">
                                                Recent Lab Results
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {(Array.isArray(formData.lab_results_url) ? formData.lab_results_url : [formData.lab_results_url]).map((url, i) => (
                                                    <a key={i} href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-accent-green/10 border border-accent-green/20 rounded-lg text-[10px] font-black uppercase tracking-widest text-accent-green hover:bg-accent-green hover:text-black transition-all">
                                                        View Lab Report {i + 1}
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Dynamic Question Loop */}
                                    {(() => {
                                        const categoryId = formData.selected_drug || 'weight-loss';
                                        const questions = intakeQuestions[categoryId] || intakeQuestions['weight-loss'];
                                        const answers = formData.medical_responses || formData.intake_data || {};

                                        return questions.map((q) => {
                                            if (q.type === 'info') return null;

                                            let answer = answers[q.id];

                                            // Fallback for top-level keys if not in medical_responses
                                            if (answer === undefined && formData[q.id]) answer = formData[q.id];

                                            if ((answer === undefined || answer === null || answer === '') && !isEditing) return null;

                                            return (
                                                <div key={q.id} className="flex flex-col gap-2 border-b border-white/5 pb-6 last:border-0">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">{q.question}</p>
                                                    {isEditing ? (
                                                        q.type === 'select' || q.type === 'boolean' || (q.options?.length > 0) ? (
                                                            <select
                                                                value={answer || ''}
                                                                onChange={(e) => handleIntakeChange(q.id, e.target.value)}
                                                                className="bg-white/10 border border-white/10 rounded px-2 py-2 text-sm text-white focus:outline-none focus:border-accent-green w-full"
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
                                                                className="bg-white/10 border border-white/10 rounded px-2 py-2 text-sm text-white focus:outline-none focus:border-accent-green w-full h-24"
                                                            />
                                                        )
                                                    ) : (
                                                        <div className="text-sm font-bold text-white/90 leading-relaxed">
                                                            {Array.isArray(answer) ? (
                                                                <ul className="list-disc list-inside space-y-1 marker:text-accent-green">
                                                                    {answer.map((item, i) => <li key={i}>{item}</li>)}
                                                                </ul>
                                                            ) : (
                                                                answer?.toString()
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Edit details if applicable */}
                                                    {(q.details || answers[`${q.id}_details`]) && (
                                                        <div className="mt-3 pl-4 border-l-2 border-accent-green/30">
                                                            <p className="text-[9px] text-accent-green font-bold uppercase tracking-wider mb-1">Details:</p>
                                                            {isEditing ? (
                                                                <textarea
                                                                    value={answers[`${q.id}_details`] || ''}
                                                                    onChange={(e) => handleIntakeChange(`${q.id}_details`, e.target.value)}
                                                                    className="bg-white/10 border border-white/10 rounded px-2 py-2 text-sm text-white focus:outline-none focus:border-accent-green w-full"
                                                                />
                                                            ) : (
                                                                <p className="text-sm text-white/80">{answers[`${q.id}_details`]}</p>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Files (e.g. current_meds upload) */}
                                                    {q.upload && (answers[`${q.id}_file`] || formData.glp1_prescription_url) && (
                                                        <div className="mt-3">
                                                            <a href={answers[`${q.id}_file`] || (Array.isArray(formData.glp1_prescription_url) ? formData.glp1_prescription_url[0] : formData.glp1_prescription_url)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-accent-green/10 border border-accent-green/20 rounded-lg text-[10px] font-black uppercase tracking-widest text-accent-green hover:bg-accent-green hover:text-black transition-all">
                                                                View Document
                                                            </a>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>

                                {/* Identification */}
                                <SectionHeader title="Security & Verification" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
                                    <InfoRow label="ID Type" field="identification_type" value={formData.identification_type || 'License'} isEditing={isEditing} formData={formData} onChange={handleChange} />
                                    <InfoRow label="ID Number" field="identification_number" value={formData.identification_number || '••••••••'} isEditing={isEditing} formData={formData} onChange={handleChange} />
                                    <InfoRow label="Identification Document" value={formData.identification_url} isFile={!!formData.identification_url} isEditing={isEditing} formData={formData} onChange={handleChange} />
                                </div>

                                {/* Shipping & Logistics */}
                                <SectionHeader title="Shipping & Logistics" />
                                <div className="p-10 bg-white/5 rounded-[40px] border border-white/5">
                                    <div className="flex items-start gap-8">
                                        <div className="w-16 h-16 bg-accent-green/10 rounded-3xl flex items-center justify-center border border-accent-green/20 shrink-0">
                                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#bfff00" strokeWidth="2"><path d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                                        </div>
                                        {isEditing ? (
                                            <div className="flex-1 grid grid-cols-1 gap-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <input type="text" placeholder="First Name" value={formData.shipping_first_name || ''} onChange={(e) => handleChange('shipping_first_name', e.target.value)} className="bg-white/10 border border-white/10 rounded px-3 py-2 text-sm text-white" />
                                                    <input type="text" placeholder="Last Name" value={formData.shipping_last_name || ''} onChange={(e) => handleChange('shipping_last_name', e.target.value)} className="bg-white/10 border border-white/10 rounded px-3 py-2 text-sm text-white" />
                                                </div>
                                                <input type="text" placeholder="Address" value={formData.shipping_street || formData.shipping_address || ''} onChange={(e) => handleChange('shipping_address', e.target.value)} className="bg-white/10 border border-white/10 rounded px-3 py-2 text-sm text-white" />
                                                <div className="grid grid-cols-3 gap-4">
                                                    <input type="text" placeholder="City" value={formData.shipping_city || ''} onChange={(e) => handleChange('shipping_city', e.target.value)} className="bg-white/10 border border-white/10 rounded px-3 py-2 text-sm text-white" />
                                                    <input type="text" placeholder="State" value={formData.shipping_state || ''} onChange={(e) => handleChange('shipping_state', e.target.value)} className="bg-white/10 border border-white/10 rounded px-3 py-2 text-sm text-white" />
                                                    <input type="text" placeholder="Zip" value={formData.shipping_zip || ''} onChange={(e) => handleChange('shipping_zip', e.target.value)} className="bg-white/10 border border-white/10 rounded px-3 py-2 text-sm text-white" />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <input type="text" placeholder="Phone" value={formData.shipping_phone || ''} onChange={(e) => handleChange('shipping_phone', e.target.value)} className="bg-white/10 border border-white/10 rounded px-3 py-2 text-sm text-white" />
                                                    <input type="text" placeholder="Email" value={formData.shipping_email || ''} onChange={(e) => handleChange('shipping_email', e.target.value)} className="bg-white/10 border border-white/10 rounded px-3 py-2 text-sm text-white" />
                                                </div>
                                            </div>
                                        ) : (
                                            <div>
                                                <h5 className="text-xl font-black uppercase italic tracking-tighter mb-2">{formData.shipping_first_name} {formData.shipping_last_name}</h5>
                                                <p className="text-[11px] text-white/70 leading-[1.8] font-bold uppercase tracking-widest">
                                                    {formData.shipping_street || formData.shipping_address}<br />
                                                    {formData.shipping_city}, {formData.shipping_state} {formData.shipping_zip}<br />
                                                    <span className="text-accent-green">PH: {formData.shipping_phone}</span><br />
                                                    <span className="text-white/40">{formData.shipping_email}</span>
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
                    <div className="p-10 border-t border-white/5 bg-[#050505] shrink-0">
                        {!hasPaymentMethod && submission.approval_status === 'pending' && (
                            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
                                <p className="text-red-500 text-[10px] font-black uppercase tracking-widest">
                                    ⚠️ Action Required: User has not added a payment method
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
                                        className="flex-[2] py-7 bg-accent-green text-black rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-white hover:shadow-[0_0_60px_rgba(191,255,0,0.4)] transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                                    >
                                        {processing ? 'Clinical Verification...' : 'Verify & Approve Submission'}
                                    </button>
                                </>
                            ) : (
                                <div className="w-full flex items-center justify-between p-7 bg-white/5 rounded-[24px] border border-white/10">
                                    <div className="flex items-center gap-6">
                                        <div className={`w-4 h-4 rounded-full ${submission.approval_status === 'approved' ? 'bg-accent-green shadow-[0_0_20px_rgba(191,255,0,0.5)]' : 'bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]'}`}></div>
                                        <div>
                                            <p className="text-[10px] text-white/30 uppercase font-black tracking-widest mb-1">Regulatory decision finalized</p>
                                            <p className="text-xl font-black uppercase italic tracking-tighter leading-none">
                                                Clinical Status: <span className={submission.approval_status === 'approved' ? 'text-accent-green' : 'text-red-500'}>{submission.approval_status}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleUpdateStatus('pending')}
                                        disabled={processing || isEditing}
                                        className="px-10 py-5 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all"
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
        { id: 'longevity', name: 'Longevity', color: '#FF7E5F' }
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
                counts[item.selected_drug] = (counts[item.selected_drug] || 0) + 1;
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
            <div className="w-10 h-10 border-2 border-accent-green border-t-transparent animate-spin rounded-full"></div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Syncing Clinical Reservoir...</p>
        </div>
    );

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-3">
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
                            className={`px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border flex items-center gap-2 ${filter === cat.id
                                ? 'bg-white text-black border-white'
                                : 'bg-white/5 text-white/40 border-white/10 hover:border-white/20'
                                }`}
                        >
                            {cat.name}
                            {count > 0 && (
                                <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold ${filter === cat.id
                                    ? 'bg-black text-white'
                                    : 'bg-white/20 text-white'
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
                            ? 'bg-white text-black shadow-lg shadow-white/5'
                            : 'text-white/30 hover:text-white/60'
                            }`}
                    >
                        {status}
                    </button>
                ))}
            </div>

            <div className="space-y-4">
                {filteredQueue.length === 0 ? (
                    <div className="py-24 text-center border-2 border-dashed border-white/5 rounded-[40px] flex flex-col items-center">
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
                                <div className="flex items-center gap-6">
                                    <div
                                        className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl italic border border-white/10"
                                        style={{ color: catInfo.color, backgroundColor: `${catInfo.color}10` }}
                                    >
                                        {item.shipping_first_name?.charAt(0) || '?'}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <p className="text-lg font-black uppercase tracking-tighter italic">{item.shipping_first_name} {item.shipping_last_name}</p>
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
                                        <div className="flex items-center gap-4 text-[10px] text-white/40 uppercase font-black tracking-widest">
                                            <span>Received {new Date(item.submitted_at).toLocaleDateString()}</span>
                                            <span className="w-1 h-1 bg-white/10 rounded-full"></span>
                                            <span>{item.shipping_state}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => setReviewingSubmission(item)}
                                        className="px-8 py-5 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-accent-green hover:shadow-[0_0_40px_rgba(191,255,0,0.3)] transition-all"
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
        <div className="space-y-12 animate-in fade-in duration-700">
            {/* Create Coupon Card */}
            <div className="bg-white/5 border border-white/10 rounded-[40px] p-8 md:p-12 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 text-accent-green opacity-10 group-hover:opacity-20 transition-opacity">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                </div>

                <h3 className="text-2xl font-black uppercase tracking-tighter italic mb-8">Generate <span className="text-accent-green">Discount Token</span></h3>

                <form onSubmit={handleCreateCoupon} className="space-y-6 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-3 ml-2">Coupon Code</label>
                            <input
                                type="text"
                                value={newCoupon.code}
                                onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value })}
                                placeholder="GLOW50"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm focus:outline-none focus:border-accent-green transition-all"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-3 ml-2">Discount Value</label>
                            <input
                                type="number"
                                value={newCoupon.discount_value}
                                onChange={(e) => setNewCoupon({ ...newCoupon, discount_value: e.target.value })}
                                placeholder="25"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm focus:outline-none focus:border-accent-green transition-all"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-3 ml-2">Type</label>
                            <div className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm font-bold opacity-60 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-accent-green"></span>
                                Percent (%)
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-3 ml-2">Category</label>
                            <select
                                value={newCoupon.coupon_type}
                                onChange={(e) => setNewCoupon({ ...newCoupon, coupon_type: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm focus:outline-none focus:border-accent-green transition-all appearance-none"
                            >
                                <option value="eligibility" className="bg-[#0A0A0A]">Eligibility Fee</option>
                                <option value="product" className="bg-[#0A0A0A]">Product Discount</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-3 ml-2">Description</label>
                            <input
                                type="text"
                                value={newCoupon.description}
                                onChange={(e) => setNewCoupon({ ...newCoupon, description: e.target.value })}
                                placeholder="Summer campaign discount for weight loss eligibility"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm focus:outline-none focus:border-accent-green transition-all"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-3 ml-2">Expiration Date</label>
                            <input
                                type="date"
                                value={newCoupon.expiration_date}
                                onChange={(e) => setNewCoupon({ ...newCoupon, expiration_date: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm focus:outline-none focus:border-accent-green transition-all"
                                required
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={adding}
                            className="px-12 py-5 bg-accent-green text-black rounded-2xl font-black text-[12px] uppercase tracking-widest hover:bg-white transition-all shadow-[0_0_50px_rgba(191,255,0,0.2)]"
                        >
                            {adding ? 'Synchronizing Archive...' : 'Launch Promo Code →'}
                        </button>
                    </div>
                </form>
            </div>

            {/* List Table */}
            <div className="bg-[#0A0A0A] border border-white/10 rounded-[40px] overflow-hidden">
                <div className="p-8 border-b border-white/5 flex items-center justify-between">
                    <div>
                        <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">Active Coupons Reservoir</h4>
                        <p className="text-[9px] text-white/20 font-bold uppercase tracking-widest">Managing clinical and marketing incentives</p>
                    </div>
                    <span className="text-[10px] text-accent-green font-bold px-3 py-1 bg-accent-green/10 rounded-full">{coupons.length} TOKENS</span>
                </div>
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-white/5">
                            <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-white/40">Code / Description</th>
                            <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-white/40">Value</th>
                            <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-white/40">Expires</th>
                            <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-white/40 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {loading ? (
                            <tr><td colSpan="4" className="p-12 text-center text-xs text-white/20 uppercase font-black tracking-widest">Hydrating table...</td></tr>
                        ) : coupons.length === 0 ? (
                            <tr><td colSpan="4" className="p-12 text-center text-xs text-white/20 uppercase font-black tracking-widest">No promo codes generated</td></tr>
                        ) : (
                            coupons.map(coupon => (
                                <tr key={coupon.id} className="group hover:bg-white/[0.02] transition-colors">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3 mb-1">
                                            <div className="w-2 h-2 rounded-full bg-accent-green shadow-[0_0_10px_rgba(191,255,0,0.5)]"></div>
                                            <span className="text-sm font-black tracking-widest italic">{coupon.code}</span>
                                            <span className="text-[8px] font-black uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded text-white/40">{coupon.coupon_type}</span>
                                        </div>
                                        <p className="text-[10px] text-white/30 font-bold ml-5">{coupon.description}</p>
                                    </td>
                                    <td className="px-8 py-6 text-sm font-bold">
                                        {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `$${coupon.discount_value}`}
                                    </td>
                                    <td className="px-8 py-6 text-[10px] font-bold text-white/40 uppercase tracking-widest">
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
                    className={`p-8 rounded-[32px] border cursor-pointer transition-all relative overflow-hidden group ${activeTab === 'active' ? 'bg-accent-green/10 border-accent-green' : 'bg-white/5 border-white/10 hover:border-white/20'}`}
                >
                    <div className={`absolute -right-10 -top-10 w-32 h-32 blur-3xl transition-opacity opacity-0 group-hover:opacity-20 ${activeTab === 'active' ? 'bg-accent-green' : 'bg-white'}`}></div>
                    <div className="flex items-center gap-4 mb-6">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${activeTab === 'active' ? 'bg-accent-green text-black' : 'bg-white/10 text-white'}`}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${activeTab === 'active' ? 'text-accent-green' : 'text-white/40'}`}>Tracking Active</span>
                    </div>
                    <p className={`text-4xl font-black italic tracking-tighter ${activeTab === 'active' ? 'text-white' : 'text-white/60'}`}>{activeSubs.length}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mt-1">Active Subscriptions</p>
                </div>

                <div
                    onClick={() => setActiveTab('expired')}
                    className={`p-8 rounded-[32px] border cursor-pointer transition-all relative overflow-hidden group ${activeTab === 'expired' ? 'bg-red-500/10 border-red-500' : 'bg-white/5 border-white/10 hover:border-white/20'}`}
                >
                    <div className="absolute -right-10 -top-10 w-32 h-32 blur-3xl transition-opacity opacity-0 group-hover:opacity-20 bg-red-500"></div>
                    <div className="flex items-center gap-4 mb-6">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${activeTab === 'expired' ? 'bg-red-500 text-white' : 'bg-white/10 text-white'}`}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${activeTab === 'expired' ? 'text-red-500' : 'text-white/40'}`}>Tracking Churn</span>
                    </div>
                    <p className={`text-4xl font-black italic tracking-tighter ${activeTab === 'expired' ? 'text-white' : 'text-white/60'}`}>{expiredSubs.length}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mt-1">Expired / Cancelled</p>
                </div>
            </div>

            {/* List Table */}
            <div className="bg-[#0A0A0A] border border-white/10 rounded-[40px] overflow-hidden">
                <div className="p-8 border-b border-white/5 flex items-center justify-between">
                    <div>
                        <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">
                            {activeTab === 'active' ? 'Active Membership Roster' : 'Inactive / Expired Accounts'}
                        </h4>
                        <p className="text-[9px] text-white/20 font-bold uppercase tracking-widest">
                            {activeTab === 'active' ? 'Revenue generating accounts' : 'Historical subscription data'}
                        </p>
                    </div>
                    {/* Pagination Summary */}
                    <div className="text-[9px] text-white/40 font-black uppercase tracking-widest">
                        Showing {currentList.length} of {fullList.length}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white/5">
                                <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-white/40">Subscriber</th>
                                <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-white/40">Current / Last Plan</th>
                                <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-white/40">
                                    {activeTab === 'active' ? 'Next Billing' : 'Expiration Date'}
                                </th>
                                <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-white/40 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr><td colSpan="4" className="p-12 text-center text-xs text-white/20 uppercase font-black tracking-widest">Loading subscription data...</td></tr>
                            ) : currentList.length === 0 ? (
                                <tr><td colSpan="4" className="p-12 text-center text-xs text-white/20 uppercase font-black tracking-widest">No records found in this category</td></tr>
                            ) : (
                                currentList.map(sub => (
                                    <tr key={sub.id} className="group hover:bg-white/[0.02] transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-black text-xs text-white/60">
                                                    {(sub.first_name || sub.email || '?').charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-white mb-0.5">{sub.first_name} {sub.last_name}</p>
                                                    <p className="text-[10px] text-white/40 font-medium">{sub.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-xs font-bold text-white/80">{formatPlanName(sub.current_plan)}</p>
                                            <p className="text-[9px] text-white/30 uppercase tracking-widest font-bold mt-1">
                                                ID: {sub.stripe_subscription_id ? String(sub.stripe_subscription_id).substring(0, 12) + '...' : '—'}
                                            </p>
                                        </td>
                                        <td className="px-8 py-6 text-[10px] font-bold text-white/60 uppercase tracking-widest">
                                            {sub.current_sub_end_date ? new Date(sub.current_sub_end_date).toLocaleDateString() : '—'}
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${activeTab === 'active'
                                                ? 'bg-accent-green/10 text-accent-green border border-accent-green/20'
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
                    <div className="p-6 border-t border-white/5 flex items-center justify-between bg-white/[0.02]">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-6 py-3 bg-white/5 disabled:opacity-30 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
                            Prev
                        </button>
                        <div className="flex gap-2">
                            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest bg-white/5 px-4 py-2 rounded-lg">
                                Page <span className="text-white">{page}</span> of {totalPages}
                            </span>
                        </div>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="px-6 py-3 bg-white/5 disabled:opacity-30 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2"
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
        { id: 'longevity', label: 'Longevity', icon: 'M13 10V3L4 14h7v7l9-11h-7z' }
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
                    alert('PDF generated but no URL returned.');
                }

            } catch (err) {
                console.error('Error generating PDF:', err);
                alert('Failed to generate PDF: ' + err.message);
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
            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-white/40 mb-8 max-w-2xl mx-auto">
                <span className={step === 'category' ? 'text-accent-green' : ''}>1. Select Category</span>
                <span>/</span>
                <span className={step === 'email' ? 'text-accent-green' : ''}>2. Patient ID</span>
                <span>/</span>
                <span className={step === 'form' ? 'text-accent-green' : ''}>3. Clinical Assessment</span>
            </div>

            {step === 'category' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl mx-auto">
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => handleCategorySelect(cat.id)}
                            className="bg-white/5 border border-white/10 rounded-[32px] p-8 hover:bg-white/10 hover:border-accent-green/50 hover:scale-[1.02] transition-all group text-left"
                        >
                            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white/60 mb-6 group-hover:bg-accent-green group-hover:text-black transition-colors">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={cat.icon} /></svg>
                            </div>
                            <h3 className="text-xl font-black uppercase italic tracking-tighter mb-2">{cat.label}</h3>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Start new assessment</p>
                        </button>
                    ))}
                </div>
            )}

            {step === 'email' && (
                <div className="max-w-md mx-auto bg-white/5 border border-white/10 rounded-[40px] p-12 text-center">
                    <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-2">Patient <span className="text-accent-green">Identity</span></h3>
                    <p className="text-[10px] uppercase tracking-widest text-white/40 mb-8 font-bold">Enter patient email to verify records</p>

                    <form onSubmit={checkEmail} className="space-y-6">
                        <input
                            type="email"
                            required
                            placeholder="patient@example.com"
                            value={patientEmail}
                            onChange={(e) => setPatientEmail(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-2xl py-4 px-6 text-center text-white font-bold focus:outline-none focus:border-accent-green transition-all"
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
                                className="flex-[2] py-4 bg-accent-green text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:shadow-[0_0_20px_rgba(191,255,0,0.4)] transition-all disabled:opacity-50"
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
                        <div className="flex items-center justify-between mb-12 border-b border-white/5 pb-8">
                            <div>
                                <h3 className="text-2xl font-black uppercase italic tracking-tighter">Clinical <span className="text-accent-green">Intake</span></h3>
                                <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold mt-1">Filling as Admin for: {patientEmail}</p>
                            </div>
                            <div className="text-right">
                                <span className="bg-accent-green/10 text-accent-green px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">{selectedCategory}</span>
                            </div>
                        </div>

                        <div className="space-y-12">
                            {intakeQuestions[selectedCategory]?.map((q) => {
                                // Check condition
                                if (q.condition && !q.condition(answers)) return null;
                                if (q.type === 'info') return (
                                    <div key={q.id} className="bg-white/5 border border-white/5 rounded-2xl p-6 text-center">
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
                                                className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-accent-green transition-all"
                                            />
                                        )}

                                        {q.type === 'choice' && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {q.options.map(opt => (
                                                    <div
                                                        key={opt}
                                                        onClick={() => handleAnswerChange(q.id, opt, 'choice')}
                                                        className={`p-4 rounded-xl border cursor-pointer transition-all ${answers[q.id] === opt ? 'bg-accent-green text-black border-accent-green font-bold' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'}`}
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
                                                        className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${answers[q.id]?.includes(opt) ? 'bg-white/10 border-accent-green text-white' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'}`}
                                                    >
                                                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${answers[q.id]?.includes(opt) ? 'border-accent-green bg-accent-green text-black' : 'border-white/30'}`}>
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
                                className="flex-[3] py-5 bg-accent-green text-black rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-white hover:shadow-[0_0_30px_rgba(191,255,0,0.5)] transition-all disabled:opacity-50"
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
                        <div className="mb-12 border-b border-white/5 pb-8">
                            <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-2">Digital <span className="text-accent-green">Prescription</span></h3>
                            <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Fill in to generate PDF record</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            <div className="space-y-4">
                                <h4 className="text-xs font-black uppercase tracking-widest text-white/60">Provider Information</h4>
                                <input placeholder="Provider Full Name" value={prescription.providerName} onChange={e => handlePrescriptionChange('providerName', e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-accent-green" />
                                <input type="date" value={prescription.date} onChange={e => handlePrescriptionChange('date', e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-accent-green" />
                            </div>
                            <div className="space-y-4">
                                <h4 className="text-xs font-black uppercase tracking-widest text-white/60">Patient Information</h4>
                                <input placeholder="Patient Full Name" value={prescription.patientName} onChange={e => handlePrescriptionChange('patientName', e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-accent-green" />
                                <input type="date" placeholder="DOB" value={prescription.patientDob} onChange={e => handlePrescriptionChange('patientDob', e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-accent-green" />
                                <input placeholder="Address" value={prescription.patientAddress} onChange={e => handlePrescriptionChange('patientAddress', e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-accent-green" />
                                <input placeholder="Phone" value={prescription.patientPhone} onChange={e => handlePrescriptionChange('patientPhone', e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-accent-green" />
                                <input placeholder="Email" value={prescription.patientEmail} onChange={e => handlePrescriptionChange('patientEmail', e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-accent-green" />
                                <textarea placeholder="Drug Allergies" value={prescription.allergies} onChange={e => handlePrescriptionChange('allergies', e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-accent-green h-24" />
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
                                        className={`flex-1 py-3 rounded-xl border text-xs font-black uppercase tracking-widest transition-all ${prescription.medication === med ? 'bg-accent-green text-black border-accent-green' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
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
                                        className={`p-4 rounded-xl border cursor-pointer transition-all ${prescription.titration === opt.label ? 'bg-white/10 border-accent-green' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                                    >
                                        <div className="flex justify-between items-center mb-2">
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${prescription.titration === opt.label ? 'text-accent-green' : 'text-white/40'}`}>{opt.label}</span>
                                            <span className="text-[10px] font-bold text-white/40">{opt.qty}</span>
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
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${prescription.diagnosis.includes(item) ? 'bg-accent-green border-accent-green' : 'border-white/20 group-hover:border-white/40'}`}>
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
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${prescription.medicalNecessity.includes(item) ? 'bg-accent-green border-accent-green' : 'border-white/20 group-hover:border-white/40'}`}>
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
                            <h4 className="text-xs font-black uppercase tracking-widest text-white/60 mb-4">Dispense As Written – Prescriber Electronic Signature</h4>
                            <div className="space-y-4">
                                <input placeholder="Type your full legal name to sign" value={prescription.signature} onChange={e => handlePrescriptionChange('signature', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-accent-green" />
                                <p className="text-[10px] text-white/40">By typing your name above, you are electronically signing this prescription and certifying that you are the authorized prescriber.</p>
                                <input type="date" value={prescription.signatureDate} onChange={e => handlePrescriptionChange('signatureDate', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-accent-green max-w-[200px]" />
                            </div>
                            <div className="mt-4 pt-4 border-t border-white/10">
                                <p className="text-[10px] italic text-white/30 leading-relaxed">
                                    The sterile compound medications above are made at the request of the signed prescribing practitioner below due to a patient-specific medical need and the preparation producing a clinically significant therapeutic response compared to a commercially available product.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4 items-center">
                            <button onClick={() => setStep('form')} className="px-8 py-4 rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all">Back</button>

                            <div className="flex-1 flex gap-4 justify-end items-center">
                                {pdfUrl && (
                                    <a
                                        href={pdfUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[10px] font-black uppercase tracking-widest text-accent-green hover:underline mr-4"
                                    >
                                        View Generated PDF
                                    </a>
                                )}
                                <button onClick={generatePDF} className="px-8 py-4 rounded-xl bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all flex items-center gap-2">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                                    {pdfUrl ? 'Regenerate PDF' : 'Generate PDF'}
                                </button>
                                <button onClick={finalSubmit} disabled={submitting} className="px-12 py-4 rounded-xl bg-accent-green text-black text-[10px] font-black uppercase tracking-widest hover:bg-white hover:shadow-[0_0_20px_rgba(191,255,0,0.4)] transition-all">Proceed</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {step === 'success' && (
                <div className="text-center py-20 bg-white/5 border border-white/10 rounded-[40px]">
                    <div className="w-20 h-20 bg-accent-green rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(191,255,0,0.4)]">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>
                    </div>
                    <h3 className="text-3xl font-black uppercase italic tracking-tighter mb-4">Submission <span className="text-accent-green">Success</span></h3>
                    <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-12">The assessment has been added to the clinical queue.</p>
                    <button
                        onClick={reset}
                        className="px-12 py-4 bg-white text-black rounded-xl text-xs font-black uppercase tracking-widest hover:bg-accent-green transition-all"
                    >
                        Start New Entry
                    </button>
                </div>
            )}

            {/* PDF Loading Modal */}
            {generatingPdf && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-[#0A0A0A] border border-white/10 rounded-3xl p-12 text-center max-w-sm mx-4 shadow-2xl">
                        <div className="w-16 h-16 border-4 border-white/10 border-t-accent-green rounded-full animate-spin mx-auto mb-8"></div>
                        <h4 className="text-xl font-black uppercase italic tracking-tighter mb-2">Generating PDF</h4>
                        <p className="text-xs uppercase tracking-widest text-white/40 font-bold">Please wait while we prepare the prescription document...</p>
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
            case 'Excellent': return 'bg-accent-green/20 text-accent-green border-accent-green/30';
            case 'Good': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'Fair': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            case 'Poor': return 'bg-red-500/20 text-red-400 border-red-500/30';
            default: return 'bg-white/10 text-white/60 border-white/20';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-12 h-12 border-4 border-white/10 border-t-accent-green rounded-full animate-spin"></div>
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
                            ? 'bg-accent-green text-black'
                            : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white border border-white/10'
                            }`}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Response Table */}
            <div className="bg-white/[0.03] border border-white/5 rounded-[40px] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/[0.02]">
                                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-white/40">Email</th>
                                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-white/40">Progress</th>
                                {categoryFilter === 'weight-loss' && (
                                    <>
                                        <th className="p-8 text-[10px] font-black uppercase tracking-widest text-white/40">Starting Weight</th>
                                        <th className="p-8 text-[10px] font-black uppercase tracking-widest text-white/40">Weight Lost</th>
                                    </>
                                )}
                                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-white/40">Date Range</th>
                                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-white/40">Satisfied</th>
                                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-white/40">Submitted</th>
                                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-white/40 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {surveys.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="p-20 text-center">
                                        <p className="text-white/20 font-black uppercase tracking-widest text-xs">No responses logged yet</p>
                                    </td>
                                </tr>
                            ) : (
                                surveys.map(survey => (
                                    <tr key={survey.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="p-8">
                                            <p className="font-bold text-white group-hover:text-accent-green transition-colors">{survey.email}</p>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-white/20 mt-1">{survey.product}</p>
                                        </td>
                                        <td className="p-8">
                                            <span className={`px-4 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest ${getRatingColor(survey.progress_rating)}`}>
                                                {survey.progress_rating}
                                            </span>
                                        </td>
                                        {categoryFilter === 'weight-loss' && (
                                            <>
                                                <td className="p-8">
                                                    <p className="text-sm font-bold text-white/60">{survey.starting_weight ? `${survey.starting_weight} lbs` : '—'}</p>
                                                </td>
                                                <td className="p-8">
                                                    <p className={`text-sm font-black ${survey.weight_lost > 0 ? 'text-accent-green' : 'text-white/40'}`}>
                                                        {survey.weight_lost ? `${survey.weight_lost} lbs` : '—'}
                                                    </p>
                                                </td>
                                            </>
                                        )}
                                        <td className="p-8">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-white/40 whitespace-nowrap">
                                                {new Date(survey.start_date).toLocaleDateString(undefined, { month: 'short', day: '2-digit' })} - {new Date(survey.end_date).toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' })}
                                            </p>
                                        </td>
                                        <td className="p-8">
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${survey.satisfied_with_medication === 'Yes' ? 'text-accent-green' : 'text-red-400'}`}>
                                                {survey.satisfied_with_medication === 'Yes' ? 'yes' : 'no'}
                                            </span>
                                        </td>
                                        <td className="p-8">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-white/40">
                                                {new Date(survey.submitted_at || survey.created_at).toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' })}
                                            </p>
                                        </td>
                                        <td className="p-8 text-right">
                                            <button
                                                onClick={() => setSelectedSurvey(survey)}
                                                className="px-6 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-white group-hover:bg-accent-green group-hover:text-black group-hover:border-accent-green transition-all"
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
                        className="bg-[#0A0A0A] border border-white/10 rounded-[48px] p-12 max-w-2xl w-full max-h-[85vh] overflow-y-auto relative shadow-[0_0_100px_rgba(0,0,0,0.5)]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setSelectedSurvey(null)}
                            className="absolute top-8 right-8 w-12 h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all text-white/40 hover:text-white"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
                        </button>

                        <div className="mb-12">
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-accent-green mb-4">Patient Encounter</p>
                            <h3 className="text-4xl font-black uppercase italic tracking-tighter text-white mb-2 leading-none">Survey Results</h3>
                            <p className="text-white/40 font-bold uppercase tracking-widest text-[11px]">{selectedSurvey.email}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                                <p className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-2">Protocol</p>
                                <p className="text-sm font-black text-white uppercase italic">{selectedSurvey.product}</p>
                            </div>
                            <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                                <p className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-2">Progress</p>
                                <span className={`inline-block px-4 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${getRatingColor(selectedSurvey.progress_rating)}`}>
                                    {selectedSurvey.progress_rating}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className={`bg-white/[0.02] border border-white/5 p-8 rounded-[32px] grid ${selectedSurvey.category === 'weight-loss' ? 'grid-cols-2 gap-12' : 'grid-cols-1 gap-6'}`}>
                                {selectedSurvey.category === 'weight-loss' && (
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-2">Weight Tracking</p>
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-[10px] font-black text-white/40 uppercase mb-1">Start Weight</p>
                                                <p className="text-2xl font-black italic">{selectedSurvey.starting_weight || '0'} lbs</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-white/40 uppercase mb-1">Weight Lost</p>
                                                <p className="text-2xl font-black italic text-accent-green">-{selectedSurvey.weight_lost || '0'} lbs</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-2">Medical Status</p>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-[10px] font-black text-white/40 uppercase mb-1">Satisfied w/ Dose</p>
                                            <p className={`text-2xl font-black italic ${selectedSurvey.satisfied_with_medication === 'Yes' ? 'text-accent-green' : 'text-red-400'}`}>
                                                {selectedSurvey.satisfied_with_medication}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-white/40 uppercase mb-1">Reporting Period</p>
                                            <p className="text-sm font-black whitespace-nowrap">
                                                {new Date(selectedSurvey.start_date).toLocaleDateString()} - {new Date(selectedSurvey.end_date).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {selectedSurvey.additional_notes && (
                                <div className="bg-white/[0.02] border border-white/5 p-8 rounded-[32px]">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-4">Patient Notes</p>
                                    <p className="text-white/80 font-medium leading-relaxed italic">"{selectedSurvey.additional_notes}"</p>
                                </div>
                            )}

                            <div className="pt-8 border-t border-white/5 flex items-center justify-between">
                                <p className="text-[9px] font-black uppercase tracking-widest text-white/20">Record ID: {selectedSurvey.id.substring(0, 13)}...</p>
                                <button
                                    onClick={() => setSelectedSurvey(null)}
                                    className="px-10 py-4 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-accent-green transition-all"
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

            alert('Provider created successfully!');
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
            alert('Failed to create provider: ' + (err.message || 'Unknown error'));
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

            alert('Back office staff created successfully!');
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
            alert('Failed to create staff: ' + (err.message || 'Unknown error'));
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

            alert('Staff member removed successfully');
            fetchStaff();
        } catch (err) {
            console.error('Error deleting staff:', err);
            alert('Failed to delete staff: ' + (err.message || 'Unknown error'));
        }
    };

    const getRoleBadge = (role) => {
        switch (role) {
            case 'physician':
                return 'bg-accent-green/20 text-accent-green border-accent-green/30';
            case 'nurse_practitioner':
                return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'physician_assistant':
                return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
            case 'back_office':
                return 'bg-white/10 text-white/60 border-white/20';
            default:
                return 'bg-white/10 text-white/60 border-white/20';
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
                <div className="w-12 h-12 border-4 border-white/10 border-t-accent-green rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header Actions */}
            <div className="flex gap-4">
                <button
                    onClick={() => setShowProviderModal(true)}
                    className="px-8 py-4 bg-accent-green text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white transition-all shadow-[0_0_30px_rgba(191,255,0,0.2)]"
                >
                    + Add Provider
                </button>
                <button
                    onClick={() => setShowBackOfficeModal(true)}
                    className="px-8 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all"
                >
                    + Add Back Office Staff
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white/[0.03] border border-white/5 rounded-[32px] p-8">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Total Staff</p>
                    <p className="text-4xl font-black uppercase italic tracking-tighter text-accent-green">{staff.length}</p>
                </div>
                <div className="bg-white/[0.03] border border-white/5 rounded-[32px] p-8">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Providers</p>
                    <p className="text-4xl font-black uppercase italic tracking-tighter text-accent-green">
                        {staff.filter(s => ['physician', 'nurse_practitioner', 'physician_assistant'].includes(s.role)).length}
                    </p>
                </div>
                <div className="bg-white/[0.03] border border-white/5 rounded-[32px] p-8">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Back Office</p>
                    <p className="text-4xl font-black uppercase italic tracking-tighter text-white">
                        {staff.filter(s => s.role === 'back_office').length}
                    </p>
                </div>
                <div className="bg-white/[0.03] border border-white/5 rounded-[32px] p-8">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Active Today</p>
                    <p className="text-4xl font-black uppercase italic tracking-tighter text-accent-green">
                        {staff.filter(s => s.last_sign_in_at && new Date(s.last_sign_in_at).toDateString() === new Date().toDateString()).length}
                    </p>
                </div>
            </div>

            {/* Staff Table */}
            <div className="bg-white/[0.03] border border-white/5 rounded-[32px] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="text-left p-6 text-[10px] font-black uppercase tracking-widest text-white/40">Name</th>
                                <th className="text-left p-6 text-[10px] font-black uppercase tracking-widest text-white/40">Email</th>
                                <th className="text-left p-6 text-[10px] font-black uppercase tracking-widest text-white/40">Phone</th>
                                <th className="text-left p-6 text-[10px] font-black uppercase tracking-widest text-white/40">Role</th>
                                <th className="text-left p-6 text-[10px] font-black uppercase tracking-widest text-white/40">OTP Status</th>
                                <th className="text-left p-6 text-[10px] font-black uppercase tracking-widest text-white/40">Created</th>
                                <th className="text-left p-6 text-[10px] font-black uppercase tracking-widest text-white/40">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {staff.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-20">
                                        <p className="text-white/20 font-black uppercase tracking-widest text-xs">No staff members found</p>
                                    </td>
                                </tr>
                            ) : (
                                staff.map(member => (
                                    <tr key={member.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
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
                                            <span className={`px-3 py-1 rounded-xl border text-[10px] font-black uppercase tracking-wide ${member.otp_verified ? 'bg-accent-green/20 text-accent-green border-accent-green/30' : 'bg-red-500/20 text-red-400 border-red-500/30'
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
                                                <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6" onClick={() => setShowProviderModal(false)}>
                    <div className="bg-[#0A0A0A] border border-white/10 rounded-[40px] p-10 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-3xl font-black uppercase italic tracking-tighter mb-8">
                            Add Licensed <span className="text-accent-green">Provider</span>
                        </h3>

                        <form onSubmit={handleProviderSubmit} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Legal First Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={providerForm.firstName}
                                        onChange={(e) => setProviderForm({ ...providerForm, firstName: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-accent-green"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Legal Last Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={providerForm.lastName}
                                        onChange={(e) => setProviderForm({ ...providerForm, lastName: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-accent-green"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Date of Birth *</label>
                                <input
                                    type="date"
                                    required
                                    value={providerForm.dob}
                                    onChange={(e) => setProviderForm({ ...providerForm, dob: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-accent-green [color-scheme:dark]"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Legal Address *</label>
                                <input
                                    type="text"
                                    required
                                    value={providerForm.address}
                                    onChange={(e) => setProviderForm({ ...providerForm, address: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-accent-green"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Phone Number *</label>
                                <input
                                    type="tel"
                                    required
                                    value={providerForm.phone}
                                    onChange={(e) => setProviderForm({ ...providerForm, phone: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-accent-green"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Email *</label>
                                <input
                                    type="email"
                                    required
                                    value={providerForm.email}
                                    onChange={(e) => setProviderForm({ ...providerForm, email: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-accent-green"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Password *</label>
                                <input
                                    type="password"
                                    required
                                    value={providerForm.password}
                                    onChange={(e) => setProviderForm({ ...providerForm, password: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-accent-green"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">License Type *</label>
                                <select
                                    required
                                    value={providerForm.licenseType}
                                    onChange={(e) => setProviderForm({ ...providerForm, licenseType: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white font-bold focus:outline-none focus:border-accent-green"
                                >
                                    <option value="">Select license type</option>
                                    <option value="MD">MD - Medical Doctor</option>
                                    <option value="DO">DO - Doctor of Osteopathic Medicine</option>
                                    <option value="NP">NP - Nurse Practitioner</option>
                                    <option value="PA">PA - Physician Assistant</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">License # *</label>
                                    <input
                                        type="text"
                                        required
                                        value={providerForm.licenseNumber}
                                        onChange={(e) => setProviderForm({ ...providerForm, licenseNumber: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-accent-green"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">NPI # *</label>
                                    <input
                                        type="text"
                                        required
                                        value={providerForm.npiNumber}
                                        onChange={(e) => setProviderForm({ ...providerForm, npiNumber: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-accent-green"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">DEA # *</label>
                                    <input
                                        type="text"
                                        required
                                        value={providerForm.deaNumber}
                                        onChange={(e) => setProviderForm({ ...providerForm, deaNumber: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-accent-green"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">DEA Certification (Optional)</label>
                                <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) => setProviderForm({ ...providerForm, deaCertFile: e.target.files[0] })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-accent-green file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-accent-green file:text-black file:font-bold file:text-xs file:uppercase"
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowProviderModal(false)}
                                    className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="flex-1 py-4 bg-accent-green text-black rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-white transition-all disabled:opacity-50"
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6" onClick={() => setShowBackOfficeModal(false)}>
                    <div className="bg-[#0A0A0A] border border-white/10 rounded-[40px] p-10 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-3xl font-black uppercase italic tracking-tighter mb-8">
                            Add Back Office <span className="text-accent-green">Staff</span>
                        </h3>

                        <form onSubmit={handleBackOfficeSubmit} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Legal First Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={backOfficeForm.firstName}
                                        onChange={(e) => setBackOfficeForm({ ...backOfficeForm, firstName: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-accent-green"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Legal Last Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={backOfficeForm.lastName}
                                        onChange={(e) => setBackOfficeForm({ ...backOfficeForm, lastName: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-accent-green"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Date of Birth *</label>
                                <input
                                    type="date"
                                    required
                                    value={backOfficeForm.dob}
                                    onChange={(e) => setBackOfficeForm({ ...backOfficeForm, dob: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-accent-green [color-scheme:dark]"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Legal Address *</label>
                                <input
                                    type="text"
                                    required
                                    value={backOfficeForm.address}
                                    onChange={(e) => setBackOfficeForm({ ...backOfficeForm, address: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-accent-green"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Phone Number *</label>
                                <input
                                    type="tel"
                                    required
                                    value={backOfficeForm.phone}
                                    onChange={(e) => setBackOfficeForm({ ...backOfficeForm, phone: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-accent-green"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Email *</label>
                                <input
                                    type="email"
                                    required
                                    value={backOfficeForm.email}
                                    onChange={(e) => setBackOfficeForm({ ...backOfficeForm, email: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-accent-green"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Password *</label>
                                <input
                                    type="password"
                                    required
                                    value={backOfficeForm.password}
                                    onChange={(e) => setBackOfficeForm({ ...backOfficeForm, password: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-accent-green"
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowBackOfficeModal(false)}
                                    className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="flex-1 py-4 bg-accent-green text-black rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-white transition-all disabled:opacity-50"
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
            alert(`Update failed: ${err.message}`);
        } finally {
            setUpdatingId(null);
        }
    };

    const handleUpdateTracking = async (order, trackingId) => {
        if (!trackingId) return alert('Please enter a tracking number.');
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
                alert('Tracking updated, but email notification failed to send.');
            } else {
                alert('Tracking updated and patient has been notified.');
            }

            await fetchOrders();
            setEditingTrackingId(null);
        } catch (err) {
            console.error('Failed to update tracking:', err);
            alert(`Error updating tracking: ${err.message}`);
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
            <div className="w-10 h-10 border-2 border-accent-green border-t-transparent animate-spin rounded-full"></div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Syncing Fulfillment Records...</p>
        </div>
    );

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Filter Header */}
            <div className="flex flex-wrap items-center justify-between gap-6 bg-white/5 border border-white/10 rounded-[32px] p-6">
                <div className="flex gap-2">
                    {['all', 'processing', 'shipped', 'delivered'].map(f => (
                        <button
                            key={f}
                            onClick={() => { setFilter(f); setPage(1); }}
                            className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-white text-black' : 'text-white/40 hover:text-white/60 hover:bg-white/5'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/20">
                    Showing {paginatedOrders.length} of {filteredOrders.length} Orders
                </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 3xl:grid-cols-3 gap-6">
                {paginatedOrders.length === 0 ? (
                    <div className="py-32 text-center border-2 border-dashed border-white/5 rounded-[40px] flex flex-col items-center">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-white/10 mb-4">
                            <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        <p className="opacity-20 uppercase font-black text-xs tracking-widest">No matching records detected</p>
                    </div>
                ) : (
                    paginatedOrders.map(order => (
                        <div key={order.id} className="group p-8 bg-white/5 border border-white/10 rounded-[40px] hover:border-white/20 transition-all flex flex-col gap-8">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-accent-green/20 group-hover:text-accent-green transition-all">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <p className="text-lg font-black uppercase tracking-tighter italic">
                                                {order.profiles?.first_name} {order.profiles?.last_name || 'User'}
                                            </p>
                                            <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border border-accent-green/30 text-accent-green bg-accent-green/5`}>
                                                {order.delivery_status || 'Processing'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-[10px] text-white/40 uppercase font-black tracking-widest">
                                            <span>#{order.id.slice(0, 8)}</span>
                                            <span className="w-1 h-1 bg-white/10 rounded-full"></span>
                                            <span>{new Date(order.created_at).toLocaleDateString()}</span>
                                            {order.profiles?.email && (
                                                <>
                                                    <span className="w-1 h-1 bg-white/10 rounded-full"></span>
                                                    <span className="lowercase">{order.profiles.email}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <p className="text-xl font-black text-white italic tracking-tighter">${parseFloat(order.drug_price || 0).toFixed(2)}</p>
                                    <p className="text-[9px] text-white/40 font-black uppercase tracking-widest max-w-[200px] truncate">{order.drug_name || 'Medical Protocol'}</p>
                                </div>
                            </div>

                            <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6">
                                {(order.tracking_id && editingTrackingId !== order.id) ? (
                                    <>
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-accent-green/10 flex items-center justify-center text-accent-green">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-1">FedEx Tracking ID</p>
                                                <p className="text-xs font-black text-accent-green tracking-widest">{order.tracking_id}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-4 w-full md:w-auto">
                                            <a
                                                href={order.tracking_url || `https://www.fedex.com/fedextrack/?tracknumbers=${order.tracking_id}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-1 md:flex-none px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white/10 text-white flex items-center justify-center gap-2"
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
                                                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-6 py-3 text-xs font-bold tracking-widest placeholder:text-white/10 focus:outline-none focus:border-accent-green/40"
                                                value={trackingInputs[order.id] || ''}
                                                onChange={(e) => setTrackingInputs({ ...trackingInputs, [order.id]: e.target.value.trim() })}
                                            />
                                            {editingTrackingId === order.id && (
                                                <button
                                                    onClick={() => setEditingTrackingId(null)}
                                                    className="p-3 text-[10px] uppercase font-black tracking-widest text-white/20 hover:text-white transition-all"
                                                >
                                                    Cancel
                                                </button>
                                            )}
                                        </div>
                                        <button
                                            disabled={updatingId === order.id}
                                            onClick={() => handleUpdateTracking(order, trackingInputs[order.id])}
                                            className="w-full md:w-auto px-8 py-3 bg-accent-green text-black rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {updatingId === order.id ? (
                                                <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                                            ) : (order.tracking_id ? 'Update & Re-notify' : 'Finalize & Notify')}
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Manual Status Controls */}
                            <div className="flex flex-wrap items-center gap-4 pt-8 border-t border-white/5">
                                <div className="flex flex-col gap-2">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-white/20">Flow Stage</p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleUpdateStatus(order.id, { processing_status: order.processing_status === 'processed' ? 'not processed' : 'processed' })}
                                            className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${order.processing_status === 'processed' ? 'bg-accent-green text-black' : 'bg-white/5 text-white/40 border border-white/10 hover:border-white/20'}`}
                                        >
                                            {order.processing_status === 'processed' ? '✓ Processed' : 'Mark Processed'}
                                        </button>
                                    </div>
                                </div>

                                <div className="w-px h-8 bg-white/10 hidden md:block"></div>

                                <div className="flex flex-col gap-2">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-white/20">Delivery Phase</p>
                                    <div className="flex gap-2">
                                        {['pending', 'in transit', 'delivered'].map((status) => (
                                            <button
                                                key={status}
                                                onClick={() => handleUpdateStatus(order.id, { delivery_status: status })}
                                                className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${order.delivery_status === status ? 'bg-white text-black' : 'bg-white/5 text-white/40 border border-white/10 hover:border-white/20'}`}
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
                        className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center disabled:opacity-20 hover:bg-white/10 transition-all text-white"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6" /></svg>
                    </button>
                    <div className="flex gap-2">
                        {Array.from({ length: totalPages }).map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setPage(i + 1)}
                                className={`w-12 h-12 rounded-2xl border font-black text-[10px] transition-all ${page === i + 1 ? 'bg-white text-black border-white' : 'bg-white/5 text-white/40 border-white/5 hover:border-white/20'}`}
                            >
                                {i + 1}
                            </button>
                        ))}
                    </div>
                    <button
                        disabled={page === totalPages}
                        onClick={() => setPage(p => p + 1)}
                        className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center disabled:opacity-20 hover:bg-white/10 transition-all text-white"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6" /></svg>
                    </button>
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

    if (loading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-accent-green">LOADING OS...</div>;
    if (role !== 'admin' && role !== 'provider') return <Navigate to="/dashboard" replace />;

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans flex">
            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A] border-b border-white/5 px-4 py-3 flex items-center justify-between">
                <h1 className="text-xl font-black uppercase italic tracking-tighter" onClick={() => navigate('/')}>
                    GLP-<span className="text-accent-green">GLOW</span>
                </h1>
                <button
                    onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
                    className="w-10 h-10 flex flex-col items-center justify-center gap-1.5"
                >
                    <span className={`w-6 h-0.5 bg-white transition-all duration-300 ${mobileSidebarOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
                    <span className={`w-6 h-0.5 bg-white transition-all duration-300 ${mobileSidebarOpen ? 'opacity-0' : ''}`}></span>
                    <span className={`w-6 h-0.5 bg-white transition-all duration-300 ${mobileSidebarOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
                </button>
            </div>

            {/* Sidebar - Desktop and Mobile */}
            <aside className={`w-72 border-r border-white/5 bg-[#0A0A0A] lg:sticky lg:top-0 fixed h-screen p-6 md:p-8 z-40 transition-transform duration-300 lg:translate-x-0 ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:block`}>
                <div className="mb-8 md:mb-12 pt-16 lg:pt-0">
                    <h1 className="text-2xl font-black uppercase italic tracking-tighter cursor-pointer" onClick={() => navigate('/')}>
                        GLP-<span className="text-accent-green">GLOW</span>
                    </h1>
                </div>
                <nav className="space-y-1">
                    {[
                        { id: 'overview', label: 'Overview', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
                        { id: 'patients', label: 'Patients', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
                        { id: 'clinical', label: 'Submissions', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', badge: pendingCount },
                        { id: 'orders', label: 'Orders', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
                        { id: 'discounts', label: 'Discounts', icon: 'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z' },
                        { id: 'users', label: 'Users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
                        { id: 'subscribers', label: 'Subscribers', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
                        { id: 'patient-express', label: 'Patient Express', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
                        { id: 'surveys', label: 'Surveys', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' }
                    ].map(item => (
                        <button
                            key={item.id}
                            onClick={() => {
                                navigate(`/admin/${item.id}`);
                                setMobileSidebarOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl md:rounded-2xl text-[10px] md:text-[11px] font-black uppercase tracking-widest transition-all ${currentTab === item.id ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}
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

                    <div className="pt-6 md:pt-8 mt-6 md:mt-8 border-t border-white/5">
                        <button
                            onClick={() => {
                                navigate('/dashboard');
                                setMobileSidebarOpen(false);
                            }}
                            className="w-full flex items-center gap-2 md:gap-3 px-4 py-3 rounded-xl md:rounded-2xl text-[10px] md:text-[11px] font-black uppercase tracking-widest text-accent-green hover:bg-accent-green/10 transition-all"
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

            <main className="flex-1 px-4 py-4 md:px-6 md:py-8 lg:px-4 lg:py-12 xl:px-4 2xl:px-2 3xl:px-0 pt-20 lg:pt-12 w-full overflow-x-hidden">
                <header className="mb-8 md:mb-16">
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-black uppercase italic tracking-tighter">
                        {currentTab === 'overview' && 'System Analytics'}
                        {currentTab === 'patients' && 'Patient Directory'}
                        {currentTab === 'clinical' && 'Submissions'}
                        {currentTab === 'orders' && 'Order Management'}
                        {currentTab === 'discounts' && 'Discount Management'}
                        {currentTab === 'users' && 'Admin & User Roles'}
                        {currentTab === 'subscribers' && 'Subscriber Base'}
                        {currentTab === 'patient-express' && 'Patient Express Entry'}
                        {currentTab === 'surveys' && 'Feedback & Surveys'}
                    </h2>
                </header>

                <Routes>
                    <Route path="/" element={<Navigate to="overview" replace />} />
                    <Route path="overview" element={<AdminOverview />} />
                    <Route path="patients" element={<PatientPortalManager />} />
                    <Route path="clinical" element={<ClinicalQueue />} />
                    <Route path="orders" element={<OrderManagement />} />
                    <Route path="discounts" element={<DiscountManager />} />
                    <Route path="users" element={<StaffManagement />} />
                    <Route path="subscribers" element={<SubscriberAnalytics />} />
                    <Route path="patient-express" element={<PatientExpressEntry />} />
                    <Route path="surveys" element={<SurveyManagement />} />
                </Routes>
            </main>
        </div>
    );
};

export default AdminDashboard;
