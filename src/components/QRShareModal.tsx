"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Copy, Check, Share2 } from "lucide-react";
import QRCode from "qrcode";

interface Props {
  tripId: string;
  tripTitle: string;
  onClose: () => void;
}

export function QRShareModal({ tripId, tripTitle, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied]     = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    const url = `${window.location.origin}/trips/${tripId}`;
    setShareUrl(url);
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, url, {
        width: 220,
        margin: 2,
        color: { dark: "#6366f1", light: "#ffffff" },
      });
    }
  }, [tripId]);

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(shareUrl); } catch {}
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };

  const downloadQR = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `traveloop-${tripId}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: `✈️ ${tripTitle} — Traveloop`, url: shareUrl }); } catch {}
    } else { copyLink(); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ scale: 0.9, y: 24 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 24 }}
        transition={{ type: "spring", damping: 22, stiffness: 300 }}
        style={{ width: "100%", maxWidth: "340px", borderRadius: "24px", background: "var(--bg-card)", border: "1px solid rgba(99,102,241,0.3)", boxShadow: "0 0 60px rgba(99,102,241,0.15),0 24px 48px rgba(0,0,0,0.4)", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "linear-gradient(135deg,rgba(99,102,241,0.1),rgba(6,182,212,0.05))" }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: "15px", color: "var(--text-primary)" }}>📤 Share Trip</div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>Scan QR or copy link</div>
          </div>
          <motion.button whileTap={{ scale: 0.9 }} onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}>
            <X size={18} />
          </motion.button>
        </div>

        <div style={{ padding: "24px", textAlign: "center" }}>
          {/* Trip title */}
          <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--text-primary)", marginBottom: "16px", padding: "8px 16px", borderRadius: "10px", background: "var(--bg-primary)", border: "1px solid var(--border)" }}>
            ✈️ {tripTitle}
          </div>

          {/* QR Code */}
          <div style={{ display: "inline-flex", padding: "12px", borderRadius: "16px", background: "white", marginBottom: "16px", boxShadow: "0 4px 20px rgba(99,102,241,0.2)" }}>
            <canvas ref={canvasRef} style={{ borderRadius: "8px" }} />
          </div>

          {/* URL pill */}
          <div style={{ padding: "8px 14px", borderRadius: "10px", background: "var(--bg-primary)", border: "1px solid var(--border)", fontSize: "11px", color: "var(--text-muted)", marginBottom: "16px", wordBreak: "break-all", textAlign: "left" }}>
            {shareUrl}
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: "8px" }}>
            <motion.button whileTap={{ scale: 0.96 }} onClick={copyLink} className="btn-secondary"
              style={{ flex: 1, fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}>
              {copied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy Link</>}
            </motion.button>
            <motion.button whileTap={{ scale: 0.96 }} onClick={downloadQR} className="btn-secondary"
              style={{ flex: 1, fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}>
              <Download size={13} /> Save QR
            </motion.button>
            <motion.button whileTap={{ scale: 0.96 }} onClick={nativeShare} className="btn-primary"
              style={{ flex: 1, fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}>
              <Share2 size={13} /> Share
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
