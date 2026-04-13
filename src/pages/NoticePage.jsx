import { Link } from "react-router-dom";
import BottomNav from "../components/layout/BottomNav";
import Header from "../components/layout/Header";
import { featureNotice, noticeItems } from "../lib/communityData";
import { useBodyPage } from "../lib/useBodyPage";
import "../styles/legacy/notice.css";

export default function NoticePage() {
  useBodyPage("notice");

  return (
    <>
      <Header />
      <div className="container">
        <section className="notice-hero">
          <Link to="/" className="page-back-link">
            <i className="fa-solid fa-arrow-left" />
            <span>Back to Home</span>
          </Link>
          <div className="notice-kicker">Notice</div>
          <h1>Announcements, promotions, and platform updates.</h1>
          <p>
            This is where TooU can publish campaign notices, release updates, reader benefits, and official company announcements.
          </p>
        </section>

        <section
          className="notice-feature"
          style={{ "--bg-image": `url('${featureNotice.image}')` }}
        >
          <div className="feature-content">
            <div className="feature-tag">{featureNotice.tag}</div>
            <div className="feature-title">{featureNotice.title}</div>
            <div className="feature-copy">{featureNotice.copy}</div>
          </div>
        </section>

        <section className="section">
          <div className="section-heading">
            <div>
              <div className="section-title">Latest Announcements</div>
              <div className="section-copy">
                A mobile-first stream of company notices that can later be powered by your backend or CMS.
              </div>
            </div>
          </div>
          <div className="notice-list">
            {noticeItems.map((item) => (
              <article className="notice-card" key={`${item.date}-${item.title}`}>
                <div className="notice-topline">
                  <div className="notice-type">
                    <i className="fa-solid fa-bullhorn" />
                    {item.type}
                  </div>
                  <div className="notice-date">{item.date}</div>
                </div>
                <div className="notice-title">{item.title}</div>
                <div className="notice-body">{item.body}</div>
              </article>
            ))}
          </div>
        </section>
      </div>
      <BottomNav />
    </>
  );
}
