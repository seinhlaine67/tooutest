import {
  creators as mockCreators,
  getCreatorById as getMockCreatorById,
  getSeriesBySlug as getMockSeriesBySlug,
  series as mockSeries
} from "../data/mockData";
import { getStoredList } from "./storage";

export function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatCompactCount(value) {
  const number = Number(value) || 0;
  if (number >= 1000000) return `${(number / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
  if (number >= 1000) return `${(number / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(number);
}

export function getAllCreators() {
  const localCreators = getStoredList("toouLocalCreators");
  const merged = new Map();
  [...mockCreators, ...localCreators].forEach((creator) => {
    if (!creator?.id) return;
    merged.set(creator.id, creator);
  });
  return Array.from(merged.values());
}

export function getAllSeries() {
  const localSeries = getStoredList("toouLocalSeries");
  const merged = new Map();
  [...mockSeries, ...localSeries].forEach((item) => {
    if (!item?.slug) return;
    merged.set(item.slug, item);
  });
  return Array.from(merged.values());
}

export function getCreatorBySlug(slug) {
  return getAllCreators().find((creator) => creator.slug === slug) || null;
}

export function getCreatorById(creatorId) {
  return getAllCreators().find((creator) => creator.id === creatorId) || getMockCreatorById(creatorId);
}

export function getSeriesBySlug(slug) {
  return getAllSeries().find((item) => item.slug === slug) || getMockSeriesBySlug(slug);
}

export function getSeriesByCreator(creatorId) {
  return getAllSeries().filter((item) => item.creatorId === creatorId);
}
