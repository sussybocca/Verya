export type Id = string;
export type Vec3 = { x: number; y: number; z: number };

export type Workspace =
  | "world"
  | "imprint"
  | "weave"
  | "body"
  | "motion"
  | "materials"
  | "echo"
  | "emergence"
  | "trace"
  | "play";

export type EntityKind =
  | "player"
  | "npc"
  | "prop"
  | "door"
  | "item"
  | "building"
  | "light"
  | "zone";

export type PropertyValue = string | number | boolean | null;

export type WorldEntity = {
  id: Id;
  name: string;
  kind: EntityKind;
  position: Vec3;
  rotation: Vec3;
  scale: Vec3;
  visible: boolean;
  active: boolean;
  tags: string[];
  properties: Record<string, PropertyValue>;
  rigId?: Id;
  npcId?: Id;
};

export type CompareOperator = "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "includes";
export type EffectOperation = "set" | "add" | "subtract" | "toggle";

export type ImprintCondition = {
  id: Id;
  sourceId: Id | "world";
  path: string;
  operator: CompareOperator;
  value: PropertyValue;
};

export type ImprintEffect = {
  id: Id;
  targetId: Id | "world";
  path: string;
  operation: EffectOperation;
  value: PropertyValue;
  durationMs?: number;
};

export type ImprintTrigger =
  | { type: "interaction"; sourceId: Id; targetId: Id }
  | { type: "proximity"; sourceId: Id; targetId: Id; radius: number }
  | { type: "timer"; everyMs: number }
  | { type: "state"; sourceId: Id | "world"; path: string };

export type ImprintRule = {
  id: Id;
  name: string;
  description: string;
  enabled: boolean;
  trigger: ImprintTrigger;
  conditions: ImprintCondition[];
  effects: ImprintEffect[];
  priority: number;
  cooldownMs: number;
  lastRunAt?: number;
  family?: string;
};

export type RelationKind =
  | "owns"
  | "needs"
  | "supplies"
  | "trusts"
  | "works-at"
  | "lives-at"
  | "powers"
  | "unlocks"
  | "friend"
  | "rival"
  | "knows"
  | "custom";

export type WeaveRelation = {
  id: Id;
  fromId: Id;
  toId: Id;
  kind: RelationKind;
  strength: number;
  bidirectional?: boolean;
  metadata?: Record<string, PropertyValue>;
};

export type JointLimit = {
  min: Vec3;
  max: Vec3;
};

export type RigJoint = {
  id: Id;
  name: string;
  parentId?: Id;
  position: Vec3;
  restRotation: Vec3;
  limit: JointLimit;
  role:
    | "root"
    | "spine"
    | "head"
    | "arm"
    | "hand"
    | "leg"
    | "foot"
    | "tail"
    | "wing"
    | "custom";
};

export type RigChain = {
  id: Id;
  name: string;
  jointIds: Id[];
  ikEnabled: boolean;
  stiffness: number;
};

export type CharacterRig = {
  id: Id;
  name: string;
  entityId: Id;
  joints: RigJoint[];
  chains: RigChain[];
  anatomy: "humanoid" | "quadruped" | "winged" | "custom";
  mirrorEditing: boolean;
};

export type PoseJoint = {
  jointId: Id;
  rotation: Vec3;
  positionOffset?: Vec3;
};

export type MotionPose = {
  id: Id;
  at: number;
  joints: PoseJoint[];
};

export type MotionClip = {
  id: Id;
  name: string;
  rigId?: Id;
  durationMs: number;
  loop: boolean;
  tags: string[];
  character: {
    energy: number;
    weight: number;
    smoothness: number;
    exaggeration: number;
  };
  poses: MotionPose[];
};

export type MemoryKind =
  | "event"
  | "relationship"
  | "career"
  | "place"
  | "promise"
  | "discovery";

export type NpcMemory = {
  id: Id;
  kind: MemoryKind;
  summary: string;
  subjectIds: Id[];
  importance: number;
  valence: number;
  createdAt: number;
  decay: number;
};

export type NpcRelationship = {
  npcId: Id;
  trust: number;
  affection: number;
  respect: number;
  familiarity: number;
  tension: number;
};

export type NpcNeedKey = "energy" | "food" | "social" | "safety" | "purpose" | "comfort";
export type NpcNeeds = Record<NpcNeedKey, number>;

export type NpcGoal = {
  id: Id;
  title: string;
  category: "need" | "career" | "social" | "explore" | "wealth" | "craft" | "custom";
  progress: number;
  priority: number;
  targetId?: Id;
  status: "active" | "paused" | "complete" | "abandoned";
};

export type NpcCareer = {
  jobId?: Id;
  workplaceId?: Id;
  level: number;
  satisfaction: number;
  startedAt?: number;
  history: { jobId: Id; startedAt: number; endedAt?: number; reason?: string }[];
};

export type NpcAutonomy = "directed" | "adaptive" | "emergent";

export type Npc = {
  id: Id;
  entityId: Id;
  displayName: string;
  ageBand: "young-adult" | "adult" | "older-adult";
  traits: Record<string, number>;
  interests: Record<string, number>;
  skills: Record<string, number>;
  needs: NpcNeeds;
  relationships: NpcRelationship[];
  memories: NpcMemory[];
  goals: NpcGoal[];
  career: NpcCareer;
  autonomy: NpcAutonomy;
  money: number;
  homeId?: Id;
  currentAction: string;
  currentMotionId?: Id;
  protectedRole: boolean;
  lastDecisionAt: number;
};

export type JobDefinition = {
  id: Id;
  title: string;
  workplaceTags: string[];
  requiredSkills: Record<string, number>;
  interestWeights: Record<string, number>;
  payPerDay: number;
  capacity: number;
  enabled: boolean;
};

export type EconomyState = {
  day: number;
  minuteOfDay: number;
  prices: Record<string, number>;
  supply: Record<string, number>;
  demand: Record<string, number>;
  worldFunds: number;
};

export type EmergenceEvent = {
  id: Id;
  type: "vacancy" | "shortage" | "surplus" | "social-shift" | "career-change" | "opportunity";
  title: string;
  detail: string;
  severity: number;
  subjectIds: Id[];
  createdAt: number;
  resolved: boolean;
};

export type SimulationSettings = {
  running: boolean;
  speed: 0.5 | 1 | 2 | 4;
  autonomy: NpcAutonomy;
  allowCareerChanges: boolean;
  allowRelationshipEvolution: boolean;
  allowWorldChangingDecisions: boolean;
  simulateWhenHidden: boolean;
  deterministicSeed: number;
  maxDetailedNpcs: number;
};

export type TraceEntry = {
  id: Id;
  at: number;
  category: "imprint" | "weave" | "npc" | "emergence" | "motion" | "system";
  title: string;
  detail: string;
  subjectIds: Id[];
};

export type VeryaProject = {
  schemaVersion: 1;
  id: Id;
  name: string;
  createdAt: number;
  updatedAt: number;
  entities: WorldEntity[];
  imprints: ImprintRule[];
  weave: WeaveRelation[];
  rigs: CharacterRig[];
  motions: MotionClip[];
  npcs: Npc[];
  jobs: JobDefinition[];
  economy: EconomyState;
  emergence: EmergenceEvent[];
  trace: TraceEntry[];
  settings: SimulationSettings;
  world: {
    weather: "clear" | "rain" | "fog";
    timeScale: number;
    flags: Record<string, PropertyValue>;
  };
};

export type StudioSelection = {
  workspace: Workspace;
  entityId?: Id;
  npcId?: Id;
  imprintId?: Id;
  rigId?: Id;
  motionId?: Id;
};

export type RuntimeCommand =
  | { type: "INTERACT"; sourceId: Id; targetId: Id }
  | { type: "TICK"; now: number; deltaMs: number }
  | { type: "SET_ENTITY_PROPERTY"; entityId: Id; path: string; value: PropertyValue }
  | { type: "RUN_IMPRINT"; imprintId: Id };
