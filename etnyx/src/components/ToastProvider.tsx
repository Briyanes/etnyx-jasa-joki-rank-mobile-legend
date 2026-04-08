"use client";

import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

export const useToast = () => useContext(ToastContext);

// Global function so it can be called outside React components (replaces window.alert)
let globalShowToast: (message: string, type?: ToastType) => void = () => {};

export function toast(message: string, type: ToastType = "info") {
  globalShowToast(message, type);
}

export function toastSuccess(message: string) { globalShowToast(message, "success"); }
export function toastError(message: string) { globalShowToast(message, "error"); }
export function toastWarning(message: string) { globalShowToast(message, "warning"); }
export function toastInfo(message: string) { globalShowToast(message, "info"); }

const icons: Record<ToastType, typeof CheckCircle> = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const styles: Record<ToastType, string> = {
  success: "border-green-500/40 bg-green-500/10 text-green-400",
  error: "border-red-500/40 bg-red-500/10 text-red-400",
  warning: "border-yellow-500/40 bg-yellow-500/10 text-yellow-400",
  info: "border-blue-500/40 bg-blue-500/10 text-blue-400",
};

const iconColors: Record<ToastType, string> = {
  success: "text-green-400",
  error: "text-red-400",
  warning: "text-yellow-400",
  info: "text-blue-400",
};

const progressColors: Record<ToastType, string> = {
  success: "bg-green-400",
  error: "bg-red-400",
  warning: "bg-yellow-400",
  info: "bg-blue-400",
};

function ToastItem({ toast: t, onRemove }: { toast: Toast; onRemove: (id: number) => void }) {
  const Icon = icons[t.type];
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onRemove(t.id), 300);
    }, 3500);
    return () => clearTimeout(timerRef.current);
  }, [t.id, onRemove]);

  const handleClose = () => {
    clearTimeout(timerRef.current);
    setExiting(true);
    setTimeout(() => onRemove(t.id), 300);
  };

  return (
    <div
      className={`
        relative overflow-hidden rounded-xl border backdrop-blur-xl shadow-2xl
        ${styles[t.type]}
        ${exiting ? "animate-toast-out" : "animate-toast-in"}
        max-w-[min(420px,calc(100vw-32px))] w-full
      `}
    >
      <div className="flex items-start gap-3 px-4 py-3.5">
        <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${iconColors[t.type]}`} />
        <p className="text-sm font-medium text-white/90 flex-1 break-words leading-relaxed">{t.message}</p>
        <button
          onClick={handleClose}
          className="shrink-0 text-white/40 hover:text-white/80 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      {/* Progress bar */}
      <div className="h-0.5 w-full bg-white/5">
        <div
          className={`h-full ${progressColors[t.type]} ${exiting ? "" : "animate-toast-progress"}`}
        />
      </div>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev.slice(-4), { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Set global function
  useEffect(() => {
    globalShowToast = showToast;
    return () => { globalShowToast = () => {}; };
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container - center top */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[99999] flex flex-col items-center gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onRemove={removeToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
