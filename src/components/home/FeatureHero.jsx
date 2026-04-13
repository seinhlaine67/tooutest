import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function FeatureHero({ slides }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return undefined;

    const timer = window.setInterval(() => {
      setCurrentSlide((value) => (value + 1) % slides.length);
    }, 4500);

    return () => window.clearInterval(timer);
  }, [slides.length]);

  if (!slides.length) return null;

  return (
    <div className="promo-slider home-promo-slider">
      <div
        className="promo-track"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {slides.map((slide) => (
          <article
            key={slide.slug}
            className="promo-slide home-promo-slide"
            style={{ "--bg-image": `url('${slide.image}')` }}
          >
            <div className="promo-content home-promo-content">
              <div className="promo-tag">{slide.category}</div>
              <div className="promo-title">{slide.title}</div>
              <div className="promo-copy">{slide.summary}</div>
              <div className="hero-meta home-promo-meta">
                <span>
                  <i className="fa-regular fa-eye" /> {slide.views}
                </span>
                <span>
                  <i className="fa-regular fa-heart" /> {slide.likes}
                </span>
              </div>
              <div className="hero-actions">
                <Link className="read-btn" to={`/detail?series=${slide.slug}`}>
                  Read Now
                </Link>
                <Link className="hero-link-btn" to="/explore">
                  More Like This
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
      <div className="promo-dots home-promo-dots">
        {slides.map((slide, index) => (
          <button
            key={slide.slug}
            className={`promo-dot ${index === currentSlide ? "active" : ""}`}
            type="button"
            onClick={() => setCurrentSlide(index)}
            aria-label={`Go to promotion ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
