import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import BottomNav from "../components/layout/BottomNav";
import Header from "../components/layout/Header";
import { getCreatorProfile, getUserAccount, readFileAsDataUrl } from "../lib/account";
import { getStoredList, setStoredList } from "../lib/storage";
import { fetchEditableSeriesDirect, updateEditableSeriesDirect } from "../lib/backend";
import { useBodyPage } from "../lib/useBodyPage";
import "../styles/legacy/series-editor.css";

function createEpisode(seed = {}) {
  return {
    ...seed,
    title: seed.title || "",
    free: seed.free !== false,
    body: seed.body || seed.notes || "",
    notes: seed.notes || seed.body || ""
  };
}

export default function SeriesEditorPage() {
  useBodyPage("series-editor");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userAccount = useMemo(() => getUserAccount(), []);
  const creatorProfile = useMemo(() => getCreatorProfile(), []);
  const slug = searchParams.get("series");
  const allSeries = getStoredList("toouLocalSeries");
  const initialSeries = allSeries.find((item) => item.slug === slug) || null;
  const [currentSeries, setCurrentSeries] = useState(
    initialSeries
      ? {
          ...initialSeries,
          episodes: (initialSeries.episodes || []).map((episode) => createEpisode(episode))
        }
      : null
  );
  const [expandedChapterIndex, setExpandedChapterIndex] = useState(0);
  const [saveMessage, setSaveMessage] = useState("");
  const [loadingSeries, setLoadingSeries] = useState(!initialSeries);
  const chapterNoun = currentSeries?.type === "novel" ? "Chapter" : "Episode";

  useEffect(() => {
    let cancelled = false;

    async function loadSeries() {
      if (initialSeries || !slug || !userAccount?.supabaseUserId) {
        setLoadingSeries(false);
        return;
      }

      try {
        const remoteSeries = await fetchEditableSeriesDirect(slug, userAccount.supabaseUserId);
        if (!cancelled) {
          setCurrentSeries(
            remoteSeries
              ? {
                  ...remoteSeries,
                  episodes: (remoteSeries.episodes || []).map((episode) => createEpisode(episode))
                }
              : null
          );
        }
      } catch (error) {
        console.error("Failed to load editable series:", error);
      } finally {
        if (!cancelled) setLoadingSeries(false);
      }
    }

    loadSeries();
    return () => {
      cancelled = true;
    };
  }, [initialSeries, slug, userAccount?.supabaseUserId]);

  if (!userAccount) return <Navigate to="/signup" replace />;
  if (!creatorProfile) return <Navigate to="/signup?view=signup&role=creator" replace />;
  if (loadingSeries) return <div className="series-editor-shell">Loading content...</div>;
  if (!currentSeries) return <Navigate to="/creator-dashboard" replace />;

  async function handleImage(event, field) {
    const preview = await readFileAsDataUrl(event.target.files?.[0], "");
    if (!preview) return;
    setCurrentSeries((current) => ({ ...current, [field]: preview }));
  }

  function updateEpisode(index, patch) {
    setCurrentSeries((current) => ({
      ...current,
      episodes: current.episodes.map((episode, episodeIndex) =>
        episodeIndex === index ? { ...episode, ...patch } : episode
      )
    }));
  }

  async function saveSeries(event) {
    event.preventDefault();

    try {
      await updateEditableSeriesDirect(currentSeries);
      const nextSeries = allSeries.some((item) => item.slug === currentSeries.slug)
        ? allSeries.map((item) => (item.slug === currentSeries.slug ? currentSeries : item))
        : [currentSeries, ...allSeries];
      setStoredList("toouLocalSeries", nextSeries);
      setSaveMessage(`${currentSeries.title} saved successfully.`);
      window.setTimeout(() => setSaveMessage(""), 1800);
    } catch (error) {
      console.error(error);
      setSaveMessage(`Could not save changes: ${error.message || error}`);
      window.setTimeout(() => setSaveMessage(""), 2600);
    }
  }

  return (
    <>
      <Header />
      <main className="series-editor-shell">
        <section className="series-editor-hero">
          <Link to="/creator-dashboard" className="hero-back-link" aria-label="Go back">
            <i className="fa-solid fa-arrow-left" />
          </Link>
          <div className={`save-flash ${saveMessage ? "active" : ""}`}>{saveMessage || "Series changes saved."}</div>
          <div className="editor-kicker">Series Editor</div>
          <h1>{`Edit ${currentSeries.title}.`}</h1>
          <p>
            {`Update this published ${currentSeries.type}, manage ${chapterNoun.toLowerCase()}s, and save changes directly into your creator catalog.`}
          </p>
        </section>

        <section className="series-editor-layout">
          <form className="editor-form" onSubmit={saveSeries}>
            <section className="editor-panel">
              <div className="panel-head">
                <div>
                  <div className="panel-kicker">Series</div>
                  <h2>Series details</h2>
                </div>
              </div>

              <div className="editor-grid">
                <label className="editor-field editor-field-wide">
                  <span>Cover Image</span>
                  <div className="editor-upload-card">
                    <img className="editor-upload-preview editor-cover-preview" src={currentSeries.image || "/images/image1.png"} alt="Series cover preview" />
                    <input type="file" accept="image/*" onChange={(event) => handleImage(event, "image")} />
                    <small>Update the main series cover used on cards and listing rails.</small>
                  </div>
                </label>
                <label className="editor-field editor-field-wide">
                  <span>Detail Hero Image</span>
                  <div className="editor-upload-card">
                    <div
                      className="editor-upload-preview editor-detail-preview"
                      style={{
                        backgroundImage: `linear-gradient(135deg, rgba(107, 70, 193, 0.24), rgba(73, 199, 255, 0.2)), url("${currentSeries.detailImage || currentSeries.image || "/images/image1.png"}")`
                      }}
                    />
                    <input type="file" accept="image/*" onChange={(event) => handleImage(event, "detailImage")} />
                    <small>Upload the larger hero image shown at the top of the detail page.</small>
                  </div>
                </label>
                <label className="editor-field">
                  <span>Series Title</span>
                  <input type="text" required value={currentSeries.title} onChange={(event) => setCurrentSeries((current) => ({ ...current, title: event.target.value }))} />
                </label>
                <label className="editor-field">
                  <span>Genre</span>
                  <select value={currentSeries.genre || "Fantasy"} onChange={(event) => setCurrentSeries((current) => ({ ...current, genre: event.target.value }))}>
                    {["Fantasy", "Action", "Romance", "Mystery", "Knowledge", "Drama", "Horror", "Comedy"].map((option) => <option key={option}>{option}</option>)}
                  </select>
                </label>
                <label className="editor-field">
                  <span>Audience</span>
                  <select value={currentSeries.audience || "General"} onChange={(event) => setCurrentSeries((current) => ({ ...current, audience: event.target.value }))}>
                    {["General", "Teen", "Mature"].map((option) => <option key={option}>{option}</option>)}
                  </select>
                </label>
                <label className="editor-field editor-field-wide">
                  <span>Synopsis</span>
                  <textarea rows="4" value={currentSeries.synopsis || ""} onChange={(event) => setCurrentSeries((current) => ({ ...current, synopsis: event.target.value }))} />
                </label>
              </div>
            </section>

            <section className="editor-panel">
              <div className="panel-head">
                <div>
                  <div className="panel-kicker">Chapters</div>
                  <h2>{`Manage ${chapterNoun.toLowerCase()}s`}</h2>
                </div>
                <button
                  type="button"
                  className="panel-action"
                  onClick={() =>
                    setCurrentSeries((current) => ({
                      ...current,
                      episodes: [
                        ...current.episodes,
                        createEpisode({
                          id: `${current.slug}-${Date.now()}`,
                          title: `${chapterNoun} ${current.episodes.length + 1}`
                        })
                      ]
                    }))
                  }
                >
                  + Add Chapter
                </button>
              </div>
              <div className="chapter-helper">Open the chapter you want to edit, update it, then save from the top of the page.</div>
              <div className="chapter-list">
                {currentSeries.episodes.map((episode, index) => {
                  const previewText = (episode.body || episode.notes || "No content yet.")
                    .replace(/\s+/g, " ")
                    .trim()
                    .slice(0, 120);

                  return (
                    <article className={`chapter-card ${expandedChapterIndex === index ? "expanded" : ""}`} key={episode.id || index}>
                      <div className="chapter-head">
                        <div className="chapter-summary">
                          <span className="chapter-index-badge">{`${chapterNoun} ${index + 1}`}</span>
                          <div className="chapter-summary-copy">
                            <h3>{episode.title || `${chapterNoun} ${index + 1}`}</h3>
                            <p>{previewText}</p>
                          </div>
                        </div>
                        <div className="chapter-head-actions">
                          <button type="button" className="chapter-toggle" onClick={() => setExpandedChapterIndex((current) => (current === index ? -1 : index))}>
                            {expandedChapterIndex === index ? "Hide" : "Edit"}
                          </button>
                          <button
                            type="button"
                            className="chapter-delete"
                            onClick={() =>
                              setCurrentSeries((current) => ({
                                ...current,
                                episodes: current.episodes.filter((_, episodeIndex) => episodeIndex !== index)
                              }))
                            }
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <div className="chapter-body-wrap">
                        <div className="chapter-grid">
                          <label className="chapter-field">
                            <span>{`${chapterNoun} Title`}</span>
                            <input type="text" value={episode.title || ""} onChange={(event) => updateEpisode(index, { title: event.target.value })} />
                          </label>
                          <label className="chapter-field">
                            <span>Access</span>
                            <select value={episode.free === false ? "premium" : "free"} onChange={(event) => updateEpisode(index, { free: event.target.value !== "premium" })}>
                              <option value="free">Free</option>
                              <option value="premium">Premium</option>
                            </select>
                          </label>
                          <label className="chapter-field chapter-field-wide">
                            <span>{currentSeries.type === "novel" || currentSeries.type === "knowledge" ? "Body" : "Notes"}</span>
                            <textarea rows="8" value={episode.body || episode.notes || ""} onChange={(event) => updateEpisode(index, { body: event.target.value, notes: event.target.value })} />
                          </label>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            <div className="editor-actions">
              <button
                type="button"
                className="editor-btn secondary"
                onClick={() => {
                  setStoredList(
                    "toouLocalSeries",
                    allSeries.filter((item) => item.slug !== currentSeries.slug)
                  );
                  navigate("/creator-dashboard");
                }}
              >
                Delete Series
              </button>
              <button type="submit" className="editor-btn primary">Save Changes</button>
            </div>
          </form>

          <aside className="editor-sidebar">
            <section className="editor-side-panel">
              <h2>Suggestion</h2>
              <p>The cleanest structure for your app is:</p>
              <ul>
                <li>Create the series first</li>
                <li>Save its title, genre, cover, and synopsis</li>
                <li>Manage chapters and episodes separately after that</li>
              </ul>
            </section>

            <section className="editor-side-panel accent">
              <h2>Why this works better</h2>
              <p>
                It keeps your published series stable while still letting creators freely add, remove, and edit chapters later.
              </p>
            </section>
          </aside>
        </section>
      </main>
      <BottomNav />
    </>
  );
}
