import { Link } from "react-router-dom";
import Header from "../components/layout/Header";
import { useBodyPage } from "../lib/useBodyPage";
import "../styles/legacy/signup.css";

const POLICY_SECTIONS = [
  {
    id: "terms",
    kicker: "TooU Policies",
    title: "Terms and Conditions",
    body:
      "You agree to provide accurate account details, keep your login secure, and use TooU in a way that does not harm readers, creators, or the platform."
  },
  {
    id: "verification",
    kicker: "Creator Setup",
    title: "Creator Verification Rules",
    body:
      "Creators and studios must provide truthful identity information, upload valid verification documents, and ensure founder or owner details are accurate before publishing or payout setup."
  },
  {
    id: "guidelines",
    kicker: "Community",
    title: "Community Guidelines",
    body:
      "Stories, comments, images, and profile details must follow community standards, respect copyright, avoid harassment, and not mislead readers or other creators."
  }
];

export default function TermsPage() {
  useBodyPage("terms");

  return (
    <>
      <Header />
      <main className="signup-shell">
        <section className="signup-stage">
          <section className="signup-card auth-card terms-card">
            <Link to="/signup" className="hero-back-link auth-back-link" aria-label="Go back">
              <i className="fa-solid fa-arrow-left" />
            </Link>

            <div className="auth-eyebrow-row">
              <span className="hero-chip auth-chip">TooU Policies</span>
              <span className="auth-mini-copy">All account rules on one page</span>
            </div>

            <div className="card-head auth-centered">
              <h2>Account Policies</h2>
              <p>
                This page contains the terms and conditions, creator verification rules,
                and community guidelines used in the signup flow.
              </p>
            </div>

            <nav className="terms-nav" aria-label="Policy sections">
              {POLICY_SECTIONS.map((section) => (
                <a key={section.id} href={`#${section.id}`} className="terms-nav-link">
                  {section.title}
                </a>
              ))}
            </nav>

            <div className="terms-list">
              {POLICY_SECTIONS.map((section) => (
                <article className="terms-item" key={section.id} id={section.id}>
                  <span className="terms-kicker">{section.kicker}</span>
                  <h3>{section.title}</h3>
                  <p>{section.body}</p>
                </article>
              ))}
            </div>
          </section>
        </section>
      </main>
    </>
  );
}
