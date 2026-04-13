import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAppSettings } from "../../lib/appSettings";

const items = [
  { to: "/", label: "Home", icon: "fa-house" },
  { to: "/explore", label: "Explore", icon: "fa-compass" },
  { to: "/library", label: "Library", icon: "fa-book" },
  { to: "/store", label: "Store", icon: "fa-store" },
  { to: "/profile", label: "Profile", icon: "fa-user" }
];

export default function BottomNav() {
  const location = useLocation();
  const { t } = useAppSettings();
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let lastScroll = window.pageYOffset;

    function handleScroll() {
      const currentScroll = window.pageYOffset;
      if (currentScroll <= 8) {
        setHidden(false);
      } else if (currentScroll > lastScroll) {
        setHidden(true);
      } else {
        setHidden(false);
      }
      lastScroll = currentScroll;
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className={`site-navbar ${hidden ? "hide" : ""}`} id="navbar">
      {items.map((item) => {
        const active =
          item.to === "/"
            ? location.pathname === "/"
            : location.pathname.startsWith(item.to);

        return (
          <Link
            key={item.to}
            to={item.to}
            className={`site-nav-item ${active ? "active" : ""}`}
          >
            <i className={`fa-solid ${item.icon}`} />
            <span>{t(item.label)}</span>
          </Link>
        );
      })}
    </div>
  );
}
