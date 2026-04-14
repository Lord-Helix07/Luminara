import { useTheme } from "./ThemeContext.jsx";
import { ToggleSwitch } from "./ToggleSwitch.jsx";

const OPTIONAL_FEATURES = [
  "Playback Speed",
  "Pause / Resume Audio",
  "Copy to Clipboard",
  "Simplify Text",
];

/** Same settings panel on the home page and the result page. */
export function SettingsMenu() {
  const { t, darkMode, setDarkMode } = useTheme();

  return (
    <div
      role="menu"
      style={{
        position: "absolute",
        top: "44px",
        right: 0,
        background: t.dropdownBg,
        border: `1px solid ${t.dropdownBorder}`,
        borderRadius: "12px",
        boxShadow: t.dropdownShadow,
        padding: "16px 18px",
        minWidth: "260px",
        zIndex: 200,
      }}
    >
      <p
        style={{
          fontSize: "11px",
          fontWeight: "600",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: t.dropdownTitle,
          marginBottom: "14px",
        }}
      >
        Settings
      </p>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "16px",
          fontSize: "14px",
          color: t.text,
        }}
      >
        <span>Dark mode</span>
        <ToggleSwitch enabled={darkMode} onChange={setDarkMode} />
      </div>

      <div
        style={{
          marginTop: "14px",
          paddingTop: "14px",
          borderTop: `1px solid ${t.ttsPanelBorder}`,
        }}
      >
        <p
          style={{
            fontSize: "11px",
            fontWeight: "600",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: t.dropdownTitle,
            marginBottom: "10px",
          }}
        >
          Optional features
        </p>
        {OPTIONAL_FEATURES.map((label, i) => (
          <div
            key={label}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "14px",
              color: t.textMuted,
              padding: "8px 0",
              borderBottom:
                i < OPTIONAL_FEATURES.length - 1
                  ? `1px solid ${t.ttsPanelBorder}`
                  : "none",
            }}
          >
            <span>{label}</span>
            <span style={{ fontStyle: "italic", fontSize: "12px", color: t.dropdownTitle }}>
              coming soon
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
