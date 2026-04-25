"use client";

import { createContext, useContext, useState, useCallback, ReactNode, useRef } from "react";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType>({ confirm: async () => false });

export const useConfirm = () => useContext(ConfirmContext);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({ message: "" });
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts);
    setIsOpen(true);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const handleClose = (value: boolean) => {
    setIsOpen(false);
    resolveRef.current?.(value);
    resolveRef.current = null;
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={() => handleClose(false)} />
          <div className="relative bg-surface w-full max-w-sm rounded-[24px] shadow-2xl p-6 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200 border border-border">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-2xl ${options.danger ? 'bg-red/10 text-red' : 'bg-amber/10 text-amber'}`}>
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-black text-text tracking-tight">
                  {options.title || "Confirmar Ação"}
                </h3>
                <p className="text-sm text-muted mt-1.5 leading-relaxed font-medium">{options.message}</p>
              </div>
              <button onClick={() => handleClose(false)} className="p-2 hover:bg-muted/10 rounded-full text-muted transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex gap-3 justify-end mt-4">
              <button 
                onClick={() => handleClose(false)} 
                className="px-6 py-2.5 text-sm font-bold text-muted hover:bg-muted/10 rounded-xl transition-all"
              >
                {options.cancelText || "Cancelar"}
              </button>
              <button 
                onClick={() => handleClose(true)} 
                className={`px-8 py-2.5 text-sm font-black rounded-xl shadow-lg transition-all ${
                  options.danger 
                    ? 'bg-red hover:bg-red/90 text-white shadow-red/20' 
                    : 'bg-accent hover:bg-accent-hover text-white shadow-accent/20'
                }`}
              >
                {options.confirmText || "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
