import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message ? String(error.message) : "Unknown render error",
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error("UI render error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            padding: "24px",
            fontFamily: "sans-serif",
            background: "#f8f8f8",
            color: "#1a1a1a",
          }}
        >
          <div style={{ maxWidth: "760px", width: "100%" }}>
            <h2 style={{ marginBottom: "8px" }}>Something went wrong on this page.</h2>
            <p style={{ marginBottom: "12px" }}>
              Error: <code>{this.state.errorMessage}</code>
            </p>
            <p>Try refreshing. If this keeps happening, share this error text.</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
