"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
  removing?: boolean;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "info", duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, removing: true } : t));
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 300);
    }, duration);
  }, []);

  const typeStyles: Record<ToastType, string> = {
    success: "border-l-4 border-l-emerald-500 bg-emerald-50/90 text-emerald-800",
    error: "border-l-4 border-l-red-500 bg-red-50/90 text-red-800",
    info: "border-l-4 border-l-blue-500 bg-blue-50/90 text-blue-800",
    warning: "border-l-4 border-l-amber-500 bg-amber-50/90 text-amber-800",
  };

  const icons: Record<ToastType, string> = {
    success: "✅",
    error: "❌",
    info: "💡",
    warning: "⚠️",
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`
              pointer-events-auto flex items-center gap-3 px-5 py-3.5 rounded-xl border border-slate-200/50 
              shadow-lg backdrop-blur-sm min-w-[300px] max-w-[420px]
              ${typeStyles[toast.type]}
              ${toast.removing 
                ? "animate-[toastOut_0.3s_ease_forwards]" 
                : "animate-[toastIn_0.3s_cubic-bezier(.34,1.56,.64,1)]"
              }
            `}
          >
            <span className="text-lg shrink-0">{icons[toast.type]}</span>
            <span className="text-sm font-semibold flex-1">{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
