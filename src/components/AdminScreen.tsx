"use client";

import { motion } from "framer-motion";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Users, Globe, TrendingUp, Activity, Star, Zap } from "lucide-react";

const USER_GROWTH = [
  { month: "Jan", users: 42000 }, { month: "Feb", users: 58000 }, { month: "Mar", users: 71000 },
  { month: "Apr", users: 89000 }, { month: "May", users: 112000 }, { month: "Jun", users: 148000 },
  { month: "Jul", users: 187000 }, { month: "Aug", users: 241000 },
];

const DESTINATION_TRENDS = [
  { name: "Japan", count: 48200 }, { name: "Bali", count: 41000 }, { name: "Iceland", count: 38500 },
  { name: "Santorini", count: 35200 }, { name: "Marrakech", count: 28800 }, { name: "Patagonia", count: 21600 },
];

const PERSONALITY_DIST = [
  { name: "Creator", value: 28, color: "#06b6d4" },
  { name: "Backpacker", value: 22, color: "#f59e0b" },
  { name: "Luxury", value: 18, color: "#a855f7" },
  { name: "Adventure", value: 16, color: "#ef4444" },
  { name: "Solo", value: 10, color: "#6366f1" },
  { name: "Romantic", value: 6, color: "#ec4899" },
];

const ENGAGEMENT = [
  { day: "Mon", trips: 1200, posts: 3400 }, { day: "Tue", trips: 1800, posts: 4200 },
  { day: "Wed", trips: 1400, posts: 3800 }, { day: "Thu", trips: 2200, posts: 5100 },
  { day: "Fri", trips: 2800, posts: 6800 }, { day: "Sat", trips: 3600, posts: 8200 },
  { day: "Sun", trips: 3100, posts: 7400 },
];

export function AdminScreen() {
  const KPI = [
    { label: "Total Users", value: "2.41M", change: "+18.4%", icon: <Users size={20} />, color: "#6366f1" },
    { label: "Active Trips", value: "384K", change: "+12.1%", icon: <Globe size={20} />, color: "#06b6d4" },
    { label: "Avg Session", value: "24m 12s", change: "+8.7%", icon: <Activity size={20} />, color: "#a855f7" },
    { label: "AI Requests/day", value: "8.2M", change: "+41.3%", icon: <Zap size={20} />, color: "#f59e0b" },
    { label: "Revenue MRR", value: "₹2.4Cr", change: "+24.8%", icon: <TrendingUp size={20} />, color: "#22c55e" },
    { label: "NPS Score", value: "78", change: "+4pts", icon: <Star size={20} />, color: "#ec4899" },
  ];

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }} className="page-enter">
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 900, color: "var(--text-primary)", marginBottom: "6px" }}>
          Analytics <span className="gradient-text">Dashboard</span>
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Real-time platform intelligence and KPIs</p>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px", marginBottom: "28px" }}>
        {KPI.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="stat-card"
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <div style={{ color: kpi.color }}>{kpi.icon}</div>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#22c55e" }}>{kpi.change}</span>
            </div>
            <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--text-primary)", marginBottom: "4px" }}>{kpi.value}</div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{kpi.label}</div>
          </motion.div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px", marginBottom: "24px" }} className="admin-grid">
        <style>{`@media (max-width: 900px) { .admin-grid { grid-template-columns: 1fr !important; } }`}</style>

        {/* User growth */}
        <div className="card" style={{ padding: "24px" }}>
          <div className="section-header" style={{ marginBottom: "20px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" }}>User Growth</h3>
            <span className="badge badge-success">+241K this month</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={USER_GROWTH}>
              <defs>
                <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}K`} />
              <Tooltip formatter={(v: any) => (Number(v) / 1000).toFixed(0) + "K users"} />
              <Area type="monotone" dataKey="users" stroke="#6366f1" strokeWidth={2} fill="url(#userGradient)" dot={{ fill: "#6366f1", r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Personality distribution */}
        <div className="card" style={{ padding: "24px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "20px" }}>User Personalities</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={PERSONALITY_DIST} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                {PERSONALITY_DIST.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v: any) => `${v}%`} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {PERSONALITY_DIST.map((p) => (
              <div key={p.name} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: p.color, flexShrink: 0 }} />
                <span style={{ fontSize: "12px", color: "var(--text-secondary)", flex: 1 }}>{p.name}</span>
                <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>{p.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Destination trends */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }} className="admin-grid2">
        <style>{`@media (max-width: 768px) { .admin-grid2 { grid-template-columns: 1fr !important; } }`}</style>

        <div className="card" style={{ padding: "24px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "20px" }}>Top Destinations</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={DESTINATION_TRENDS} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}K`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "var(--text-secondary)" }} width={80} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: any) => Number(v).toLocaleString() + " trips"} />
              <Bar dataKey="count" fill="url(#destGradient)" radius={[0, 8, 8, 0]} />
              <defs>
                <linearGradient id="destGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card" style={{ padding: "24px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "20px" }}>Daily Engagement</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={ENGAGEMENT}>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Line type="monotone" dataKey="trips" stroke="#6366f1" strokeWidth={2} dot={false} name="Trips" />
              <Line type="monotone" dataKey="posts" stroke="#06b6d4" strokeWidth={2} dot={false} name="Posts" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
