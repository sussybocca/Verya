import type { RuntimeCommand, VeryaProject } from "./types";
import { tickEcho } from "./echo";
import { tickEconomy, tickEmergence } from "./emergence";
import { runImprints } from "./imprint";
import { uid } from "./util";

export function dispatchRuntime(project: VeryaProject, command: RuntimeCommand): VeryaProject {
  let next = runImprints(project, command);

  if (command.type === "SET_ENTITY_PROPERTY") {
    next = {
      ...next,
      entities: next.entities.map((entity) =>
        entity.id === command.entityId
          ? { ...entity, properties: { ...entity.properties, [command.path.replace(/^properties\./, "")]: command.value } }
          : entity
      )
    };
  }

  if (command.type === "TICK" && next.settings.running) {
    const worldMinutes = (command.deltaMs / 1000) * next.settings.speed * Math.max(1, next.world.timeScale) * 2.5;
    next = tickEconomy(next, worldMinutes);
    next = tickEcho(next, command.now, worldMinutes);
    next = tickEmergence(next, command.now);
  }

  return { ...next, updatedAt: Date.now() };
}

export function interact(project: VeryaProject, sourceId: string, targetId: string): VeryaProject {
  const beforeTraceCount = project.trace.length;
  const next = dispatchRuntime(project, { type: "INTERACT", sourceId, targetId });
  if (next.trace.length !== beforeTraceCount) return next;
  return {
    ...next,
    trace: [{
      id: uid("trace"),
      at: Date.now(),
      category: "system" as const,
      title: "Interaction had no matching Imprint",
      detail: `${sourceId} interacted with ${targetId}; no enabled rule matched the current world state.`,
      subjectIds: [sourceId, targetId]
    }, ...next.trace].slice(0, 250)
  };
}
