import { useState, useEffect } from "react";

const GAMES = [
  { icon: "○", label: "Tic Tac Toe", desc: "Classic board game", players: "2 players", color: "#e74c3c" },
  { icon: "🧠", label: "Quiz Battle", desc: "5 questions", players: "2 players", color: "#e91e8c" },
  { icon: "🎯", label: "3-Player Trivia", desc: "5 questions", players: "3 players", color: "#f39c12" },
  { icon: "🎲", label: "Ludo", desc: "Roll & move", players: "4 players", color: "#3498db" },
  { icon: "🃏", label: "UNO", desc: "Card game", players: "4 players", color: "#2ecc71" },
];

const STATS = [
  { value: "12K+", label: "Active Players" },
  { value: "50K+", label: "Games Played" },
  { value: "5", label: "Game Types" },
  { value: "24/7", label: "Online Matches" },
];

function FloatingParticle({ x, y, size, delay, color }) {
  return (
    <div style={{
      position: "absolute",
      left: `${x}%`,
      top: `${y}%`,
      width: size,
      height: size,
      borderRadius: "50%",
      background: color,
      opacity: 0.15,
      animation: `float ${3 + delay}s ease-in-out ${delay}s infinite alternate`,
      pointerEvents: "none",
    }} />
  );
}

export default function LandingPage() {
  const [hovered, setHovered] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const particles = [
    { x: 10, y: 20, size: "80px", delay: 0, color: "#7c3aed" },
    { x: 85, y: 15, size: "60px", delay: 1.2, color: "#2ecc71" },
    { x: 70, y: 70, size: "100px", delay: 0.5, color: "#7c3aed" },
    { x: 20, y: 75, size: "50px", delay: 2, color: "#e74c3c" },
    { x: 50, y: 40, size: "40px", delay: 1.5, color: "#f39c12" },
    { x: 92, y: 55, size: "70px", delay: 0.8, color: "#2ecc71" },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0d0d14",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      color: "#e8e8f0",
      overflowX: "hidden",
    }}>
      <style>{`
        @keyframes float {
          from { transform: translateY(0px) scale(1); }
          to { transform: translateY(-20px) scale(1.1); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(124,58,237,0.4); }
          50% { box-shadow: 0 0 0 12px rgba(124,58,237,0); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .game-card:hover {
          transform: translateY(-6px) scale(1.02);
          border-color: rgba(124,58,237,0.6) !important;
        }
        .cta-btn:hover {
          transform: scale(1.04);
          box-shadow: 0 8px 40px rgba(124,58,237,0.5) !important;
        }
        .nav-link:hover { color: #a78bfa !important; }
        .stat-card:hover { border-color: rgba(124,58,237,0.5) !important; }
      `}</style>

      {/* Navbar */}
      <nav style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 2.5rem",
        height: "64px",
        background: scrolled ? "rgba(13,13,20,0.95)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "none",
        transition: "all 0.3s",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "24px" }}>🎮</span>
          <span style={{ fontWeight: 700, fontSize: "20px", color: "#a78bfa", letterSpacing: "-0.5px" }}>GameZone</span>
        </div>
        <div style={{ display: "flex", gap: "2rem" }}>
          {["Games", "Leaderboard", "About"].map(l => (
            <a key={l} className="nav-link" href="#" style={{
              color: "#9999b8", fontSize: "14px", textDecoration: "none",
              fontWeight: 500, transition: "color 0.2s",
            }}>{l}</a>
          ))}
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <a href="/login" style={{
            padding: "8px 20px", borderRadius: "8px",
            border: "1px solid rgba(167,139,250,0.4)",
            color: "#a78bfa", fontSize: "14px", fontWeight: 600,
            textDecoration: "none", transition: "all 0.2s",
          }}>Log in</a>
          <a href="/register" style={{
            padding: "8px 20px", borderRadius: "8px",
            background: "linear-gradient(135deg, #7c3aed, #5b21b6)",
            color: "#fff", fontSize: "14px", fontWeight: 600,
            textDecoration: "none", animation: "pulse 2.5s infinite",
            transition: "all 0.2s",
          }}>Sign up free</a>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        position: "relative",
        minHeight: "calc(100vh - 64px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "3rem 2rem",
        overflow: "hidden",
      }}>
        {/* Background particles */}
        {particles.map((p, i) => <FloatingParticle key={i} {...p} />)}

        {/* Radial glow */}
        <div style={{
          position: "absolute",
          top: "40%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "700px",
          height: "400px",
          background: "radial-gradient(ellipse, rgba(124,58,237,0.15) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div style={{ position: "relative", zIndex: 1, animation: "fadeUp 0.8s ease both" }}>
          <div style={{
            display: "inline-block",
            padding: "6px 16px",
            borderRadius: "100px",
            background: "rgba(124,58,237,0.15)",
            border: "1px solid rgba(167,139,250,0.3)",
            color: "#a78bfa",
            fontSize: "13px",
            fontWeight: 600,
            marginBottom: "1.5rem",
            letterSpacing: "0.5px",
          }}>✦ MULTIPLAYER GAMING PLATFORM</div>

          <h1 style={{
            fontSize: "clamp(2.8rem, 7vw, 5.5rem)",
            fontWeight: 800,
            lineHeight: 1.1,
            marginBottom: "1.5rem",
            letterSpacing: "-2px",
            background: "linear-gradient(135deg, #ffffff 30%, #a78bfa 70%, #7c3aed 100%)",
            backgroundSize: "200% auto",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            animation: "shimmer 4s linear infinite",
          }}>
            Play. Compete.<br />Dominate.
          </h1>

          <p style={{
            fontSize: "clamp(1rem, 2vw, 1.2rem)",
            color: "#7777a0",
            maxWidth: "520px",
            lineHeight: 1.7,
            marginBottom: "2.5rem",
          }}>
            Jump into real-time multiplayer games — Tic Tac Toe, Quiz Battle, Ludo, UNO and more. Challenge players worldwide instantly.
          </p>

          <div style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" }}>
            <a href="/register" className="cta-btn" style={{
              padding: "14px 36px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #7c3aed, #5b21b6)",
              color: "#fff",
              fontSize: "16px",
              fontWeight: 700,
              textDecoration: "none",
              boxShadow: "0 4px 24px rgba(124,58,237,0.35)",
              transition: "all 0.2s",
            }}>🎮 Start Playing Free</a>
            <a href="/login" className="cta-btn" style={{
              padding: "14px 36px",
              borderRadius: "10px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#c8c8e8",
              fontSize: "16px",
              fontWeight: 600,
              textDecoration: "none",
              transition: "all 0.2s",
            }}>Log in →</a>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section style={{
        borderTop: "1px solid rgba(255,255,255,0.05)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        background: "rgba(255,255,255,0.02)",
        padding: "2.5rem 2rem",
      }}>
        <div style={{
          maxWidth: "900px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "1rem",
        }}>
          {STATS.map(s => (
            <div key={s.label} className="stat-card" style={{
              textAlign: "center",
              padding: "1.25rem",
              borderRadius: "12px",
              border: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(255,255,255,0.03)",
              transition: "border-color 0.2s",
            }}>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: "#a78bfa", letterSpacing: "-1px" }}>{s.value}</div>
              <div style={{ fontSize: "13px", color: "#666688", marginTop: "4px", fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Games showcase */}
      <section style={{ padding: "5rem 2rem", maxWidth: "1000px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <p style={{ color: "#7c3aed", fontWeight: 700, fontSize: "13px", letterSpacing: "2px", marginBottom: "0.75rem" }}>SELECT GAME</p>
          <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 800, letterSpacing: "-1px", color: "#e8e8f0" }}>
            5 Games, Infinite Rivalries
          </h2>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "16px",
        }}>
          {GAMES.map((g, i) => (
            <div
              key={g.label}
              className="game-card"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{
                padding: "1.5rem 1.25rem",
                borderRadius: "14px",
                background: "rgba(255,255,255,0.03)",
                border: `1px solid ${hovered === i ? "rgba(124,58,237,0.5)" : "rgba(255,255,255,0.07)"}`,
                cursor: "pointer",
                transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
              }}
            >
              <div style={{
                width: "44px",
                height: "44px",
                borderRadius: "10px",
                background: `${g.color}22`,
                border: `1px solid ${g.color}44`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "22px",
                marginBottom: "1rem",
              }}>{g.icon}</div>
              <div style={{ fontWeight: 700, fontSize: "15px", color: "#e8e8f0", marginBottom: "4px" }}>{g.label}</div>
              <div style={{ fontSize: "12px", color: "#7777a0", marginBottom: "8px" }}>{g.players} · {g.desc}</div>
              <div style={{
                display: "inline-block",
                fontSize: "11px",
                fontWeight: 600,
                color: "#a78bfa",
                padding: "3px 10px",
                borderRadius: "100px",
                background: "rgba(124,58,237,0.12)",
                border: "1px solid rgba(124,58,237,0.2)",
              }}>0/2 in queue</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA section */}
      <section style={{
        padding: "5rem 2rem",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "600px",
          height: "300px",
          background: "radial-gradient(ellipse, rgba(124,58,237,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <h2 style={{
            fontSize: "clamp(1.8rem, 4vw, 3rem)",
            fontWeight: 800,
            letterSpacing: "-1px",
            color: "#e8e8f0",
            marginBottom: "1rem",
          }}>Ready to dominate the leaderboard?</h2>
          <p style={{ color: "#7777a0", marginBottom: "2rem", fontSize: "1.05rem" }}>
            Create your free account and join thousands of players right now.
          </p>
          <a href="/register" className="cta-btn" style={{
            padding: "16px 44px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #7c3aed, #5b21b6)",
            color: "#fff",
            fontSize: "17px",
            fontWeight: 700,
            textDecoration: "none",
            boxShadow: "0 4px 30px rgba(124,58,237,0.4)",
            transition: "all 0.2s",
            display: "inline-block",
          }}>Create Free Account →</a>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: "1px solid rgba(255,255,255,0.05)",
        padding: "1.5rem 2rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        color: "#444466",
        fontSize: "13px",
        flexWrap: "wrap",
        gap: "1rem",
      }}>
        <span>🎮 <strong style={{ color: "#665588" }}>GameZone</strong></span>
        <span>© 2026 GameZone. All rights reserved.</span>
      </footer>
    </div>
  );
}