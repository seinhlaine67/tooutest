import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./components/layout/AppShell";
import AnalyticsPage from "./pages/AnalyticsPage";
import CommunityDiscussionPage from "./pages/CommunityDiscussionPage";
import CommunityPage from "./pages/CommunityPage";
import CompanyPage from "./pages/CompanyPage";
import CreatorInfoPage from "./pages/CreatorInfoPage";
import CreatorProfileEditorPage from "./pages/CreatorProfileEditorPage";
import DetailPage from "./pages/DetailPage";
import ExplorePage from "./pages/ExplorePage";
import HomePage from "./pages/HomePage";
import CreatorDashboardPage from "./pages/CreatorDashboardPage";
import LibraryPage from "./pages/LibraryPage";
import NoticePage from "./pages/NoticePage";
import PaymentPage from "./pages/PaymentPage";
import ProfilePage from "./pages/ProfilePage";
import ProfileEditorPage from "./pages/ProfileEditorPage";
import PublishPage from "./pages/PublishPage";
import SeriesEditorPage from "./pages/SeriesEditorPage";
import SignupPage from "./pages/SignupPage";
import StorePage from "./pages/StorePage";
import SystemDashboardPage from "./pages/SystemDashboardPage";
import UploadPage from "./pages/UploadPage";

export default function App() {
  return (
    <Routes>
      <Route path="/detail" element={<DetailPage />} />
      <Route path="/creator-dashboard" element={<CreatorDashboardPage />} />
      <Route path="/creator-profile-editor" element={<CreatorProfileEditorPage />} />
      <Route path="/series-editor" element={<SeriesEditorPage />} />
      <Route path="/analytics" element={<AnalyticsPage />} />
      <Route path="/creator-info" element={<CreatorInfoPage />} />
      <Route path="/community" element={<CommunityPage />} />
      <Route path="/community-discussion" element={<CommunityDiscussionPage />} />
      <Route path="/notice" element={<NoticePage />} />
      <Route path="/company" element={<CompanyPage />} />
      <Route path="/system-dashboard" element={<SystemDashboardPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/payment" element={<PaymentPage />} />
      <Route path="/publish" element={<PublishPage />} />
      <Route path="/profile-editor" element={<ProfileEditorPage />} />
      <Route path="/upload" element={<UploadPage />} />
      <Route element={<AppShell />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/store" element={<StorePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
