import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import BottomNav from "../components/layout/BottomNav";
import Header from "../components/layout/Header";
import {
  getAllCommunityPosts,
  getRelativeLabel,
  getSupportLevelForUser,
  getUserMeta,
  updateCommunityPost
} from "../lib/communityData";
import { getUserAccount } from "../lib/account";
import { getSeriesBySlug } from "../lib/toouData";
import { useBodyPage } from "../lib/useBodyPage";
import "../styles/legacy/community-discussion.css";

export default function CommunityDiscussionPage() {
  useBodyPage("community-discussion");
  const userAccount = getUserAccount();
  const [searchParams] = useSearchParams();
  const postId = searchParams.get("post");
  const [renderTick, setRenderTick] = useState(0);
  const [replyBody, setReplyBody] = useState("");
  const [editingId, setEditingId] = useState("");
  const [message, setMessage] = useState(
    userAccount ? `Replying as ${userAccount.username || "Reader"}.` : "Create an account first to join this discussion."
  );

  const post = useMemo(
    () => getAllCommunityPosts().find((item) => item.id === postId) || null,
    [postId, renderTick]
  );
  const series = getSeriesBySlug(post?.slug);
  const postMeta = post ? getUserMeta(post.user, post.avatar, post.badge, post.level, post.createdAt) : null;

  function refresh() {
    setRenderTick((value) => value + 1);
  }

  function canManage(comment) {
    return Boolean(userAccount && (comment.author || comment.user) === (userAccount.username || "TooU Reader"));
  }

  function submitReply(event) {
    event.preventDefault();
    if (!userAccount) return;
    const body = replyBody.trim();
    if (!body) {
      setMessage("Write a reply first.");
      return;
    }

    updateCommunityPost(postId, (currentPost) => {
      const nextComments = [...(currentPost.comments || [])];
      if (editingId) {
        return {
          ...currentPost,
          comments: nextComments.map((comment) =>
            comment.id === editingId
              ? { ...comment, body, editedAt: Date.now(), time: "just now" }
              : comment
          )
        };
      }

      return {
        ...currentPost,
        comments: [
          ...nextComments,
          {
            id: `reply-${Date.now()}`,
            user: userAccount.username || "TooU Reader",
            author: userAccount.username || "TooU Reader",
            avatar: userAccount.avatar || "/images/image1.png",
            body,
            badge: "First Voice",
            level: getSupportLevelForUser(userAccount.username || "TooU Reader"),
            time: "just now",
            createdAt: Date.now()
          }
        ]
      };
    });

    setReplyBody("");
    setEditingId("");
    setMessage(`Replying as ${userAccount.username || "Reader"}.`);
    refresh();
  }

  if (!post) {
    return (
      <>
        <Header />
        <main className="discussion-shell">
          <section className="discussion-comments">
            <div className="discussion-empty">Discussion not found.</div>
          </section>
        </main>
        <BottomNav />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="container">
        <main className="discussion-shell">
          <Link to="/community" className="page-back-link"><i className="fa-solid fa-arrow-left" />Back to Community</Link>
          <section className="discussion-hero">
            <div className="discussion-kicker">Community Discussion</div>
            <h1>{post.discussionTitle}</h1>
            <p>{post.body}</p>
            <div className="discussion-post-card">
              <div className="discussion-user">
                <img className="discussion-avatar" src={postMeta.avatar} alt={post.user} />
                <div>
                  <strong>{post.user}</strong>
                  <div className="discussion-user-meta">
                    <span className="discussion-meta-chip">{postMeta.activityBadge}</span>
                    <span className="discussion-meta-chip">{postMeta.supportLevel}</span>
                  </div>
                  <div className="discussion-item-meta">{post.time || getRelativeLabel(post.createdAt)}</div>
                </div>
              </div>
              <Link className="discussion-series-link" to={series ? `/detail?series=${series.slug}` : "/detail"}>
                <img src={series?.image || "/images/image1.png"} alt={post.seriesTitle} />
                <div>
                  <small>{post.genre}</small>
                  <h3 style={{ marginTop: 6 }}>{post.seriesTitle}</h3>
                  <p style={{ marginTop: 8, color: "#706882", lineHeight: 1.6 }}>{post.caption}</p>
                </div>
              </Link>
            </div>
          </section>

          <section className="discussion-comments">
            <div className="discussion-comments-head">
              <h2>Discussion Replies</h2>
              <p>Edit or remove your own replies anytime.</p>
            </div>
            <form className="discussion-compose" onSubmit={submitReply}>
              {userAccount ? (
                <>
                  <textarea placeholder="Add your reply to this topic." value={replyBody} onChange={(event) => setReplyBody(event.target.value)} />
                  <div className="discussion-compose-row">
                    <span className="discussion-compose-message">{message}</span>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button type="button" className={`discussion-btn secondary ${editingId ? "" : "hidden"}`} onClick={() => {
                        setEditingId("");
                        setReplyBody("");
                        setMessage(`Replying as ${userAccount.username || "Reader"}.`);
                      }}>
                        Cancel Edit
                      </button>
                      <button type="submit" className="discussion-btn">{editingId ? "Save Changes" : "Post Reply"}</button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="discussion-empty">Create an account first to join this discussion.</div>
              )}
            </form>
            <div className="discussion-thread">
              {(post.comments || []).length ? (
                post.comments.map((comment) => {
                  const commentMeta = getUserMeta(
                    comment.user,
                    comment.avatar,
                    comment.badge,
                    comment.level,
                    comment.createdAt
                  );
                  return (
                    <article className="discussion-item" key={comment.id}>
                      <img className="discussion-avatar" src={commentMeta.avatar} alt={comment.user} />
                      <div className="discussion-content">
                        <strong>{comment.user}</strong>
                        <div className="discussion-user-meta">
                          <span className="discussion-meta-chip">{commentMeta.activityBadge}</span>
                          <span className="discussion-meta-chip">{commentMeta.supportLevel}</span>
                        </div>
                        <p>{comment.body}</p>
                        <div className="discussion-item-meta-row">
                          <div className="discussion-item-meta">
                            {comment.time || getRelativeLabel(comment.createdAt)}
                            {comment.editedAt ? " · Edited" : ""}
                          </div>
                          {canManage(comment) ? (
                            <div className="discussion-item-actions">
                              <button type="button" onClick={() => {
                                setEditingId(comment.id);
                                setReplyBody(comment.body || "");
                                setMessage("Editing your reply.");
                                window.scrollTo({ top: 0, behavior: "smooth" });
                              }}>
                                Edit
                              </button>
                              <button type="button" onClick={() => {
                                updateCommunityPost(postId, (currentPost) => ({
                                  ...currentPost,
                                  comments: (currentPost.comments || []).filter((item) => item.id !== comment.id)
                                }));
                                refresh();
                              }}>
                                Delete
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="discussion-empty">No replies yet. Start the conversation here.</div>
              )}
            </div>
          </section>
        </main>
      </div>
      <BottomNav />
    </>
  );
}
