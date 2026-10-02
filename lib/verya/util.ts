import type { CompareOperator, PropertyValue } from "./types";

export function uid(prefix = "id"): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now().toString(36)}_${rand}`;
}

export function clamp(value: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, value));
}

export function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function seededUnit(seed: number, salt: string): number {
  let x = (seed ^ hashString(salt)) >>> 0;
  x += 0x6d2b79f5;
  let t = x;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function compareValues(left: unknown, op: CompareOperator, right: PropertyValue): boolean {
  switch (op) {
    case "eq": return left === right;
    case "neq": return left !== right;
    case "gt": return Number(left) > Number(right);
    case "gte": return Number(left) >= Number(right);
    case "lt": return Number(left) < Number(right);
    case "lte": return Number(left) <= Number(right);
    case "includes":
      return Array.isArray(left)
        ? left.includes(right)
        : typeof left === "string"
          ? left.includes(String(right))
          : false;
  }
}

export function getPath(source: unknown, path: string): unknown {
  if (!path) return source;
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in acc) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, source);
}

export function setPath<T>(source: T, path: string, nextValue: unknown): T {
  const keys = path.split(".").filter(Boolean);
  if (!keys.length) return source;
  const root = structuredClone(source) as Record<string, unknown>;
  let cursor = root;
  keys.forEach((key, index) => {
    if (index === keys.length - 1) {
      cursor[key] = nextValue;
      return;
    }
    const existing = cursor[key];
    cursor[key] =
      existing && typeof existing === "object" && !Array.isArray(existing)
        ? { ...(existing as Record<string, unknown>) }
        : {};
    cursor = cursor[key] as Record<string, unknown>;
  });
  return root as T;
}

export function formatClock(minuteOfDay: number): string {
  const minutes = ((Math.floor(minuteOfDay) % 1440) + 1440) % 1440;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}
