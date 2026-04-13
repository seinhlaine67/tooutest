import { Link, useLocation } from "react-router-dom";
import { getCreatorProfile, getUserAccount } from "../../lib/account";
import { useAppSettings } from "../../lib/appSettings";

export default function Header() {
  const location = useLocation();
  const { language, setLanguage, theme, setTheme, t } = useAppSettings();
  const userAccount = getUserAccount();
  const creatorProfile = getCreatorProfile();
  const isExplore = location.pathname === "/explore";
  const placeholder = isExplore
    ? t("Search stories...")
    : t("Search stories, webtoons...");
  const hasCreatorProfile = Boolean(creatorProfile);
  const coinsLabel = `🥚 ${Number(userAccount?.coins ?? 0)}`;

  return (
    <div className="site-header">
      <div className="site-header-inner">
        <div className="site-logo-area">
          <Link className="site-logo" to="/">
            <img src="/images/logo.png" alt="TooU Logo" />
            <span>TooU</span>
          </Link>
        </div>

        <div className="site-search-box">
          <i className="fa-solid fa-magnifying-glass" />
          <input type="text" placeholder={placeholder} />
        </div>

        <div className="site-actions">
          <button
            type="button"
            className="site-theme-toggle"
            aria-label="Toggle theme"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <i className={`fa-solid ${theme === "dark" ? "fa-sun" : "fa-moon"}`} />
          </button>
          <select
            className="site-language-select"
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
            aria-label="Language"
          >
            <option value="eng">ENG</option>
            <option value="my">မြန်မာ</option>
          </select>
          <Link
            to={hasCreatorProfile ? "/creator-dashboard" : "/publish"}
            className="site-btn publish"
          >
            {t(hasCreatorProfile ? "Creator Hub" : "Publish")}
          </Link>
          {userAccount ? (
            <Link to="/store" className="site-btn signup site-btn-coins">
              {coinsLabel}
            </Link>
          ) : (
            <Link to="/signup" className="site-btn signup">
              {t("Sign Up")}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
