import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";

export default function LuminaraResult() {
  const navigate = useNavigate();
  const location = useLocation();
  const text = location.state?.text || "No text available";
  const [isPlaying, setIsPlaying] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { margin: 0; }
      `}</style>
      
<div style={{ fontFamily: "'DM Sans', sans-serif", background: "#F4F1EC", minHeight: "100vh", width: "100vw", display: "flex", flexDirection: "column", color: "#1C1C1C" }}>
        {/* HEADER */}
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 28px", background: "#F4F1EC", borderBottom: "1px solid #D8D4CB", position: "sticky", top: 0, zIndex: 100 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button onClick={() => navigate('/')} style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", fontSize: "15px", fontWeight: "500", cursor: "pointer", padding: "6px 10px", borderRadius: "6px", fontFamily: "'DM Sans', sans-serif" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
              Back
            </button>
            <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: "22px" }}>Luminara</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", position: "relative" }}>
            <button onClick={() => showToast("Downloading… (connect backend to serve real file)")} style={{ display: "flex", alignItems: "center", gap: "7px", background: "#6B8F6E", color: "#fff", border: "none", borderRadius: "8px", padding: "8px 16px", fontSize: "14px", fontWeight: "500", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Download
            </button>
            <button onClick={(e) => { e.stopPropagation(); setSettingsOpen(!settingsOpen); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#6B6860", padding: "6px", borderRadius: "6px", display: "flex", alignItems: "center" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            </button>
            {settingsOpen && (
              <div style={{ position: "absolute", top: "44px", right: 0, background: "white", border: "1px solid #D8D4CB", borderRadius: "10px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", padding: "16px 20px", minWidth: "220px", zIndex: 200 }}>
                <p style={{ fontSize: "12px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.08em", color: "#6B6860", marginBottom: "12px" }}>Optional Features</p>
                {["Playback Speed", "Pause / Resume Audio", "Dark / Light Theme", "Copy to Clipboard", "Simplify Text"].map(f => (
                  <div key={f} style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: "#6B6860", padding: "6px 0", borderBottom: "1px solid #EDEAE3" }}>
                    {f} <span style={{ fontStyle: "italic", fontSize: "12px" }}>coming soon</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </header>

        {/* AUDIO BAR */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px", background: "white", borderBottom: "1px solid #D8D4CB", padding: "10px 28px" }}>
          <span style={{ fontSize: "12px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.08em", color: "#6B6860", whiteSpace: "nowrap" }}>🔊 Audio</span>
          <button onClick={() => { setIsPlaying(!isPlaying); showToast("Audio playback — connect TTS backend to activate"); }} style={{ display: "flex", alignItems: "center", gap: "6px", background: "#6B8F6E", color: "#fff", border: "none", borderRadius: "6px", padding: "7px 14px", fontSize: "13px", fontWeight: "500", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap" }}>
            {isPlaying ? (
              <><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Pause</>
            ) : (
              <><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg> Play Audio</>
            )}
          </button>
          <div style={{ flex: 1, height: "4px", background: "#EDEAE3", borderRadius: "2px" }}>
            <div style={{ width: "0%", height: "100%", background: "#6B8F6E", borderRadius: "2px" }} />
          </div>
          <span style={{ fontSize: "13px", color: "#6B6860", whiteSpace: "nowrap" }}>0:00 / 0:00</span>
          <button onClick={() => showToast("Exporting audio… (connect TTS backend)")} style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "1px solid #D8D4CB", borderRadius: "6px", padding: "6px 12px", fontSize: "13px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", color: "#1C1C1C" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export Audio
          </button>
        </div>

        {/* MAIN CONTENT */}
        <main style={{ flex: 1, padding: "32px 28px" }}>
          <div style={{ background: "white", borderRadius: "12px", padding: "40px 48px", maxWidth: "860px", margin: "0 auto", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
            <div style={{ fontSize: "22px", fontWeight: "600", marginBottom: "6px" }}>Converted Text</div>
            <div style={{ fontSize: "14px", color: "#6B6860", marginBottom: "28px" }}>Here is your extracted content</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", fontSize: "15px", lineHeight: "1.8", color: "#1C1C1C", whiteSpace: "pre-wrap"}}>
              {text}
            </div>
          </div>
        </main>

        {/* BOTTOM BAR */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 28px", background: "white", borderTop: "1px solid #D8D4CB" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button onClick={() => { if (window.confirm("Start over? Your current conversion will be cleared.")) navigate('/'); }} style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "1px solid #D8D4CB", borderRadius: "6px", padding: "8px 14px", fontSize: "14px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", color: "#1C1C1C" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.37"/></svg>
              Reset / Clear
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#6B6860", background: "#F4F1EC", padding: "6px 12px", borderRadius: "6px" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              Output: <strong>PDF</strong>
            </div>
          </div>
          <button onClick={() => showToast("Downloading… (connect backend to serve real file)")} style={{ display: "flex", alignItems: "center", gap: "7px", background: "#6B8F6E", color: "#fff", border: "none", borderRadius: "8px", padding: "10px 20px", fontSize: "14px", fontWeight: "500", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Download File
          </button>
        </div>

        {/* TOAST */}
        {toast && (
          <div style={{ position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)", background: "#1C1C1C", color: "white", padding: "10px 20px", borderRadius: "8px", fontSize: "14px", zIndex: 999 }}>
            {toast}
          </div>
        )}
      </div>
    </>
  );
}