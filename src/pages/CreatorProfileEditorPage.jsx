import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import Header from "../components/layout/Header";
import { getCreatorProfile, getUserAccount, readFileAsDataUrl, setCreatorProfile } from "../lib/account";
import { getStoredList, setStoredList } from "../lib/storage";
import { getAllCreators, slugify } from "../lib/toouData";
import { useBodyPage } from "../lib/useBodyPage";
import "../styles/legacy/profile-editor.css";

function getDisplayName(profile, userAccount) {
  return profile?.displayName || profile?.studioName || userAccount?.username || "TooU Creator";
}

export default function CreatorProfileEditorPage() {
  useBodyPage("creator-profile-editor");
  const navigate = useNavigate();
  const userAccount = useMemo(() => getUserAccount(), []);
  const initialProfile = useMemo(() => getCreatorProfile(), []);

  const [creatorProfile, setLocalProfile] = useState(initialProfile);
  const [avatarPreview, setAvatarPreview] = useState(
    initialProfile?.avatar || userAccount?.avatar || "/images/image1.png"
  );
  const [coverPreview, setCoverPreview] = useState(
    initialProfile?.cover || initialProfile?.avatar || userAccount?.avatar || "/images/image1.png"
  );
  const [selectedStudioId, setSelectedStudioId] = useState(initialProfile?.affiliatedStudioId || "");
  const [studioArtistQuery, setStudioArtistQuery] = useState("");
  const [formState, setFormState] = useState(() => ({
    displayName: initialProfile?.displayName || "",
    studioName: initialProfile?.affiliatedStudioName || initialProfile?.studioName || "",
    phoneNumber: initialProfile?.phoneNumber || "",
    primaryFormat: initialProfile?.primaryFormat || "webtoon",
    artistStyle: initialProfile?.artistStyle || "cinematic",
    goals: initialProfile?.goals || "",
    bio: initialProfile?.bio || ""
  }));
  const [selectedStudioArtists, setSelectedStudioArtists] = useState(
    Array.isArray(initialProfile?.featuredArtists) ? initialProfile.featuredArtists : []
  );

  if (!userAccount) return <Navigate to="/signup" replace />;
  if (!creatorProfile) return <Navigate to="/publish" replace />;

  const isStudioAccount = creatorProfile.role === "studio";
  const currentCreatorId = `creator-local-${slugify(getDisplayName(creatorProfile, userAccount))}`;
  const availableStudios = getAllCreators()
    .filter((item) => item.type === "studio" && item.id !== currentCreatorId)
    .sort((a, b) => a.name.localeCompare(b.name));
  const availableArtistCandidates = getAllCreators()
    .filter((item) => item.type !== "studio" && item.id !== currentCreatorId)
    .filter((item) => !selectedStudioArtists.some((artist) => artist.id === item.id))
    .filter((item) => item.name.toLowerCase().includes(studioArtistQuery.trim().toLowerCase()));

  function updateField(name, value) {
    setFormState((current) => ({ ...current, [name]: value }));
  }

  function pickStudio(studio) {
    setSelectedStudioId(studio?.id || "");
    updateField("studioName", studio?.name || "");
  }

  async function handleAvatarChange(event) {
    const nextAvatar = await readFileAsDataUrl(event.target.files?.[0], "");
    if (nextAvatar) setAvatarPreview(nextAvatar);
  }

  async function handleCoverChange(event) {
    const nextCover = await readFileAsDataUrl(event.target.files?.[0], "");
    if (nextCover) setCoverPreview(nextCover);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nextAvatar = await readFileAsDataUrl(formData.get("avatar"), "");
    const nextCover = await readFileAsDataUrl(formData.get("coverImage"), "");
    const previousDisplayName = getDisplayName(creatorProfile, userAccount);
    const previousCreatorId = `creator-local-${slugify(previousDisplayName)}`;
    const nextDisplayName = String(formData.get("displayName") || "").trim();
    const nextCreatorName = nextDisplayName || previousDisplayName;
    const nextCreatorId = `creator-local-${slugify(nextCreatorName)}`;
    const matchedStudio = !isStudioAccount
      ? availableStudios.find(
          (studio) =>
            studio.id === selectedStudioId ||
            studio.name.toLowerCase() === String(formData.get("studioName") || "").trim().toLowerCase()
        ) || null
      : null;

    const nextProfile = {
      ...creatorProfile,
      displayName: nextDisplayName,
      studioName: isStudioAccount ? String(formData.get("studioName") || nextCreatorName || "") : "",
      affiliatedStudioId: matchedStudio?.id || "",
      affiliatedStudioName: matchedStudio?.name || "",
      phoneNumber: formData.get("phoneNumber") || "",
      primaryFormat: formData.get("primaryFormat") || creatorProfile.primaryFormat,
      artistStyle: formData.get("artistStyle") || creatorProfile.artistStyle,
      goals: formData.get("goals") || "",
      bio: formData.get("bio") || "",
      avatar: nextAvatar || creatorProfile.avatar || userAccount.avatar || "/images/image1.png",
      cover:
        nextCover ||
        creatorProfile.cover ||
        nextAvatar ||
        creatorProfile.avatar ||
        userAccount.avatar ||
        "/images/image1.png",
      featuredArtists: isStudioAccount ? selectedStudioArtists : []
    };

    const localCreators = getStoredList("toouLocalCreators");
    const localSeries = getStoredList("toouLocalSeries");
    const creatorsMap = new Map(localCreators.map((item) => [item.id, item]));

    creatorsMap.set(nextCreatorId, {
      id: nextCreatorId,
      slug: slugify(nextCreatorName),
      name: nextCreatorName,
      type: isStudioAccount ? "studio" : "creator",
      avatar: nextProfile.avatar,
      cover: nextProfile.cover,
      bio: nextProfile.bio || "A TooU creator building new stories directly inside the platform.",
      followers: creatorsMap.get(previousCreatorId)?.followers || "0",
      rating: creatorsMap.get(previousCreatorId)?.rating || "New",
      featuredArtists: isStudioAccount ? selectedStudioArtists : [],
      affiliatedStudioId: nextProfile.affiliatedStudioId || "",
      affiliatedStudioName: nextProfile.affiliatedStudioName || ""
    });
    creatorsMap.delete(previousCreatorId);

    const nextSeries = localSeries.map((item) =>
      item.creatorId === previousCreatorId || item.creatorName === previousDisplayName
        ? { ...item, creatorId: nextCreatorId, creatorName: nextCreatorName }
        : item
    );

    setCreatorProfile(nextProfile);
    setLocalProfile(nextProfile);
    setStoredList("toouLocalCreators", Array.from(creatorsMap.values()));
    setStoredList("toouLocalSeries", nextSeries);
    navigate("/creator-dashboard");
  }

  return (
    <>
      <Header />
      <main className="profile-editor-shell">
        <section className="profile-editor-hero">
          <Link to="/creator-dashboard" className="hero-back-link" aria-label="Go back">
            <i className="fa-solid fa-arrow-left" />
          </Link>
          <div className="editor-kicker">Creator Profile</div>
          <h1>Edit your creator profile.</h1>
          <p>
            Update your creator identity, default format, and publishing profile without reopening creator registration.
          </p>
        </section>

        <section className="profile-editor-layout">
          <form className="profile-editor-form" onSubmit={handleSubmit}>
            <section className="profile-editor-panel">
              <div className="panel-head">
                <div>
                  <div className="panel-kicker">Identity</div>
                  <h2>Creator details</h2>
                </div>
              </div>

              <div className="profile-editor-grid">
                <label className="profile-editor-field profile-editor-field-wide">
                  <span>Creator Hero Image</span>
                  <div className="profile-upload-card">
                    <div
                      className="profile-upload-preview cover-preview"
                      style={{
                        backgroundImage: `linear-gradient(135deg, rgba(107, 70, 193, 0.28), rgba(73, 199, 255, 0.22)), url("${coverPreview}")`
                      }}
                    />
                    <input type="file" accept="image/*" name="coverImage" onChange={handleCoverChange} />
                    <small>Upload the hero image used across your creator profile surfaces.</small>
                  </div>
                </label>
                <label className="profile-editor-field">
                  <span>Creator Avatar</span>
                  <div className="profile-upload-card">
                    <img className="profile-upload-preview avatar-preview" src={avatarPreview} alt="Creator avatar preview" />
                    <input type="file" accept="image/*" name="avatar" onChange={handleAvatarChange} />
                    <small>Upload the portrait image shown on creator profile cards.</small>
                  </div>
                </label>
                <label className="profile-editor-field">
                  <span>Display Name</span>
                  <input type="text" name="displayName" required value={formState.displayName} onChange={(event) => updateField("displayName", event.target.value)} />
                </label>
                <label className="profile-editor-field">
                  <span>Studio Name</span>
                  <input
                    type="text"
                    name="studioName"
                    placeholder={isStudioAccount ? "Your studio name" : "Search or select a studio"}
                    value={formState.studioName}
                    onChange={(event) => {
                      updateField("studioName", event.target.value);
                      if (!isStudioAccount) {
                        const matched = availableStudios.find(
                          (studio) => studio.name.toLowerCase() === event.target.value.trim().toLowerCase()
                        );
                        setSelectedStudioId(matched?.id || "");
                      }
                    }}
                  />
                  <small>Choose a studio from TooU&apos;s available studios if you join one later.</small>
                </label>
                {!isStudioAccount ? (
                  <div className={`profile-editor-field profile-editor-field-wide ${availableStudios.length ? "" : "hidden"}`}>
                    <span>Available Studios</span>
                    <div className="studio-picker-results">
                      {availableStudios.map((studio) => (
                        <button
                          type="button"
                          key={studio.id}
                          className={`studio-option ${selectedStudioId === studio.id ? "active" : ""}`}
                          onClick={() => pickStudio(studio)}
                        >
                          <img src={studio.avatar || "/images/logo.png"} alt={studio.name} />
                          <div className="studio-option-copy">
                            <strong>{studio.name}</strong>
                            <span>{studio.rating || "9.0"} Heat</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
                {isStudioAccount ? (
                  <div className="profile-editor-field profile-editor-field-wide">
                    <span>Studio Artists</span>
                    <small>
                      Add registered TooU creators to your studio team. Their own creator profiles stay separate, and they will appear under your studio page.
                    </small>
                    <input
                      type="text"
                      placeholder="Search creators by name"
                      value={studioArtistQuery}
                      onChange={(event) => setStudioArtistQuery(event.target.value)}
                    />
                    <div className="studio-artist-results">
                      {availableArtistCandidates.length ? (
                        availableArtistCandidates.map((creator) => (
                          <div className="studio-artist-option" key={creator.id}>
                            <img src={creator.avatar || "/images/image1.png"} alt={creator.name} />
                            <div className="studio-artist-copy">
                              <strong>{creator.name}</strong>
                              <span>{creator.primaryFormat || "Creator"}</span>
                            </div>
                            <button
                              type="button"
                              className="studio-artist-action"
                              onClick={() =>
                                setSelectedStudioArtists((current) => [
                                  ...current,
                                  {
                                    id: creator.id,
                                    slug: creator.slug,
                                    name: creator.name,
                                    avatar: creator.avatar || "/images/image1.png",
                                    role: creator.primaryFormat || "Featured Creator"
                                  }
                                ])
                              }
                            >
                              Add Artist
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="studio-team-empty">No matching creators are available to add right now.</div>
                      )}
                    </div>
                    <div className="studio-team-list">
                      {selectedStudioArtists.length ? (
                        selectedStudioArtists.map((artist) => (
                          <div className="studio-team-member" key={artist.id}>
                            <img src={artist.avatar || "/images/image1.png"} alt={artist.name} />
                            <div className="studio-team-copy">
                              <strong>{artist.name}</strong>
                              <span>This creator keeps their own profile and appears under the studio page.</span>
                              <input
                                className="studio-team-role"
                                type="text"
                                value={artist.role || "Featured Creator"}
                                onChange={(event) =>
                                  setSelectedStudioArtists((current) =>
                                    current.map((item) =>
                                      item.id === artist.id ? { ...item, role: event.target.value } : item
                                    )
                                  )
                                }
                              />
                            </div>
                            <button
                              type="button"
                              className="studio-team-remove"
                              onClick={() =>
                                setSelectedStudioArtists((current) =>
                                  current.filter((item) => item.id !== artist.id)
                                )
                              }
                            >
                              Remove
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="studio-team-empty">No artists added yet. Add creators here and they will appear on the studio page.</div>
                      )}
                    </div>
                  </div>
                ) : null}
                <label className="profile-editor-field">
                  <span>Phone Number</span>
                  <input type="tel" name="phoneNumber" value={formState.phoneNumber} onChange={(event) => updateField("phoneNumber", event.target.value)} />
                </label>
                <label className="profile-editor-field">
                  <span>Primary Format</span>
                  <select name="primaryFormat" value={formState.primaryFormat} onChange={(event) => updateField("primaryFormat", event.target.value)}>
                    <option value="webtoon">Webtoon</option>
                    <option value="comics">Comics</option>
                    <option value="knowledge">Knowledge</option>
                    <option value="novel">Novel</option>
                  </select>
                </label>
                <label className="profile-editor-field">
                  <span>Artist Style</span>
                  <select name="artistStyle" value={formState.artistStyle} onChange={(event) => updateField("artistStyle", event.target.value)}>
                    <option value="cinematic">Cinematic</option>
                    <option value="clean-line">Clean Line</option>
                    <option value="painterly">Painterly</option>
                    <option value="minimal">Minimal</option>
                    <option value="educational">Educational</option>
                    <option value="prose-first">Prose First</option>
                  </select>
                </label>
                <label className="profile-editor-field profile-editor-field-wide">
                  <span>Publishing Goals</span>
                  <input type="text" name="goals" value={formState.goals} onChange={(event) => updateField("goals", event.target.value)} />
                </label>
                <label className="profile-editor-field profile-editor-field-wide">
                  <span>Creator Bio</span>
                  <textarea name="bio" rows="5" value={formState.bio} onChange={(event) => updateField("bio", event.target.value)} />
                </label>
              </div>
            </section>

            <div className="profile-editor-actions">
              <Link to="/creator-dashboard" className="profile-editor-btn secondary">Cancel</Link>
              <button type="submit" className="profile-editor-btn primary">Save Changes</button>
            </div>
          </form>

          <aside className="profile-editor-sidebar">
            <section className="profile-editor-side-card">
              <h2>Creator mode</h2>
              <p>
                This keeps your creator identity separate from reader mode while still staying linked to the same person and account flow.
              </p>
            </section>
          </aside>
        </section>
      </main>
    </>
  );
}
