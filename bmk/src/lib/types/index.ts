import { type NovelBlock, convertHTMLToBlocks } from "./editorConverter";
import type {
  GetCreatorProfileResponse,
  ManageProfileRequest,
  UpdateAndCreateProfileResponse,
  DeleteCreatorProfileResponse,
  ManageStudioMembersRequest,
  StudioMemberCreator,
  AddMemberCreatorResponse,
  RemoveMemberCreatorResponse,
} from "./creator.type";

import type {
  CreateAndUpdateCommentResponse,
  DeleteCommentResponse,
  UpdateCommentProps,
  GetCommentProps,
  CreateCommentProps,
  DeleteCommentProps,
} from "./comment.type";

interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  bio: string;
}

interface Creator {
  id: string;
  profiles: Profile;
  verified_creator: boolean;
  total_earning: number;
}

interface Series {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  cover_image_url: string | null;
  content_type: "novel" | "webtoon";
  genre: string[];
  tags: string[];
  status: string;
  is_premium: boolean;
  total_episodes: number;
  total_views: number;
  total_likes: number;
  creator: Creator;
  is_bookmarked?: boolean;
  is_following?: boolean;
}

interface Episode {
  id: string;
  episode_number: number;
  title: string;
  description: string | null;
  is_premium: boolean;
  price: number | null;
  view_count: number;
  like_count: number;
  comment_count: number;
  word_count: number;
  published_at: string;
  is_locked?: boolean;
  is_purchased?: boolean;
  reading_progress?: {
    last_position: number;
    completed: boolean;
  };
}

export type {
  Profile,
  Creator,
  Series,
  Episode,
  NovelBlock,
  GetCreatorProfileResponse,
  ManageProfileRequest,
  UpdateAndCreateProfileResponse,
  DeleteCreatorProfileResponse,
  ManageStudioMembersRequest,
  StudioMemberCreator,
  AddMemberCreatorResponse,
  RemoveMemberCreatorResponse,
  CreateAndUpdateCommentResponse,
  DeleteCommentResponse,
  UpdateCommentProps,
  GetCommentProps,
  CreateCommentProps,
  DeleteCommentProps,
};
export { convertHTMLToBlocks };
