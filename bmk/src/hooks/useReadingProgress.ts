import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { callEdgeFunction } from "../lib/supabase";

interface ProgressData {
  episode_id: string;
  position: number;
  completed?: boolean;
}

export function useReadingProgress(episodeId: string) {
  const queryClient = useQueryClient();

  // get reading progress for an episode
  const { data: progress, isLoading } = useQuery({
    queryKey: ["reading-progress", episodeId],
    queryFn: async () => {
      const result = await callEdgeFunction<{ progress: any }>(
        "get-reading-progress",
        {
          episode_id: episodeId,
        },
      );
      return result.progress;
    },
    enabled: !!episodeId,
  });

  // update reading progress
  const updateProgress = useMutation({
    mutationFn: async (data: ProgressData) => {
      return await callEdgeFunction("update-reading-progress", data);
    },
    onSuccess: () => {
      // MUST invalidate query to refetch data
      queryClient.invalidateQueries({
        queryKey: ["reading-progress", episodeId],
      });
      queryClient.invalidateQueries({ queryKey: ["user-library"] });
    },
  });

  // save position with throttling
  const savePosition = (position: number, completed?: boolean) => {
    // only save every 5 seconds or when position changes significantly
    const lastSave = sessionStorage.getItem(`last-save-${episodeId}`);
    const lastPosition =
      parseInt(sessionStorage.getItem(`last-position-${episodeId}`)) || 0;

    if (
      lastSave &&
      Date.now() - parseInt(lastSave) < 5000 &&
      Math.abs(position - lastPosition) < 100
    ) {
      return;
    }

    sessionStorage.setItem(`last-save-${episodeId}`, Date.now().toString());
    sessionStorage.setItem(`last-position-${episodeId}`, Date.now().toString());

    updateProgress.mutate({
      episode_id: episodeId,
      position,
      completed,
    });
  };

  return {
    progress,
    isLoading,
    savePosition,
    isUpdating: updateProgress.isPending,
  };
}
