import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import React, { useEffect, useState } from 'react';

const AdminRoute = ({ children }) => {
    const { user, loading: authLoading } = useAuth();
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkRole = async () => {
            if (!user) {
                setLoading(false);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('user_roles')
                    .select('role')
                    .eq('user_id', user.id)
                    .single();

                if (error) {
                    console.error('[AdminRoute] Supabase error:', error.message, error.details);
                }

                if (data) {
                    console.log('[AdminRoute] Role fetched:', data.role);
                    setRole(data.role);
                } else {
                    console.warn('[AdminRoute] No role found for user:', user.id);
                }
            } catch (err) {
                console.error('[AdminRoute] Catastrophic error:', err);
            } finally {
                setLoading(false);
            }
        };

        checkRole();
    }, [user]);

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <div className="w-12 h-12 border-2 border-accent-green border-t-transparent animate-spin rounded-full"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (role !== 'admin' && role !== 'provider') {
        return (
            <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="red" strokeWidth="2">
                        <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-2">Access <span className="text-red-500">Denied</span></h2>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 max-w-md w-full space-y-4">
                    <div className="text-left">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Authenticated UID</p>
                        <p className="text-xs font-mono break-all text-white/60">{user.id}</p>
                    </div>
                    <div className="text-left">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Detected Role</p>
                        <p className="text-xs font-black uppercase text-red-400">{role || 'None/Null'}</p>
                    </div>
                    <p className="text-[10px] text-white/40 leading-relaxed font-bold uppercase tracking-widest pt-4 border-t border-white/5">
                        Ensure the UID above has an entry in the <code className="text-accent-green">user_roles</code> table with the role <code className="text-accent-green">'admin'</code>.
                    </p>
                </div>
                <button
                    onClick={() => window.location.href = '/dashboard'}
                    className="mt-8 text-[11px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all underline decoration-accent-green underline-offset-8"
                >
                    Return to Patient Portal
                </button>
            </div>
        );
    }

    return children;
};

export default AdminRoute;
