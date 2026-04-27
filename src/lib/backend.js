import { supabase } from "./supabase";
import { convertHTMLToBlocks } from "./editorConverter";

function toQueryString(params = {}) {
  return new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "")
  ).toString();
}

export async function callEdgeFunction(functionName, options = {}) {
  const timeoutMs = Number(options.timeoutMs || 0);
  const session = await supabase.auth.getSession();
  const accessToken = session.data.session?.access_token;

  const headers = {
    ...(options.headers || {}),
    "Content-Type": "application/json",
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
  };

  let invokeTarget = functionName;
  if (options.queryParams) {
    const queryString = toQueryString(options.queryParams);
    invokeTarget = queryString ? `${functionName}?${queryString}` : functionName;
  }

  const invokeOptions = {
    headers
  };

  if (options.method) invokeOptions.method = options.method;
  if (options.payload) invokeOptions.body = options.payload;

  const invokePromise = supabase.functions.invoke(invokeTarget, invokeOptions);
  const timeoutPromise =
    timeoutMs > 0
      ? new Promise((_, reject) => {
          window.setTimeout(() => {
            reject(new Error(`Edge function ${functionName} timed out after ${timeoutMs}ms.`));
          }, timeoutMs);
        })
      : null;

  const { data, error } = timeoutPromise
    ? await Promise.race([invokePromise, timeoutPromise])
    : await invokePromise;
  if (error) {
    const details =
      data?.error ||
      data?.message ||
      data?.details ||
      error?.context?.error ||
      error?.context?.message ||
      error?.message ||
      "Unknown edge function error";
    const status =
      error?.context?.status ||
      error?.status ||
      "";
    throw new Error(
      status
        ? `Edge function ${functionName} failed (${status}): ${details}`
        : `Edge function ${functionName} failed: ${details}`
    );
  }
  return data;
}

function formatCompactCount(value) {
  const number = Number(value) || 0;
  if (number >= 1000000) return `${(number / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
  if (number >= 1000) return `${(number / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(number);
}

async function getCurrentUserId() {
  const {
    data: { session }
  } = await supabase.auth.getSession();

  return session?.user?.id || "";
}

function toPlainText(node) {
  if (!node) return "";
  if (typeof node === "string") return node;
  if (Array.isArray(node)) {
    return node.map(toPlainText).filter(Boolean).join("");
  }
  if (typeof node === "object") {
    if (typeof node.text === "string") return node.text;
    if (node.content) return toPlainText(node.content);
  }
  return "";
}

function buildEpisodeBody(blocks = []) {
  return blocks
    .map((block) => {
      if (typeof block?.body === "string" && block.body.trim()) {
        return block.body.trim();
      }

      if (block?.content) {
        const text = toPlainText(block.content).trim();
        if (!text) return "";
        if (block.block_type === "heading") return `## ${text}`;
        return text;
      }

      return "";
    })
    .filter(Boolean)
    .join("\n\n");
}

function normalizeTextBlocks(blocks = [], source = "novel_blocks") {
  if (source === "episode_text_blocks") {
    return blocks.map((block, index) => ({
      episode_id: block.episode_id,
      block_order: block.sort_order || index + 1,
      block_type: "paragraph",
      body: block.body || "",
      metadata: {}
    }));
  }

  return blocks;
}

async function fetchTextBlocksForEpisodes(episodeIds = []) {
  if (!episodeIds.length) return [];

  try {
    const { data, error } = await supabase
      .from("novel_blocks")
      .select("episode_id, block_order, block_type, content, metadata")
      .in("episode_id", episodeIds)
      .order("block_order", { ascending: true });

    if (error) throw error;
    return normalizeTextBlocks(data || [], "novel_blocks");
  } catch (novelBlocksError) {
    const { data, error } = await supabase
      .from("episode_text_blocks")
      .select("episode_id, sort_order, body")
      .in("episode_id", episodeIds)
      .order("sort_order", { ascending: true });

    if (error) throw novelBlocksError;
    return normalizeTextBlocks(data || [], "episode_text_blocks");
  }
}

async function fetchTextBlocksForEpisode(episodeId) {
  const blocks = await fetchTextBlocksForEpisodes(episodeId ? [episodeId] : []);
  return blocks.filter((block) => block.episode_id === episodeId);
}

async function deleteTextBlocksForEpisodes(episodeIds = []) {
  if (!episodeIds.length) return;

  const deleteFrom = async (table) => {
    const { error } = await supabase.from(table).delete().in("episode_id", episodeIds);
    if (
      error &&
      !/relation .* does not exist|Could not find the table|Invalid API route/i.test(
        String(error.message || error.details || "")
      )
    ) {
      throw error;
    }
  };

  await deleteFrom("novel_blocks");
  await deleteFrom("episode_text_blocks");
}

async function insertTextBlocksForEpisode(episodeId, blocks = []) {
  if (!blocks.length) return;

  try {
    const { error } = await supabase.from("novel_blocks").insert(
      blocks.map((block) => ({
        episode_id: episodeId,
        block_order: block.block_order,
        block_type: block.block_type,
        content: block.content,
        metadata: block.metadata || {}
      }))
    );

    if (error) throw error;
    return;
  } catch (novelBlocksError) {
    const { error } = await supabase.from("episode_text_blocks").insert(
      blocks.map((block, index) => ({
        episode_id: episodeId,
        sort_order: block.block_order || index + 1,
        body: buildEpisodeBody([block])
      }))
    );

    if (error) throw novelBlocksError;
  }
}

async function fetchDirectBookmarkState(seriesId, userId) {
  if (!seriesId || !userId) return false;

  const { data, error } = await supabase
    .from("bookmarks")
    .select("id")
    .eq("series_id", seriesId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data?.id);
}

async function fetchDirectCreatorFollowState(creatorId, followerId) {
  if (!creatorId || !followerId) return false;

  const { data, error } = await supabase
    .from("creator_follows")
    .select("id")
    .eq("creator_id", creatorId)
    .eq("follower_id", followerId)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data?.id);
}

async function fetchDirectCreatorFollowerCount(creatorId) {
  if (!creatorId) return 0;

  const { count, error } = await supabase
    .from("creator_follows")
    .select("id", { count: "exact", head: true })
    .eq("creator_id", creatorId);

  if (error) throw error;
  return Number(count || 0);
}

async function fetchDirectBookmarkCount(seriesId) {
  if (!seriesId) return 0;

  const { count, error } = await supabase
    .from("bookmarks")
    .select("id", { count: "exact", head: true })
    .eq("series_id", seriesId);

  if (error) throw error;
  return Number(count || 0);
}

function mapRemoteEpisodeSummary(episode, contentType = "novel", index = 0) {
  const episodeNumber = episode?.episode_number || episode?.episodeNumber || index + 1;
  const contentMode =
    episode?.content_mode ||
    episode?.contentMode ||
    (contentType === "webtoon" || contentType === "comics" ? "visual" : "text");
  const accessType = episode?.accessType || episode?.access_type;
  const isPremium = Boolean(
    episode?.is_premium || accessType === "premium" || episode?.free === false
  );

  return {
    id: episode?.id || `remote-episode-${episodeNumber}`,
    episodeNumber,
    title: episode?.title || `${contentMode === "visual" ? "Episode" : "Chapter"} ${episodeNumber}`,
    free: !isPremium,
    isPremium,
    views: formatCompactCount(episode?.view_count || episode?.views || 0),
    likes: formatCompactCount(episode?.like_count || episode?.stats?.episodeLikes || 0),
    comments: [],
    notes: episode?.description || episode?.notes || "",
    body: episode?.body || "",
    images: [],
    contentMode,
    publishedAt: episode?.published_at || episode?.publishedAt || "",
    publicationStatus: episode?.publication_status || episode?.publicationStatus || "published",
    remote: true,
    isLiked: Boolean(episode?.viewerState?.liked || episode?.user_context?.liked),
    commentCount: Number(episode?.comment_count || 0),
    isLocked: Boolean(episode?.is_locked)
  };
}

function mapRemoteComment(comment) {
  const author = comment?.author || {};
  return {
    id: comment?.id || `remote-comment-${Date.now()}`,
    user: author?.displayName || author?.display_name || author?.username || "Reader",
    author: author?.displayName || author?.display_name || author?.username || "Reader",
    avatar: author?.avatarUrl || author?.avatar_url || "/images/image1.png",
    badge: "Reader",
    level: "Egg Starter",
    body: comment?.body || "",
    time: comment?.createdAt || comment?.created_at || "Just now",
    createdAt: comment?.createdAt || comment?.created_at || "",
    editedAt:
      comment?.isEdited || comment?.is_edited ? comment?.updatedAt || comment?.updated_at || Date.now() : "",
    canEdit: Boolean(comment?.viewerState?.canEdit),
    canDelete: Boolean(comment?.viewerState?.canDelete),
    source: "remote"
  };
}

async function fetchProfilesMap(userIds = []) {
  const ids = Array.from(new Set(userIds.filter(Boolean)));
  if (!ids.length) return new Map();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, username")
    .in("id", ids);

  if (error) throw error;

  return new Map((data || []).map((profile) => [profile.id, profile]));
}

async function fetchEpisodeCommentsDirect(episodeId) {
  if (!episodeId) return [];

  const {
    data: { session }
  } = await supabase.auth.getSession();
  const currentUserId = session?.user?.id || "";

  const { data: comments, error } = await supabase
    .from("comments")
    .select("id, user_id, episode_id, parent_comment_id, content, like_count, is_edited, created_at, updated_at, deleted_at")
    .eq("episode_id", episodeId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (error) throw error;

  const profilesMap = await fetchProfilesMap((comments || []).map((comment) => comment.user_id));

  return (comments || []).map((comment) => {
    const profile = profilesMap.get(comment.user_id);
    return {
      id: comment.id,
      user: profile?.username || "Reader",
      author: profile?.username || "Reader",
      avatar: "/images/image1.png",
      badge: "Reader",
      level: "Egg Starter",
      body: comment.content || "",
      time: comment.created_at || "Just now",
      createdAt: comment.created_at || "",
      editedAt: comment.is_edited ? comment.updated_at || Date.now() : "",
      canEdit: Boolean(currentUserId && currentUserId === comment.user_id),
      canDelete: Boolean(currentUserId && currentUserId === comment.user_id),
      source: "remote"
    };
  });
}

export function mapRemoteSeriesDetail(response) {
  const source = response?.series || response || {};
  const creator = source?.creator || response?.creator || {};
  const creatorProfile = creator?.profiles || creator || {};
  const contentType = source?.content_type || source?.type || "novel";
  const episodes = response?.episodes || source?.episodes || [];
  const creatorName =
    creatorProfile?.display_name ||
    creatorProfile?.displayName ||
    creatorProfile?.username ||
    source?.author_name ||
    source?.authorName ||
    response?.authorName ||
    "TooU Creator";
  const creatorId =
    creator?.id ||
    source?.creator_id ||
    source?.creator_profile_id ||
    response?.creator_id ||
    response?.creatorProfileId ||
    "";
  const tags = source?.tags || source?.hashtags || response?.hashtags || [];

  return {
    id: source?.id || response?.id || "",
    slug: source?.slug || response?.slug || "",
    title: source?.title || response?.title || "Untitled",
    type: contentType,
    genre: Array.isArray(source?.genre) ? source.genre[0] || "General" : source?.genre || "General",
    audience: source?.audience || response?.audience || "General",
    synopsis: source?.description || source?.synopsis || response?.synopsis || "",
    image: source?.cover_image_url || source?.cover_url || response?.coverUrl || "/images/image1.png",
    detailImage:
      source?.hero_image_url ||
      source?.heroImageUrl ||
      response?.heroImageUrl ||
      source?.cover_url ||
      source?.cover_image_url ||
      response?.coverUrl ||
      "/images/image1.png",
    creatorName,
    creatorId,
    views: formatCompactCount(source?.total_views || source?.view_count || response?.stats?.views || 0),
    likes: formatCompactCount(source?.total_likes || source?.like_count || response?.stats?.likes || 0),
    followers: formatCompactCount(creator?.followers_count || response?.stats?.bookmarks || 0),
    rating: source?.is_premium ? "Premium" : "New",
    badge: source?.is_premium ? "Premium" : "New",
    hashtags: Array.isArray(tags) ? tags : [],
    publishedAt: source?.published_at || response?.publishedAt || "",
    isBookmarked: Boolean(source?.is_bookmarked || response?.viewerState?.bookmarked),
    isFollowing: Boolean(source?.is_following || response?.viewerState?.following),
    remote: true,
    creator: {
      id: creatorId,
      slug: creatorProfile?.username || response?.creator?.slug || creatorId,
      name: creatorName,
      type: creator?.creator_type === "studio" ? "studio" : "creator",
      avatar: creatorProfile?.avatar_url || response?.creator?.avatarUrl || "/images/image1.png",
      cover:
        creatorProfile?.hero_image_url ||
        creatorProfile?.avatar_url ||
        response?.creator?.avatarUrl ||
        "/images/image1.png",
      bio: creatorProfile?.bio || "",
      followers: formatCompactCount(creator?.followers_count || 0),
      rating: creator?.verified_creator ? "9.2" : "8.5",
      isFollowing: Boolean(source?.is_following || response?.viewerState?.following)
    },
    episodes: episodes.map((episode, index) => mapRemoteEpisodeSummary(episode, contentType, index))
  };
}

export function mapRemoteSeriesToCard(series) {
  const creatorName =
    series?.creator?.profiles?.display_name ||
    series?.creator?.displayName ||
    series?.creator?.profiles?.username ||
    series?.author_name ||
    series?.authorName ||
    "TooU Creator";
  const tags = series?.tags || series?.hashtags || [];

  return {
    id: series.id,
    slug: series.slug,
    title: series.title,
    type: series.content_type || series.type || "novel",
    genre: Array.isArray(series.genre) ? series.genre[0] || "General" : series.genre || "General",
    audience: series.audience || "General",
    synopsis: series.description || series.synopsis || "No description available yet.",
    image: series.cover_image_url || series.cover_url || series.coverUrl || "/images/image1.png",
    detailImage:
      series.hero_image_url ||
      series.heroImageUrl ||
      series.cover_image_url ||
      series.cover_url ||
      series.coverUrl ||
      "/images/image1.png",
    creatorName,
    creatorId: series.creator?.id || series.creator_profile_id || series.creator_id || "",
    views: formatCompactCount(series.total_views || series.view_count || series?.stats?.views || 0),
    likes: formatCompactCount(series.total_likes || series.like_count || series?.stats?.likes || 0),
    rating: series.is_premium ? "Premium" : "New",
    badge: series.is_premium ? "Premium" : "New",
    hashtags: Array.isArray(tags) ? tags : [],
    publishedAt: series.published_at || series.publishedAt || "",
    isBookmarked: Boolean(series.is_bookmarked)
  };
}

function mergeById(items = []) {
  const merged = new Map();
  items.forEach((item) => {
    if (item?.id) merged.set(item.id, item);
  });
  return Array.from(merged.values());
}

function mapDirectSeriesRowToCard(series, creatorName = "TooU Creator") {
  return {
    id: series.id,
    slug: series.slug,
    title: series.title,
    type: series.content_type || "novel",
    genre: Array.isArray(series.genre) ? series.genre[0] || "General" : "General",
    audience: series.audience || "General",
    synopsis: series.description || "No description available yet.",
    image: series.cover_image_url || "/images/image1.png",
    detailImage: series.cover_image_url || "/images/image1.png",
    creatorName,
    creatorId: series.creator_id || "",
    views: formatCompactCount(series.total_views || 0),
    likes: formatCompactCount(series.total_likes || 0),
    rating: series.is_premium ? "Premium" : "New",
    badge: series.is_premium ? "Premium" : "New",
    hashtags: Array.isArray(series.tags) ? series.tags : [],
    publishedAt: series.published_at || "",
    isBookmarked: false,
    remote: true
  };
}

function mapDirectSeriesRowToDetail(series, episodes = [], creatorName = "TooU Creator") {
  return {
    id: series.id,
    slug: series.slug,
    title: series.title,
    type: series.content_type || "novel",
    genre: Array.isArray(series.genre) ? series.genre[0] || "General" : "General",
    audience: series.audience || "General",
    synopsis: series.description || "",
    image: series.cover_image_url || "/images/image1.png",
    detailImage: series.cover_image_url || "/images/image1.png",
    creatorName,
    creatorId: series.creator_id || "",
    views: formatCompactCount(series.total_views || 0),
    likes: formatCompactCount(series.total_likes || 0),
    followers: "0",
    rating: series.is_premium ? "Premium" : "New",
    badge: series.is_premium ? "Premium" : "New",
    hashtags: Array.isArray(series.tags) ? series.tags : [],
    publishedAt: series.published_at || "",
    isBookmarked: false,
    isFollowing: false,
    remote: true,
    creator: {
      id: series.creator_id || "",
      slug: series.creator_id || "",
      name: creatorName,
      type: "creator",
      avatar: "/images/image1.png",
      cover: "/images/image1.png",
      bio: "",
      followers: "0",
      rating: "8.5",
      isFollowing: false
    },
    episodes
  };
}

async function resolveCreatorNames(creatorIds = []) {
  const ids = Array.from(new Set(creatorIds.filter(Boolean)));
  if (!ids.length) return new Map();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, username")
    .in("id", ids);

  if (error) throw error;

  return new Map((data || []).map((profile) => [profile.id, profile.username || "TooU Creator"]));
}

export async function fetchPublishedSeriesDirect(filters = {}) {
  let query = supabase
    .from("series")
    .select("id, creator_id, title, slug, description, cover_image_url, content_type, genre, tags, status, is_premium, total_views, total_likes, published_at, created_at")
    .not("published_at", "is", null)
    .order("published_at", { ascending: false })
    .limit(filters.limit || 24);

  if (filters.contentType) query = query.eq("content_type", filters.contentType);
  if (filters.genre) query = query.contains("genre", [filters.genre]);

  const { data, error } = await query;
  if (error) throw error;

  const seriesRows = data || [];
  if (!seriesRows.length) return [];

  const { data: publishedEpisodes, error: publishedEpisodesError } = await supabase
    .from("episodes")
    .select("series_id")
    .in("series_id", seriesRows.map((item) => item.id))
    .eq("status", "published");

  if (publishedEpisodesError) throw publishedEpisodesError;

  const seriesWithPublishedEpisodes = new Set(
    (publishedEpisodes || []).map((episode) => episode.series_id).filter(Boolean)
  );
  const filteredSeriesRows = seriesRows.filter((series) => seriesWithPublishedEpisodes.has(series.id));
  if (!filteredSeriesRows.length) return [];

  const creatorNames = await resolveCreatorNames(filteredSeriesRows.map((item) => item.creator_id));
  return filteredSeriesRows.map((series) =>
    mapDirectSeriesRowToCard(series, creatorNames.get(series.creator_id) || "TooU Creator")
  );
}

export async function fetchCreatorSeriesDirect(creatorId) {
  if (!creatorId) return [];

  const { data: seriesRows, error: seriesError } = await supabase
    .from("series")
    .select("id, creator_id, title, slug, description, cover_image_url, content_type, genre, tags, status, is_premium, total_views, total_likes, published_at, created_at")
    .eq("creator_id", creatorId)
    .order("created_at", { ascending: false });

  if (seriesError) throw seriesError;

  const seriesIds = (seriesRows || []).map((item) => item.id);
  let episodesBySeries = new Map();

  if (seriesIds.length) {
    const { data: episodeRows, error: episodeError } = await supabase
      .from("episodes")
      .select("id, series_id, episode_number, title, description, is_premium, status, published_at, scheduled_at")
      .in("series_id", seriesIds)
      .order("episode_number", { ascending: true });

    if (episodeError) throw episodeError;

    episodesBySeries = (episodeRows || []).reduce((map, episode) => {
      const current = map.get(episode.series_id) || [];
      current.push({
        id: episode.id,
        title: episode.title,
        free: !episode.is_premium,
        views: "0",
        likes: "0",
        comments: [],
        notes: episode.description || "",
        body: "",
        images: [],
        publishedAt: episode.published_at || "",
        scheduledFor: episode.scheduled_at || "",
        publicationStatus: episode.status || "draft"
      });
      map.set(episode.series_id, current);
      return map;
    }, new Map());
  }

  return (seriesRows || []).map((series) => ({
    ...mapDirectSeriesRowToCard(series),
    episodes: episodesBySeries.get(series.id) || []
  }));
}

export async function fetchEditableSeriesDirect(slug, creatorId) {
  if (!slug || !creatorId) return null;

  const { data: series, error: seriesError } = await supabase
    .from("series")
    .select("id, creator_id, title, slug, description, cover_image_url, content_type, genre, tags, status, is_premium, total_views, total_likes, published_at")
    .eq("slug", slug)
    .eq("creator_id", creatorId)
    .maybeSingle();

  if (seriesError) throw seriesError;
  if (!series?.id) return null;

  const { data: episodes, error: episodesError } = await supabase
    .from("episodes")
    .select("id, episode_number, title, description, is_premium, status, published_at, scheduled_at, episode_type")
    .eq("series_id", series.id)
    .is("deleted_at", null)
    .order("episode_number", { ascending: true });

  if (episodesError) throw episodesError;

  const episodeIds = (episodes || []).map((episode) => episode.id);
  let blocksByEpisode = new Map();

  if (episodeIds.length) {
    const blocks = await fetchTextBlocksForEpisodes(episodeIds);

    blocksByEpisode = (blocks || []).reduce((map, block) => {
      const current = map.get(block.episode_id) || [];
      current.push(block);
      map.set(block.episode_id, current);
      return map;
    }, new Map());
  }

  const creatorNames = await resolveCreatorNames([series.creator_id]);
  const creatorName = creatorNames.get(series.creator_id) || "TooU Creator";

  return {
    id: series.id,
    slug: series.slug,
    title: series.title,
    type: series.content_type || "novel",
    genre: Array.isArray(series.genre) ? series.genre[0] || "Fantasy" : "Fantasy",
    audience: series.audience || "General",
    synopsis: series.description || "",
    image: series.cover_image_url || "/images/image1.png",
    detailImage: series.cover_image_url || "/images/image1.png",
    creatorName,
    creatorId: series.creator_id,
    views: formatCompactCount(series.total_views || 0),
    likes: formatCompactCount(series.total_likes || 0),
    hashtags: Array.isArray(series.tags) ? series.tags : [],
    episodes: (episodes || []).map((episode) => ({
      id: episode.id,
      title: episode.title,
      free: !episode.is_premium,
      body: buildEpisodeBody(blocksByEpisode.get(episode.id) || []),
      notes: episode.description || "",
      publicationStatus: episode.status || "draft",
      publishedAt: episode.published_at || "",
      scheduledFor: episode.scheduled_at || ""
    }))
  };
}

export async function updateEditableSeriesDirect(series) {
  if (!series?.id) throw new Error("Series id is required to update content.");

  const { error: seriesError } = await supabase
    .from("series")
    .update({
      title: series.title,
      description: series.synopsis || "",
      cover_image_url: series.image || "",
      hero_image_url: series.detailImage || series.image || "",
      genre: Array.isArray(series.genre) ? series.genre : series.genre ? [series.genre] : [],
      tags: Array.isArray(series.hashtags) ? series.hashtags : [],
      audience: series.audience || "General",
      updated_at: new Date().toISOString()
    })
    .eq("id", series.id);

  if (seriesError) throw seriesError;

  const { data: existingEpisodes, error: existingEpisodesError } = await supabase
    .from("episodes")
    .select("id")
    .eq("series_id", series.id)
    .is("deleted_at", null);

  if (existingEpisodesError) throw existingEpisodesError;

  const existingIds = new Set((existingEpisodes || []).map((episode) => episode.id));
  const nextIds = new Set((series.episodes || []).map((episode) => episode.id).filter(Boolean));
  const deletedIds = Array.from(existingIds).filter((id) => !nextIds.has(id));

  if (deletedIds.length) {
    await deleteTextBlocksForEpisodes(deletedIds);

    const { error: deleteEpisodesError } = await supabase
      .from("episodes")
      .delete()
      .in("id", deletedIds);
    if (deleteEpisodesError) throw deleteEpisodesError;
  }

  for (let index = 0; index < (series.episodes || []).length; index += 1) {
    const episode = series.episodes[index];
    const episodePayload = {
      series_id: series.id,
      episode_number: index + 1,
      title: episode.title || `Chapter ${index + 1}`,
      description: episode.notes || "",
      cover_image_url: series.image || null,
      episode_type: series.type === "novel" || series.type === "knowledge" ? "novel" : "webtoon",
      is_premium: episode.free === false,
      word_count: String(episode.body || "").trim().split(/\s+/).filter(Boolean).length,
      status: episode.publicationStatus || "draft"
    };

    let episodeId = episode.id;
    if (episodeId && existingIds.has(episodeId)) {
      const { error: updateEpisodeError } = await supabase
        .from("episodes")
        .update(episodePayload)
        .eq("id", episodeId);
      if (updateEpisodeError) throw updateEpisodeError;
    } else {
      const { data: createdEpisode, error: createEpisodeError } = await supabase
        .from("episodes")
        .insert(episodePayload)
        .select("id")
        .single();
      if (createEpisodeError) throw createEpisodeError;
      episodeId = createdEpisode.id;
      episode.id = episodeId;
    }

    await deleteTextBlocksForEpisodes([episodeId]);

    const blocks = convertHTMLToBlocks(
      String(episode.body || "").trim().startsWith("<")
        ? episode.body
        : `<p>${String(episode.body || "").replace(/\n/g, "</p><p>")}</p>`
    );

    if (blocks.length) {
      await insertTextBlocksForEpisode(episodeId, blocks);
    }
  }

  return series;
}

export async function fetchSeriesDetailDirect(identifier) {
  if (!identifier?.slug && !identifier?.id) return null;

  let query = supabase
    .from("series")
    .select("id, creator_id, title, slug, description, cover_image_url, content_type, genre, tags, status, is_premium, total_views, total_likes, published_at");

  if (identifier.id) {
    query = query.eq("id", identifier.id);
  } else {
    query = query.eq("slug", identifier.slug);
  }

  const { data: series, error: seriesError } = await query.maybeSingle();

  if (seriesError) throw seriesError;
  if (!series?.id) return null;

  const { data: episodes, error: episodesError } = await supabase
    .from("episodes")
    .select("id, episode_number, title, description, is_premium, status, published_at, scheduled_at, episode_type")
    .eq("series_id", series.id)
    .eq("status", "published")
    .order("episode_number", { ascending: true });

  if (episodesError) throw episodesError;

  const userId = await getCurrentUserId();
  const creatorNames = await resolveCreatorNames([series.creator_id]);
  const creatorName = creatorNames.get(series.creator_id) || "TooU Creator";
  const [isBookmarked, isFollowing, bookmarkCount, creatorFollowerCount] = await Promise.all([
    fetchDirectBookmarkState(series.id, userId).catch(() => false),
    fetchDirectCreatorFollowState(series.creator_id, userId).catch(() => false),
    fetchDirectBookmarkCount(series.id).catch(() => 0),
    fetchDirectCreatorFollowerCount(series.creator_id).catch(() => 0)
  ]);

  const detail = mapDirectSeriesRowToDetail(
    series,
    (episodes || []).map((episode) => ({
      id: episode.id,
      episodeNumber: episode.episode_number,
      title: episode.title,
      free: !episode.is_premium,
      isPremium: Boolean(episode.is_premium),
      views: "0",
      likes: "0",
      comments: [],
      notes: episode.description || "",
      body: "",
      images: [],
      contentMode: ["novel", "text"].includes(String(episode.episode_type || "").toLowerCase()) ? "text" : "visual",
      publishedAt: episode.published_at || "",
      publicationStatus: episode.status || "draft",
      remote: true
    })),
    creatorName
  );

  return {
    ...detail,
    followers: formatCompactCount(bookmarkCount),
    isBookmarked,
    isFollowing,
    creator: {
      ...detail.creator,
      followers: formatCompactCount(creatorFollowerCount),
      isFollowing
    }
  };
}

export async function fetchEpisodeDirect(episodeId) {
  const { data: episode, error: episodeError } = await supabase
    .from("episodes")
    .select("id, title, description, is_premium, view_count, like_count, comment_count, episode_type")
    .eq("id", episodeId)
    .maybeSingle();

  if (episodeError) throw episodeError;
  if (!episode?.id) return null;

  if (["novel", "text"].includes(String(episode.episode_type || "").toLowerCase())) {
    const blocks = await fetchTextBlocksForEpisode(episodeId);
    const comments = await fetchEpisodeCommentsDirect(episodeId);

    return {
      id: episode.id,
      title: episode.title || "Untitled Episode",
      description: episode.description || "",
      notes: episode.description || "",
      body: buildEpisodeBody(blocks || []),
      images: [],
      views: formatCompactCount(episode.view_count || 0),
      likes: formatCompactCount(episode.like_count || 0),
      seriesLikes: "0",
      comments,
      contentMode: "text",
      isLiked: false,
      isBookmarked: false,
      commentCount: Number(episode.comment_count || 0),
      remote: true
    };
  }

  const { data: pages, error: pagesError } = await supabase
    .from("episode_pages")
    .select("image_url, sort_order")
    .eq("episode_id", episodeId)
    .order("sort_order", { ascending: true });

  if (pagesError) throw pagesError;
  const comments = await fetchEpisodeCommentsDirect(episodeId);

  return {
    id: episode.id,
    title: episode.title || "Untitled Episode",
    description: episode.description || "",
    notes: episode.description || "",
    body: "",
    images: (pages || []).map((page) => page.image_url).filter(Boolean),
    views: formatCompactCount(episode.view_count || 0),
    likes: formatCompactCount(episode.like_count || 0),
    seriesLikes: "0",
    comments,
    contentMode: "visual",
    isLiked: false,
    isBookmarked: false,
    commentCount: Number(episode.comment_count || 0),
    remote: true
  };
}

export function mapRemoteCreatorToCard(series) {
  const creator = series?.creator;
  if (!creator?.id) return null;

  return {
    id: creator.id,
    slug:
      creator?.profiles?.username ||
      creator?.profiles?.display_name?.toLowerCase().replace(/[^a-z0-9]+/g, "-") ||
      creator.id,
    name: creator?.profiles?.display_name || creator?.profiles?.username || "TooU Creator",
    type: "creator",
    avatar: creator?.profiles?.avatar_url || "/images/image1.png",
    cover: creator?.profiles?.avatar_url || "/images/image1.png",
    bio: creator?.profiles?.bio || "",
    followers: "0",
    rating: creator?.verified_creator ? "9.2" : "8.5"
  };
}

export async function fetchSeriesList(filters = {}) {
  try {
    const response = await callEdgeFunction("get-series-list", {
      queryParams: {
        content_type: filters.contentType,
        genre: filters.genre,
        sort_by: filters.sortBy || "latest",
        page: 1,
        limit: filters.limit || 24
      },
      method: "GET",
      timeoutMs: 4500
    });

    const rawSeries = response?.data || [];
    const remoteCards = rawSeries.map(mapRemoteSeriesToCard);
    if (remoteCards.length) return mergeById(remoteCards);
  } catch {
    // Fall back to direct table reads below.
  }

  try {
    return await fetchPublishedSeriesDirect(filters);
  } catch {
    return [];
  }
}

export async function fetchSeriesDetail(identifier) {
  try {
    const response = await callEdgeFunction("get-series-detail", {
      queryParams: { slug: identifier?.slug, id: identifier?.id },
      method: "GET",
      timeoutMs: 4500
    });

    const remoteDetail = mapRemoteSeriesDetail(response);
    if (remoteDetail?.id) return remoteDetail;
  } catch {
    // Fall back to direct table reads below.
  }

  try {
    return await fetchSeriesDetailDirect(identifier);
  } catch {
    return null;
  }
}

export async function fetchEpisode(episodeId) {
  try {
    const response = await callEdgeFunction("get-episode", {
      queryParams: { episode_id: episodeId },
      method: "GET",
      timeoutMs: 4500
    });

    const episode = response?.episode || response || {};
    const textBlocks = episode?.textBlocks || episode?.text_blocks || episode?.content || [];
    const pages = episode?.pages || [];

    let resolvedComments = Array.isArray(response?.comments)
      ? response.comments.map(mapRemoteComment)
      : Array.isArray(episode?.comments)
        ? episode.comments.map(mapRemoteComment)
        : [];

    if (!resolvedComments.length) {
      try {
        resolvedComments = await fetchEpisodeCommentsDirect(episodeId);
      } catch {
        resolvedComments = [];
      }
    }

    const remoteEpisode = {
      id: episode?.id || episodeId,
      title: episode?.title || "Untitled Episode",
      description: episode?.description || "",
      notes: episode?.notes || episode?.description || "",
      body: buildEpisodeBody(Array.isArray(textBlocks) ? textBlocks : []),
      images: pages.map((page) => page?.imageUrl || page?.image_url).filter(Boolean),
      views: formatCompactCount(episode?.view_count || 0),
      likes: formatCompactCount(episode?.stats?.episodeLikes || episode?.like_count || 0),
      seriesLikes: formatCompactCount(episode?.stats?.seriesLikes || 0),
      comments: resolvedComments,
      contentMode:
        episode?.contentMode ||
        episode?.content_mode ||
        (pages.length ? "visual" : "text"),
      isLiked: Boolean(episode?.viewerState?.liked || episode?.user_context?.liked),
      isBookmarked: Boolean(
        episode?.viewerState?.is_bookmarked ||
        episode?.viewerState?.bookmarked ||
        episode?.user_context?.is_bookmarked
      ),
      commentCount: Number(episode?.comment_count || 0),
      remote: true
    };
    if (remoteEpisode?.id) return remoteEpisode;
  } catch {
    // Fall back to direct table reads below.
  }

  try {
    return await fetchEpisodeDirect(episodeId);
  } catch {
    return null;
  }
}

export async function createEpisodeComment({ episodeId, content }) {
  const {
    data: { session }
  } = await supabase.auth.getSession();

  const userId = session?.user?.id;
  if (!userId) throw new Error("You need to sign in before posting a comment.");

  const { data, error } = await supabase
    .from("comments")
    .insert({
      user_id: userId,
      episode_id: episodeId,
      content
    })
    .select("id")
    .single();

  if (error) throw error;
  return data;
}

export async function updateEpisodeComment({ commentId, content }) {
  const { error } = await supabase
    .from("comments")
    .update({
      content,
      is_edited: true,
      updated_at: new Date().toISOString()
    })
    .eq("id", commentId);

  if (error) throw error;
}

export async function deleteEpisodeComment(commentId) {
  const { error } = await supabase
    .from("comments")
    .update({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq("id", commentId);

  if (error) throw error;
}

export async function toggleSeriesBookmark(seriesId) {
  try {
    return await callEdgeFunction("toggle-bookmark", {
      payload: { series_id: seriesId }
    });
  } catch (edgeError) {
    const userId = await getCurrentUserId();
    if (!userId) throw edgeError;

    const { data: existing, error: lookupError } = await supabase
      .from("bookmarks")
      .select("id")
      .eq("series_id", seriesId)
      .eq("user_id", userId)
      .maybeSingle();

    if (lookupError) throw lookupError;

    if (existing?.id) {
      const { error } = await supabase.from("bookmarks").delete().eq("id", existing.id);
      if (error) throw error;
      return { bookmarked: false };
    }

    const { error } = await supabase.from("bookmarks").insert({
      series_id: seriesId,
      user_id: userId
    });
    if (error) throw error;
    return { bookmarked: true };
  }
}

export async function toggleCreatorFollow(creatorId) {
  try {
    return await callEdgeFunction("toggle-follow", {
      payload: { creator_id: creatorId }
    });
  } catch (edgeError) {
    const userId = await getCurrentUserId();
    if (!userId) throw edgeError;

    const { data: existing, error: lookupError } = await supabase
      .from("creator_follows")
      .select("id")
      .eq("creator_id", creatorId)
      .eq("follower_id", userId)
      .maybeSingle();

    if (lookupError) throw lookupError;

    if (existing?.id) {
      const { error } = await supabase.from("creator_follows").delete().eq("id", existing.id);
      if (error) throw error;
      return { following: false };
    }

    const { error } = await supabase.from("creator_follows").insert({
      creator_id: creatorId,
      follower_id: userId
    });
    if (error) throw error;
    return { following: true };
  }
}

export async function toggleTargetLike(targetType, targetId) {
  return callEdgeFunction("toggle-like", {
    payload: {
      target_type: targetType,
      target_id: targetId
    }
  });
}

export async function fetchRemoteCreatorsFromSeries(filters = {}) {
  const rawSeries = [];

  try {
    const directSeries = await fetchPublishedSeriesDirect({
      contentType: filters.contentType,
      limit: filters.limit || 50
    });
    directSeries.forEach((series) => {
      rawSeries.push({
        id: series.id,
        creator_id: series.creatorId,
        creator: {
          id: series.creatorId,
          profiles: {
            username: series.creatorName
          }
        }
      });
    });
  } catch {
    // Ignore direct fallback errors here.
  }

  try {
    const response = await callEdgeFunction("get-series-list", {
      queryParams: {
        content_type: filters.contentType,
        sort_by: filters.sortBy || "latest",
        page: 1,
        limit: filters.limit || 50
      },
      method: "GET"
    });

    rawSeries.push(...(response?.data || []));
  } catch {
    // Ignore edge-function failure here.
  }

  const creators = new Map();

  rawSeries.forEach((series) => {
    const mapped = mapRemoteCreatorToCard(series);
    if (mapped?.id) creators.set(mapped.id, mapped);
  });

  return Array.from(creators.values());
}

export async function fetchUserBookmarks() {
  try {
    const response = await callEdgeFunction("get-user-library", {
      queryParams: { type: "bookmarked" },
      method: "GET"
    });

    return (response?.library || []).map((item) => ({
      id: item.id,
      title: item.title,
      slug: item.slug,
      type: item.content_type,
      image: item.cover_image_url || "/images/image1.png",
      time: "Saved on your account"
    }));
  } catch {
    const userId = await getCurrentUserId();
    if (!userId) return [];

    const { data: bookmarkRows, error: bookmarkError } = await supabase
      .from("bookmarks")
      .select("series_id, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (bookmarkError) throw bookmarkError;

    const seriesIds = (bookmarkRows || []).map((row) => row.series_id).filter(Boolean);
    if (!seriesIds.length) return [];

    const { data: seriesRows, error: seriesError } = await supabase
      .from("series")
      .select("id, title, slug, content_type, cover_image_url")
      .in("id", seriesIds);

    if (seriesError) throw seriesError;

    const seriesMap = new Map((seriesRows || []).map((item) => [item.id, item]));

    return (bookmarkRows || [])
      .map((row) => {
        const series = seriesMap.get(row.series_id);
        if (!series) return null;
        return {
          id: series.id,
          title: series.title,
          slug: series.slug,
          type: series.content_type || "novel",
          image: series.cover_image_url || "/images/image1.png",
          time: "Saved on your account"
        };
      })
      .filter(Boolean);
  }
}

export async function fetchUserLibrary(type = "reading") {
  const response = await callEdgeFunction("get-user-library", {
    queryParams: { type },
    method: "GET"
  });

  return (response?.library || []).map((item) => ({
    id: item.id,
    title: item.title,
    slug: item.slug,
    type: item.content_type || "novel",
    image: item.cover_image_url || "/images/image1.png",
    time:
      type === "reading"
        ? "Continue reading"
        : type === "bookmarked"
          ? "Saved on your account"
          : "Available in your library",
    progress:
      type === "reading" && item.progress
        ? Math.max(0, Math.min(100, Number(item.progress.last_position || 0)))
        : null,
    totalEpisodes: Number(item.total_episodes || 0),
    lastReadAt: item.progress?.last_read_at || "",
    raw: item
  }));
}
