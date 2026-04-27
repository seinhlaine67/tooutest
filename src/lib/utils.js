export function parseCompactCount(value) {
  const text = String(value || "0").trim().replace(/,/g, "").toUpperCase();
  const match = text.match(/^([\d.]+)\s*([KMB])?$/);

  if (!match) {
    return Number.parseFloat(text) || 0;
  }

  const amount = Number.parseFloat(match[1]) || 0;
  const suffix = match[2] || "";

  if (suffix === "K") return amount * 1000;
  if (suffix === "M") return amount * 1000000;
  if (suffix === "B") return amount * 1000000000;
  return amount;
}

export function getTrendingScore(item) {
  return parseCompactCount(item.views) + parseCompactCount(item.likes);
}

export function titleCase(value) {
  return String(value || "")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const MOJIBAKE_PATTERN = /(?:\u00C3|\u00C2|\u00E1|\u00F0)/;

export function repairDisplayText(value) {
  if (typeof value !== "string" || !MOJIBAKE_PATTERN.test(value)) {
    return value;
  }

  try {
    const bytes = Uint8Array.from(Array.from(value, (char) => char.charCodeAt(0) & 0xff));
    const decoded = new TextDecoder("utf-8").decode(bytes);
    return decoded.includes("\ufffd") ? value : decoded;
  } catch {
    return value;
  }
}
