import { useMemo, useState } from "react";
import Header from "../components/layout/Header";
import BottomNav from "../components/layout/BottomNav";
import { creators as mockCreators } from "../data/mockData";
import { getAllSeries } from "../lib/toouData";
import { getStoredList } from "../lib/storage";
import { useBodyPage } from "../lib/useBodyPage";
import "../styles/legacy/company.css";

function parseCompactCount(value) {
  const raw = String(value || "0").trim();
  const numeric = Number(raw.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(numeric)) return 0;
  if (raw.includes("M")) return Math.round(numeric * 1000000);
  if (raw.includes("K")) return Math.round(numeric * 1000);
  return Math.round(numeric);
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

function getPublicationStatus(episode) {
  return (
    episode.publicationStatus ||
    (episode.release === "draft"
      ? "draft"
      : episode.release === "schedule"
        ? "scheduled"
        : "published")
  );
}

export default function SystemDashboardPage() {
  useBodyPage("company");

  const [creatorApprovals, setCreatorApprovals] = useState({});
  const [monetizationApprovals, setMonetizationApprovals] = useState({});
  const [payoutApprovals, setPayoutApprovals] = useState({});
  const [moderationActions, setModerationActions] = useState({});
  const [activeSection, setActiveSection] = useState("overview");

  const allSeries = useMemo(() => getAllSeries(), []);
  const localCreators = getStoredList("toouLocalCreators");
  const allCreators = [...mockCreators, ...localCreators];
  const creatorProfiles = getStoredList("toouLocalCreators");
  const localCommunityPosts = getStoredList("toouCommunityPosts");
  const reportQueue = getStoredList("toouReports");

  const creatorRows = allCreators.map((creator, index) => {
    const creatorSeries = allSeries.filter(
      (item) => item.creatorId === creator.id || item.creatorName === creator.name
    );
    const allEpisodes = creatorSeries.flatMap((series) => series.episodes || []);
    const publishedEpisodes = allEpisodes.filter(
      (episode) => getPublicationStatus(episode) === "published"
    );
    const novelEpisodes = creatorSeries
      .filter((series) => series.type === "novel")
      .flatMap((series) => series.episodes || [])
      .filter((episode) => getPublicationStatus(episode) === "published");
    const totalViews = creatorSeries.reduce(
      (sum, series) => sum + parseCompactCount(series.views),
      0
    );
    const totalLikes = creatorSeries.reduce(
      (sum, series) => sum + parseCompactCount(series.likes),
      0
    );
    const monetizationEligible = novelEpisodes.length >= 10;
    const currentApproval =
      creatorApprovals[creator.id] ||
      (creatorProfiles.find((item) => item.id === creator.id) ? "approved" : "pending");
    const monetizationStatus = monetizationApprovals[creator.id]
      ? "approved"
      : monetizationEligible
        ? "ready"
        : "locked";

    return {
      id: creator.id || `creator-${index}`,
      name: creator.name,
      type: creator.type === "studio" ? "Studio" : "Creator",
      seriesCount: creatorSeries.length,
      publishedEpisodes: publishedEpisodes.length,
      novelEpisodes: novelEpisodes.length,
      views: totalViews,
      likes: totalLikes,
      creatorApproval: currentApproval,
      monetizationEligible,
      monetizationStatus
    };
  });

  const totalViews = creatorRows.reduce((sum, item) => sum + item.views, 0);
  const totalLikes = creatorRows.reduce((sum, item) => sum + item.likes, 0);
  const totalReaders = formatCompactCount(Math.max(creatorRows.length * 320, totalLikes / 3));
  const totalRevenue = Math.round(totalViews * 2.4 + totalLikes * 32);

  const approvalQueue = creatorRows.filter(
    (item) => item.creatorApproval !== "approved" || item.monetizationStatus === "ready"
  );

  const payoutQueue = creatorRows
    .filter((item) => item.creatorApproval === "approved")
    .slice(0, 5)
    .map((item, index) => ({
      id: item.id,
      creator: item.name,
      amount: Math.max(22000, Math.round(item.likes * 8 + item.views * 0.4 + index * 7000)),
      status: payoutApprovals[item.id] || "pending"
    }));

  const moderationQueue = (
    reportQueue.length
      ? reportQueue
      : [
          {
            id: "report-1",
            type: "Comment",
            target: "Episode comment on Shadows of Destiny",
            reason: "Spam / harassment",
            severity: "High"
          },
          {
            id: "report-2",
            type: "Series",
            target: "Urban Legend",
            reason: "Sensitive horror labeling",
            severity: "Medium"
          },
          {
            id: "report-3",
            type: "Post",
            target: "Community discussion thread",
            reason: "Copyright concern",
            severity: "High"
          }
        ]
  ).map((item) => ({
    ...item,
    status: moderationActions[item.id] || "open"
  }));

  const recentUploads = allSeries
    .slice()
    .sort((left, right) => new Date(right.updatedAt || 0) - new Date(left.updatedAt || 0))
    .slice(0, 6);

  const systemSettings = [
    ["Creator verification", "Manual review"],
    ["Novel monetization threshold", "10 published episodes"],
    ["Platform commission", "20%"],
    ["Myanmar language support", "Enabled"],
    ["Premium content gate", "Approval required"],
    ["Community reporting", "Live"]
  ];

  const auditItems = [
    "Admin approved creator access for new studio applicant",
    "Monetization rule checked against novel episode threshold",
    "Premium payout batch prepared for weekly release",
    "Sensitive content report escalated for manual review"
  ];

  const sectionLinks = [
    ["overview", "Overview", "fa-chart-pie"],
    ["approvals", "Approvals", "fa-user-check"],
    ["creators", "Creators", "fa-users"],
    ["operations", "Operations", "fa-sliders"],
    ["logs", "Logs", "fa-clock-rotate-left"]
  ];

  const heroStats = [
    ["Active Readers", totalReaders],
    ["Creators", formatCompactCount(creatorRows.length)],
    ["Revenue", formatCurrency(totalRevenue)]
  ];

  return (
    <>
      <Header />
      <main className="company-admin-shell">
        <div className="company-admin-frame">
          <aside className="company-admin-sidebar">
            <div className="company-brand-card">
              <div className="company-brand-mark">TooU</div>
              <div className="company-brand-copy">
                <strong>System Dashboard</strong>
                <span>Operations console</span>
              </div>
            </div>

            <nav className="company-admin-nav" aria-label="Company dashboard sections">
              {sectionLinks.map(([key, label, icon]) => (
                <button
                  key={key}
                  type="button"
                  className={`company-admin-nav-link ${activeSection === key ? "active" : ""}`}
                  onClick={() => setActiveSection(key)}
                >
                  <i className={`fa-solid ${icon}`} />
                  <span>{label}</span>
                </button>
              ))}
            </nav>

            <div className="company-sidebar-note">
              <span>Monetization rule</span>
              <strong>10 published novel episodes</strong>
              <p>Creators unlock monetization approval only after the required novel threshold.</p>
            </div>
          </aside>

          <section className="company-admin-workspace">
            <div className="company-workspace-topbar">
              <div>
                <p className="company-overline">Company Console</p>
                <h1>TooU system dashboard</h1>
              </div>
              <div className="company-topbar-actions">
                <button type="button" className="company-utility-pill">
                  <i className="fa-solid fa-bolt" />
                  <span>Live monitoring</span>
                </button>
                <button type="button" className="company-primary-pill">
                  <i className="fa-solid fa-bell" />
                  <span>Send notice</span>
                </button>
              </div>
            </div>

            <section className="company-hero-band">
              <div className="company-hero-copy">
                <div className="company-hero-chip">Control center</div>
                <h2>Approve creators, unlock monetization, and keep the platform healthy.</h2>
                <p>
                  This admin workspace is designed for the company side of TooU to review growth,
                  monitor creator quality, and take action across payouts, moderation, and policy.
                </p>
              </div>

              <div className="company-hero-stats">
                {heroStats.map(([label, value]) => (
                  <div className="company-hero-stat" key={label}>
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
            </section>

            <section className="company-kpi-grid">
              {[
                ["Platform Views", formatCompactCount(totalViews)],
                ["Platform Likes", formatCompactCount(totalLikes)],
                ["Published Series", formatCompactCount(allSeries.length)],
                [
                  "Open Reports",
                  formatCompactCount(
                    moderationQueue.filter((item) => item.status === "open").length
                  )
                ]
              ].map(([label, value]) => (
                <article className="company-kpi-card" key={label}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </article>
              ))}
            </section>

            <section className="company-admin-grid company-admin-grid-primary">
              <article className="company-panel company-panel-wide">
                <div className="company-panel-head">
                  <div>
                    <div className="company-panel-kicker">Approval Queue</div>
                    <h2>Creators and monetization</h2>
                  </div>
                  <div className="company-panel-count">{approvalQueue.length} waiting</div>
                </div>
                <div className="approval-list">
                  {approvalQueue.length ? (
                    approvalQueue.map((item) => (
                      <div className="approval-card" key={item.id}>
                        <div className="approval-card-main">
                          <strong>{item.name}</strong>
                          <p>
                            {item.type} · {item.seriesCount} series · {item.publishedEpisodes} published episodes
                          </p>
                          <div className="approval-meta-row">
                            <span className={`status-chip ${item.creatorApproval}`}>
                              Creator {item.creatorApproval}
                            </span>
                            <span
                              className={`status-chip ${
                                item.monetizationStatus === "approved"
                                  ? "approved"
                                  : item.monetizationStatus === "ready"
                                    ? "ready"
                                    : "locked"
                              }`}
                            >
                              Monetization {item.monetizationStatus}
                            </span>
                          </div>
                        </div>
                        <div className="approval-actions">
                          <button
                            type="button"
                            className="company-action-btn"
                            onClick={() =>
                              setCreatorApprovals((current) => ({
                                ...current,
                                [item.id]: "approved"
                              }))
                            }
                          >
                            Approve creator
                          </button>
                          <button
                            type="button"
                            className="company-action-btn secondary"
                            disabled={!item.monetizationEligible}
                            onClick={() =>
                              setMonetizationApprovals((current) => ({
                                ...current,
                                [item.id]: true
                              }))
                            }
                          >
                            {item.monetizationEligible
                              ? "Approve monetization"
                              : "Need 10 novel episodes"}
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="company-empty">No creator approvals waiting right now.</div>
                  )}
                </div>
              </article>

              <article className="company-panel">
                <div className="company-panel-head">
                  <div>
                    <div className="company-panel-kicker">Moderation</div>
                    <h2>Priority review queue</h2>
                  </div>
                </div>
                <div className="moderation-list">
                  {moderationQueue.map((item) => (
                    <div className="moderation-card" key={item.id}>
                      <div className="moderation-top">
                        <strong>{item.target}</strong>
                        <span className={`severity-chip ${String(item.severity || "").toLowerCase()}`}>
                          {item.severity}
                        </span>
                      </div>
                      <p>{`${item.type} · ${item.reason}`}</p>
                      <div className="approval-actions">
                        <button
                          type="button"
                          className="company-action-btn"
                          onClick={() =>
                            setModerationActions((current) => ({
                              ...current,
                              [item.id]: "reviewed"
                            }))
                          }
                        >
                          Mark reviewed
                        </button>
                        <button
                          type="button"
                          className="company-action-btn secondary"
                          onClick={() =>
                            setModerationActions((current) => ({
                              ...current,
                              [item.id]: "removed"
                            }))
                          }
                        >
                          Remove / escalate
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            </section>

            <section className="company-admin-grid company-admin-grid-secondary">
              <article className="company-panel">
                <div className="company-panel-head">
                  <div>
                    <div className="company-panel-kicker">Creator Management</div>
                    <h2>Creator roster</h2>
                  </div>
                </div>
                <div className="company-table">
                  {creatorRows.map((item) => (
                    <div className="company-table-row" key={item.id}>
                      <div>
                        <strong>{item.name}</strong>
                        <p>{`${item.type} · ${item.seriesCount} series · ${item.novelEpisodes} published novel episodes`}</p>
                      </div>
                      <div className="company-table-metrics">
                        <span>{formatCompactCount(item.views)} views</span>
                        <span>{formatCompactCount(item.likes)} likes</span>
                      </div>
                    </div>
                  ))}
                </div>
              </article>

              <article className="company-panel">
                <div className="company-panel-head">
                  <div>
                    <div className="company-panel-kicker">Payouts</div>
                    <h2>Pending payout approvals</h2>
                  </div>
                </div>
                <div className="payout-list">
                  {payoutQueue.map((item) => (
                    <div className="payout-card" key={item.id}>
                      <div>
                        <strong>{item.creator}</strong>
                        <p>{formatCurrency(item.amount)}</p>
                      </div>
                      <div className="approval-actions">
                        <span className={`status-chip ${item.status}`}>{item.status}</span>
                        <button
                          type="button"
                          className="company-action-btn"
                          onClick={() =>
                            setPayoutApprovals((current) => ({
                              ...current,
                              [item.id]: "approved"
                            }))
                          }
                        >
                          Approve
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            </section>

            <section className="company-admin-grid company-admin-grid-secondary">
              <article className="company-panel">
                <div className="company-panel-head">
                  <div>
                    <div className="company-panel-kicker">Uploads</div>
                    <h2>Series and episode monitoring</h2>
                  </div>
                </div>
                <div className="upload-monitor-list">
                  {recentUploads.map((item) => (
                    <div className="upload-monitor-card" key={item.slug}>
                      <img src={item.image} alt={item.title} />
                      <div>
                        <strong>{item.title}</strong>
                        <p>{`${item.type} · ${(item.episodes || []).length} episodes · ${item.creatorName}`}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </article>

              <article className="company-panel">
                <div className="company-panel-head">
                  <div>
                    <div className="company-panel-kicker">Platform Signals</div>
                    <h2>Community activity</h2>
                  </div>
                </div>
                <div className="engagement-stat-grid">
                  <div className="mini-stat-card">
                    <span>Community posts</span>
                    <strong>{formatCompactCount(localCommunityPosts.length)}</strong>
                  </div>
                  <div className="mini-stat-card">
                    <span>Open reports</span>
                    <strong>{formatCompactCount(moderationQueue.filter((item) => item.status === "open").length)}</strong>
                  </div>
                  <div className="mini-stat-card">
                    <span>Approved creators</span>
                    <strong>{formatCompactCount(creatorRows.filter((item) => item.creatorApproval === "approved").length)}</strong>
                  </div>
                  <div className="mini-stat-card">
                    <span>Monetized creators</span>
                    <strong>{formatCompactCount(Object.keys(monetizationApprovals).length)}</strong>
                  </div>
                </div>
              </article>
            </section>

            <section className="company-admin-grid company-admin-grid-secondary">
              <article className="company-panel">
                <div className="company-panel-head">
                  <div>
                    <div className="company-panel-kicker">System Settings</div>
                    <h2>Operational rules</h2>
                  </div>
                </div>
                <div className="settings-list">
                  {systemSettings.map(([label, value]) => (
                    <div className="settings-row" key={label}>
                      <span>{label}</span>
                      <strong>{value}</strong>
                    </div>
                  ))}
                </div>
              </article>

              <article className="company-panel company-panel-accent">
                <div className="company-panel-head">
                  <div>
                    <div className="company-panel-kicker">Audit & Logs</div>
                    <h2>Recent admin actions</h2>
                  </div>
                </div>
                <div className="audit-list">
                  {auditItems.map((item) => (
                    <div className="audit-item" key={item}>
                      <i className="fa-solid fa-check" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </article>
            </section>
          </section>
        </div>
      </main>
      <BottomNav />
    </>
  );
}
