import { getUserAccount } from "./account";
import { getStoredList, setStoredList } from "./storage";
import { getSeriesBySlug } from "./toouData";

export const communityTags = [
  "#fantasypicks",
  "#bestwebtoon",
  "#newnovels",
  "#knowledgebooks",
  "#romancereads",
  "#comicrecommend"
];

export const starterPosts = [
  {
    id: "community-shadows",
    user: "Luna Reads",
    badge: "Top Curator",
    avatar: "/images/image1.png",
    level: "Power Supporter",
    time: "2h ago",
    createdAt: Date.now() - 2 * 60 * 60 * 1000,
    body: "If you love character-driven fantasy with high emotional payoff, this is the webtoon I keep recommending to everyone this week.",
    discussionTitle: "Why Shadows of Destiny is worth forwarding",
    seriesTitle: "Shadows of Destiny",
    genre: "Fantasy",
    caption: "Strong pacing, beautiful panels, and the kind of weekly cliffhanger that keeps you waiting for the next drop.",
    slug: "shadows-of-destiny",
    likes: 14,
    saves: 6,
    comments: [
      {
        id: "starter-comment-1",
        user: "Mira",
        author: "Mira",
        body: "Forwarded this to two friends already.",
        time: "1h ago",
        createdAt: Date.now() - 60 * 60 * 1000,
        avatar: "/images/image1.png",
        badge: "Super Reader",
        level: "Support Fan"
      }
    ]
  },
  {
    id: "community-midnight",
    user: "Kai Novelist",
    badge: "Mystery Badge",
    avatar: "/images/image1.png",
    level: "VIP Reader",
    time: "5h ago",
    createdAt: Date.now() - 5 * 60 * 60 * 1000,
    body: "This one feels perfect for readers who like slow-burn tension and atmospheric world-building without getting lost in filler.",
    discussionTitle: "Atmosphere-first mystery picks",
    seriesTitle: "Midnight Libra",
    genre: "Mystery",
    caption: "It is one of those reads where the mood stays with you even after the chapter ends.",
    slug: "midnight-libra",
    likes: 11,
    saves: 4,
    comments: []
  },
  {
    id: "community-hero-rise",
    user: "Mira Panels",
    badge: "Comic Scout",
    avatar: "/images/image1.png",
    level: "Elite Reader",
    time: "1d ago",
    createdAt: Date.now() - 24 * 60 * 60 * 1000,
    body: "For anyone looking for action-heavy recommendations, this series is an easy pick. The energy never drops.",
    discussionTitle: "Action series that stay bingeable",
    seriesTitle: "Hero Rise",
    genre: "Action",
    caption: "Fast-moving story, clean hook, and a very bingeable episode rhythm.",
    slug: "hero-rise",
    likes: 18,
    saves: 8,
    comments: []
  }
];

export const featureNotice = {
  tag: "Promotion",
  title: "April reading week unlocks new bonuses",
  copy: "Readers can enjoy limited-time promo campaigns, early access events, and special creator spotlights throughout the week.",
  image: "/images/image1.png"
};

export const noticeItems = [
  {
    type: "Announcement",
    date: "March 31, 2026",
    title: "Creator spotlight submissions are now open",
    body: "TooU is now accepting featured creator submissions for the next homepage spotlight cycle. Studios and solo creators can apply through the creator workflow."
  },
  {
    type: "Promotion",
    date: "March 29, 2026",
    title: "Readers can unlock bonus rewards this weekend",
    body: "Selected series and knowledge titles are participating in a weekend reading promotion with bonus rewards and special visibility inside the app."
  },
  {
    type: "Platform Update",
    date: "March 26, 2026",
    title: "Library and upload flows have been refreshed",
    body: "We have improved the mobile-first browsing flow across the library and creator upload experience to make the app easier to navigate."
  },
  {
    type: "Notice",
    date: "March 24, 2026",
    title: "Scheduled maintenance window for creator tools",
    body: "Creator-facing publishing tools may be temporarily unavailable during a scheduled update window. Reader browsing will remain available."
  }
];

export function getRelativeLabel(timestamp) {
  const diff = Date.now() - Number(timestamp || Date.now());
  const minutes = Math.floor(diff / 60000);
  if (minutes < 15) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function normalizePost(post) {
  return {
    ...post,
    discussionTitle: post.discussionTitle || post.title || "Community discussion",
    seriesTitle: post.seriesTitle || post.title || "Series",
    comments: Array.isArray(post.comments) ? post.comments : []
  };
}

function getEpisodeCommentCount(username) {
  try {
    const commentMap = JSON.parse(window.localStorage.getItem("toouEpisodeComments") || "{}");
    return Object.values(commentMap)
      .flat()
      .filter((comment) => comment.author === username || comment.user === username).length;
  } catch {
    return 0;
  }
}

export function getActivityBadgeForUser(username, createdAt) {
  const localPosts = getStoredList("toouCommunityPosts");
  const postCount = localPosts.filter((post) => post.user === username).length;
  const communityCommentCount = localPosts
    .flatMap((post) => post.comments || [])
    .filter((comment) => comment.author === username || comment.user === username).length;
  const totalEngagement = localPosts
    .filter((post) => post.user === username)
    .reduce((sum, post) => sum + Number(post.likes || 0) + Number(post.saves || 0), 0);
  const commentCount = getEpisodeCommentCount(username) + communityCommentCount;
  const ageDays = createdAt ? (Date.now() - Number(createdAt)) / 86400000 : 999;

  if (totalEngagement >= 20) return "Community Star";
  if (commentCount >= 20) return "Top Contributor";
  if (postCount >= 3) return "Hype Starter";
  if (commentCount >= 5) return "Super Reader";
  if (commentCount >= 1) return "First Voice";
  if (ageDays <= 7) return "New Reader";
  return "New Reader";
}

export function getSupportLevelForUser(username) {
  const userAccount = getUserAccount();
  if (!userAccount || userAccount.username !== username) return "Egg Starter";
  const total = Number(userAccount.eggsPurchasedTotal || 0);
  if (total >= 8000) return "Legend Supporter";
  if (total >= 4000) return "Elite Reader";
  if (total >= 1500) return "VIP Reader";
  if (total >= 500) return "Power Supporter";
  if (total >= 100) return "Support Fan";
  return "Egg Starter";
}

export function getUserMeta(name, avatar, badge, level, createdAt) {
  const userAccount = getUserAccount();
  if (userAccount && name === userAccount.username) {
    return {
      avatar: userAccount.avatar || avatar || "/images/image1.png",
      activityBadge: getActivityBadgeForUser(name, userAccount.createdAt || createdAt),
      supportLevel: getSupportLevelForUser(name)
    };
  }

  return {
    avatar: avatar || "/images/image1.png",
    activityBadge: badge || "Reader",
    supportLevel: level || "Egg Starter"
  };
}

export function getAllCommunityPosts() {
  const localPosts = getStoredList("toouCommunityPosts").map(normalizePost);
  return [
    ...localPosts,
    ...starterPosts.map(normalizePost).filter((starter) => !localPosts.some((post) => post.id === starter.id))
  ];
}

export function updateCommunityPost(postId, updater) {
  const localPosts = getStoredList("toouCommunityPosts").map(normalizePost);
  const existing = localPosts.find((post) => post.id === postId);
  if (existing) {
    setStoredList(
      "toouCommunityPosts",
      localPosts.map((post) => (post.id === postId ? updater(post) : post))
    );
    return;
  }

  const starter = starterPosts.map(normalizePost).find((post) => post.id === postId);
  if (!starter) return;
  setStoredList("toouCommunityPosts", [updater(starter), ...localPosts]);
}

export function toggleStoredId(key, id) {
  const values = new Set(getStoredList(key));
  if (values.has(id)) values.delete(id);
  else values.add(id);
  setStoredList(key, Array.from(values));
  return values.has(id);
}

export function getSeriesCardForPost(post) {
  return getSeriesBySlug(post.slug);
}
