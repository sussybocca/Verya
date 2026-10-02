# Verya Studio

Verya is a browser-native game creation platform built around a different authoring model: creators define world state, relationships, anatomy, motion, and living character behavior instead of assembling programming blocks or relying on generative AI.

## What is included

- **World** — editable 3D/WebGL scene using Three.js through React Three Fiber.
- **Imprint** — deterministic world-state rules that connect triggers, conditions, and desired state changes.
- **World Weave** — semantic relationships between entities, NPCs, places, jobs, resources, and systems.
- **Body Atlas** — character rig data, anatomical joint relationships, limits, IK chains, and custom anatomy support.
- **Motion Atlas** — reusable motion clips, pose sequences, motion character controls, and runtime motion selection.
- **Materials** — editable world-aware material properties connected to the live scene.
- **ECHO** — persistent NPC identity, needs, goals, memories, relationships, skills, interests, careers, and autonomous decisions.
- **Emergence** — vacancies, shortages, economy pressure, and opportunities produced from the simulation rather than hard-coded event scripts.
- **Trace** — an explainable runtime log showing why Imprints fired and why NPC/system decisions occurred.
- **Play** — the live game state inside the same editor.
- **Offline persistence** — local project autosave, project import/export, a service-worker shell cache, and optional catch-up simulation.

## Core design

Verya does not require an LLM for gameplay logic. The runtime is deterministic and explainable. ECHO uses utility scoring from needs, traits, goals, skills, relationships, career satisfaction, opportunities, and a deterministic seeded tie-breaker.

NPC simulation uses multiple detail levels so browser worlds can scale: nearby characters decide frequently, distant characters update less often, and background characters are simulated at a cheaper cadence.

## Local development

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

Useful checks:

```bash
npm run typecheck
npm run lint
npm run build
```

## Netlify

The repository includes `netlify.toml`. Connect this repository to Netlify and deploy from the default `main` branch. Netlify's current Next.js/OpenNext integration handles the App Router build; no legacy pinned Next.js Netlify plugin is required.

## Project format

Projects are stored as versioned JSON (`schemaVersion: 1`) and can be exported as `*.verya.json`. The same project state contains scene entities, Imprints, World Weave relationships, rigs, motions, NPC minds, jobs, economy, Emergence events, Trace entries, and simulation settings.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the system map.
