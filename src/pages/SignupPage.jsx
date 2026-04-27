import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Header from "../components/layout/Header";
import {
  getCreatorProfile,
  getUserAccount,
  readFileAsDataUrl,
  setUserAccount,
  syncSupabaseSessionUser
} from "../lib/account";
import { fetchCurrentCreatorProfile } from "../lib/creatorBackend";
import { supabase } from "../lib/supabase";
import { useBodyPage } from "../lib/useBodyPage";
import "../styles/legacy/signup.css";

const ROLES = {
  reader: {
    title: "Reader Account",
    signinTitle: "Sign in to your account",
    signupTitle: "Create your reader account",
    hero: "Create one shared TooU login first, then unlock creator mode later if you want to publish.",
    helper: "Reader mode is the base identity for every account.",
    submitSignin: "Sign In",
    submitSignup: "Create Reader Account",
    redirect: "/profile"
  },
  creator: {
    title: "Creator Access",
    signinTitle: "Sign in to creator mode",
    signupTitle: "Become a creator after signup",
    hero: "Use the same TooU login for both reader mode and creator mode.",
    helper: "Creator mode is added on top of the base account instead of creating a second login.",
    submitSignin: "Sign In",
    submitSignup: "Continue",
    redirect: "/creator-dashboard"
  }
};

const SOCIALS = [
  ["google", "fa-google", "Google"],
  ["facebook", "fa-facebook-f", "Facebook"],
  ["github", "fa-github", "GitHub"]
];

const POLICY_LINKS = {
  terms: "/terms#terms",
  verification: "/terms#verification",
  guidelines: "/terms#guidelines"
};

export default function SignupPage() {
  useBodyPage("signup");
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const existingAccount = useMemo(() => getUserAccount(), []);
  const existingCreator = useMemo(() => getCreatorProfile(), []);
  const hasReaderAccount = Boolean(existingAccount);
  const role = searchParams.get("role") === "creator" ? "creator" : "reader";
  const view = searchParams.get("view") === "signup" ? "signup" : "signin";
  const active = ROLES[role];

  const [authError, setAuthError] = useState("");
  const [message, setMessage] = useState(
    "Use one shared TooU login first. Creator mode is added after sign-in."
  );
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReaderSignupForm, setShowReaderSignupForm] = useState(() => !hasReaderAccount);
  const [readerAcceptedTerms, setReaderAcceptedTerms] = useState(false);
  const [signInState, setSignInState] = useState({
    identifier:
      role === "creator"
        ? existingCreator?.email || existingAccount?.email || existingAccount?.username || ""
        : existingAccount?.email || existingAccount?.username || "",
    password: ""
  });
  const [readerState, setReaderState] = useState({
    username: existingAccount?.username || existingCreator?.readerName || "",
    email: existingAccount?.email || existingCreator?.email || "",
    password: "",
    confirmPassword: "",
    phoneNumber: existingAccount?.phone_number || "",
    birthdate: existingAccount?.birthdate || "",
    place: existingAccount?.place || "",
    contentInterests: existingAccount?.content_interests || [],
    genreInterests: existingAccount?.genre_interests || []
  });

  const setRoute = (nextView, nextRole = role) => {
    setAuthError("");
    setIsSuccess(false);
    setSearchParams({ view: nextView, role: nextRole });
  };

  const revealAlternateSignup = () => {
    setShowReaderSignupForm(true);
    setRoute("signup", "reader");
  };

  const patchState = (setter, key, value) => {
    setter((current) => ({ ...current, [key]: value }));
    setAuthError("");
  };

  const toggleList = (setter, key, value) =>
    setter((current) => {
      const next = new Set(current[key]);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return { ...current, [key]: [...next] };
    });

  useEffect(() => {
    setSignInState((current) => ({
      ...current,
      identifier:
        role === "creator"
          ? existingCreator?.email || existingAccount?.email || existingAccount?.username || ""
          : existingAccount?.email || existingAccount?.username || ""
    }));
  }, [
    role,
    existingAccount?.email,
    existingAccount?.username,
    existingCreator?.email
  ]);

  async function handleOAuth(provider) {
    setAuthError("");
    const redirectTo = `${window.location.origin}${role === "creator" ? "/creator-dashboard" : active.redirect}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo }
    });
    if (error) setAuthError(error.message || `${provider} sign-in is not available yet.`);
  }

  async function handleSignInSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setAuthError("");
    const identifier = signInState.identifier.trim();
    const storedEmail = existingAccount?.email || existingCreator?.email || "";
    const email = identifier.includes("@") ? identifier : storedEmail || identifier;
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: signInState.password
    });
    setIsSubmitting(false);
    if (error) return setAuthError(error.message || "Sign in failed. Please check your account details.");

    const user = data.user;
    syncSupabaseSessionUser(user);
    setUserAccount({
      displayName:
        existingAccount?.displayName ||
        existingAccount?.username ||
        user.user_metadata?.display_name ||
        user.user_metadata?.username ||
        user.email?.split("@")[0] ||
        identifier,
      email: user.email || existingAccount?.email || "",
      username:
        existingAccount?.username ||
        user.user_metadata?.username ||
        user.email?.split("@")[0] ||
        identifier,
      avatar: existingAccount?.avatar || "https://i.pravatar.cc/120?img=12",
      coins: existingAccount?.coins ?? 50,
      eggsPurchasedTotal: existingAccount?.eggsPurchasedTotal ?? 0,
      createdAt: existingAccount?.createdAt ?? Date.now(),
      plan: existingCreator ? "Reader + Creator" : "Reader",
      bio: existingAccount?.bio || "Content enthusiast and aspiring creator",
      phone_number: existingAccount?.phone_number || "",
      birthdate: existingAccount?.birthdate || "",
      place: existingAccount?.place || "",
      content_interests: existingAccount?.content_interests || [],
      genre_interests: existingAccount?.genre_interests || [],
      supabaseUserId: user.id
    });

    setMessage(`${active.title} sign in successful.`);
    setIsSuccess(true);

    let nextRoute = active.redirect;
    if (role === "creator") {
      const currentCreatorProfile = await fetchCurrentCreatorProfile();
      nextRoute = currentCreatorProfile ? "/creator-dashboard" : "/publish";
    }

    window.setTimeout(() => navigate(nextRoute), 700);
  }

  async function handleReaderCreate(event) {
    event.preventDefault();
    setAuthError("");
    if (!readerAcceptedTerms) {
      return setAuthError("Please accept the terms and conditions before creating an account.");
    }
    if (readerState.password !== readerState.confirmPassword) {
      return setAuthError("Passwords do not match yet.");
    }

    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    const avatar = await readFileAsDataUrl(
      formData.get("avatar"),
      existingAccount?.avatar || "https://i.pravatar.cc/120?img=12"
    );
    const { data, error } = await supabase.auth.signUp({
      email: readerState.email,
      password: readerState.password,
      options: { data: { username: readerState.username } }
    });
    setIsSubmitting(false);
    if (error) return setAuthError(error.message || "Reader account signup failed.");

    syncSupabaseSessionUser(data.user);
    setUserAccount({
      displayName: readerState.username,
      username: readerState.username,
      email: readerState.email,
      phone_number: readerState.phoneNumber || "",
      birthdate: readerState.birthdate || "",
      place: readerState.place || "",
      content_interests: readerState.contentInterests,
      genre_interests: readerState.genreInterests,
      avatar,
      coins: existingAccount?.coins ?? 50,
      eggsPurchasedTotal: existingAccount?.eggsPurchasedTotal ?? 0,
      createdAt: existingAccount?.createdAt ?? Date.now(),
      plan: "Reader",
      bio: existingAccount?.bio || "Content enthusiast and aspiring creator",
      supabaseUserId: data.user?.id || existingAccount?.supabaseUserId || ""
    });
    setMessage("Reader account created. Please sign in to continue.");
    setIsSuccess(true);
    window.setTimeout(() => setRoute("signin", "reader"), 700);
  }

  const topPrompt =
    view === "signin"
      ? ["If you don't have an account,", "Create account", () => revealAlternateSignup()]
      : ["Already have an account?", "Sign in", () => setRoute("signin", role)];

  const savedReaderName = existingAccount?.username || "Reader account";
  const savedCard = existingAccount
    ? {
        title: "Saved account",
        name: savedReaderName,
        email: existingAccount.email || "",
        avatar: existingAccount.avatar || "https://i.pravatar.cc/120?img=12",
        description:
          role === "creator"
            ? "Use this shared login, then continue into creator onboarding."
            : "Your saved reader profile is ready to use."
      }
    : null;
  const shouldShowSavedSignupCard =
    view === "signup" && role === "reader" && hasReaderAccount && !showReaderSignupForm;

  return (
    <>
      <Header />
      <main className="signup-shell">
        <section className="signup-stage">
          <div className="signup-backdrop signup-backdrop-one" />
          <div className="signup-backdrop signup-backdrop-two" />

          <section className="signup-card auth-card">
            <Link to="/" className="hero-back-link auth-back-link" aria-label="Go back">
              <i className="fa-solid fa-arrow-left" />
            </Link>

            <div className="auth-eyebrow-row">
              <span className="hero-chip auth-chip">TooU Access</span>
              <span className="auth-mini-copy">One login, two modes</span>
            </div>

            <div className="card-head auth-centered">
              <h2>{view === "signin" ? active.signinTitle : active.signupTitle}</h2>
              <p>{active.hero}</p>
            </div>

            <div className="auth-top-link">
              <span>{topPrompt[0]} </span>
              <button type="button" className="form-text-link inline-link" onClick={topPrompt[2]}>
                {topPrompt[1]}
              </button>
            </div>

            <div className="auth-role-switch auth-role-single">
              {Object.entries(ROLES).map(([key, item]) => (
                <button
                  key={key}
                  type="button"
                  className={`auth-role-tab ${role === key ? "active" : ""}`}
                  onClick={() =>
                    setRoute(
                      view === "signup" && key === "creator" ? "signin" : view,
                      key
                    )
                  }
                >
                  {item.title}
                </button>
              ))}
            </div>

            <div className="auth-role-summary">
              <strong>{active.title}</strong>
              <span>{active.helper}</span>
            </div>

            {role === "creator" && view === "signup" ? (
              <section className="saved-account-card">
                <div className="saved-account-head">
                  <strong>Creator mode comes after account signup</strong>
                  <span>
                    Start with a shared reader account, then open creator onboarding to choose
                    individual creator or studio mode.
                  </span>
                </div>
                <div className="saved-account-actions">
                  <button
                    type="button"
                    className="saved-account-btn primary"
                    onClick={() => setRoute(hasReaderAccount ? "signin" : "signup", "reader")}
                  >
                    {hasReaderAccount ? "Use existing login" : "Create reader account"}
                  </button>
                  {hasReaderAccount ? (
                    <button
                      type="button"
                      className="saved-account-btn"
                      onClick={() => navigate("/publish")}
                    >
                      Open creator onboarding
                    </button>
                  ) : null}
                </div>
              </section>
            ) : null}

            {savedCard ? (
              <section className="saved-account-card">
                <div className="saved-account-head">
                  <strong>{savedCard.title}</strong>
                  <span>{savedCard.description}</span>
                </div>
                <div className="saved-account-profile">
                  <img src={savedCard.avatar} alt={savedCard.name} />
                  <div>
                    <strong>{savedCard.name}</strong>
                    <span>{savedCard.email}</span>
                  </div>
                </div>
                <div className="saved-account-actions">
                  <button
                    type="button"
                    className="saved-account-btn primary"
                    onClick={() => {
                      setSignInState((current) => ({
                        ...current,
                        identifier: savedCard.email || savedCard.name
                      }));
                      setRoute("signin", role);
                    }}
                  >
                    Open this account
                  </button>
                  <button
                    type="button"
                    className="saved-account-btn"
                    onClick={() => revealAlternateSignup()}
                  >
                    Create another account
                  </button>
                </div>
              </section>
            ) : null}

            {view === "signin" ? (
              <form className="signup-form auth-compact-form" onSubmit={handleSignInSubmit}>
                <div className="field-grid auth-simple-grid">
                  <label className="field">
                    <span>Username or Email</span>
                    <input
                      type="text"
                      name="identifier"
                      placeholder="Enter your username or email"
                      required
                      value={signInState.identifier}
                      onChange={(event) =>
                        patchState(setSignInState, "identifier", event.target.value)
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Password</span>
                    <input
                      type="password"
                      name="password"
                      placeholder="Enter your password"
                      required
                      value={signInState.password}
                      onChange={(event) =>
                        patchState(setSignInState, "password", event.target.value)
                      }
                    />
                  </label>
                </div>

                <div className="social-auth-row">
                  {SOCIALS.map(([provider, icon, label]) => (
                    <button
                      key={provider}
                      type="button"
                      className="social-auth-btn"
                      aria-label={`Continue with ${label}`}
                      onClick={() => handleOAuth(provider)}
                    >
                      <i className={`fa-brands ${icon}`} />
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  className="submit-btn auth-primary-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Signing in..." : active.submitSignin}
                </button>
              </form>
            ) : role === "creator" ? (
              <div className="saved-account-empty-state">
                <p>
                  Creator mode now lives behind the same shared login as reader mode. Finish account
                  signup first, then continue from the creator onboarding page.
                </p>
              </div>
            ) : shouldShowSavedSignupCard ? (
              <div className="saved-account-empty-state">
                <p>
                  This account already exists on this device. Use it now or choose Create another
                  account to open a fresh signup form.
                </p>
              </div>
            ) : (
              <form className="signup-form" onSubmit={handleReaderCreate}>
                <div className="field-grid">
                  {[
                    ["Username", "username", "text", "Choose a username"],
                    ["Email", "email", "email", "name@example.com"],
                    ["Password", "password", "password", "Create a secure password"],
                    ["Confirm Password", "confirmPassword", "password", "Confirm your password"]
                  ].map(([label, name, type, placeholder]) => (
                    <label className="field" key={name}>
                      <span>{label}</span>
                      <input
                        type={type}
                        name={name}
                        placeholder={placeholder}
                        required
                        value={readerState[name]}
                        onChange={(event) => patchState(setReaderState, name, event.target.value)}
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
                      value={readerState.phoneNumber}
                      onChange={(event) =>
                        patchState(setReaderState, "phoneNumber", event.target.value)
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Birthdate</span>
                    <input
                      type="date"
                      name="birthdate"
                      value={readerState.birthdate}
                      onChange={(event) =>
                        patchState(setReaderState, "birthdate", event.target.value)
                      }
                    />
                  </label>
                  <label className="field field-wide">
                    <span>Place</span>
                    <input
                      type="text"
                      name="place"
                      placeholder="City, State or Region"
                      value={readerState.place}
                      onChange={(event) => patchState(setReaderState, "place", event.target.value)}
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
                          checked={readerState.contentInterests.includes(item)}
                          onChange={() => toggleList(setReaderState, "contentInterests", item)}
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
                          checked={readerState.genreInterests.includes(item)}
                          onChange={() => toggleList(setReaderState, "genreInterests", item)}
                        />
                        <span>{item}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <label className="checkline">
                  <input
                    type="checkbox"
                    checked={readerAcceptedTerms}
                    onChange={(event) => setReaderAcceptedTerms(event.target.checked)}
                  />
                  <span>
                    I agree to the{" "}
                    <Link to={POLICY_LINKS.terms} className="terms-inline-link">
                      terms and conditions
                    </Link>{" "}
                    and{" "}
                    <Link to={POLICY_LINKS.guidelines} className="terms-inline-link">
                      community guidelines
                    </Link>
                    .
                  </span>
                </label>
                <button
                  type="submit"
                  className="submit-btn auth-primary-btn"
                  disabled={isSubmitting || !readerAcceptedTerms}
                >
                  {isSubmitting ? "Creating..." : active.submitSignup}
                </button>
              </form>
            )}

            {authError ? <div className="form-note error">{authError}</div> : null}
            <div className={`form-note ${isSuccess ? "success" : ""}`}>{message}</div>
          </section>
        </section>
      </main>
    </>
  );
}
