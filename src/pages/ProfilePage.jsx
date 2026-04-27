import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCreatorProfile, getUserAccount } from "../lib/account";
import { useAppSettings } from "../lib/appSettings";
import { getStoredList } from "../lib/storage";
import "../styles/legacy/profile.css";

function getEpisodeCommentCount(username) {
  try {
    const commentMap = JSON.parse(window.localStorage.getItem("toouEpisodeComments") || "{}");
    return Object.values(commentMap)
      .flat()
      .filter((comment) => comment.author === username || comment.user === username).length;
  } catch {
    return 0;
  }
}

function getCommunityPostsByUser(username) {
  return getStoredList("toouCommunityPosts").filter((post) => post.user === username);
}

function getCommunityCommentCount(username) {
  return getStoredList("toouCommunityPosts")
    .flatMap((post) => post.comments || [])
    .filter((comment) => comment.author === username || comment.user === username).length;
}

function getActivityBadge(account) {
  const username = account?.username || "";
  const accountAge = account?.createdAt ? (Date.now() - Number(account.createdAt)) / 86400000 : 999;
  const postCount = getCommunityPostsByUser(username).length;
  const commentCount = getEpisodeCommentCount(username) + getCommunityCommentCount(username);
  const totalEngagement = getCommunityPostsByUser(username).reduce(
    (sum, post) => sum + Number(post.likes || 0) + Number(post.saves || 0),
    0
  );

  if (totalEngagement >= 20) return "💖 Community Star";
  if (commentCount >= 20) return "📣 Top Contributor";
  if (postCount >= 3) return "🚀 Hype Starter";
  if (commentCount >= 5) return "📚 Super Reader";
  if (commentCount >= 1) return "💬 First Voice";
  if (accountAge <= 7) return "🌱 New Reader";
  return "🌱 New Reader";
}

function getSupportLevel(account) {
  const total = Number(account?.eggsPurchasedTotal || 0);
  if (total >= 8000) return "📣 Legend Supporter";
  if (total >= 4000) return "🌙 Elite Reader";
  if (total >= 1500) return "💎 VIP Reader";
  if (total >= 500) return "🔥 Power Supporter";
  if (total >= 100) return "🛍️ Support Fan";
  return "🥚 Egg Starter";
}

export default function ProfilePage() {
  const { t } = useAppSettings();
  const navigate = useNavigate();
  const userAccount = useMemo(() => getUserAccount(), []);
  const creatorProfile = useMemo(() => getCreatorProfile(), []);
  const [modalOpen, setModalOpen] = useState(false);

  const profile = userAccount
    ? {
        avatar: userAccount.avatar || "https://i.pravatar.cc/120?img=12",
        cover: userAccount.coverImage || userAccount.avatar || "/images/image1.png",
        name: userAccount.displayName || userAccount.username || "TooU Reader",
        handle: userAccount.username ? `@${userAccount.username}` : "@reader",
        badge: creatorProfile ? "Reader + Creator" : userAccount.plan || "Reader",
        bio: userAccount.bio || "Content enthusiast and aspiring creator.",
        coins: String(userAccount.coins ?? 50),
        plan: creatorProfile ? "Creator Enabled" : "Reader",
        activityBadge: getActivityBadge(userAccount),
        supportLevel: getSupportLevel(userAccount)
      }
    : {
        avatar: "https://i.pravatar.cc/120?img=12",
        cover: "/images/image1.png",
        name: "Guest Reader",
        handle: "@guest",
        badge: "Reader",
        bio: "Your profile, eggs, and creator tools will appear here after signup.",
        coins: "0",
        plan: "Guest",
        activityBadge: "🌱 New Reader",
        supportLevel: "🥚 Egg Starter"
      };

  function handleMenu(target) {
    if (target === "edit") {
      if (!userAccount) {
        setModalOpen(true);
        return;
      }
      navigate("/profile-editor");
      return;
    }
    if (target === "history") return navigate("/library");
    if (target === "favorites") return navigate("/library#favorites");
    if (target === "bookmarks") return navigate("/library#bookmarks");
    if (target === "purchase") return navigate("/store");
    window.alert(
      target === "notifications"
        ? "Notifications are ready for the next page hookup for your reader profile."
        : "This section is ready for the next page hookup."
    );
  }

  return (
    <>
      <section className="profile-shell">
        <article className="profile-card">
          <div
            className="profile-cover"
            style={{
              backgroundImage: `linear-gradient(135deg, rgba(107, 70, 193, 0.52), rgba(73, 199, 255, 0.24)), url("${profile.cover}")`
            }}
          />
          <div className="profile-row">
            <img className="profile-avatar" src={profile.avatar} alt="Profile avatar" />
            <div className="profile-copy">
              <h1>{profile.name}</h1>
              <p className="subtext">{profile.handle}</p>
              <div className="profile-meta-badges">
                <span className="profile-mini-badge">{profile.activityBadge}</span>
                <span className="profile-mini-badge">{profile.supportLevel}</span>
              </div>
              <span className="role-badge">{profile.badge}</span>
            </div>
          </div>

          <p className="profile-bio">{profile.bio}</p>

          <div className="stats">
            <div className="stat-box">
              <strong>🥚 {profile.coins}</strong>
              <span>{t("Eggs")}</span>
            </div>
            <div className="stat-box"><strong>{profile.plan}</strong><span>{t("Status")}</span></div>
            <div className="stat-box"><strong>{profile.activityBadge}</strong><span>{t("Community Badge")}</span></div>
            <div className="stat-box"><strong>{profile.supportLevel}</strong><span>{t("Support Level")}</span></div>
          </div>
        </article>

        <article className="profile-section split-card">
          <div>
            <h2>{t("Switch Mode")}</h2>
            <p>
              {creatorProfile
                ? `Reader mode is active. Switch to creator mode as ${creatorProfile.displayName || creatorProfile.studioName || "your creator identity"}.`
                : "Currently in Reader mode"}
            </p>
          </div>
          <button
            type="button"
            className="action-btn"
            onClick={() => {
              if (!userAccount) {
                setModalOpen(true);
                return;
              }
              navigate(creatorProfile ? "/creator-dashboard" : "/publish");
            }}
          >
            {t("Creator Mode")}
          </button>
        </article>

        <article className="profile-section menu-card">
          {[
            ["edit", "fa-regular fa-pen-to-square", t("Edit Profile")],
            ["notifications", "fa-regular fa-bell", t("Notifications")],
            ["history", "fa-solid fa-book-open-reader", t("Reading History")],
            ["favorites", "fa-regular fa-heart", t("Favorites")],
            ["bookmarks", "fa-regular fa-bookmark", t("Bookmarks")],
            ["purchase", "fa-regular fa-rectangle-list", t("Purchase History")],
            ["settings", "fa-solid fa-gear", t("Settings")]
          ].map(([target, icon, label]) => (
            <button
              type="button"
              className="menu-item"
              key={target}
              onClick={() => handleMenu(target)}
            >
              <span><i className={icon} />{label}</span>
              <span className="arrow"><i className="fa-solid fa-angle-right" /></span>
            </button>
          ))}
        </article>

        <button
          type="button"
          className="logout-btn"
          onClick={() => {
            window.localStorage.removeItem("toouUserAccount");
            window.localStorage.removeItem("toouCreatorProfile");
            navigate("/signup");
          }}
        >
          {t("Logout")}
        </button>
      </section>

      <div className={`account-modal ${modalOpen ? "" : "hidden"}`}>
        <div className="account-modal-backdrop" onClick={() => setModalOpen(false)} />
        <div
          className="account-modal-card"
          role="dialog"
          aria-modal="true"
          aria-labelledby="accountModalTitle"
        >
          <button
            type="button"
            className="account-modal-close"
            aria-label="Close"
            onClick={() => setModalOpen(false)}
          >
            <i className="fa-solid fa-xmark" />
          </button>
          <div className="choice-head">
            <h2 id="accountModalTitle">Create Your Account</h2>
            <p>Choose the mode you want to start with. You can still add the other mode later.</p>
          </div>
          <div className="choice-grid">
            <Link to="/signup" className="choice-link">
              <div className="choice-box">
                <div className="choice-icon reader"><i className="fa-solid fa-book-open-reader" /></div>
                <strong>Create your reader account</strong>
                <span>Start as a reader, save your profile, and upgrade to creator mode later.</span>
              </div>
            </Link>
            <Link to="/signup?view=signin&role=reader" className="choice-link">
              <div className="choice-box">
                <div className="choice-icon creator"><i className="fa-solid fa-feather-pointed" /></div>
                <strong>Unlock creator mode</strong>
                <span>Sign in with your base account first, then continue into creator onboarding.</span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
