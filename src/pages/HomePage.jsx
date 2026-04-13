import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import FeatureHero from "../components/home/FeatureHero";
import HomeHero from "../components/home/HomeHero";
import SeriesCard from "../components/shared/SeriesCard";
import { useAppSettings } from "../lib/appSettings";
import { getAllCreators, getAllSeries } from "../lib/toouData";
import { getTrendingScore, titleCase } from "../lib/utils";

const trendingTabs = [
  ["all", "All"],
  ["webtoon", "Webtoon"],
  ["novel", "Novel"],
  ["comics", "Comics"],
  ["knowledge", "Knowledge"],
  ["other", "Other"]
];

function Section({ title, children, titleClassName = "" }) {
  return (
    <section className="section">
      <div className={`section-title ${titleClassName}`.trim()}>{title}</div>
      {children}
    </section>
  );
}

export default function HomePage() {
  const { t } = useAppSettings();
  const [currentTrendingCategory, setCurrentTrendingCategory] = useState("all");
  const allSeries = useMemo(() => getAllSeries(), []);
  const allCreators = useMemo(() => getAllCreators(), []);

  const sortedSeries = [...allSeries].sort(
    (left, right) => getTrendingScore(right) - getTrendingScore(left)
  );
  const heroTypeOrder = ["webtoon", "novel", "comics", "knowledge"];
  const heroSeed = heroTypeOrder
    .map((type) => sortedSeries.find((item) => item.type === type))
    .filter(Boolean);
  const heroSource = heroSeed.length === heroTypeOrder.length ? heroSeed : sortedSeries.slice(0, 4);
  const heroCategories = heroSource.map((item) => ({
    name: titleCase(item.type),
    title: item.title,
    desc: item.synopsis,
    img: item.detailImage || item.image
  }));
  const heroSlides = heroSource.map((item) => ({
    category: titleCase(item.type),
    title: item.title,
    summary: item.synopsis,
    views: item.views,
    likes: item.likes,
    image: item.detailImage || item.image,
    slug: item.slug
  }));
  const trendingSeries = sortedSeries.filter((item) => {
    if (currentTrendingCategory === "all") return true;
    if (currentTrendingCategory === "other") {
      return !["webtoon", "novel", "comics", "knowledge"].includes(item.type);
    }
    return item.type === currentTrendingCategory;
  });
  const topPicks = allSeries;
  const bingeSeries = [...allSeries].reverse();
  const knowledgeBooks = allSeries.filter((item) => item.type === "knowledge");
  const newReleases = sortedSeries.filter((item) =>
    ["new", "new ep", "new episode"].includes(String(item.badge || "").toLowerCase())
  );
  const studios = allCreators.filter((item) => item.type === "studio");
  const individuals = allCreators.filter((item) => item.type !== "studio");

  return (
    <>
      <HomeHero categories={heroCategories} />

      <section className="section" id="trendingSection">
        <div className="section-title">{`🚀 ${t("Trending Now")}`}</div>
        <div id="category-tabs">
          {trendingTabs.map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`category-btn ${currentTrendingCategory === value ? "active" : ""}`}
              onClick={() => setCurrentTrendingCategory(value)}
            >
              {t(label)}
            </button>
          ))}
        </div>
        <div className="trending">
          {trendingSeries.map((item) => (
            <SeriesCard key={item.id} item={item} />
          ))}
        </div>
      </section>

      <Section title={`✨ ${t("New Releases")}`}>
        <div className="trending">
          {newReleases.map((item) => (
            <SeriesCard key={item.id} item={item} />
          ))}
        </div>
      </Section>

      <section className="section ads-section">
        <div className="section-title">{t("Advertisement")}</div>
        <div className="ads-container">
          {[
            ["Sponsored", "Big Sale - Up to 50% Off"],
            ["New", "New Novels Released"],
            ["Event", "Play & Earn Rewards"],
            ["Premium", "Premium Content Unlock"]
          ].map(([label, title]) => (
            <article className="home-ad-card" key={title}>
              <img src="/images/image1.png" alt={title} />
              <div className="home-ad-copy">
                <div className="home-ad-label">{label}</div>
                <div className="home-ad-title">{title}</div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <Section title="🔥 TOOU Top Picks">
        <div className="trending">
          {topPicks.map((item) => (
            <SeriesCard key={item.id} item={item} />
          ))}
        </div>
      </Section>

      <Section title="📺 Binge-worthy Series">
        <div className="trending">
          {bingeSeries.map((item) => (
            <SeriesCard key={item.id} item={item} />
          ))}
        </div>
      </Section>

      <section className="section">
        <div className="section-title">{t("Promotion")}</div>
        <FeatureHero slides={heroSlides} />
      </section>

      <Section title={`📚 ${t("Knowledge")}`}>
        <div className="trending">
          {knowledgeBooks.map((item) => (
            <SeriesCard key={item.id} item={item} />
          ))}
        </div>
      </Section>

      <Section title={t("Studios")}>
        <div className="studios">
          {studios.map((item) => (
            <Link key={item.id} className="studio" to={`/creator-info?creator=${item.slug}`}>
              <img src={item.avatar} alt={item.name} />
              <div className="studio-name">{item.name}</div>
              <div className="studio-heat">
                <span>🔥</span> {Number.parseFloat(item.rating).toFixed(1)} Heat
              </div>
            </Link>
          ))}
        </div>
      </Section>

      <Section title={t("Individual Creators")}>
        <div className="individual-creators">
          {individuals.map((item) => (
            <Link
              key={item.id}
              className="studio person-entry"
              to={`/creator-info?creator=${item.slug}`}
            >
              <img src={item.avatar} alt={item.name} />
              <div className="studio-name">{item.name}</div>
              <div className="studio-heat">
                <span>🔥</span> {Number.parseFloat(item.rating).toFixed(1)} Heat
              </div>
            </Link>
          ))}
        </div>
      </Section>

      <Section title={t("Recommended For You")}>
        <div className="recommended">
          {allSeries.slice(0, 6).map((item) => (
            <Link key={item.id} className="reco-link" to={`/detail?series=${item.slug}`}>
              <div className="reco-item">
                <img src={item.image} alt={item.title} />
                <div className="reco-info">
                  <div className="reco-title">{item.title}</div>
                  <div className="reco-meta">{item.rating} star - {item.genre}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Section>
    </>
  );
}
