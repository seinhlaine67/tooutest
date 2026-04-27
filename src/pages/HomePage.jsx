import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import FeatureHero from "../components/home/FeatureHero";
import HomeHero from "../components/home/HomeHero";
import SeriesCard from "../components/shared/SeriesCard";
import { useAppSettings } from "../lib/appSettings";
import { fetchRemoteCreatorsFromSeries, fetchSeriesList } from "../lib/backend";
import { getAllSeries } from "../lib/toouData";
import { getTrendingScore, titleCase } from "../lib/utils";

const ROCKET = "\u{1F680}";
const SPARKLES = "\u2728";
const FIRE = "\u{1F525}";
const TV = "\u{1F4FA}";
const BOOKS = "\u{1F4DA}";

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

function HomeCardRailSkeleton({ count = 6 }) {
  return (
    <div className="trending">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="home-skeleton-card">
          <div className="home-skeleton-shimmer home-skeleton-card-image" />
          <div className="home-skeleton-shimmer home-skeleton-card-tag" />
          <div className="home-skeleton-shimmer home-skeleton-card-title" />
          <div className="home-skeleton-meta-row">
            <div className="home-skeleton-shimmer home-skeleton-card-meta" />
            <div className="home-skeleton-shimmer home-skeleton-card-meta short" />
          </div>
        </div>
      ))}
    </div>
  );
}

function HomeCreatorRailSkeleton({ count = 5 }) {
  return (
    <div className="studios">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="home-skeleton-creator">
          <div className="home-skeleton-shimmer home-skeleton-creator-avatar" />
          <div className="home-skeleton-shimmer home-skeleton-creator-name" />
          <div className="home-skeleton-shimmer home-skeleton-creator-meta" />
        </div>
      ))}
    </div>
  );
}

function HomeRecommendedSkeleton({ count = 4 }) {
  return (
    <div className="recommended">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="reco-link">
          <div className="reco-item home-skeleton-reco-item">
            <div className="home-skeleton-shimmer home-skeleton-reco-image" />
            <div className="reco-info">
              <div className="home-skeleton-shimmer home-skeleton-reco-line" />
              <div className="home-skeleton-shimmer home-skeleton-reco-line short" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
  const { t } = useAppSettings();
  const [currentTrendingCategory, setCurrentTrendingCategory] = useState("all");
  const staticSeries = useMemo(() => getAllSeries(), []);
  const [remoteSeries, setRemoteSeries] = useState([]);
  const [remoteCreators, setRemoteCreators] = useState([]);
  const [homeStatus, setHomeStatus] = useState("loading");

  useEffect(() => {
    let cancelled = false;

    async function loadHomeData() {
      setHomeStatus("loading");

      try {
        const [seriesList, creatorList] = await Promise.all([
          fetchSeriesList({ limit: 24 }),
          fetchRemoteCreatorsFromSeries({ limit: 50 })
        ]);

        if (cancelled) return;
        setRemoteSeries(seriesList);
        setRemoteCreators(creatorList);
        setHomeStatus("success");
      } catch (error) {
        if (cancelled) return;
        console.error("Failed to load backend home data:", error);
        setRemoteSeries([]);
        setRemoteCreators([]);
        setHomeStatus("error");
      }
    }

    loadHomeData();
    return () => {
      cancelled = true;
    };
  }, []);

  const allSeries = remoteSeries;
  const allCreators = remoteCreators;
  const heroCollection = allSeries.length ? allSeries : staticSeries;
  const sortedSeries = [...allSeries].sort(
    (left, right) => getTrendingScore(right) - getTrendingScore(left)
  );
  const heroTypeOrder = ["webtoon", "novel", "comics", "knowledge"];
  const heroSeed = heroTypeOrder
    .map((type) => heroCollection.find((item) => item.type === type))
    .filter(Boolean);
  const heroSource =
    heroSeed.length === heroTypeOrder.length ? heroSeed : heroCollection.slice(0, 4);
  const heroCategories = heroSource.map((item) => ({
    name: titleCase(item.type),
    title: item.title,
    desc: item.synopsis,
    img: item.detailImage || item.image,
    slug: item.slug,
    id: item.id
  }));
  const heroSlides = heroSource.map((item) => ({
    id: item.id,
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
  const isLoading = homeStatus === "loading";
  const hasLoadError = homeStatus === "error";

  return (
    <>
      <HomeHero categories={heroCategories} />

      {hasLoadError ? (
        <section className="section">
          <div className="section-title">{t("Backend data unavailable")}</div>
          <div className="synopsis">Home content could not be loaded right now.</div>
        </section>
      ) : null}

      <section className="section" id="trendingSection">
        <div className="section-title">{`${ROCKET} ${t("Trending Now")}`}</div>
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
        {isLoading ? (
          <HomeCardRailSkeleton />
        ) : (
          <div className="trending">
            {trendingSeries.map((item) => (
              <SeriesCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>

      <Section title={`${SPARKLES} ${t("New Releases")}`}>
        {isLoading ? (
          <HomeCardRailSkeleton />
        ) : (
          <div className="trending">
            {newReleases.map((item) => (
              <SeriesCard key={item.id} item={item} />
            ))}
          </div>
        )}
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

      <Section title={`${FIRE} TOOU Top Picks`}>
        {isLoading ? (
          <HomeCardRailSkeleton />
        ) : (
          <div className="trending">
            {topPicks.map((item) => (
              <SeriesCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </Section>

      <Section title={`${TV} Binge-worthy Series`}>
        {isLoading ? (
          <HomeCardRailSkeleton />
        ) : (
          <div className="trending">
            {bingeSeries.map((item) => (
              <SeriesCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </Section>

      <section className="section">
        <div className="section-title">{t("Promotion")}</div>
        <FeatureHero slides={heroSlides} />
      </section>

      <Section title={`${BOOKS} ${t("Knowledge")}`}>
        {isLoading ? (
          <HomeCardRailSkeleton />
        ) : (
          <div className="trending">
            {knowledgeBooks.map((item) => (
              <SeriesCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </Section>

      <Section title={t("Studios")}>
        {isLoading ? (
          <HomeCreatorRailSkeleton />
        ) : (
          <div className="studios">
            {studios.map((item) => (
              <Link key={item.id} className="studio" to={`/creator-info?creator=${item.slug}`}>
                <img src={item.avatar} alt={item.name} />
                <div className="studio-name">{item.name}</div>
                <div className="studio-heat">
                  <span>{FIRE}</span> {Number.parseFloat(item.rating).toFixed(1)} Heat
                </div>
              </Link>
            ))}
          </div>
        )}
      </Section>

      <Section title={t("Individual Creators")}>
        {isLoading ? (
          <HomeCreatorRailSkeleton />
        ) : (
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
                  <span>{FIRE}</span> {Number.parseFloat(item.rating).toFixed(1)} Heat
                </div>
              </Link>
            ))}
          </div>
        )}
      </Section>

      <Section title={t("Recommended For You")}>
        {isLoading ? (
          <HomeRecommendedSkeleton />
        ) : (
          <div className="recommended">
            {allSeries.slice(0, 6).map((item) => (
              <Link
                key={item.id}
                className="reco-link"
                to={`/series/${encodeURIComponent(item.slug || item.id)}?id=${encodeURIComponent(item.id)}`}
              >
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
        )}
      </Section>
    </>
  );
}
