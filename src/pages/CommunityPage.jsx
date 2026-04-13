import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import BottomNav from "../components/layout/BottomNav";
import Header from "../components/layout/Header";
import {
  communityTags,
  getAllCommunityPosts,
  getRelativeLabel,
  getSeriesCardForPost,
  getSupportLevelForUser,
  getUserMeta,
  toggleStoredId,
  updateCommunityPost
} from "../lib/communityData";
import { getUserAccount } from "../lib/account";
import { getStoredList, setStoredList } from "../lib/storage";
import { getAllSeries } from "../lib/toouData";
import { useBodyPage } from "../lib/useBodyPage";
import "../styles/legacy/community.css";

export default function CommunityPage() {
  useBodyPage("community");
  const userAccount = getUserAccount();
  const allSeries = useMemo(() => getAllSeries(), []);
  const [seriesSlug, setSeriesSlug] = useState("");
  const [discussionTitle, setDiscussionTitle] = useState("");
  const [discussionBody, setDiscussionBody] = useState("");
  const [composerMessage, setComposerMessage] = useState(
    "Forward a series into the community feed so readers can discuss it together."
  );
  const [renderTick, setRenderTick] = useState(0);

  const posts = useMemo(() => getAllCommunityPosts(), [renderTick]);
  const likedPosts = new Set(getStoredList("toouCommunityLikedPosts"));
  const savedPosts = new Set(getStoredList("toouCommunitySavedPosts"));
  const savedDiscussionPosts = posts.filter((post) => savedPosts.has(post.id));

  function refreshFeed() {
    setRenderTick((value) => value + 1);
  }

  function submitDiscussion(event) {
    event.preventDefault();
    if (!userAccount) {
      setComposerMessage("Create an account first so your forwarded discussion can be posted.");
      return;
    }

    const series = allSeries.find((item) => item.slug === seriesSlug);
    if (!series) {
      setComposerMessage("Choose a series to forward into the community.");
      return;
    }

    const nextPost = {
      id: `community-local-${Date.now()}`,
      user: userAccount.username || "TooU Reader",
      badge: "Reader Forward",
      avatar: userAccount.avatar || "/images/image1.png",
      level: getSupportLevelForUser(userAccount.username || "TooU Reader"),
      time: "just now",
      createdAt: Date.now(),
      body: discussionBody.trim(),
      discussionTitle: discussionTitle.trim() || `Discussing ${series.title}`,
      seriesTitle: series.title,
      genre: series.genre || series.type,
      caption: `Forwarded from ${series.title}. Join the discussion and share your take.`,
      slug: series.slug,
      likes: 0,
      saves: 0,
      comments: []
    };

    setStoredList("toouCommunityPosts", [nextPost, ...getStoredList("toouCommunityPosts")]);
    setSeriesSlug("");
    setDiscussionTitle("");
    setDiscussionBody("");
    setComposerMessage("Your forwarded discussion is now live in the community feed.");
    refreshFeed();
  }

  function handleAction(postId, action) {
    if (action === "like") {
      const isLiked = toggleStoredId("toouCommunityLikedPosts", postId);
      updateCommunityPost(postId, (item) => ({
        ...item,
        likes: Math.max(0, Number(item.likes || 0) + (isLiked ? 1 : -1))
      }));
      refreshFeed();
      return;
    }

    const isSaved = toggleStoredId("toouCommunitySavedPosts", postId);
    updateCommunityPost(postId, (item) => ({
      ...item,
      saves: Math.max(0, Number(item.saves || 0) + (isSaved ? 1 : -1))
    }));
    refreshFeed();
  }

  return (
    <>
      <Header />
      <div className="container">
        <section className="community-hero">
          <div className="community-kicker">Community</div>
          <h1>Readers sharing what is worth your next tap.</h1>
          <p>
            See user recommendations, badges, and community reactions around webtoons, novels, comics, and knowledge titles.
          </p>
        </section>

        <section className="section">
          <div className="section-heading">
            <div>
              <div className="section-title">Recommended By Readers</div>
              <div className="section-copy">
                Users can recommend a series to others and spark discovery through likes, saves, and discussion-style interactions.
              </div>
            </div>
          </div>
          <form className="community-composer" onSubmit={submitDiscussion}>
            <div className="composer-grid">
              <label className="composer-field">
                <span>Forward a Series</span>
                <select required value={seriesSlug} onChange={(event) => setSeriesSlug(event.target.value)}>
                  <option value="">Choose a series</option>
                  {allSeries.map((series) => (
                    <option value={series.slug} key={series.slug}>{`${series.title} (${series.type})`}</option>
                  ))}
                </select>
              </label>
              <label className="composer-field">
                <span>Discussion Title</span>
                <input type="text" required placeholder="What should this discussion be called?" value={discussionTitle} onChange={(event) => setDiscussionTitle(event.target.value)} />
              </label>
              <label className="composer-field composer-field-wide">
                <span>Your Thoughts</span>
                <textarea rows="4" required placeholder="Tell the community why you are forwarding this series." value={discussionBody} onChange={(event) => setDiscussionBody(event.target.value)} />
              </label>
            </div>
            <div className="composer-actions">
              <p>{composerMessage}</p>
              <button type="submit" className="composer-btn">Forward to Community</button>
            </div>
          </form>

          <div className="community-feed">
            {posts.map((post) => {
              const meta = getUserMeta(post.user, post.avatar, post.badge, post.level, post.createdAt);
              const series = getSeriesCardForPost(post);
              return (
                <article className="community-post" key={post.id}>
                  <div className="post-head">
                    <img className="avatar" src={meta.avatar} alt={post.user} />
                    <div className="post-user">
                      <strong>{post.user}</strong>
                      <div className="post-user-meta">
                        <span className="user-meta-chip">{meta.activityBadge}</span>
                        <span className="user-meta-chip">{meta.supportLevel}</span>
                      </div>
                      <div className="post-meta">
                        <span>{post.time || getRelativeLabel(post.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="post-copy">
                    <strong>{post.discussionTitle}</strong>
                    <div style={{ marginTop: 6 }}>{post.body}</div>
                  </div>
                  <Link className="post-recommend" to={series ? `/detail?series=${series.slug}` : "/detail"}>
                    <img src={series?.image || "/images/image1.png"} alt={post.seriesTitle} />
                    <div>
                      <div className="recommend-genre">{post.genre}</div>
                      <div className="recommend-title">{post.seriesTitle}</div>
                      <div className="recommend-caption">{post.caption}</div>
                    </div>
                  </Link>
                  <div className="post-actions">
                    <button className={`post-action ${likedPosts.has(post.id) ? "active active-like" : ""}`} type="button" onClick={() => handleAction(post.id, "like")}>
                      <i className="fa-regular fa-heart" /> Like {post.likes || 0}
                    </button>
                    <button className={`post-action ${savedPosts.has(post.id) ? "active active-save" : ""}`} type="button" onClick={() => handleAction(post.id, "save")}>
                      <i className="fa-regular fa-bookmark" /> Save {post.saves || 0}
                    </button>
                    <Link className="post-action" to={`/community-discussion?post=${encodeURIComponent(post.id)}`}>
                      <i className="fa-regular fa-comment" /> Discuss {(post.comments || []).length}
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className={`section ${savedDiscussionPosts.length ? "" : "hidden"}`}>
          <div className="section-heading">
            <div>
              <div className="section-title">Saved Discussions</div>
              <div className="section-copy">
                Posts you saved will stay visible here so you can come back and continue the conversation.
              </div>
            </div>
          </div>
          <div className="saved-discussions">
            {savedDiscussionPosts.map((post) => (
              <Link className="saved-card saved-card-link" key={post.id} to={`/community-discussion?post=${encodeURIComponent(post.id)}`}>
                <div className="saved-card-top">
                  <div>
                    <h3>{post.discussionTitle}</h3>
                    <p>{`${post.seriesTitle} · ${post.genre}`}</p>
                  </div>
                  <span className="badge"><i className="fa-solid fa-bookmark" />Saved</span>
                </div>
                <div className="saved-card-meta">
                  <span>{post.likes || 0} likes</span>
                  <span>{(post.comments || []).length} replies</span>
                  <span>{post.time || getRelativeLabel(post.createdAt)}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="section">
          <div className="section-heading">
            <div className="section-title">Trending Tags</div>
          </div>
          <div className="tag-row">
            {communityTags.map((tag) => <div className="tag-pill" key={tag}>{tag}</div>)}
          </div>
        </section>
      </div>
      <BottomNav />
    </>
  );
}
