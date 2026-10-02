"use client";

import { useEffect, useRef, useState } from "react";
import Hierarchy from "./Hierarchy";
import NavRail from "./NavRail";
import WorkspacePanel from "./WorkspacePanel";
import WorldViewport from "./WorldViewport";
import { createSeedProject } from "@/lib/verya/seed";
import { dispatchRuntime, interact } from "@/lib/verya/runtime";
import { exportProject, importProject, loadProject, saveProject } from "@/lib/verya/persistence";
import type { StudioSelection, VeryaProject, Workspace, WorldEntity } from "@/lib/verya/types";
import { formatClock, uid } from "@/lib/verya/util";

const workspaceTitle: Record<Workspace, { title: string; subtitle: string }> = {
  world: { title: "World", subtitle: "Author the scene directly" },
  imprint: { title: "Imprint", subtitle: "Teach world-state changes" },
  weave: { title: "World Weave", subtitle: "Relationships between everything" },
  body: { title: "Body Atlas", subtitle: "Rig anatomy and constraints" },
  motion: { title: "Motion Atlas", subtitle: "Reusable motion and pose character" },
  materials: { title: "Materials", subtitle: "Surface and world-aware appearance" },
  echo: { title: "ECHO", subtitle: "Living NPC identities and decisions" },
  emergence: { title: "Emergence", subtitle: "Systemic events from simulation" },
  trace: { title: "Trace", subtitle: "Explain why the world changed" },
  play: { title: "Play", subtitle: "Experience the living world" }
};

export default function Studio() {
  const [project, setProject] = useState<VeryaProject>(() => createSeedProject());
  const [selection, setSelection] = useState<StudioSelection>({
    workspace: "world",
    entityId: "alex",
    npcId: "npc_alex"
  });
  const [loaded, setLoaded] = useState(false);
  const [saveState, setSaveState] = useState<"saved" | "saving">("saved");
  const importInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setProject(loadProject());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    setSaveState("saving");
    const handle = window.setTimeout(() => {
      saveProject(project);
      setSaveState("saved");
    }, 220);
    return () => window.clearTimeout(handle);
  }, [project, loaded]);

  useEffect(() => {
    if (!project.settings.running) return;
    const handle = window.setInterval(() => {
      setProject((current) => {
        if (document.hidden && !current.settings.simulateWhenHidden) return current;
        return dispatchRuntime(current, {
          type: "TICK",
          now: Date.now(),
          deltaMs: 500
        });
      });
    }, 500);
    return () => window.clearInterval(handle);
  }, [project.settings.running]);

  const chooseWorkspace = (workspace: Workspace) => {
    setSelection((current) => ({ ...current, workspace }));
  };

  const selectEntity = (entityId?: string) => {
    const entity = project.entities.find((item) => item.id === entityId);
    setSelection((current) => ({
      ...current,
      entityId,
      npcId: entity?.npcId ?? current.npcId,
      rigId: entity?.rigId ?? current.rigId
    }));
  };

  const onInteract = (targetId: string) => {
    setProject((current) => interact(current, "player", targetId));
  };

  const toggleSimulation = () => {
    setProject((current) => ({
      ...current,
      settings: { ...current.settings, running: !current.settings.running }
    }));
  };

  const addObject = () => {
    const index = project.entities.length;
    const id = uid("prop");
    const entity: WorldEntity = {
      id,
      name: `New Prop ${index + 1}`,
      kind: "prop",
      position: { x: 3 + (index % 6), y: 0, z: 3 + ((index * 2) % 7) },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      visible: true,
      active: true,
      tags: ["prop"],
      properties: {
        surfaceColor: "#9aa7b8",
        roughness: 0.72,
        metalness: 0.03
      }
    };
    setProject((current) => ({
      ...current,
      entities: [...current.entities, entity],
      updatedAt: Date.now()
    }));
    setSelection((current) => ({ ...current, workspace: "world", entityId: id }));
  };

  const handleImport = async (file?: File) => {
    if (!file) return;
    try {
      const next = await importProject(file);
      setProject(next);
      setSelection({ workspace: "world", entityId: next.entities[0]?.id });
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Could not import this Verya project.");
    } finally {
      if (importInput.current) importInput.current.value = "";
    }
  };

  const resetProject = () => {
    if (!window.confirm("Reset this local Verya project to the Harbor District starter world?")) return;
    const fresh = createSeedProject();
    setProject(fresh);
    setSelection({ workspace: "world", entityId: "alex", npcId: "npc_alex" });
  };

  const selected = project.entities.find((entity) => entity.id === selection.entityId);
  const info = workspaceTitle[selection.workspace];

  return (
    <main className="studio-shell">
      <header className="studio-topbar">
        <div className="project-identity">
          <div className="verya-wordmark">VERYA <span>STUDIO</span></div>
          <div className="topbar-separator" />
          <input
            className="project-name-input"
            value={project.name}
            onChange={(event) => setProject((current) => ({ ...current, name: event.target.value, updatedAt: Date.now() }))}
            aria-label="Project name"
          />
          <span className={saveState === "saved" ? "save-status" : "save-status saving"}>
            <i /> {saveState === "saved" ? "Saved locally" : "Saving…"}
          </span>
        </div>

        <div className="topbar-center">
          <div className="workspace-heading">
            <strong>{info.title}</strong>
            <span>{info.subtitle}</span>
          </div>
        </div>

        <div className="topbar-actions">
          <button className="ghost-btn" onClick={addObject}>+ Object</button>
          <button className="ghost-btn" onClick={() => importInput.current?.click()}>Import</button>
          <button className="ghost-btn" onClick={() => exportProject(project)}>Export</button>
          <input
            ref={importInput}
            type="file"
            accept=".json,.verya"
            hidden
            onChange={(event) => void handleImport(event.target.files?.[0])}
          />
          <button className="icon-btn reset-btn" title="Reset starter world" onClick={resetProject}>↺</button>
          <button className={project.settings.running ? "play-button running" : "play-button"} onClick={toggleSimulation}>
            <span>{project.settings.running ? "Ⅱ" : "▶"}</span>
            {project.settings.running ? "Pause" : "Run World"}
          </button>
        </div>
      </header>

      <NavRail active={selection.workspace} onChange={chooseWorkspace} />

      <Hierarchy project={project} selection={selection} onSelect={setSelection} />

      <section className="scene-area">
        <WorldViewport
          entities={project.entities}
          selectedId={selection.entityId}
          onSelect={selectEntity}
          playMode={selection.workspace === "play"}
        />
        <div className="scene-toolbar">
          <button className="tool active" title="Select">↖</button>
          <button className="tool" title="Move">✣</button>
          <button className="tool" title="Rotate">↻</button>
          <button className="tool" title="Scale">⤢</button>
          <span className="tool-divider" />
          <button className="tool" title="Frame selected">⌗</button>
        </div>
        {selected && (
          <div className="selection-float">
            <span className={`entity-dot kind-${selected.kind}`} />
            <div><strong>{selected.name}</strong><small>{selected.kind}</small></div>
          </div>
        )}
        <div className="world-status-strip">
          <span>DAY <b>{project.economy.day}</b></span>
          <span>{formatClock(project.economy.minuteOfDay)}</span>
          <span>WEATHER <b>{project.world.weather}</b></span>
          <span>ECHO <b>{project.npcs.length}</b></span>
          <span>IMPRINTS <b>{project.imprints.filter((item) => item.enabled).length}</b></span>
          <span>EVENTS <b>{project.emergence.filter((item) => !item.resolved).length}</b></span>
        </div>
      </section>

      <WorkspacePanel
        project={project}
        setProject={setProject}
        selection={selection}
        setSelection={setSelection}
        onInteract={onInteract}
      />

      <footer className="simulation-bar">
        <div className="simulation-state">
          <span className={project.settings.running ? "live-dot live" : "live-dot"} />
          <strong>{project.settings.running ? "WORLD LIVE" : "WORLD PAUSED"}</strong>
          <small>deterministic seed {project.settings.deterministicSeed}</small>
        </div>
        <div className="sim-controls">
          <span>Simulation speed</span>
          {([0.5, 1, 2, 4] as const).map((speed) => (
            <button
              key={speed}
              className={project.settings.speed === speed ? "speed active" : "speed"}
              onClick={() => setProject((current) => ({
                ...current,
                settings: { ...current.settings, speed }
              }))}
            >
              {speed}×
            </button>
          ))}
        </div>
        <div className="runtime-summary">
          <span>World Weave <b>{project.weave.length}</b></span>
          <span>Trace <b>{project.trace.length}</b></span>
          <span>Schema <b>v{project.schemaVersion}</b></span>
        </div>
      </footer>
    </main>
  );
}
