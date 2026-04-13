import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-brand">
        <Link className="site-footer-logo" to="/">
          <img src="/images/logo.png" alt="TooU Logo" />
          <span>TooU</span>
        </Link>
        <p>
          A mobile-first reading home for webtoons, novels, knowledge stories,
          and creator-first publishing.
        </p>
      </div>

      <div className="site-footer-grid">
        <div className="site-footer-group">
          <h3>Explore</h3>
          <Link to="/">Home</Link>
          <Link to="/explore">Discover Stories</Link>
          <Link to="/library">Reading Library</Link>
        </div>

        <div className="site-footer-group">
          <h3>Support</h3>
          <Link to="/store">Eggs and Plans</Link>
          <Link to="/notice">Notice Board</Link>
          <Link to="/community">Community</Link>
        </div>

        <div className="site-footer-group">
          <h3>Contact</h3>
          <a href="mailto:support@toou.space">support@toou.space</a>
          <a href="mailto:creators@toou.space">creators@toou.space</a>
          <span>Yangon, Myanmar</span>
        </div>
      </div>

      <div className="site-footer-bottom">
        <span>© 2026 TooU. All rights reserved.</span>
        <div className="site-footer-inline">
          <Link to="/notice">Notice Board</Link>
          <span>Privacy</span>
          <span>Terms</span>
        </div>
      </div>
    </footer>
  );
}
