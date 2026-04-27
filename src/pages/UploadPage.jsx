import { useMemo, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import BottomNav from "../components/layout/BottomNav";
import Header from "../components/layout/Header";
import LoadingSpinner from "../components/shared/LoadingSpinner";
import { getCreatorProfile, getUserAccount, readFileAsDataUrl } from "../lib/account";
import { getStoredList } from "../lib/storage";
import { publishSeries } from "../lib/creatorBackend";
import { useBodyPage } from "../lib/useBodyPage";
import RichTextEditor from "../components/editor/RichTextEditor";
import "../styles/legacy/upload.css";

const contentGuides = {
  webtoon: {
    heading: "Episode Builder",
    description:
      "For webtoon and comics, creators usually upload a vertical stack of episode images plus a thumbnail. This builder keeps that flow.",
    seriesTitleLabel: "Series Title",
    seriesTitlePlaceholder: "Enter the webtoon title",
    synopsisLabel: "Synopsis",
    synopsisPlaceholder:
      "Write a short synopsis that introduces the webtoon and hooks the reader.",
    episodeTitleLabel: "Episode Title",
    episodeTitlePlaceholder: "Episode title",
    chapterBodyLabel: "Episode Script",
    chapterBodyPlaceholder:
      "If you need notes for panel planning, draft the episode script here before uploading visual assets.",
    notesLabel: "Episode Notes",
    notesPlaceholder: "Optional teaser, editor note, or reading note.",
    writingNote: "",
    hint:
      "Webtoon creators typically publish a portrait cover, an episode thumbnail, and a long sequence of vertically stacked images for each episode.",
    list: [
      "Upload a cover, synopsis, hashtags, and episode metadata first.",
      "Use vertical image episodes for webtoon and comics.",
      "Keep each image sharp and easy to read on mobile."
    ],
    builder: "visual",
    episodeNoun: "Episode"
  },
  comics: {
    heading: "Issue Builder",
    description:
      "Comics creators often upload sequential page images, cover art, and optional bonus previews for each issue.",
    seriesTitleLabel: "Series Title",
    seriesTitlePlaceholder: "Enter the comic title",
    synopsisLabel: "Synopsis",
    synopsisPlaceholder:
      "Write a short synopsis that frames the comic world and main hook.",
    episodeTitleLabel: "Issue Title",
    episodeTitlePlaceholder: "Issue title",
    chapterBodyLabel: "Issue Script",
    chapterBodyPlaceholder:
      "Use this as a writing scratchpad for issue pacing or dialog if needed.",
    notesLabel: "Issue Notes",
    notesPlaceholder: "Optional teaser, editor note, or reading note.",
    writingNote: "",
    hint:
      "Comic uploads usually include a cover, a thumbnail, and either full page images or a packaged ZIP of sequential pages.",
    list: [
      "Upload page images in reading order.",
      "Use a thumbnail so each issue looks polished in listings.",
      "Reserve premium issues for paid drops if needed."
    ],
    builder: "visual",
    episodeNoun: "Issue"
  },
  knowledge: {
    heading: "Lesson Builder",
    description:
      "Knowledge content works best as structured text chapters with optional cover assets and concise episode notes.",
    seriesTitleLabel: "Series Title",
    seriesTitlePlaceholder: "Enter the lesson series title",
    synopsisLabel: "Learning Summary",
    synopsisPlaceholder:
      "Write a clear summary that explains what readers will learn from this series.",
    episodeTitleLabel: "Lesson Title",
    episodeTitlePlaceholder: "Lesson title",
    chapterBodyLabel: "Lesson Body",
    chapterBodyPlaceholder:
      "Write the full lesson here. Use short paragraphs, clear headings, and a mobile-friendly rhythm.",
    notesLabel: "Lesson Notes",
    notesPlaceholder: "Optional takeaway, practice prompt, or reading note.",
    writingNote:
      "Writing mode is active. This layout is tuned for text-first publishing so knowledge creators can draft directly inside TooU before publishing.",
    hint:
      "Knowledge creators usually publish a cover, a learning-focused synopsis, and text-based lessons or chapters that readers can scan easily.",
    list: [
      "Organize chapters by topic or lesson.",
      "Use clear headings and concise explanations.",
      "Keep notes focused on takeaways or resources."
    ],
    builder: "text",
    episodeNoun: "Lesson"
  },
  novel: {
    heading: "Chapter Builder",
    description:
      "Novel creators usually draft text chapters directly, then control free and premium access chapter by chapter.",
    seriesTitleLabel: "Novel Title",
    seriesTitlePlaceholder: "Enter the novel title",
    synopsisLabel: "Story Summary",
    synopsisPlaceholder:
      "Write a compelling novel summary that introduces the world, conflict, and emotional hook.",
    episodeTitleLabel: "Chapter Title",
    episodeTitlePlaceholder: "Chapter title",
    chapterBodyLabel: "Chapter Body",
    chapterBodyPlaceholder:
      "Write the chapter here. This writing space is meant to feel calm, long-form, and comfortable for focused drafting.",
    notesLabel: "Author Notes",
    notesPlaceholder: "Optional teaser, author note, or reading note.",
    writingNote:
      "Writing mode is active. Novel publishing uses a larger drafting surface so creators can write directly on the platform before publishing.",
    hint:
      "Novel uploads usually include a cover, synopsis, tags, and text chapters written directly in the editor.",
    list: [
      "Write chapters directly in the editor.",
      "Use notes for teasers or author updates.",
      "Choose free or premium for each chapter strategy."
    ],
    builder: "text",
    episodeNoun: "Chapter"
  }
};

const genreOptions = ["Fantasy", "Action", "Romance", "Mystery", "Knowledge", "Drama"];

function slugify(value) {
  return String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .trim()
    .replace(/[^\p{Letter}\p{Number}\s-]+/gu, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toIsoFromLocalInput(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function toLocalInputValue(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60000);
  return localDate.toISOString().slice(0, 16);
}

function createEpisodeSeed(seed = {}) {
  return {
    title: seed.title || "",
    release: seed.release || "publish-now",
    access: seed.free === false ? "premium" : "free",
    scheduledAt: toLocalInputValue(seed.scheduledAt || seed.scheduledFor || ""),
    notes: seed.notes || "",
    body: seed.body || "",
    thumbnail: "",
    panels: [],
    customizedAccess: false
  };
}

function wrapSelection(textarea, prefix, suffix = prefix, placeholder = "text") {
  if (!textarea) return null;
  const start = textarea.selectionStart ?? 0;
  const end = textarea.selectionEnd ?? 0;
  const value = textarea.value || "";
  const selected = value.slice(start, end) || placeholder;
  const nextValue = `${value.slice(0, start)}${prefix}${selected}${suffix}${value.slice(end)}`;
  const selectionStart = start + prefix.length;
  const selectionEnd = selectionStart + selected.length;
  return { nextValue, selectionStart, selectionEnd };
}

export default function UploadPage() {
  useBodyPage("upload");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userAccount = useMemo(() => getUserAccount(), []);
  const creatorProfile = useMemo(() => getCreatorProfile(), []);
  const editSlug = searchParams.get("edit");
  const existingEditableSeries = useMemo(
    () => getStoredList("toouLocalSeries").find((item) => item.slug === editSlug) || null,
    [editSlug]
  );

  if (!userAccount) return <Navigate to="/signup" replace />;
  if (!creatorProfile) return <Navigate to="/signup?view=signup&role=creator" replace />;

  const initialType = existingEditableSeries?.type || creatorProfile?.primaryFormat || "webtoon";
  const [currentStep, setCurrentStep] = useState(1);
  const [currentType, setCurrentType] = useState(initialType);
  const [builderMode, setBuilderMode] = useState(contentGuides[initialType].builder);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareasRef = useRef({});
  const [coverImagePreview, setCoverImagePreview] = useState(existingEditableSeries?.image || "");
  const [detailHeroPreview, setDetailHeroPreview] = useState(existingEditableSeries?.detailImage || "");
  const [formState, setFormState] = useState(() => ({
    seriesTitle: existingEditableSeries?.title || "",
    authorName:
      existingEditableSeries?.creatorName ||
      creatorProfile.displayName ||
      creatorProfile.studioName ||
      userAccount.username ||
      "",
    seriesSynopsis: existingEditableSeries?.synopsis || "",
    hashtags: (existingEditableSeries?.hashtags || []).map((tag) => `#${tag}`).join(" "),
    genres: Array.isArray(existingEditableSeries?.genre)
      ? existingEditableSeries.genre
      : existingEditableSeries?.genre
        ? [existingEditableSeries.genre]
        : ["Fantasy"],
    audience: existingEditableSeries?.audience || "General",
    access:
      existingEditableSeries?.episodes?.some((item) => item.free === false)
        ? "premium"
        : "free",
    coverImage: "",
    detailImage: ""
  }));
  const [episodes, setEpisodes] = useState(() =>
    existingEditableSeries?.episodes?.length
      ? existingEditableSeries.episodes.map((episode) => createEpisodeSeed(episode))
      : [createEpisodeSeed()]
  );

  const config = contentGuides[currentType];

  function updateForm(name, value) {
    setFormState((current) => ({ ...current, [name]: value }));
  }

  function toggleGenre(genre) {
    setFormState((current) => {
      const nextGenres = current.genres.includes(genre)
        ? current.genres.filter((item) => item !== genre)
        : [...current.genres, genre];

      return {
        ...current,
        genres: nextGenres.length ? nextGenres : [genre]
      };
    });
  }

  function updateEpisode(index, patch) {
    setEpisodes((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item))
    );
  }

  function handleTypeChange(type) {
    setCurrentType(type);
    setBuilderMode(contentGuides[type].builder);
    setEpisodes([createEpisodeSeed()]);
  }

  function addEpisode(seed = null) {
    setEpisodes((current) => [...current, seed || createEpisodeSeed()]);
  }

  function duplicateEpisode(index) {
    setEpisodes((current) => [...current, { ...current[index] }]);
  }

  function removeEpisode(index) {
    setEpisodes((current) => (current.length === 1 ? current : current.filter((_, i) => i !== index)));
  }

  function formatEpisodeBody(index, type) {
    const textarea = textareasRef.current[index];
    if (!textarea) return;

    const patterns = {
      bold: ["**", "**", "bold text"],
      italic: ["*", "*", "italic text"],
      heading: ["## ", "", "Section heading"],
      quote: ["> ", "", "Quoted text"],
      code: ["`", "`", "inline code"]
    };
    const pattern = patterns[type];
    if (!pattern) return;

    const next = wrapSelection(textarea, pattern[0], pattern[1], pattern[2]);
    if (!next) return;
    updateEpisode(index, { body: next.nextValue });

    requestAnimationFrame(() => {
      const current = textareasRef.current[index];
      if (!current) return;
      current.focus();
      current.setSelectionRange(next.selectionStart, next.selectionEnd);
    });
  }

  function validateStep(step) {
    if (step === 2) {
      return Boolean(
        formState.seriesTitle.trim() &&
          formState.authorName.trim() &&
          formState.seriesSynopsis.trim()
      );
    }
    if (step === 4) {
      return !episodes.some((episode) => {
        if (!episode.title.trim()) return true;
        if (episode.release === "schedule" && !episode.scheduledAt) return true;
        if (builderMode === "text" && !episode.body.trim()) return true;
        return false;
      });
    }
    return true;
  }

  async function handleImageChange(event, field) {
    const file = event.target.files?.[0];
    const preview = await readFileAsDataUrl(file, "");
    updateForm(field, preview);
    if (field === "coverImage") setCoverImagePreview(preview);
    if (field === "detailImage") setDetailHeroPreview(preview);
  }

  async function handleEpisodeThumbnail(index, file) {
    updateEpisode(index, { thumbnail: await readFileAsDataUrl(file, "") });
  }

  async function handleEpisodePanels(index, files) {
    const previews = await Promise.all(
      Array.from(files || []).map((file) => readFileAsDataUrl(file, ""))
    );
    updateEpisode(index, { panels: previews.filter(Boolean) });
  }

  async function buildPayload() {
    const creatorName =
      creatorProfile.displayName ||
      creatorProfile.studioName ||
      userAccount.username ||
      "TooU Creator";
    const localSeries = getStoredList("toouLocalSeries");
    const rawTitle = formState.seriesTitle.trim();
    const slugBase = slugify(rawTitle) || `series-${Date.now()}`;
    const slugExists = localSeries.some(
      (item) => item.slug === slugBase && item.slug !== editSlug
    );
    const seriesSlug = editSlug || (slugExists ? `${slugBase}-${Date.now()}` : slugBase);

    return {
      existingId: existingEditableSeries?.id || "",
      creatorName,
      creatorId: `creator-local-${slugify(creatorName)}`,
      title: rawTitle,
      slug: seriesSlug,
      type: currentType,
      genre: formState.genres,
      audience: formState.audience,
      synopsis: formState.seriesSynopsis.trim(),
      hashtags: formState.hashtags
        .split(/\s+/)
        .map((tag) => tag.replace(/^#/, "").trim())
        .filter(Boolean),
      image: formState.coverImage || existingEditableSeries?.image || "/images/image1.png",
      detailImage:
        formState.detailImage ||
        existingEditableSeries?.detailImage ||
        formState.coverImage ||
        "/images/image1.png",
      authorName: formState.authorName.trim(),
      access: formState.access,
      updatedAt: new Date().toISOString(),
      episodes: episodes.map((episode, index) => ({
        id: `${slugify(episode.title || `${config.episodeNoun}-${index + 1}`)}-${Date.now()}-${index}`,
        title: episode.title.trim() || `${config.episodeNoun} ${index + 1}`,
        free: episode.access !== "premium",
        views: "0",
        likes: "0",
        comments: [],
        notes: episode.notes.trim(),
        body: episode.body.trim(),
        thumbnail: episode.thumbnail,
        release: episode.release,
        publicationStatus:
          episode.release === "draft"
            ? "draft"
            : episode.release === "schedule"
              ? "scheduled"
              : "published",
        scheduledAt: episode.scheduledAt,
        scheduledFor:
          episode.release === "schedule" ? toIsoFromLocalInput(episode.scheduledAt) : "",
        publishedAt:
          episode.release === "publish-now" ? new Date().toISOString() : "",
        updatedAt: new Date().toISOString(),
        images:
          builderMode === "visual"
            ? episode.panels.length
              ? episode.panels
              : episode.thumbnail
                ? [episode.thumbnail]
                : []
            : []
      }))
    };
  }

  async function saveUpload() {
    const payload = await buildPayload();
    try {
      setIsSubmitting(true);
      const result = await publishSeries({
        creatorProfile,
        series: payload,
        episodes: payload.episodes
      });
      const hasPublishedEpisode = payload.episodes.some(
        (episode) => episode.publicationStatus === "published"
      );

      if (hasPublishedEpisode && result?.series?.id) {
        navigate(
          `/series/${encodeURIComponent(payload.slug)}?id=${encodeURIComponent(result.series.id)}`
        );
        return;
      }

      navigate("/creator-dashboard");
    } catch (error) {
      console.error(error);
      alert(`API Error: ${error.message || error.details || error}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  const previewPayload = useMemo(
    () => ({
      title: formState.seriesTitle,
      synopsis: formState.seriesSynopsis,
      type: currentType,
      genre: formState.genres.join(", "),
      genres: formState.genres,
      audience: formState.audience,
      authorName: formState.authorName,
      image:
        formState.coverImage ||
        existingEditableSeries?.image ||
        "/images/image1.png",
      hashtags: formState.hashtags
        .split(/\s+/)
        .map((tag) => tag.replace(/^#/, "").trim())
        .filter(Boolean),
      episodes
    }),
    [currentType, episodes, existingEditableSeries?.image, formState]
  );

  return (
    <>
      <Header />
      {isSubmitting ? (
        <LoadingSpinner
          fullScreen
          label="Uploading your story and syncing it with Supabase..."
        />
      ) : null}
      <main className="creator-shell">
        <section className="creator-hero">
          <Link to="/creator-dashboard" className="hero-back-link" aria-label="Go back">
            <i className="fa-solid fa-arrow-left" />
          </Link>
          <div className="creator-kicker">Creator Studio</div>
          <h1>
            {existingEditableSeries
              ? `Edit ${existingEditableSeries.title}.`
              : `Publish stories as ${
                  creatorProfile.displayName ||
                  creatorProfile.studioName ||
                  "your creator profile"
                }.`}
          </h1>
          <p>
            {existingEditableSeries
              ? "Update your existing series, change the chapter structure, and save the new version back into your creator catalog."
              : "Choose your content type, fill the overview, then build episodes as image-based webtoon releases or text-first chapters."}
          </p>
        </section>

        <section className="creator-layout">
          <div className="creator-main">
            <form
              className="upload-form"
              onSubmit={async (event) => {
                event.preventDefault();
                if (isSubmitting || !validateStep(currentStep)) return;
                await saveUpload();
              }}
            >
              <div className="upload-progress">
                <div className="progress-line">
                  <div className="progress-line-fill" style={{ width: `${(currentStep / 4) * 100}%` }} />
                </div>
                <div className="progress-steps">
                  {["Category", "Overview", "Setup", "Build"].map((label, index) => {
                    const step = index + 1;
                    return (
                      <button
                        type="button"
                        key={label}
                        className={`progress-step ${currentStep === step ? "active" : ""} ${currentStep > step ? "complete" : ""}`}
                        disabled={isSubmitting}
                        onClick={() => {
                          if (step <= currentStep) setCurrentStep(step);
                          else {
                            let canAdvance = true;
                            for (let i = currentStep; i < step; i += 1) {
                              if (!validateStep(i)) canAdvance = false;
                            }
                            if (canAdvance) setCurrentStep(step);
                          }
                        }}
                      >
                        <span className="step-dot">{step}</span>
                        <span className="step-label">{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <section className={`form-panel upload-step ${currentStep === 1 ? "active" : ""}`}>
                <div className="panel-heading">
                  <h2>Choose category</h2>
                  <p>Select what you are uploading right now. Your creator profile decides the default, but you can change it for each upload.</p>
                </div>
                <div className="type-picker">
                  {["webtoon", "comics", "knowledge", "novel"].map((type) => (
                    <button
                      type="button"
                      key={type}
                      className={`type-pill allowed ${currentType === type ? "active" : ""}`}
                      disabled={isSubmitting}
                      onClick={() => handleTypeChange(type)}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              </section>

              <section className={`form-panel upload-step ${currentStep === 2 ? "active" : ""}`}>
                <div className="panel-heading">
                  <h2>Series Overview</h2>
                  <p>Set the public-facing information readers will see before they open your story.</p>
                </div>
                <div className="field-grid">
                  <label className="field">
                    <span>{config.seriesTitleLabel}</span>
                    <input type="text" required placeholder={config.seriesTitlePlaceholder} value={formState.seriesTitle} onChange={(event) => updateForm("seriesTitle", event.target.value)} />
                  </label>
                  <label className="field">
                    <span>Author Name</span>
                    <input type="text" required placeholder="Pen name or studio name" value={formState.authorName} onChange={(event) => updateForm("authorName", event.target.value)} />
                  </label>
                  <label className="field field-full">
                    <span>Cover Image</span>
                    <div className="upload-drop">
                      <i className="fa-regular fa-image" />
                      <strong>Upload your cover</strong>
                      <small>Recommended portrait cover, 2:3 ratio. JPG, PNG, or WEBP.</small>
                      <input type="file" accept="image/*" onChange={(event) => handleImageChange(event, "coverImage")} />
                    </div>
                    {(coverImagePreview || existingEditableSeries?.image) ? (
                      <div className="upload-attachment">
                        <img src={coverImagePreview || existingEditableSeries?.image} alt="Cover preview" className="upload-attachment-thumb" />
                        <div className="upload-attachment-copy">
                          <strong>{coverImagePreview ? "Cover attached" : "Current image attached"}</strong>
                          <small>{coverImagePreview ? "The selected image will be saved with this upload." : "This is the image currently saved for this series."}</small>
                        </div>
                      </div>
                    ) : null}
                  </label>
                  <label className="field field-full">
                    <span>Detail Hero Image</span>
                    <div className="upload-drop">
                      <i className="fa-regular fa-image" />
                      <strong>Upload a wider image for the detail page</strong>
                      <small>This can be different from the cover image so your detail page hero looks better.</small>
                      <input type="file" accept="image/*" onChange={(event) => handleImageChange(event, "detailImage")} />
                    </div>
                    {(detailHeroPreview || existingEditableSeries?.detailImage) ? (
                      <div className="upload-attachment">
                        <img src={detailHeroPreview || existingEditableSeries?.detailImage} alt="Detail hero preview" className="upload-attachment-thumb" />
                        <div className="upload-attachment-copy">
                          <strong>{detailHeroPreview ? "Detail hero attached" : "Current image attached"}</strong>
                          <small>{detailHeroPreview ? "The selected image will be saved with this upload." : "This is the image currently saved for this series."}</small>
                        </div>
                      </div>
                    ) : null}
                  </label>
                  <label className="field field-full">
                    <span>{config.synopsisLabel}</span>
                    <textarea rows="5" required placeholder={config.synopsisPlaceholder} value={formState.seriesSynopsis} onChange={(event) => updateForm("seriesSynopsis", event.target.value)} />
                  </label>
                  <label className="field field-full">
                    <span>Hashtags</span>
                    <input type="text" placeholder="#fantasy #romance #schoollife" value={formState.hashtags} onChange={(event) => updateForm("hashtags", event.target.value)} />
                  </label>
                </div>
              </section>

              <section className={`form-panel upload-step ${currentStep === 3 ? "active" : ""}`}>
                <div className="panel-heading">
                  <h2>Publishing Setup</h2>
                  <p>Choose the format and monetization behavior for new episodes.</p>
                </div>
                <div className="field-grid">
                  <div className="field">
                    <span>Genres</span>
                    <div className="genre-chip-grid">
                      {genreOptions.map((item) => (
                        <button
                          key={item}
                          type="button"
                          className={`genre-chip ${formState.genres.includes(item) ? "active" : ""}`}
                          onClick={() => toggleGenre(item)}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                    <small className="field-hint">Choose one or more genres. Your backend stores this as a text array.</small>
                  </div>
                  <label className="field">
                    <span>Audience</span>
                    <select value={formState.audience} onChange={(event) => updateForm("audience", event.target.value)}>
                      {["General", "Teen", "Mature"].map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </label>
                  <div className="field field-full">
                    <span>Access Type</span>
                    <div className="toggle-group">
                      {[
                        ["free", "Free", "Anyone can read the episode right away."],
                        ["premium", "Premium", "Reserve the episode for paid access or unlock rules."]
                      ].map(([value, label, copy]) => (
                        <label className="toggle-card" key={value}>
                          <input
                            type="radio"
                            name="access"
                            value={value}
                            checked={formState.access === value}
                            onChange={(event) => {
                              updateForm("access", event.target.value);
                              setEpisodes((current) =>
                                current.map((item) =>
                                  item.customizedAccess
                                    ? item
                                    : { ...item, access: event.target.value }
                                )
                              );
                            }}
                          />
                          <span>{label}</span>
                          <small>{copy}</small>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              <section className={`form-panel upload-step ${currentStep === 4 ? "active" : ""}`}>
                <div className="panel-heading">
                  <h2>{config.heading}</h2>
                  <p>{config.description}</p>
                </div>
                {config.writingNote ? <div className="writing-mode-note">{config.writingNote}</div> : null}

                <div className="builder-switch">
                  {[
                    ["visual", "Image Episode", "Best for webtoon and comics releases"],
                    ["text", "Text Chapter", "Best for novel and knowledge publishing"]
                  ].map(([mode, title, copy]) => (
                    <div
                      key={mode}
                      className={`builder-card ${builderMode === mode ? "active" : ""} ${isSubmitting ? "disabled" : ""}`}
                      onClick={() => {
                        if (isSubmitting) return;
                        setBuilderMode(mode);
                      }}
                    >
                      <strong>{title}</strong>
                      <span>{copy}</span>
                    </div>
                  ))}
                </div>

                <div className="episode-stack">
                  {episodes.map((episode, index) => (
                    <article className="episode-editor" key={index}>
                      <div className="episode-editor-head">
                        <h3>{config.episodeNoun} {index + 1}</h3>
                        <div className="mini-btn-row">
                          <button type="button" className="mini-btn" disabled={isSubmitting} onClick={() => duplicateEpisode(index)}>Duplicate</button>
                          <button type="button" className={`mini-btn ${index === 0 ? "hidden" : ""}`} disabled={isSubmitting} onClick={() => removeEpisode(index)}>Remove</button>
                        </div>
                      </div>

                      <div className="field-grid">
                        <label className="field">
                          <span>{config.episodeTitleLabel}</span>
                          <input type="text" required placeholder={config.episodeTitlePlaceholder} value={episode.title} onChange={(event) => updateEpisode(index, { title: event.target.value })} />
                        </label>
                        <label className="field">
                          <span>Release</span>
                          <select value={episode.release} onChange={(event) => updateEpisode(index, { release: event.target.value })}>
                            <option value="publish-now">Publish now</option>
                            <option value="draft">Save as draft</option>
                            <option value="schedule">Schedule later</option>
                          </select>
                        </label>
                        <label className={`field schedule-only ${episode.release === "schedule" ? "" : "hidden"}`}>
                          <span>Schedule Time</span>
                          <input type="datetime-local" value={episode.scheduledAt} onChange={(event) => updateEpisode(index, { scheduledAt: event.target.value })} />
                          <small className="field-hint">Saved as a local date/time for now and converted into a backend-friendly ISO timestamp.</small>
                        </label>
                        <label className="field">
                          <span>Access</span>
                          <select value={episode.access} onChange={(event) => updateEpisode(index, { access: event.target.value, customizedAccess: true })}>
                            <option value="free">Free</option>
                            <option value="premium">Premium</option>
                          </select>
                        </label>
                        <label className={`field field-full visual-only ${builderMode !== "visual" ? "hidden" : ""}`}>
                          <span>Episode Thumbnail</span>
                          <div className="upload-drop compact">
                            <i className="fa-regular fa-image" />
                            <strong>Upload thumbnail</strong>
                            <input type="file" accept="image/*" onChange={(event) => handleEpisodeThumbnail(index, event.target.files?.[0])} />
                          </div>
                        </label>
                        <label className={`field field-full visual-only ${builderMode !== "visual" ? "hidden" : ""}`}>
                          <span>Episode Panels</span>
                          <div className="upload-drop">
                            <i className="fa-regular fa-images" />
                            <strong>Drop multiple images or select a ZIP</strong>
                            <small>Ideal for long vertical scrolling episodes, JPG/PNG/WEBP or ZIP package.</small>
                            <input type="file" accept="image/*,.zip" multiple onChange={(event) => handleEpisodePanels(index, event.target.files)} />
                          </div>
                        </label>
                        <label className={`field field-full text-only ${builderMode !== "text" ? "hidden" : ""}`}>
                          <span>{config.chapterBodyLabel}</span>
                          <RichTextEditor
                            initialContent={episode.body}
                            placeholder={config.chapterBodyPlaceholder}
                            onChange={(html) => updateEpisode(index, { body: html })}
                          />
                        </label>
                        <label className="field field-full">
                          <span>{config.notesLabel}</span>
                          <textarea rows="3" placeholder={config.notesPlaceholder} value={episode.notes} onChange={(event) => updateEpisode(index, { notes: event.target.value })} />
                        </label>
                      </div>
                      <div className={`schedule-note ${episode.release === "schedule" ? "" : "hidden"}`}>
                        Scheduled episodes stay in your creator workflow until the selected publish time.
                      </div>
                    </article>
                  ))}
                </div>

                <div className="episode-actions">
                  <button type="button" className="secondary-action" disabled={isSubmitting} onClick={() => addEpisode()}>
                    + Add Another Episode
                  </button>
                  <button type="button" className="primary-action" disabled={isSubmitting} onClick={() => { if (!validateStep(4)) return; setPreviewOpen(true); }}>
                    Preview Submission
                  </button>
                </div>
              </section>

              <div className="upload-step-actions">
                <button type="button" className={`step-action secondary ${currentStep === 1 ? "hidden" : ""}`} disabled={isSubmitting} onClick={() => setCurrentStep((value) => Math.max(1, value - 1))}>
                  Back
                </button>
                <button type="button" className={`step-action primary ${currentStep === 4 ? "hidden" : ""}`} disabled={isSubmitting} onClick={() => { if (!validateStep(currentStep)) return; setCurrentStep((value) => Math.min(4, value + 1)); }}>
                  Continue
                </button>
                <button type="submit" className={`step-action primary ${currentStep === 4 ? "" : "hidden"}`} disabled={isSubmitting}>
                  {isSubmitting ? "Uploading..." : "Finish Upload Setup"}
                </button>
              </div>
            </form>
          </div>

          <aside className="creator-sidebar">
            <section className="side-panel">
              <h2>Format Guide</h2>
              <ul className="guide-list">
                {config.list.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </section>
            <section className="side-panel">
              <h2>Creator Checklist</h2>
              <div className="check-item"><i className="fa-solid fa-check" /><span>Cover matches your story format</span></div>
              <div className="check-item"><i className="fa-solid fa-check" /><span>Genre and access type are selected</span></div>
              <div className="check-item"><i className="fa-solid fa-check" /><span>Episode structure is ready for readers</span></div>
            </section>
            <section className="side-panel accent-panel">
              <h2>What creators usually upload</h2>
              <p>{config.hint}</p>
            </section>
          </aside>
        </section>
      </main>

      <div className={`preview-modal ${previewOpen ? "" : "hidden"}`}>
        <div className="preview-backdrop" onClick={() => !isSubmitting && setPreviewOpen(false)} />
        <div className="preview-card">
          <button type="button" className="preview-close" aria-label="Close preview" onClick={() => setPreviewOpen(false)} disabled={isSubmitting}>
            <i className="fa-solid fa-xmark" />
          </button>
          <div className="panel-heading">
            <h2>Upload Preview</h2>
            <p>See how your content is shaping up before you save it to the app.</p>
          </div>
          <div className="preview-body">
            <div className="preview-meta">
              <img className="preview-cover" src={previewPayload.image} alt={previewPayload.title || "Preview cover"} />
              <h3>{previewPayload.title || "Untitled series"}</h3>
              <p>{previewPayload.synopsis || "No synopsis yet."}</p>
              <p><strong>{previewPayload.type.toUpperCase()}</strong> · {previewPayload.genre} · {previewPayload.audience}</p>
              <p>By {previewPayload.authorName || "Unknown creator"}</p>
              <div className="preview-tags">
                {previewPayload.hashtags.length
                  ? previewPayload.hashtags.map((tag) => <span className="preview-tag" key={tag}>#{tag}</span>)
                  : <span className="preview-tag">#newstory</span>}
              </div>
            </div>
            {previewPayload.episodes.map((episode, index) => (
              <div className="preview-episode-card" key={index}>
                <strong>{config.episodeNoun} {index + 1}: {episode.title || `${config.episodeNoun} ${index + 1}`}</strong>
                <p><strong>{episode.release === "draft" ? "Draft" : episode.release === "schedule" ? "Scheduled" : "Publish now"}</strong>{episode.scheduledAt ? ` · ${episode.scheduledAt}` : ""}</p>
                <p>{episode.body ? `${episode.body.slice(0, 240)}${episode.body.length > 240 ? "..." : ""}` : "Visual episode assets are attached for this release."}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <BottomNav />
    </>
  );
}
