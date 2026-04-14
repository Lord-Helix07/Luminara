/*
This page is used to sign in the user to the Luminara app.
*/

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTheme } from "./ThemeContext.jsx";
import { useAuth } from "./AuthContext.jsx";

export default function SignIn() {
  const navigate = useNavigate();
  const { t } = useTheme();
  const { login, register } = useAuth();
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }
    if (mode === "signup" && password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        await register(email.trim(), password);
      } else {
        await login(email.trim(), password);
      }
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { margin: 0; }
      `}</style>
      <div
        style={{
          minHeight: "100vh",
          width: "100vw",
          background: t.bg,
          fontFamily: "'DM Sans', sans-serif",
          color: t.text,
          display: "flex",
          flexDirection: "column",
          transition: "background 0.2s, color 0.2s",
        }}
      >
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 48px",
            borderBottom: `1px solid ${t.headerBorder}`,
            background: t.headerBg,
          }}
        >
          <Link
            to="/"
            style={{
              fontSize: "15px",
              fontWeight: "500",
              color: t.brand,
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back
          </Link>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: "700",
              fontFamily: "'Playfair Display', serif",
              color: t.title,
              letterSpacing: "0.01em",
            }}
          >
            Luminara
          </h1>
          <span style={{ width: "72px" }} aria-hidden />
        </header>

        <main
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 24px",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "400px",
              background: t.cardBg,
              borderRadius: "20px",
              padding: "36px 40px",
              boxShadow: t.cardShadow,
            }}
          >
            <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
              <button
                type="button"
                onClick={() => { setMode("signin"); setError(""); }}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "10px",
                  border: mode === "signin" ? `2px solid ${t.brand}` : `1px solid ${t.selectBorder}`,
                  background: mode === "signin" ? t.dropBgHi : t.inputBg,
                  color: t.text,
                  fontWeight: "600",
                  cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "14px",
                }}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => { setMode("signup"); setError(""); }}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "10px",
                  border: mode === "signup" ? `2px solid ${t.brand}` : `1px solid ${t.selectBorder}`,
                  background: mode === "signup" ? t.dropBgHi : t.inputBg,
                  color: t.text,
                  fontWeight: "600",
                  cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "14px",
                }}
              >
                Create account
              </button>
            </div>
            <h2
              style={{
                fontSize: "22px",
                fontWeight: "600",
                marginBottom: "8px",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {mode === "signup" ? "Create your account" : "Welcome back"}
            </h2>
            <p style={{ fontSize: "14px", color: t.textMuted, marginBottom: "28px" }}>
              {mode === "signup"
                ? "Passwords are stored securely (hashed) on the server."
                : "Sign in with your email and password."}
            </p>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <div>
                <label
                  htmlFor="signin-email"
                  style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "8px" }}
                >
                  Email
                </label>
                <input
                  id="signin-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "10px",
                    border: `1px solid ${t.selectBorder}`,
                    background: t.inputBg,
                    color: t.inputFg,
                    fontSize: "15px",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                />
              </div>
              <div>
                <label
                  htmlFor="signin-password"
                  style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "8px" }}
                >
                  Password
                </label>
                <input
                  id="signin-password"
                  type="password"
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "10px",
                    border: `1px solid ${t.selectBorder}`,
                    background: t.inputBg,
                    color: t.inputFg,
                    fontSize: "15px",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                />
              </div>
              {error ? (
                <p style={{ color: t.error, fontSize: "14px" }} role="alert">
                  {error}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: "8px",
                  padding: "14px",
                  borderRadius: "12px",
                  border: "none",
                  background: loading ? t.btnDisabled : t.btn,
                  color: "#fff",
                  fontSize: "16px",
                  fontWeight: "500",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {loading ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
              </button>
            </form>
          </div>
        </main>
      </div>
    </>
  );
}
