import { useEffect, useState } from "react";
import SeriesCard from "../components/shared/SeriesCard";
import { useAppSettings } from "../lib/appSettings";
import { getStoredList } from "../lib/storage";
import { fetchSeriesList, fetchUserBookmarks, fetchUserLibrary } from "../lib/backend";
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

function HistoryCardSkeleton({ count = 3 }) {
  return (
    <div className="history-list">
      {Array.from({ length: count }).map((_, index) => (
        <div className="history-card history-card-skeleton" key={index}>
          <div className="shimmer-block history-skeleton-image" />
          <div className="history-skeleton-copy">
            <div className="shimmer-block history-skeleton-pill" />
            <div className="shimmer-block history-skeleton-line wide" />
            <div className="shimmer-block history-skeleton-line" />
            <div className="shimmer-block history-skeleton-line short" />
          </div>
        </div>
      ))}
    </div>
  );
}

function RecommendationRailSkeleton({ count = 5 }) {
  return (
    <div className="recommend-rail">
      {Array.from({ length: count }).map((_, index) => (
        <div className="recommend-skeleton-card" key={index}>
          <div className="shimmer-block recommend-skeleton-image" />
          <div className="shimmer-block recommend-skeleton-line wide" />
          <div className="shimmer-block recommend-skeleton-line" />
        </div>
      ))}
    </div>
  );
}

export default function LibraryPage() {
  const { t } = useAppSettings();
  const readingHistory = getStoredList("toouReadingHistory");
  const [currentPromo, setCurrentPromo] = useState(0);
  const [remoteReadingHistory, setRemoteReadingHistory] = useState([]);
  const [remoteBookmarks, setRemoteBookmarks] = useState([]);
  const [remotePurchased, setRemotePurchased] = useState([]);
  const [remoteRecommendations, setRemoteRecommendations] = useState([]);
  const [libraryStatus, setLibraryStatus] = useState("idle");
  const [recommendationsStatus, setRecommendationsStatus] = useState("idle");

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentPromo((value) => (value + 1) % promoData.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, []);
  
  useEffect(() => {
    let cancelled = false;

    async function loadLibraryData() {
      setLibraryStatus("loading");

      try {
        const [readingItems, bookmarkItems, purchasedItems] = await Promise.all([
          fetchUserLibrary("reading"),
          fetchUserBookmarks(),
          fetchUserLibrary("purchased")
        ]);

        if (cancelled) return;
        setRemoteReadingHistory(readingItems);
        setRemoteBookmarks(bookmarkItems);
        setRemotePurchased(purchasedItems);
        setLibraryStatus("success");
      } catch (error) {
        if (!cancelled) setLibraryStatus("error");
        console.error("Failed to load backend library data:", error);
      }
    }

    loadLibraryData();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadRecommendations() {
      setRecommendationsStatus("loading");

      try {
        const items = await fetchSeriesList({ sortBy: "latest", limit: 8 });
        if (cancelled) return;
        setRemoteRecommendations(items || []);
        setRecommendationsStatus("success");
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load library recommendations:", error);
          setRemoteRecommendations([]);
          setRecommendationsStatus("error");
        }
      }
    }

    loadRecommendations();
    return () => {
      cancelled = true;
    };
  }, []);

  const localHistoryData = readingHistory.length
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

  const historyData = remoteReadingHistory.length
    ? remoteReadingHistory.map((item) => ({
        title: item.title,
        slug: item.slug || item.id,
        type: String(item.type || "novel").replace(/^\w/, (char) => char.toUpperCase()),
        episode: item.raw?.progress?.episode_title || "Continue reading",
        progress: item.progress ?? 0,
        time: item.lastReadAt || item.time,
        image: item.image,
        id: item.id
      }))
    : localHistoryData;

  const bookmarkCards = remoteBookmarks;
  const purchasedCards = remotePurchased.length
    ? remotePurchased.map((item) => ({
        ...item,
        episode: "Purchased access",
        time: item.time || "In your library"
      }))
    : [];

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
            <a className="history-card" key={`${item.id || item.slug}-${item.episode}`} href={`/series/${item.slug || item.id}`}>
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

      <section className="section">
        <div className="section-heading">
          <div className="section-title">{t("Bookmarks")}</div>
          <div className="section-copy section-copy-aligned">
            Series, episodes, and chapters you saved to revisit later.
          </div>
        </div>
        {libraryStatus === "loading" ? (
          <HistoryCardSkeleton count={3} />
        ) : (
          <div className="history-list">
            {bookmarkCards.length ? bookmarkCards.map((item) => (
              <a className="history-card" key={item.id} href={`/series/${item.slug || item.id}`}>
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
        )}
      </section>

      {purchasedCards.length ? (
        <section className="section">
          <div className="section-heading">
            <div className="section-title">{t("Purchased")}</div>
            <div className="section-copy section-copy-aligned">
              Premium chapters and series available in your account library.
            </div>
          </div>
          <div className="history-list">
            {purchasedCards.map((item) => (
              <a className="history-card" key={`purchased-${item.id}`} href={`/series/${item.slug || item.id}`}>
                <img src={item.image} alt={item.title} />
                <div className="history-copy">
                  <div className="history-type"><i className="fa-solid fa-bag-shopping" />{String(item.type || "novel")}</div>
                  <div className="history-title">{item.title}</div>
                  <div className="history-episode">{item.episode}</div>
                  <div className="history-progress">
                    <div className="progress-meta">
                      <span>Purchased</span>
                      <span>{item.time}</span>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>
      ) : null}

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
        {recommendationsStatus === "loading" ? (
          <RecommendationRailSkeleton count={5} />
        ) : (
          <div className="recommend-rail">
            {remoteRecommendations.map((item) => (
              <SeriesCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
