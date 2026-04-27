const SUBSCRIPTION_KEY = "toouUserSubscription";

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

export function getStoredSubscription() {
  const stored = readJson(SUBSCRIPTION_KEY);
  if (!stored) return null;

  const expiresAt = stored.expiresAt ? new Date(stored.expiresAt) : null;
  const now = new Date();
  let derivedStatus = stored.status || "inactive";

  if (expiresAt && expiresAt <= now) {
    derivedStatus = "expired";
  } else if (expiresAt) {
    const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / 86400000);
    if (daysLeft <= 7) derivedStatus = "expiring_soon";
    else derivedStatus = "active";
  }

  return {
    ...stored,
    status: derivedStatus
  };
}

export function setStoredSubscription(value) {
  writeJson(SUBSCRIPTION_KEY, value);
}

export function getSubscriptionDaysLeft(subscription) {
  if (!subscription?.expiresAt) return 0;
  return Math.max(
    0,
    Math.ceil((new Date(subscription.expiresAt).getTime() - Date.now()) / 86400000)
  );
}
