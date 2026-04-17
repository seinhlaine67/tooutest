// src/pages/creator/EpisodeEditor.tsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { callEdgeFunction } from "../../lib/supabase";
import { RichTextEditor } from "../components/RichTextEditor";
import { convertHTMLToBlocks } from "../../lib/types";
import LoadingSpinner from "../components/LoadingSpinner";

interface EpisodeData {
  id?: string;
  series_id: string;
  episode_number: number;
  title: string;
  description?: string;
  is_premium?: boolean;
  price?: number;
  status: "draft" | "published";
  scheduled_at?: string;
  blocks: any[];
}

export function EpisodeEditor() {
  const { seriesId, episodeId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState(
    "<p>Start writing your episode...</p>",
  );
  const [isPremium, setIsPremium] = useState(false);
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [isSaving, setIsSaving] = useState(false);
  const [autoSaveTime, setAutoSaveTime] = useState<Date | null>(null);

  // Load existing episode if editing
  const { data: existingEpisode, isLoading } = useQuery({
    queryKey: ["episode", episodeId],
    queryFn: () =>
      callEdgeFunction("get-episode", {
        queryParams: { episode_id: episodeId! },
        method: "GET",
      }),
    enabled: !!episodeId,
  });

  // Load existing content
  useEffect(() => {
    if (existingEpisode?.episode) {
      setTitle(existingEpisode.episode.title);
      setDescription(existingEpisode.episode.description || "");
      setIsPremium(existingEpisode.episode.is_premium);
      setPrice(existingEpisode.episode.price?.toString() || "");
      setStatus(existingEpisode.episode.status);

      // Convert stored blocks back to HTML
      if (existingEpisode.episode.content) {
        const html = convertBlocksToHTML(existingEpisode.episode.content);
        setContent(html);
      }
    }
  }, [existingEpisode]);

  const saveMutation = useMutation({
    mutationFn: (data: EpisodeData) => {
      console.log("Saving episode with data:", data);
      return callEdgeFunction("manage-novel-episode", { payload: data });
    },
    onSuccess: (result) => {
      setIsSaving(false);
      setAutoSaveTime(new Date());
      if (!episodeId && result.episode_id) {
        navigate(
          `/creator/series/${seriesId}/episodes/${result.episode_id}/edit`,
        );
      }
      queryClient.invalidateQueries({ queryKey: ["series-detail", seriesId] });
    },
    onError: (error) => {
      setIsSaving(false);
      console.error("Save failed:", error);
      alert("Failed to save episode. Please try again.");
    },
  });

  const handleSave = async (
    saveStatus: "draft" | "published",
    isAutoSave = false,
  ) => {
    console.log("Title: ", title);
    if (!title.trim()) {
      alert("Please enter a title");
      return;
    }

    if (!isAutoSave) setIsSaving(true);

    // Convert HTML to blocks
    const blocks = convertHTMLToBlocks(content);

    const episodeData: EpisodeData = {
      id: existingEpisode?.id,
      series_id: seriesId!,
      episode_number: existingEpisode?.episode?.episode_number || 1,
      title,
      description: description || undefined,
      is_premium: isPremium,
      price: isPremium ? parseFloat(price) : undefined,
      status: saveStatus,
      blocks,
    };

    if (episodeId) {
      episodeData.id = episodeId;
    }

    await saveMutation.mutateAsync(episodeData);
  };

  const convertBlocksToHTML = (blocks: any[]): string => {
    // This would convert your JSONB blocks back to HTML
    // For now, return a simple version
    return blocks
      .map((block) => {
        if (block.block_type === "heading") {
          return `<h${block.content.level}>${block.content.content.map((c: any) => c.text).join("")}</h${block.content.level}>`;
        }
        if (block.block_type === "paragraph") {
          return `<p>${block.content.content.map((c: any) => c.text).join("")}</p>`;
        }
        return "";
      })
      .join("");
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">
            {episodeId ? "Edit Episode" : "Create New Episode"}
          </h1>
          <div className="flex gap-3">
            {autoSaveTime && (
              <span className="text-sm text-gray-500 self-center">
                Last saved: {autoSaveTime.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={() => handleSave("draft")}
              disabled={isSaving}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Save Draft
            </button>
            <button
              onClick={() => handleSave("published")}
              disabled={isSaving}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              Publish
            </button>
          </div>
        </div>

        {/* Title Input */}
        <input
          type="text"
          value={title}
          onChange={(e) => {
            console.log("Title changed: ", e.target.value);
            return setTitle(e.target.value);
          }}
          placeholder="Episode Title"
          className="w-full text-2xl font-bold border-b-2 border-gray-200 focus:border-blue-500 outline-none py-2 mb-4"
        />

        {/* Description Input */}
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Episode description (optional)"
          className="w-full text-gray-600 border rounded-lg p-3 focus:outline-none focus:border-blue-500 mb-4"
          rows={2}
        />

        {/* Premium Settings */}
        <div className="flex items-center gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isPremium}
              onChange={(e) => setIsPremium(e.target.checked)}
              className="w-4 h-4"
            />
            <span>Premium Episode</span>
          </label>
          {isPremium && (
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Price ($)"
              step="0.01"
              min="0.99"
              className="w-32 px-3 py-1 border rounded"
            />
          )}
        </div>
      </div>

      {/* Rich Text Editor */}
      <RichTextEditor
        initialContent={content}
        onChange={setContent}
        placeholder="Write your episode content here..."
      />

      {/* Status Bar */}
      <div className="mt-4 text-sm text-gray-500 text-center">
        {isSaving && <span className="animate-pulse">Saving...</span>}
      </div>
    </div>
  );
}
