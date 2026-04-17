import { useMutation, useQueryClient } from "@tanstack/react-query";
import { callEdgeFunction } from "../lib/supabase";
import type {
  CreateAndUpdateCommentResponse,
  CreateCommentProps,
  DeleteCommentResponse,
  DeleteCommentProps,
  GetCommentProps,
  UpdateCommentProps,
} from "../lib/types";

// export function useGetComments({
//   episodeId,
//   page = 1,
//   limit = 20,
// }: GetCommentProps);

// export function useGetComments({
//   episodeId = "e5f48852-9fe1-48b9-a762-13ecbad16508",
//   page = 1,
//   limit = 20,
//   enabled = false,
//   staleTime = Infinity,
// }: GetCommentProps = {}) {
//   return useQuery({
//     queryKey: ["comment", episodeId, page],
//     queryFn: async () =>
//       callEdgeFunction("manage-comment", {
//         payload: {
//           action: "get",
//           episode_id: episodeId,
//         },
//         queryParams: {
//           page,
//           limit,
//         },
//         method: "POST",
//       }),
//     enabled,
//     staleTime,
//   });
// }
export function useGetComments() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      episodeId,
      // episodeId = "e5f48852-9fe1-48b9-a762-13ecbad16508",
      page = 1,
      limit = 20,
    }: GetCommentProps = {}) =>
      callEdgeFunction("manage-comment", {
        // payload: {
        //   action: "get",
        //   episode_id: episodeId,
        // },
        queryParams: {
          action: "get",
          episode_id: episodeId,
          page,
          limit,
        },
        method: "GET",
      }),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(
        ["comments", variables.episodeId, variables.page],
        data,
      );
    },
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      action,
      content,
      parent_comment_id,
      episode_id,
    }: CreateCommentProps) => {
      return callEdgeFunction<CreateAndUpdateCommentResponse>(
        "manage-comment",
        {
          payload: {
            action,
            episode_id,
            content,
            parent_comment_id,
          },
          method: "POST",
        },
      );
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["comments", data.episode_id],
      });
      queryClient.invalidateQueries({ queryKey: ["episode", data.episode_id] });
    },
  });
}

export function useUpdateComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      action,
      episode_id,
      parent_comment_id,
      content,
      comment_id,
    }: UpdateCommentProps) =>
      callEdgeFunction<CreateAndUpdateCommentResponse>("manage-comment", {
        payload: {
          action,
          comment_id,
          content,
          episode_id,
          parent_comment_id,
        },
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["comments", data.episode_id],
      });
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ action, comment_id }: DeleteCommentProps) => {
      return callEdgeFunction<DeleteCommentResponse>("manage-comment", {
        payload: {
          action,
          comment_id,
        },
        method: "POST",
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["comments", data.episode_id],
      });
      queryClient.invalidateQueries({ queryKey: ["episode", data.episode_id] });
    },
  });
}
