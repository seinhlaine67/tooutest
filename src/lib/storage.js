export function getStoredList(key) {
  try {
    return JSON.parse(window.localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

export function setStoredList(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function getStoredMap(key) {
  try {
    const value = JSON.parse(window.localStorage.getItem(key) || "{}");
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
}

export function setStoredMap(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value));
}
