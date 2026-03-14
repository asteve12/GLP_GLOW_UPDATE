import React, { useState, useEffect } from 'react';

const InstallPWA = () => {
    const [supportsPWA, setSupportsPWA] = useState(false);
    const [promptInstall, setPromptInstall] = useState(null);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        const handler = (e) => {
            e.preventDefault();
            console.log("we are being triggered :D");
            setSupportsPWA(true);
            setPromptInstall(e);
        };
        window.addEventListener("beforeinstallprompt", handler);

        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
            setIsInstalled(true);
        }

        return () => window.removeEventListener("beforeinstallprompt", handler);
    }, []);

    const onClick = (evt) => {
        evt.preventDefault();
        if (!promptInstall) {
            return;
        }
        promptInstall.prompt();
    };

    if (!supportsPWA || isInstalled) {
        return null;
    }

    return (
        <div 
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-sm bg-black border border-white/10 rounded-2xl p-4 shadow-2xl animate-in slide-in-from-bottom-10 duration-500"
            style={{ backdropFilter: 'blur(10px)' }}
        >
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#FFDE59] rounded-xl flex items-center justify-center shrink-0">
                    <span className="text-black font-black text-xl">U</span>
                </div>
                <div className="flex-1">
                    <h3 className="text-white text-xs font-black uppercase tracking-wider mb-1">Install uGlowMD App</h3>
                    <p className="text-white/50 text-[10px] uppercase font-bold tracking-widest leading-none">Add to home screen for fast access</p>
                </div>
                <button
                    onClick={onClick}
                    className="bg-[#FFDE59] text-black px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform"
                >
                    Install
                </button>
            </div>
        </div>
    );
};

export default InstallPWA;
