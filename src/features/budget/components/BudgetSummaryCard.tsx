"use client";

import { motion } from "framer-motion";
import { TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { HEALTH_COLORS } from "@/lib/constants";
import type { BudgetOptimizerReport } from "../types";

interface BudgetSummaryCardProps {
  totalBudget: number;
  totalSpent: number;
  report?: BudgetOptimizerReport | null;
}

export function BudgetSummaryCard({ totalBudget, totalSpent, report }: BudgetSummaryCardProps) {
  const remaining   = totalBudget - totalSpent;
  const percentUsed = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
  const healthLabel = report?.summary?.healthLabel;
  const healthColor = healthLabel ? HEALTH_COLORS[healthLabel] : "#22c55e";

  return (
    <div className="card" style={{ padding: "24px", marginBottom: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
        <Wallet size={20} color="var(--brand-primary)" />
        <h3 style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "16px" }}>Budget Overview</h3>
        {healthLabel && (
          <span style={{
            marginLeft: "auto", fontSize: "11px", fontWeight: 700,
            padding: "3px 10px", borderRadius: "20px",
            background: `${healthColor}22`, color: healthColor,
            border: `1px solid ${healthColor}44`,
          }}>
            {healthLabel}
          </span>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "20px" }}>
        {[
          { label: "Total Budget",  value: totalBudget, icon: <Wallet size={14} />,       color: "#6366f1" },
          { label: "Total Spent",   value: totalSpent,  icon: <TrendingDown size={14} />, color: totalSpent > totalBudget ? "#ef4444" : "#f59e0b" },
          { label: "Remaining",     value: remaining,   icon: <TrendingUp size={14} />,   color: remaining < 0 ? "#ef4444" : "#22c55e" },
        ].map((stat) => (
          <div key={stat.label} style={{
            padding: "14px", borderRadius: "14px",
            background: `${stat.color}11`, border: `1px solid ${stat.color}22`,
            textAlign: "center",
          }}>
            <div style={{ color: stat.color, display: "flex", justifyContent: "center", marginBottom: "6px" }}>
              {stat.icon}
            </div>
            <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--text-primary)" }}>
              ₹{Math.abs(Number(stat.value)).toLocaleString("en-IN")}
            </div>
            <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Budget used</span>
          <span style={{ fontSize: "12px", fontWeight: 700, color: percentUsed > 90 ? "#ef4444" : "var(--text-primary)" }}>
            {percentUsed}%
          </span>
        </div>
        <div style={{ height: "8px", borderRadius: "10px", background: "var(--bg-primary)", overflow: "hidden" }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, percentUsed)}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{
              height: "100%", borderRadius: "10px",
              background: percentUsed > 90 ? "#ef4444" : percentUsed > 70 ? "#f59e0b" : "linear-gradient(90deg, #6366f1, #06b6d4)",
            }}
          />
        </div>
      </div>

      {/* Projection warning */}
      {report?.projection?.willExceedBudget && (
        <div style={{
          marginTop: "14px", padding: "10px 14px", borderRadius: "10px",
          background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
          display: "flex", gap: "8px", alignItems: "center",
        }}>
          <TrendingDown size={14} color="#ef4444" />
          <span style={{ fontSize: "12px", color: "#ef4444" }}>
            At current burn rate, you&apos;ll exceed budget by{" "}
            <strong>₹{report.projection.projectedOverrun.toLocaleString("en-IN")}</strong>
          </span>
        </div>
      )}
    </div>
  );
}
