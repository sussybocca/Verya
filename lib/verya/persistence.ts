import type { VeryaProject } from "./types";
import { createSeedProject } from "./seed";
import { dispatchRuntime } from "./runtime";

const KEY = "verya.project.v1";

export function loadProject(): VeryaProject {
  if (typeof window === "undefined") return createSeedProject();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return createSeedProject();
    const value = JSON.parse(raw) as VeryaProject;
    if (value.schemaVersion !== 1) return createSeedProject();

    if (value.settings.simulateWhenHidden) {
      const now = Date.now();
      const gap = Math.max(0, now - value.updatedAt);
      let remaining = Math.min(gap, 4 * 60 * 60 * 1000);
      let cursor = now - remaining;
      let caughtUp = value;
      while (remaining > 5_000) {
        const deltaMs = Math.min(60_000, remaining);
        cursor += deltaMs;
        caughtUp = dispatchRuntime(
          { ...caughtUp, settings: { ...caughtUp.settings, running: true } },
          { type: "TICK", now: cursor, deltaMs }
        );
        remaining -= deltaMs;
      }
      return { ...caughtUp, settings: { ...caughtUp.settings, running: false }, updatedAt: now };
    }

    return value;
  } catch {
    return createSeedProject();
  }
}

export function saveProject(project: VeryaProject): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(project));
}

export function exportProject(project: VeryaProject): void {
  const payload = JSON.stringify(project, null, 2);
  const url = URL.createObjectURL(new Blob([payload], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${project.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "verya-project"}.verya.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export async function importProject(file: File): Promise<VeryaProject> {
  const parsed = JSON.parse(await file.text()) as VeryaProject;
  if (parsed.schemaVersion !== 1 || !Array.isArray(parsed.entities) || !Array.isArray(parsed.npcs)) {
    throw new Error("This is not a compatible Verya project.");
  }
  return parsed;
}
