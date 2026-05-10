"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Bot, X, Send, Sparkles, MapPin, Wallet, Backpack, RefreshCw } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { aiAPI } from "@/lib/api";

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: Date;
  error?: boolean;
}

const QUICK_PROMPTS = [
  { icon: "🗺️", text: "Plan a 5-day Bali trip under ₹80,000" },
  { icon: "❄️", text: "Best time to visit Iceland?" },
  { icon: "🎒", text: "What to pack for Japan in April?" },
  { icon: "💰", text: "Budget hotels in Santorini" },
];

export function AIAssistant() {
  const { isAIAssistantOpen, toggleAIAssistant, currentTrip } = useApp();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "ai",
      content: "Hi! I'm Loopi 🌏, your AI travel companion powered by real intelligence.\n\nI can help you plan trips, optimize budgets, find hidden gems, and more.\n\nWhat adventure are we planning today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Focus input when panel opens
  useEffect(() => {
    if (isAIAssistantOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isAIAssistantOpen]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      // Build trip context for smarter responses
      const context = currentTrip
        ? {
            destination: currentTrip.cities?.map((c: any) => c.city_name).join(", "),
            budget: currentTrip.budget,
            mood: currentTrip.mood,
          }
        : {};

      const res: any = await aiAPI.chat(text, context);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "ai",
          content: res.data?.content || "I'm here to help! Could you rephrase that?",
          timestamp: new Date(),
        },
      ]);
    } catch {
      // Fallback to intelligent local responses if backend not connected
      const response = getLocalResponse(text);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "ai",
          content: response,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const clearChat = () => {
    setMessages([{
      id: "1",
      role: "ai",
      content: "Chat cleared! How can I help you plan your next adventure? 🌍",
      timestamp: new Date(),
    }]);
  };

  return (
    <>
      {/* FAB */}
      <motion.button
        className="ai-fab"
        onClick={toggleAIAssistant}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Open AI Assistant"
        id="ai-assistant-fab"
      >
        <AnimatePresence mode="wait">
          {isAIAssistantOpen ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X size={22} />
            </motion.div>
          ) : (
            <motion.div key="bot" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <Bot size={22} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isAIAssistantOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            style={{
              position: "fixed",
              bottom: "148px",
              right: "16px",
              width: "390px",
              maxWidth: "calc(100vw - 32px)",
              zIndex: 200,
              borderRadius: "24px",
              overflow: "hidden",
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-strong)",
              boxShadow: "var(--shadow-lg)",
              display: "flex",
              flexDirection: "column",
              maxHeight: "560px",
            }}
          >
            {/* Header */}
            <div style={{ background: "var(--brand-gradient-vivid)", padding: "16px 20px", display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Sparkles size={20} color="white" />
              </div>
              <div>
                <div style={{ color: "white", fontWeight: 700, fontSize: "15px" }}>Loopi AI</div>
                <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "12px" }}>Powered by Gemini · Always learning</div>
              </div>
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#22c55e", animation: "pulse 2s infinite" }} />
                  <span style={{ color: "rgba(255,255,255,0.8)", fontSize: "11px" }}>Online</span>
                </div>
                <button onClick={clearChat} title="Clear chat" style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "8px", padding: "4px 6px", cursor: "pointer", color: "white", display: "flex", alignItems: "center" }}>
                  <RefreshCw size={13} />
                </button>
              </div>
            </div>

            {/* Quick categories */}
            <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--border)", display: "flex", gap: "6px", overflowX: "auto" }}>
              {[
                { icon: <MapPin size={11} />, text: "Destinations" },
                { icon: <Wallet size={11} />, text: "Budget Tips" },
                { icon: <Backpack size={11} />, text: "Packing" },
              ].map((q) => (
                <button
                  key={q.text}
                  onClick={() => sendMessage(q.text)}
                  style={{ display: "flex", alignItems: "center", gap: "4px", padding: "4px 12px", borderRadius: "20px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-secondary)", fontSize: "11px", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}
                >
                  {q.icon} {q.text}
                </button>
              ))}
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ display: "flex", gap: "8px", flexDirection: msg.role === "user" ? "row-reverse" : "row" }}
                >
                  {msg.role === "ai" && (
                    <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "var(--brand-gradient)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Bot size={14} color="white" />
                    </div>
                  )}
                  <div
                    style={{
                      maxWidth: "80%",
                      padding: "10px 14px",
                      borderRadius: msg.role === "user" ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
                      background: msg.role === "user" ? "var(--brand-gradient)" : "var(--bg-primary)",
                      color: msg.role === "user" ? "white" : "var(--text-primary)",
                      fontSize: "13px",
                      lineHeight: "1.55",
                      border: msg.role === "ai" ? "1px solid var(--border)" : "none",
                      whiteSpace: "pre-line",
                    }}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "flex", gap: "8px" }}>
                  <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "var(--brand-gradient)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Bot size={14} color="white" />
                  </div>
                  <div style={{ padding: "12px 16px", borderRadius: "4px 16px 16px 16px", background: "var(--bg-primary)", border: "1px solid var(--border)" }}>
                    <div className="ai-typing"><span /><span /><span /></div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick prompt suggestions */}
            <div style={{ padding: "8px 16px", display: "flex", gap: "6px", overflowX: "auto", borderTop: "1px solid var(--border)" }}>
              {QUICK_PROMPTS.slice(0, 2).map((p) => (
                <button
                  key={p.text}
                  onClick={() => sendMessage(p.text)}
                  style={{ padding: "5px 10px", borderRadius: "16px", border: "1px solid var(--border)", background: "rgba(99,102,241,0.08)", color: "var(--brand-primary)", fontSize: "10px", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}
                >
                  {p.icon} {p.text}
                </button>
              ))}
            </div>

            {/* Input */}
            <div style={{ padding: "12px 16px", display: "flex", gap: "8px" }}>
              <input
                ref={inputRef}
                id="ai-chat-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
                placeholder="Ask Loopi anything..."
                className="input"
                style={{ fontSize: "13px", borderRadius: "20px", padding: "10px 16px" }}
                disabled={isTyping}
              />
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => sendMessage(input)}
                disabled={isTyping || !input.trim()}
                style={{ width: "40px", height: "40px", borderRadius: "50%", background: input.trim() ? "var(--brand-gradient)" : "var(--border)", border: "none", cursor: input.trim() ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.2s" }}
              >
                <Send size={16} color="white" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Local fallback responses when backend is offline
function getLocalResponse(text: string): string {
  const msg = text.toLowerCase();
  if (msg.includes("bali")) return "🌴 Bali 5 days under ₹80k:\n\n**Day 1-2**: Ubud (rice terraces, monkey forest, Tegalalang)\n**Day 3**: Kintamani + Tirtha Empul temple\n**Day 4**: Seminyak (beach, sunset strip)\n**Day 5**: Canggu (cafés, surf, waterfalls)\n\n✈️ Flights: ~₹22k | 🏨 Hotel: ~₹24k | 🍜 Food+Activities: ~₹20k";
  if (msg.includes("iceland")) return "🇮🇸 Iceland has two magic windows:\n\n🌟 **Winter (Oct–Feb)**: Northern Lights, snow landscapes, Blue Lagoon\n☀️ **Summer (Jun–Aug)**: Midnight sun, all roads open, hiking season\n\nBest: **February** (lights + fewer crowds) or **July** (maximum daylight)";
  if (msg.includes("pack") || msg.includes("japan")) return "🎒 Japan April packing essentials:\n\n👟 Comfortable walking shoes (15,000+ steps/day)\n🧥 Light layers — mornings are cool (10–15°C)\n💳 Suica/Pasmo IC card — set up before you go\n📶 Pocket WiFi or eSIM\n💴 Cash ¥50,000+ — many places still cash-only\n☂️ Compact umbrella (spring showers)";
  if (msg.includes("budget") || msg.includes("money")) return "💰 Smart travel budgeting tips:\n\n1. Book flights 8–12 weeks early — save 30%\n2. Stay in guesthouses over hotels for authenticity\n3. Eat lunch at restaurants, dinner at local spots\n4. Use public transit day passes vs taxis\n5. Pre-book attractions online — often 20% cheaper\n\nWant me to create a budget breakdown for your trip?";
  return "✨ I'm Loopi, your AI travel companion!\n\nI can help with:\n🗺️ Itinerary planning\n💰 Budget optimization\n🌤️ Best travel timing\n🍜 Local food guides\n🏨 Accommodation advice\n🎒 Packing lists\n\nWhat destination are you dreaming of?";
}
