import type { JobDefinition, Npc, NpcGoal, TraceEntry, VeryaProject } from "./types";
import { clamp, seededUnit, uid } from "./util";

type Candidate = { key: string; title: string; score: number; motionId?: string; targetId?: string; job?: JobDefinition };

function skillFit(npc: Npc, job: JobDefinition): number {
  const entries = Object.entries(job.requiredSkills);
  if (!entries.length) return 0.5;
  return entries.reduce((sum, [skill, min]) => sum + clamp((npc.skills[skill] ?? 0) / Math.max(min, 0.01)), 0) / entries.length;
}

function interestFit(npc: Npc, job: JobDefinition): number {
  const weights = Object.entries(job.interestWeights);
  if (!weights.length) return 0.5;
  const denom = weights.reduce((sum, [, weight]) => sum + weight, 0) || 1;
  return weights.reduce((sum, [interest, weight]) => sum + (npc.interests[interest] ?? 0) * weight, 0) / denom;
}

function occupancy(project: VeryaProject, jobId: string): number {
  return project.npcs.filter((npc) => npc.career.jobId === jobId).length;
}

function careerScore(project: VeryaProject, npc: Npc, job: JobDefinition): number {
  if (!job.enabled || occupancy(project, job.id) >= job.capacity) return -1;
  const curiosity = npc.traits.curiosity ?? 0.5;
  const ambition = npc.traits.ambition ?? 0.5;
  const dissatisfaction = 1 - npc.career.satisfaction;
  const novelty = npc.career.jobId === job.id ? 0 : 0.25 + curiosity * 0.2;
  return skillFit(npc, job) * 0.34
    + interestFit(npc, job) * 0.33
    + ambition * 0.12
    + dissatisfaction * 0.16
    + novelty;
}

function needCandidates(npc: Npc): Candidate[] {
  const n = npc.needs;
  return [
    { key: "rest", title: "Rest and recover", score: (1 - n.energy) * 1.3, motionId: "motion_idle", targetId: npc.homeId },
    { key: "eat", title: "Find something to eat", score: (1 - n.food) * 1.25, motionId: "motion_walk", targetId: "bakery" },
    { key: "social", title: "Spend time with someone", score: (1 - n.social) * 0.92 + (npc.traits.sociability ?? 0.5) * 0.25, motionId: "motion_wave" },
    { key: "purpose", title: "Work toward a meaningful goal", score: (1 - n.purpose) * 0.9 + (npc.traits.ambition ?? 0.5) * 0.22, motionId: "motion_work" },
    { key: "explore", title: "Explore somewhere unfamiliar", score: (npc.traits.curiosity ?? 0.5) * 0.55 + (npc.interests.travel ?? 0) * 0.5, motionId: "motion_walk" }
  ];
}

function selectGoal(npc: Npc): NpcGoal | undefined {
  return [...npc.goals].filter((g) => g.status === "active").sort((a, b) => b.priority - a.priority)[0];
}

function workplaceFor(project: VeryaProject, job: JobDefinition): string | undefined {
  return project.entities.find((entity) =>
    entity.kind === "building" || entity.kind === "zone"
      ? job.workplaceTags.some((tag) => entity.tags.includes(tag))
      : false
  )?.id;
}

function applyNeeds(npc: Npc, elapsedWorldMinutes: number): Npc {
  const drain = elapsedWorldMinutes / 1440;
  return {
    ...npc,
    needs: {
      energy: clamp(npc.needs.energy - drain * 0.28),
      food: clamp(npc.needs.food - drain * 0.42),
      social: clamp(npc.needs.social - drain * 0.2),
      safety: clamp(npc.needs.safety - drain * 0.03),
      purpose: clamp(npc.needs.purpose - drain * 0.12),
      comfort: clamp(npc.needs.comfort - drain * 0.09)
    }
  };
}

function actOnCandidate(project: VeryaProject, npc: Npc, candidate: Candidate, now: number): { npc: Npc; trace?: TraceEntry } {
  let next = { ...npc, currentAction: candidate.title, currentMotionId: candidate.motionId ?? npc.currentMotionId, lastDecisionAt: now };
  if (candidate.key === "rest") next = { ...next, needs: { ...next.needs, energy: clamp(next.needs.energy + 0.28), comfort: clamp(next.needs.comfort + 0.08) } };
  if (candidate.key === "eat") next = { ...next, needs: { ...next.needs, food: clamp(next.needs.food + 0.32) } };
  if (candidate.key === "social") {
    const peers = project.npcs.filter((peer) => peer.id !== next.id);
    const known = [...next.relationships].sort((a, b) => (b.familiarity + b.trust) - (a.familiarity + a.trust))[0];
    const partner = project.npcs.find((peer) => peer.id === known?.npcId) ?? peers[0];
    let relationships = next.relationships;
    let memories = next.memories;
    if (partner && project.settings.allowRelationshipEvolution) {
      const existing = relationships.find((rel) => rel.npcId === partner.id);
      const sociability = next.traits.sociability ?? 0.5;
      relationships = existing
        ? relationships.map((rel) => rel.npcId === partner.id ? {
            ...rel,
            familiarity: clamp(rel.familiarity + 0.035),
            trust: clamp(rel.trust + 0.018 * sociability),
            affection: clamp(rel.affection + 0.014 * sociability),
            tension: clamp(rel.tension - 0.012)
          } : rel)
        : [...relationships, {
            npcId: partner.id,
            trust: 0.22,
            affection: 0.18,
            respect: 0.25,
            familiarity: 0.16,
            tension: 0.04
          }];
      const shared = [...partner.memories].sort((a, b) => b.importance - a.importance)[0];
      if (shared && !memories.some((memory) => memory.summary.includes(shared.summary))) {
        memories = [{
          id: uid("mem"),
          kind: "event" as const,
          summary: `Heard from ${partner.displayName}: ${shared.summary}`,
          subjectIds: [next.id, partner.id, ...shared.subjectIds].slice(0, 5),
          importance: clamp(shared.importance * 0.55),
          valence: shared.valence * 0.8,
          createdAt: now,
          decay: Math.min(0.12, shared.decay + 0.03)
        }, ...memories].slice(0, 60);
      }
    }
    next = {
      ...next,
      relationships,
      memories,
      needs: { ...next.needs, social: clamp(next.needs.social + 0.22) }
    };
  }
  if (candidate.key === "purpose") {
    const goal = selectGoal(next);
    if (goal) {
      next = {
        ...next,
        needs: { ...next.needs, purpose: clamp(next.needs.purpose + 0.15) },
        goals: next.goals.map((g) => g.id === goal.id ? { ...g, progress: clamp(g.progress + 0.025) } : g)
      };
    }
  }
  if (candidate.key === "career" && candidate.job && project.settings.allowCareerChanges && !next.protectedRole) {
    const previous = next.career.jobId;
    const workplaceId = workplaceFor(project, candidate.job);
    next = {
      ...next,
      currentAction: `Starting work as ${candidate.job.title}`,
      currentMotionId: candidate.job.id === "job_baker" ? "motion_cook" : "motion_work",
      career: {
        jobId: candidate.job.id,
        workplaceId,
        level: 1,
        satisfaction: Math.max(0.58, interestFit(next, candidate.job)),
        startedAt: now,
        history: [
          ...next.career.history.map((h) => h.jobId === previous && h.endedAt == null ? { ...h, endedAt: now, reason: "Chose a new opportunity" } : h),
          { jobId: candidate.job.id, startedAt: now }
        ]
      },
      memories: [
        {
          id: uid("mem"),
          kind: "career" as const,
          summary: `Began working as ${candidate.job.title}.`,
          subjectIds: [next.id, workplaceId ?? candidate.job.id],
          importance: 0.72,
          valence: 0.65,
          createdAt: now,
          decay: 0.02
        },
        ...next.memories
      ].slice(0, 60)
    };
    return {
      npc: next,
      trace: {
        id: uid("trace"),
        at: now,
        category: "npc",
        title: `${next.displayName} changed careers`,
        detail: previous ? `Left ${previous} and chose ${candidate.job.title} based on skills, interests, satisfaction and available capacity.` : `Entered the workforce as ${candidate.job.title}.`,
        subjectIds: [next.id, candidate.job.id, ...(workplaceId ? [workplaceId] : [])]
      }
    };
  }
  return { npc: next };
}

export function tickEcho(project: VeryaProject, now: number, elapsedWorldMinutes: number): VeryaProject {
  const traces: TraceEntry[] = [];
  const player = project.entities.find((entity) => entity.id === "player");
  const rankedByDistance = project.npcs
    .map((npc) => {
      const entity = project.entities.find((item) => item.id === npc.entityId);
      const distance = player && entity
        ? Math.hypot(entity.position.x - player.position.x, entity.position.y - player.position.y, entity.position.z - player.position.z)
        : Number.POSITIVE_INFINITY;
      return { id: npc.id, distance };
    })
    .sort((a, b) => a.distance - b.distance);
  const detailedIds = new Set(rankedByDistance.slice(0, project.settings.maxDetailedNpcs).map((item) => item.id));

  const npcs = project.npcs.map((original) => {
    const npc = applyNeeds(original, elapsedWorldMinutes);
    const distance = rankedByDistance.find((item) => item.id === npc.id)?.distance ?? Number.POSITIVE_INFINITY;
    const tier = detailedIds.has(npc.id) && distance < 14 ? "near" : distance < 40 ? "far" : "background";
    const intervalBase = tier === "near" ? 22_000 : tier === "far" ? 65_000 : 180_000;
    const decisionIntervalMs = Math.max(6_000, intervalBase / project.settings.speed);
    if (!project.settings.running || now - npc.lastDecisionAt < decisionIntervalMs) return npc;

    const candidates = needCandidates(npc);
    if (npc.autonomy !== "directed" && project.settings.allowCareerChanges) {
      for (const job of project.jobs) {
        if (npc.career.jobId === job.id && npc.career.satisfaction >= 0.35) continue;
        const score = careerScore(project, npc, job);
        candidates.push({ key: "career", title: `Pursue ${job.title}`, score, job });
      }
    }
    const deterministicNoise = (candidate: Candidate) =>
      seededUnit(project.settings.deterministicSeed + project.economy.day, `${npc.id}:${candidate.key}`) * 0.12;

    candidates.sort((a, b) => (b.score + deterministicNoise(b)) - (a.score + deterministicNoise(a)));
    const chosen = candidates[0];
    if (!chosen || chosen.score < 0.18) return { ...npc, currentAction: "Observing the world", currentMotionId: "motion_idle", lastDecisionAt: now };

    const result = actOnCandidate(project, npc, chosen, now);
    if (result.trace) traces.push(result.trace);
    else traces.push({
      id: uid("trace"),
      at: now,
      category: "npc",
      title: `${npc.displayName} chose an action`,
      detail: `${chosen.title} (utility ${chosen.score.toFixed(2)}, ${tier} simulation). Decision derived from needs, traits, goals, relationships and available opportunities.`,
      subjectIds: [npc.id, ...(chosen.targetId ? [chosen.targetId] : [])]
    });
    return result.npc;
  });

  return { ...project, npcs, trace: [...traces.reverse(), ...project.trace].slice(0, 250) };
}
