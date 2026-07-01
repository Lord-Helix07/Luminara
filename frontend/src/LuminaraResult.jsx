/*
This page is used to display the result of the simplified text, page 2 of luminara
*/

import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme, resultPalettes } from "./ThemeContext.jsx";
import { SettingsMenu } from "./SettingsMenu.jsx";
import { downloadConvertedText, formatLabel } from "./downloadUtils.js";
import { useAuth, apiFetch } from "./AuthContext.jsx";

const MAX_SELECTION_CHARS = 96;

function rangeViewportRect(range) {
  let rect = range.getBoundingClientRect();
  if (rect.width > 0 || rect.height > 0) return rect;
  const rects = range.getClientRects();
  if (rects.length > 0) return rects[0];
  return rect;
}

function parseTextForReadAlong(value) {
  const text = typeof value === "string" ? value : String(value ?? "");
  const blocks = text
    .split(/\n\s*\n/)
    .map((block) => block.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const sentences = [];
  const paragraphs = [];

  for (const block of blocks) {
    const parts = block.match(/[^.!?]+[.!?]+(?:["')\]]+)?|[^.!?]+$/g) || [];
    const paragraphSentenceIndexes = [];
    for (const part of parts) {
      const sentence = part.trim();
      if (!sentence) continue;
      paragraphSentenceIndexes.push(sentences.length);
      sentences.push(sentence);
    }
    if (paragraphSentenceIndexes.length > 0) {
      paragraphs.push(paragraphSentenceIndexes);
    }
  }

  if (paragraphs.length === 0 && text.trim()) {
    paragraphs.push([0]);
    sentences.push(text.replace(/\s+/g, " ").trim());
  }

  return { sentences, paragraphs };
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isWholeWord(text, start, end) {
  const left = text[start - 1];
  const right = text[end];

  // Either string edges, whitespace, or common punctuation
  const hasBoundaryChar = (ch) => !ch || /\s|[.,;:!?()"'`\[\]{}<>\-]/.test(ch);
  return hasBoundaryChar(left) && hasBoundaryChar(right);
}

function dictionaryWordPattern(word) {
  return word.trim().split(/\s+/).map(escapeRegExp).join("\\s+");
}

function normalizeDictionaryAnnotations(annotations) {
  if (!Array.isArray(annotations)) return [];
  return annotations
    .map((annotation) => ({
      word: typeof annotation?.word === "string" ? annotation.word.trim() : "",
      explanation:
        typeof annotation?.explanation === "string" ? annotation.explanation.trim() : "",
    }))
    .filter((annotation) => annotation.word && annotation.explanation);
}

function getSentenceFragmentMatches(sentence, annotations, startAnnotationIndex) {
  const matches = [];
  let annotationIndex = startAnnotationIndex;
  let cursor = 0;

  // Loops until the end of the annotations
  while (annotationIndex < annotations.length) {
    const { word, explanation } = annotations[annotationIndex];

    // Find every annotation word in the sentence ignoring case
    const pattern = new RegExp(dictionaryWordPattern(word), "gi");
    let found = null;

    // Searches sentence for annotation word
    for (const match of sentence.slice(cursor).matchAll(pattern)) {
      const start = cursor + match.index;
      const end = start + match[0].length;

      // Makes sure the annotation word is a whole word by itself (not part of another)
      if (!isWholeWord(sentence, start, end)) continue;
      
      found = { start, end, text: match[0], explanation };
      break;
    }

    if (!found) break;

    matches.push(found);
    cursor = found.end;
    annotationIndex += 1;
  }

  return { matches, nextAnnotationIndex: annotationIndex };
}

function buildSentenceDictionaryMatches(sentences, annotations) {
  const dictionaryMatchesBySentence = [];
  let annotationIndex = 0;

  for (const sentence of sentences) {
    const { matches, nextAnnotationIndex } = getSentenceFragmentMatches(
      sentence,
      annotations,
      annotationIndex
    );
    dictionaryMatchesBySentence.push(matches);
    annotationIndex = nextAnnotationIndex;
  }

  return dictionaryMatchesBySentence;
}

export default function LuminaraResult() {
  const navigate = useNavigate();
  const location = useLocation();
  const { darkMode } = useTheme();
  const { user, logout, apiFetch } = useAuth();
  const R = darkMode ? resultPalettes.dark : resultPalettes.light;

  const text = location.state?.text || "No text available";
  const rawFormat = location.state?.outputFormat;
  const outputFormat =
    rawFormat === "txt" || rawFormat === "pdf" || rawFormat === "doc" ? rawFormat : "txt";
  const downloadBaseName = location.state?.downloadBaseName || "luminara-output";
  const dictionaryAnnotations = useMemo(
    () => normalizeDictionaryAnnotations(location.state?.dictionaryAnnotations),
    [location.state?.dictionaryAnnotations]
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [hoveredSentenceIndex, setHoveredSentenceIndex] = useState(null);
  const [activeSentenceIndex, setActiveSentenceIndex] = useState(null);
  /** { text, top, left } in viewport px for fixed toolbar — only when signed in */
  const [selectionToolbar, setSelectionToolbar] = useState(null);
  const [dictDrawerOpen, setDictDrawerOpen] = useState(false);
  const [dictWord, setDictWord] = useState("");
  const [dictPartOfSpeech, setDictPartOfSpeech] = useState("Noun");
  const [dictDefinition, setDictDefinition] = useState("");
  const [dictSaving, setDictSaving] = useState(false);
  const [activeDictTooltip, setActiveDictTooltip] = useState(null);
  const settingsRef = useRef(null);
  const resultTextRef = useRef(null);
  const readAlongSessionRef = useRef(0);
  const readAlongText = useMemo(() => parseTextForReadAlong(text), [text]);
  const sentences = readAlongText.sentences;
  const paragraphs = readAlongText.paragraphs;
  const dictionaryMatchesBySentence = useMemo(
    () => buildSentenceDictionaryMatches(sentences, dictionaryAnnotations),
    [sentences, dictionaryAnnotations]
  );

  useEffect(() => {
    if (!settingsOpen) return;
    const onDoc = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [settingsOpen]);

  useEffect(() => {
    if (!activeDictTooltip) return;
    const onDoc = (e) => {
      if (e.target?.closest?.(".dictionary-highlight")) return;
      setActiveDictTooltip(null);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [activeDictTooltip]);

  useEffect(() => {
    return () => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setSelectionToolbar(null);
      return;
    }

    const updateSelectionToolbar = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const sel = window.getSelection();
          if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
            setSelectionToolbar(null);
            return;
          }
          const root = resultTextRef.current;
          if (!root) return;
          const inRoot = (node) => {
            if (!node) return false;
            const el = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
            return el ? root.contains(el) : false;
          };
          if (!inRoot(sel.anchorNode) || !inRoot(sel.focusNode)) {
            setSelectionToolbar(null);
            return;
          }
          const raw = sel.toString().replace(/\s+/g, " ").trim();
          if (!raw || raw.length > MAX_SELECTION_CHARS) {
            setSelectionToolbar(null);
            return;
          }
          const range = sel.getRangeAt(0);
          const rect = rangeViewportRect(range);
          if (rect.width === 0 && rect.height === 0) {
            setSelectionToolbar(null);
            return;
          }
          setSelectionToolbar({
            text: raw,
            top: rect.bottom + 8,
            left: rect.left + rect.width / 2,
          });
        });
      });
    };

    const hideToolbar = () => setSelectionToolbar(null);

    const onDocMouseDown = (e) => {
      if (e.target?.closest?.("[data-dictionary-selection-toolbar]")) return;
      setSelectionToolbar(null);
    };

    document.addEventListener("mouseup", updateSelectionToolbar);
    window.addEventListener("scroll", hideToolbar, true);
    document.addEventListener("mousedown", onDocMouseDown, true);

    return () => {
      document.removeEventListener("mouseup", updateSelectionToolbar);
      window.removeEventListener("scroll", hideToolbar, true);
      document.removeEventListener("mousedown", onDocMouseDown, true);
    };
  }, [user]);

  useEffect(() => {
    if (!dictDrawerOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        setDictDrawerOpen(false);
        setDictSaving(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dictDrawerOpen]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  };

  const handleDownload = () => {
    try {
      downloadConvertedText(text, outputFormat, downloadBaseName);
      showToast("Download started");
    } catch (err) {
      console.error(err);
      showToast("Download failed — try again");
    }
  };

  const speakSentence = (sentence, index, onEnd) => {
    if (!("speechSynthesis" in window)) {
      showToast("Speech is not supported in this browser");
      return;
    }
    if (!sentence?.trim()) {
      onEnd?.();
      return;
    }
    const utterance = new SpeechSynthesisUtterance(sentence);
    utterance.onstart = () => {
      setIsPlaying(true);
      setActiveSentenceIndex(index);
    };
    utterance.onerror = () => {
      setIsPlaying(false);
      setActiveSentenceIndex(null);
      showToast("Audio playback failed");
    };
    utterance.onend = () => {
      onEnd?.();
    };
    window.speechSynthesis.speak(utterance);
  };

  const playAllSentences = () => {
    if (!("speechSynthesis" in window)) {
      showToast("Speech is not supported in this browser");
      return;
    }
    if (!sentences.length) {
      showToast("No text to read");
      return;
    }

    window.speechSynthesis.cancel();
    const sessionId = Date.now();
    readAlongSessionRef.current = sessionId;

    const speakNext = (index) => {
      if (readAlongSessionRef.current !== sessionId) return;
      if (index >= sentences.length) {
        setIsPlaying(false);
        setActiveSentenceIndex(null);
        return;
      }
      speakSentence(sentences[index], index, () => speakNext(index + 1));
    };

    speakNext(0);
  };

  const stopPlayback = () => {
    readAlongSessionRef.current += 1;
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setActiveSentenceIndex(null);
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      stopPlayback();
      return;
    }
    playAllSentences();
  };

  const handleSentenceClick = (sentence, index) => {
    const picked = window.getSelection()?.toString()?.trim();
    if (picked) return;
    stopPlayback();
    speakSentence(sentence, index, () => {
      setIsPlaying(false);
      setActiveSentenceIndex(null);
    });
  };

  const openDictionaryDrawer = () => {
    if (!selectionToolbar?.text) return;
    setDictWord(selectionToolbar.text);
    setDictPartOfSpeech("Noun");
    setDictDefinition("");
    setDictDrawerOpen(true);
    setSelectionToolbar(null);
    window.getSelection()?.removeAllRanges();
  };

  const closeDictionaryDrawer = () => {
    setDictDrawerOpen(false);
    setDictSaving(false);
  };

  const submitDictionaryEntry = async (e) => {
    e.preventDefault();
    const word = dictWord.trim();
    const definition = dictDefinition.trim();
    if (!word || !definition) {
      showToast("Word and definition are required");
      return;
    }
    setDictSaving(true);
    try {
      const res = await apiFetch("/api/dictionary", {
        method: "POST",
        body: JSON.stringify({
          word,
          partOfSpeech: dictPartOfSpeech,
          definition,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data.error || "Could not save");
        return;
      }
      showToast(`Added “${word}” to dictionary`);
      closeDictionaryDrawer();
    } catch {
      showToast("Could not save");
    } finally {
      setDictSaving(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { margin: 0; }

        .dictionary-highlight {
          position: relative;
          display: inline;
          padding: 0 3px;
          border-radius: 4px;
          background: rgba(255, 152, 0, 0.42);
          color: inherit;
          cursor: pointer;
          box-decoration-break: clone;
          -webkit-box-decoration-break: clone;
        }

        .dictionary-highlight:hover,
        .dictionary-highlight.active {
          background: rgba(255, 152, 0, 0.62);
        }

        .dictionary-highlight:focus {
          outline: 2px solid #e65100;
          outline-offset: 2px;
        }

        .dictionary-tooltip {
          position: absolute;
          left: 50%;
          bottom: calc(100% + 8px);
          z-index: 20;
          width: max-content;
          max-width: min(260px, 70vw);
          padding: 8px 10px;
          border-radius: 8px;
          background: rgba(28, 28, 28, 0.95);
          color: #ffffff;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.22);
          font-size: 13px;
          font-weight: 500;
          line-height: 1.35;
          opacity: 0;
          pointer-events: none;
          transform: translate(-50%, -4px);
          transition: opacity 0.15s ease, transform 0.15s ease;
          white-space: normal;
        }

        .dictionary-tooltip::after {
          content: "";
          position: absolute;
          left: 50%;
          top: 100%;
          transform: translateX(-50%);
          border: 6px solid transparent;
          border-top-color: rgba(28, 28, 28, 0.95);
        }

        .dictionary-highlight:hover .dictionary-tooltip,
        .dictionary-highlight:focus .dictionary-tooltip,
        .dictionary-highlight.active .dictionary-tooltip {
          opacity: 1;
          transform: translate(-50%, -8px);
        }
      `}</style>

      <div style={{
        fontFamily: "'DM Sans', sans-serif",
        background: R.pageBg,
        minHeight: "100vh",
        width: "100vw",
        display: "flex",
        flexDirection: "column",
        color: R.text,
        transition: "background 0.2s, color 0.2s",
      }}>
        <header style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 28px", background: R.headerBg, borderBottom: `1px solid ${R.border}`,
          position: "sticky", top: 0, zIndex: 100,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {user ? (
              <>
                <button
                  type="button"
                  aria-label="Dictionary"
                  onClick={() => navigate("/dictionary")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    padding: "6px 12px",
                    background: "transparent",
                    border: `1px solid ${R.border}`,
                    borderRadius: "999px",
                    color: R.text,
                    cursor: "pointer",
                    marginRight: "2px",
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                    <path d="M8 7h8M8 11h6" />
                  </svg>
                  Dictionary
                </button>
                <button
                  type="button"
                  onClick={() => logout()}
                  style={{
                    border: `1px solid ${R.border}`,
                    background: "transparent",
                    color: R.text,
                    padding: "6px 14px",
                    borderRadius: "999px",
                    fontSize: "14px",
                    fontWeight: "500",
                    cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                    marginRight: "4px",
                  }}
                >
                  Log out
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => navigate("/signin")}
                style={{
                  border: `1px solid ${R.border}`,
                  background: "transparent",
                  color: R.text,
                  padding: "6px 14px",
                  borderRadius: "999px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                  marginRight: "4px",
                }}
              >
                Sign in
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate("/")}
              style={{
                display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none",
                fontSize: "15px", fontWeight: "500", cursor: "pointer", padding: "6px 10px", borderRadius: "6px",
                fontFamily: "'DM Sans', sans-serif", color: R.text,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
              Back
            </button>
            <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: "22px", color: R.text }}>Luminara</span>
          </div>

          <div ref={settingsRef} style={{ display: "flex", alignItems: "center", gap: "10px", position: "relative" }}>
            <button
              type="button"
              onClick={handleDownload}
              style={{
                display: "flex", alignItems: "center", gap: "7px", background: "#6B8F6E", color: "#fff",
                border: "none", borderRadius: "8px", padding: "8px 16px", fontSize: "14px", fontWeight: "500",
                cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Download
            </button>
            <button
              type="button"
              aria-expanded={settingsOpen}
              aria-haspopup="true"
              aria-label="Settings"
              onClick={(e) => { e.stopPropagation(); setSettingsOpen((o) => !o); }}
              style={{
                background: "none", border: "none", cursor: "pointer", color: R.stroke,
                padding: "6px", borderRadius: "6px", display: "flex", alignItems: "center",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            </button>
            {settingsOpen && <SettingsMenu />}
          </div>
        </header>

        <div style={{
          display: "flex", alignItems: "center", gap: "14px",
          background: R.audioBarBg, borderBottom: `1px solid ${R.border}`, padding: "10px 28px",
        }}>
          <span style={{ fontSize: "12px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.08em", color: R.textMuted, whiteSpace: "nowrap" }}>🔊 Audio</span>
          <button
            type="button"
            onClick={handlePlayPause}
            style={{
              display: "flex", alignItems: "center", gap: "6px", background: "#6B8F6E", color: "#fff",
              border: "none", borderRadius: "6px", padding: "7px 14px", fontSize: "13px", fontWeight: "500",
              cursor: "pointer", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap",
            }}
          >
            {isPlaying ? (
              <><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Pause</>
            ) : (
              <><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg> Play Audio</>
            )}
          </button>
          <div style={{ flex: 1, height: "4px", background: R.progressTrack, borderRadius: "2px" }}>
            <div style={{ width: "0%", height: "100%", background: "#6B8F6E", borderRadius: "2px" }} />
          </div>
          <span style={{ fontSize: "13px", color: R.textMuted, whiteSpace: "nowrap" }}>0:00 / 0:00</span>
          <button
            type="button"
            onClick={() => showToast("Exporting audio… (connect TTS backend)")}
            style={{
              display: "flex", alignItems: "center", gap: "6px", background: "none",
              border: `1px solid ${R.border}`, borderRadius: "6px", padding: "6px 12px", fontSize: "13px",
              cursor: "pointer", fontFamily: "'DM Sans', sans-serif", color: R.text,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export Audio
          </button>
        </div>

        <main style={{ flex: 1, padding: "32px 28px" }}>
          <div style={{
            background: R.cardBg, borderRadius: "12px", padding: "40px 48px", maxWidth: "860px",
            margin: "0 auto", boxShadow: R.shadow,
          }}>
            <div style={{ fontSize: "22px", fontWeight: "600", marginBottom: "6px", color: R.text }}>Converted Text</div>
            <div style={{ fontSize: "14px", color: R.textMuted, marginBottom: "28px" }}>Here is your extracted content</div>
            <div ref={resultTextRef} style={{ fontSize: "15px", lineHeight: "1.8", color: R.text, userSelect: "text" }}>
              {paragraphs.map((sentenceIndexes, paragraphIndex) => (
                <p
                  key={`p-${paragraphIndex}`}
                  style={{ margin: 0, marginBottom: paragraphIndex === paragraphs.length - 1 ? 0 : "14px" }}
                >
                  {sentenceIndexes.map((sentenceIndex, i) => {
                    const sentence = sentences[sentenceIndex];
                    const isActive = activeSentenceIndex === sentenceIndex;
                    const isHovered = hoveredSentenceIndex === sentenceIndex;
                    return (
                      <span key={`s-${sentenceIndex}`}>
                        <span
                          onMouseEnter={() => setHoveredSentenceIndex(sentenceIndex)}
                          onMouseLeave={() => setHoveredSentenceIndex(null)}
                          onClick={() => handleSentenceClick(sentence, sentenceIndex)}
                          title="Click to read this sentence"
                          style={{
                            padding: "2px 4px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            transition: "background-color 0.15s ease",
                            background: isActive
                              ? "rgba(107, 143, 110, 0.35)"
                              : isHovered
                                ? "rgba(107, 143, 110, 0.18)"
                                : "transparent",
                          }}
                        >
                          {(() => {
                            const matches = dictionaryMatchesBySentence[sentenceIndex] || [];
                            if (!matches.length) {
                              return <span>{sentence}</span>;
                            }

                            const sentenceParts = [];
                            let cursor = 0;
                            matches.forEach((match, partIndex) => {
                              if (match.start > cursor) {
                                sentenceParts.push(
                                  <span key={`text-${sentenceIndex}-${partIndex}-before`}>
                                    {sentence.slice(cursor, match.start)}
                                  </span>
                                );
                              }
                              const tooltipKey = `dict-${sentenceIndex}-${partIndex}`;
                              sentenceParts.push(
                                <span
                                  key={tooltipKey}
                                  className={`dictionary-highlight${activeDictTooltip === tooltipKey ? " active" : ""}`}
                                  tabIndex={0}
                                  aria-label={`${match.text}: ${match.explanation}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveDictTooltip((prev) =>
                                      prev === tooltipKey ? null : tooltipKey
                                    );
                                  }}
                                >
                                  {match.text}
                                  <span className="dictionary-tooltip" role="tooltip">
                                    {match.explanation}
                                  </span>
                                </span>
                              );
                              cursor = match.end;
                            });
                            if (cursor < sentence.length) {
                              sentenceParts.push(
                                <span key={`text-${sentenceIndex}-last`}>
                                  {sentence.slice(cursor)}
                                </span>
                              );
                            }
                            return sentenceParts;
                          })()}
                        </span>
                        {i < sentenceIndexes.length - 1 ? " " : ""}
                      </span>
                    );
                  })}
                </p>
              ))}
            </div>
          </div>
        </main>

        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "14px 28px", background: R.bottomBarBg, borderTop: `1px solid ${R.border}`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button
              type="button"
              onClick={() => { if (window.confirm("Start over? Your current conversion will be cleared.")) navigate("/"); }}
              style={{
                display: "flex", alignItems: "center", gap: "6px", background: "none",
                border: `1px solid ${R.border}`, borderRadius: "6px", padding: "8px 14px", fontSize: "14px",
                cursor: "pointer", fontFamily: "'DM Sans', sans-serif", color: R.text,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.37"/></svg>
              Reset / Clear
            </button>
            <div style={{
              display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: R.textMuted,
              background: R.pillBg, padding: "6px 12px", borderRadius: "6px",
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              Output: <strong style={{ color: R.text }}>{formatLabel(outputFormat)}</strong>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDownload}
            style={{
              display: "flex", alignItems: "center", gap: "7px", background: "#6B8F6E", color: "#fff",
              border: "none", borderRadius: "8px", padding: "10px 20px", fontSize: "14px", fontWeight: "500",
              cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Download File
          </button>
        </div>

        {user &&
          selectionToolbar &&
          typeof document !== "undefined" &&
          createPortal(
            <div
              data-dictionary-selection-toolbar
              style={{
                position: "fixed",
                top: selectionToolbar.top,
                left: selectionToolbar.left,
                transform: "translate(-50%, 0)",
                zIndex: 10050,
                boxShadow: R.shadow,
                pointerEvents: "auto",
              }}
            >
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={openDictionaryDrawer}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 14px",
                  borderRadius: "10px",
                  border: `1px solid ${R.border}`,
                  background: R.cardBg,
                  color: R.text,
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                  whiteSpace: "nowrap",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  <path d="M8 7h8M8 11h6" />
                </svg>
                Add to dictionary
              </button>
            </div>,
            document.body
          )}

        {dictDrawerOpen && (
          <>
            <button
              type="button"
              aria-label="Close dictionary panel"
              onClick={closeDictionaryDrawer}
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 500,
                border: "none",
                background: "rgba(0,0,0,0.35)",
                cursor: "pointer",
              }}
            />
            <aside
              role="dialog"
              aria-labelledby="dict-drawer-title"
              style={{
                position: "fixed",
                top: 0,
                right: 0,
                bottom: 0,
                width: "min(400px, 100vw)",
                zIndex: 501,
                background: R.cardBg,
                borderLeft: `1px solid ${R.border}`,
                boxShadow: "-8px 0 24px rgba(0,0,0,0.12)",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2 id="dict-drawer-title" style={{ fontSize: "18px", fontWeight: "600", color: R.text }}>
                  Add to dictionary
                </h2>
                <button
                  type="button"
                  onClick={closeDictionaryDrawer}
                  aria-label="Close"
                  style={{
                    background: "none",
                    border: "none",
                    color: R.textMuted,
                    cursor: "pointer",
                    padding: "4px",
                    fontSize: "22px",
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </div>
              <form onSubmit={submitDictionaryEntry} style={{ display: "flex", flexDirection: "column", gap: "16px", flex: 1 }}>
                <div>
                  <label htmlFor="dict-word" style={{ display: "block", fontSize: "13px", fontWeight: "500", marginBottom: "6px", color: R.text }}>
                    Word or phrase
                  </label>
                  <input
                    id="dict-word"
                    type="text"
                    value={dictWord}
                    onChange={(e) => setDictWord(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: `1px solid ${R.border}`,
                      background: darkMode ? "#252520" : "#fff",
                      color: R.text,
                      fontSize: "14px",
                    }}
                  />
                </div>
                <div>
                  <label htmlFor="dict-pos" style={{ display: "block", fontSize: "13px", fontWeight: "500", marginBottom: "6px", color: R.text }}>
                    Part of speech
                  </label>
                  <select
                    id="dict-pos"
                    value={dictPartOfSpeech}
                    onChange={(e) => setDictPartOfSpeech(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: `1px solid ${R.border}`,
                      background: darkMode ? "#252520" : "#fff",
                      color: R.text,
                      fontSize: "14px",
                    }}
                  >
                    <option>Noun</option>
                    <option>Verb</option>
                    <option>Adjective</option>
                    <option>Adverb</option>
                    <option>Other</option>
                  </select>
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
                  <label htmlFor="dict-def" style={{ display: "block", fontSize: "13px", fontWeight: "500", marginBottom: "6px", color: R.text }}>
                    Definition
                  </label>
                  <textarea
                    id="dict-def"
                    value={dictDefinition}
                    onChange={(e) => setDictDefinition(e.target.value)}
                    rows={5}
                    placeholder="What does this mean in simple terms?"
                    style={{
                      width: "100%",
                      flex: 1,
                      minHeight: "120px",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: `1px solid ${R.border}`,
                      background: darkMode ? "#252520" : "#fff",
                      color: R.text,
                      fontSize: "14px",
                      resize: "vertical",
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  />
                </div>
                <div style={{ display: "flex", gap: "10px", marginTop: "auto", paddingTop: "12px" }}>
                  <button
                    type="button"
                    onClick={closeDictionaryDrawer}
                    style={{
                      flex: 1,
                      padding: "12px",
                      borderRadius: "8px",
                      border: `1px solid ${R.border}`,
                      background: "transparent",
                      color: R.text,
                      fontSize: "14px",
                      fontWeight: "500",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={dictSaving}
                    style={{
                      flex: 1,
                      padding: "12px",
                      borderRadius: "8px",
                      border: "none",
                      background: dictSaving ? "#9aaa9c" : "#6B8F6E",
                      color: "#fff",
                      fontSize: "14px",
                      fontWeight: "600",
                      cursor: dictSaving ? "not-allowed" : "pointer",
                    }}
                  >
                    {dictSaving ? "Saving…" : "Save"}
                  </button>
                </div>
              </form>
            </aside>
          </>
        )}

        {toast && (
          <div style={{
            position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)",
            background: darkMode ? "#e8e4dc" : "#1C1C1C", color: darkMode ? "#121210" : "white",
            padding: "10px 20px", borderRadius: "8px", fontSize: "14px", zIndex: 999,
          }}
          >
            {toast}
          </div>
        )}
      </div>
    </>
  );
}
