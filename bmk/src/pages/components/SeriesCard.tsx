// src/components/SeriesCard.tsx
import { Link } from "react-router-dom";
import type { Series } from "../../../lib/types";

interface SeriesCardProps {
  series: Series;
}

export function SeriesCard({ series }: SeriesCardProps) {
  const defaultCover = `https://placehold.co/400x300/1e40af/white?text=${encodeURIComponent(series.title)}`;

  return (
    <Link to={`/series/${series.slug}`} className="group">
      <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow">
        <div className="aspect-[3/4] overflow-hidden">
          <img
            src={series.cover_image_url || defaultCover}
            alt={series.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-bold text-lg line-clamp-1">{series.title}</h3>
            {series.is_premium && (
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                Premium
              </span>
            )}
          </div>

          <p className="text-gray-600 text-sm line-clamp-2 mb-3">
            {series.description || "No description available"}
          </p>

          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <span>📖 {series.total_episodes} eps</span>
              <span>👁️ {series.total_views.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <span>by {series.creator.profiles.username}</span>
            </div>
          </div>

          {/* Genre tags */}
          <div className="flex flex-wrap gap-1 mt-3">
            {series.genre.slice(0, 3).map((g) => (
              <span
                key={g}
                className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
              >
                {g}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}
