// src/pages/Library.tsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { callEdgeFunction } from "../../lib/supabase";
import { SeriesCard } from "../components/SeriesCard";
import LoadingSpinner from "../components/LoadingSpinner";

type LibraryTab = "reading" | "bookmarked" | "purchased";

interface TransformedSeries {
  id: string;
  title: string;
  slug: string;
  cover_image_url: string | null;
  content_type: "novel" | "webtoon";
  total_episodes: number;
  total_views: number;
  total_likes: number;
  description: string;
  genre: string[];
  status: string;
  is_premium: boolean;
  creator: {
    id: string;
    profiles: {
      username: string;
      avatar_url: string | null;
    };
  };
  progress?: {
    last_position: number;
    last_read_at: string;
  };
}

export function Library() {
  const [activeTab, setActiveTab] = useState<LibraryTab>("reading");

  const { data, isLoading, error } = useQuery({
    queryKey: ["user-library", activeTab],
    queryFn: () =>
      callEdgeFunction("get-user-library", {
        queryParams: { type: activeTab },
        method: "GET",
      }),
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div>Error: {error.message}</div>;

  const rawLibrary = data?.library || [];

  const transformedLibrary: TransformedSeries[] = rawLibrary.map(
    (item: any) => {
      // For reading tab - has progress object
      if (activeTab === "reading") {
        return {
          id: item.id,
          title: item.title,
          slug: item.slug,
          cover_image_url: item.cover_image_url,
          content_type: item.content_type,
          total_episodes: item.total_episodes,
          total_views: 0, // Not available in this response
          total_likes: 0, // Not available in this response
          description: "", // Not available in this response
          genre: [], // Not available in this response
          status: "published",
          is_premium: false,
          creator: {
            id: "",
            profiles: {
              username: "",
              avatar_url: null,
            },
          },
          progress: item.progress,
        };
      }

      // For bookmarked tab
      if (activeTab === "bookmarked") {
        return {
          id: item.id,
          title: item.title,
          slug: item.slug,
          cover_image_url: item.cover_image_url,
          content_type: item.content_type,
          total_episodes: item.total_episodes,
          total_views: 0,
          total_likes: 0,
          description: "",
          genre: [],
          status: "published",
          is_premium: false,
          creator: {
            id: "",
            profiles: {
              username: "",
              avatar_url: null,
            },
          },
        };
      }

      // For purchased tab
      return item;
    },
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Library</h1>

      {/* Tabs */}
      <div className="flex gap-2 border-b mb-8">
        <button
          onClick={() => setActiveTab("reading")}
          className={`px-6 py-3 text-lg transition-colors ${
            activeTab === "reading"
              ? "border-b-2 border-blue-500 text-blue-500 font-semibold"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Continue Reading
        </button>
        <button
          onClick={() => setActiveTab("bookmarked")}
          className={`px-6 py-3 text-lg transition-colors ${
            activeTab === "bookmarked"
              ? "border-b-2 border-blue-500 text-blue-500 font-semibold"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Bookmarks
        </button>
        <button
          onClick={() => setActiveTab("purchased")}
          className={`px-6 py-3 text-lg transition-colors ${
            activeTab === "purchased"
              ? "border-b-2 border-blue-500 text-blue-500 font-semibold"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Purchased
        </button>
      </div>

      {/* Content */}
      {transformedLibrary.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Nothing here yet</p>
          <p className="text-gray-400 mt-2">
            {activeTab === "reading" &&
              "Start reading some series to see them here"}
            {activeTab === "bookmarked" && "Bookmark series to see them here"}
            {activeTab === "purchased" &&
              "Purchase premium episodes to see them here"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {transformedLibrary.map((item: any) => (
            <div key={item.id} className="relative">
              <SeriesCard series={item} />
              {/* Show progress badge for reading tab */}
              {activeTab === "reading" && item.progress && (
                <div className="absolute bottom-2 left-2 right-2">
                  <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2 text-xs">
                    <div className="flex justify-between mb-1">
                      <span>Reading progress</span>
                      <span>
                        {Math.round((item.progress.last_position / 100) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div
                        className="bg-blue-500 rounded-full h-1"
                        style={{
                          width: `${(item.progress.last_position / 100) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
