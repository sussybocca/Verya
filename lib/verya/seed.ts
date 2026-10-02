import type { CharacterRig, MotionClip, VeryaProject } from "./types";

const now = 1_780_406_400_000;

const humanoidRig = (id: string, entityId: string, name: string): CharacterRig => ({
  id,
  entityId,
  name,
  anatomy: "humanoid",
  mirrorEditing: true,
  joints: [
    { id: `${id}_root`, name: "Root", position: { x: 0, y: 0.9, z: 0 }, restRotation: { x: 0, y: 0, z: 0 }, limit: { min: { x: -20, y: -180, z: -20 }, max: { x: 20, y: 180, z: 20 } }, role: "root" },
    { id: `${id}_spine`, name: "Spine", parentId: `${id}_root`, position: { x: 0, y: 1.25, z: 0 }, restRotation: { x: 0, y: 0, z: 0 }, limit: { min: { x: -35, y: -45, z: -30 }, max: { x: 35, y: 45, z: 30 } }, role: "spine" },
    { id: `${id}_head`, name: "Head", parentId: `${id}_spine`, position: { x: 0, y: 1.72, z: 0 }, restRotation: { x: 0, y: 0, z: 0 }, limit: { min: { x: -45, y: -75, z: -35 }, max: { x: 45, y: 75, z: 35 } }, role: "head" },
    { id: `${id}_larm`, name: "Left Arm", parentId: `${id}_spine`, position: { x: -0.35, y: 1.42, z: 0 }, restRotation: { x: 0, y: 0, z: 0 }, limit: { min: { x: -120, y: -90, z: -110 }, max: { x: 120, y: 90, z: 110 } }, role: "arm" },
    { id: `${id}_rarm`, name: "Right Arm", parentId: `${id}_spine`, position: { x: 0.35, y: 1.42, z: 0 }, restRotation: { x: 0, y: 0, z: 0 }, limit: { min: { x: -120, y: -90, z: -110 }, max: { x: 120, y: 90, z: 110 } }, role: "arm" },
    { id: `${id}_lleg`, name: "Left Leg", parentId: `${id}_root`, position: { x: -0.16, y: 0.45, z: 0 }, restRotation: { x: 0, y: 0, z: 0 }, limit: { min: { x: -90, y: -45, z: -30 }, max: { x: 55, y: 45, z: 30 } }, role: "leg" },
    { id: `${id}_rleg`, name: "Right Leg", parentId: `${id}_root`, position: { x: 0.16, y: 0.45, z: 0 }, restRotation: { x: 0, y: 0, z: 0 }, limit: { min: { x: -90, y: -45, z: -30 }, max: { x: 55, y: 45, z: 30 } }, role: "leg" }
  ],
  chains: [
    { id: `${id}_spine_chain`, name: "Spine", jointIds: [`${id}_root`, `${id}_spine`, `${id}_head`], ikEnabled: false, stiffness: 0.55 },
    { id: `${id}_left_chain`, name: "Left Side", jointIds: [`${id}_larm`, `${id}_lleg`], ikEnabled: true, stiffness: 0.42 },
    { id: `${id}_right_chain`, name: "Right Side", jointIds: [`${id}_rarm`, `${id}_rleg`], ikEnabled: true, stiffness: 0.42 }
  ]
});

const motion = (id: string, name: string, tags: string[], energy: number, loop = true): MotionClip => ({
  id,
  name,
  durationMs: name === "Idle" ? 2400 : 1100,
  loop,
  tags,
  character: { energy, weight: 0.5, smoothness: 0.72, exaggeration: 0.28 },
  poses: [
    { id: `${id}_a`, at: 0, joints: [] },
    { id: `${id}_b`, at: 0.5, joints: [] },
    { id: `${id}_c`, at: 1, joints: [] }
  ]
});

export function createSeedProject(): VeryaProject {
  return {
    schemaVersion: 1,
    id: "project_harbor",
    name: "Harbor District",
    createdAt: now,
    updatedAt: now,
    world: {
      weather: "clear",
      timeScale: 1,
      flags: { townPower: true, bakeryOpen: true, gateUnlocked: false }
    },
    entities: [
      { id: "player", name: "Player", kind: "player", position: { x: 2.5, y: 0, z: 4 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 }, visible: true, active: true, tags: ["controllable"], properties: { health: 100, hasKey: true } },
      { id: "alex", name: "Alex Morgan", kind: "npc", position: { x: 6.2, y: 0, z: 4.8 }, rotation: { x: 0, y: -25, z: 0 }, scale: { x: 1, y: 1, z: 1 }, visible: true, active: true, tags: ["person", "worker"], properties: { mood: 0.68 }, rigId: "rig_alex", npcId: "npc_alex" },
      { id: "jordan", name: "Jordan Lee", kind: "npc", position: { x: 8.6, y: 0, z: 7.5 }, rotation: { x: 0, y: 90, z: 0 }, scale: { x: 1, y: 1, z: 1 }, visible: true, active: true, tags: ["person", "worker"], properties: { mood: 0.61 }, rigId: "rig_jordan", npcId: "npc_jordan" },
      { id: "mira", name: "Mira Sol", kind: "npc", position: { x: 4.4, y: 0, z: 9 }, rotation: { x: 0, y: 130, z: 0 }, scale: { x: 1, y: 1, z: 1 }, visible: true, active: true, tags: ["person"], properties: { mood: 0.74 }, rigId: "rig_mira", npcId: "npc_mira" },
      { id: "bakery", name: "Moonrise Bakery", kind: "building", position: { x: 10, y: 0, z: 4 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 2.4, y: 1.4, z: 2 }, visible: true, active: true, tags: ["workplace", "bakery", "food"], properties: { open: true, inventoryBread: 18, capacity: 2 } },
      { id: "workshop", name: "Copper Workshop", kind: "building", position: { x: 11, y: 0, z: 9 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 2, y: 1.2, z: 1.8 }, visible: true, active: true, tags: ["workplace", "craft"], properties: { open: true, capacity: 2 } },
      { id: "gate", name: "Harbor Gate", kind: "door", position: { x: 14, y: 0, z: 6.5 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 0.5, y: 1.8, z: 2 }, visible: true, active: true, tags: ["lockable", "entrance"], properties: { open: false, locked: true } },
      { id: "bronze_key", name: "Bronze Key", kind: "item", position: { x: 2.8, y: 0, z: 4.1 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 0.4, y: 0.4, z: 0.4 }, visible: false, active: true, tags: ["key", "inventory"], properties: { owner: "player" } },
      { id: "market", name: "Market Square", kind: "zone", position: { x: 6.8, y: 0, z: 7 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 4, y: 1, z: 3 }, visible: true, active: true, tags: ["social", "commerce"], properties: { traffic: 0.7 } },
      { id: "home_alex", name: "Alex's Flat", kind: "building", position: { x: 2, y: 0, z: 9.5 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1.6, y: 1, z: 1.4 }, visible: true, active: true, tags: ["home"], properties: { residents: 1 } }
    ],
    imprints: [
      {
        id: "imprint_unlock_gate",
        name: "Key unlocks harbor gate",
        description: "A world-state relationship: when the player uses the bronze key on the gate, the gate becomes unlocked and opens.",
        enabled: true,
        trigger: { type: "interaction", sourceId: "player", targetId: "gate" },
        conditions: [
          { id: "cond_key", sourceId: "player", path: "properties.hasKey", operator: "eq", value: true },
          { id: "cond_locked", sourceId: "gate", path: "properties.locked", operator: "eq", value: true }
        ],
        effects: [
          { id: "fx_unlock", targetId: "gate", path: "properties.locked", operation: "set", value: false },
          { id: "fx_open", targetId: "gate", path: "properties.open", operation: "set", value: true },
          { id: "fx_flag", targetId: "world", path: "flags.gateUnlocked", operation: "set", value: true }
        ],
        priority: 90,
        cooldownMs: 600,
        family: "lockable-entrance"
      }
    ],
    weave: [
      { id: "rel_alex_home", fromId: "npc_alex", toId: "home_alex", kind: "lives-at", strength: 1 },
      { id: "rel_alex_bakery", fromId: "npc_alex", toId: "bakery", kind: "works-at", strength: 0.82 },
      { id: "rel_key_gate", fromId: "bronze_key", toId: "gate", kind: "unlocks", strength: 1 },
      { id: "rel_alex_jordan", fromId: "npc_alex", toId: "npc_jordan", kind: "friend", strength: 0.73, bidirectional: true },
      { id: "rel_bakery_market", fromId: "bakery", toId: "market", kind: "supplies", strength: 0.92 }
    ],
    rigs: [
      humanoidRig("rig_alex", "alex", "Alex Humanoid"),
      humanoidRig("rig_jordan", "jordan", "Jordan Humanoid"),
      humanoidRig("rig_mira", "mira", "Mira Humanoid")
    ],
    motions: [
      motion("motion_idle", "Idle", ["idle", "standing"], 0.15),
      motion("motion_walk", "Walk", ["locomotion", "walk"], 0.45),
      motion("motion_run", "Run", ["locomotion", "run"], 0.82),
      motion("motion_wave", "Wave", ["social", "gesture"], 0.52, false),
      motion("motion_work", "Work", ["career", "craft"], 0.58),
      motion("motion_cook", "Cook", ["career", "food"], 0.63)
    ],
    npcs: [
      {
        id: "npc_alex",
        entityId: "alex",
        displayName: "Alex Morgan",
        ageBand: "young-adult",
        traits: { curiosity: 0.79, sociability: 0.73, ambition: 0.71, caution: 0.39, persistence: 0.68 },
        interests: { cooking: 0.81, travel: 0.45, crafting: 0.38, community: 0.72 },
        skills: { cooking: 0.62, delivery: 0.82, crafting: 0.28, leadership: 0.44 },
        needs: { energy: 0.76, food: 0.69, social: 0.58, safety: 0.91, purpose: 0.72, comfort: 0.74 },
        relationships: [{ npcId: "npc_jordan", trust: 0.78, affection: 0.72, respect: 0.66, familiarity: 0.8, tension: 0.08 }],
        memories: [{ id: "mem_alex_cooking", kind: "discovery", summary: "Discovered that cooking for friends feels meaningful.", subjectIds: ["npc_alex", "bakery"], importance: 0.84, valence: 0.91, createdAt: now - 86_400_000, decay: 0.03 }],
        goals: [{ id: "goal_alex_cook", title: "Become skilled enough to run a kitchen", category: "career", progress: 0.37, priority: 0.83, targetId: "bakery", status: "active" }],
        career: { jobId: "job_courier", workplaceId: "market", level: 2, satisfaction: 0.46, startedAt: now - 4_320_000_000, history: [{ jobId: "job_courier", startedAt: now - 4_320_000_000 }] },
        autonomy: "emergent",
        money: 184,
        homeId: "home_alex",
        currentAction: "Talking near the market",
        currentMotionId: "motion_idle",
        protectedRole: false,
        lastDecisionAt: now - 30_000
      },
      {
        id: "npc_jordan",
        entityId: "jordan",
        displayName: "Jordan Lee",
        ageBand: "adult",
        traits: { curiosity: 0.54, sociability: 0.63, ambition: 0.58, caution: 0.61, persistence: 0.81 },
        interests: { cooking: 0.35, travel: 0.31, crafting: 0.86, community: 0.61 },
        skills: { cooking: 0.3, delivery: 0.42, crafting: 0.79, leadership: 0.52 },
        needs: { energy: 0.67, food: 0.78, social: 0.62, safety: 0.88, purpose: 0.81, comfort: 0.64 },
        relationships: [{ npcId: "npc_alex", trust: 0.75, affection: 0.7, respect: 0.7, familiarity: 0.8, tension: 0.1 }],
        memories: [],
        goals: [{ id: "goal_jordan_craft", title: "Master precision crafting", category: "career", progress: 0.61, priority: 0.72, targetId: "workshop", status: "active" }],
        career: { jobId: "job_crafter", workplaceId: "workshop", level: 3, satisfaction: 0.78, startedAt: now - 7_776_000_000, history: [{ jobId: "job_crafter", startedAt: now - 7_776_000_000 }] },
        autonomy: "adaptive",
        money: 246,
        currentAction: "Finishing a workshop shift",
        currentMotionId: "motion_work",
        protectedRole: false,
        lastDecisionAt: now - 52_000
      },
      {
        id: "npc_mira",
        entityId: "mira",
        displayName: "Mira Sol",
        ageBand: "adult",
        traits: { curiosity: 0.9, sociability: 0.48, ambition: 0.69, caution: 0.51, persistence: 0.64 },
        interests: { cooking: 0.42, travel: 0.9, crafting: 0.4, community: 0.58 },
        skills: { cooking: 0.41, delivery: 0.54, crafting: 0.37, leadership: 0.74 },
        needs: { energy: 0.82, food: 0.64, social: 0.49, safety: 0.79, purpose: 0.55, comfort: 0.67 },
        relationships: [],
        memories: [],
        goals: [{ id: "goal_mira_explore", title: "Map the streets beyond the harbor", category: "explore", progress: 0.14, priority: 0.88, status: "active" }],
        career: { level: 1, satisfaction: 0.52, history: [] },
        autonomy: "emergent",
        money: 92,
        currentAction: "Exploring the district",
        currentMotionId: "motion_walk",
        protectedRole: false,
        lastDecisionAt: now - 77_000
      }
    ],
    jobs: [
      { id: "job_baker", title: "Baker", workplaceTags: ["bakery"], requiredSkills: { cooking: 0.45 }, interestWeights: { cooking: 1, community: 0.35 }, payPerDay: 74, capacity: 2, enabled: true },
      { id: "job_courier", title: "Courier", workplaceTags: ["commerce", "market"], requiredSkills: { delivery: 0.45 }, interestWeights: { travel: 0.7, community: 0.25 }, payPerDay: 66, capacity: 3, enabled: true },
      { id: "job_crafter", title: "Craftsperson", workplaceTags: ["craft"], requiredSkills: { crafting: 0.5 }, interestWeights: { crafting: 1 }, payPerDay: 82, capacity: 2, enabled: true },
      { id: "job_host", title: "Community Host", workplaceTags: ["social"], requiredSkills: { leadership: 0.4 }, interestWeights: { community: 0.9 }, payPerDay: 70, capacity: 1, enabled: true }
    ],
    economy: {
      day: 17,
      minuteOfDay: 9 * 60 + 25,
      prices: { bread: 4.2, materials: 12, meal: 9 },
      supply: { bread: 18, materials: 34, meal: 12 },
      demand: { bread: 16, materials: 20, meal: 14 },
      worldFunds: 12840
    },
    emergence: [],
    trace: [
      { id: "trace_seed", at: now, category: "system", title: "Living world loaded", detail: "World Weave, Imprints, Body Atlas, Motion Atlas and ECHO share one persistent project state.", subjectIds: [] }
    ],
    settings: {
      running: false,
      speed: 1,
      autonomy: "emergent",
      allowCareerChanges: true,
      allowRelationshipEvolution: true,
      allowWorldChangingDecisions: true,
      simulateWhenHidden: false,
      deterministicSeed: 42721,
      maxDetailedNpcs: 24
    }
  };
}
