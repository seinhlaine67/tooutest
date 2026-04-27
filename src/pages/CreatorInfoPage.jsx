import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import BottomNav from "../components/layout/BottomNav";
import Header from "../components/layout/Header";
import SeriesCard from "../components/shared/SeriesCard";
import { toggleCreatorFollow } from "../lib/backend";
import { fetchCreatorProfileBySlug } from "../lib/creatorBackend";
import { getStoredList, setStoredList } from "../lib/storage";
import { useBodyPage } from "../lib/useBodyPage";
import {
  formatCompactCount,
  getAllCreators,
  getAllSeries,
  getCreatorBySlug,
  slugify
} from "../lib/toouData";
import { parseCompactCount } from "../lib/utils";
import "../styles/legacy/creator-info.css";

function buildLocalCreatorFallback(creatorSlug) {
  const creator = getCreatorBySlug(creatorSlug) || getAllCreators()[0] || null;
  if (!creator) return null;

  const allCreators = getAllCreators();
  const allSeries = getAllSeries();
  const isStudio = creator.type === "studio";
  const featuredArtists = isStudio
    ? allCreators
        .filter((item) => item.type !== "studio")
        .filter(
          (item) =>
            item.affiliatedStudioId === creator.id ||
            (creator.featuredArtists || []).some(
              (artist) => artist.id === item.id || artist.name === item.name
            )
        )
        .map((item) => ({
          id: item.id,
          name: item.name,
          slug: item.slug || slugify(item.name),
          avatar: item.avatar || "/images/image1.png",
          role: item.affiliatedStudioRole || item.primaryFormat || "Featured Creator"
        }))
    : [];

  const works = isStudio
    ? allSeries.filter(
        (item) =>
          item.creatorId === creator.id ||
          featuredArtists.some((artist) => artist.id === item.creatorId)
      )
    : allSeries.filter((item) => item.creatorId === creator.id);

  return {
    creator: {
      id: creator.id,
      slug: creator.slug || creatorSlug || creator.id,
      name: creator.name,
      displayName: creator.name,
      studioName: creator.studioName || "",
      type: creator.type,
      avatar: creator.avatar || "/images/image1.png",
      cover: creator.cover || creator.avatar || "/images/image1.png",
      bio: creator.bio || "",
      followers: creator.followers || "0",
      followerCount: parseCompactCount(creator.followers || "0"),
      rating: creator.rating || "9.0",
      isFollowing: false,
      featuredArtists
    },
    works,
    stats: {
      totalViews: works.reduce((sum, item) => sum + parseCompactCount(item.views || "0"), 0)
    }
  };
}

export default function CreatorInfoPage() {
  useBodyPage("creator-info");
  const [searchParams] = useSearchParams();
  const creatorSlug = searchParams.get("creator");
  const [followedCreators, setFollowedCreators] = useState(() => getStoredList("toouFollowedCreators"));
  const [remoteData, setRemoteData] = useState(null);
  const [loadStatus, setLoadStatus] = useState("loading");
  const [followPending, setFollowPending] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadCreator() {
      if (!creatorSlug) {
        setRemoteData(null);
        setLoadStatus("success");
        return;
      }

      setLoadStatus("loading");
      try {
        const data = await fetchCreatorProfileBySlug(creatorSlug);
        if (!cancelled) {
          setRemoteData(data);
          setLoadStatus("success");
        }
      } catch (error) {
        if (cancelled) return;
        console.error("Failed to load remote creator profile:", error);
        setRemoteData(null);
        setLoadStatus("error");
      }
    }

    loadCreator();
    return () => {
      cancelled = true;
    };
  }, [creatorSlug]);

  const fallbackData = useMemo(() => buildLocalCreatorFallback(creatorSlug), [creatorSlug]);
  const pageData = remoteData || fallbackData;
  const creator = pageData?.creator || null;
  const works = pageData?.works || [];

  if (!creator) {
    return (
      <>
        <Header />
        <main className="creator-info-shell">
          <section className="creator-info-layout">
            <article className="creator-info-panel creator-info-panel-wide">
              <h2>Creator not found.</h2>
            </article>
          </section>
        </main>
        <BottomNav />
      </>
    );
  }

  const isStudio = creator.type === "studio";
  const featuredArtists = creator.featuredArtists || [];
  const baseFollowerCount =
    typeof creator.followerCount === "number"
      ? creator.followerCount
      : parseCompactCount(creator.followers || "0");
  const locallyFollowed = followedCreators.includes(creator.id);
  const isFollowing = Boolean(creator.isFollowing || locallyFollowed);
  const followerCount = baseFollowerCount + (isFollowing && !creator.isFollowing ? 1 : 0);
  const totalViews = Number(pageData?.stats?.totalViews) || works.reduce((sum, item) => sum + parseCompactCount(item.views || "0"), 0);

  async function handleToggleFollow() {
    const nextValues = isFollowing
      ? followedCreators.filter((item) => item !== creator.id)
      : [...followedCreators, creator.id];

    setFollowedCreators(nextValues);
    setStoredList("toouFollowedCreators", nextValues);

    if (!creator.id || !remoteData) return;

    try {
      setFollowPending(true);
      const response = await toggleCreatorFollow(creator.id);
      setRemoteData((current) =>
        current
          ? {
              ...current,
              creator: {
                ...current.creator,
                isFollowing: Boolean(response?.isFollowing)
              }
            }
          : current
      );
    } catch (error) {
      console.error("Failed to toggle creator follow:", error);
      setFollowedCreators((current) =>
        isFollowing ? [...current, creator.id] : current.filter((item) => item !== creator.id)
      );
      setStoredList(
        "toouFollowedCreators",
        isFollowing ? [...followedCreators, creator.id] : followedCreators.filter((item) => item !== creator.id)
      );
    } finally {
      setFollowPending(false);
    }
  }

  return (
    <>
      <Header />
      <main className="creator-info-shell">
        <button type="button" className="floating-back-link" aria-label="Go back" onClick={() => window.history.back()}>
          <i className="fa-solid fa-arrow-left" />
        </button>

        <section className="creator-info-hero studio-hero">
          <div
            className="studio-hero-cover"
            style={{
              backgroundImage: `linear-gradient(180deg, rgba(255,255,255,0.88), rgba(255,255,255,0.96)), url('${creator.cover || creator.avatar || "/images/image1.png"}')`
            }}
          />
          <div className="studio-hero-body">
            <div className="studio-avatar-ring">
              <img className="studio-hero-avatar" src={creator.avatar || "/images/image1.png"} alt={creator.name} />
            </div>
            <div className={isStudio ? "studio-hero-copy" : "creator-hero-copy"}>
              <div className="studio-title-row">
                <h1>{creator.name}</h1>
                {isStudio ? <span className="studio-rank-badge">Top Studio</span> : null}
              </div>
              <div className="studio-heat">{creator.rating || "9.0"} Heat</div>
              <div className="studio-stat-row">
                <div className="studio-stat-pill">
                  <strong>{formatCompactCount(followerCount)}</strong>
                  <span>Followers</span>
                </div>
                <div className="studio-stat-pill">
                  <strong>{formatCompactCount(totalViews)}</strong>
                  <span>Total Views</span>
                </div>
              </div>
              <button
                type="button"
                className={`hero-follow-btn studio-follow-btn ${isFollowing ? "active" : ""}`}
                onClick={handleToggleFollow}
                disabled={followPending}
              >
                {isFollowing ? "Following" : isStudio ? "Follow Studio" : "Follow"}
              </button>
              <p>{creator.bio || "Creator profile connected to TooU's reading universe."}</p>
            </div>
          </div>
        </section>

        {loadStatus === "error" ? (
          <section className="creator-info-layout">
            <article className="creator-info-panel creator-info-panel-wide">
              <h2>Live creator data is unavailable right now.</h2>
              <p>Showing the local fallback view so the page still works.</p>
            </article>
          </section>
        ) : null}

        <section className="creator-info-layout">
          <article className="creator-info-panel">
            <div className="panel-kicker">About</div>
            <h2>{isStudio ? "Studio profile" : "Creator profile"}</h2>
            <p>{creator.bio}</p>
            <div className="creator-stats">
              <div className="creator-stat">
                <span>Followers</span>
                <strong>{formatCompactCount(followerCount)}</strong>
              </div>
              <div className="creator-stat">
                <span>Total Views</span>
                <strong>{formatCompactCount(totalViews)}</strong>
              </div>
              <div className="creator-stat">
                <span>Heat</span>
                <strong>{creator.rating || "9.0"}</strong>
              </div>
            </div>
          </article>

          {isStudio ? (
            <article className="creator-info-panel">
              <div className="panel-kicker">Studio</div>
              <h2>{`Artists (${featuredArtists.length})`}</h2>
              <div className="artist-list">
                {featuredArtists.length ? (
                  featuredArtists.map((artist) => (
                    <Link className="artist-item artist-link artist-profile-link" key={artist.id} to={`/creator-info?creator=${artist.slug}`}>
                      <img src={artist.avatar} alt={artist.name} />
                      <strong>{artist.name}</strong>
                      <span>{artist.role}</span>
                    </Link>
                  ))
                ) : (
                  <div className="artist-item">
                    <strong>No artists added yet</strong>
                    <span>Studio members will appear here after they join the studio.</span>
                  </div>
                )}
              </div>
            </article>
          ) : null}

          <article className="creator-info-panel creator-info-panel-wide">
            <div className="panel-kicker">Catalog</div>
            <h2>{isStudio ? "Featured works" : "Published works"}</h2>
            <div className="creator-work-grid">
              {works.map((item) => (
                <SeriesCard key={item.slug || item.id} item={item} />
              ))}
            </div>
          </article>
        </section>
      </main>
      <BottomNav />
    </>
  );
}
