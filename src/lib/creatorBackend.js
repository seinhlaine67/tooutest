import { getCreatorProfile, setCreatorProfile } from "./account";
import { supabase } from "./supabase";
import { convertHTMLToBlocks } from "./editorConverter";
import { callEdgeFunction } from "./backend";

function slugify(value) {
  return String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .trim()
    .replace(/[^\p{Letter}\p{Number}\s-]+/gu, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatCompactCount(value) {
  const number = Number(value) || 0;
  if (number >= 1000000) return `${(number / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
  if (number >= 1000) return `${(number / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(number);
}

function resolveEpisodePublication(episode) {
  if (episode.release === "draft") return "draft";
  if (episode.release === "schedule") return "scheduled";
  return "published";
}

function resolveEpisodeType(seriesType) {
  return seriesType === "novel" || seriesType === "knowledge" ? "novel" : "webtoon";
}

function pickDefinedEntries(entries) {
  return Object.fromEntries(
    Object.entries(entries).filter(([, value]) => value !== undefined && value !== null)
  );
}

function withTimeout(promise, ms, label) {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = window.setTimeout(() => {
      reject(new Error(`${label} timed out after ${Math.round(ms / 1000)} seconds.`));
    }, ms);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    window.clearTimeout(timeoutId);
  });
}

function toPlainText(node) {
  if (!node) return "";
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(toPlainText).filter(Boolean).join("");
  if (typeof node === "object") {
    if (typeof node.text === "string") return node.text;
    if (node.content) return toPlainText(node.content);
  }
  return "";
}

function blockToBody(block) {
  if (typeof block?.body === "string" && block.body.trim()) return block.body.trim();
  const text = toPlainText(block?.content).trim();
  if (!text) return "";
  return block?.block_type === "heading" ? `## ${text}` : text;
}

function getMissingColumnName(error) {
  const message = String(error?.message || error?.details || "");
  const match = message.match(/Could not find the '([^']+)' column/i);
  return match?.[1] || null;
}

function mapSeriesToCard(series) {
  if (!series?.id) return null;

  return {
    id: series.id,
    title: series.title || "Untitled Series",
    slug: series.slug || series.id,
    image: series.cover_image_url || "/images/image1.png",
    detailImage: series.hero_image_url || series.cover_image_url || "/images/image1.png",
    synopsis: series.description || "",
    type: series.content_type || "novel",
    genre: Array.isArray(series.genre) ? series.genre[0] || "General" : series.genre || "General",
    views: formatCompactCount(series.total_views || series.total_views_count),
    likes: formatCompactCount(series.total_likes || series.total_likes_count),
    badge: series.status === "published" ? "Live" : ""
  };
}

function mapMembershipToArtist(member, creatorProfile, profile) {
  return {
    id: member.member_creator_profile_id,
    slug: creatorProfile?.slug || slugify(profile?.display_name || profile?.username || member.member_creator_profile_id),
    username: profile?.username || creatorProfile?.slug || "",
    name: profile?.display_name || profile?.username || "TooU Creator",
    avatar: profile?.avatar_url || "/images/image1.png",
    role: member.role_label || "Featured Creator",
    status: member.membership_status || "pending"
  };
}

function mapEdgeMemberToArtist(member = {}) {
  return {
    id: member.id || member.member_creator_id || "",
    slug: member.slug || member.username || "",
    username: member.username || member.slug || "",
    name: member.display_name || member.studio_name || member.username || "TooU Creator",
    avatar: member.avatar_url || "/images/image1.png",
    role: member.role || member.role_label || "Featured Creator",
    status: member.status || member.membership_status || "pending"
  };
}

function buildCreatorPayload(localProfile = {}, action = "update") {
  const creatorType = localProfile?.role === "studio" ? "studio" : "individual";
  const displayName =
    creatorType === "studio"
      ? localProfile?.displayName || localProfile?.readerDisplayName || localProfile?.readerName || ""
      : localProfile?.displayName || localProfile?.readerDisplayName || "";

  return pickDefinedEntries({
    action,
    creator_type: creatorType,
    display_name: displayName || undefined,
    studio_name: creatorType === "studio" ? localProfile?.studioName || undefined : undefined,
    slug: localProfile?.slug || undefined,
    bio: localProfile?.bio || undefined,
    hero_image_url: localProfile?.cover || undefined,
    phone_number: localProfile?.phoneNumber || undefined,
    national_id_url: localProfile?.nationalId || undefined,
    primary_format: localProfile?.primaryFormat || undefined,
    content_categories: localProfile?.contentCategories || localProfile?.creatorFormats || undefined,
    artist_style: localProfile?.artistStyle || undefined,
    publishing_goals: localProfile?.goals || undefined,
    portfolio_url: localProfile?.portfolio || undefined
  });
}

function mapEdgeCreatorResponseToLocal(remoteProfile = {}, localProfile = {}, fallbackEmail = "") {
  const username = remoteProfile?.profiles?.username || localProfile?.readerName || "";
  const displayName =
    remoteProfile?.display_name ||
    remoteProfile?.studio_name ||
    localProfile?.displayName ||
    username ||
    "TooU Creator";

  return {
    ...localProfile,
    role: remoteProfile?.creator_type === "studio" ? "studio" : "individual",
    displayName,
    studioName: remoteProfile?.studio_name || localProfile?.studioName || "",
    avatar: localProfile?.avatar || remoteProfile?.profiles?.avatar_url || "",
    cover: remoteProfile?.hero_image_url || localProfile?.cover || "",
    phoneNumber:
      remoteProfile?.phone_number !== undefined && remoteProfile?.phone_number !== null
        ? String(remoteProfile.phone_number)
        : localProfile?.phoneNumber || "",
    nationalId: remoteProfile?.national_id_url || localProfile?.nationalId || "",
    primaryFormat: remoteProfile?.primary_format || localProfile?.primaryFormat || "webtoon",
    contentCategories:
      remoteProfile?.content_categories || localProfile?.contentCategories || localProfile?.creatorFormats || [],
    creatorFormats:
      remoteProfile?.content_categories || localProfile?.creatorFormats || localProfile?.contentCategories || [],
    artistStyle: remoteProfile?.artist_style || localProfile?.artistStyle || "",
    goals: remoteProfile?.publishing_goals || localProfile?.goals || "",
    portfolio: remoteProfile?.portfolio_url || localProfile?.portfolio || "",
    bio: remoteProfile?.bio || localProfile?.bio || "",
    email: fallbackEmail || localProfile?.email || "",
    readerName: username,
    slug: remoteProfile?.slug || localProfile?.slug || "",
    remoteId: remoteProfile?.id || localProfile?.remoteId || "",
    remoteUserId: remoteProfile?.id || localProfile?.remoteUserId || "",
    verificationStatus: remoteProfile?.verification_status || localProfile?.verificationStatus || "pending"
  };
}

function mapEdgeCreatorProfileResponse(response = {}) {
  const remoteProfile = response?.profile || {};
  const series = response?.series || [];
  const stats = response?.stats || {};
  const studioMembers = (remoteProfile?.studio_members || []).map(mapEdgeMemberToArtist);
  const creatorName =
    remoteProfile?.display_name ||
    remoteProfile?.studio_name ||
    remoteProfile?.username ||
    "TooU Creator";

  return {
    creator: {
      id: remoteProfile?.id || "",
      remoteId: remoteProfile?.id || "",
      remoteUserId: remoteProfile?.id || "",
      slug: remoteProfile?.slug || remoteProfile?.username || "",
      name: creatorName,
      displayName: creatorName,
      studioName: remoteProfile?.studio_name || "",
      role: remoteProfile?.creator_type === "studio" ? "studio" : "individual",
      type: remoteProfile?.creator_type === "studio" ? "studio" : "creator",
      username: remoteProfile?.username || "",
      avatar: remoteProfile?.avatar_url || "/images/image1.png",
      cover: remoteProfile?.hero_image_url || remoteProfile?.avatar_url || "/images/image1.png",
      bio: remoteProfile?.bio || "",
      followers: formatCompactCount(remoteProfile?.follower_count),
      followerCount: Number(remoteProfile?.follower_count) || 0,
      rating: remoteProfile?.heat_score ? Number(remoteProfile.heat_score).toFixed(1) : "New",
      isFollowing: Boolean(remoteProfile?.is_following),
      verificationStatus: remoteProfile?.verification_status || "pending",
      featuredArtists: studioMembers
    },
    works: (series || []).map(mapSeriesToCard).filter(Boolean),
    stats: {
      totalSeries: Number(stats?.total_series) || 0,
      totalEpisodes: Number(stats?.total_episodes) || 0,
      totalViews: Number(stats?.total_views) || 0,
      totalLikes: Number(stats?.total_likes) || 0
    }
  };
}

async function tryInsert(table, payload) {
  const attemptedPayload = { ...pickDefinedEntries(payload) };
  let lastError = null;

  while (Object.keys(attemptedPayload).length > 0) {
    const { data, error } = await supabase.from(table).insert(attemptedPayload).select().single();
    if (!error) return data;

    lastError = error;
    const missingColumn = getMissingColumnName(error);
    if (!missingColumn || !(missingColumn in attemptedPayload)) break;

    delete attemptedPayload[missingColumn];
  }

  throw lastError;
}

async function tryInsertOrUpdateSeries(payload, existingId = "") {
  const attemptedPayload = { ...pickDefinedEntries(payload) };
  let lastError = null;

  while (Object.keys(attemptedPayload).length > 0) {
    let query = supabase.from("series");
    if (existingId) {
      query = query.update(attemptedPayload).eq("id", existingId);
    } else {
      query = query.insert(attemptedPayload);
    }

    const { data, error } = await query.select().single();
    if (!error) return data;

    lastError = error;
    const missingColumn = getMissingColumnName(error);
    if (!missingColumn || !(missingColumn in attemptedPayload)) break;

    delete attemptedPayload[missingColumn];
  }

  throw lastError;
}

async function insertNovelBlocks(episodeId, blocks) {
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
  } catch (novelBlocksError) {
    const { error } = await supabase.from("episode_text_blocks").insert(
      blocks.map((block, index) => ({
        episode_id: episodeId,
        sort_order: block.block_order || index + 1,
        body: blockToBody(block)
      }))
    );

    if (error) throw novelBlocksError;
  }
}

async function getProfileRow(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, bio, website")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function ensureProfileRow(user, localProfile = {}) {
  if (!user?.id) {
    throw new Error("You need to sign in before connecting creator mode to the backend.");
  }

  const existingProfile = await getProfileRow(user.id);
  if (existingProfile?.id) {
    return existingProfile;
  }

  const desiredUsername =
    localProfile?.readerName ||
    localProfile?.username ||
    user.user_metadata?.username ||
    user.email?.split("@")[0] ||
    `user-${user.id.slice(0, 8)}`;

  const profilePayload = {
    id: user.id,
    username: desiredUsername,
    display_name:
      localProfile?.readerDisplayName ||
      user.user_metadata?.username ||
      desiredUsername,
    avatar_url: localProfile?.readerAvatar || null,
    bio: localProfile?.readerBio || null
  };

  const { data, error } = await supabase
    .from("profiles")
    .insert(profilePayload)
    .select("id, username, display_name, avatar_url, bio")
    .single();

  if (error) {
    throw new Error(
      error.message ||
        "Could not create the base profiles row. Check the profiles INSERT policy in Supabase before creating creator mode."
    );
  }

  return data;
}

async function ensureUniqueCreatorSlug(baseSlug, userId) {
  const normalizedBase = slugify(baseSlug) || `creator-${userId.slice(0, 8)}`;

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidate = attempt === 0 ? normalizedBase : `${normalizedBase}-${attempt + 1}`;
    const { data, error } = await supabase
      .from("creator_profiles")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();

    if (error) throw error;
    if (!data?.id || data.id === userId) return candidate;
  }

  return `${normalizedBase}-${Date.now()}`;
}

async function fetchDirectCreatorProfileById(creatorId) {
  const { data: creatorProfile, error: creatorError } = await supabase
    .from("creator_profiles")
    .select("*")
    .eq("id", creatorId)
    .maybeSingle();

  if (creatorError) throw creatorError;
  if (!creatorProfile?.id) return null;

  const { data: profileRow, error: profileError } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, bio")
    .eq("id", creatorId)
    .maybeSingle();

  if (profileError) throw profileError;

  return { creatorProfile, profileRow };
}

async function fetchStudioMembersByStudioId(studioCreatorId) {
  const { data: memberships, error: membershipsError } = await supabase
    .from("studio_memberships")
    .select("id, studio_creator_profile_id, member_creator_profile_id, role_label, membership_status")
    .eq("studio_creator_profile_id", studioCreatorId)
    .neq("membership_status", "removed");

  if (membershipsError) throw membershipsError;
  if (!memberships?.length) return [];

  const memberIds = memberships.map((item) => item.member_creator_profile_id);

  const [{ data: creatorProfiles, error: creatorProfilesError }, { data: profileRows, error: profileRowsError }] =
    await Promise.all([
      supabase
        .from("creator_profiles")
        .select("id, slug, creator_type")
        .in("id", memberIds),
      supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .in("id", memberIds)
    ]);

  if (creatorProfilesError) throw creatorProfilesError;
  if (profileRowsError) throw profileRowsError;

  const creatorMap = new Map((creatorProfiles || []).map((item) => [item.id, item]));
  const profileMap = new Map((profileRows || []).map((item) => [item.id, item]));

  return memberships
    .map((member) => mapMembershipToArtist(member, creatorMap.get(member.member_creator_profile_id), profileMap.get(member.member_creator_profile_id)))
    .filter(Boolean);
}

async function fetchSeriesForCreator(creatorId) {
  try {
    const { data, error } = await supabase
      .from("series")
      .select("id, title, slug, description, cover_image_url, hero_image_url, content_type, genre, total_views, total_likes, status")
      .eq("creator_id", creatorId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []).map(mapSeriesToCard).filter(Boolean);
  } catch {
    return [];
  }
}

export async function getAuthenticatedUser() {
  const {
    data: { session }
  } = await supabase.auth.getSession();

  return session?.user || null;
}

export async function manageCreatorProfile(profileInput, action = "update") {
  const user = await getAuthenticatedUser();
  if (!user?.id) {
    throw new Error("You need to sign in before connecting creator mode to the backend.");
  }

  const localProfile = profileInput || getCreatorProfile() || {};
  const remoteProfile = await callEdgeFunction("manage-creator-profile", {
    payload: buildCreatorPayload(localProfile, action),
    method: "POST",
    timeoutMs: 20000
  });
  const nextProfile = mapEdgeCreatorResponseToLocal(remoteProfile, localProfile, user.email || "");
  setCreatorProfile(nextProfile);
  return {
    id: remoteProfile?.id || nextProfile.remoteId,
    user_id: remoteProfile?.id || nextProfile.remoteId,
    slug: remoteProfile?.slug || nextProfile.slug,
    verification_status: remoteProfile?.verification_status || nextProfile.verificationStatus || "pending",
    remoteId: remoteProfile?.id || nextProfile.remoteId,
    remoteUserId: remoteProfile?.id || nextProfile.remoteId
  };
}

export async function upsertCreatorProfile(profileInput) {
  const action = profileInput?.remoteId ? "update" : "create";
  return manageCreatorProfile(profileInput, action);
}

export async function fetchCreatorProfileBySlug(slug) {
  const response = await callEdgeFunction("get-creator-profile", {
    queryParams: { slug },
    method: "GET",
    timeoutMs: 20000
  });
  if (!response?.profile?.id) return null;
  return mapEdgeCreatorProfileResponse(response);
}

export async function fetchCreatorCandidates() {
  const { data: creatorProfiles, error: creatorError } = await supabase
    .from("creator_profiles")
    .select("id, slug, creator_type, studio_name, primary_format, bio, hero_image_url, heat_score, followers_count");

  if (creatorError) {
    console.error("Failed to load creator profiles:", creatorError);
    return [];
  }

  const ids = (creatorProfiles || []).map((item) => item.id);
  if (!ids.length) return [];

  const { data: profileRows, error: profileError } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, bio")
    .in("id", ids);

  if (profileError) {
    console.error("Failed to load profile rows:", profileError);
    return [];
  }

  const profileMap = new Map((profileRows || []).map((item) => [item.id, item]));

  return (creatorProfiles || []).map((item) => {
    const profileRow = profileMap.get(item.id);
    return {
      id: item.id,
      slug: item.slug || profileRow?.username || item.id,
      username: profileRow?.username || item.slug || "",
      name: profileRow?.display_name || profileRow?.username || "TooU Creator",
      avatar: profileRow?.avatar_url || "/images/image1.png",
      cover: item.hero_image_url || profileRow?.avatar_url || "/images/image1.png",
      bio: item.bio || profileRow?.bio || "",
      type: item.creator_type === "studio" ? "studio" : "creator",
      followers: formatCompactCount(item.followers_count),
      rating: item.heat_score ? Number(item.heat_score).toFixed(1) : "New",
      primaryFormat: item.primary_format || "Creator"
    };
  });
}

export async function listStudioMembers(studioSlug) {
  const data = await callEdgeFunction("manage-studio-members", {
    payload: pickDefinedEntries({
      action: "list",
      studio_slug: studioSlug || undefined
    }),
    method: "POST",
    timeoutMs: 20000
  });

  return Array.isArray(data) ? data.map(mapEdgeMemberToArtist) : [];
}

export async function addStudioMember({ studioSlug, memberUsername, role }) {
  if (!studioSlug || !memberUsername) {
    throw new Error("Studio slug and member username are required.");
  }
  return callEdgeFunction("manage-studio-members", {
    payload: {
      action: "add",
      studio_slug: studioSlug,
      member_username: memberUsername,
      role_label: role || "Featured Creator",
      membership_status: "active"
    },
    method: "POST",
    timeoutMs: 20000
  });
}

export async function removeStudioMember({ memberId, studioSlug }) {
  if (!memberId) throw new Error("Member creator id is required.");
  return callEdgeFunction("manage-studio-members", {
    payload: pickDefinedEntries({
      action: "remove",
      studio_slug: studioSlug || undefined,
      member_creator_id: memberId
    }),
    method: "POST",
    timeoutMs: 20000
  });
}

export async function updateStudioMemberRole({ memberId, role, studioSlug }) {
  if (!memberId) throw new Error("Member creator id is required.");
  return callEdgeFunction("manage-studio-members", {
    payload: pickDefinedEntries({
      action: "update",
      studio_slug: studioSlug || undefined,
      member_creator_id: memberId,
      role_label: role || "Featured Creator",
      membership_status: "active"
    }),
    method: "POST",
    timeoutMs: 20000
  });
}

export async function fetchCurrentCreatorProfile() {
  const user = await getAuthenticatedUser();
  if (!user) return null;
  const localProfile = getCreatorProfile() || {};
  const response = await callEdgeFunction("get-creator-profile", {
    queryParams: { creator_id: user.id },
    method: "GET",
    timeoutMs: 20000
  });
  if (!response?.profile?.id) return null;

  const hydratedProfile = mapEdgeCreatorResponseToLocal(response.profile, localProfile, user.email || "");
  setCreatorProfile(hydratedProfile);
  return hydratedProfile;
}

export async function publishSeries({
  creatorProfile,
  series,
  episodes
}) {
  const remoteCreatorProfile = await upsertCreatorProfile(creatorProfile);
  const now = new Date().toISOString();
  const hasPublishedEpisode = episodes.some((episode) => resolveEpisodePublication(episode) === "published");
  const isVisual = series.type === "webtoon" || series.type === "comics";
  const createdSeries = await tryInsertOrUpdateSeries(
    {
      creator_id: remoteCreatorProfile.id,
      title: series.title,
      slug: series.slug,
      description: series.synopsis || "",
      cover_image_url: series.coverUrl || series.image || "",
      hero_image_url: series.detailImage || series.coverUrl || series.image || "",
      content_type: series.type || "novel",
      genre: Array.isArray(series.genre) ? series.genre : series.genre ? [series.genre] : [],
      tags: series.hashtags || [],
      audience: series.audience || "General",
      status: hasPublishedEpisode ? "ongoing" : "draft",
      is_premium: series.access === "premium",
      published_at: hasPublishedEpisode ? now : null,
      updated_at: now
    },
    series.existingId
  );

  const savedEpisodes = [];
  for (let index = 0; index < episodes.length; index += 1) {
    const episode = episodes[index];
    const episodePublicationStatus = resolveEpisodePublication(episode);
    const blocks = convertHTMLToBlocks(episode.body);
    let createdEpisode;

    if (!isVisual) {
      createdEpisode = await tryInsert("episodes", {
        series_id: createdSeries.id,
        title: episode.title,
        episode_number: index + 1,
        description: episode.notes || "",
        cover_image_url: episode.thumbnail || series.coverUrl || series.image || null,
        episode_type: resolveEpisodeType(series.type),
        is_premium: episode.access === "premium",
        status: episodePublicationStatus,
        word_count:
          blocks
            .flatMap((block) => block?.content?.content || [])
            .map((item) => item?.text || "")
            .join(" ")
            .trim()
            .split(/\s+/)
            .filter(Boolean).length || 0,
        published_at: episodePublicationStatus === "published" ? now : null,
        scheduled_at: episodePublicationStatus === "scheduled" ? episode.scheduledFor : null
      });

      await insertNovelBlocks(createdEpisode.id, blocks);
      savedEpisodes.push(createdEpisode);
      continue;
    }

    createdEpisode = await tryInsert("episodes", {
      series_id: createdSeries.id,
      title: episode.title,
      episode_number: index + 1,
      description: episode.notes || "",
      cover_image_url: episode.thumbnail || series.coverUrl || series.image || null,
      episode_type: resolveEpisodeType(series.type),
      is_premium: episode.access === "premium",
      page_count: episode.images?.length || 0,
      status: episodePublicationStatus,
      published_at: episodePublicationStatus === "published" ? now : null,
      scheduled_at: episodePublicationStatus === "scheduled" ? episode.scheduledFor : null
    });

    if (episode.images && episode.images.length > 0) {
      const { error: pagesError } = await supabase.from("episode_pages").insert(
        episode.images.map((imgUrl, imgIndex) => ({
          episode_id: createdEpisode.id,
          image_url: imgUrl,
          sort_order: imgIndex + 1
        }))
      );

      if (pagesError) throw pagesError;
    }

    savedEpisodes.push(createdEpisode);
  }

  return {
    creatorProfile: remoteCreatorProfile,
    series: createdSeries,
    episodes: savedEpisodes
  };
}

export function mergeRemoteCreatorIntoLocal(localProfile, remoteProfile) {
  const nextProfile = {
    ...localProfile,
    remoteId: remoteProfile.id,
    remoteUserId: remoteProfile.user_id || remoteProfile.id,
    slug: remoteProfile.slug || localProfile.slug,
    verificationStatus: remoteProfile.verification_status || localProfile.verificationStatus || "pending"
  };

  setCreatorProfile(nextProfile);
  return nextProfile;
}
