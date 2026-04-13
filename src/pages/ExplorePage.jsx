import { useMemo, useState } from "react";
import SeriesCard from "../components/shared/SeriesCard";
import { useAppSettings } from "../lib/appSettings";
import { getAllSeries } from "../lib/toouData";
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

function Section({ title, items, className = "horizontal-scroll" }) {
  return (
    <div className="section">
      <div className="section-title">{title}</div>
      <div className={className}>
        {items.map((item) => (
          <SeriesCard key={`${title}-${item.id}`} item={item} />
        ))}
      </div>
    </div>
  );
}

export default function ExplorePage() {
  const { t } = useAppSettings();
  const [currentType, setCurrentType] = useState("all");
  const [currentGenre, setCurrentGenre] = useState("all");
  const allSeries = useMemo(() => getAllSeries(), []);

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
          </div>
        </div>
      </div>

      <div className="section">
        <div className="section-title">{t("Top 10 Popularity Ranking")}</div>
        <div className="horizontal-scroll" id="popularityRanking">
          {popularityRanking.slice(0, 10).map((item, index) => (
            <div className="rank-card" key={item.id}>
              <div className="rank-number">#{index + 1}</div>
              <SeriesCard item={item} />
            </div>
          ))}
        </div>
      </div>

      <Section
        title={t("Fall in Romance")}
        items={allSeries.filter((item) => item.genre === "Romance")}
      />
      <Section
        title={t("Get into Action")}
        items={allSeries.filter((item) => item.genre === "Action")}
      />
      <Section
        title={t("Mystery Tales")}
        items={allSeries.filter((item) => item.genre === "Mystery")}
      />
      <Section
        title={t("Fantasy Realms")}
        items={allSeries.filter((item) => item.genre === "Fantasy")}
      />
      <Section
        title={t("Horror Zone")}
        items={allSeries.filter((item) => item.genre === "Horror")}
      />
      <Section
        title={t("Comedy Corner")}
        items={allSeries.filter((item) => item.genre === "Comedy")}
      />
    </>
  );
}
