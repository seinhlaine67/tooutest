import { useEffect, useState } from "react";
import SeriesCard from "../components/shared/SeriesCard";
import { useAppSettings } from "../lib/appSettings";
import { fetchSeriesList } from "../lib/backend";
import { parseCompactCount } from "../lib/utils";

const typeOptions = ["all", "webtoon", "novel", "comics", "knowledge", "other"];
const genreOptions = [
  "all",
  "Romance",
  "Action",
  "Mystery",
  "Fantasy",
  "Horror",
  "Comedy"
];

function ExploreRailSkeleton({ count = 5, className = "horizontal-scroll" }) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="explore-skeleton-card">
          <div className="explore-skeleton-shimmer explore-skeleton-card-image" />
          <div className="explore-skeleton-shimmer explore-skeleton-card-tag" />
          <div className="explore-skeleton-shimmer explore-skeleton-card-title" />
          <div className="explore-skeleton-meta-row">
            <div className="explore-skeleton-shimmer explore-skeleton-card-meta" />
            <div className="explore-skeleton-shimmer explore-skeleton-card-meta short" />
          </div>
        </div>
      ))}
    </div>
  );
}

function Section({ title, items, isLoading, className = "horizontal-scroll" }) {
  return (
    <div className="section">
      <div className="section-title">{title}</div>
      {isLoading ? (
        <ExploreRailSkeleton count={5} className={className} />
      ) : (
        <div className={className}>
          {items.map((item) => (
            <SeriesCard key={`${title}-${item.id}`} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ExplorePage() {
  const { t } = useAppSettings();
  const [currentType, setCurrentType] = useState("all");
  const [currentGenre, setCurrentGenre] = useState("all");
  const [allSeries, setAllSeries] = useState([]);
  const [exploreStatus, setExploreStatus] = useState("loading");

  useEffect(() => {
    let cancelled = false;

    async function loadExploreData() {
      setExploreStatus("loading");

      try {
        const data = await fetchSeriesList({ limit: 100 });
        if (!cancelled) {
          setAllSeries(data);
          setExploreStatus("success");
        }
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          setAllSeries([]);
          setExploreStatus("error");
        }
      }
    }

    loadExploreData();

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = allSeries.filter((item) => {
    const normalizedType = String(item.type || "").toLowerCase();
    const typeMatch =
      currentType === "all" ||
      (currentType === "other"
        ? !["webtoon", "novel", "comics", "knowledge"].includes(normalizedType)
        : normalizedType === currentType);
    const genreMatch = currentGenre === "all" || item.genre === currentGenre;
    return typeMatch && genreMatch;
  });

  const popularityRanking = [...allSeries].sort(
    (left, right) => parseCompactCount(right.views) - parseCompactCount(left.views)
  );
  const isLoading = exploreStatus === "loading";

  return (
    <>
      <div id="type-tabs">
        {typeOptions.map((type) => (
          <button
            key={type}
            className={`type-btn ${currentType === type ? "active" : ""}`}
            onClick={() => setCurrentType(type)}
          >
            {type === "all" ? t("All") : t(type.charAt(0).toUpperCase() + type.slice(1))}
          </button>
        ))}
      </div>

      <div id="filter-tabs">
        {genreOptions.map((genre) => (
          <button
            key={genre}
            className={`filter-btn ${currentGenre === genre ? "active" : ""}`}
            onClick={() => setCurrentGenre(genre)}
          >
            {genre === "all" ? "All Genres" : genre}
          </button>
        ))}
      </div>

      <div className="section">
        <div className="section-title">{t("Filtered Series")}</div>
        <div className="two-row-grid">
          <div className="filtered-series-stack">
            {isLoading ? (
              <>
                <ExploreRailSkeleton count={5} className="horizontal-scroll filtered-series-row" />
                <ExploreRailSkeleton count={5} className="horizontal-scroll filtered-series-row" />
              </>
            ) : (
              <>
                <div className="horizontal-scroll filtered-series-row">
                  {filtered.slice(0, 10).map((item) => (
                    <SeriesCard key={item.id} item={item} />
                  ))}
                </div>
                {filtered.length > 10 ? (
                  <div className="horizontal-scroll filtered-series-row">
                    {filtered.slice(10, 20).map((item) => (
                      <SeriesCard key={`${item.id}-row-2`} item={item} />
                    ))}
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="section">
        <div className="section-title">{t("Top 10 Popularity Ranking")}</div>
        {isLoading ? (
          <ExploreRailSkeleton count={5} className="horizontal-scroll" />
        ) : (
          <div className="horizontal-scroll" id="popularityRanking">
            {popularityRanking.slice(0, 10).map((item, index) => (
              <div className="rank-card" key={item.id}>
                <div className="rank-number">#{index + 1}</div>
                <SeriesCard item={item} />
              </div>
            ))}
          </div>
        )}
      </div>

      <Section
        title={t("Fall in Romance")}
        items={allSeries.filter((item) => item.genre === "Romance")}
        isLoading={isLoading}
      />
      <Section
        title={t("Get into Action")}
        items={allSeries.filter((item) => item.genre === "Action")}
        isLoading={isLoading}
      />
      <Section
        title={t("Mystery Tales")}
        items={allSeries.filter((item) => item.genre === "Mystery")}
        isLoading={isLoading}
      />
      <Section
        title={t("Fantasy Realms")}
        items={allSeries.filter((item) => item.genre === "Fantasy")}
        isLoading={isLoading}
      />
      <Section
        title={t("Horror Zone")}
        items={allSeries.filter((item) => item.genre === "Horror")}
        isLoading={isLoading}
      />
      <Section
        title={t("Comedy Corner")}
        items={allSeries.filter((item) => item.genre === "Comedy")}
        isLoading={isLoading}
      />
    </>
  );
}
