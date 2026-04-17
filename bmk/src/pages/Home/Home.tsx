import { useState } from "react";
import { useSeriesList } from "../../hooks/useSeries";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import { SeriesCard } from "../components/SeriesCard";

type FilterType = "novel" | "webtoon" | "all";
type SortType = "latest" | "popular" | "trending";

const Home = () => {
  const [contentType, setContentType] = useState<FilterType>("all");
  const [sortBy, setSortBy] = useState<SortType>("lastest");
  const [selectedGenre, setSelectedGenre] = useState<string>("");

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    error,
    isLoading,
  } = useSeriesList({
    content_type: contentType === "all" ? undefined : contentType,
    sort_by: sortBy,
    genre: selectedGenre || undefined,
  });

  const allSeries = data?.pages.flatMap((page) => page.data) || [];

  if (isLoading) return <LoadingSpinner />;

  if (error) return <ErrorMessage message={error.message} />;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* headers */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Discover Stories</h1>
        <p className="text-gray-600">Explore thousands of novels and webtoon</p>
      </div>

      {/* filter */}
      <div className="flex flex-wrap gap-4 mb-8 justify-between items-center">
        <div className="flex gap-2">
          <button
            onClick={() => setContentType("all")}
            className={`px-4 py-2 rounded-lg ${
              contentType === "all"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setContentType("novel")}
            className={`px-4 py-2 rounded-lg ${
              contentType === "novel"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            Novels
          </button>
          <button
            onClick={() => setContentType("webtoon")}
            className={`px-4 py-2 rounded-lg ${
              contentType === "webtoon"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            Webtoon
          </button>
        </div>

        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortType)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="latest">Latest</option>
            <option value="popular">Most Popular</option>
            <option value="trending">Trending</option>
          </select>

          <select
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            className="border px-4 py-2 rounded-lg"
          >
            <option value="">All</option>
            <option value="Fantasy">Fantasy</option>
            <option value="Sci-Fi">Sci-Fi</option>
            <option value="Romance">Romance</option>
            <option value="Mystery">Mystery</option>
            <option value="Horror">Horror</option>
          </select>
        </div>
      </div>

      {/* series grid */}
      {allSeries.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No series found</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {allSeries.map((series) => (
              <SeriesCard key={series.id} series={series} />
            ))}
          </div>

          {/* load more button */}
          {hasNextPage && (
            <div className="text-center mt-8">
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                {isFetchingNextPage ? "Loading..." : "Load more"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Home;
