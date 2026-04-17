import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";
import { useReadingProgress } from "../hooks/useReadingProgress";
import { callEdgeFunction } from "../lib/supabase";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";

interface NovelBlock {
  id: string;
  block_order: number;
  block_type: string;
  content: any;
}

interface SeriesData {
  id: string;
  creator_id: string;
  is_premium: boolean;
  slug: string;
  title: string;
}

interface EpisodeData {
  episode: {
    id: string;
    title: string;
    series: SeriesData;
    content: NovelBlock[];
    user_context: {
      liked: boolean;
      reading_progress: { last_position: number } | null;
      is_bookmarked: boolean;
    };
  };
}

export const EpisodeReader = () => {
  let { episodeId } = useParams();
  const { user } = useAuth();
  const { savePosition } = useReadingProgress(episodeId || "");

  // fix episodeId for testing purpose
  episodeId = "c5fb1f3d-9f05-4a51-9ce0-5c59fed10050";

  const [scrollPosition, setScrollPosition] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  // State for UI feedback when saving position
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // fetch episode data
  const { data, isLoading, error, refetch } = useQuery<EpisodeData>({
    queryKey: ["episode", episodeId],
    queryFn: async () => {
      const result: EpisodeData = await callEdgeFunction("get-episode", {
        queryParams: { episode_id: episodeId },
        method: "GET",
      });
      // throw Error("Failed to fetch episode"); // Simulate error for testing

      return result;
    },
    enabled: !!episodeId,
    retry: 2,
  });

  // Restore scroll position on load from saved progress
  useEffect(() => {
    if (
      data?.episode.user_context.reading_progress?.last_position &&
      contentRef.current
    ) {
      const savedPosition =
        data.episode.user_context.reading_progress.last_position;
      contentRef.current.scrollTop = savedPosition;
      console.log("Restored to scroll position: ", savedPosition);
    }
  }, [data]);

  // Save scroll position on scroll (with debounce)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleScroll = () => {
      if (contentRef.current) {
        const position = contentRef.current.scrollTop;
        setScrollPosition(position);

        // clear previous timeout
        if (timeoutId) clearTimeout(timeoutId);

        // debounce save (wait 1 second after user stops scrolling)
        timeoutId = setTimeout(() => {
          // Check if user scrolled to bottom (90% or more of the content)

          const isNearBottom =
            contentRef.current.scrollTop + contentRef.current.clientHeight >=
            contentRef.current.scrollHeight;

          // show saving indicator
          setIsSaving(true);

          // if near bottom, completed = true, otherwise false
          savePosition(position, isNearBottom);

          // Hide saving indicator after 500 ms
          setTimeout(() => {
            setIsSaving(false);
            setLastSaved(new Date());
          }, 500);

          console.log(
            "Saved Position: ",
            position,
            "Completed: ",
            isNearBottom,
          );
        }, 1000); // wait 1 second of no scrolling before saving
      }
    };

    const currentRef = contentRef.current;

    if (currentRef) {
      currentRef.addEventListener("scroll", handleScroll);
    }
    // currentRef?.addEventListener("scroll", handleScroll);

    return () => {
      if (currentRef) {
        currentRef.removeEventListener("scroll", handleScroll);
      }
    };
  }, [savePosition]);

  // handle like action
  const handleLike = async () => {
    if (!user) return;
    console.log("Toggling like for user: ", user);

    try {
      await callEdgeFunction("toggle-like", {
        payload: {
          target_type: "episode",
          target_id: episodeId,
        },
      });
      // refetch to update like status
      refetch();
    } catch (error) {
      console.error("Failed to like: ", error);
    }
  };

  /**
   * TODO: check this fn again
   */
  // handle bookmark action
  const handleBookmark = async () => {
    if (!user) return;
    console.log("data", data);

    try {
      await callEdgeFunction("toggle-bookmark", {
        payload: { series_id: data.episode.series.id },
      });

      refetch();
    } catch (error) {
      console.error("Failed to bookmark: ", error);
    }
  };

  // render rich text content
  const renderContent = (block: NovelBlock) => {
    if (!block.content || !block.content.content) return null;

    switch (block.block_type) {
      case "heading":
        return (
          <h1 className="text-2xl font-bold my-4">
            {block.content.content.map((item: any, index: number) => (
              <span
                key={index}
                className={item.marks?.includes("bold") ? "font-bold" : ""}
              >
                {item.text}
              </span>
            ))}
          </h1>
        );
      case "paragraph":
        return (
          <p className="my-3 leading-relaxed">
            {block.content.content.map((item: any, index: number) => (
              <span
                key={index}
                className={`
                    ${item.marks?.includes("italic") ? "italic" : ""} 
                    ${item.marks?.includes("bold") ? "font-bold" : ""}
                `}
              >
                {item.text}
              </span>
            ))}
          </p>
        );

      default:
        return null;
    }
  };

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading episode...</p>
        </div>
      </div>
    );
  if (error)
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center text-red-500">
          <p className="text-xl">Error loading episodes</p>
          <p className="text-sm mt-2">{error.message}</p>
        </div>
        <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Try Again
        </button>
      </div>
    );

  if (!data) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-gray-600">Episode not found</p>
      </div>
    );
  }

  if (data.episode.is_premium && !data.episode.user_context.reading_progress) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Pemium Content</h1>
          <p className="text-gray-6006 mb-">This is a premium episode</p>
          <button className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600">
            Purchase for $4.99
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{data.episode.title}</h1>
        {data.episode.description && (
          <p className="text-gray-600 italic">{data.episode.description}</p>
        )}
      </div>

      <div className="sticky top-0 bg-white border-b mb-8 pb-4">
        <div className="flex justify-between items-center">
          <div className="flex gap-4">
            <button
              onClick={handleLike}
              className={`px-4 py-2 rounded-lg transition-colors ${
                data.episode.user_context.liked
                  ? "bg-red-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {data.episode.user_context.liked ? "❤️ Liked" : "🤍 Like"}
            </button>
            <button
              onClick={handleBookmark}
              className={`px-4 py-2 rounded-lg transition-colors ${
                data.episode.user_context.is_bookmarked
                  ? "bg-yellow-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {data.episode.user_context.is_bookmarked
                ? "📖 Bookmarked"
                : "🔖 Bookmark"}
            </button>
          </div>

          {/* Save indicator */}
          <div className="text-sm text-gray-500">
            {isSaving && (
              <span className="animate-pulse">Saving progress...</span>
            )}
            {!isSaving && lastSaved && (
              <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
            )}
          </div>
        </div>
      </div>

      {/* Episode content */}
      <div
        ref={contentRef}
        className="prose prose-lg max-w-none h-[calc(100vh-200px)] overflow-y-auto px-4"
        style={{ scrollBehavior: "smooth" }}
      >
        {data.episode.content.map((block) => (
          <div key={block.id}>{renderContent(block)}</div>
        ))}

        {/* End of episode indicator */}
        <div className="text-center py-8 text-gray-400 border-t mt-8">
          <p>— End of Chapter —</p>
          <button className="mt-4 text-blue-500 hover:text-blue-600">
            Next Chapter →
          </button>
        </div>
      </div>
    </div>
  );
};
