/* 
This page is unfinished and just has the UI for right now.
We will be using the dictionary page in order to allow the user to add confusing words to the dictionary.
Text on discord if you need help with the code or understanding what the page is for.
Assigned to : Ryan + Vishal
*/

import { Link } from "react-router-dom";
import { useTheme } from "./ThemeContext.jsx";
import { useAuth } from "./AuthContext.jsx";

export default function Dictionary() {
  const { t } = useTheme();
  const { isAuthenticated } = useAuth();

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
            Home
          </Link>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: "700",
              fontFamily: "'Playfair Display', serif",
              color: t.title,
            }}
          >
            Dictionary
          </h1>
          <span style={{ width: "72px" }} aria-hidden />
        </header>
        <main style={{ padding: "48px 24px", maxWidth: "720px", margin: "0 auto" }}>
          <p style={{ fontSize: "16px", color: t.textMuted, lineHeight: 1.6 }}>
            {isAuthenticated
              ? "Word lists and lookups will appear here as we connect the dictionary to your account."
              : "Sign in to sync your dictionary across devices."}
          </p>
        </main>
      </div>
    </>
  );
}
