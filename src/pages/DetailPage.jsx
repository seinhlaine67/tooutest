import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import SeriesCard from "../components/shared/SeriesCard";
import {
  getStoredList,
  getStoredMap,
  setStoredList,
  setStoredMap
} from "../lib/storage";
import {
  getAllSeries,
  getCreatorById,
  getSeriesByCreator,
  getSeriesBySlug
} from "../lib/toouData";
import { useAppSettings } from "../lib/appSettings";
import { parseCompactCount } from "../lib/utils";
import "../styles/legacy/detail.css";

function formatCompactCount(value) {
  const number = Number(value) || 0;
  if (number >= 1000000) return `${(number / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
  if (number >= 1000) return `${(number / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(number);
}

function getUserAccount() {
  try {
    return JSON.parse(window.localStorage.getItem("toouUserAccount") || "null");
  } catch {
    return null;
  }
}

function getEpisodeCommentKey(seriesSlug, episodeId) {
  return `${seriesSlug}:${episodeId}`;
}

function getStoredEpisodeComments(seriesSlug, episodeId) {
  try {
    const commentMap = JSON.parse(window.localStorage.getItem("toouEpisodeComments") || "{}");
    return commentMap[getEpisodeCommentKey(seriesSlug, episodeId)] || [];
  } catch {
    return [];
  }
}

function saveStoredEpisodeComments(seriesSlug, episodeId, comments) {
  let commentMap = {};
  try {
    commentMap = JSON.parse(window.localStorage.getItem("toouEpisodeComments") || "{}");
  } catch {
    commentMap = {};
  }
  commentMap[getEpisodeCommentKey(seriesSlug, episodeId)] = comments;
  window.localStorage.setItem("toouEpisodeComments", JSON.stringify(commentMap));
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

export default function DetailPage() {
  const { t } = useAppSettings();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const readerRef = useRef(null);
  const [favoriteSeries, setFavoriteSeries] = useState(() => getStoredList("toouFavoriteSeries"));
  const [bookmarkedSeries, setBookmarkedSeries] = useState(() => getStoredList("toouBookmarkedSeries"));
  const [followedSeries, setFollowedSeries] = useState(() => getStoredList("toouFollowedSeries"));
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

  const seriesSlug = searchParams.get("series");
  const seriesItem = useMemo(() => getSeriesBySlug(seriesSlug), [seriesSlug]);
  const allSeries = useMemo(() => getAllSeries(), []);
  const creator = useMemo(() => getCreatorById(seriesItem.creatorId), [seriesItem.creatorId]);
  const episodes = seriesItem.episodes || [];
  const startEpisodeId = episodes[0]?.id || null;
  const activeEpisode = episodes.find((episode) => episode.id === activeEpisodeId) || episodes[0] || null;
  const userAccount = getUserAccount();

  useEffect(() => {
    window.localStorage.setItem("toouReaderFontSize", String(readerSettings.fontSize));
    window.localStorage.setItem("toouReaderTextTheme", readerSettings.theme);
  }, [readerSettings]);

  useEffect(() => {
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
  }, [seriesItem.id]);

  useEffect(() => {
    setActiveEpisodeId(startEpisodeId);
    setCurrentEpisodeFilter("all");
    setExpandedEpisodes(false);
    setReaderOpen(window.innerWidth >= 1024 && Boolean(startEpisodeId));
  }, [startEpisodeId, seriesItem.id]);

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

  const displayedSeriesLikes = Math.max(
    0,
    parseCompactCount(seriesItem.likes || "0") + Number(seriesLikeDeltas[seriesItem.id] || 0)
  );
  const displayedSeriesViews = Math.max(
    0,
    parseCompactCount(seriesItem.views || "0") + Number(seriesViewDeltas[seriesItem.id] || 0)
  );
  const seriesFollowerCount =
    parseCompactCount(seriesItem.followers || "0") +
    (followedSeries.includes(seriesItem.id) ? 1 : 0);
  const creatorFollowerCount =
    parseCompactCount(creator?.followers || "0") +
    (creator && followedCreators.includes(creator.id) ? 1 : 0);

  const filteredEpisodes = episodes.filter((episode) => {
    if (currentEpisodeFilter === "free") return episode.free;
    if (currentEpisodeFilter === "premium") return !episode.free;
    return true;
  });
  const visibleEpisodes = expandedEpisodes ? filteredEpisodes : filteredEpisodes.slice(0, 6);

  const mergedComments = useMemo(() => {
    if (!activeEpisode) return [];

    return [
      ...(activeEpisode.comments || []).map((comment, index) => ({
        ...comment,
        id: comment.id || `seed-${index}`,
        author: comment.author || comment.user || "",
        source: "seed"
      })),
      ...getStoredEpisodeComments(seriesItem.slug, activeEpisode.id).map((comment) => ({
        ...comment,
        source: "local"
      }))
    ];
  }, [activeEpisode, seriesItem.slug, editingCommentId, commentInput]);

  const recommendations = useMemo(() => {
    const sameCreator = getSeriesByCreator(seriesItem.creatorId).filter(
      (item) => item.slug !== seriesItem.slug
    );
    const otherSeries = allSeries.filter(
      (item) => item.slug !== seriesItem.slug && item.creatorId !== seriesItem.creatorId
    );
    return [...sameCreator.slice(0, 1), ...otherSeries.slice(0, 2)];
  }, [seriesItem.creatorId, seriesItem.slug]);

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

  function handleToggleEpisodeLike() {
    if (!activeEpisode) return;

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
  }

  function handleCommentSubmit(event) {
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

    const storedComments = getStoredEpisodeComments(seriesItem.slug, activeEpisode.id);

    if (editingCommentId) {
      saveStoredEpisodeComments(
        seriesItem.slug,
        activeEpisode.id,
        storedComments.map((comment) =>
          comment.id === editingCommentId
            ? { ...comment, body: nextBody, time: "Just now", editedAt: Date.now() }
            : comment
        )
      );
    } else {
      saveStoredEpisodeComments(seriesItem.slug, activeEpisode.id, [
        ...storedComments,
        {
          id: `episode-comment-${Date.now()}`,
          user: userAccount.username || "Reader",
          author: userAccount.username || "Reader",
          avatar: userAccount.avatar || "/images/image1.png",
          badge: "💬 First Voice",
          level: "🥚 Egg Starter",
          body: nextBody,
          time: "Just now",
          createdAt: Date.now()
        }
      ]);
    }

    setCommentInput("");
    setEditingCommentId("");
    setCommentMessage("");
  }

  function handleEditComment(comment) {
    setEditingCommentId(comment.id);
    setCommentInput(comment.body || "");
    setCommentMessage("Editing your comment.");
  }

  function handleDeleteComment(commentId) {
    if (!activeEpisode) return;
    const storedComments = getStoredEpisodeComments(seriesItem.slug, activeEpisode.id);
    saveStoredEpisodeComments(
      seriesItem.slug,
      activeEpisode.id,
      storedComments.filter((comment) => comment.id !== commentId)
    );
    setEditingCommentId("");
    setCommentInput("");
    setCommentMessage("");
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
            <div className="stats">
              {formatCompactCount(displayedSeriesViews)} views ·{" "}
              {formatCompactCount(displayedSeriesLikes)} likes ·{" "}
              {formatCompactCount(seriesFollowerCount)} followers
            </div>
            <div className="creator-follow-link">
              <span>{formatCompactCount(creatorFollowerCount)} followers</span>
              <button
                type="button"
                className={followedCreators.includes(creator?.id) ? "active-following" : ""}
                onClick={() => {
                  if (!creator) return;
                  const isFollowing = followedCreators.includes(creator.id);
                  const next = isFollowing
                    ? followedCreators.filter((item) => item !== creator.id)
                    : [...followedCreators, creator.id];
                  persistList("toouFollowedCreators", next, setFollowedCreators);
                }}
              >
                {followedCreators.includes(creator?.id) ? t("Following") : t("Follow Creator")}
              </button>
            </div>
          </div>
        </div>

        <div className="content">
          <div className="buttons">
            <button
              className={`bookmark-series-btn ${
                bookmarkedSeries.includes(seriesItem.id) ? "active-bookmark" : ""
              }`}
              type="button"
              onClick={() => {
                const isBookmarked = bookmarkedSeries.includes(seriesItem.id);
                const next = isBookmarked
                  ? bookmarkedSeries.filter((item) => item !== seriesItem.id)
                  : [...bookmarkedSeries, seriesItem.id];
                persistList("toouBookmarkedSeries", next, setBookmarkedSeries);
              }}
            >
              <i className="fa-solid fa-bookmark" />
            </button>
            <button
              className={`like-btn favorite-series-btn ${
                favoriteSeries.includes(seriesItem.id) ? "active-favorite" : ""
              }`}
              type="button"
              onClick={() => {
                const isFavorite = favoriteSeries.includes(seriesItem.id);
                const next = isFavorite
                  ? favoriteSeries.filter((item) => item !== seriesItem.id)
                  : [...favoriteSeries, seriesItem.id];
                persistList("toouFavoriteSeries", next, setFavoriteSeries);
              }}
            >
              <i className="fa-solid fa-heart" />
            </button>
            <button
              className="read-btn"
              type="button"
              onClick={() => startEpisodeId && handleOpenEpisode(startEpisodeId)}
            >
              {t("Start Reading")}
            </button>
            <button
              type="button"
              className={`follow-series-btn ${
                followedSeries.includes(seriesItem.id) ? "active-following" : ""
              }`}
              onClick={() => {
                const isFollowing = followedSeries.includes(seriesItem.id);
                const next = isFollowing
                  ? followedSeries.filter((item) => item !== seriesItem.id)
                  : [...followedSeries, seriesItem.id];
                persistList("toouFollowedSeries", next, setFollowedSeries);
              }}
            >
              {followedSeries.includes(seriesItem.id) ? t("Following") : t("Follow")}
            </button>
          </div>

          <div>
            {(seriesItem.hashtags || []).map((tag) => (
              <span className="tag-pill" key={tag}>
                #{tag}
              </span>
            ))}
          </div>

          <div className="section-title">{t("Synopsis")}</div>
          <div className="synopsis">{seriesItem.synopsis}</div>

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
          <div className="recommend">
            {recommendations.map((item) => (
              <SeriesCard key={item.id} item={item} className="recommend-link card-link" />
            ))}
          </div>
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
                >
                  {likedEpisodes.includes(getEpisodeLikeStorageKey(activeEpisode.id))
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
                      const canManage =
                        userAccount &&
                        comment.source === "local" &&
                        comment.author === (userAccount.username || "Reader");

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
        ) : null}
      </div>
    </div>
  );
}
