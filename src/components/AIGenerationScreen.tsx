"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, MapPin, Wallet, Calendar, Zap, CheckCircle } from "lucide-react";

interface AIGenerationScreenProps {
  tripParams: {
    destinations: string[];
    mood: string;
    budget: number;
    start_date: string;
    end_date: string;
    travelers: number;
  };
  onComplete: (result: any) => void;
  onError: (error: string) => void;
}

const STEPS = [
  { id: 1, icon: <MapPin size={20} />,    label: "Analyzing destinations",      color: "#6366f1", duration: 900  },
  { id: 2, icon: <Calendar size={20} />,  label: "Calculating city distribution",color: "#06b6d4", duration: 800  },
  { id: 3, icon: <Zap size={20} />,       label: "Generating daily schedule",   color: "#a855f7", duration: 1000 },
  { id: 4, icon: <Wallet size={20} />,    label: "Optimizing budget allocation", color: "#f59e0b", duration: 700  },
  { id: 5, icon: <Sparkles size={20} />,  label: "Calculating fatigue score",   color: "#ef4444", duration: 600  },
  { id: 6, icon: <CheckCircle size={20}/>,label: "Finalizing your perfect trip", color: "#22c55e", duration: 500  },
];

export function AIGenerationScreen({ tripParams, onComplete, onError }: AIGenerationScreenProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [statusText, setStatusText] = useState("Initializing AI engine...");

  useEffect(() => {
    let stepIdx = 0;

    const runSteps = async () => {
      // Animate through steps
      for (let i = 0; i < STEPS.length; i++) {
        setActiveStep(i);
        setStatusText(STEPS[i].label + "...");
        await new Promise((r) => setTimeout(r, STEPS[i].duration));
        setCompletedSteps((prev) => [...prev, i]);
        stepIdx = i;
      }

      // Now call the real API
      try {
        const token = localStorage.getItem("traveloop_token");
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api"}/trips/generate`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              destinations: tripParams.destinations,
              start_date:   tripParams.start_date,
              end_date:     tripParams.end_date,
              budget:       tripParams.budget,
              mood:         tripParams.mood,
              travelers:    tripParams.travelers,
            }),
          }
        );
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || "Generation failed");
        onComplete(data.data);
      } catch (err: any) {
        onError(err.message || "AI generation failed. Please try again.");
      }
    };

    runSteps();
  }, []);

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--bg-primary)", padding: "24px",
    }}>
      <div style={{ maxWidth: "520px", width: "100%", textAlign: "center" }}>

        {/* Pulsing AI orb */}
        <div style={{ position: "relative", width: "120px", height: "120px", margin: "0 auto 32px" }}>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ scale: [1, 1.4 + i * 0.2, 1], opacity: [0.4, 0.1, 0.4] }}
              transition={{ duration: 2, delay: i * 0.3, repeat: Infinity }}
              style={{
                position: "absolute", inset: `-${i * 12}px`, borderRadius: "50%",
                background: "var(--brand-gradient)", opacity: 0.3 - i * 0.08,
              }}
            />
          ))}
          <div style={{
            width: "120px", height: "120px", borderRadius: "50%",
            background: "var(--brand-gradient)",
            display: "flex", alignItems: "center", justifyContent: "center",
            position: "relative", zIndex: 1,
          }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles size={44} color="white" />
            </motion.div>
          </div>
        </div>

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ fontSize: "24px", fontWeight: 900, color: "var(--text-primary)", marginBottom: "8px" }}
        >
          AI is building your trip
        </motion.h2>

        <motion.p
          key={statusText}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "40px" }}
        >
          {statusText}
        </motion.p>

        {/* Trip summary pills */}
        <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap", marginBottom: "40px" }}>
          {tripParams.destinations.slice(0, 3).map((d) => (
            <span key={d} style={{
              padding: "6px 14px", borderRadius: "20px", fontSize: "13px", fontWeight: 600,
              background: "rgba(99,102,241,0.1)", color: "var(--brand-primary)",
              border: "1px solid rgba(99,102,241,0.2)",
            }}>
              📍 {d}
            </span>
          ))}
          <span style={{
            padding: "6px 14px", borderRadius: "20px", fontSize: "13px", fontWeight: 600,
            background: "rgba(6,182,212,0.1)", color: "#06b6d4",
            border: "1px solid rgba(6,182,212,0.2)",
          }}>
            ₹{Number(tripParams.budget).toLocaleString("en-IN")}
          </span>
        </div>

        {/* Steps */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {STEPS.map((step, i) => {
            const isDone   = completedSteps.includes(i);
            const isActive = activeStep === i && !isDone;
            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                style={{
                  display: "flex", alignItems: "center", gap: "14px",
                  padding: "12px 16px", borderRadius: "14px",
                  background: isDone ? `${step.color}11` : isActive ? `${step.color}18` : "var(--bg-card)",
                  border: `1px solid ${isDone ? step.color + "33" : isActive ? step.color + "44" : "var(--border)"}`,
                  transition: "all 0.3s",
                }}
              >
                <div style={{
                  width: "32px", height: "32px", borderRadius: "50%",
                  background: isDone ? step.color : isActive ? `${step.color}22` : "var(--bg-primary)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: isDone ? "white" : step.color, flexShrink: 0,
                  transition: "all 0.3s",
                }}>
                  {isDone ? <CheckCircle size={16} /> : step.icon}
                </div>
                <span style={{
                  fontSize: "13px", fontWeight: isDone || isActive ? 600 : 400,
                  color: isDone ? step.color : isActive ? "var(--text-primary)" : "var(--text-muted)",
                  flex: 1, textAlign: "left",
                }}>
                  {step.label}
                </span>
                {isActive && (
                  <motion.div
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    style={{ width: "8px", height: "8px", borderRadius: "50%", background: step.color }}
                  />
                )}
                {isDone && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                    style={{ fontSize: "12px", color: step.color, fontWeight: 700 }}>✓</motion.div>
                )}
              </motion.div>
            );
          })}
        </div>

        <p style={{ marginTop: "28px", fontSize: "12px", color: "var(--text-muted)" }}>
          Powered by Traveloop AI Engine · Zero external AI APIs
        </p>
      </div>
    </div>
  );
}
