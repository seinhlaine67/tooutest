import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/layout/Header";
import {
  getCreatorProfile,
  getUserAccount,
  readFileAsDataUrl,
  setCreatorProfile
} from "../lib/account";
import { useBodyPage } from "../lib/useBodyPage";
import "../styles/legacy/publish.css";

export default function PublishPage() {
  useBodyPage("publish");
  const navigate = useNavigate();
  const existingAccount = useMemo(() => getUserAccount(), []);
  const existingCreatorProfile = useMemo(() => getCreatorProfile(), []);
  const [currentRole, setCurrentRole] = useState(existingCreatorProfile?.role || "individual");
  const [message, setMessage] = useState(
    "Once this form is completed, the Publish button will take you into your creator dashboard."
  );
  const [isSuccess, setIsSuccess] = useState(false);
  const [studioHeroPreview, setStudioHeroPreview] = useState(existingCreatorProfile?.cover || "");
  const [formState, setFormState] = useState(() => ({
    displayName: existingCreatorProfile?.displayName || existingAccount?.username || "",
    studioName: existingCreatorProfile?.studioName || "",
    phoneNumber: existingCreatorProfile?.phoneNumber || existingAccount?.phone_number || "",
    nationalId: existingCreatorProfile?.nationalId || "",
    bio: existingCreatorProfile?.bio || existingAccount?.bio || "",
    primaryFormat: existingCreatorProfile?.primaryFormat || "webtoon",
    creatorFormats:
      existingCreatorProfile?.contentCategories ||
      (existingAccount?.content_interests || []).map((item) => item.toLowerCase()),
    artistStyle: existingCreatorProfile?.artistStyle || "cinematic",
    goals: existingCreatorProfile?.goals || "",
    portfolio: existingCreatorProfile?.portfolio || ""
  }));

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
    if (!existingAccount) return;
    setFormState((current) => ({
      ...current,
      displayName: existingAccount.username || "",
      phoneNumber: existingAccount.phone_number || "",
      bio: existingAccount.bio || "",
      creatorFormats: (existingAccount.content_interests || []).map((item) => item.toLowerCase())
    }));
    setMessage(
      "Reader profile details were synced into creator mode. You can change the creator identity before saving."
    );
    setIsSuccess(false);
  }

  async function handleStudioHeroChange(event) {
    const file = event.target.files?.[0];
    setStudioHeroPreview(await readFileAsDataUrl(file, ""));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const studioHeroImage = await readFileAsDataUrl(formData.get("studioHeroImage"), "");
    const contentCategories = [...formState.creatorFormats];

    if (!contentCategories.includes(formState.primaryFormat)) {
      contentCategories.unshift(formState.primaryFormat);
    }

    setCreatorProfile({
      role: currentRole,
      displayName: formState.displayName,
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
      cover: studioHeroImage || existingCreatorProfile?.cover || "",
      email: existingAccount?.email || "",
      readerName: existingAccount?.username || "",
      verificationStatus: "pending"
    });

    setMessage("Creator account saved on this device. Redirecting you to your creator dashboard now.");
    setIsSuccess(true);
    window.setTimeout(() => navigate("/creator-dashboard"), 900);
  }

  return (
    <>
      <Header />
      <main className="publish-shell">
        <section className="publish-hero">
          <Link to="/" className="hero-back-link" aria-label="Go back">
            <i className="fa-solid fa-arrow-left" />
          </Link>
          <div className="publish-chip">Creator Registration</div>
          <h1>Set up your creator identity before you publish.</h1>
          <p>Register as an individual creator or a studio, complete the required identity details, and then TooU will send you into creator mode before you move to upload.</p>
        </section>

        <section className="publish-layout">
          <form className="publish-form" onSubmit={handleSubmit}>
            {existingAccount ? (
              <div className="sync-banner">
                <div>
                  <strong>Use your reader profile as a starting point</strong>
                  <p>Your reader account and creator account stay connected. You can sync shared details first, then customize your creator identity.</p>
                </div>
                <button type="button" className="sync-reader-btn" onClick={syncFromReader}>
                  Sync Reader Info
                </button>
              </div>
            ) : null}

            <div className="account-type">
              {[
                ["individual", "Individual Creator", "Perfect for solo authors, artists, and independent storytellers."],
                ["studio", "Studio Account", "Best for teams publishing under a shared studio identity."]
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
                <h2>Creator Identity</h2>
                <p>Tell readers and the platform how this creator profile should appear.</p>
              </div>
              <div className="field-grid">
                <label className="field">
                  <span>Display Name</span>
                  <input type="text" name="displayName" placeholder="Creator or artist name" required value={formState.displayName} onChange={(event) => updateField("displayName", event.target.value)} />
                </label>
                <label className={`field studio-only ${currentRole !== "studio" ? "hidden" : ""}`}>
                  <span>Studio Name</span>
                  <input type="text" name="studioName" placeholder="Studio or collective name" value={formState.studioName} onChange={(event) => updateField("studioName", event.target.value)} />
                </label>
                <label className={`field field-full studio-only ${currentRole !== "studio" ? "hidden" : ""}`}>
                  <span>Studio Hero Image</span>
                  <div className="upload-drop">
                    <i className="fa-regular fa-image" />
                    <strong>Upload a hero image for your studio profile</strong>
                    <small>This wide image will be used at the top of your studio page.</small>
                    <input type="file" accept="image/*" name="studioHeroImage" onChange={handleStudioHeroChange} />
                  </div>
                  {studioHeroPreview ? (
                    <div className="publish-upload-preview">
                      <img src={studioHeroPreview} alt="Studio hero preview" />
                      <div className="publish-upload-meta">
                        <strong>Studio hero image attached</strong>
                        <small>This image will be used at the top of the studio profile.</small>
                      </div>
                    </div>
                  ) : null}
                </label>
                <label className="field">
                  <span>Phone Number</span>
                  <input type="tel" name="phoneNumber" placeholder="+95 9..." required value={formState.phoneNumber} onChange={(event) => updateField("phoneNumber", event.target.value)} />
                </label>
                <label className="field">
                  <span>National ID Card Number</span>
                  <input type="text" name="nationalId" placeholder="Enter ID card number" required value={formState.nationalId} onChange={(event) => updateField("nationalId", event.target.value)} />
                </label>
                <label className="field field-full">
                  <span>Creator Bio</span>
                  <textarea name="bio" rows="4" placeholder="Short introduction for your creator profile." value={formState.bio} onChange={(event) => updateField("bio", event.target.value)} />
                </label>
              </div>
            </section>

            <section className="panel">
              <div className="panel-head">
                <h2>Creative Profile</h2>
                <p>Select the style and publishing focus that best matches your work.</p>
              </div>
              <div className="field-grid">
                <label className="field">
                  <span>Primary Format</span>
                  <select name="primaryFormat" required value={formState.primaryFormat} onChange={(event) => updateField("primaryFormat", event.target.value)}>
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
                        <input type="checkbox" name="creatorFormats" value={item} checked={formState.creatorFormats.includes(item)} onChange={() => toggleFormat(item)} />
                        <span>{item.charAt(0).toUpperCase() + item.slice(1)}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <label className="field">
                  <span>Artist Style</span>
                  <select name="artistStyle" required value={formState.artistStyle} onChange={(event) => updateField("artistStyle", event.target.value)}>
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
                  <input type="text" name="goals" placeholder="Example: weekly fantasy webtoon, serialized mystery novel, studio anthology" value={formState.goals} onChange={(event) => updateField("goals", event.target.value)} />
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
                  <input type="url" name="portfolio" placeholder="https://your-portfolio.example" value={formState.portfolio} onChange={(event) => updateField("portfolio", event.target.value)} />
                </label>
              </div>
            </section>

            <button type="submit" className="submit-creator">Create Creator Account</button>
            <div className={`submit-note ${isSuccess ? "success" : ""}`}>{message}</div>
          </form>

          <aside className="publish-sidebar">
            <section className="side-panel">
              <h2>What happens next</h2>
              <ul>
                <li>Your creator profile is saved on this device for the frontend flow.</li>
                <li>The shared Publish button automatically switches to your creator dashboard.</li>
                <li>You can later connect this form to backend verification and payments.</li>
              </ul>
            </section>

            <section className="side-panel accent">
              <h2>Good creator profiles include</h2>
              <p>A clear creator name, a readable phone number, valid ID details, and a consistent style direction that matches the stories you will publish.</p>
            </section>
          </aside>
        </section>
      </main>
    </>
  );
}
