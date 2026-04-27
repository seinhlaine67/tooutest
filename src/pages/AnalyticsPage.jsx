import { useMemo } from "react";
import { Link, Navigate } from "react-router-dom";
import BottomNav from "../components/layout/BottomNav";
import Header from "../components/layout/Header";
import { getCreatorProfile, getUserAccount } from "../lib/account";
import { useAppSettings } from "../lib/appSettings";
import { getAllSeries } from "../lib/toouData";
import { getStoredList } from "../lib/storage";
import { useBodyPage } from "../lib/useBodyPage";
import "../styles/legacy/analytics.css";

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseCompactCount(value) {
  const number = Number(String(value || "0").replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(number)) return 0;
  if (String(value).includes("M")) return Math.round(number * 1000000);
  if (String(value).includes("K")) return Math.round(number * 1000);
  return Math.round(number);
}

function formatCompactCount(value) {
  const number = Number(value) || 0;
  if (number >= 1000000) return `${(number / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
  if (number >= 1000) return `${(number / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(number);
}

function formatCurrency(value) {
  return `${Math.round(value).toLocaleString()} MMK`;
}

function titleCase(value) {
  return String(value || "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function buildTrendPoints(total, points, multiplier = 1) {
  const base = Math.max(1, total);
  return points.map((label, index) => {
    const weight = 0.64 + index * 0.08;
    const amount = Math.round((base / points.length) * weight * multiplier);
    return { label, value: amount };
  });
}

export default function AnalyticsPage() {
  useBodyPage("analytics");
  const { t } = useAppSettings();
  const userAccount = useMemo(() => getUserAccount(), []);
  const creatorProfile = useMemo(() => getCreatorProfile(), []);

  if (!userAccount) return <Navigate to="/signup" replace />;
  if (!creatorProfile) return <Navigate to="/signup?view=signup&role=creator" replace />;

  const displayName =
    creatorProfile.displayName ||
    creatorProfile.studioName ||
    userAccount.username ||
    "TooU Creator";
  const creatorId = `creator-local-${slugify(displayName)}`;
  const creatorSeries = useMemo(
    () =>
      getAllSeries().filter(
        (item) => item.creatorId === creatorId || item.creatorName === displayName
      ),
    [creatorId, displayName]
  );

  const followedCreators = getStoredList("toouFollowedCreators");
  const commentMap = JSON.parse(window.localStorage.getItem("toouEpisodeComments") || "{}");
  const creatorFollowerCount = followedCreators.filter((id) => id === creatorId).length;

  const allEpisodes = creatorSeries.flatMap((series) =>
    (series.episodes || []).map((episode, index) => ({
      ...episode,
      seriesId: series.id,
      seriesSlug: series.slug,
      seriesTitle: series.title,
      seriesType: series.type,
      episodeIndex: index + 1,
      viewsValue: parseCompactCount(episode.views),
      likesValue: parseCompactCount(episode.likes),
      commentsValue:
        (episode.comments || []).length +
        (commentMap[`${series.slug}:${episode.id}`] || []).length
    }))
  );

  const overview = creatorSeries.reduce(
    (sum, item) => {
      const episodeCount = (item.episodes || []).length;
      const publishedEpisodes = (item.episodes || []).filter((episode) => {
        const status =
          episode.publicationStatus ||
          (episode.release === "draft"
            ? "draft"
            : episode.release === "schedule"
              ? "scheduled"
              : "published");
        return status === "published";
      }).length;
      const draftEpisodes = (item.episodes || []).filter((episode) => {
        const status =
          episode.publicationStatus ||
          (episode.release === "draft"
            ? "draft"
            : episode.release === "schedule"
              ? "scheduled"
              : "published");
        return status === "draft";
      }).length;

      return {
        views: sum.views + parseCompactCount(item.views),
        likes: sum.likes + parseCompactCount(item.likes),
        comments:
          sum.comments +
          allEpisodes
            .filter((episode) => episode.seriesSlug === item.slug)
            .reduce((episodeSum, episode) => episodeSum + episode.commentsValue, 0),
        publishedSeries: sum.publishedSeries + 1,
        publishedEpisodes: sum.publishedEpisodes + publishedEpisodes,
        draftEpisodes: sum.draftEpisodes + draftEpisodes,
        episodes: sum.episodes + episodeCount
      };
    },
    {
      views: 0,
      likes: 0,
      comments: 0,
      publishedSeries: 0,
      publishedEpisodes: 0,
      draftEpisodes: 0,
      episodes: 0
    }
  );

  const estimatedEarnings = Math.round(
    overview.likes * 28 + overview.views * 3.2 + overview.publishedEpisodes * 1200
  );

  const seriesPerformance = creatorSeries
    .map((item) => {
      const seriesEpisodes = allEpisodes.filter((episode) => episode.seriesSlug === item.slug);
      const commentTotal = seriesEpisodes.reduce(
        (sum, episode) => sum + episode.commentsValue,
        0
      );
      return {
        id: item.id,
        title: item.title,
        image: item.image,
        views: parseCompactCount(item.views),
        likes: parseCompactCount(item.likes),
        comments: commentTotal,
        followersGained: Math.max(1, Math.round(parseCompactCount(item.likes) / 9)),
        engagementRate:
          parseCompactCount(item.views) > 0
            ? ((parseCompactCount(item.likes) + commentTotal) /
                parseCompactCount(item.views)) *
              100
            : 0
      };
    })
    .sort((left, right) => right.views - left.views);

  const episodePerformance = [...allEpisodes].sort(
    (left, right) =>
      right.viewsValue + right.likesValue * 3 + right.commentsValue * 5 -
      (left.viewsValue + left.likesValue * 3 + left.commentsValue * 5)
  );

  const bestEpisodes = episodePerformance.slice(0, 3);
  const lowestEpisodes = [...episodePerformance]
    .reverse()
    .slice(0, Math.min(3, episodePerformance.length));

  const freeEpisodes = allEpisodes.filter((episode) => episode.free !== false);
  const premiumEpisodes = allEpisodes.filter((episode) => episode.free === false);
  const scheduledEpisodes = allEpisodes.filter((episode) => {
    const status =
      episode.publicationStatus ||
      (episode.release === "draft"
        ? "draft"
        : episode.release === "schedule"
          ? "scheduled"
          : "published");
    return status === "scheduled";
  });

  const audienceByType = creatorSeries.reduce((map, item) => {
    const key = titleCase(item.type);
    map[key] = (map[key] || 0) + parseCompactCount(item.views);
    return map;
  }, {});

  const audienceInsights = [
    {
      label: "Mobile Readers",
      value: `${Math.min(92, 64 + creatorSeries.length * 4)}%`,
      note: "Estimated from your current content mix and reading-first formats."
    },
    {
      label: "Primary Language",
      value: "ENG / Myanmar",
      note: "Best prepared to support bilingual readers as your catalog grows."
    },
    {
      label: "Top Genre",
      value: creatorSeries[0]?.genre || "Fantasy",
      note: "Based on the strongest-performing series currently in your account."
    },
    {
      label: "Peak Reading Time",
      value: "7 PM - 10 PM",
      note: "Suggested prime reading window for evening mobile traffic."
    }
  ];

  const weeklyViews = buildTrendPoints(overview.views, ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);
  const weeklyLikes = buildTrendPoints(overview.likes, ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], 1.4);
  const followerTrend = buildTrendPoints(
    Math.max(creatorFollowerCount * 16, creatorSeries.length * 10),
    ["Week 1", "Week 2", "Week 3", "Week 4"],
    1.1
  );
  const earningsTrend = buildTrendPoints(
    Math.max(estimatedEarnings, 32000),
    ["Week 1", "Week 2", "Week 3", "Week 4"],
    1
  );

  const retentionPoints = creatorSeries.slice(0, 4).map((series, index) => ({
    title: series.title,
    start: 100,
    mid: Math.max(42, 78 - index * 7),
    latest: Math.max(28, 62 - index * 8)
  }));

  const engagementPanels = [
    {
      label: "Most Discussed",
      value: seriesPerformance[0]?.title || "No published series yet",
      note: `${formatCompactCount(seriesPerformance[0]?.comments || 0)} comments across this title`
    },
    {
      label: "Comment Count",
      value: formatCompactCount(overview.comments),
      note: "Total visible reader discussion across your uploaded content"
    },
    {
      label: "Like Rate",
      value: `${overview.views ? ((overview.likes / overview.views) * 100).toFixed(1) : "0.0"}%`,
      note: "Likes relative to total views on your creator catalog"
    }
  ];

  return (
    <>
      <Header />
      <main className="analytics-shell">
        <section className="analytics-hero">
          <Link to="/creator-dashboard" className="hero-back-link" aria-label="Go back">
            <i className="fa-solid fa-arrow-left" />
          </Link>

          <div className="analytics-chip">Analytics</div>
          <h1>{`${displayName}'s creator analytics`}</h1>
          <p>
            Track performance across your published series, episode engagement, audience
            behavior, earnings estimates, and content momentum in one place.
          </p>
        </section>

        <section className="analytics-kpi-grid">
          {[
            ["Total Views", formatCompactCount(overview.views)],
            ["Total Likes", formatCompactCount(overview.likes)],
            ["Followers", formatCompactCount(creatorFollowerCount)],
            ["Total Earnings", formatCurrency(estimatedEarnings)],
            ["Published works", formatCompactCount(overview.publishedSeries)],
            ["Drafts & schedule", formatCompactCount(overview.draftEpisodes + scheduledEpisodes.length)]
          ].map(([label, value]) => (
            <article className="analytics-kpi-card" key={label}>
              <div className="analytics-kpi-label">{t(label)}</div>
              <strong>{value}</strong>
            </article>
          ))}
        </section>

        <section className="analytics-grid analytics-grid-two">
          <article className="analytics-panel">
            <div className="analytics-panel-head">
              <div>
                <div className="analytics-panel-kicker">Series Performance</div>
                <h2>Top performing series</h2>
              </div>
            </div>
            <div className="series-performance-list">
              {seriesPerformance.length ? (
                seriesPerformance.slice(0, 5).map((item) => (
                  <div className="series-performance-item" key={item.id}>
                    <img src={item.image} alt={item.title} />
                    <div className="series-performance-copy">
                      <strong>{item.title}</strong>
                      <div className="analytics-inline-metrics">
                        <span>{formatCompactCount(item.views)} views</span>
                        <span>{formatCompactCount(item.likes)} likes</span>
                        <span>{formatCompactCount(item.comments)} comments</span>
                        <span>{formatCompactCount(item.followersGained)} follower gain</span>
                      </div>
                    </div>
                    <div className="analytics-score-chip">
                      {item.engagementRate.toFixed(1)}%
                    </div>
                  </div>
                ))
              ) : (
                <div className="analytics-empty">
                  Upload a series first and your creator analytics will populate here.
                </div>
              )}
            </div>
          </article>

          <article className="analytics-panel">
            <div className="analytics-panel-head">
              <div>
                <div className="analytics-panel-kicker">Audience Insights</div>
                <h2>Reader profile</h2>
              </div>
            </div>
            <div className="insight-grid">
              {audienceInsights.map((item) => (
                <div className="insight-card" key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                  <p>{item.note}</p>
                </div>
              ))}
            </div>
            <div className="audience-type-breakdown">
              {Object.entries(audienceByType).map(([label, value]) => (
                <div className="audience-type-row" key={label}>
                  <span>{label}</span>
                  <div className="audience-type-bar">
                    <div
                      className="audience-type-fill"
                      style={{
                        width: `${Math.max(
                          12,
                          (value / Math.max(...Object.values(audienceByType))) * 100
                        )}%`
                      }}
                    />
                  </div>
                  <strong>{formatCompactCount(value)}</strong>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="analytics-grid analytics-grid-two">
          <article className="analytics-panel">
            <div className="analytics-panel-head">
              <div>
                <div className="analytics-panel-kicker">Episode Performance</div>
                <h2>Best and lowest episodes</h2>
              </div>
            </div>
            <div className="episode-performance-columns">
              <div>
                <div className="analytics-mini-title">Best performing</div>
                <div className="episode-performance-list">
                  {bestEpisodes.map((episode) => (
                    <div className="episode-performance-item" key={episode.id}>
                      <strong>{`${episode.episodeIndex}. ${episode.title}`}</strong>
                      <p>{episode.seriesTitle}</p>
                      <span>
                        {formatCompactCount(episode.viewsValue)} views ·{" "}
                        {formatCompactCount(episode.likesValue)} likes
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="analytics-mini-title">Needs more push</div>
                <div className="episode-performance-list">
                  {lowestEpisodes.map((episode) => (
                    <div className="episode-performance-item muted" key={episode.id}>
                      <strong>{`${episode.episodeIndex}. ${episode.title}`}</strong>
                      <p>{episode.seriesTitle}</p>
                      <span>
                        {formatCompactCount(episode.viewsValue)} views ·{" "}
                        {formatCompactCount(episode.likesValue)} likes
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="episode-mode-grid">
              <div className="mode-card">
                <span>Free episodes</span>
                <strong>{formatCompactCount(freeEpisodes.length)}</strong>
              </div>
              <div className="mode-card">
                <span>Premium episodes</span>
                <strong>{formatCompactCount(premiumEpisodes.length)}</strong>
              </div>
              <div className="mode-card">
                <span>Scheduled</span>
                <strong>{formatCompactCount(scheduledEpisodes.length)}</strong>
              </div>
            </div>
          </article>

          <article className="analytics-panel">
            <div className="analytics-panel-head">
              <div>
                <div className="analytics-panel-kicker">Earnings</div>
                <h2>Earnings overview</h2>
              </div>
            </div>
            <div className="earnings-hero-card">
              <span>Estimated total</span>
              <strong>{formatCurrency(estimatedEarnings)}</strong>
              <p>Based on current engagement, catalog depth, and premium readiness.</p>
            </div>
            <div className="earnings-list">
              {earningsTrend.map((item) => (
                <div className="earning-item" key={item.label}>
                  <span className="earning-date">{item.label}</span>
                  <span className="earning-value">{formatCurrency(item.value)}</span>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="analytics-grid analytics-grid-two">
          <article className="analytics-panel">
            <div className="analytics-panel-head">
              <div>
                <div className="analytics-panel-kicker">Growth Trends</div>
                <h2>Momentum over time</h2>
              </div>
            </div>
            <div className="trend-block">
              <div className="analytics-mini-title">Views this week</div>
              <div className="trend-chart">
                {weeklyViews.map((item) => (
                  <div className="trend-bar-item" key={item.label}>
                    <div
                      className="trend-bar views"
                      style={{
                        height: `${Math.max(
                          22,
                          (item.value / Math.max(...weeklyViews.map((point) => point.value))) * 120
                        )}px`
                      }}
                    />
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="trend-block">
              <div className="analytics-mini-title">Likes this week</div>
              <div className="trend-chart">
                {weeklyLikes.map((item) => (
                  <div className="trend-bar-item" key={item.label}>
                    <div
                      className="trend-bar likes"
                      style={{
                        height: `${Math.max(
                          22,
                          (item.value / Math.max(...weeklyLikes.map((point) => point.value))) * 120
                        )}px`
                      }}
                    />
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="trend-inline-list">
              {followerTrend.map((item) => (
                <div className="trend-inline-item" key={item.label}>
                  <span>{item.label}</span>
                  <strong>{formatCompactCount(item.value)}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="analytics-panel">
            <div className="analytics-panel-head">
              <div>
                <div className="analytics-panel-kicker">Reader Retention</div>
                <h2>Episode carry-through</h2>
              </div>
            </div>
            <div className="retention-list">
              {retentionPoints.length ? (
                retentionPoints.map((item) => (
                  <div className="retention-item" key={item.title}>
                    <strong>{item.title}</strong>
                    <div className="retention-bars">
                      <div className="retention-bar">
                        <span>Episode 1</span>
                        <div className="retention-track">
                          <div className="retention-fill start" style={{ width: `${item.start}%` }} />
                        </div>
                        <em>{item.start}%</em>
                      </div>
                      <div className="retention-bar">
                        <span>Mid-series</span>
                        <div className="retention-track">
                          <div className="retention-fill mid" style={{ width: `${item.mid}%` }} />
                        </div>
                        <em>{item.mid}%</em>
                      </div>
                      <div className="retention-bar">
                        <span>Latest</span>
                        <div className="retention-track">
                          <div className="retention-fill latest" style={{ width: `${item.latest}%` }} />
                        </div>
                        <em>{item.latest}%</em>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="analytics-empty">Retention appears after you publish episodes.</div>
              )}
            </div>
          </article>
        </section>

        <section className="analytics-grid">
          <article className="analytics-panel analytics-panel-wide">
            <div className="analytics-panel-head">
              <div>
                <div className="analytics-panel-kicker">Comments & Engagement</div>
                <h2>Community response</h2>
              </div>
            </div>
            <div className="engagement-grid">
              {engagementPanels.map((item) => (
                <div className="engagement-card" key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                  <p>{item.note}</p>
                </div>
              ))}
            </div>
          </article>
        </section>
      </main>
      <BottomNav />
    </>
  );
}
