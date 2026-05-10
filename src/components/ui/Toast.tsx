"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const ICONS = {
  success: <CheckCircle size={15} />,
  error:   <XCircle size={15} />,
  warning: <AlertTriangle size={15} />,
  info:    <Info size={15} />,
};

const COLORS = {
  success: { bg: "rgba(22,163,74,0.92)",  border: "rgba(34,197,94,0.4)" },
  error:   { bg: "rgba(220,38,38,0.92)",  border: "rgba(239,68,68,0.4)" },
  warning: { bg: "rgba(217,119,6,0.92)",  border: "rgba(245,158,11,0.4)" },
  info:    { bg: "rgba(37,99,235,0.92)",   border: "rgba(99,102,241,0.4)" },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = "success") => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev.slice(-4), { id, message, type }]); // max 5 toasts
    setTimeout(() => dismiss(id), 3000);
  }, [dismiss]);

  const ctx: ToastContextType = {
    toast,
    success: (m) => toast(m, "success"),
    error:   (m) => toast(m, "error"),
    warning: (m) => toast(m, "warning"),
    info:    (m) => toast(m, "info"),
  };

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      {/* Global toast overlay */}
      <div style={{ position: "fixed", bottom: "80px", left: "50%", transform: "translateX(-50%)", zIndex: 99999, display: "flex", flexDirection: "column", gap: "8px", alignItems: "center", pointerEvents: "none" }}>
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div key={t.id}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0,  scale: 1 }}
              exit={{   opacity: 0, y: 20,  scale: 0.9 }}
              transition={{ type: "spring", damping: 22, stiffness: 300 }}
              style={{ pointerEvents: "auto", padding: "10px 18px", borderRadius: "30px", background: COLORS[t.type].bg, border: `1px solid ${COLORS[t.type].border}`, color: "white", fontWeight: 600, fontSize: "13px", display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 8px 32px rgba(0,0,0,0.35)", backdropFilter: "blur(12px)", whiteSpace: "nowrap", maxWidth: "90vw" }}>
              {ICONS[t.type]}
              <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{t.message}</span>
              <button onClick={() => dismiss(t.id)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", cursor: "pointer", padding: "0 0 0 4px", display: "flex", pointerEvents: "auto" }}>
                <X size={13} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextType {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be inside ToastProvider");
  return ctx;
}
