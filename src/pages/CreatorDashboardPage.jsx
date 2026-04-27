import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import BottomNav from "../components/layout/BottomNav";
import Header from "../components/layout/Header";
import { getCreatorProfile, getUserAccount } from "../lib/account";
import { useAppSettings } from "../lib/appSettings";
import { getStoredList } from "../lib/storage";
import { fetchCreatorSeriesDirect } from "../lib/backend";
import { useBodyPage } from "../lib/useBodyPage";
import { parseCompactCount } from "../lib/utils";
import "../styles/legacy/creator-dashboard.css";

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatTitle(value, fallback) {
  if (!value) return fallback;
  return String(value)
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatCompactCount(value) {
  const number = Number(value) || 0;
  if (number >= 1000000) return `${(number / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
  if (number >= 1000) return `${(number / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(number);
}

function formatScheduleDate(value) {
  if (!value) return "Schedule not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

export default function CreatorDashboardPage() {
  useBodyPage("creator-dashboard");
  const { t } = useAppSettings();
  const navigate = useNavigate();
  const userAccount = useMemo(() => getUserAccount(), []);
  const creatorProfile = useMemo(() => getCreatorProfile(), []);
  const [activeView, setActiveView] = useState("earnings");
  const [remoteCreatorSeries, setRemoteCreatorSeries] = useState([]);
  const [creatorSeriesStatus, setCreatorSeriesStatus] = useState("loading");

  if (!userAccount) return <Navigate to="/signup" replace />;
  if (!creatorProfile) return <Navigate to="/signup?view=signup&role=creator" replace />;

  const displayName =
    creatorProfile.displayName ||
    creatorProfile.studioName ||
    userAccount.displayName ||
    userAccount.username ||
    "TooU Creator";
  const creatorHandle = creatorProfile.readerName || userAccount.username || "creator";
  const creatorId = `creator-local-${slugify(displayName)}`;
  const followedCreators = getStoredList("toouFollowedCreators");
  const storedCreator = getStoredList("toouLocalCreators").find((item) => item.id === creatorId) || null;
  const creatorSeries = remoteCreatorSeries;
  const followerBase = parseCompactCount(storedCreator?.followers || "0");
  const followerCount = followerBase + (followedCreators.includes(creatorId) ? 1 : 0);

  useEffect(() => {
    let cancelled = false;

    async function loadCreatorSeries() {
      setCreatorSeriesStatus("loading");
      try {
        const items = await fetchCreatorSeriesDirect(userAccount?.supabaseUserId);
        if (!cancelled) {
          setRemoteCreatorSeries(items);
          setCreatorSeriesStatus("success");
        }
      } catch (error) {
        if (cancelled) return;
        console.error("Failed to load creator dashboard series:", error);
        setRemoteCreatorSeries([]);
        setCreatorSeriesStatus("error");
      }
    }

    loadCreatorSeries();
    return () => {
      cancelled = true;
    };
  }, [userAccount?.supabaseUserId]);

  const totals = creatorSeries.reduce(
    (sum, item) => ({
      views: sum.views + parseCompactCount(item.views),
      likes: sum.likes + parseCompactCount(item.likes)
    }),
    { views: 0, likes: 0 }
  );

  const draftItems = [];
  const scheduledItems = [];
  creatorSeries.forEach((item) => {
    (item.episodes || []).forEach((episode) => {
      const status =
        episode.publicationStatus ||
        (episode.release === "draft"
          ? "draft"
          : episode.release === "schedule"
            ? "scheduled"
            : "published");
      const nextItem = {
        seriesSlug: item.slug,
        seriesTitle: item.title,
        episodeTitle: episode.title,
        scheduledFor: episode.scheduledFor || episode.scheduledAt || "",
        access: episode.free === false ? "Premium" : "Free"
      };
      if (status === "draft") draftItems.push(nextItem);
      if (status === "scheduled") scheduledItems.push(nextItem);
    });
  });

  const earningsSeed = [
    { date: "2026-04-03", amount: "+125.30 MMK" },
    { date: "2026-04-02", amount: "+98.50 MMK" },
    { date: "2026-04-01", amount: "+156.80 MMK" },
    { date: "2026-03-31", amount: "+210.84 MMK" },
    { date: "2026-03-30", amount: "+178.82 MMK" }
  ];

  return (
    <>
      <Header />
      <main className="creator-dashboard-shell">
        <section className="creator-dashboard-hero">
          <Link to="/profile" className="hero-back-link" aria-label="Go back">
            <i className="fa-solid fa-arrow-left" />
          </Link>

          <div className="creator-hero-card">
            <div className="creator-hero-copy">
              <div className="creator-chip">Creator Mode</div>
              <h1>{`Welcome back, ${displayName}!`}</h1>
              <p>{`${displayName} is now active in creator mode. From here you can manage uploads, review your current profile shape, and move into analytics when you are ready.`}</p>

              <div className="creator-hero-actions">
                <Link to="/upload" className="creator-primary-btn">
                  <i className="fa-solid fa-arrow-up-from-bracket" />
                  <span>Upload Content</span>
                </Link>
                <Link to="/analytics" className="creator-secondary-btn creator-analytics-btn">
                  <i className="fa-solid fa-chart-line" />
                  <span>Analytics</span>
                </Link>
                <button
                  type="button"
                  className="creator-secondary-btn creator-notification-btn"
                  onClick={() => window.alert("Creator notifications are ready for the next page hookup.")}
                >
                  <i className="fa-regular fa-bell" />
                  <span>Notifications</span>
                </button>
              </div>
            </div>

            <div className="creator-hero-panel">
              <div className="hero-panel-head">
                <div className="creator-mini-label">{t("Active Creator Profile")}</div>
                <button
                  type="button"
                  className="mini-link mini-link-btn creator-edit-link"
                  onClick={() => navigate("/creator-profile-editor")}
                >
                  Edit creator profile
                </button>
              </div>
              <div className="creator-profile-row">
                {creatorProfile.avatar ? (
                  <img className="creator-avatar creator-avatar-image" src={creatorProfile.avatar} alt={displayName} />
                ) : (
                  <div className="creator-avatar">{displayName.trim().charAt(0).toUpperCase()}</div>
                )}
                <div>
                  <strong>{displayName}</strong>
                  <div className="creator-handle">{`@${creatorHandle}`}</div>
                  <div className="creator-meta">
                    {creatorProfile.role === "studio" ? "Studio creator" : "Individual creator"} linked to {userAccount.username || "your reader account"}
                  </div>
                </div>
              </div>
              <div className="creator-summary-grid">
                <div className="creator-summary-item">
                  <span>{t("Primary format")}</span>
                  <strong>{formatTitle(creatorProfile.primaryFormat, "Webtoon")}</strong>
                </div>
                <div className="creator-summary-item">
                  <span>{t("Verification")}</span>
                  <strong>{formatTitle(creatorProfile.verificationStatus, "Pending")}</strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="creator-dashboard-grid">
          <article className="creator-dashboard-panel creator-dashboard-panel-wide">
            <div className="panel-head">
              <div>
                <div className="panel-kicker">Performance</div>
                <h2>{t("Creator snapshot")}</h2>
              </div>
            </div>

            <div className="metric-grid">
              <div className="metric-card"><div className="metric-icon views"><i className="fa-regular fa-eye" /></div><strong>{formatCompactCount(totals.views || 125000)}</strong><span>{t("Total Views")}</span></div>
              <div className="metric-card"><div className="metric-icon likes"><i className="fa-regular fa-heart" /></div><strong>{formatCompactCount(totals.likes || 8900)}</strong><span>{t("Total Likes")}</span></div>
              <div className="metric-card"><div className="metric-icon readers"><i className="fa-regular fa-user" /></div><strong>{formatCompactCount(followerCount || 1250)}</strong><span>{t("Followers")}</span></div>
              <div className="metric-card"><div className="metric-icon earnings"><i className="fa-solid fa-wallet" /></div><strong>300,000 MMK</strong><span>{t("Total Earnings")}</span></div>
            </div>
          </article>

          <article className="creator-dashboard-panel creator-dashboard-panel-wide">
            <div className="panel-head">
              <div>
                <div className="panel-kicker">Studio View</div>
                <h2>Creator dashboard</h2>
              </div>
            </div>

            <div className="dashboard-switcher">
              {[
                ["earnings", "Recent earnings"],
                ["catalog", "Published works"],
                ["workflow", "Drafts & schedule"],
                ["inbox", "Messages"]
              ].map(([key, label]) => (
                <button
                  type="button"
                  key={key}
                  className={`dashboard-switch ${activeView === key ? "active" : ""}`}
                  onClick={() => setActiveView(key)}
                >
                  {t(label)}
                </button>
              ))}
            </div>

            {activeView === "earnings" ? (
              <div className="dashboard-view active">
                <div className="panel-subhead">
                  <div><div className="panel-kicker">Finance</div><h3>{t("Recent earnings")}</h3></div>
                </div>
                <div className="earnings-list">
                  {earningsSeed.map((item) => (
                    <div className="earning-item" key={item.date}>
                      <span className="earning-date">{item.date}</span>
                      <span className="earning-value">{item.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {activeView === "catalog" ? (
              <div className="dashboard-view active">
                <div className="panel-subhead">
                  <div><div className="panel-kicker">Catalog</div><h3>Publish and edit content</h3></div>
                  <Link to="/upload" className="mini-link">+ Upload content</Link>
                </div>
                <div className="catalog-list">
                  {creatorSeriesStatus === "loading" ? (
                    <div className="series-card">
                      <div className="series-copy">
                        <strong>Loading your published works...</strong>
                        <p>Your creator dashboard is fetching series directly from Supabase.</p>
                      </div>
                    </div>
                  ) : null}

                  {creatorSeries.length ? creatorSeries.map((item) => (
                    <div className="series-card" key={item.id}>
                      <img src={item.image} alt={item.title} />
                      <div className="series-copy">
                        <strong>{item.title}</strong>
                        <p>{item.synopsis}</p>
                        <div className="series-stats">
                          <span><i className="fa-regular fa-eye" /> {item.views}</span>
                          <span><i className="fa-regular fa-heart" /> {item.likes}</span>
                        </div>
                        <div className="series-actions">
                          <Link to={`/series/${encodeURIComponent(item.slug)}?id=${encodeURIComponent(item.id)}`} className="series-btn">Open Detail</Link>
                          <Link to={`/series-editor?series=${encodeURIComponent(item.slug)}&id=${encodeURIComponent(item.id)}`} className="series-btn series-btn-secondary">Edit Content</Link>
                        </div>
                      </div>
                    </div>
                  )) : creatorSeriesStatus !== "loading" ? (
                    <div className="series-card">
                      <img src="/images/image1.png" alt="Creator series cover" />
                      <div className="series-copy">
                        <strong>Your first TooU series</strong>
                        <p>Start by creating a series shell first, then add and manage chapters under it.</p>
                        <div className="series-actions">
                          <Link to="/upload" className="series-btn">Upload Content</Link>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            {activeView === "workflow" ? (
              <div className="dashboard-view active">
                <div className="panel-subhead">
                  <div><div className="panel-kicker">Workflow</div><h3>Drafts and schedule</h3></div>
                </div>
                <div className="workflow-block">
                  <div className="workflow-title">Draft chapters</div>
                  <div className="workflow-list">
                    {draftItems.length ? draftItems.map((item) => (
                      <div className="workflow-item" key={`${item.seriesSlug}-${item.episodeTitle}`}>
                        <strong>{item.episodeTitle}</strong>
                        <p>{item.seriesTitle}</p>
                        <div className="workflow-meta"><span>{item.access}</span><span>Draft</span></div>
                        <div className="workflow-actions"><Link to={`/upload?edit=${item.seriesSlug}`} className="series-btn series-btn-secondary">Open series draft</Link></div>
                      </div>
                    )) : <div className="workflow-empty">No draft chapters right now. Draft episodes you save in the upload flow will appear here.</div>}
                  </div>
                </div>
                <div className="workflow-block">
                  <div className="workflow-title">Scheduled chapters</div>
                  <div className="workflow-list">
                    {scheduledItems.length ? scheduledItems.map((item) => (
                      <div className="workflow-item" key={`${item.seriesSlug}-${item.episodeTitle}`}>
                        <strong>{item.episodeTitle}</strong>
                        <p>{item.seriesTitle}</p>
                        <div className="workflow-meta"><span>{item.access}</span><span>{`Scheduled for ${formatScheduleDate(item.scheduledFor)}`}</span></div>
                        <div className="workflow-actions"><Link to={`/upload?edit=${item.seriesSlug}`} className="series-btn series-btn-secondary">Adjust schedule</Link></div>
                      </div>
                    )) : <div className="workflow-empty">No scheduled chapters yet. Scheduled episodes will appear here once you set a publish time.</div>}
                  </div>
                </div>
              </div>
            ) : null}

            {activeView === "inbox" ? (
              <div className="dashboard-view active">
                <div className="panel-subhead">
                  <div><div className="panel-kicker">Inbox</div><h3>Messages and comments</h3></div>
                </div>
                <div className="quick-grid">
                  <div className="quick-card"><div className="quick-icon"><i className="fa-regular fa-message" /></div><strong>{t("Messages")}</strong><span>15 unread creator messages</span></div>
                  <div className="quick-card"><div className="quick-icon"><i className="fa-regular fa-comments" /></div><strong>Comments</strong><span>48 new reader comments</span></div>
                  <div className="quick-card"><div className="quick-icon"><i className="fa-regular fa-pen-to-square" /></div><strong>Publishing rhythm</strong><span>{creatorProfile.primaryFormat ? `Your current focus is ${formatTitle(creatorProfile.primaryFormat, "Webtoon").toLowerCase()} publishing.` : "Your current focus is ready to shape your next upload."}</span></div>
                </div>
              </div>
            ) : null}
          </article>
        </section>
      </main>
      <BottomNav />
    </>
  );
}
