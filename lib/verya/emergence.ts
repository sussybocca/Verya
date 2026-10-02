import type { EmergenceEvent, TraceEntry, VeryaProject } from "./types";
import { clamp, uid } from "./util";

function makeEvent(project: VeryaProject, key: string, event: Omit<EmergenceEvent, "id" | "createdAt" | "resolved">): EmergenceEvent | undefined {
  const exists = project.emergence.some((item) => !item.resolved && item.title === event.title);
  if (exists) return undefined;
  return { ...event, id: uid(`event_${key}`), createdAt: Date.now(), resolved: false };
}

export function tickEmergence(project: VeryaProject, now: number): VeryaProject {
  if (!project.settings.running) return project;
  const nextEvents: EmergenceEvent[] = [];
  const traces: TraceEntry[] = [];

  for (const job of project.jobs) {
    const working = project.npcs.filter((npc) => npc.career.jobId === job.id).length;
    if (working < Math.max(1, Math.floor(job.capacity / 2))) {
      const event = makeEvent(project, `vacancy_${job.id}`, {
        type: "vacancy",
        title: `${job.title} vacancy`,
        detail: `Only ${working} of ${job.capacity} supported ${job.title.toLowerCase()} roles are currently occupied. ECHO may treat this as a career opportunity.`,
        severity: clamp((job.capacity - working) / Math.max(job.capacity, 1)),
        subjectIds: [job.id]
      });
      if (event) nextEvents.push(event);
    }
  }

  for (const [resource, demand] of Object.entries(project.economy.demand)) {
    const supply = project.economy.supply[resource] ?? 0;
    if (demand > supply * 1.15) {
      const event = makeEvent(project, `shortage_${resource}`, {
        type: "shortage",
        title: `${resource[0].toUpperCase() + resource.slice(1)} shortage`,
        detail: `Demand (${demand.toFixed(0)}) exceeds supply (${supply.toFixed(0)}). Prices and NPC opportunities may react.`,
        severity: clamp((demand - supply) / Math.max(demand, 1)),
        subjectIds: []
      });
      if (event) nextEvents.push(event);
    }
  }

  if (!nextEvents.length) return project;
  for (const event of nextEvents) {
    traces.push({
      id: uid("trace"),
      at: now,
      category: "emergence",
      title: `Emergence · ${event.title}`,
      detail: event.detail,
      subjectIds: event.subjectIds
    });
  }
  return {
    ...project,
    emergence: [...nextEvents, ...project.emergence].slice(0, 100),
    trace: [...traces, ...project.trace].slice(0, 250)
  };
}

export function tickEconomy(project: VeryaProject, elapsedWorldMinutes: number): VeryaProject {
  if (!project.settings.running) return project;
  const fractionDay = elapsedWorldMinutes / 1440;
  const supply = { ...project.economy.supply };
  const demand = { ...project.economy.demand };
  const prices = { ...project.economy.prices };

  const bakers = project.npcs.filter((npc) => npc.career.jobId === "job_baker").length;
  supply.bread = Math.max(0, (supply.bread ?? 0) + bakers * 18 * fractionDay - 9 * fractionDay);
  demand.bread = Math.max(1, (demand.bread ?? 1) + project.npcs.length * 1.8 * fractionDay);
  const pressure = (demand.bread - supply.bread) / Math.max(demand.bread, 1);
  prices.bread = clamp((prices.bread ?? 4.2) * (1 + pressure * 0.04 * fractionDay), 1.5, 25);

  let minuteOfDay = project.economy.minuteOfDay + elapsedWorldMinutes;
  let day = project.economy.day;
  while (minuteOfDay >= 1440) {
    minuteOfDay -= 1440;
    day += 1;
  }

  return { ...project, economy: { ...project.economy, day, minuteOfDay, supply, demand, prices } };
}
