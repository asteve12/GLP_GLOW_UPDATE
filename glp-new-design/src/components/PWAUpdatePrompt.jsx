import React, { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

const PWAUpdatePrompt = () => {
    const {
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            console.log('[PWA] Service worker registered:', r);
        },
        onRegisterError(error) {
            console.error('[PWA] Service worker registration error:', error);
        },
    });

    const [dismissed, setDismissed] = useState(false);

    if (!needRefresh || dismissed) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            backgroundColor: '#0A0A0A',
            border: '1px solid rgba(255,222,89,0.3)',
            borderRadius: '20px',
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            maxWidth: '90vw',
            width: 'max-content',
            animation: 'slideUp 0.4s cubic-bezier(0.175,0.885,0.32,1.275) forwards'
        }}>
            <style>{`
                @keyframes slideUp {
                    from { opacity: 0; transform: translateX(-50%) translateY(20px); }
                    to   { opacity: 1; transform: translateX(-50%) translateY(0);    }
                }
            `}</style>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    backgroundColor: '#FFDE59', animation: 'pulse 2s infinite'
                }} />
                <p style={{
                    fontSize: '11px', fontWeight: '700', color: '#ffffff',
                    textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0
                }}>
                    New version available
                </p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
                <button
                    onClick={() => updateServiceWorker(true)}
                    style={{
                        padding: '8px 16px', borderRadius: '10px',
                        backgroundColor: '#FFDE59', color: '#000',
                        border: 'none', fontSize: '10px', fontWeight: '900',
                        textTransform: 'uppercase', letterSpacing: '0.1em',
                        cursor: 'pointer'
                    }}
                >
                    Update
                </button>
                <button
                    onClick={() => { setNeedRefresh(false); setDismissed(true); }}
                    style={{
                        padding: '8px 16px', borderRadius: '10px',
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        color: 'rgba(255,255,255,0.4)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        fontSize: '10px', fontWeight: '700',
                        textTransform: 'uppercase', letterSpacing: '0.1em',
                        cursor: 'pointer'
                    }}
                >
                    Later
                </button>
            </div>
        </div>
    );
};

export default PWAUpdatePrompt;
