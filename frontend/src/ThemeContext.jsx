import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from "react";

const STORAGE_KEY = "luminara-dark-mode";

const ThemeContext = createContext(null);

const light = {
  bg: "#eae6de",
  headerBg: "#eae6de",
  headerBorder: "#d4cfc6",
  title: "#1a1a1a",
  settingsIcon: "#888",
  cardBg: "#ffffff",
  cardShadow: "0 4px 24px rgba(0,0,0,0.07)",
  dropBorder: "#b8ccb8",
  dropBorderHi: "#6b8f6b",
  dropBg: "#ffffff",
  dropBgHi: "#f0f5f0",
  iconBoxBg: "#f5f5f5",
  brand: "#6b8f6b",
  text: "#1a1a1a",
  textMuted: "#777777",
  textSoft: "#888888",
  textHint: "#888888",
  textFooter: "#bbbbbb",
  selectBg: "#ffffff",
  selectFg: "#333333",
  selectBorder: "#cccccc",
  radioBorder: "#cccccc",
  radioOn: "#2563eb",
  inputBg: "#ffffff",
  inputFg: "#1a1a1a",
  sectionMuted: "#999999",
  ttsPanelBg: "#fafafa",
  ttsPanelBorder: "#e8e8e8",
  resetLink: "#999999",
  error: "#b45309",
  btnDisabled: "#a3b5a3",
  btn: "#6b8f6b",
  btnHover: "#5a7a5a",
  loadTrack: "#e5e5e5",
  loadBar: "#6b8f6b",
  dropdownBg: "#ffffff",
  dropdownBorder: "#d4cfc6",
  dropdownTitle: "#6b6860",
  dropdownShadow: "0 4px 20px rgba(0,0,0,0.12)",
};

const dark = {
  bg: "#121210",
  headerBg: "#161614",
  headerBorder: "#2e2e2a",
  title: "#e8e4dc",
  settingsIcon: "#a8a49c",
  cardBg: "#1c1c19",
  cardShadow: "0 4px 28px rgba(0,0,0,0.5)",
  dropBorder: "#4a5f4a",
  dropBorderHi: "#6b8f6b",
  dropBg: "#1c1c19",
  dropBgHi: "#232320",
  iconBoxBg: "#252520",
  brand: "#7a9a7a",
  text: "#e8e4dc",
  textMuted: "#a8a49c",
  textSoft: "#8a8680",
  textHint: "#8a8680",
  textFooter: "#6b6860",
  selectBg: "#252520",
  selectFg: "#e8e4dc",
  selectBorder: "#3d3d38",
  radioBorder: "#5a5a54",
  radioOn: "#3b82f6",
  inputBg: "#252520",
  inputFg: "#e8e4dc",
  sectionMuted: "#8a8680",
  ttsPanelBg: "#1e1e1b",
  ttsPanelBorder: "#3d3d38",
  resetLink: "#8a8680",
  error: "#fbbf24",
  btnDisabled: "#4a5a4a",
  btn: "#6b8f6b",
  btnHover: "#5a7a5a",
  loadTrack: "#2e2e2a",
  loadBar: "#6b8f6b",
  dropdownBg: "#252520",
  dropdownBorder: "#3d3d38",
  dropdownTitle: "#a8a49c",
  dropdownShadow: "0 8px 28px rgba(0,0,0,0.45)",
};

export function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, darkMode ? "1" : "0");
    } catch {
      /* ignore */
    }
    document.documentElement.setAttribute(
      "data-theme",
      darkMode ? "dark" : "light"
    );
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode((d) => !d);

  const value = useMemo(
    () => ({
      darkMode,
      setDarkMode,
      toggleDarkMode,
      t: darkMode ? dark : light,
    }),
    [darkMode]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}

/** Result page — use: `const R = darkMode ? resultPalettes.dark : resultPalettes.light` */
export const resultPalettes = {
  light: {
    pageBg: "#F4F1EC",
    headerBg: "#F4F1EC",
    border: "#D8D4CB",
    text: "#1C1C1C",
    textMuted: "#6B6860",
    cardBg: "#ffffff",
    audioBarBg: "#ffffff",
    bottomBarBg: "#ffffff",
    pillBg: "#F4F1EC",
    shadow: "0 2px 12px rgba(0,0,0,0.07)",
    stroke: "#6B6860",
    progressTrack: "#EDEAE3",
    rowBorder: "#EDEAE3",
  },
  dark: {
    pageBg: "#121210",
    headerBg: "#161614",
    border: "#2e2e2a",
    text: "#e8e4dc",
    textMuted: "#a8a49c",
    cardBg: "#1c1c19",
    audioBarBg: "#1c1c19",
    bottomBarBg: "#1c1c19",
    pillBg: "#252520",
    shadow: "0 2px 12px rgba(0,0,0,0.4)",
    stroke: "#a8a49c",
    progressTrack: "#2e2e2a",
    rowBorder: "#3d3d38",
  },
};
