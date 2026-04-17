import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { callEdgeFunction } from "../lib/supabase";
import type {
  ManageProfileRequest,
  DeleteCreatorProfileResponse,
  GetCreatorProfileResponse,
  UpdateAndCreateProfileResponse,
  StudioMemberCreator,
  AddMemberCreatorResponse,
  ManageStudioMembersRequest,
  RemoveMemberCreatorResponse,
} from "../lib/types";

export function useGetCreator({
  slug = "bmkyaw",
  creatorId = "7ec09a44-3a73-422a-a592-b41a813c4773",
  enabled = false,
  staleTime = Infinity,
}: {
  slug?: string;
  creatorId?: string;
  enabled?: boolean;
  staleTime?: number;
} = {}) {
  return useQuery({
    queryKey: ["creator", creatorId, slug],
    queryFn: async () => {
      return callEdgeFunction<GetCreatorProfileResponse>(
        "get-creator-profile",
        {
          queryParams: {
            slug,
            creator_id: creatorId,
          },
          method: "GET",
        },
      );
    },
    enabled,
    staleTime,
  });
}

export function useCreateCreator() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ManageProfileRequest) => {
      return callEdgeFunction<UpdateAndCreateProfileResponse>(
        "manage-creator-profile",
        {
          payload,
        },
      );
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["creator", data.id] });
    },
  });
}

export function useMutateCreatorProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ManageProfileRequest) => {
      return callEdgeFunction<UpdateAndCreateProfileResponse>(
        "manage-creator-profile",
        {
          payload,
        },
      );
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["creator", data.id] });
    },
    onError: (error) => {
      console.error("Error updating creator profile:", error);
      throw new Error(`Failed to update creator profile: ${error.message}`);
    },
  });
}

export function useDeleteCreatorProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ action }: ManageProfileRequest) => {
      return callEdgeFunction<DeleteCreatorProfileResponse>(
        "manage-creator-profile",
        {
          payload: { action },
          method: "POST",
        },
      );
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["creator", data.id] });
    },
  });
}

export function useGetMembers({
  enabled = false,
  staleTime = Infinity,
}: { enabled?: boolean; staleTime?: number } = {}) {
  return useQuery({
    queryKey: ["member_creator_list"],
    queryFn: async () => {
      return callEdgeFunction<StudioMemberCreator[]>("manage-studio-members", {
        payload: { action: "list" },
        method: "POST",
      });
    },
    enabled,
    staleTime,
  });
}

export function useAddMemberCreator() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      studio_slug,
      ...payload
    }: ManageStudioMembersRequest) => {
      return callEdgeFunction<AddMemberCreatorResponse>(
        "manage-studio-members",
        {
          payload,
          queryParams: { studio_slug },
        },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["member-creator-list"] });
    },
  });
}

export function useRemoveCreator() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ManageStudioMembersRequest) => {
      return callEdgeFunction<RemoveMemberCreatorResponse>(
        "manage-studio-members",
        { payload },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["member-creator-list"] });
    },
  });
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient();
  console.log("Initializing useUpdateMemberRole hook");
  return useMutation({
    mutationFn: async (payload: ManageStudioMembersRequest) => {
      return callEdgeFunction("manage-studio-members", { payload });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["member-creator-list"] });
    },
  });
}
