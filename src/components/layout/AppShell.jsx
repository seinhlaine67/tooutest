import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import BottomNav from "./BottomNav";
import Footer from "./Footer";
import Header from "./Header";

export default function AppShell() {
  const location = useLocation();
  const pageName = location.pathname === "/" ? "home" : location.pathname.slice(1);

  useEffect(() => {
    document.body.dataset.page = pageName;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });

    return () => {
      delete document.body.dataset.page;
    };
  }, [pageName]);

  return (
    <div>
      <Header />
      <div className="container">
        <Outlet />
        <Footer />
      </div>
      <BottomNav />
    </div>
  );
}
