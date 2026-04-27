import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import Header from "../components/layout/Header";
import {
  getCreatorProfile,
  getUserAccount,
  readFileAsDataUrl,
  setCreatorProfile
} from "../lib/account";
import { upsertCreatorProfile } from "../lib/creatorBackend";
import { useBodyPage } from "../lib/useBodyPage";
import "../styles/legacy/publish.css";

export default function PublishPage() {
  useBodyPage("publish");
  const navigate = useNavigate();
  const existingAccount = useMemo(() => getUserAccount(), []);
  const existingCreatorProfile = useMemo(() => getCreatorProfile(), []);
  const [currentRole, setCurrentRole] = useState(existingCreatorProfile?.role || "individual");
  const [message, setMessage] = useState(
    "Complete creator onboarding on top of your reader account, then switch into creator mode."
  );
  const [isSuccess, setIsSuccess] = useState(false);
  const [creatorAvatarPreview, setCreatorAvatarPreview] = useState(
    existingCreatorProfile?.avatar || ""
  );
  const [studioHeroPreview, setStudioHeroPreview] = useState(
    existingCreatorProfile?.cover || ""
  );
  const [teamUsername, setTeamUsername] = useState("");
  const [formState, setFormState] = useState(() => ({
    displayName: existingCreatorProfile?.displayName || existingAccount?.username || "",
    studioName: existingCreatorProfile?.studioName || "",
    phoneNumber: existingCreatorProfile?.phoneNumber || existingAccount?.phone_number || "",
    nationalId: existingCreatorProfile?.nationalId || "",
    bio: existingCreatorProfile?.bio || "",
    primaryFormat: existingCreatorProfile?.primaryFormat || "webtoon",
    creatorFormats:
      existingCreatorProfile?.contentCategories ||
      (existingAccount?.content_interests || []).map((item) => item.toLowerCase()),
    artistStyle: existingCreatorProfile?.artistStyle || "cinematic",
    goals: existingCreatorProfile?.goals || "",
    portfolio: existingCreatorProfile?.portfolio || ""
  }));

  useEffect(() => {
    if (currentRole !== "studio") {
      setTeamUsername("");
    }
  }, [currentRole]);

  if (!existingAccount) {
    return <Navigate to="/signup?view=signin&role=reader" replace />;
  }

  function updateField(name, value) {
    setFormState((current) => ({ ...current, [name]: value }));
  }

  function toggleFormat(value) {
    setFormState((current) => {
      const next = new Set(current.creatorFormats);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return { ...current, creatorFormats: [...next] };
    });
  }

  function syncFromReader() {
    setFormState((current) => ({
      ...current,
      displayName: existingAccount.username || "",
      phoneNumber: existingAccount.phone_number || "",
      creatorFormats: (existingAccount.content_interests || []).map((item) =>
        item.toLowerCase()
      )
    }));
    setMessage(
      "Reader account details were synced into creator onboarding. You can still customize the creator identity before saving."
    );
    setIsSuccess(false);
  }

  async function handleCreatorAvatarChange(event) {
    const file = event.target.files?.[0];
    setCreatorAvatarPreview(await readFileAsDataUrl(file, ""));
  }

  async function handleStudioHeroChange(event) {
    const file = event.target.files?.[0];
    setStudioHeroPreview(await readFileAsDataUrl(file, ""));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const creatorAvatarImage = await readFileAsDataUrl(formData.get("creatorAvatarImage"), "");
    const studioHeroImage = await readFileAsDataUrl(formData.get("studioHeroImage"), "");
    const contentCategories = [...formState.creatorFormats];

    if (!contentCategories.includes(formState.primaryFormat)) {
      contentCategories.unshift(formState.primaryFormat);
    }

    const nextCreatorProfile = {
      role: currentRole,
      displayName:
        currentRole === "studio"
          ? formState.displayName || existingAccount.username || ""
          : formState.displayName,
      studioName: formState.studioName,
      phoneNumber: formState.phoneNumber,
      nationalId: formState.nationalId,
      primaryFormat: formState.primaryFormat,
      contentCategories,
      creatorFormats: contentCategories,
      artistStyle: formState.artistStyle,
      goals: formState.goals,
      bio: formState.bio,
      portfolio: formState.portfolio,
      teamUsername: teamUsername.trim(),
      avatar: creatorAvatarImage || existingCreatorProfile?.avatar || existingAccount?.avatar || "",
      cover: studioHeroImage || existingCreatorProfile?.cover || "",
      email: existingAccount?.email || "",
      readerName: existingAccount?.username || "",
      verificationStatus: "pending"
    };

    setCreatorProfile(nextCreatorProfile);

    try {
      await upsertCreatorProfile(nextCreatorProfile);
      setMessage(
        currentRole === "studio"
          ? "Studio creator mode is ready. You can now manage studio memberships from the creator editor."
          : "Creator mode is ready. Redirecting you to your creator dashboard now."
      );
      setIsSuccess(true);
      window.setTimeout(() => navigate("/creator-dashboard"), 900);
    } catch (error) {
      console.error(error);
      setMessage(`Backend Error: ${error?.message || error?.details || error}`);
      setIsSuccess(false);
    }
  }

  return (
    <>
      <Header />
      <main className="publish-shell">
        <section className="publish-stage">
          <div className="publish-backdrop publish-backdrop-one" />
          <div className="publish-backdrop publish-backdrop-two" />

          <section className="publish-card">
            <section className="publish-hero">
              <Link to="/" className="hero-back-link" aria-label="Go back">
                <i className="fa-solid fa-arrow-left" />
              </Link>
              <div className="publish-eyebrow-row">
                <div className="publish-chip">Become a Creator</div>
                <span className="publish-mini-copy">Shared login, creator upgrade</span>
              </div>
              <h1>Set up your creator identity before you publish.</h1>
              <p>
                Your reader account stays the base identity. This page only adds creator mode as an
                individual creator or studio.
              </p>
            </section>

            <section className="publish-layout">
              <form className="publish-form" onSubmit={handleSubmit}>
                <div className="sync-banner">
                  <div>
                    <strong>Use your reader profile as a starting point</strong>
                    <p>
                      Your reader account and creator account stay connected. You can sync shared
                      details first, then customize your creator identity.
                    </p>
                  </div>
                  <button type="button" className="sync-reader-btn" onClick={syncFromReader}>
                    Sync Reader Info
                  </button>
                </div>

                <div className="account-type">
                  {[
                    [
                      "individual",
                      "Individual Creator",
                      "Perfect for solo authors, artists, and independent storytellers."
                    ],
                    [
                      "studio",
                      "Studio Account",
                      "Best for teams publishing under a shared studio identity."
                    ]
                  ].map(([role, title, copy]) => (
                    <button
                      key={role}
                      type="button"
                      className={`account-card ${currentRole === role ? "active" : ""}`}
                      onClick={() => setCurrentRole(role)}
                    >
                      <strong>{title}</strong>
                      <span>{copy}</span>
                    </button>
                  ))}
                </div>

                <section className="panel">
                  <div className="panel-head">
                    <h2>{currentRole === "studio" ? "Studio Identity" : "Creator Identity"}</h2>
                    <p>
                      {currentRole === "studio"
                        ? "Tell readers and the platform how this studio profile should appear."
                        : "Tell readers and the platform how this creator profile should appear."}
                    </p>
                  </div>
                  <div className="field-grid">
                    <label className="field">
                      <span>{currentRole === "studio" ? "Owner or Founder Name" : "Creator Display Name"}</span>
                      <input
                        type="text"
                        name="displayName"
                        placeholder={
                          currentRole === "studio"
                            ? "Owner or founder name"
                            : "Creator or artist name"
                        }
                        required
                        value={formState.displayName}
                        onChange={(event) => updateField("displayName", event.target.value)}
                      />
                    </label>
                    <label className={`field ${currentRole === "studio" ? "" : "studio-only hidden"}`}>
                      <span>Studio Name</span>
                      <input
                        type="text"
                        name="studioName"
                        placeholder="Studio or collective name"
                        required={currentRole === "studio"}
                        value={formState.studioName}
                        onChange={(event) => updateField("studioName", event.target.value)}
                      />
                    </label>
                    <label className="field field-full">
                      <span>{currentRole === "studio" ? "Studio Profile Image" : "Creator Profile Image"}</span>
                      <div className="upload-drop">
                        <i className="fa-regular fa-image" />
                        <strong>
                          {currentRole === "studio"
                            ? "Upload a profile image for your studio"
                            : "Upload a profile image for your creator identity"}
                        </strong>
                        <small>This can be different from the reader profile photo.</small>
                        <input
                          type="file"
                          accept="image/*"
                          name="creatorAvatarImage"
                          onChange={handleCreatorAvatarChange}
                        />
                      </div>
                      {creatorAvatarPreview ? (
                        <div className="publish-upload-preview publish-upload-preview-avatar">
                          <img src={creatorAvatarPreview} alt="Creator avatar preview" />
                          <div className="publish-upload-meta">
                            <strong>
                              {currentRole === "studio"
                                ? "Studio profile image attached"
                                : "Creator profile image attached"}
                            </strong>
                            <small>
                              {currentRole === "studio"
                                ? "This image will represent the studio profile."
                                : "This image will represent the creator profile."}
                            </small>
                          </div>
                        </div>
                      ) : null}
                    </label>
                    <label className="field field-full">
                      <span>{currentRole === "studio" ? "Studio Hero Image" : "Creator Hero Image"}</span>
                      <div className="upload-drop">
                        <i className="fa-regular fa-image" />
                        <strong>
                          {currentRole === "studio"
                            ? "Upload a hero image for your studio profile"
                            : "Upload a hero image for your creator profile"}
                        </strong>
                        <small>This wide image will be used at the top of your public creator page.</small>
                        <input
                          type="file"
                          accept="image/*"
                          name="studioHeroImage"
                          onChange={handleStudioHeroChange}
                        />
                      </div>
                      {studioHeroPreview ? (
                        <div className="publish-upload-preview">
                          <img src={studioHeroPreview} alt="Studio hero preview" />
                          <div className="publish-upload-meta">
                            <strong>
                              {currentRole === "studio"
                                ? "Studio hero image attached"
                                : "Creator hero image attached"}
                            </strong>
                            <small>
                              {currentRole === "studio"
                                ? "This image will be used at the top of the studio profile."
                                : "This image will be used at the top of the creator profile."}
                            </small>
                          </div>
                        </div>
                      ) : null}
                    </label>
                    <label className="field">
                      <span>{currentRole === "studio" ? "Owner or Founder Phone Number" : "Phone Number"}</span>
                      <input
                        type="tel"
                        name="phoneNumber"
                        placeholder="+95 9..."
                        required
                        value={formState.phoneNumber}
                        onChange={(event) => updateField("phoneNumber", event.target.value)}
                      />
                    </label>
                    <label className="field">
                      <span>
                        {currentRole === "studio"
                          ? "Owner or Founder National ID Card Number"
                          : "National ID Card Number"}
                      </span>
                      <input
                        type="text"
                        name="nationalId"
                        placeholder="Enter ID card number"
                        required
                        value={formState.nationalId}
                        onChange={(event) => updateField("nationalId", event.target.value)}
                      />
                    </label>
                    <label className="field field-full">
                      <span>{currentRole === "studio" ? "Studio Bio" : "Creator Bio"}</span>
                      <textarea
                        name="bio"
                        rows="4"
                        placeholder={
                          currentRole === "studio"
                            ? "Short introduction for your studio profile."
                            : "Short introduction for your creator profile."
                        }
                        value={formState.bio}
                        onChange={(event) => updateField("bio", event.target.value)}
                      />
                    </label>
                  </div>
                </section>

                <section className="panel">
              <div className="panel-head">
                <h2>{currentRole === "studio" ? "Studio Creative Profile" : "Creative Profile"}</h2>
                <p>Select the style and publishing focus that best matches your work.</p>
              </div>
              <div className="field-grid">
                <label className="field">
                  <span>Primary Format</span>
                  <select
                    name="primaryFormat"
                    required
                    value={formState.primaryFormat}
                    onChange={(event) => updateField("primaryFormat", event.target.value)}
                  >
                    <option value="webtoon">Webtoon</option>
                    <option value="comics">Comics</option>
                    <option value="knowledge">Knowledge</option>
                    <option value="novel">Novel</option>
                  </select>
                </label>
                <fieldset className="field field-full format-group">
                  <legend>Publishing Categories</legend>
                  <div className="format-options">
                    {["webtoon", "comics", "knowledge", "novel"].map((item) => (
                      <label className="format-chip" key={item}>
                        <input
                          type="checkbox"
                          name="creatorFormats"
                          value={item}
                          checked={formState.creatorFormats.includes(item)}
                          onChange={() => toggleFormat(item)}
                        />
                        <span>{item.charAt(0).toUpperCase() + item.slice(1)}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <label className="field">
                  <span>Artist Style</span>
                  <select
                    name="artistStyle"
                    required
                    value={formState.artistStyle}
                    onChange={(event) => updateField("artistStyle", event.target.value)}
                  >
                    <option value="cinematic">Cinematic</option>
                    <option value="clean-line">Clean Line</option>
                    <option value="painterly">Painterly</option>
                    <option value="minimal">Minimal</option>
                    <option value="educational">Educational</option>
                    <option value="prose-first">Prose First</option>
                  </select>
                </label>
                <label className="field field-full">
                  <span>Publishing Goals</span>
                  <input
                    type="text"
                    name="goals"
                    placeholder="Example: weekly fantasy webtoon, serialized mystery novel, studio anthology"
                    value={formState.goals}
                    onChange={(event) => updateField("goals", event.target.value)}
                  />
                </label>
              </div>
                </section>

                <section className="panel">
              <div className="panel-head">
                <h2>Verification</h2>
                <p>Upload the documents needed for creator verification and payout preparation.</p>
              </div>
              <div className="field-grid">
                <label className="field field-full">
                  <span>ID Card Upload</span>
                  <div className="upload-drop">
                    <i className="fa-regular fa-id-card" />
                    <strong>Upload front and back of your ID</strong>
                    <small>Accepted formats: JPG, PNG, PDF</small>
                    <input type="file" accept=".jpg,.jpeg,.png,.pdf" />
                  </div>
                </label>
                <label className="field field-full">
                  <span>Portfolio or Sample Link</span>
                  <input
                    type="url"
                    name="portfolio"
                    placeholder="https://your-portfolio.example"
                    value={formState.portfolio}
                    onChange={(event) => updateField("portfolio", event.target.value)}
                  />
                </label>
              </div>
                </section>

                {currentRole === "studio" ? (
                  <section className="panel">
                    <div className="panel-head">
                      <h2>Studio Team</h2>
                      <p>
                        Team memberships are managed after the studio profile is created. Add the first
                        creator username here if you want a reminder for who to invite next.
                      </p>
                    </div>
                    <div className="field-grid">
                      <label className="field field-full">
                        <span>First Team Member Username (Optional)</span>
                        <input
                          type="text"
                          name="teamUsername"
                          placeholder="creator_username"
                          value={teamUsername}
                          onChange={(event) => setTeamUsername(event.target.value)}
                        />
                      </label>
                    </div>
                  </section>
                ) : null}

                <button type="submit" className="submit-creator">
                  {existingCreatorProfile ? "Save Creator Mode" : "Activate Creator Mode"}
                </button>
                <div className={`submit-note ${isSuccess ? "success" : ""}`}>{message}</div>
              </form>

              <aside className="publish-sidebar">
                <section className="side-panel">
                  <h2>What happens next</h2>
                  <ul>
                    <li>Your reader account stays untouched while creator-only fields save into creator mode.</li>
                    <li>Individual creators go straight into creator mode after this form is saved.</li>
                    <li>Studio owners can add or update memberships after the studio profile exists.</li>
                  </ul>
                </section>

                <section className="side-panel accent">
                  <h2>Good creator profiles include</h2>
                  <p>
                    A clear creator name, a readable phone number, valid ID details, and a consistent
                    style direction that matches the stories you will publish.
                  </p>
                </section>
              </aside>
            </section>
          </section>
        </section>
      </main>
    </>
  );
}
