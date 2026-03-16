import { useState, useRef } from "react";
import { useNavigate } from 'react-router-dom';

const ToggleSwitch = ({ enabled, onChange }) => (
  <button
    onClick={() => onChange(!enabled)}
    style={{
      width: "44px", height: "24px", borderRadius: "12px",
      background: enabled ? "#6b8f6b" : "#d1d1d1",
      border: "none", cursor: "pointer", position: "relative",
      transition: "background 0.2s", flexShrink: 0,
    }}
  >
    <span style={{
      position: "absolute", top: "2px",
      left: enabled ? "22px" : "2px",
      width: "20px", height: "20px", borderRadius: "50%",
      background: "white", transition: "left 0.2s",
      boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
    }} />
  </button>
);

export default function LuminaraHome() {
  const navigate = useNavigate();
  const [format, setFormat] = useState("");
  const [language, setLanguage] = useState("");
  const [pageRange, setPageRange] = useState("all");
  const [startPage, setStartPage] = useState("");
  const [endPage, setEndPage] = useState("");
  const [dyslexia, setDyslexia] = useState(false);
  const [tts, setTts] = useState(false);
  const [simplify, setSimplify] = useState(false);
  const [ttsExpanded, setTtsExpanded] = useState(false);
  const [voice, setVoice] = useState("female-natural");
  const [speed, setSpeed] = useState(1.0);
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const fileInputRef = useRef();

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  };

  const handleReset = () => {
    setFormat(""); setLanguage(""); setPageRange("all");
    setDyslexia(false); setTts(false); setSimplify(false);
    setSpeed(1.0); setVoice("female-natural"); setFile(null);
    setStartPage(""); setEndPage("");
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { margin: 0; }
        select { appearance: auto; -webkit-appearance: auto; }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>
      <div style={{
        minHeight: "100vh", width: "100vw",
        background: "#eae6de", fontFamily: "'DM Sans', sans-serif",
        display: "flex", flexDirection: "column",
      }}>
        {/* Header */}
        <header style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "18px 48px", position: "relative",
          borderBottom: "1px solid #d4cfc6", background: "#eae6de",
        }}>
          <h1 style={{
            fontSize: "28px", fontWeight: "700",
            fontFamily: "'Playfair Display', serif",
            color: "#1a1a1a", letterSpacing: "0.01em",
          }}>Luminara</h1>
          <button style={{
            position: "absolute", right: "48px",
            background: "none", border: "none", cursor: "pointer", color: "#888", padding: "4px",
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="1.5">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
        </header>

        {/* Main */}
        <main style={{
          flex: 1, display: "flex", alignItems: "center",
          justifyContent: "center", padding: "48px 24px",
        }}>
          <div style={{
            background: "white", borderRadius: "20px",
            padding: "40px 44px", width: "100%", maxWidth: "980px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
          }}>
            <div style={{ display: "flex", gap: "48px", alignItems: "stretch" }}>

              {/* LEFT: Upload */}
              <div style={{ flex: 1.1, display: "flex", flexDirection: "column" }}>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current.click()}
                  style={{
                    border: `2px dashed ${dragOver ? "#6b8f6b" : "#b8ccb8"}`,
                    borderRadius: "14px",
                    flex: 1,
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                    cursor: "pointer",
                    background: dragOver ? "#f0f5f0" : "white",
                    transition: "all 0.2s", gap: "14px",
                  }}
                >
                  <input ref={fileInputRef} type="file" style={{ display: "none" }}
                    onChange={(e) => setFile(e.target.files[0])} />
                  <div style={{
                    width: "64px", height: "64px", background: "#f5f5f5",
                    borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#6b8f6b" strokeWidth="1.8">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                  </div>
                  {file ? (
                    <p style={{ color: "#6b8f6b", fontSize: "14px", textAlign: "center" }}>{file.name}</p>
                  ) : (
                    <p style={{ color: "#777", fontSize: "14px" }}>Drag and drop your file here</p>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); fileInputRef.current.click(); }}
                    style={{
                      background: "#6b8f6b", color: "white", border: "none",
                      borderRadius: "22px", padding: "11px 32px", fontSize: "14px",
                      cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: "500",
                    }}
                  >Select File</button>
                </div>
                <p style={{ color: "#bbb", fontSize: "12px", textAlign: "center", marginTop: "12px" }}>
                  Files are processed temporarily — not stored.
                </p>
              </div>

              {/* RIGHT: Options */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "22px" }}>

                {/* Format */}
                <div>
                  <label style={{ fontSize: "14px", fontWeight: "500", color: "#1a1a1a", display: "block", marginBottom: "8px" }}>
                    Choose Output File Format
                  </label>
                  <select value={format} onChange={(e) => setFormat(e.target.value)} style={{
                    width: "100%", padding: "10px 12px", borderRadius: "8px",
                    border: "1px solid #ccc", fontSize: "14px", fontFamily: "'DM Sans', sans-serif",
                    background: "white", color: "#333",
                  }}>
                    <option value="">Select format</option>
                    <option value="txt">TXT</option>
                    <option value="pdf">PDF</option>
                    <option value="doc">DOC</option>
                  </select>
                </div>

                {/* Language */}
                <div>
                  <label style={{ fontSize: "14px", fontWeight: "500", color: "#1a1a1a", display: "block", marginBottom: "8px" }}>
                    Select Language
                  </label>
                  <select value={language} onChange={(e) => setLanguage(e.target.value)} style={{
                    width: "100%", padding: "10px 12px", borderRadius: "8px",
                    border: "1px solid #ccc", fontSize: "14px", fontFamily: "'DM Sans', sans-serif",
                    background: "white", color: "#333",
                  }}>
                    <option value="">Choose language</option>
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                  </select>
                </div>

                {/* Page Range */}
                <div>
                  <label style={{ fontSize: "14px", fontWeight: "500", color: "#1a1a1a", display: "block", marginBottom: "10px" }}>
                    Page Range
                  </label>
                  {[["all", "All pages"], ["custom", "Custom"]].map(([val, label]) => (
                    <label key={val} onClick={() => setPageRange(val)} style={{
                      display: "flex", alignItems: "center", gap: "10px",
                      cursor: "pointer", fontSize: "14px", marginBottom: "10px", color: "#1a1a1a",
                    }}>
                      <div style={{
                        width: "18px", height: "18px", borderRadius: "50%",
                        border: `2px solid ${pageRange === val ? "#2563eb" : "#ccc"}`,
                        background: pageRange === val ? "#2563eb" : "white",
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}>
                        {pageRange === val && <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "white" }} />}
                      </div>
                      {label}
                    </label>
                  ))}
                  {pageRange === "custom" && (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                      <input
                        type="number"
                        min="1"
                        value={startPage}
                        onChange={(e) => setStartPage(e.target.value)}
                        placeholder="Start"
                        style={{
                          width: "60px", padding: "5px 8px", borderRadius: "6px",
                          border: "1px solid #ccc", fontSize: "13px", color: "#1a1a1a",
                          fontFamily: "'DM Sans', sans-serif", textAlign: "center", background: "white",
                        }}
                      />
                      <span style={{ fontSize: "13px", color: "#888" }}>to</span>
                      <input
                        type="number"
                        min="1"
                        value={endPage}
                        onChange={(e) => setEndPage(e.target.value)}
                        placeholder="End"
                        style={{
                          width: "60px", padding: "5px 8px", borderRadius: "6px",
                          border: "1px solid #ccc", fontSize: "13px", color: "#1a1a1a",
                          fontFamily: "'DM Sans', sans-serif", textAlign: "center", background: "white",
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Accessibility */}
                <div>
                  <p style={{ fontSize: "11px", fontWeight: "600", color: "#999", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "14px" }}>
                    Accessibility Options
                  </p>
                  {[
                    ["Dyslexia Friendly", dyslexia, setDyslexia],
                    ["Text-to-Speech", tts, setTts],
                    ["Simplify Text", simplify, setSimplify],
                  ].map(([label, val, set]) => (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                      <span style={{ fontSize: "14px", color: "#1a1a1a" }}>{label}</span>
                      <ToggleSwitch enabled={val} onChange={set} />
                    </div>
                  ))}
                </div>

                {/* TTS Expandable */}
                <div style={{ border: "1px solid #e8e8e8", borderRadius: "12px", background: "#fafafa" }}>
                  <button onClick={() => setTtsExpanded(!ttsExpanded)} style={{
                    width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "14px 18px", background: "none", border: "none", cursor: "pointer",
                    fontSize: "14px", fontWeight: "500", fontFamily: "'DM Sans', sans-serif", color: "#1a1a1a",
                  }}>
                    Text-to-Speech Options
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2"
                      style={{ transform: ttsExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "0.2s" }}>
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </button>
                  {ttsExpanded && (
                    <div style={{ padding: "0 18px 18px", borderTop: "1px solid #e8e8e8" }}>
                      <div style={{ marginTop: "14px" }}>
                        <label style={{ fontSize: "13px", display: "block", marginBottom: "8px", color: "#1a1a1a" }}>Voice</label>
                        <select value={voice} onChange={(e) => setVoice(e.target.value)} style={{
                          width: "100%", padding: "8px 10px", borderRadius: "8px",
                          border: "1px solid #ccc", fontSize: "13px",
                          fontFamily: "'DM Sans', sans-serif",
                          background: "white", color: "#1a1a1a",
                        }}>
                          <option value="female-natural">Female (Natural)</option>
                          <option value="male-natural">Male (Natural)</option>
                        </select>
                      </div>
                      <div style={{ marginTop: "14px" }}>
                        <label style={{ fontSize: "13px", display: "block", marginBottom: "8px", color: "#1a1a1a" }}>
                          Playback Speed: <span style={{ color: "#6b8f6b", fontWeight: "600" }}>{speed.toFixed(1)}x</span>
                        </label>
                        <input type="range" min="0.5" max="2.0" step="0.1" value={speed}
                          onChange={(e) => setSpeed(parseFloat(e.target.value))}
                          style={{ width: "100%", accentColor: "#6b8f6b" }} />
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#aaa", marginTop: "4px" }}>
                          <span>0.5x</span><span>2.0x</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Reset */}
                <button onClick={handleReset} style={{
                  background: "none", border: "none", color: "#999", fontSize: "13px",
                  cursor: "pointer", textAlign: "left", padding: 0,
                  fontFamily: "'DM Sans', sans-serif", textDecoration: "underline",
                }}>
                  Reset / Clear
                </button>
              </div>
            </div>

            {/* Convert */}
            <button
              onClick={() => navigate('/result')}
              onMouseEnter={(e) => e.target.style.background = "#5a7a5a"}
              onMouseLeave={(e) => e.target.style.background = "#6b8f6b"}
              style={{
                width: "100%", marginTop: "36px", padding: "18px",
                background: "#6b8f6b", color: "white", border: "none",
                borderRadius: "12px", fontSize: "16px", fontWeight: "500",
                cursor: "pointer", fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.02em",
                transition: "background 0.2s",
              }}
            >
              Convert
            </button>
          </div>
        </main>
      </div>
    </>
  );
}