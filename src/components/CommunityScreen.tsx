"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useCallback } from "react";
import { Heart, MessageCircle, Bookmark, Share2, TrendingUp, Users, Globe, Plus, X, Send, CheckCircle, UserPlus, UserCheck } from "lucide-react";
import { MOCK_COMMUNITY_POSTS } from "@/data/mock";
import { CommunityPost } from "@/types";
import { useApp } from "@/context/AppContext";

const CATEGORIES = ["All", "Itineraries", "Tips", "Photography", "Food", "Hidden Gems"];

// ── Toast ──────────────────────────────────────────────────
function Toast({ msg, onDone }: { msg: string; onDone: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
      onAnimationComplete={() => setTimeout(onDone, 1800)}
      style={{ position: "fixed", bottom: "90px", left: "50%", transform: "translateX(-50%)", zIndex: 9999, padding: "10px 20px", borderRadius: "30px", background: "rgba(34,197,94,0.95)", color: "white", fontWeight: 600, fontSize: "13px", display: "flex", alignItems: "center", gap: "7px", boxShadow: "0 8px 24px rgba(0,0,0,0.3)", backdropFilter: "blur(10px)", whiteSpace: "nowrap" }}>
      <CheckCircle size={15} /> {msg}
    </motion.div>
  );
}

// ── Comment Drawer ─────────────────────────────────────────
function CommentDrawer({ postId, onClose }: { postId: string; onClose: () => void }) {
  const [comments, setComments] = useState([
    { id: "c1", author: "Priya S.", text: "This is absolutely stunning! Adding to my bucket list 🌟", time: "2h ago" },
    { id: "c2", author: "Rahul K.", text: "Which month did you visit? Planning for October.", time: "5h ago" },
    { id: "c3", author: "Ananya M.", text: "The budget breakdown is super helpful, thank you!", time: "1d ago" },
  ]);
  const [input, setInput] = useState("");

  const postComment = () => {
    if (!input.trim()) return;
    setComments(p => [{ id: Date.now().toString(), author: "You", text: input.trim(), time: "Just now" }, ...p]);
    setInput("");
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, zIndex: 5000, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 300 }}
        style={{ position: "absolute", bottom: 0, left: 0, right: 0, maxHeight: "70vh", background: "var(--bg-card)", borderRadius: "24px 24px 0 0", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <span style={{ fontWeight: 700, fontSize: "15px", color: "var(--text-primary)" }}>💬 Comments ({comments.length})</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={18} /></button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 20px", display: "flex", flexDirection: "column", gap: "12px" }}>
          {comments.map(c => (
            <div key={c.id} style={{ display: "flex", gap: "10px" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--brand-gradient)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "12px", fontWeight: 700, flexShrink: 0 }}>{c.author[0]}</div>
              <div style={{ flex: 1, padding: "10px 14px", borderRadius: "4px 14px 14px 14px", background: "var(--bg-primary)", border: "1px solid var(--border)" }}>
                <div style={{ fontWeight: 700, fontSize: "12px", color: "var(--brand-primary)", marginBottom: "3px" }}>{c.author} <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>· {c.time}</span></div>
                <div style={{ fontSize: "13px", color: "var(--text-primary)", lineHeight: 1.5 }}>{c.text}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)", display: "flex", gap: "8px", flexShrink: 0 }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && postComment()}
            placeholder="Write a comment…" className="input" style={{ flex: 1, fontSize: "13px", padding: "9px 14px" }} />
          <motion.button whileTap={{ scale: 0.9 }} onClick={postComment}
            style={{ width: "38px", height: "38px", borderRadius: "12px", background: "var(--brand-gradient)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Send size={15} color="white" />
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Share Modal ────────────────────────────────────────────
function ShareModal({ postId, onClose }: { postId: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const link = `${typeof window !== "undefined" ? window.location.origin : ""}/community/post/${postId}`;

  const copy = async () => {
    try { await navigator.clipboard.writeText(link); } catch { }
    setCopied(true);
    setTimeout(onClose, 1200);
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: "Check this trip on Traveloop!", url: link }); onClose(); } catch { }
    } else { copy(); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, zIndex: 5000, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        style={{ width: "100%", maxWidth: "360px", background: "var(--bg-card)", borderRadius: "20px", padding: "24px", border: "1px solid var(--border)" }}>
        <div style={{ fontWeight: 800, fontSize: "16px", color: "var(--text-primary)", marginBottom: "16px" }}>📤 Share Post</div>
        <div style={{ padding: "10px 14px", borderRadius: "10px", background: "var(--bg-primary)", border: "1px solid var(--border)", fontSize: "12px", color: "var(--text-muted)", marginBottom: "14px", wordBreak: "break-all" }}>{link}</div>
        <div style={{ display: "flex", gap: "10px" }}>
          <motion.button whileTap={{ scale: 0.96 }} onClick={copy} className="btn-secondary" style={{ flex: 1, fontSize: "13px" }}>
            {copied ? "✅ Copied!" : "📋 Copy Link"}
          </motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={nativeShare} className="btn-primary" style={{ flex: 1, fontSize: "13px" }}>
            🔗 Share
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Post Card ──────────────────────────────────────────────
function PostCard({ post, onLike, onSave, onFollow }: {
  post: CommunityPost & { isFollowing?: boolean };
  onLike: () => void; onSave: () => void; onFollow: () => void;
}) {
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare]       = useState(false);

  const timeSince = (date: string) => {
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <>
      <AnimatePresence>
        {showComments && <CommentDrawer postId={post.id} onClose={() => setShowComments(false)} />}
        {showShare    && <ShareModal    postId={post.id} onClose={() => setShowShare(false)} />}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ padding: "20px", marginBottom: "16px" }}>
        {/* Author */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
          <img src={post.author.avatar} alt={post.author.name} style={{ width: "42px", height: "42px", borderRadius: "50%", border: "2px solid var(--border)" }} onError={e => { e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${post.author.name}`; }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--text-primary)" }}>{post.author.name}</div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{post.author.countriesVisited} countries · {timeSince(post.createdAt)}</div>
          </div>
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.94 }} onClick={onFollow}
            style={{ padding: "6px 14px", borderRadius: "20px", border: `1px solid ${post.isFollowing ? "var(--border)" : "var(--brand-primary)"}`, background: post.isFollowing ? "var(--bg-primary)" : "rgba(99,102,241,0.1)", color: post.isFollowing ? "var(--text-muted)" : "var(--brand-primary)", cursor: "pointer", fontSize: "12px", fontWeight: 600, display: "flex", alignItems: "center", gap: "5px", transition: "all 0.2s" }}>
            {post.isFollowing ? <><UserCheck size={12} /> Following</> : <><UserPlus size={12} /> Follow</>}
          </motion.button>
        </div>

        <p style={{ fontSize: "14px", color: "var(--text-primary)", lineHeight: 1.6, marginBottom: "14px" }}>{post.content}</p>

        {post.images?.[0] && (
          <div style={{ borderRadius: "14px", overflow: "hidden", marginBottom: "14px", height: "220px" }}>
            <img src={post.images[0]} alt="Post" style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={e => { (e.currentTarget.parentElement as HTMLElement).style.display = "none"; }} />
          </div>
        )}

        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "14px" }}>
          {post.tags.map(tag => <span key={tag} className="tag" style={{ fontSize: "11px" }}>#{tag}</span>)}
        </div>

        {/* Action bar */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px", paddingTop: "12px", borderTop: "1px solid var(--border)" }}>
          {/* Like */}
          <motion.button whileTap={{ scale: 0.75 }} onClick={onLike}
            style={{ display: "flex", alignItems: "center", gap: "5px", background: "none", border: "none", cursor: "pointer", color: post.isLiked ? "#ef4444" : "var(--text-muted)", fontSize: "13px", fontWeight: 500, padding: "6px 10px", borderRadius: "10px", transition: "all 0.15s" }}>
            <motion.div animate={{ scale: post.isLiked ? [1, 1.4, 1] : 1 }} transition={{ duration: 0.3 }}>
              <Heart size={18} fill={post.isLiked ? "#ef4444" : "none"} />
            </motion.div>
            {post.likes.toLocaleString()}
          </motion.button>

          {/* Comment */}
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowComments(true)}
            style={{ display: "flex", alignItems: "center", gap: "5px", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "13px", fontWeight: 500, padding: "6px 10px", borderRadius: "10px", transition: "background 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-primary)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "none"; }}>
            <MessageCircle size={18} /> {post.comments}
          </motion.button>

          {/* Save */}
          <motion.button whileTap={{ scale: 0.85 }} onClick={onSave}
            style={{ display: "flex", alignItems: "center", gap: "5px", background: "none", border: "none", cursor: "pointer", color: post.isSaved ? "var(--brand-primary)" : "var(--text-muted)", fontSize: "13px", fontWeight: 500, padding: "6px 10px", borderRadius: "10px", transition: "all 0.15s" }}>
            <Bookmark size={18} fill={post.isSaved ? "var(--brand-primary)" : "none"} />
            {post.saves?.toLocaleString() ?? 0}
          </motion.button>

          {/* Share */}
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowShare(true)}
            style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "4px", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "13px", padding: "6px 10px", borderRadius: "10px", transition: "background 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-primary)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "none"; }}>
            <Share2 size={16} /> Share
          </motion.button>
        </div>
      </motion.div>
    </>
  );
}

// ── Main Screen ────────────────────────────────────────────
export function CommunityScreen() {
  const { user } = useApp();
  const [posts, setPosts] = useState(
    MOCK_COMMUNITY_POSTS.map(p => ({ ...p, isFollowing: false }))
  );
  const [activeCategory, setActiveCategory] = useState("All");
  const [toast, setToast] = useState("");
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPostText, setNewPostText] = useState("");
  const [followedCreators, setFollowedCreators] = useState<Record<string, boolean>>({});

  const showToast = (msg: string) => { setToast(msg); };

  const toggleLike = useCallback((id: string) => {
    setPosts(prev => prev.map(p => p.id === id
      ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 }
      : p));
  }, []);

  const toggleSave = useCallback((id: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id !== id) return p;
      const saving = !p.isSaved;
      showToast(saving ? "✅ Post saved to your collection" : "Removed from saved");
      return { ...p, isSaved: saving, saves: (p.saves ?? 0) + (saving ? 1 : -1) };
    }));
  }, []);

  const toggleFollow = useCallback((postId: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      const following = !p.isFollowing;
      showToast(following ? `✅ Following ${p.author.name}` : `Unfollowed ${p.author.name}`);
      return { ...p, isFollowing: following };
    }));
  }, []);

  const toggleFollowCreator = (name: string) => {
    setFollowedCreators(prev => {
      const next = { ...prev, [name]: !prev[name] };
      showToast(next[name] ? `✅ Following ${name}` : `Unfollowed ${name}`);
      return next;
    });
  };

  const submitPost = () => {
    if (!newPostText.trim()) return;
    const newPost: any = {
      id: Date.now().toString(),
      author: { name: user?.name || "You", avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name || "You"}`, countriesVisited: 1 },
      content: newPostText.trim(),
      images: [], tags: ["travel"], likes: 0, comments: 0, saves: 0,
      isLiked: false, isSaved: false, isFollowing: false,
      createdAt: new Date().toISOString(),
    };
    setPosts(prev => [newPost, ...prev]);
    setNewPostText(""); setShowNewPost(false);
    showToast("✅ Post shared with the community!");
  };

  return (
    <div style={{ padding: "24px", maxWidth: "900px", margin: "0 auto" }} className="page-enter">
      <AnimatePresence>{toast && <Toast msg={toast} onDone={() => setToast("")} />}</AnimatePresence>

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
        ].map(stat => (
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
            {CATEGORIES.map(cat => (
              <motion.button key={cat} whileTap={{ scale: 0.96 }} onClick={() => setActiveCategory(cat)}
                style={{ padding: "7px 16px", borderRadius: "20px", border: `1px solid ${activeCategory === cat ? "var(--brand-primary)" : "var(--border)"}`, background: activeCategory === cat ? "rgba(99,102,241,0.12)" : "var(--bg-card)", color: activeCategory === cat ? "var(--brand-primary)" : "var(--text-secondary)", cursor: "pointer", fontSize: "12px", fontWeight: 500, whiteSpace: "nowrap", transition: "all 0.2s" }}>
                {cat}
              </motion.button>
            ))}
          </div>

          {/* New Post box */}
          <div className="card" style={{ padding: "16px", marginBottom: "20px" }}>
            {showNewPost ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <textarea value={newPostText} onChange={e => setNewPostText(e.target.value)}
                  placeholder="Share your travel story with the community…" rows={3}
                  className="input" style={{ resize: "none", fontSize: "13px" }} />
                <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                  <button onClick={() => setShowNewPost(false)} className="btn-secondary" style={{ fontSize: "12px", padding: "7px 16px" }}>Cancel</button>
                  <motion.button whileTap={{ scale: 0.96 }} onClick={submitPost} className="btn-primary" style={{ fontSize: "12px", padding: "7px 16px" }}>Post</motion.button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }} onClick={() => setShowNewPost(true)}>
                <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "var(--bg-primary)", border: "2px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Plus size={18} color="var(--text-muted)" />
                </div>
                <div style={{ flex: 1, padding: "10px 16px", borderRadius: "20px", background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-muted)", fontSize: "13px" }}>
                  Share your travel story…
                </div>
                <button className="btn-primary" style={{ padding: "8px 16px", fontSize: "12px" }}>Post</button>
              </div>
            )}
          </div>

          {/* Posts */}
          <AnimatePresence>
            {posts.map(post => (
              <PostCard key={post.id} post={post}
                onLike={() => toggleLike(post.id)}
                onSave={() => toggleSave(post.id)}
                onFollow={() => toggleFollow(post.id)} />
            ))}
          </AnimatePresence>
        </div>

        {/* Right sidebar */}
        <div>
          <div className="card" style={{ padding: "20px", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "16px" }}>Top Creators</h3>
            {[
              { name: "Ananya Singh", trips: 42, followers: "89K", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=ananya" },
              { name: "Priya Sharma", trips: 31, followers: "45K", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=priya" },
              { name: "Rahul Kapoor", trips: 18, followers: "8.9K", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=rahul" },
            ].map(creator => (
              <div key={creator.name} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                <img src={creator.avatar} alt={creator.name} style={{ width: "36px", height: "36px", borderRadius: "50%", border: "2px solid var(--border)" }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>{creator.name}</div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{creator.followers} followers · {creator.trips} trips</div>
                </div>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => toggleFollowCreator(creator.name)}
                  style={{ padding: "4px 10px", borderRadius: "16px", border: `1px solid ${followedCreators[creator.name] ? "var(--border)" : "var(--brand-primary)"}`, background: followedCreators[creator.name] ? "var(--bg-primary)" : "transparent", color: followedCreators[creator.name] ? "var(--text-muted)" : "var(--brand-primary)", cursor: "pointer", fontSize: "11px", fontWeight: 600, transition: "all 0.2s" }}>
                  {followedCreators[creator.name] ? "✓ Following" : "Follow"}
                </motion.button>
              </div>
            ))}
          </div>

          <div className="card" style={{ padding: "20px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "12px" }}>Trending Tags</h3>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {["#Japan2024", "#BaliVibes", "#Iceland", "#GoldenHour", "#OffTheBeatenPath", "#SoloTravel", "#CreatorMode", "#BudgetTravel"].map(tag => (
                <motion.span key={tag} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="tag"
                  style={{ cursor: "pointer" }}
                  onClick={() => showToast(`Filtered by ${tag}`)}>
                  {tag}
                </motion.span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
