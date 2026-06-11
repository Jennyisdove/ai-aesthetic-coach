"use client";

import { useEffect, useMemo, useState } from "react";
import type { StyleDNA } from "@/lib/mock-style-dna";
import {
  clearActiveStyleProfileId,
  createStyleProfile,
  getActiveStyleProfileId,
  getStyleProfiles,
  setActiveStyleProfileId,
  setStyleProfiles,
  type StyleProfile,
} from "@/lib/style-memory";

export function useStyleMemory() {
  const [memory, setMemory] = useState<{
    activeProfileId: string;
    isLoaded: boolean;
    profiles: StyleProfile[];
  }>({
    activeProfileId: "",
    isLoaded: false,
    profiles: [],
  });
  const { activeProfileId, isLoaded, profiles } = memory;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const storedProfiles = getStyleProfiles();
      const storedActiveProfileId = getActiveStyleProfileId();
      const hasStoredActiveProfile = storedProfiles.some(
        (profile) => profile.id === storedActiveProfileId,
      );

      setMemory({
        activeProfileId: hasStoredActiveProfile ? storedActiveProfileId : "",
        isLoaded: true,
        profiles: storedProfiles,
      });
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const activeProfile = useMemo(
    () => profiles.find((profile) => profile.id === activeProfileId) ?? null,
    [activeProfileId, profiles],
  );

  function saveCurrentStyle(styleDNA: StyleDNA, name: string) {
    const profile = createStyleProfile({ name, styleDNA });
    const nextProfiles = [profile, ...profiles];

    setMemory({
      activeProfileId: profile.id,
      isLoaded: true,
      profiles: nextProfiles,
    });
    setStyleProfiles(nextProfiles);
    setActiveStyleProfileId(profile.id);

    return profile;
  }

  function activateProfile(id: string) {
    const profile = profiles.find((item) => item.id === id);

    if (!profile) {
      return null;
    }

    setMemory({
      activeProfileId: id,
      isLoaded: true,
      profiles,
    });
    setActiveStyleProfileId(id);

    return profile;
  }

  function deleteProfile(id: string) {
    const nextProfiles = profiles.filter((profile) => profile.id !== id);
    const nextActiveProfile =
      id === activeProfileId ? nextProfiles[0] ?? null : activeProfile;

    setStyleProfiles(nextProfiles);

    if (nextActiveProfile) {
      setMemory({
        activeProfileId: nextActiveProfile.id,
        isLoaded: true,
        profiles: nextProfiles,
      });
      setActiveStyleProfileId(nextActiveProfile.id);
    } else {
      setMemory({
        activeProfileId: "",
        isLoaded: true,
        profiles: nextProfiles,
      });
      clearActiveStyleProfileId();
    }

    return nextActiveProfile;
  }

  return {
    activeProfile,
    activeProfileId,
    activateProfile,
    deleteProfile,
    isLoaded,
    profiles,
    saveCurrentStyle,
  };
}
