"use client";

import type { StudioSelection, VeryaProject } from "@/lib/verya/types";

type Props = {
  project: VeryaProject;
  selection: StudioSelection;
  onSelect: (selection: StudioSelection) => void;
};

export default function Hierarchy({ project, selection, onSelect }: Props) {
  const groups = [
    ["People", project.entities.filter((e) => e.kind === "player" || e.kind === "npc")],
    ["World", project.entities.filter((e) => !["player", "npc", "zone"].includes(e.kind))],
    ["Zones", project.entities.filter((e) => e.kind === "zone")]
  ] as const;

  return (
    <aside className="hierarchy panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">SCENE</span>
          <strong>Harbor District</strong>
        </div>
        <button
          className="icon-btn"
          title="Add prop"
          onClick={() => onSelect({ ...selection, workspace: "world" })}
        >
          +
        </button>
      </div>
      <div className="hierarchy-scroll">
        {groups.map(([label, entities]) => (
          <div className="tree-group" key={label}>
            <div className="tree-label">{label}</div>
            {entities.map((entity) => (
              <button
                key={entity.id}
                className={`tree-item ${selection.entityId === entity.id ? "selected" : ""}`}
                onClick={() =>
                  onSelect({
                    ...selection,
                    workspace: selection.workspace === "play" ? "play" : "world",
                    entityId: entity.id,
                    npcId: entity.npcId
                  })
                }
              >
                <span className={`entity-dot kind-${entity.kind}`} />
                <span>{entity.name}</span>
                <small>{entity.kind}</small>
              </button>
            ))}
          </div>
        ))}
      </div>
      <div className="hierarchy-footer">
        <span>{project.entities.length} entities</span>
        <span>{project.npcs.length} ECHO minds</span>
      </div>
    </aside>
  );
}
