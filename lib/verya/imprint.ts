import type { ImprintEffect, ImprintRule, RuntimeCommand, TraceEntry, VeryaProject } from "./types";
import { compareValues, getPath, setPath, uid } from "./util";

function readSource(project: VeryaProject, sourceId: string): unknown {
  if (sourceId === "world") return project.world;
  return project.entities.find((entity) => entity.id === sourceId)
    ?? project.npcs.find((npc) => npc.id === sourceId)
    ?? project;
}

function writeTarget(project: VeryaProject, targetId: string, path: string, value: unknown): VeryaProject {
  if (targetId === "world") {
    return { ...project, world: setPath(project.world, path, value) };
  }
  const entityIndex = project.entities.findIndex((entity) => entity.id === targetId);
  if (entityIndex >= 0) {
    const entities = [...project.entities];
    entities[entityIndex] = setPath(entities[entityIndex], path, value);
    return { ...project, entities };
  }
  const npcIndex = project.npcs.findIndex((npc) => npc.id === targetId);
  if (npcIndex >= 0) {
    const npcs = [...project.npcs];
    npcs[npcIndex] = setPath(npcs[npcIndex], path, value);
    return { ...project, npcs };
  }
  return project;
}

function applyEffect(project: VeryaProject, effect: ImprintEffect): VeryaProject {
  const source = effect.targetId === "world"
    ? project.world
    : project.entities.find((e) => e.id === effect.targetId)
      ?? project.npcs.find((n) => n.id === effect.targetId);
  const current = getPath(source, effect.path);
  let next: unknown = effect.value;
  if (effect.operation === "add") next = Number(current ?? 0) + Number(effect.value ?? 0);
  if (effect.operation === "subtract") next = Number(current ?? 0) - Number(effect.value ?? 0);
  if (effect.operation === "toggle") next = !Boolean(current);
  return writeTarget(project, effect.targetId, effect.path, next);
}

function triggerMatches(rule: ImprintRule, command: RuntimeCommand): boolean {
  if (command.type === "RUN_IMPRINT") return command.imprintId === rule.id;
  if (rule.trigger.type === "interaction" && command.type === "INTERACT") {
    return rule.trigger.sourceId === command.sourceId && rule.trigger.targetId === command.targetId;
  }
  if (rule.trigger.type === "timer" && command.type === "TICK") {
    const last = rule.lastRunAt ?? 0;
    return command.now - last >= rule.trigger.everyMs;
  }
  if (rule.trigger.type === "state" && command.type === "TICK") return true;
  if (rule.trigger.type === "proximity" && command.type === "TICK") return true;
  return false;
}

function conditionsPass(project: VeryaProject, rule: ImprintRule): boolean {
  return rule.conditions.every((condition) => {
    const source = readSource(project, condition.sourceId);
    return compareValues(getPath(source, condition.path), condition.operator, condition.value);
  });
}

function proximityPass(project: VeryaProject, rule: ImprintRule): boolean {
  if (rule.trigger.type !== "proximity") return true;
  const a = project.entities.find((e) => e.id === rule.trigger.sourceId);
  const b = project.entities.find((e) => e.id === rule.trigger.targetId);
  if (!a || !b) return false;
  const dx = a.position.x - b.position.x;
  const dy = a.position.y - b.position.y;
  const dz = a.position.z - b.position.z;
  return Math.hypot(dx, dy, dz) <= rule.trigger.radius;
}

export function runImprints(project: VeryaProject, command: RuntimeCommand): VeryaProject {
  let next = project;
  const ordered = [...project.imprints].sort((a, b) => b.priority - a.priority);
  for (const rule of ordered) {
    if (!rule.enabled || !triggerMatches(rule, command) || !proximityPass(next, rule)) continue;
    const now = command.type === "TICK" ? command.now : Date.now();
    if (rule.lastRunAt && now - rule.lastRunAt < rule.cooldownMs) continue;
    if (!conditionsPass(next, rule)) continue;

    for (const effect of rule.effects) next = applyEffect(next, effect);

    next = {
      ...next,
      imprints: next.imprints.map((item) => item.id === rule.id ? { ...item, lastRunAt: now } : item),
      trace: [
        {
          id: uid("trace"),
          at: now,
          category: "imprint",
          title: `Imprint fired · ${rule.name}`,
          detail: `${rule.conditions.length} conditions passed; ${rule.effects.length} world-state changes applied.`,
          subjectIds: [
            ...(rule.trigger.type === "interaction" ? [rule.trigger.sourceId, rule.trigger.targetId] : []),
            ...rule.effects.map((fx) => fx.targetId)
          ]
        } satisfies TraceEntry,
        ...next.trace
      ].slice(0, 250)
    };
  }
  return next;
}
