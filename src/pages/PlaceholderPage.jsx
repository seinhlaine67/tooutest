export default function PlaceholderPage({ title }) {
  return (
    <div className="section" style={{ minHeight: "40vh" }}>
      <div className="section-title">{title}</div>
      <p style={{ marginTop: 12, color: "#6f6a7d", lineHeight: 1.6 }}>
        This page is now routed through React. Its full legacy markup can be
        migrated next while keeping the same styling patterns already used on
        the home and explore pages.
      </p>
    </div>
  );
}
