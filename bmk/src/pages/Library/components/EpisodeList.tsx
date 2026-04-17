// src/components/EpisodeList.tsx
import { Link } from "react-router-dom";
import type { Episode } from "../../../lib/types";
import { useAuth } from "../../../hooks/useAuth";

interface EpisodeListProps {
  episodes: Episode[];
  seriesId: string;
  isCreator: boolean;
}

export function EpisodeList({
  episodes,
  seriesId,
  isCreator,
}: EpisodeListProps) {
  const { user } = useAuth();

  if (episodes.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No episodes yet</p>
        {isCreator && (
          <Link
            to={`/creator/series/${seriesId}/episodes/new`}
            className="inline-block mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg"
          >
            Create First Episode
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {episodes.map((episode) => {
        const isLocked = episode.is_locked && !isCreator;
        const isRead = episode.reading_progress?.completed;
        const hasProgress = episode.reading_progress && !isRead;

        return (
          <Link
            key={episode.id}
            to={isLocked ? "#" : `/read/${episode.id}`}
            className={`block p-4 border rounded-lg transition-colors ${
              isLocked
                ? "bg-gray-50 cursor-not-allowed opacity-75"
                : "hover:bg-gray-50"
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-mono text-gray-500 text-sm">
                    Episode {episode.episode_number}
                  </span>
                  {episode.is_premium && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                      Premium
                    </span>
                  )}
                  {isRead && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                      ✓ Read
                    </span>
                  )}
                  {hasProgress && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                      In Progress
                    </span>
                  )}
                </div>

                <h3 className="font-semibold text-lg mb-1">{episode.title}</h3>
                {episode.description && (
                  <p className="text-gray-600 text-sm line-clamp-2">
                    {episode.description}
                  </p>
                )}

                <div className="flex gap-4 mt-3 text-xs text-gray-500">
                  <span>❤️ {episode.like_count}</span>
                  <span>💬 {episode.comment_count}</span>
                  <span>👁️ {episode.view_count}</span>
                  {episode.word_count && (
                    <span>📝 {episode.word_count.toLocaleString()} words</span>
                  )}
                </div>
              </div>

              <div className="ml-4">
                {isLocked ? (
                  <div className="text-center">
                    <div className="text-yellow-600 text-sm mb-1">
                      🔒 Premium
                    </div>
                    <div className="text-xs text-gray-500">
                      ${episode.price}
                    </div>
                  </div>
                ) : (
                  <div className="text-blue-500">
                    {hasProgress ? "Continue Reading →" : "Start Reading →"}
                  </div>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            {hasProgress && (
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-1">
                  <div
                    className="bg-blue-500 rounded-full h-1 transition-all"
                    style={{
                      width: `${(episode.reading_progress!.last_position / 100) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </Link>
        );
      })}
    </div>
  );
}
