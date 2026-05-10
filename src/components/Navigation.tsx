"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  LayoutDashboard, Map, Search, Users, BookOpen, Package,
  BarChart3, Sparkles, Globe, LogOut, Moon, Sun, Menu, X,
  User, PlusCircle, Compass, Shield
} from "lucide-react";
import { useApp } from "@/context/AppContext";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { id: "discover", label: "Discover", icon: Compass, href: "/discover" },
  { id: "trips", label: "My Trips", icon: Map, href: "/trips" },
  { id: "itinerary", label: "Itinerary", icon: Globe, href: "/itinerary" },
  { id: "budget", label: "Budget", icon: BarChart3, href: "/budget" },
  { id: "community", label: "Community", icon: Users, href: "/community" },
  { id: "journal", label: "Journal", icon: BookOpen, href: "/journal" },
  { id: "packing", label: "Packing", icon: Package, href: "/packing" },
  { id: "creator", label: "Creator Mode", icon: Sparkles, href: "/creator" },
  { id: "profile", label: "Profile", icon: User, href: "/profile" },
  { id: "admin", label: "Analytics", icon: BarChart3, href: "/admin" },
  { id: "safety", label: "AI Safety", icon: Shield, href: "/safety" },
];

const BOTTOM_NAV = [
  { id: "dashboard", label: "Home", icon: LayoutDashboard, href: "/" },
  { id: "discover", label: "Discover", icon: Search, href: "/discover" },
  { id: "trips", label: "Trips", icon: Map, href: "/trips" },
  { id: "community", label: "Community", icon: Users, href: "/community" },
  { id: "profile", label: "Profile", icon: User, href: "/profile" },
];

export function Sidebar() {
  const { activeTab, setActiveTab, isDarkMode, toggleDarkMode, isSidebarOpen, toggleSidebar, user, logout } = useApp();

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleSidebar}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 40, display: "block" }}
            className="lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
        {/* Logo */}
        <div style={{ padding: "24px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "12px", background: "var(--brand-gradient-vivid)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Globe size={18} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: "16px", background: "var(--brand-gradient)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Traveloop
              </div>
              <div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 500 }}>AI Travel OS</div>
            </div>
          </div>
          <button className="lg:hidden" onClick={toggleSidebar} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}>
            <X size={18} />
          </button>
        </div>

        {/* User card */}
        {user && (
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {user.profile_image ? (
                <img src={user.profile_image} alt={user.name} style={{ width: "38px", height: "38px", borderRadius: "50%", border: "2px solid var(--brand-primary)", objectFit: "cover" }} />
              ) : (
                <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "var(--brand-gradient)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: 700, color: "white" }}>{user.name?.charAt(0)?.toUpperCase()}</div>
              )}
              <div style={{ overflow: "hidden" }}>
                <div style={{ fontWeight: 600, fontSize: "13px", color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.name}</div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{user.travel_personality || "Explorer"}</div>
              </div>
            </div>
          </div>
        )}

        {/* New Trip button */}
        <div style={{ padding: "12px 16px" }}>
          <Link href="/trips/new" onClick={() => setActiveTab("new-trip")}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px", borderRadius: "12px", background: "var(--brand-gradient)", color: "white", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
            >
              <PlusCircle size={16} />
              Plan New Trip
            </motion.div>
          </Link>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: "auto", padding: "4px 8px" }}>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <Link key={item.id} href={item.href}>
                <motion.div
                  onClick={() => { setActiveTab(item.id); if (isSidebarOpen) toggleSidebar(); }}
                  whileHover={{ x: 2 }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "9px 12px",
                    borderRadius: "10px",
                    marginBottom: "2px",
                    cursor: "pointer",
                    background: isActive ? "rgba(99,102,241,0.12)" : "transparent",
                    color: isActive ? "var(--brand-primary)" : "var(--text-secondary)",
                    fontWeight: isActive ? 600 : 400,
                    fontSize: "13px",
                    transition: "all 0.2s",
                    borderLeft: isActive ? "3px solid var(--brand-primary)" : "3px solid transparent",
                  }}
                >
                  <Icon size={16} />
                  {item.label}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "4px" }}>
          <button
            onClick={toggleDarkMode}
            style={{ display: "flex", alignItems: "center", gap: "10px", padding: "9px 12px", borderRadius: "10px", background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", fontSize: "13px", width: "100%", textAlign: "left" }}
          >
            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
            {isDarkMode ? "Light Mode" : "Dark Mode"}
          </button>
          <button
            onClick={logout}
            style={{ display: "flex", alignItems: "center", gap: "10px", padding: "9px 12px", borderRadius: "10px", background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: "13px", width: "100%", textAlign: "left" }}
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}

export function BottomNav() {
  const { activeTab, setActiveTab } = useApp();

  return (
    <nav className="bottom-nav" style={{ justifyContent: "space-around", alignItems: "center" }}>
      {BOTTOM_NAV.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <Link key={item.id} href={item.href}>
            <motion.div
              onClick={() => setActiveTab(item.id)}
              whileTap={{ scale: 0.9 }}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "3px",
                padding: "6px 16px",
                borderRadius: "12px",
                cursor: "pointer",
                color: isActive ? "var(--brand-primary)" : "var(--text-muted)",
                transition: "all 0.2s",
              }}
            >
              <div style={{ position: "relative" }}>
                <Icon size={22} />
                {isActive && (
                  <motion.div
                    layoutId="bottomNavActive"
                    style={{ position: "absolute", bottom: "-4px", left: "50%", transform: "translateX(-50%)", width: "4px", height: "4px", borderRadius: "50%", background: "var(--brand-primary)" }}
                  />
                )}
              </div>
              <span style={{ fontSize: "10px", fontWeight: isActive ? 600 : 400 }}>{item.label}</span>
            </motion.div>
          </Link>
        );
      })}
    </nav>
  );
}

export function TopBar() {
  const { toggleSidebar, isDarkMode, toggleDarkMode, user } = useApp();

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: "1px solid var(--border)", background: "var(--sidebar-bg)", backdropFilter: "blur(20px)", position: "sticky", top: 0, zIndex: 30 }}>
      <button
        onClick={toggleSidebar}
        className="lg:hidden"
        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-primary)", padding: "4px" }}
      >
        <Menu size={22} />
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginLeft: "auto" }}>
        <button onClick={toggleDarkMode} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", padding: "8px", cursor: "pointer", color: "var(--text-secondary)", display: "flex" }}>
          {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        {user && (
          <div style={{ width: "34px", height: "34px", borderRadius: "50%", border: "2px solid var(--brand-primary)", cursor: "pointer", overflow: "hidden" }}>
            {user.profile_image ? (
              <img src={user.profile_image} alt={user.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{ width: "100%", height: "100%", background: "var(--brand-gradient)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "14px" }}>{user.name?.charAt(0)?.toUpperCase()}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
