import { useEffect, useMemo, useState } from "react";
import SeriesCard from "../components/shared/SeriesCard";
import { useAppSettings } from "../lib/appSettings";
import { getStoredList } from "../lib/storage";
import { getAllSeries } from "../lib/toouData";
import "../styles/legacy/library.css";

const adData = [
  { label: "Sponsored", title: "Unlock early access for premium readers", image: "/images/image1.png" },
  { label: "New", title: "New creator campaigns are live this week", image: "/images/image1.png" },
  { label: "Event", title: "Earn bonus coins on your next reading streak", image: "/images/image1.png" }
];

const promoData = [
  {
    tag: "Season Pick",
    title: "A week of epic fantasy premieres",
    copy: "Fresh releases, studio debuts, and long-form sagas curated for binge reading.",
    image: "/images/image1.png"
  },
  {
    tag: "Premium Drop",
    title: "Reader favorites are unlocking early",
    copy: "Get ahead on trending series and catch special chapters before the public release.",
    image: "/images/image1.png"
  },
  {
    tag: "Learning Spotlight",
    title: "Knowledge stories with practical takeaways",
    copy: "Explore bite-sized lessons, thoughtful chapters, and high-retention reading picks.",
    image: "/images/image1.png"
  }
];

function formatHistoryTime(item) {
  const openedAt = Number(item?.openedAt || 0);
  if (!openedAt) return item?.time || "Read recently";
  const diffMs = Math.max(0, Date.now() - openedAt);
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMinutes < 15) return "Read just now";
  if (diffHours < 1) return "Read recently";
  if (diffHours < 24) return `Read ${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  return `Read ${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
}

export default function LibraryPage() {
  const { t } = useAppSettings();
  const readingHistory = getStoredList("toouReadingHistory");
  const favoriteSeriesIds = getStoredList("toouFavoriteSeries");
  const bookmarkedSeriesIds = getStoredList("toouBookmarkedSeries");
  const bookmarkedEpisodes = getStoredList("toouBookmarkedEpisodes");
  const [currentPromo, setCurrentPromo] = useState(0);
  const sharedSeries = useMemo(() => getAllSeries(), []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentPromo((value) => (value + 1) % promoData.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, []);

  const historyData = readingHistory.length
    ? readingHistory
    : [
        {
          title: "Shadows of Destiny",
          slug: "shadows-of-destiny",
          type: "Webtoon",
          episode: "Episode 14: The Shadow Gate",
          progress: 78,
          time: "Read 2 hours ago",
          image: "/images/image1.png"
        },
        {
          title: "Lessons From Tomorrow",
          slug: "psychology-101",
          type: "Knowledge",
          episode: "Chapter 3: Focus and Memory",
          progress: 45,
          time: "Read yesterday",
          image: "/images/image1.png"
        }
      ];

  const favorites = useMemo(
    () => sharedSeries.filter((item) => favoriteSeriesIds.includes(item.id)),
    [favoriteSeriesIds]
  );

  const bookmarkCards = useMemo(() => {
    const seriesCards = sharedSeries
      .filter((item) => bookmarkedSeriesIds.includes(item.id))
      .map((item) => ({
        id: item.id,
        title: item.title,
        slug: item.slug,
        type: item.type,
        episode: "Series bookmarked",
        image: item.image,
        time: "Recently bookmarked"
      }));

    const episodeCards = bookmarkedEpisodes
      .map((item) => {
        const owner = sharedSeries.find((entry) => entry.id === item.seriesId);
        if (!owner) return null;
        return {
          id: `${item.seriesId}-${item.episodeTitle}`,
          title: owner.title,
          slug: owner.slug,
          type: owner.type,
          episode: item.episodeTitle,
          image: owner.image,
          time: item.time || "Recently bookmarked"
        };
      })
      .filter(Boolean);

    return [...seriesCards, ...episodeCards];
  }, [bookmarkedEpisodes, bookmarkedSeriesIds]);

  return (
    <>
      <section className="library-hero">
        <div className="library-kicker">Library</div>
        <h1>Keep reading where you left off.</h1>
        <p>Your recent episodes, highlighted promotions, and tailored suggestions all live here in one mobile-first reading hub.</p>
      </section>

      <section className="section" id="favorites">
        <div className="section-heading">
          <div className="section-title">{t("Reading History")}</div>
          <div className="section-copy section-copy-aligned">
            Episodes and chapters you recently opened across webtoon, comics, knowledge, and novels.
          </div>
        </div>
        <div className="history-list">
          {historyData.map((item) => (
            <a className="history-card" key={`${item.slug}-${item.episode}`} href={`/detail?series=${item.slug}`}>
              <img src={item.image} alt={item.title} />
              <div className="history-copy">
                <div className="history-type"><i className="fa-solid fa-clock-rotate-left" />{item.type}</div>
                <div className="history-title">{item.title}</div>
                <div className="history-episode">{item.episode}</div>
                <div className="history-progress">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${item.progress}%` }} />
                  </div>
                  <div className="progress-meta">
                    <span>{item.progress}% completed</span>
                    <span>{formatHistoryTime(item)}</span>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>

      <section className="section" id="bookmarks">
        <div className="section-heading">
          <div className="section-title">{t("Favorites")}</div>
          <div className="section-copy section-copy-aligned">
            Series you have hearted while browsing and reading.
          </div>
        </div>
        <div className="recommend-rail">
          {favorites.length
            ? favorites.map((item) => <SeriesCard key={item.id} item={item} />)
            : <div className="empty-card">Your favorite series will appear here after you heart them from a detail page.</div>}
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div className="section-title">{t("Bookmarks")}</div>
          <div className="section-copy section-copy-aligned">
            Episodes and chapters you saved to revisit later.
          </div>
        </div>
        <div className="history-list">
          {bookmarkCards.length ? bookmarkCards.map((item) => (
            <a className="history-card" key={item.id} href={`/detail?series=${item.slug}`}>
              <img src={item.image} alt={item.title} />
              <div className="history-copy">
                <div className="history-type"><i className="fa-regular fa-bookmark" />{item.type}</div>
                <div className="history-title">{item.title}</div>
                <div className="history-episode">{item.episode}</div>
                <div className="history-progress">
                  <div className="progress-meta">
                    <span>Saved for later</span>
                    <span>{item.time}</span>
                  </div>
                </div>
              </div>
            </a>
          )) : <div className="empty-card">Bookmark a series, episode, or chapter from the reader and it will appear here.</div>}
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div className="section-title">{t("Advertisement")}</div>
        </div>
        <div className="ads-row">
          {adData.map((item) => (
            <article className="ad-card" key={item.title}>
              <img src={item.image} alt={item.title} />
              <div className="ad-copy">
                <div className="ad-label">{item.label}</div>
                <div className="ad-title">{item.title}</div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div className="section-title">{t("Promotion")}</div>
          <div className="section-copy section-copy-aligned">
            Featured banners and seasonal drops, shown as a swipeable slideshow.
          </div>
        </div>
        <div className="promo-slider">
          <div className="promo-track" style={{ transform: `translateX(-${currentPromo * 100}%)` }}>
            {promoData.map((item) => (
              <article className="promo-slide" key={item.title} style={{ "--bg-image": `url('${item.image}')` }}>
                <div className="promo-content">
                  <div className="promo-tag">{item.tag}</div>
                  <div className="promo-title">{item.title}</div>
                  <div className="promo-copy">{item.copy}</div>
                </div>
              </article>
            ))}
          </div>
          <div className="promo-dots">
            {promoData.map((_, index) => (
              <button
                key={index}
                className={`promo-dot ${index === currentPromo ? "active" : ""}`}
                type="button"
                onClick={() => setCurrentPromo(index)}
                aria-label={`Go to promotion ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div className="section-title">{t("You May Also Like")}</div>
          <div className="section-copy section-copy-aligned">
            Recommendations shaped like the homepage cards so the browsing experience stays consistent.
          </div>
        </div>
        <div className="recommend-rail">
          {sharedSeries.slice(0, 5).map((item) => <SeriesCard key={item.id} item={item} />)}
        </div>
      </section>
    </>
  );
}
