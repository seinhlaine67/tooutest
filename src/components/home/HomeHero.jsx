import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const staticSideCards = {
  left: [
    { name: "Thriller", img: "/images/image1.png", className: "wt-static-left-3" },
    { name: "Drama", img: "/images/image1.png", className: "wt-static-left-2" },
    { name: "Mystery", img: "/images/image1.png", className: "wt-static-left-1" }
  ],
  right: [
    { name: "Fantasy", img: "/images/image1.png", className: "wt-static-right-1" },
    { name: "Action", img: "/images/image1.png", className: "wt-static-right-2" },
    { name: "Sci-Fi", img: "/images/image1.png", className: "wt-static-right-3" }
  ]
};

export default function HomeHero({ categories }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (categories.length < 2) return undefined;

    const timer = window.setInterval(() => {
      setIndex((value) => (value + 1) % categories.length);
    }, 4000);

    return () => window.clearInterval(timer);
  }, [categories.length]);

  if (!categories.length) return null;

  const current = categories[index];
  const prev = (index - 1 + categories.length) % categories.length;
  const next = (index + 1) % categories.length;
  const currentDetailHref = current.slug || current.id
    ? `/series/${encodeURIComponent(current.slug || current.id)}${current.id ? `?id=${encodeURIComponent(current.id)}` : ""}`
    : "/explore";

  return (
    <section className="wt-hero">
      <div
        className="wt-bg"
        style={{ backgroundImage: `url(${current.img})` }}
      />
      <div className="wt-overlay" />
      <div className="wt-glow wt-glow-left" />
      <div className="wt-glow wt-glow-right" />

      <div className="wt-container">
        <h1>{current.title}</h1>
        <p>{current.desc}</p>
        <div className="wt-hero-actions">
          <Link to={currentDetailHref} className="wt-hero-btn wt-hero-btn-primary">
            Read Now
          </Link>
          <Link to="/explore" className="wt-hero-btn wt-hero-btn-secondary">
            Explore
          </Link>
        </div>

        <div className="wt-carousel">
          {[...staticSideCards.left, ...staticSideCards.right].map((item) => (
            <div
              key={item.className}
              className={`wt-card wt-static ${item.className}`}
            >
              <img src={item.img} alt={item.name} />
              <div className="wt-card-text">{item.name}</div>
            </div>
          ))}

          {categories.map((item, itemIndex) => {
            let positionClass = "wt-hidden";
            if (itemIndex === index) positionClass = "wt-center";
            else if (itemIndex === prev) positionClass = "wt-left";
            else if (itemIndex === next) positionClass = "wt-right";

            return (
              <div
                key={item.name}
                className={`wt-card ${positionClass}`}
                role="button"
                tabIndex={0}
                onClick={() => {
                  if (itemIndex === next) setIndex(next);
                  if (itemIndex === prev) setIndex(prev);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    if (itemIndex === next) setIndex(next);
                    if (itemIndex === prev) setIndex(prev);
                  }
                }}
              >
                <img src={item.img} alt={item.name} />
                <div className="wt-card-text">{item.name}</div>
              </div>
            );
          })}
        </div>

        <div className="wt-indicators">
          {categories.map((item, itemIndex) => (
            <span
              key={item.name}
              className={`wt-indicator ${itemIndex === index ? "active" : ""}`}
              aria-label={item.name}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
