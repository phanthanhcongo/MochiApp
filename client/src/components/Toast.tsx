import React, { useEffect, useState } from 'react';

interface ToastProps {
    message: string;
    duration?: number;
    onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, duration = 2000, onClose }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        // Slide in animation
        setTimeout(() => setIsVisible(true), 10);

        // Start exit animation before removing
        const exitTimer = setTimeout(() => {
            setIsExiting(true);
        }, duration);

        // Remove after exit animation
        const removeTimer = setTimeout(() => {
            onClose();
        }, duration + 500);

        return () => {
            clearTimeout(exitTimer);
            clearTimeout(removeTimer);
        };
    }, [duration, onClose]);

    return (
        <div
            className={`
        relative
        w-full
        bg-gradient-to-br from-amber-50 to-orange-100
        rounded-xl shadow-2xl
        px-6 py-4
        border-l-4 border-orange-500
        pointer-events-auto
        transform transition-all duration-500 ease-out
        ${isVisible && !isExiting
                    ? 'translate-x-0 opacity-100'
                    : 'translate-x-full opacity-0'
                }
      `}
        >
            {/* Close button */}
            <button
                onClick={onClose}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            {/* Content */}
            <div className="flex items-start gap-3 pr-6">
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center">
                    <span className="text-lg">💡</span>
                </div>
                <div className="flex-1">
                    <h4 className="text-sm font-bold text-gray-800 mb-0.5">Lưu ý</h4>
                    <p className="text-sm text-gray-700">{message}</p>
                </div>
            </div>

            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-orange-200 rounded-b-xl overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-orange-400 to-pink-500 animate-shrink"
                    style={{
                        animation: `shrink ${duration}ms linear forwards`
                    }}
                />
            </div>

            <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
        </div>
    );
};

// Toast Manager Hook
let showToastFn: ((message: string) => void) | null = null;

export const useToast = () => {
    const [toasts, setToasts] = useState<{ id: number; message: string }[]>([]);

    useEffect(() => {
        showToastFn = (message: string) => {
            const id = Date.now();
            setToasts((prev) => [...prev, { id, message }]);
        };

        return () => {
            showToastFn = null;
        };
    }, []);

    const removeToast = (id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return {
        toasts,
        removeToast,
    };
};

// Global function to show toast from anywhere
export const showToast = (message: string) => {
    console.log('Toast function is called');
    if (showToastFn) {
        console.log('Toast function is ready');
        showToastFn(message);
    } else {
        console.log('Toast function is not ready');
    }
    // No fallback - if toast system not ready, just skip silently
};
