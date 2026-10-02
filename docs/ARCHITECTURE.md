# Verya architecture

## 1. World-state authoring

The scene is the primary authoring surface. Every entity has identity, transform, tags, active/visible state, and structured properties. Gameplay systems read and write the same project state.

## 2. Imprint

An Imprint contains:

- a trigger: interaction, proximity, timer, or state observation;
- zero or more conditions;
- one or more effects;
- priority and cooldown;
- an optional reusable family.

The runtime evaluates Imprints deterministically. Effects can set, add, subtract, or toggle state. This is intentionally not a visual-node graph.

## 3. World Weave

World Weave stores meaningful relationships such as owns, needs, supplies, trusts, works-at, lives-at, powers, unlocks, friend, rival, and custom relations. The relationship model is shared context for simulation systems rather than a second scripting language.

## 4. Body Atlas

Character rigs are described using joints, parents, rest transforms, anatomical roles, movement limits, and IK chains. The schema supports humanoid, quadruped, winged, and custom anatomy. The browser editor can refine these structures without requiring a traditional rig hierarchy UI.

## 5. Motion Atlas

Motion clips hold duration, looping, tags, expressive motion parameters, and pose samples. Runtime systems can choose clips based on activity, so an NPC's behavior and animation are not separate hard-coded state machines.

## 6. ECHO

Each NPC owns a persistent simulation identity:

- traits and interests;
- learned skills;
- changing needs;
- goals;
- career history and satisfaction;
- money/home;
- asymmetric social relationships;
- importance-weighted memories;
- autonomy level;
- current activity and motion.

Decision candidates receive utility scores. Deterministic seeded noise prevents every NPC with similar stats from always choosing the exact same action while remaining reproducible.

ECHO supports Directed, Adaptive, and Emergent autonomy. Protected roles prevent autonomous career changes for story-critical characters.

### Simulation levels

The runtime measures characters relative to the player and limits high-detail decision frequency:

- **near** — frequent decisions and detailed activity;
- **far** — slower decision cadence;
- **background** — sparse simulation cadence.

This keeps the conceptual world alive without rendering or fully planning every NPC every frame.

## 7. Social Fabric and Experience Memory

Social activity can create relationships, deepen familiarity/trust/affection, reduce tension, and transmit important memories. Shared memories are copied with lower importance and faster decay so hearsay is not treated like a firsthand event.

## 8. Emergence

Emergence derives events from world state. The initial implementation includes job vacancies and resource shortages. Economy pressure updates supply, demand, and prices. These events become context for future decisions instead of executing a fixed authored sequence.

The intended pattern is: creator defines allowed systems and constraints; gameplay situations emerge from their interaction.

## 9. Explainability

Trace records Imprint execution, ECHO choices, Emergence events, and system activity. The goal is that creators can inspect why something happened instead of debugging opaque behavior.

## 10. Persistence and offline operation

The project autosaves to browser storage and can be exported/imported. A service worker caches the shell in production. When the creator enables continued simulation, loading a project can perform bounded deterministic catch-up for time elapsed while it was not active.

## 11. Deployment

The UI is Next.js/React/TypeScript. Rendering is Three.js/WebGL through React Three Fiber. The core simulation modules are plain TypeScript so they are not tied to Next.js and can later move into Web Workers, a server-authoritative multiplayer runtime, or another host framework without rewriting the project format.
