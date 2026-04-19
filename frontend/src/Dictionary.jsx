/* 
This page is unfinished and just has the UI for right now.
We will be using the dictionary page in order to allow the user to add confusing words to the dictionary.
Text on discord if you need help with the code or understanding what the page is for.
Assigned to : Ryan + Vishal
  * will need to edit server.py as well
*/
import { useState } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "./ThemeContext.jsx";
import { useAuth } from "./AuthContext.jsx";

export default function Dictionary() {
  const { t } = useTheme();
  const { isAuthenticated } = useAuth();

  const [word, setWord] = useState("");
  const [partOfSpeech, setPartOfSpeech] = useState("Noun");
  const [definition, setDefinition] = useState("");

  const [entries, setEntries] = useState([
    {
      word: "Accessible",
      partOfSpeech: "Adjective",
      definition: "Easy to understand or use for a wide range of people.",
    },
    {
      word: "Comprehend",
      partOfSpeech: "Verb",
      definition: "To understand something clearly.",
    },
  ]);

  const handleAddWord = (e) => {
    e.preventDefault();

    if (!word.trim() || !definition.trim()) {
      alert("Please fill in the word and definition.");
      return;
    }

    const newEntry = {
      word: word.trim(),
      partOfSpeech,
      definition: definition.trim(),
    };

    setEntries([newEntry, ...entries]);
    setWord("");
    setPartOfSpeech("Noun");
    setDefinition("");
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
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
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

        <main
          style={{
            padding: "48px 24px",
            maxWidth: "850px",
            margin: "0 auto",
          }}
        >
          <div
            style={{
              marginBottom: "32px",
              background: t.cardBg || "#fff",
              border: `1px solid ${t.headerBorder}`,
              borderRadius: "18px",
              padding: "24px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
            }}
          >
            <h2
              style={{
                fontSize: "22px",
                marginBottom: "10px",
                color: t.title,
                fontFamily: "'Playfair Display', serif",
              }}
            >
              Build Your Personal Dictionary
            </h2>

            <p
              style={{
                fontSize: "15px",
                color: t.textMuted,
                lineHeight: 1.6,
              }}
            >
              {isAuthenticated
                ? "Add words that are confusing or difficult to understand. Luminara will help organize them into a clean personal dictionary."
                : "You can still explore the dictionary page, but signing in will allow you to save and sync your words later."}
            </p>
          </div>

          <form
            onSubmit={handleAddWord}
            style={{
              background: t.cardBg || "#fff",
              border: `1px solid ${t.headerBorder}`,
              borderRadius: "18px",
              padding: "24px",
              marginBottom: "36px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
            }}
          >
            <h3
              style={{
                fontSize: "20px",
                marginBottom: "18px",
                color: t.title,
              }}
            >
              Add a Word
            </h3>

            <div style={{ display: "grid", gap: "16px" }}>
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "600",
                    color: t.text,
                  }}
                >
                  Word
                </label>
                <input
                  type="text"
                  value={word}
                  onChange={(e) => setWord(e.target.value)}
                  placeholder="Enter a word"
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    borderRadius: "12px",
                    border: `1px solid ${t.headerBorder}`,
                    fontSize: "15px",
                    outline: "none",
                    background: t.inputBg || "#fff",
                    color: t.text,
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "600",
                    color: t.text,
                  }}
                >
                  Part of Speech
                </label>
                <select
                  value={partOfSpeech}
                  onChange={(e) => setPartOfSpeech(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    borderRadius: "12px",
                    border: `1px solid ${t.headerBorder}`,
                    fontSize: "15px",
                    outline: "none",
                    background: t.inputBg || "#fff",
                    color: t.text,
                  }}
                >
                  <option>Noun</option>
                  <option>Verb</option>
                  <option>Adjective</option>
                  <option>Adverb</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "600",
                    color: t.text,
                  }}
                >
                  Definition
                </label>
                <textarea
                  value={definition}
                  onChange={(e) => setDefinition(e.target.value)}
                  placeholder="Enter the meaning of the word"
                  rows="4"
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    borderRadius: "12px",
                    border: `1px solid ${t.headerBorder}`,
                    fontSize: "15px",
                    outline: "none",
                    resize: "vertical",
                    background: t.inputBg || "#fff",
                    color: t.text,
                  }}
                />
              </div>

              <button
                type="submit"
                style={{
                  marginTop: "8px",
                  padding: "14px 18px",
                  borderRadius: "12px",
                  border: "none",
                  background: t.brand,
                  color: "#fff",
                  fontSize: "15px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Add Word
              </button>
            </div>
          </form>

          <section>
            <h3
              style={{
                fontSize: "20px",
                marginBottom: "18px",
                color: t.title,
              }}
            >
              Dictionary Entries
            </h3>

            <div style={{ display: "grid", gap: "16px" }}>
              {entries.length === 0 ? (
                <div
                  style={{
                    padding: "20px",
                    borderRadius: "14px",
                    border: `1px solid ${t.headerBorder}`,
                    background: t.cardBg || "#fff",
                    color: t.textMuted,
                  }}
                >
                  No words added yet.
                </div>
              ) : (
                entries.map((entry, index) => (
                  <div
                    key={index}
                    style={{
                      background: t.cardBg || "#fff",
                      border: `1px solid ${t.headerBorder}`,
                      borderRadius: "16px",
                      padding: "20px",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
                    }}
                  >
                    <h4
                      style={{
                        fontSize: "22px",
                        marginBottom: "6px",
                        color: t.title,
                        fontFamily: "'Playfair Display', serif",
                      }}
                    >
                      {entry.word}
                    </h4>

                    <p
                      style={{
                        fontSize: "14px",
                        fontStyle: "italic",
                        color: t.textMuted,
                        marginBottom: "10px",
                      }}
                    >
                      {entry.partOfSpeech}
                    </p>

                    <p
                      style={{
                        fontSize: "15px",
                        lineHeight: 1.6,
                        color: t.text,
                      }}
                    >
                      {entry.definition}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>
        </main>
      </div>
    </>
  );
}

