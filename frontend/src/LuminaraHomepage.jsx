import { useState, useRef, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "./ThemeContext.jsx";
import { ToggleSwitch } from "./ToggleSwitch.jsx";
import { SettingsMenu } from "./SettingsMenu.jsx";
import { API_BASE_URL } from "./api.js";
import { useAuth } from "./AuthContext.jsx";

// If you put in a pdf, the output file automatically changes to pdf,
// doc -> doc, slides -> pdf, images -> txt
function formatForUploadedFile(fileName) {
  const ext = fileName
    .slice(((fileName.lastIndexOf(".") - 1) >>> 0) + 2)
    .toLowerCase();

  if (ext === "pdf") return "pdf";
  if (ext === "doc" || ext === "docx") return "doc";
  if (ext === "txt") return "txt";
  if (ext === "ppt" || ext === "pptx") return "pdf";
  if (ext === "png" || ext === "jpg" || ext === "jpeg") return "txt";

  return "";
}

export default function LuminaraHomepage() {
  const navigate = useNavigate();
  const { t } = useTheme();
  const { user, logout } = useAuth();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef(null);

  const [format, setFormat] = useState("");
  const [language, setLanguage] = useState("en");
  const [pageRange, setPageRange] = useState("all");
  const [startPage, setStartPage] = useState("");
  const [endPage, setEndPage] = useState("");

  const [tts, setTts] = useState(false);
  const [simplify, setSimplify] = useState(false);
  const [ttsExpanded, setTtsExpanded] = useState(false);
  const [voice, setVoice] = useState("female-natural");
  const [speed, setSpeed] = useState(1.0);

  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [manualText, setManualText] = useState("");
  const fileInputRef = useRef(null);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!settingsOpen) return;

    const onDocClick = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) {
        setSettingsOpen(false);
      }
    };

    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [settingsOpen]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/warmup`, { method: "POST" }).catch(() => {});
  }, []);

  useEffect(() => {
    if (simplify) {
      setFormat("txt");
    }
  }, [simplify]);

  const formValid = useMemo(() => {
    if (simplify) {
      if (!manualText.trim()) return false;
      if (format !== "txt") return false;
    } else {
      if (!file) return false;
    }

    if (!format) return false;
    if (!language) return false;

    if (pageRange === "custom") {
      const start = parseInt(String(startPage).trim(), 10);
      const end = parseInt(String(endPage).trim(), 10);

      if (!startPage || !endPage || Number.isNaN(start) || Number.isNaN(end)) {
        return false;
      }

      if (start < 1 || end < 1 || start > end) {
        return false;
      }
    }

    return true;
  }, [simplify, manualText, format, file, language, pageRange, startPage, endPage]);

  const validationMessage = () => {
    const missing = [];

    if (simplify) {
      if (!manualText.trim()) missing.push("enter text to simplify");
    } else if (!file) {
      missing.push("upload a file");
    }

    if (!format) missing.push("choose an output format");
    if (!language) missing.push("select a language");

    if (pageRange === "custom") {
      const start = parseInt(String(startPage).trim(), 10);
      const end = parseInt(String(endPage).trim(), 10);

      if (!startPage || !endPage || Number.isNaN(start) || Number.isNaN(end)) {
        missing.push("enter start and end page numbers");
      } else if (start < 1 || end < 1 || start > end) {
        missing.push("enter valid page numbers (start ≤ end, both ≥ 1)");
      }
    }

    if (missing.length === 0) return "";
    return `Please ${missing.join(", ")}.`;
  };

  const setFileWithInferredFormat = (nextFile) => {
    if (!nextFile) {
      setFile(null);
      return;
    }

    setFile(nextFile);

    const inferred = formatForUploadedFile(nextFile.name);
    if (inferred) {
      setFormat(inferred);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);

    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      setFileWithInferredFormat(dropped);
    }
  };

  const handleFileInputChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFileWithInferredFormat(selectedFile);
    }
  };

  const handleReset = () => {
    setFormat("");
    setLanguage("en");
    setPageRange("all");
    setStartPage("");
    setEndPage("");
    setTts(false);
    setSimplify(false);
    setTtsExpanded(false);
    setVoice("female-natural");
    setSpeed(1.0);
    setDragOver(false);
    setFile(null);
    setManualText("");
    setError("");
    setLoading(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleConvert = async () => {
    if (!formValid) {
      setError(validationMessage() || "Please complete all required fields.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      let response;

      if (simplify) {
        response = await fetch(`${API_BASE_URL}/convert`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: manualText,
            language,
            format,
            tts,
            voice,
            speed,
            pageRange,
            startPage,
            endPage,
          }),
        });
      } else {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("language", language);
        formData.append("format", format);
        formData.append("tts", String(tts));
        formData.append("voice", voice);
        formData.append("speed", String(speed));
        formData.append("pageRange", pageRange);
        formData.append("startPage", startPage);
        formData.append("endPage", endPage);

        response = await fetch(`${API_BASE_URL}/convert`, {
          method: "POST",
          body: formData,
        });
      }

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to convert");
        return;
      }

      const downloadBaseName = simplify
        ? "simplified-text"
        : file?.name
            ?.replace(/\.[^.]+$/, "")
            .replace(/[/\\?%*:|"<>]/g, "-")
            .trim() || "luminara-output";

      navigate("/result", {
        state: {
          text: data.text,
          outputFormat: format,
          downloadBaseName,
        },
      });
    } catch (err) {
      console.error(err);
      setError("Problem connecting to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500;600&display=swap');

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          margin: 0;
        }

        select {
          appearance: auto;
          -webkit-appearance: auto;
        }

        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        input[type=number] {
          -moz-appearance: textfield;
        }

        @keyframes luminara-loading-bar {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(350%);
          }
        }
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          width: "100vw",
          background: t.bg,
          fontFamily: "'DM Sans', sans-serif",
          display: "flex",
          flexDirection: "column",
          color: t.text,
          transition: "background 0.2s, color 0.2s",
        }}
      >
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "18px 48px",
            position: "relative",
            borderBottom: `1px solid ${t.headerBorder}`,
            background: t.headerBg,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: "48px",
              top: "50%",
              transform: "translateY(-50%)",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <button
              type="button"
              aria-label="Dictionary"
              onClick={() => navigate("/dictionary")}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "8px 14px",
                background: "transparent",
                border: `1px solid ${t.selectBorder}`,
                borderRadius: "999px",
                color: t.text,
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
              >
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                <path d="M8 7h8M8 11h6" />
              </svg>
              Dictionary
            </button>

            {user ? (
              <button
                type="button"
                onClick={logout}
                style={{
                  background: "transparent",
                  border: `1px solid ${t.selectBorder}`,
                  color: t.text,
                  padding: "8px 16px",
                  borderRadius: "999px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Log out
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate("/signin")}
                style={{
                  background: "transparent",
                  border: `1px solid ${t.selectBorder}`,
                  color: t.text,
                  padding: "8px 16px",
                  borderRadius: "999px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Sign in
              </button>
            )}
          </div>

          <h1
            style={{
              fontSize: "28px",
              fontWeight: "700",
              fontFamily: "'Playfair Display', serif",
              color: t.title,
              letterSpacing: "0.01em",
            }}
          >
            Luminara
          </h1>

          <div ref={settingsRef} style={{ position: "absolute", right: "48px" }}>
            <button
              type="button"
              aria-expanded={settingsOpen}
              aria-haspopup="true"
              aria-label="Settings"
              onClick={(e) => {
                e.stopPropagation();
                setSettingsOpen((prev) => !prev);
              }}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: t.settingsIcon,
                padding: "4px",
                borderRadius: "8px",
              }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>

            {settingsOpen && <SettingsMenu />}
          </div>
        </header>

        <main
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "48px 24px",
          }}
        >
          <div
            style={{
              background: t.cardBg,
              borderRadius: "20px",
              padding: "40px 44px",
              width: "100%",
              maxWidth: "980px",
              boxShadow: t.cardShadow,
              transition: "background 0.2s, box-shadow 0.2s",
            }}
          >
            <div style={{ display: "flex", gap: "48px", alignItems: "stretch" }}>
              <div style={{ flex: 1.1, display: "flex", flexDirection: "column" }}>
                {simplify ? (
                  <div
                    style={{
                      border: `1px solid ${t.selectBorder}`,
                      borderRadius: "14px",
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      background: t.inputBg,
                      padding: "16px",
                      gap: "10px",
                    }}
                  >
                    <label
                      style={{
                        fontSize: "14px",
                        fontWeight: "500",
                        color: t.text,
                      }}
                    >
                      Enter text to simplify
                    </label>

                    <textarea
                      value={manualText}
                      onChange={(e) => setManualText(e.target.value)}
                      placeholder="Paste or type text here..."
                      style={{
                        width: "100%",
                        minHeight: "220px",
                        resize: "vertical",
                        borderRadius: "10px",
                        border: `1px solid ${t.selectBorder}`,
                        background: t.selectBg,
                        color: t.inputFg,
                        padding: "12px",
                        fontSize: "14px",
                        fontFamily: "'DM Sans', sans-serif",
                        lineHeight: 1.4,
                      }}
                    />
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: `2px dashed ${dragOver ? t.dropBorderHi : t.dropBorder}`,
                      borderRadius: "14px",
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      background: dragOver ? t.dropBgHi : t.dropBg,
                      transition: "all 0.2s",
                      gap: "14px",
                    }}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      style={{ display: "none" }}
                      onChange={handleFileInputChange}
                    />

                    <div
                      style={{
                        width: "64px",
                        height: "64px",
                        background: t.iconBoxBg,
                        borderRadius: "14px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <svg
                        width="30"
                        height="30"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={t.brand}
                        strokeWidth="1.8"
                      >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                    </div>

                    {file ? (
                      <p
                        style={{
                          color: t.brand,
                          fontSize: "14px",
                          textAlign: "center",
                        }}
                      >
                        {file.name}
                      </p>
                    ) : (
                      <p style={{ color: t.textMuted, fontSize: "14px" }}>
                        Drag and drop your file here
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      style={{
                        background: t.btn,
                        color: "white",
                        border: "none",
                        borderRadius: "22px",
                        padding: "11px 32px",
                        fontSize: "14px",
                        cursor: "pointer",
                        fontFamily: "'DM Sans', sans-serif",
                        fontWeight: "500",
                      }}
                    >
                      Select File
                    </button>
                  </div>
                )}

                <p
                  style={{
                    color: t.textFooter,
                    fontSize: "12px",
                    textAlign: "center",
                    marginTop: "12px",
                  }}
                >
                  Files are processed temporarily — not stored.
                </p>
              </div>

              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: "22px",
                }}
              >
                <div>
                  <label
                    style={{
                      fontSize: "14px",
                      fontWeight: "500",
                      color: t.text,
                      display: "block",
                      marginBottom: "8px",
                    }}
                  >
                    Choose Output File Format
                  </label>

                  {simplify ? (
                    <div
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "8px",
                        border: `1px solid ${t.selectBorder}`,
                        fontSize: "14px",
                        fontFamily: "'DM Sans', sans-serif",
                        background: t.inputBg,
                        color: t.textSoft,
                      }}
                    >
                      TXT (required for simplify mode)
                    </div>
                  ) : (
                    <select
                      value={format}
                      onChange={(e) => setFormat(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "8px",
                        border: `1px solid ${t.selectBorder}`,
                        fontSize: "14px",
                        fontFamily: "'DM Sans', sans-serif",
                        background: t.selectBg,
                        color: t.selectFg,
                      }}
                    >
                      <option value="">Select format</option>
                      <option value="txt">TXT</option>
                      <option value="pdf">PDF</option>
                      <option value="doc">DOC</option>
                    </select>
                  )}
                </div>

                <div>
                  <label
                    style={{
                      fontSize: "14px",
                      fontWeight: "500",
                      color: t.text,
                      display: "block",
                      marginBottom: "8px",
                    }}
                  >
                    Select Language
                  </label>

                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: `1px solid ${t.selectBorder}`,
                      fontSize: "14px",
                      fontFamily: "'DM Sans', sans-serif",
                      background: t.selectBg,
                      color: t.selectFg,
                    }}
                  >
                    <option value="">Choose language</option>
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      fontSize: "14px",
                      fontWeight: "500",
                      color: t.text,
                      display: "block",
                      marginBottom: "10px",
                    }}
                  >
                    Page Range
                  </label>

                  {[
                    ["all", "All pages"],
                    ["custom", "Custom"],
                  ].map(([value, label]) => (
                    <label
                      key={value}
                      onClick={() => setPageRange(value)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        cursor: "pointer",
                        fontSize: "14px",
                        marginBottom: "10px",
                        color: t.text,
                      }}
                    >
                      <div
                        style={{
                          width: "18px",
                          height: "18px",
                          borderRadius: "50%",
                          border: `2px solid ${
                            pageRange === value ? t.radioOn : t.radioBorder
                          }`,
                          background: pageRange === value ? t.radioOn : t.inputBg,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {pageRange === value && (
                          <div
                            style={{
                              width: "6px",
                              height: "6px",
                              borderRadius: "50%",
                              background: "white",
                            }}
                          />
                        )}
                      </div>
                      {label}
                    </label>
                  ))}

                  {pageRange === "custom" && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginTop: "4px",
                      }}
                    >
                      <input
                        type="number"
                        min="1"
                        value={startPage}
                        onChange={(e) => setStartPage(e.target.value)}
                        placeholder="Start"
                        style={{
                          width: "60px",
                          padding: "5px 8px",
                          borderRadius: "6px",
                          border: `1px solid ${t.selectBorder}`,
                          fontSize: "13px",
                          color: t.inputFg,
                          fontFamily: "'DM Sans', sans-serif",
                          textAlign: "center",
                          background: t.inputBg,
                        }}
                      />

                      <span style={{ fontSize: "13px", color: t.textSoft }}>to</span>

                      <input
                        type="number"
                        min="1"
                        value={endPage}
                        onChange={(e) => setEndPage(e.target.value)}
                        placeholder="End"
                        style={{
                          width: "60px",
                          padding: "5px 8px",
                          borderRadius: "6px",
                          border: `1px solid ${t.selectBorder}`,
                          fontSize: "13px",
                          color: t.inputFg,
                          fontFamily: "'DM Sans', sans-serif",
                          textAlign: "center",
                          background: t.inputBg,
                        }}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <p
                    style={{
                      fontSize: "11px",
                      fontWeight: "600",
                      color: t.sectionMuted,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      marginBottom: "14px",
                    }}
                  >
                    Accessibility Options
                  </p>

                  {[
                    ["Text-to-Speech", tts, setTts],
                    ["Simplify Text", simplify, setSimplify],
                  ].map(([label, value, setter]) => (
                    <div
                      key={label}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "16px",
                      }}
                    >
                      <span style={{ fontSize: "14px", color: t.text }}>{label}</span>
                      <ToggleSwitch enabled={value} onChange={setter} />
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    border: `1px solid ${t.ttsPanelBorder}`,
                    borderRadius: "12px",
                    background: t.ttsPanelBg,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setTtsExpanded((prev) => !prev)}
                    style={{
                      width: "100%",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "14px 18px",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "500",
                      fontFamily: "'DM Sans', sans-serif",
                      color: t.text,
                    }}
                  >
                    Text-to-Speech Options
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={t.textSoft}
                      strokeWidth="2"
                      style={{
                        transform: ttsExpanded ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "0.2s",
                      }}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  {ttsExpanded && (
                    <div
                      style={{
                        padding: "0 18px 18px",
                        borderTop: `1px solid ${t.ttsPanelBorder}`,
                      }}
                    >
                      <div style={{ marginTop: "14px" }}>
                        <label
                          style={{
                            fontSize: "13px",
                            display: "block",
                            marginBottom: "8px",
                            color: t.text,
                          }}
                        >
                          Voice
                        </label>

                        <select
                          value={voice}
                          onChange={(e) => setVoice(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "8px 10px",
                            borderRadius: "8px",
                            border: `1px solid ${t.selectBorder}`,
                            fontSize: "13px",
                            fontFamily: "'DM Sans', sans-serif",
                            background: t.selectBg,
                            color: t.selectFg,
                          }}
                        >
                          <option value="female-natural">Female (Natural)</option>
                          <option value="male-natural">Male (Natural)</option>
                        </select>
                      </div>

                      <div style={{ marginTop: "14px" }}>
                        <label
                          style={{
                            fontSize: "13px",
                            display: "block",
                            marginBottom: "8px",
                            color: t.text,
                          }}
                        >
                          Playback Speed:{" "}
                          <span style={{ color: t.brand, fontWeight: "600" }}>
                            {speed.toFixed(1)}x
                          </span>
                        </label>

                        <input
                          type="range"
                          min="0.5"
                          max="2.0"
                          step="0.1"
                          value={speed}
                          onChange={(e) => setSpeed(parseFloat(e.target.value))}
                          style={{ width: "100%", accentColor: t.brand }}
                        />

                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: "11px",
                            color: t.textSoft,
                            marginTop: "4px",
                          }}
                        >
                          <span>0.5x</span>
                          <span>2.0x</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleReset}
                  style={{
                    background: "none",
                    border: "none",
                    color: t.resetLink,
                    fontSize: "13px",
                    cursor: "pointer",
                    textAlign: "left",
                    padding: 0,
                    fontFamily: "'DM Sans', sans-serif",
                    textDecoration: "underline",
                  }}
                >
                  Reset / Clear
                </button>
              </div>
            </div>

            {error ? (
              <p
                style={{
                  marginTop: "20px",
                  color: t.error,
                  fontSize: "14px",
                  textAlign: "center",
                }}
                role="alert"
              >
                {error}
              </p>
            ) : null}

            {!formValid && !error ? (
              <p
                style={{
                  marginTop: "16px",
                  color: t.textHint,
                  fontSize: "13px",
                  textAlign: "center",
                }}
              >
                {simplify
                  ? "Enter text, then select language"
                  : "Select a file, output format, and language"}
                {pageRange === "custom"
                  ? " — and valid start/end pages for custom range."
                  : "."}
              </p>
            ) : null}

            <button
              type="button"
              disabled={!formValid || loading}
              onClick={handleConvert}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.background = t.btnHover;
                }
              }}
              onMouseLeave={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.background = t.btn;
                }
              }}
              style={{
                width: "100%",
                marginTop: "16px",
                padding: "18px",
                background: !formValid || loading ? t.btnDisabled : t.btn,
                color: "white",
                border: "none",
                borderRadius: "12px",
                fontSize: "16px",
                fontWeight: "500",
                cursor: !formValid || loading ? "not-allowed" : "pointer",
                fontFamily: "'DM Sans', sans-serif",
                letterSpacing: "0.02em",
                transition: "background 0.2s",
              }}
            >
              {loading ? "Converting…" : "Convert"}
            </button>

            {loading ? (
              <div
                aria-busy="true"
                aria-label="Converting"
                style={{
                  marginTop: "12px",
                  height: "8px",
                  borderRadius: "4px",
                  background: t.loadTrack,
                  overflow: "hidden",
                  width: "100%",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: "38%",
                    borderRadius: "4px",
                    background: t.loadBar,
                    animation: "luminara-loading-bar 1.1s ease-in-out infinite",
                  }}
                />
              </div>
            ) : null}
          </div>
        </main>
      </div>
    </>
  );
}

