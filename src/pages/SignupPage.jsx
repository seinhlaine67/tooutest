import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/layout/Header";
import {
  getCreatorProfile,
  getUserAccount,
  readFileAsDataUrl,
  setUserAccount
} from "../lib/account";
import { useBodyPage } from "../lib/useBodyPage";
import "../styles/legacy/signup.css";

export default function SignupPage() {
  useBodyPage("signup");
  const navigate = useNavigate();
  const existingAccount = useMemo(() => getUserAccount(), []);
  const creatorProfile = useMemo(() => getCreatorProfile(), []);
  const [message, setMessage] = useState(
    "Your account can later be upgraded into a creator profile without starting over."
  );
  const [isSuccess, setIsSuccess] = useState(false);
  const [formState, setFormState] = useState(() => ({
    username:
      existingAccount?.username ||
      creatorProfile?.readerName ||
      creatorProfile?.displayName ||
      creatorProfile?.studioName ||
      "",
    email: existingAccount?.email || creatorProfile?.email || "",
    password: "",
    confirmPassword: "",
    phoneNumber: existingAccount?.phone_number || creatorProfile?.phoneNumber || "",
    birthdate: existingAccount?.birthdate || "",
    place: existingAccount?.place || creatorProfile?.place || "",
    contentInterests: existingAccount?.content_interests || [],
    genreInterests: existingAccount?.genre_interests || []
  }));

  function updateField(name, value) {
    setFormState((current) => ({ ...current, [name]: value }));
  }

  function toggleChoice(name, value) {
    setFormState((current) => {
      const existing = new Set(current[name]);
      if (existing.has(value)) existing.delete(value);
      else existing.add(value);
      return { ...current, [name]: [...existing] };
    });
  }

  function syncFromCreator() {
    if (!creatorProfile) return;
    setFormState((current) => ({
      ...current,
      username:
        creatorProfile.readerName ||
        creatorProfile.displayName ||
        creatorProfile.studioName ||
        "",
      email: creatorProfile.email || "",
      phoneNumber: creatorProfile.phoneNumber || "",
      place: creatorProfile.place || "",
      contentInterests: creatorProfile.primaryFormat
        ? [
            creatorProfile.primaryFormat.charAt(0).toUpperCase() +
              creatorProfile.primaryFormat.slice(1)
          ]
        : [],
      genreInterests: []
    }));
    setMessage(
      "Creator details were used as a starting point for your reader account. You can still edit anything before saving."
    );
    setIsSuccess(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    if (formData.get("password") !== formData.get("confirmPassword")) {
      setMessage(
        "Passwords do not match yet. Please make both password fields the same."
      );
      setIsSuccess(false);
      return;
    }

    const avatar = await readFileAsDataUrl(
      formData.get("avatar"),
      "https://i.pravatar.cc/120?img=12"
    );
    const account = {
      username: formData.get("username"),
      email: formData.get("email"),
      phone_number: formData.get("phoneNumber") || "",
      birthdate: formData.get("birthdate") || "",
      place: formData.get("place") || "",
      content_interests: formData.getAll("contentInterests"),
      genre_interests: formData.getAll("genreInterests"),
      avatar,
      coins: existingAccount?.coins ?? 50,
      eggsPurchasedTotal: existingAccount?.eggsPurchasedTotal ?? 0,
      createdAt: existingAccount?.createdAt ?? Date.now(),
      plan: "Reader",
      bio: existingAccount?.bio || "Content enthusiast and aspiring creator"
    };

    setUserAccount(account);
    setMessage(
      "Account created on this device. You can now continue as a reader or register as a creator."
    );
    setIsSuccess(true);
    window.setTimeout(() => navigate("/profile"), 700);
  }

  return (
    <>
      <Header />
      <main className="signup-shell">
        <section className="signup-hero">
          <Link to="/" className="hero-back-link" aria-label="Go back">
            <i className="fa-solid fa-arrow-left" />
          </Link>
          <div className="hero-chip">Join TooU</div>
          <h1>Create your reader account</h1>
          <p>Set up your reading profile, choose what you love, and keep the door open for creator mode later.</p>
        </section>

        <section className="signup-card">
          <div className="card-head">
            <h2>Create your account</h2>
            <p>Your signup details will appear in your reader profile after registration.</p>
          </div>

          {creatorProfile && !existingAccount ? (
            <div className="sync-panel">
              <div>
                <strong>Already created a creator profile?</strong>
                <p>Use your creator details as a starting point, then adjust anything you want for reader mode.</p>
              </div>
              <button type="button" className="sync-btn" onClick={syncFromCreator}>
                Sync from Creator
              </button>
            </div>
          ) : null}

          <form className="signup-form" onSubmit={handleSubmit}>
            <div className="field-grid">
              {[
                ["Username", "username", "text", "Choose a username", true],
                ["Email", "email", "email", "name@example.com", true],
                ["Password", "password", "password", "Create a secure password", true],
                ["Confirm Password", "confirmPassword", "password", "Confirm your password", true]
              ].map(([label, name, type, placeholder, required]) => (
                <label className="field" key={name}>
                  <span>{label}</span>
                  <input
                    type={type}
                    name={name}
                    placeholder={placeholder}
                    required={required}
                    value={formState[name]}
                    onChange={(event) => updateField(name, event.target.value)}
                  />
                </label>
              ))}

              <label className="field field-wide">
                <span>Profile Photo</span>
                <input type="file" name="avatar" accept="image/*" />
              </label>

              <label className="field">
                <span>Phone Number</span>
                <input
                  type="tel"
                  name="phoneNumber"
                  placeholder="09xxxxxxxxx"
                  value={formState.phoneNumber}
                  onChange={(event) => updateField("phoneNumber", event.target.value)}
                />
              </label>

              <label className="field">
                <span>Birthdate</span>
                <input
                  type="date"
                  name="birthdate"
                  value={formState.birthdate}
                  onChange={(event) => updateField("birthdate", event.target.value)}
                />
              </label>

              <label className="field field-wide">
                <span>Place</span>
                <input
                  type="text"
                  name="place"
                  placeholder="City, State or Region"
                  value={formState.place}
                  onChange={(event) => updateField("place", event.target.value)}
                />
              </label>
            </div>

            <fieldset className="interest-group">
              <legend>Content Interests</legend>
              <div className="interest-options">
                {["Webtoon", "Novel", "Cartoon", "Comics", "Knowledge"].map((item) => (
                  <label className="interest-chip" key={item}>
                    <input
                      type="checkbox"
                      name="contentInterests"
                      value={item}
                      checked={formState.contentInterests.includes(item)}
                      onChange={() => toggleChoice("contentInterests", item)}
                    />
                    <span>{item}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="interest-group">
              <legend>Genre Interests</legend>
              <div className="interest-options">
                {["Romance", "Action", "Mystery", "Fantasy", "Horror", "Comedy"].map((item) => (
                  <label className="interest-chip" key={item}>
                    <input
                      type="checkbox"
                      name="genreInterests"
                      value={item}
                      checked={formState.genreInterests.includes(item)}
                      onChange={() => toggleChoice("genreInterests", item)}
                    />
                    <span>{item}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="checkline">
              <input type="checkbox" required />
              <span>I agree to the terms, privacy policy, and community guidelines.</span>
            </label>

            <button type="submit" className="submit-btn">Create Account</button>
          </form>

          <div className={`form-note ${isSuccess ? "success" : ""}`}>{message}</div>
        </section>
      </main>
    </>
  );
}
