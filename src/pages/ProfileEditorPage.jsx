import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import Header from "../components/layout/Header";
import { getUserAccount, readFileAsDataUrl, setUserAccount } from "../lib/account";
import { useBodyPage } from "../lib/useBodyPage";
import "../styles/legacy/profile-editor.css";

export default function ProfileEditorPage() {
  useBodyPage("profile-editor");
  const navigate = useNavigate();
  const initialAccount = useMemo(() => getUserAccount(), []);
  const [userAccount, setLocalAccount] = useState(initialAccount);
  const [avatarPreview, setAvatarPreview] = useState(
    initialAccount?.avatar || "https://i.pravatar.cc/120?img=12"
  );
  const [coverPreview, setCoverPreview] = useState(
    initialAccount?.coverImage || initialAccount?.avatar || "/images/image1.png"
  );
  const [formState, setFormState] = useState(() => ({
    displayName: initialAccount?.displayName || initialAccount?.username || "",
    username: initialAccount?.username || "",
    email: initialAccount?.email || "",
    phoneNumber: initialAccount?.phone_number || "",
    birthdate: initialAccount?.birthdate || "",
    place: initialAccount?.place || "",
    bio: initialAccount?.bio || ""
  }));

  if (!userAccount) return <Navigate to="/signup" replace />;

  function updateField(name, value) {
    setFormState((current) => ({ ...current, [name]: value }));
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

    const nextAccount = {
      ...userAccount,
      displayName: formData.get("displayName") || formData.get("username"),
      username: formData.get("username"),
      email: formData.get("email"),
      phone_number: formData.get("phoneNumber") || "",
      birthdate: formData.get("birthdate") || "",
      place: formData.get("place") || "",
      bio: formData.get("bio") || "Content enthusiast and aspiring creator.",
      avatar: nextAvatar || userAccount.avatar || "https://i.pravatar.cc/120?img=12",
      coverImage:
        nextCover ||
        userAccount.coverImage ||
        nextAvatar ||
        userAccount.avatar ||
        "/images/image1.png"
    };

    setUserAccount(nextAccount);
    setLocalAccount(nextAccount);
    navigate("/profile");
  }

  return (
    <>
      <Header />
      <main className="profile-editor-shell">
        <section className="profile-editor-hero">
          <Link to="/profile" className="hero-back-link" aria-label="Go back">
            <i className="fa-solid fa-arrow-left" />
          </Link>
          <div className="editor-kicker">Reader Profile</div>
          <h1>Edit your reader profile.</h1>
          <p>Update the information shown in reader mode, then save it back to your profile.</p>
        </section>

        <section className="profile-editor-layout">
          <form className="profile-editor-form" onSubmit={handleSubmit}>
            <section className="profile-editor-panel">
              <div className="panel-head">
                <div>
                  <div className="panel-kicker">Identity</div>
                  <h2>Reader details</h2>
                </div>
              </div>

              <div className="profile-editor-grid">
                <label className="profile-editor-field profile-editor-field-wide">
                  <span>Profile Cover Image</span>
                  <div className="profile-upload-card">
                    <div
                      className="profile-upload-preview cover-preview"
                      style={{
                        backgroundImage: `linear-gradient(135deg, rgba(107, 70, 193, 0.28), rgba(73, 199, 255, 0.22)), url("${coverPreview}")`
                      }}
                    />
                    <input type="file" accept="image/*" name="coverImage" onChange={handleCoverChange} />
                    <small>Upload a wide cover image for your reader profile card.</small>
                  </div>
                </label>
                <label className="profile-editor-field">
                  <span>Profile Avatar</span>
                  <div className="profile-upload-card">
                    <img className="profile-upload-preview avatar-preview" src={avatarPreview} alt="Reader avatar preview" />
                    <input type="file" accept="image/*" name="avatar" onChange={handleAvatarChange} />
                    <small>Choose the profile image readers will see.</small>
                  </div>
                </label>
                {[
                  ["Display Name", "displayName", "text", false],
                  ["Username", "username", "text", true],
                  ["Email", "email", "email", true],
                  ["Phone Number", "phoneNumber", "tel", false],
                  ["Birthdate", "birthdate", "date", false]
                ].map(([label, name, type, required]) => (
                  <label className="profile-editor-field" key={name}>
                    <span>{label}</span>
                    <input
                      type={type}
                      name={name}
                      required={required}
                      value={formState[name]}
                      onChange={(event) => updateField(name, event.target.value)}
                    />
                  </label>
                ))}
                <label className="profile-editor-field profile-editor-field-wide">
                  <span>Place</span>
                  <input type="text" name="place" value={formState.place} onChange={(event) => updateField("place", event.target.value)} />
                </label>
                <label className="profile-editor-field profile-editor-field-wide">
                  <span>Bio</span>
                  <textarea name="bio" rows="5" value={formState.bio} onChange={(event) => updateField("bio", event.target.value)} />
                </label>
              </div>
            </section>

            <div className="profile-editor-actions">
              <Link to="/profile" className="profile-editor-btn secondary">Cancel</Link>
              <button type="submit" className="profile-editor-btn primary">Save Changes</button>
            </div>
          </form>

          <aside className="profile-editor-sidebar">
            <section className="profile-editor-side-card">
              <h2>Reader mode</h2>
              <p>Your reader profile is the account view readers see first. You can still connect creator mode later without losing this identity.</p>
            </section>
          </aside>
        </section>
      </main>
    </>
  );
}
