import { useParams, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useState } from "react";
import { useBookmark, useFollow, useSeriesDetail } from "../../hooks/useSeries";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";

const SeriesDetail = () => {
  const { slug } = useParams();
  const { user } = useAuth();
  const [episodePage, setEpisodePage] = useState(1);

  const { data, isLoading, error, refetch } = useSeriesDetail(slug || "");
  const bookmarkMutation = useBookmark();
  const followMutation = useFollow();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error.message} />;
  if (!data) return <div>Series not found</div>;

  const { series, episodes, pagination } = data;

  const handleBookmark = async () => {
    if (!user) {
      // redirect to login or show mesage
      return;
    }

    await bookmarkMutation.mutateAsync(series.id);
    refetch();
  };

  const handleFollow = async () => {
    if (!user) {
      return;
    }
    await followMutation.mutateAsync(series.creator.id);
    refetch();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Hero section */}
      <div className="bg-linear-to-r from-blue-50 to-purple-50 rounded-2xl p-8 mb-8">
        <div className="flex flex-col md:fled-row gap-8">
          {/* cover image */}
          <div className="md:w-64 shrink-0">
            <img
              src={
                series.cover_image_url ||
                `https://placehold.co/400x500/1e40af/white?text=${encodeURIComponent(series.title)}`
              }
              className="w-full rounded-lg shadow-lg"
            />
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
              <h1 className="text-3xl md:text-4xl font-bold">{series.title}</h1>
              {series.is_premium && (
                <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm">
                  Premium Series
                </span>
              )}
            </div>

            <div className="flex items-center gap-4 mb-4 text-gray-600">
              <Link
                to={`/creator/${series.creator.id}`}
                className="flex items-center gap-2 hover:text-blue-500"
              >
                <div className="">
                  {series.creator.profiles.avatar_url && (
                    <img
                      src={series.creator.profiles.avatar_url}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <span>
                  {series.creator.profiles.display_name ||
                    series.creator.profiles.username}
                </span>
                {series.creator.verified_creator && (
                  <span className="text-blue-500">✓</span>
                )}
              </Link>
            </div>

            <p className="text-gray-700 mb-6 leading-relax">
              {series.description}
            </p>

            <div className="flex flex-wrap gap-6 mb-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-semibold">
                  📖 {series.total_episodes}
                </span>
                <span className="text-gray-500">episodes</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-semibold">
                  📖 {series.total_episodes}
                </span>
                <span className="text-gray-500">episodes</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-semibold">
                  👁️ {series.total_views.toLocaleString()}
                </span>
                <span className="text-gray-500">views</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-semibold">
                  ❤️ {series.total_likes.toLocaleString()}
                </span>
                <span className="text-gray-500">likes</span>
              </div>
            </div>

            {/* Action Buttons */}
            {user && (
              <div className="flex gap-3">
                <button
                  onClick={handleBookmark}
                  className={`px-6 py-2 rounded-lg transition-colors ${
                    series.is_bookmarked
                      ? "bg-yellow-500 text-white"
                      : "bg-gray-200 hover:bg-gray-300"
                  }`}
                >
                  {series.is_bookmarked ? "📖 Bookmarked" : "🔖 Bookmark"}
                </button>
                <button
                  onClick={handleFollow}
                  className={`px-6 py-2 rounded-lg transition-colors ${
                    series.is_following
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 hover:bg-gray-300"
                  }`}
                >
                  {series.is_following ? "Following" : "Follow Creator"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Genres tags */}
      <div className="flex flex-wrap gap-2 mb-8">
        {series.genre.map((g: string) => (
          <span
            key={g}
            className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm"
          >
            {g}
          </span>
        ))}
      </div>

      {/* Episode pagination */}
      {pagination.total_pages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <button
            onClick={() => setEpisodePage((p) => Math.max(1, p - 1))}
            disabled={pagination.page === 1}
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() =>
              setEpisodePage((p) => Math.min(pagination.total_pages, p + 1))
            }
            disabled={!pagination.has_next}
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default SeriesDetail;
