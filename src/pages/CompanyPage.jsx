import { Link } from "react-router-dom";
import Header from "../components/layout/Header";
import BottomNav from "../components/layout/BottomNav";
import { useBodyPage } from "../lib/useBodyPage";
import "../styles/legacy/company-page.css";

export default function CompanyPage() {
  useBodyPage("company");

  return (
    <>
      <Header />
      <main className="company-page-shell">
        <section className="company-page-hero">
          <div className="company-page-copy">
            <div className="company-page-chip">TooU Company</div>
            <h1>Build, protect, and grow the TooU creator ecosystem.</h1>
            <p>
              The company side of TooU manages platform health, creator success, monetization
              policy, content review, and community trust across the full product.
            </p>
            <div className="company-page-actions">
              <Link to="/system-dashboard" className="company-page-btn primary">
                Open System Dashboard
              </Link>
              <Link to="/notice" className="company-page-btn secondary">
                View Notices
              </Link>
            </div>
          </div>

          <div className="company-page-highlight">
            <span>Platform rule</span>
            <strong>Creators can monetize after 10 published novel episodes.</strong>
            <p>
              This rule helps TooU verify creator consistency before paid content and earnings
              features are unlocked.
            </p>
          </div>
        </section>

        <section className="company-page-grid">
          <article className="company-page-card">
            <div className="company-page-card-kicker">System Dashboard</div>
            <h2>Operations and approvals</h2>
            <p>
              Review creator access, monetization eligibility, payouts, moderation, and recent
              uploads from one control center.
            </p>
            <Link to="/system-dashboard" className="company-page-link">
              Go to dashboard
            </Link>
          </article>

          <article className="company-page-card">
            <div className="company-page-card-kicker">Creator Success</div>
            <h2>Support the creators</h2>
            <p>
              Track growth, approve quality creators, and shape sustainable monetization rules
              for novels, webtoons, comics, and knowledge.
            </p>
          </article>

          <article className="company-page-card">
            <div className="company-page-card-kicker">Community Safety</div>
            <h2>Protect readers and content</h2>
            <p>
              Moderate reports, review sensitive content, and keep TooU welcoming for readers,
              writers, and studios.
            </p>
          </article>
        </section>
      </main>
      <BottomNav />
    </>
  );
}
