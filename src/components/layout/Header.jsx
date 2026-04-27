import { Link, useLocation } from "react-router-dom";
import { getUserAccount } from "../../lib/account";
import { useAppSettings } from "../../lib/appSettings";

const MYANMAR_LABEL = "\u1019\u103c\u1014\u103a\u1019\u102c";

export default function Header() {
  const location = useLocation();
  const { language, setLanguage, theme, setTheme, t } = useAppSettings();
  const userAccount = getUserAccount();
  const isExplore = location.pathname === "/explore";
  const placeholder = isExplore
    ? t("Search stories...")
    : t("Search stories, webtoons...");

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
            <option value="eng">EN</option>
            <option value="my">{MYANMAR_LABEL}</option>
          </select>
          {userAccount ? (
            <Link to="/store" className="site-btn signup site-btn-coins">
              <span aria-hidden="true">🥚</span>
              <span>{Number(userAccount?.coins ?? 0)}</span>
            </Link>
          ) : (
            <Link to="/signup?role=reader&view=signin" className="site-btn signup">
              {t("Sign Up")}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
