"use client";
import { useApp } from "@/context/AppContext";
import { Sidebar, BottomNav, TopBar } from "@/components/Navigation";
import { AIAssistant } from "@/components/AIAssistant";
import { JournalScreen } from "@/components/JournalScreen";
import { motion } from "framer-motion";
import { AuthScreen } from "@/components/AuthScreen";

export default function JournalPage() {
  const { isAuthenticated } = useApp();
  if (!isAuthenticated) return <AuthScreen />;
  return (
    <div className="sidebar-layout">
      <Sidebar />
      <div className="main-content">
        <TopBar />
        <motion.main initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ paddingBottom: "80px" }}>
          <JournalScreen />
        </motion.main>
        <BottomNav />
        <AIAssistant />
      </div>
    </div>
  );
}
