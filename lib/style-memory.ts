import type { StyleDNA } from "@/lib/mock-style-dna";

const STYLE_PROFILES_KEY = "fashionCoach.styleProfiles";
const ACTIVE_PROFILE_ID_KEY = "fashionCoach.activeStyleProfileId";

export interface StyleProfile {
  id: string;
  name: string;
  createdAt: string;
  styleDNA: StyleDNA;
}

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function isStyleProfile(value: unknown): value is StyleProfile {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    typeof record.id === "string" &&
    typeof record.name === "string" &&
    typeof record.createdAt === "string" &&
    Boolean(record.styleDNA) &&
    typeof (record.styleDNA as StyleDNA).styleName === "string"
  );
}

export function getStyleProfiles(): StyleProfile[] {
  if (!canUseStorage()) {
    return [];
  }

  try {
    const rawProfiles = window.localStorage.getItem(STYLE_PROFILES_KEY);
    const parsed: unknown = rawProfiles ? JSON.parse(rawProfiles) : [];

    return Array.isArray(parsed) ? parsed.filter(isStyleProfile) : [];
  } catch {
    return [];
  }
}

export function setStyleProfiles(profiles: StyleProfile[]) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(STYLE_PROFILES_KEY, JSON.stringify(profiles));
}

export function getActiveStyleProfileId() {
  if (!canUseStorage()) {
    return "";
  }

  return window.localStorage.getItem(ACTIVE_PROFILE_ID_KEY) || "";
}

export function setActiveStyleProfileId(id: string) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(ACTIVE_PROFILE_ID_KEY, id);
}

export function clearActiveStyleProfileId() {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(ACTIVE_PROFILE_ID_KEY);
}

export function createStyleProfile({
  name,
  styleDNA,
}: {
  name: string;
  styleDNA: StyleDNA;
}): StyleProfile {
  const createdAt = new Date().toISOString();

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    name: name.trim() || `${styleDNA.styleName} · ${createdAt.slice(0, 10)}`,
    createdAt,
    styleDNA,
  };
}
