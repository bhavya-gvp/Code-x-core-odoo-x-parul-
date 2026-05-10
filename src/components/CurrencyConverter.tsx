"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, RefreshCw, Copy, Check, ArrowUpDown } from "lucide-react";

const CURRENCIES = [
  { code: "INR", flag: "🇮🇳", name: "Indian Rupee" },
  { code: "USD", flag: "🇺🇸", name: "US Dollar" },
  { code: "EUR", flag: "🇪🇺", name: "Euro" },
  { code: "GBP", flag: "🇬🇧", name: "British Pound" },
  { code: "JPY", flag: "🇯🇵", name: "Japanese Yen" },
  { code: "THB", flag: "🇹🇭", name: "Thai Baht" },
  { code: "IDR", flag: "🇮🇩", name: "Indonesian Rupiah" },
  { code: "SGD", flag: "🇸🇬", name: "Singapore Dollar" },
  { code: "AED", flag: "🇦🇪", name: "UAE Dirham" },
  { code: "AUD", flag: "🇦🇺", name: "Australian Dollar" },
  { code: "CAD", flag: "🇨🇦", name: "Canadian Dollar" },
  { code: "CHF", flag: "🇨🇭", name: "Swiss Franc" },
  { code: "MYR", flag: "🇲🇾", name: "Malaysian Ringgit" },
  { code: "HKD", flag: "🇭🇰", name: "Hong Kong Dollar" },
  { code: "NZD", flag: "🇳🇿", name: "New Zealand Dollar" },
];

// Fallback static rates vs INR (approximate, used if API fails)
const FALLBACK: Record<string, number> = {
  INR:1, USD:0.012, EUR:0.011, GBP:0.0094, JPY:1.81, THB:0.44,
  IDR:195, SGD:0.016, AED:0.044, AUD:0.019, CAD:0.016,
  CHF:0.011, MYR:0.056, HKD:0.093, NZD:0.020,
};

interface Props { onClose: () => void }

export function CurrencyConverter({ onClose }: Props) {
  const [from, setFrom]       = useState("INR");
  const [to, setTo]           = useState("USD");
  const [amount, setAmount]   = useState("10000");
  const [rates, setRates]     = useState<Record<string,number>>(FALLBACK);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied]   = useState(false);
  const [lastUpdated, setLastUpdated] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchRates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`https://api.frankfurter.app/latest?from=INR&to=${CURRENCIES.map(c=>c.code).filter(c=>c!=="INR").join(",")}`);
      const data = await res.json();
      setRates({ INR: 1, ...data.rates });
      setLastUpdated(new Date().toLocaleTimeString());
    } catch {
      setRates(FALLBACK);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRates(); inputRef.current?.focus(); }, [fetchRates]);

  const convert = () => {
    const n = parseFloat(amount) || 0;
    if (!rates[from] || !rates[to]) return "—";
    const inINR = n / rates[from];
    const result = inINR * rates[to];
    if (result >= 1000000) return (result / 1000000).toFixed(2) + "M";
    if (result >= 1000)    return result.toLocaleString("en-IN", { maximumFractionDigits: 2 });
    return result.toFixed(4);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(convert()).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };

  const swap = () => { setFrom(to); setTo(from); };

  const fromCur = CURRENCIES.find(c => c.code === from)!;
  const toCur   = CURRENCIES.find(c => c.code === to)!;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ scale: 0.9, y: 24 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 24 }}
        transition={{ type: "spring", damping: 22, stiffness: 300 }}
        style={{ width: "100%", maxWidth: "440px", borderRadius: "24px", background: "var(--bg-card)", border: "1px solid rgba(99,102,241,0.3)", boxShadow: "0 0 60px rgba(99,102,241,0.15),0 24px 48px rgba(0,0,0,0.4)", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ padding: "18px 22px 14px", borderBottom: "1px solid var(--border)", background: "linear-gradient(135deg,rgba(99,102,241,0.1),rgba(6,182,212,0.06))", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: "15px", color: "var(--text-primary)" }}>💱 Currency Converter</div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
              {lastUpdated ? `Updated ${lastUpdated}` : "Loading live rates…"}
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <motion.button whileTap={{ scale: 0.9 }} onClick={fetchRates}
              style={{ background: "none", border: "1px solid var(--border)", borderRadius: "8px", padding: "6px", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}>
              <motion.div animate={loading ? { rotate: 360 } : {}} transition={{ duration: 1, repeat: loading ? Infinity : 0, ease: "linear" }}>
                <RefreshCw size={14} />
              </motion.div>
            </motion.button>
            <motion.button whileTap={{ scale: 0.9 }} onClick={onClose}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}>
              <X size={18} />
            </motion.button>
          </div>
        </div>

        <div style={{ padding: "22px" }}>
          {/* Amount input */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px", display: "block" }}>Amount</label>
            <input ref={inputRef} type="number" value={amount} onChange={e => setAmount(e.target.value)}
              className="input" style={{ fontSize: "24px", fontWeight: 800, textAlign: "center", padding: "14px", letterSpacing: "1px" }} />
          </div>

          {/* From / Swap / To */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
            {/* From */}
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px", display: "block" }}>From</label>
              <select value={from} onChange={e => setFrom(e.target.value)} className="input" style={{ fontSize: "14px", fontWeight: 700 }}>
                {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
              </select>
            </div>

            {/* Swap */}
            <motion.button whileHover={{ rotate: 180 }} transition={{ duration: 0.3 }} onClick={swap}
              style={{ marginTop: "22px", width: "40px", height: "40px", borderRadius: "50%", background: "var(--brand-gradient)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <ArrowUpDown size={16} color="white" />
            </motion.button>

            {/* To */}
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px", display: "block" }}>To</label>
              <select value={to} onChange={e => setTo(e.target.value)} className="input" style={{ fontSize: "14px", fontWeight: 700 }}>
                {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
              </select>
            </div>
          </div>

          {/* Result */}
          <motion.div key={`${amount}-${from}-${to}`} initial={{ scale: 0.97, opacity: 0.6 }} animate={{ scale: 1, opacity: 1 }}
            style={{ padding: "20px", borderRadius: "16px", background: "linear-gradient(135deg,rgba(99,102,241,0.1),rgba(6,182,212,0.06))", border: "1px solid rgba(99,102,241,0.2)", textAlign: "center", marginBottom: "14px" }}>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "6px" }}>
              {fromCur.flag} {parseFloat(amount)||0} {from} =
            </div>
            <div style={{ fontSize: "32px", fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-1px" }}>
              {toCur.flag} {convert()} <span style={{ fontSize: "18px", color: "var(--brand-primary)" }}>{to}</span>
            </div>
            {rates[from] && rates[to] && (
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "6px" }}>
                1 {from} = {(rates[to]/rates[from]).toFixed(4)} {to}
              </div>
            )}
          </motion.div>

          {/* Copy button */}
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleCopy} className="btn-secondary"
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "7px", fontSize: "13px" }}>
            {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy Result</>}
          </motion.button>

          {/* Quick amounts */}
          <div style={{ marginTop: "14px" }}>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "6px", fontWeight: 600 }}>Quick amounts</div>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {["1000","5000","10000","25000","50000","100000"].map(v => (
                <motion.button key={v} whileTap={{ scale: 0.94 }} onClick={() => setAmount(v)}
                  style={{ padding: "4px 10px", borderRadius: "16px", border: `1px solid ${amount === v ? "var(--brand-primary)" : "var(--border)"}`, background: amount === v ? "rgba(99,102,241,0.12)" : "var(--bg-primary)", color: amount === v ? "var(--brand-primary)" : "var(--text-secondary)", cursor: "pointer", fontSize: "11px", fontWeight: 500 }}>
                  ₹{parseInt(v).toLocaleString("en-IN")}
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
