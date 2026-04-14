/*
This file is used to toggle the switch on the homepage.
*/

export function ToggleSwitch({ enabled, onChange }) {
  return (
    <button
      type="button"
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
}
