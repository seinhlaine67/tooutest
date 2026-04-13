export function getUserAccount() {
  try {
    return JSON.parse(window.localStorage.getItem("toouUserAccount") || "null");
  } catch {
    return null;
  }
}

export function setUserAccount(value) {
  window.localStorage.setItem("toouUserAccount", JSON.stringify(value));
}

export function getCreatorProfile() {
  try {
    return JSON.parse(window.localStorage.getItem("toouCreatorProfile") || "null");
  } catch {
    return null;
  }
}

export function setCreatorProfile(value) {
  window.localStorage.setItem("toouCreatorProfile", JSON.stringify(value));
}

export function readFileAsDataUrl(file, fallback = "") {
  return new Promise((resolve) => {
    if (!file) {
      resolve(fallback);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : fallback);
    reader.onerror = () => resolve(fallback);
    reader.readAsDataURL(file);
  });
}
