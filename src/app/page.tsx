"use client";

import { useApp } from "@/context/AppContext";
import { AuthScreen } from "@/components/AuthScreen";
import { Sidebar, BottomNav, TopBar } from "@/components/Navigation";
import { AIAssistant } from "@/components/AIAssistant";
import { Dashboard } from "@/components/Dashboard";
import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";

function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="sidebar-layout">
      <Sidebar />
      <div className="main-content">
        <TopBar />
        <AnimatePresence mode="wait">
          <motion.main
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            style={{ paddingBottom: "80px" }}
          >
            {children}
          </motion.main>
        </AnimatePresence>
        <BottomNav />
        <AIAssistant />
      </div>
    </div>
  );
}

export default function Home() {
  const { isAuthenticated } = useApp();

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return (
    <AppShell>
      <Dashboard />
    </AppShell>
  );
}
