export default function LoadingSpinner({
  label = "Loading...",
  fullScreen = false,
  className = ""
}) {
  return (
    <div
      className={`loading-spinner-shell ${fullScreen ? "loading-spinner-fullscreen" : ""} ${className}`.trim()}
      role="status"
      aria-live="polite"
    >
      <div className="loading-spinner-card">
        <div className="loading-spinner-circle" />
        <p>{label}</p>
      </div>
    </div>
  );
}
