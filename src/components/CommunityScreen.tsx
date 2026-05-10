"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Heart, MessageCircle, Bookmark, Share2, TrendingUp, Users, Globe, Plus } from "lucide-react";
import { MOCK_COMMUNITY_POSTS } from "@/data/mock";
import { CommunityPost } from "@/types";

const CATEGORIES = ["All", "Itineraries", "Tips", "Photography", "Food", "Hidden Gems"];

function PostCard({ post, onLike, onSave }: { post: CommunityPost; onLike: () => void; onSave: () => void }) {
  const timeSince = (date: string) => {
    const d = new Date(date);
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
      style={{ padding: "20px", marginBottom: "16px" }}
    >
      {/* Author */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
        <img src={post.author.avatar} alt={post.author.name} style={{ width: "42px", height: "42px", borderRadius: "50%", border: "2px solid var(--border)" }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--text-primary)" }}>{post.author.name}</div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            {post.author.countriesVisited} countries · {timeSince(post.createdAt)}
          </div>
        </div>
        <button style={{ padding: "6px 14px", borderRadius: "20px", border: "1px solid var(--brand-primary)", background: "rgba(99,102,241,0.08)", color: "var(--brand-primary)", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}>
          Follow
        </button>
      </div>

      {/* Content */}
      <p style={{ fontSize: "14px", color: "var(--text-primary)", lineHeight: 1.6, marginBottom: "14px" }}>{post.content}</p>

      {/* Image */}
      {post.images && post.images[0] && (
        <div style={{ borderRadius: "14px", overflow: "hidden", marginBottom: "14px", height: "220px" }}>
          <img src={post.images[0]} alt="Post" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      )}

      {/* Tags */}
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "14px" }}>
        {post.tags.map((tag) => (
          <span key={tag} className="tag" style={{ fontSize: "11px" }}>#{tag}</span>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", paddingTop: "12px", borderTop: "1px solid var(--border)" }}>
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={onLike}
          style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", cursor: "pointer", color: post.isLiked ? "#ef4444" : "var(--text-muted)", fontSize: "13px", fontWeight: 500, padding: 0 }}
        >
          <Heart size={18} fill={post.isLiked ? "#ef4444" : "none"} /> {post.likes.toLocaleString()}
        </motion.button>
        <button style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "13px", fontWeight: 500, padding: 0 }}>
          <MessageCircle size={18} /> {post.comments}
        </button>
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={onSave}
          style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", cursor: "pointer", color: post.isSaved ? "var(--brand-primary)" : "var(--text-muted)", fontSize: "13px", fontWeight: 500, padding: 0 }}
        >
          <Bookmark size={18} fill={post.isSaved ? "var(--brand-primary)" : "none"} /> {post.saves.toLocaleString()}
        </motion.button>
        <button style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "4px", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "13px", padding: 0 }}>
          <Share2 size={16} />
        </button>
      </div>
    </motion.div>
  );
}

export function CommunityScreen() {
  const [posts, setPosts] = useState<CommunityPost[]>(MOCK_COMMUNITY_POSTS);
  const [activeCategory, setActiveCategory] = useState("All");

  const toggleLike = (id: string) => {
    setPosts((prev) => prev.map((p) => p.id === id ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 } : p));
  };

  const toggleSave = (id: string) => {
    setPosts((prev) => prev.map((p) => p.id === id ? { ...p, isSaved: !p.isSaved, saves: p.isSaved ? p.saves - 1 : p.saves + 1 } : p));
  };

  return (
    <div style={{ padding: "24px", maxWidth: "900px", margin: "0 auto" }} className="page-enter">
      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 900, color: "var(--text-primary)", marginBottom: "6px" }}>
          Travel <span className="gradient-text">Community</span>
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Inspiring stories from real travelers</p>
      </div>

      {/* Stats banner */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "24px" }}>
        {[
          { label: "Community Members", value: "2.4M+", icon: <Users size={18} color="#6366f1" /> },
          { label: "Shared Itineraries", value: "180K+", icon: <Globe size={18} color="#06b6d4" /> },
          { label: "Trending Posts", value: "48K", icon: <TrendingUp size={18} color="#a855f7" /> },
        ].map((stat) => (
          <div key={stat.label} className="card" style={{ padding: "16px", textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "6px" }}>{stat.icon}</div>
            <div style={{ fontWeight: 800, fontSize: "18px", color: "var(--text-primary)" }}>{stat.value}</div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "24px" }} className="community-grid">
        <style>{`@media (max-width: 900px) { .community-grid { grid-template-columns: 1fr !important; } }`}</style>

        <div>
          {/* Category filter */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "20px", overflowX: "auto", paddingBottom: "4px" }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{ padding: "7px 16px", borderRadius: "20px", border: `1px solid ${activeCategory === cat ? "var(--brand-primary)" : "var(--border)"}`, background: activeCategory === cat ? "rgba(99,102,241,0.12)" : "var(--bg-card)", color: activeCategory === cat ? "var(--brand-primary)" : "var(--text-secondary)", cursor: "pointer", fontSize: "12px", fontWeight: 500, whiteSpace: "nowrap", transition: "all 0.2s" }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* New Post button */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="card"
            style={{ padding: "16px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }}
          >
            <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "var(--bg-primary)", border: "2px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Plus size={18} color="var(--text-muted)" />
            </div>
            <div style={{ flex: 1, padding: "10px 16px", borderRadius: "20px", background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-muted)", fontSize: "13px" }}>
              Share your travel story...
            </div>
            <button className="btn-primary" style={{ padding: "8px 16px", fontSize: "12px" }}>Post</button>
          </motion.div>

          {/* Posts */}
          <AnimatePresence>
            {posts.map((post) => (
              <PostCard key={post.id} post={post} onLike={() => toggleLike(post.id)} onSave={() => toggleSave(post.id)} />
            ))}
          </AnimatePresence>
        </div>

        {/* Right sidebar */}
        <div>
          {/* Trending creators */}
          <div className="card" style={{ padding: "20px", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "16px" }}>Top Creators</h3>
            {[
              { name: "Ananya Singh", trips: 42, followers: "89K", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=ananya" },
              { name: "Priya Sharma", trips: 31, followers: "45K", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=priya" },
              { name: "Rahul Kapoor", trips: 18, followers: "8.9K", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=rahul" },
            ].map((creator) => (
              <div key={creator.name} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                <img src={creator.avatar} alt={creator.name} style={{ width: "36px", height: "36px", borderRadius: "50%", border: "2px solid var(--border)" }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>{creator.name}</div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{creator.followers} followers · {creator.trips} trips</div>
                </div>
                <button style={{ padding: "4px 10px", borderRadius: "16px", border: "1px solid var(--brand-primary)", background: "transparent", color: "var(--brand-primary)", cursor: "pointer", fontSize: "11px" }}>Follow</button>
              </div>
            ))}
          </div>

          {/* Trending tags */}
          <div className="card" style={{ padding: "20px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "12px" }}>Trending Tags</h3>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {["#Japan2024", "#BaliVibes", "#Iceland", "#GoldenHour", "#OffTheBeatenPath", "#SoloTravel", "#CreatorMode", "#BudgetTravel"].map((tag) => (
                <span key={tag} className="tag" style={{ cursor: "pointer" }}>{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
