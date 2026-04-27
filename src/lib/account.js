import { supabase } from "./supabase";

const ACCOUNT_KEY = "toouUserAccount";
const CREATOR_KEY = "toouCreatorProfile";

function readJson(key) {
  try {
    return JSON.parse(window.localStorage.getItem(key) || "null");
  } catch {
    return null;
  }
}

function writeJson(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function getStoredUserAccount() {
  return readJson(ACCOUNT_KEY);
}

export function getUserAccount() {
  const stored = getStoredUserAccount();
  const session = readJson("toouSupabaseSessionUser");

  if (!session && !stored) return null;

  return {
    displayName:
      stored?.displayName ||
      stored?.display_name ||
      stored?.username ||
      session?.user_metadata?.display_name ||
      session?.user_metadata?.username ||
      session?.email?.split("@")[0] ||
      "",
    username:
      stored?.username ||
      session?.user_metadata?.username ||
      session?.email?.split("@")[0] ||
      "",
    email: stored?.email || session?.email || "",
    phone_number: stored?.phone_number || "",
    birthdate: stored?.birthdate || "",
    place: stored?.place || "",
    content_interests: stored?.content_interests || [],
    genre_interests: stored?.genre_interests || [],
    avatar: stored?.avatar || "https://i.pravatar.cc/120?img=12",
    coins: stored?.coins ?? 50,
    eggsPurchasedTotal: stored?.eggsPurchasedTotal ?? 0,
    createdAt: stored?.createdAt ?? Date.now(),
    plan: stored?.plan || "Reader",
    bio: stored?.bio || "Content enthusiast and aspiring creator",
    supabaseUserId: session?.id || stored?.supabaseUserId || ""
  };
}

export function setUserAccount(value) {
  writeJson(ACCOUNT_KEY, value);
}

export function getCreatorProfile() {
  return readJson(CREATOR_KEY);
}

export function setCreatorProfile(value) {
  writeJson(CREATOR_KEY, value);
}

export function syncSupabaseSessionUser(sessionUser) {
  if (!sessionUser) {
    window.localStorage.removeItem("toouSupabaseSessionUser");
    return;
  }

  writeJson("toouSupabaseSessionUser", {
    id: sessionUser.id,
    email: sessionUser.email,
    user_metadata: sessionUser.user_metadata || {}
  });
}

export async function signOutAccount() {
  await supabase.auth.signOut();
  window.localStorage.removeItem("toouSupabaseSessionUser");
  window.localStorage.removeItem(ACCOUNT_KEY);
  window.localStorage.removeItem(CREATOR_KEY);
}

export function readFileAsDataUrl(file, fallback = "") {
  return new Promise((resolve) => {
    if (!file) {
      resolve(fallback);
      return;
    }

    const reader = new FileReader();
    reader.onload = () =>
      resolve(typeof reader.result === "string" ? reader.result : fallback);
    reader.onerror = () => resolve(fallback);
    reader.readAsDataURL(file);
  });
}
