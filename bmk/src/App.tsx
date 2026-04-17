import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./App.css";
import { useAuth } from "./hooks/useAuth";
import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login/Login";
import { EpisodeReader } from "./components/EpisodeReader";
import Test from "./test/Test";
import Home from "./pages/Home/Home";
import { Library } from "./pages/Library/Library";
import { EpisodeEditor } from "./pages/Editor/EpisodeEditor";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import TestPage from "./pages/test-hook";
import { GenericHookTester } from "./pages/GenericHookTester";

const queryClient = new QueryClient();

function App() {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading....</div>;

  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools initialIsOpen={false} />
      <Routes>
        <Route
          path="/"
          element={user ? <Navigate to="/library" /> : <Navigate to="/login" />}
        />
        <Route path="/home" element={<Home />} />

        <Route path="/login" element={<Login />} />

        <Route
          path="/episode/:episodeId"
          element={<EpisodeReader />}
          // element={user ? <EpisodeReader /> : <Navigate to="/login" />}
        />

        <Route
          path="/creator/series/:seriesId/episodes/new"
          element={<EpisodeEditor />}
        />
        <Route
          path="/creator/series/:seriesId/episodes/:episodeId/edit"
          element={<EpisodeEditor />}
        />
        <Route path="/library" element={<Library />} />

        <Route
          path="/read/:episodeId"
          element={user ? <EpisodeReader /> : <Navigate to="/login" />}
        />

        <Route path="/test" element={<Test />} />
        <Route path="/hook-test" element={<GenericHookTester />} />
      </Routes>
    </QueryClientProvider>
  );
}

export default App;
