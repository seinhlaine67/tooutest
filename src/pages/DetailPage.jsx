import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import SeriesCard from "../components/shared/SeriesCard";
import { getUserAccount } from "../lib/account";
import {
  createEpisodeComment,
  deleteEpisodeComment,
  fetchEpisode,
  fetchSeriesList,
  fetchSeriesDetail,
  toggleCreatorFollow,
  toggleSeriesBookmark,
  toggleTargetLike,
  updateEpisodeComment
} from "../lib/backend";
import {
  getStoredList,
  getStoredMap,
  setStoredList,
  setStoredMap
} from "../lib/storage";
import { useAppSettings } from "../lib/appSettings";
import { parseCompactCount } from "../lib/utils";
import "../styles/legacy/detail.css";

function formatCompactCount(value) {
  const number = Number(value) || 0;
  if (number >= 1000000) return `${(number / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
  if (number >= 1000) return `${(number / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(number);
}

function getEpisodeTextContent(seriesItem, episodeItem) {
  const candidates = [
    episodeItem?.body,
    episodeItem?.chapterBody,
    episodeItem?.content,
    episodeItem?.text,
    episodeItem?.description
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
  }

  return "";
}

function isVisualSeries(seriesItem) {
  return ["webtoon", "comics", "cartoon"].includes(
    String(seriesItem?.type || "").toLowerCase()
  );
}

function buildCommentMeta(comment, userAccount) {
  if (userAccount && comment.user === userAccount.username) {
    return {
      avatar: userAccount.avatar || "/images/image1.png",
      activityBadge: "💬 First Voice",
      supportLevel: "🥚 Egg Starter"
    };
  }

  return {
    avatar: comment.avatar || "/images/image1.png",
    activityBadge: comment.badge || "Reader",
    supportLevel: comment.level || "🥚 Egg Starter"
  };
}

function renderInlineFormatting(text, keyPrefix) {
  const tokens = String(text || "").split(/(\*\*[^*]+\*\*|\*[^*]+\*|__[^_]+__|`[^`]+`)/g);
  return tokens.filter(Boolean).map((token, index) => {
    const key = `${keyPrefix}-${index}`;
    if (token.startsWith("**") && token.endsWith("**")) {
      return <strong key={key}>{token.slice(2, -2)}</strong>;
    }
    if (token.startsWith("*") && token.endsWith("*")) {
      return <em key={key}>{token.slice(1, -1)}</em>;
    }
    if (token.startsWith("__") && token.endsWith("__")) {
      return <span key={key} className="reader-underline">{token.slice(2, -2)}</span>;
    }
    if (token.startsWith("`") && token.endsWith("`")) {
      return <code key={key} className="reader-inline-code">{token.slice(1, -1)}</code>;
    }
    return token;
  });
}

function renderStructuredText(text, keyPrefix) {
  return String(text || "")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block, index) => {
      const key = `${keyPrefix}-${index}`;
      if (block.startsWith("## ")) {
        return <h3 key={key}>{renderInlineFormatting(block.slice(3), key)}</h3>;
      }
      if (block.startsWith("# ")) {
        return <h2 key={key}>{renderInlineFormatting(block.slice(2), key)}</h2>;
      }
      if (block.startsWith("> ")) {
        return <blockquote key={key}>{renderInlineFormatting(block.slice(2), key)}</blockquote>;
      }
      return <p key={key}>{renderInlineFormatting(block, key)}</p>;
    });
}

function ReaderContent({ seriesItem, episodeItem, readerSettings }) {
  const prefersImages = isVisualSeries(seriesItem);
  const textContent = getEpisodeTextContent(seriesItem, episodeItem);
  const hasImages = Array.isArray(episodeItem?.images) && episodeItem.images.length > 0;

  if (prefersImages && hasImages) {
    return (
      <>
        {episodeItem.images.map((src, index) => (
          <img key={`${episodeItem.id}-${index}`} src={src} alt={episodeItem.title} />
        ))}
      </>
    );
  }

  const formattedBlocks = renderStructuredText(textContent, episodeItem?.id || "reader");

  if (formattedBlocks.length) {
    return (
      <>
        <article
          className={`reader-text-body reader-text-theme-${readerSettings.theme}`}
          style={{ fontSize: `${readerSettings.fontSize}px` }}
        >
          <h2>{episodeItem.title}</h2>
          {formattedBlocks}
        </article>
        {!prefersImages && hasImages ? (
          <div className="reader-inline-gallery">
            {episodeItem.images.map((src, index) => (
              <img key={`${episodeItem.id}-gallery-${index}`} src={src} alt={episodeItem.title} />
            ))}
          </div>
        ) : null}
      </>
    );
  }

  if (hasImages) {
    return (
      <div className="reader-inline-gallery">
        {episodeItem.images.map((src, index) => (
          <img key={`${episodeItem.id}-gallery-${index}`} src={src} alt={episodeItem.title} />
        ))}
      </div>
    );
  }

  return (
    <article className="reader-text-body">
      <p>
        This chapter is ready, but it does not have visible content yet. Add
        chapter text or images in the creator editor and it will appear here.
      </p>
    </article>
  );
}

function DetailSkeleton() {
  return (
    <div className="app">
      <div className="left">
        <div className="hero detail-skeleton-hero shimmer-block" />
        <div className="content detail-skeleton-content">
          <div className="detail-skeleton-stats">
            <span className="shimmer-block detail-skeleton-stat" />
            <span className="shimmer-block detail-skeleton-stat" />
            <span className="shimmer-block detail-skeleton-stat short" />
          </div>
          <div className="detail-skeleton-actions">
            <span className="shimmer-block detail-skeleton-icon" />
            <span className="shimmer-block detail-skeleton-btn" />
            <span className="shimmer-block detail-skeleton-btn" />
          </div>
          <div className="detail-skeleton-tags">
            <span className="shimmer-block detail-skeleton-tag" />
            <span className="shimmer-block detail-skeleton-tag short" />
            <span className="shimmer-block detail-skeleton-tag" />
          </div>
          <div className="shimmer-block detail-skeleton-line wide" />
          <div className="shimmer-block detail-skeleton-line" />
          <div className="shimmer-block detail-skeleton-line short" />
          <div className="detail-skeleton-section">
            <div className="shimmer-block detail-skeleton-heading" />
            <div className="shimmer-block detail-skeleton-card" />
            <div className="shimmer-block detail-skeleton-card" />
            <div className="shimmer-block detail-skeleton-card" />
          </div>
          <div className="detail-skeleton-section">
            <div className="shimmer-block detail-skeleton-heading short" />
            <RecommendationRailSkeleton count={3} />
          </div>
        </div>
      </div>
      <div className="reader detail-skeleton-reader">
        <div className="detail-skeleton-reader-topbar">
          <span className="shimmer-block detail-skeleton-reader-pill" />
          <span className="shimmer-block detail-skeleton-reader-select" />
        </div>
        <div className="detail-skeleton-reader-body">
          <div className="shimmer-block detail-skeleton-reader-title" />
          <div className="shimmer-block detail-skeleton-reader-line" />
          <div className="shimmer-block detail-skeleton-reader-line wide" />
          <div className="shimmer-block detail-skeleton-reader-line" />
          <div className="shimmer-block detail-skeleton-reader-panel" />
          <div className="shimmer-block detail-skeleton-reader-meta" />
          <ReaderCommentsSkeleton />
        </div>
      </div>
    </div>
  );
}

function RecommendationRailSkeleton({ count = 3 }) {
  return (
    <div className="recommend detail-skeleton-recommend">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="detail-skeleton-recommend-card">
          <div className="shimmer-block detail-skeleton-recommend-image" />
          <div className="shimmer-block detail-skeleton-recommend-text wide" />
          <div className="shimmer-block detail-skeleton-recommend-text" />
        </div>
      ))}
    </div>
  );
}

function ReaderCommentsSkeleton() {
  return (
    <div className="reader-comments-skeleton">
      <div className="shimmer-block reader-comments-skeleton-line wide" />
      <div className="reader-comments-skeleton-item">
        <div className="shimmer-block reader-comments-skeleton-avatar" />
        <div className="reader-comments-skeleton-copy">
          <div className="shimmer-block reader-comments-skeleton-line" />
          <div className="shimmer-block reader-comments-skeleton-line short" />
        </div>
      </div>
      <div className="reader-comments-skeleton-item">
        <div className="shimmer-block reader-comments-skeleton-avatar" />
        <div className="reader-comments-skeleton-copy">
          <div className="shimmer-block reader-comments-skeleton-line" />
          <div className="shimmer-block reader-comments-skeleton-line short" />
        </div>
      </div>
    </div>
  );
}

export default function DetailPage() {
  const { t } = useAppSettings();
  const { slug: routeSlug } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const readerRef = useRef(null);
  const [bookmarkedSeries, setBookmarkedSeries] = useState(() => getStoredList("toouBookmarkedSeries"));
  const [followedCreators, setFollowedCreators] = useState(() => getStoredList("toouFollowedCreators"));
  const [likedEpisodes, setLikedEpisodes] = useState(() => getStoredList("toouLikedEpisodes"));
  const [episodeLikeDeltas, setEpisodeLikeDeltas] = useState(() => getStoredMap("toouEpisodeLikeDeltas"));
  const [seriesLikeDeltas, setSeriesLikeDeltas] = useState(() => getStoredMap("toouSeriesLikeDeltas"));
  const [seriesViewDeltas, setSeriesViewDeltas] = useState(() => getStoredMap("toouSeriesViewDeltas"));
  const [currentEpisodeFilter, setCurrentEpisodeFilter] = useState("all");
  const [expandedEpisodes, setExpandedEpisodes] = useState(false);
  const [activeEpisodeId, setActiveEpisodeId] = useState(null);
  const [readerOpen, setReaderOpen] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState("");
  const [commentInput, setCommentInput] = useState("");
  const [commentMessage, setCommentMessage] = useState("");
  const [readerToolsOpen, setReaderToolsOpen] = useState(false);
  const [readerSettings, setReaderSettings] = useState(() => ({
    fontSize: Number(window.localStorage.getItem("toouReaderFontSize") || 16),
    theme: window.localStorage.getItem("toouReaderTextTheme") || "paper"
  }));
  const [remoteSeriesItem, setRemoteSeriesItem] = useState(null);
  const [remoteCreator, setRemoteCreator] = useState(null);
  const [remoteEpisodes, setRemoteEpisodes] = useState({});
  const [remoteRecommendations, setRemoteRecommendations] = useState([]);
  const [detailStatus, setDetailStatus] = useState("idle");
  const [detailError, setDetailError] = useState("");
  const [recommendationsStatus, setRecommendationsStatus] = useState("idle");
  const [loadingEpisodeId, setLoadingEpisodeId] = useState("");
  const [bookmarkPending, setBookmarkPending] = useState(false);
  const [followPending, setFollowPending] = useState(false);
  const [episodeLikePending, setEpisodeLikePending] = useState(false);

  const seriesSlug = routeSlug || searchParams.get("series");
  const seriesId = searchParams.get("id");
  const seriesItem = remoteSeriesItem;
  const creator = remoteCreator;
  const episodes = seriesItem?.episodes || [];
  const startEpisodeId = episodes[0]?.id || null;
  const activeEpisodeSeed =
    episodes.find((episode) => episode.id === activeEpisodeId) || episodes[0] || null;
  const activeEpisode =
    (activeEpisodeSeed && remoteEpisodes[activeEpisodeSeed.id]
      ? { ...activeEpisodeSeed, ...remoteEpisodes[activeEpisodeSeed.id] }
      : activeEpisodeSeed) || null;
  const userAccount = getUserAccount();

  useEffect(() => {
    window.localStorage.setItem("toouReaderFontSize", String(readerSettings.fontSize));
    window.localStorage.setItem("toouReaderTextTheme", readerSettings.theme);
  }, [readerSettings]);

  useEffect(() => {
    let active = true;

    async function loadRemoteDetail() {
      if (!seriesSlug) return;

      setDetailStatus("loading");
      setDetailError("");

      try {
        const detail = await fetchSeriesDetail({ slug: seriesSlug, id: seriesId });
        if (!active) return;

        if (!detail?.id) {
          setDetailStatus("error");
          setDetailError("This series detail could not be loaded from the backend.");
          return;
        }

        setRemoteSeriesItem(detail);
        setRemoteCreator(detail.creator || null);
        setActiveEpisodeId(detail.episodes?.[0]?.id || null);

        const firstEpisodeId = detail.episodes?.[0]?.id;
        const shouldPrefetchFirstChapter =
          firstEpisodeId &&
          ["novel", "knowledge"].includes(String(detail.type || "").toLowerCase());

        if (shouldPrefetchFirstChapter) {
          try {
            const firstEpisode = await fetchEpisode(firstEpisodeId);
            if (!active) return;

            if (firstEpisode?.id) {
              setRemoteEpisodes((current) => ({
                ...current,
                [firstEpisodeId]: firstEpisode
              }));
            }
          } catch {
            // Keep the detail page usable even if the first chapter fetch fails.
          }
        }

        setDetailStatus("success");

        if (detail.isBookmarked) {
          setBookmarkedSeries((current) => {
            if (current.includes(detail.id)) return current;
            const next = [...current, detail.id];
            setStoredList("toouBookmarkedSeries", next);
            return next;
          });
        }

        if (detail.creator?.id && detail.creator.isFollowing) {
          setFollowedCreators((current) => {
            if (current.includes(detail.creator.id)) return current;
            const next = [...current, detail.creator.id];
            setStoredList("toouFollowedCreators", next);
            return next;
          });
        }
      } catch (error) {
        if (!active) return;
        setDetailStatus("error");
        setDetailError(error?.message || "Could not load series details.");
      }
    }

    loadRemoteDetail();

    return () => {
      active = false;
    };
  }, [seriesId, seriesSlug]);

  useEffect(() => {
    if (!seriesItem) return;
    const viewSessionKey = `toouSeriesViewRegistered:${seriesItem.id}`;
    if (!window.sessionStorage.getItem(viewSessionKey)) {
      const nextMap = {
        ...seriesViewDeltas,
        [seriesItem.id]: Number(seriesViewDeltas[seriesItem.id] || 0) + 1
      };
      setSeriesViewDeltas(nextMap);
      setStoredMap("toouSeriesViewDeltas", nextMap);
      window.sessionStorage.setItem(viewSessionKey, "1");
    }
  }, [seriesItem, seriesViewDeltas]);

  useEffect(() => {
    if (!seriesItem) return;
    setActiveEpisodeId(startEpisodeId);
    setCurrentEpisodeFilter("all");
    setExpandedEpisodes(false);
    setReaderOpen(Boolean(startEpisodeId));
  }, [startEpisodeId, seriesItem]);

  useEffect(() => {
    let active = true;

    async function loadRemoteEpisode() {
      if (!seriesItem?.remote || !activeEpisodeId || remoteEpisodes[activeEpisodeId]) return;

      setLoadingEpisodeId(activeEpisodeId);

      try {
        const episode = await fetchEpisode(activeEpisodeId);
        if (!active) return;

        if (!episode?.id) {
          setCommentMessage("This chapter could not be loaded from the backend yet.");
          return;
        }

        setRemoteEpisodes((current) => ({
          ...current,
          [activeEpisodeId]: episode
        }));

        if (episode.isLiked) {
          const storageKey = `${seriesItem.id}:${activeEpisodeId}`;
          setLikedEpisodes((current) => {
            if (current.includes(storageKey)) return current;
            const next = [...current, storageKey];
            setStoredList("toouLikedEpisodes", next);
            return next;
          });
        }
      } catch (error) {
        if (!active) return;
        setCommentMessage(error?.message || "Could not load this episode yet.");
      } finally {
        if (active) setLoadingEpisodeId("");
      }
    }

    loadRemoteEpisode();

    return () => {
      active = false;
    };
  }, [activeEpisodeId, likedEpisodes, remoteEpisodes, seriesItem]);

  useEffect(() => {
    let active = true;

    async function loadRecommendations() {
      if (!seriesItem?.id) {
        setRemoteRecommendations([]);
        setRecommendationsStatus("idle");
        return;
      }

      setRecommendationsStatus("loading");

      try {
        const relatedSeries = await fetchSeriesList({
          contentType: seriesItem.type,
          genre: seriesItem.genre && seriesItem.genre !== "General" ? seriesItem.genre : undefined,
          limit: 12
        });

        if (!active) return;

        const rankedSeries = (relatedSeries || [])
          .filter((item) => item?.id && item.id !== seriesItem.id)
          .sort((left, right) => {
            const leftSameCreator = left.creatorId === seriesItem.creatorId ? 1 : 0;
            const rightSameCreator = right.creatorId === seriesItem.creatorId ? 1 : 0;
            const leftSameGenre = left.genre === seriesItem.genre ? 1 : 0;
            const rightSameGenre = right.genre === seriesItem.genre ? 1 : 0;
            return rightSameCreator - leftSameCreator || rightSameGenre - leftSameGenre;
          })
          .slice(0, 3);

        setRemoteRecommendations(rankedSeries);
        setRecommendationsStatus("success");
      } catch {
        if (active) {
          setRemoteRecommendations([]);
          setRecommendationsStatus("error");
        }
      }
    }

    loadRecommendations();

    return () => {
      active = false;
    };
  }, [seriesItem?.creatorId, seriesItem?.genre, seriesItem?.id, seriesItem?.type]);

  useEffect(() => {
    const reader = readerRef.current;
    if (!reader) return undefined;
    const topbar = reader.querySelector(".reader-topbar");
    if (!topbar) return undefined;

    let lastScrollTop = reader.scrollTop;

    const handleScroll = () => {
      const currentScrollTop = reader.scrollTop;
      const scrollingDown = currentScrollTop > lastScrollTop;
      const passedThreshold = currentScrollTop > 48;
      topbar.classList.toggle("reader-topbar-hidden", scrollingDown && passedThreshold);
      if (!scrollingDown || currentScrollTop <= 8) {
        topbar.classList.remove("reader-topbar-hidden");
      }
      lastScrollTop = Math.max(0, currentScrollTop);
    };

    reader.addEventListener("scroll", handleScroll, { passive: true });
    return () => reader.removeEventListener("scroll", handleScroll);
  }, [activeEpisodeId, readerOpen]);

  if (!seriesItem && detailStatus === "loading") {
    return <DetailSkeleton />;
  }

  if (!seriesItem) {
    return (
      <div className="app">
        <div className="left">
          <div className="content">
            <div className="section-title">{t("Series Not Found")}</div>
            <div className="synopsis">
              {detailError || "This series could not be loaded from the current frontend or backend data."}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const displayedSeriesLikes = Math.max(
    0,
    parseCompactCount(seriesItem.likes || "0") + Number(seriesLikeDeltas[seriesItem.id] || 0)
  );
  const displayedSeriesViews = Math.max(
    0,
    parseCompactCount(seriesItem.views || "0") + Number(seriesViewDeltas[seriesItem.id] || 0)
  );
  const isSeriesBookmarked = Boolean(
    seriesItem?.remote ? seriesItem.isBookmarked : bookmarkedSeries.includes(seriesItem.id)
  );
  const isCreatorFollowed = Boolean(
    creator?.id && (seriesItem?.remote ? creator?.isFollowing : followedCreators.includes(creator.id))
  );
  const currentChapterTitle =
    activeEpisode?.title ||
    episodes[0]?.title ||
    (["novel", "knowledge"].includes(String(seriesItem.type || "").toLowerCase())
      ? "Chapter 1"
      : "Episode 1");
  const seriesFollowerCount = parseCompactCount(seriesItem.followers || "0");
  const creatorFollowerCount = parseCompactCount(creator?.followers || "0");
  const filteredEpisodes = episodes.filter((episode) => {
    if (currentEpisodeFilter === "free") return episode.free;
    if (currentEpisodeFilter === "premium") return !episode.free;
    return true;
  });
  const visibleEpisodes = expandedEpisodes ? filteredEpisodes : filteredEpisodes.slice(0, 6);

  const mergedComments = !activeEpisode
    ? []
    : [
        ...(activeEpisode.comments || []).map((comment, index) => ({
          ...comment,
          id: comment.id || `seed-${index}`,
          author: comment.author || comment.user || "",
          source: "seed"
        }))
      ];

  const recommendations = remoteRecommendations;

  function persistList(key, nextValue, setter) {
    setter(nextValue);
    setStoredList(key, nextValue);
  }

  function getEpisodeLikeStorageKey(episodeId) {
    return `${seriesItem.id}:${episodeId}`;
  }

  function getDisplayedEpisodeLikes(episodeId) {
    const episodeItem = episodes.find((episode) => episode.id === episodeId);
    const baseLikes = parseCompactCount(episodeItem?.likes || "0");
    const delta = Number(episodeLikeDeltas[getEpisodeLikeStorageKey(episodeId)] || 0);
    return Math.max(0, baseLikes + delta);
  }

  function handleOpenEpisode(episodeId) {
    const episodeItem = episodes.find((episode) => episode.id === episodeId);
    if (!episodeItem) return;

    setActiveEpisodeId(episodeId);
    setReaderOpen(true);
    setReaderToolsOpen(false);
    setEditingCommentId("");
    setCommentInput("");
    setCommentMessage("");

    const existingHistory = getStoredList("toouReadingHistory").filter(
      (item) => !(item.slug === seriesItem.slug && item.episode === episodeItem.title)
    );
    setStoredList("toouReadingHistory", [
      {
        title: seriesItem.title,
        slug: seriesItem.slug,
        type: seriesItem.type.charAt(0).toUpperCase() + seriesItem.type.slice(1),
        episode: episodeItem.title,
        progress: 100,
        time: "Read just now",
        openedAt: Date.now(),
        image: seriesItem.image
      },
      ...existingHistory
    ].slice(0, 12));

    requestAnimationFrame(() => {
      if (readerRef.current) readerRef.current.scrollTop = 0;
    });
  }

  async function handleToggleEpisodeLike() {
    if (!activeEpisode) return;
    if (!userAccount) {
      navigate("/signup");
      return;
    }

    const key = getEpisodeLikeStorageKey(activeEpisode.id);
    const currentlyLiked = likedEpisodes.includes(key);
    const nextLikedEpisodes = currentlyLiked
      ? likedEpisodes.filter((item) => item !== key)
      : [...likedEpisodes, key];
    const nextEpisodeLikeDeltas = { ...episodeLikeDeltas };
    const nextSeriesLikeDeltas = { ...seriesLikeDeltas };

    nextEpisodeLikeDeltas[key] = Number(nextEpisodeLikeDeltas[key] || 0) + (currentlyLiked ? -1 : 1);
    nextSeriesLikeDeltas[seriesItem.id] =
      Number(nextSeriesLikeDeltas[seriesItem.id] || 0) + (currentlyLiked ? -1 : 1);

    if (!nextEpisodeLikeDeltas[key]) delete nextEpisodeLikeDeltas[key];
    if (!nextSeriesLikeDeltas[seriesItem.id]) delete nextSeriesLikeDeltas[seriesItem.id];

    setLikedEpisodes(nextLikedEpisodes);
    setEpisodeLikeDeltas(nextEpisodeLikeDeltas);
    setSeriesLikeDeltas(nextSeriesLikeDeltas);
    setStoredList("toouLikedEpisodes", nextLikedEpisodes);
    setStoredMap("toouEpisodeLikeDeltas", nextEpisodeLikeDeltas);
    setStoredMap("toouSeriesLikeDeltas", nextSeriesLikeDeltas);

    if (!seriesItem.remote) return;

    try {
      setEpisodeLikePending(true);
      await toggleTargetLike("episode", activeEpisode.id);
      setRemoteEpisodes((current) => ({
        ...current,
        [activeEpisode.id]: {
          ...(current[activeEpisode.id] || {}),
          isLiked: !currentlyLiked
        }
      }));
    } catch (error) {
      setCommentMessage(error?.message || "Could not update the episode like yet.");
      setLikedEpisodes(likedEpisodes);
      setEpisodeLikeDeltas(episodeLikeDeltas);
      setSeriesLikeDeltas(seriesLikeDeltas);
      setStoredList("toouLikedEpisodes", likedEpisodes);
      setStoredMap("toouEpisodeLikeDeltas", episodeLikeDeltas);
      setStoredMap("toouSeriesLikeDeltas", seriesLikeDeltas);
    } finally {
      setEpisodeLikePending(false);
    }
  }

  async function handleToggleBookmark() {
    if (!seriesItem?.id) return;
    if (!userAccount) {
      navigate("/signup");
      return;
    }

    const isBookmarked = isSeriesBookmarked;
    const next = isBookmarked
      ? bookmarkedSeries.filter((item) => item !== seriesItem.id)
      : [...bookmarkedSeries, seriesItem.id];

    persistList("toouBookmarkedSeries", next, setBookmarkedSeries);

    if (!seriesItem.remote) return;

    try {
      setBookmarkPending(true);
      await toggleSeriesBookmark(seriesItem.id);
      setRemoteSeriesItem((current) =>
        current
          ? {
              ...current,
              isBookmarked: !isBookmarked,
              followers: formatCompactCount(
                Math.max(0, parseCompactCount(current.followers || "0") + (isBookmarked ? -1 : 1))
              )
            }
          : current
      );
    } catch (error) {
      persistList("toouBookmarkedSeries", bookmarkedSeries, setBookmarkedSeries);
      setCommentMessage(error?.message || "Could not update the bookmark yet.");
    } finally {
      setBookmarkPending(false);
    }
  }

  async function handleToggleCreatorFollow() {
    if (!creator?.id) return;
    if (!userAccount) {
      navigate("/signup");
      return;
    }

    const isFollowing = isCreatorFollowed;
    const next = isFollowing
      ? followedCreators.filter((item) => item !== creator.id)
      : [...followedCreators, creator.id];

    persistList("toouFollowedCreators", next, setFollowedCreators);

    if (!seriesItem.remote) return;

    try {
      setFollowPending(true);
      await toggleCreatorFollow(creator.id);
      setRemoteCreator((current) =>
        current
          ? {
              ...current,
              isFollowing: !isFollowing,
              followers: formatCompactCount(
                Math.max(0, parseCompactCount(current.followers || "0") + (isFollowing ? -1 : 1))
              )
            }
          : current
      );
      setRemoteSeriesItem((current) =>
        current ? { ...current, isFollowing: !isFollowing } : current
      );
    } catch (error) {
      persistList("toouFollowedCreators", followedCreators, setFollowedCreators);
      setCommentMessage(error?.message || "Could not update the creator follow yet.");
    } finally {
      setFollowPending(false);
    }
  }

  async function handleCommentSubmit(event) {
    event.preventDefault();
    if (!activeEpisode) return;

    if (!userAccount) {
      navigate("/signup");
      return;
    }

    const nextBody = commentInput.trim();
    if (!nextBody) {
      setCommentMessage("Write a comment first.");
      return;
    }

    try {
      const currentEpisodeId = activeEpisode.id;

      if (editingCommentId) {
        await updateEpisodeComment({ commentId: editingCommentId, content: nextBody });
      } else {
        await createEpisodeComment({ episodeId: currentEpisodeId, content: nextBody });
      }

      const refreshedEpisode = await fetchEpisode(currentEpisodeId);
      if (refreshedEpisode?.id) {
        setRemoteEpisodes((current) => ({
          ...current,
          [currentEpisodeId]: {
            ...(current[currentEpisodeId] || {}),
            ...refreshedEpisode
          }
        }));
      }

      setCommentInput("");
      setEditingCommentId("");
      setCommentMessage(editingCommentId ? "Comment updated." : "Comment posted.");
    } catch (error) {
      setCommentMessage(error?.message || "Could not save your comment yet.");
    }
  }

  function handleEditComment(comment) {
    if (seriesItem?.remote && !comment?.canEdit) return;
    setEditingCommentId(comment.id);
    setCommentInput(comment.body || "");
    setCommentMessage("Editing your comment.");
  }

  async function handleDeleteComment(commentId) {
    if (!activeEpisode) return;

    try {
      const currentEpisodeId = activeEpisode.id;
      await deleteEpisodeComment(commentId);
      const refreshedEpisode = await fetchEpisode(currentEpisodeId);
      if (refreshedEpisode?.id) {
        setRemoteEpisodes((current) => ({
          ...current,
          [currentEpisodeId]: {
            ...(current[currentEpisodeId] || {}),
            ...refreshedEpisode
          }
        }));
      }
      setEditingCommentId("");
      setCommentInput("");
      setCommentMessage("Comment deleted.");
    } catch (error) {
      setCommentMessage(error?.message || "Could not delete your comment yet.");
    }
  }

  return (
    <div className="app">
      <div className="left">
        <div className="hero">
          <button
            className="back-button"
            type="button"
            onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/"))}
          >
            {t("Back")}
          </button>
          <img src={seriesItem.detailImage || seriesItem.image} alt={`${seriesItem.title} cover`} />
          <div className="hero-content">
            <div className="tag">{`${seriesItem.type.toUpperCase()} ${seriesItem.rating}`}</div>
            <div className="title">{seriesItem.title}</div>
            <div className="author">
              <Link className="author-link" to={`/creator-info?creator=${creator?.slug || ""}`}>
                {seriesItem.creatorName}
              </Link>
            </div>
            <div className="stats">{formatCompactCount(creatorFollowerCount)} creator followers</div>
            <div className="stats">
              {formatCompactCount(displayedSeriesViews)} views ·{" "}
              {formatCompactCount(displayedSeriesLikes)} likes ·{" "}
              {formatCompactCount(seriesFollowerCount)} followers
            </div>
          </div>
        </div>

        <div className="content">
          <div className="buttons">
            <button
              className={`bookmark-series-btn ${
                isSeriesBookmarked ? "active-bookmark" : ""
              }`}
              type="button"
              onClick={handleToggleBookmark}
              disabled={bookmarkPending}
            >
              <i className="fa-solid fa-bookmark" />
            </button>
            <button
              className="read-btn"
              type="button"
              onClick={() => (activeEpisodeId || startEpisodeId) && handleOpenEpisode(activeEpisodeId || startEpisodeId)}
            >
              {t("Start Reading")}
            </button>
            <button
              type="button"
              className={`follow-series-btn ${isCreatorFollowed ? "active-following" : ""}`}
              onClick={handleToggleCreatorFollow}
              disabled={followPending}
            >
              {followPending
                ? t("Updating...")
                : isCreatorFollowed
                  ? t("Following")
                  : t("Follow")}
            </button>
          </div>

          {detailError ? <div className="comment-form-message">{detailError}</div> : null}

          <div>
            {(seriesItem.hashtags || []).map((tag) => (
              <span className="tag-pill" key={tag}>
                #{tag}
              </span>
            ))}
          </div>

          <div className="section-title">{t("Synopsis")}</div>
          <div className="synopsis">{seriesItem.synopsis}</div>

          <div className="section-title">Current Chapter</div>
          <div className="synopsis">
            {currentChapterTitle}
            {creator?.name ? ` by ${creator.name}` : seriesItem.creatorName ? ` by ${seriesItem.creatorName}` : ""}
          </div>

          <div className="section-title">{t("Episodes")}</div>
          <div className="filter">
            {[
              { key: "all", label: t("All") },
              { key: "free", label: t("Free") },
              { key: "premium", label: t("Premium") }
            ].map((item) => (
              <button
                key={item.key}
                className={currentEpisodeFilter === item.key ? "active-filter" : ""}
                onClick={() => {
                  setCurrentEpisodeFilter(item.key);
                  setExpandedEpisodes(false);
                }}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div>
            {visibleEpisodes.map((episodeItem) => {
              const actualIndex = episodes.findIndex((item) => item.id === episodeItem.id) + 1;
              const episodeNoun = isVisualSeries(seriesItem) ? "Episode" : "Chapter";
              return (
                <div
                  key={episodeItem.id}
                  className={`episode ${episodeItem.free ? "" : "locked"}`.trim()}
                  onClick={() => handleOpenEpisode(episodeItem.id)}
                >
                  <div className="episode-title-row">
                    <span className="episode-label">
                      {`${actualIndex}. ${episodeItem.title || `${episodeNoun} ${actualIndex}`}`}
                    </span>
                    <span className="episode-status">
                      {episodeItem.free ? t("Free") : t("Premium")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredEpisodes.length > 6 ? (
            <button
              className="show-more-btn"
              type="button"
              onClick={() => setExpandedEpisodes((value) => !value)}
            >
              {expandedEpisodes ? t("Show Fewer Episodes") : t("Show More Episodes")}
            </button>
          ) : null}

          <div className="section-title">{t("You May Also Like")}</div>
          {recommendationsStatus === "loading" ? (
            <RecommendationRailSkeleton count={3} />
          ) : (
            <div className="recommend">
              {recommendations.map((item) => (
                <SeriesCard key={item.id} item={item} className="recommend-link card-link" />
              ))}
            </div>
          )}
        </div>
      </div>

      <div
        ref={readerRef}
        className={`reader ${
          readerOpen && window.innerWidth < 1024 ? "mobile-active" : ""
        }`.trim()}
      >
        {activeEpisode ? (
          <>
            <div className="reader-topbar">
              <button className="reader-back" type="button" onClick={() => setReaderOpen(false)}>
                {t("Back")}
              </button>
              <div className="reader-topbar-controls">
                <button
                  type="button"
                  className={`reader-tools-toggle ${readerToolsOpen ? "active" : ""}`}
                  onClick={() => setReaderToolsOpen((value) => !value)}
                  aria-label={t("Reader Tools")}
                >
                  <i className="fa-solid fa-book-open" />
                </button>
                <select
                  className="episode-jump"
                  value={activeEpisode.id}
                  onChange={(event) => handleOpenEpisode(event.target.value)}
                >
                  {episodes.map((episode, index) => (
                    <option key={episode.id} value={episode.id}>
                      {`${index + 1}. ` +
                        (episode.title || `${isVisualSeries(seriesItem) ? "Episode" : "Chapter"} ${index + 1}`) +
                        (episode.free ? "" : " (Locked)")}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {readerToolsOpen ? (
              <div className="reader-tools-panel">
                {!isVisualSeries(seriesItem) ? (
                  <>
                    <label className="reader-tools-field">
                      <span>{t("Text Size")}</span>
                      <select
                        className="reader-setting-select"
                        value={readerSettings.fontSize}
                        onChange={(event) =>
                          setReaderSettings((current) => ({
                            ...current,
                            fontSize: Number(event.target.value)
                          }))
                        }
                      >
                        {[14, 16, 18, 20, 22].map((size) => (
                          <option key={size} value={size}>
                            {`${t("Text Size")} ${size}px`}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="reader-tools-field">
                      <span>{t("Reading Theme")}</span>
                      <select
                        className="reader-setting-select"
                        value={readerSettings.theme}
                        onChange={(event) =>
                          setReaderSettings((current) => ({
                            ...current,
                            theme: event.target.value
                          }))
                        }
                      >
                        <option value="paper">{t("Paper")}</option>
                        <option value="sepia">{t("Sepia")}</option>
                        <option value="night">{t("Night")}</option>
                      </select>
                    </label>
                  </>
                ) : (
                  <div className="reader-tools-note">{t("Reader Tools")}</div>
                )}
              </div>
            ) : null}

            <ReaderContent
              seriesItem={seriesItem}
              episodeItem={activeEpisode}
              readerSettings={readerSettings}
            />

            {loadingEpisodeId === activeEpisode.id ? <ReaderCommentsSkeleton /> : null}

            <div className="reader-bottom">
              <div className="reader-actions">
                <button
                  className={`reader-action-btn ${
                    likedEpisodes.includes(getEpisodeLikeStorageKey(activeEpisode.id))
                      ? "active-like"
                      : ""
                  }`}
                  type="button"
                  onClick={handleToggleEpisodeLike}
                  disabled={episodeLikePending}
                >
                  {episodeLikePending
                    ? t("Updating...")
                    : likedEpisodes.includes(getEpisodeLikeStorageKey(activeEpisode.id))
                      ? t("Liked Episode")
                      : t("Like Episode")}
                </button>
              </div>

              <div className="reader-stats">
                <span>{activeEpisode.views || "--"} views</span>
                <span>{formatCompactCount(getDisplayedEpisodeLikes(activeEpisode.id))} likes</span>
                <span>{mergedComments.length} comments</span>
              </div>

              <div className="chapter-ad">
                <div className="chapter-ad-label">Advertisement</div>
                <div className="chapter-ad-title">Unlock premium stories and creator drops.</div>
                <div className="chapter-ad-copy">
                  Support your favorite creators, get early access, and keep your
                  reading flow going with premium releases.
                </div>
              </div>

              {episodes.findIndex((episode) => episode.id === activeEpisode.id) < episodes.length - 1 ? (
                <button
                  className="reader-action-btn next-chapter-btn"
                  type="button"
                  onClick={() => {
                    const currentIndex = episodes.findIndex(
                      (episode) => episode.id === activeEpisode.id
                    );
                    const nextEpisode = episodes[currentIndex + 1];
                    if (nextEpisode) handleOpenEpisode(nextEpisode.id);
                  }}
                >
                  Next Chapter:{" "}
                  {episodes[episodes.findIndex((episode) => episode.id === activeEpisode.id) + 1]
                    ?.title}
                </button>
              ) : null}

              <div className="comment-panel">
                <h3>Comments</h3>

                {userAccount ? (
                  <form className="comment-form" onSubmit={handleCommentSubmit}>
                    <label className="comment-label" htmlFor="commentInput">
                      {t("Add Comment")}
                    </label>
                    <textarea
                      id="commentInput"
                      className="comment-input"
                      rows="4"
                      placeholder={t("Add Comment")}
                      value={commentInput}
                      onChange={(event) => setCommentInput(event.target.value)}
                    />
                    <div className="comment-form-footer">
                      <span className="comment-signed-in">
                        Commenting as {userAccount.username || "Reader"}
                      </span>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        {editingCommentId ? (
                          <button
                            className="comment-tool-btn"
                            type="button"
                            onClick={() => {
                              setEditingCommentId("");
                              setCommentInput("");
                              setCommentMessage("");
                            }}
                          >
                            {t("Cancel Edit")}
                          </button>
                        ) : null}
                        <button className="reader-action-btn comment-submit-btn" type="submit">
                          {editingCommentId ? t("Save Changes") : t("Post Comment")}
                        </button>
                      </div>
                    </div>
                    <div className="comment-form-message">{commentMessage}</div>
                  </form>
                ) : (
                  <div className="comment-login-note">
                    {t(
                      "Create or open a local reader account to add comments on episodes and chapters. "
                    )}
                    <Link to="/signup">{t("Open account")}</Link>
                  </div>
                )}

                <div className="comment-list">
                  {mergedComments.length ? (
                    mergedComments.map((comment) => {
                      const meta = buildCommentMeta(comment, userAccount);
                      const canManage = Boolean(userAccount && (comment.canEdit || comment.canDelete));

                      return (
                        <div className="comment-item" key={comment.id}>
                          <img className="comment-avatar" src={meta.avatar} alt={comment.user} />
                          <div className="comment-content">
                            <div className="comment-user">{comment.user}</div>
                            <div className="comment-badges">
                              <span className="comment-badge-chip">{meta.activityBadge}</span>
                              <span className="comment-badge-chip">{meta.supportLevel}</span>
                            </div>
                            <div className="comment-body">{comment.body}</div>
                            <div className="comment-meta-row">
                              <div className="comment-time">
                                {comment.editedAt ? "Just now · Edited" : comment.time || "Just now"}
                              </div>
                              {canManage ? (
                                <div className="comment-tools">
                                  <button
                                    className="comment-tool-btn"
                                    type="button"
                                    onClick={() => handleEditComment(comment)}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    className="comment-tool-btn"
                                    type="button"
                                    onClick={() => handleDeleteComment(comment.id)}
                                  >
                                    Delete
                                  </button>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="comment-empty">
                      {t("No comments yet. Be the first to add one.")}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : seriesItem ? (
          <div className="reader-text-body reader-text-theme-paper">
            <h2>No published chapter yet</h2>
            <p>This series detail loaded, but there is no published chapter to show in the second half yet.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
