interface CreateAndUpdateCommentResponse {
  id: string;
  user_id: string;
  episode_id: string;
  parent_comment_id: string;
  content: string;
  like_count: number;
  is_edited: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date;
  profiles: {
    username: string;
    avatar_url: string;
  };
}
interface DeleteCommentResponse {
  id: string;
  user_id: string;
  episode_id: string;
  parent_comment_id: string;
  content: string;
  like_count: number;
  is_edited: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date;
  profiles: {
    username: string;
    avatar_url: string;
  };
  pagination: {
    page: string;
    limit: string;
    total: string;
    total_page: string;
  };
}
interface GetCommentProps {
  episodeId?: string;
  page?: number;
  limit?: number;
  enabled?: boolean;
  staleTime?: number;
}

interface CreateCommentProps {
  action: "create";
  content: string;
  episode_id: string;
  parent_comment_id?: string;
}

interface UpdateCommentProps {
  action: "update";
  comment_id: string;
  content: string;
  episode_id: string;
  parent_comment_id?: string;
}

interface DeleteCommentProps {
  action: "delete";
  comment_id: string;
}

export type {
  CreateAndUpdateCommentResponse,
  DeleteCommentResponse,
  GetCommentProps,
  CreateCommentProps,
  UpdateCommentProps,
  DeleteCommentProps,
};
