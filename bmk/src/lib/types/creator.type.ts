type CreatorType = "studio" | "individual";
type VerificationStatus = "verified" | "pending" | "rejected";
type ContentType = "novel" | "webtoon";

interface StudioMember {
  id: string;
  slug: string;
  display_name: string;
  username: string;
  avatar_url: string;
  role: string;
}

interface CreatorProfile {
  id: string;
  username: string;
  verified_creator: string;
  display_name: string;
  avatar_url: string;
  hero_image_url: string;
  bio: string;
  slug: string;
  creator_type: CreatorType;
  studio_name: string;
  verification_status: VerificationStatus;
  heat_score: number;
  follower_count: number;
  total_views: number;
  is_following: number;
  studio_members: StudioMember[];
}

interface Series {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  cover_image_url: string | null;
  content_type: ContentType;
  genre: string[];
  tags: string[];
  status: string;
  is_premium: boolean;
  total_episodes: number;
  total_views: number;
  total_likes: number;
  creator: any;
  is_bookmarked?: boolean;
  is_following?: boolean;
}

export interface GetCreatorProfileResponse {
  profile: CreatorProfile;
  series: Series[];
  stats: {
    total_series: number;
    total_episodes: number;
    total_views: number;
    total_likes: number;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_page: number;
  };
}

export interface UpdateAndCreateProfileResponse {
  id: string;
  creator_type: CreatorType;
  display_name: string;
  studio_name: string;
  slug: string;
  bio: string;
  hero_image_url: string;
  phone_number: number;
  national_id_url: string;
  primary_format: string;
  content_categories: string[]; // ask ama category list
  artist_style: string;
  publishing_goals: string;
  portfolio_url: string;
  verification_status: VerificationStatus;
  profiles: {
    username: string;
    avatar_url: string;
  };
}

export interface DeleteCreatorProfileResponse {
  success: boolean;
  id: string;
  message: string;
}

export interface ManageProfileRequest {
  action: "create" | "update" | "delete";
  creator_type?: CreatorType;
  display_name?: string;
  studio_name?: string;
  slug?: string;
  bio?: string;
  hero_image_url?: string;
  phone_number?: string;
  national_id_url?: string;
  primary_format?: string;
  content_categories?: string[];
  artist_style?: string;
  publishing_goals?: string;
  portfolio_url?: string;
}

export interface ManageStudioMembersRequest {
  action: "add" | "remove" | "update" | "list";
  member_creator_id?: string;
  member_username?: string;
  role_label?: string;
  membership_status?: "active" | "pending" | "removed";
  studio_slug?: string;
}

export interface StudioMemberCreator {
  id: string;
  slug: string;
  username: string;
  studio_name: string;
  avatar_url: string;
  bio: string;
  role: string;
  status: string;
  heat_score: number;
  joined_at: Date;
}

export interface membership {
  id: string;
  studio_creator_id: string;
  member_creator_id: string;
  role_label: string;
  membership_status: string; // change this to active and inactive (need confirmation)
  created_at: Date;
  updated_at: Date;
}

export interface AddMemberCreatorResponse {
  success: boolean;
  membership: membership;
  message: string;
}

export interface RemoveMemberCreatorResponse {
  success: boolean;
  message: string;
}
