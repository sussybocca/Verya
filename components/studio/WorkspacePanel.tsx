"use client";

import type { Dispatch, SetStateAction } from "react";
import type {
  ImprintRule,
  Npc,
  PropertyValue,
  StudioSelection,
  VeryaProject,
  WorldEntity
} from "@/lib/verya/types";
import { uid } from "@/lib/verya/util";

type Props = {
  project: VeryaProject;
  setProject: Dispatch<SetStateAction<VeryaProject>>;
  selection: StudioSelection;
  setSelection: Dispatch<SetStateAction<StudioSelection>>;
  onInteract: (targetId: string) => void;
};

function Meter({ value, label }: { value: number; label: string }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div className="meter-row">
      <span>{label}</span>
      <div className="meter-track"><i style={{ width: `${pct}%` }} /></div>
      <b>{pct}</b>
    </div>
  );
}

function Toggle({
  checked,
  label,
  onChange
}: {
  checked: boolean;
  label: string;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="toggle-row">
      <span>{label}</span>
      <button
        type="button"
        className={checked ? "switch on" : "switch"}
        onClick={() => onChange(!checked)}
        aria-pressed={checked}
      >
        <i />
      </button>
    </label>
  );
}

function Section({
  title,
  children,
  action
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="inspector-section">
      <div className="section-title">
        <span>{title}</span>
        {action}
      </div>
      {children}
    </section>
  );
}

function updateEntity(
  project: VeryaProject,
  id: string,
  updater: (entity: WorldEntity) => WorldEntity
): VeryaProject {
  return {
    ...project,
    entities: project.entities.map((entity) => entity.id === id ? updater(entity) : entity),
    updatedAt: Date.now()
  };
}

function updateNpc(
  project: VeryaProject,
  id: string,
  updater: (npc: Npc) => Npc
): VeryaProject {
  return {
    ...project,
    npcs: project.npcs.map((npc) => npc.id === id ? updater(npc) : npc),
    updatedAt: Date.now()
  };
}

function WorldInspector({ project, setProject, selection, onInteract }: Props) {
  const entity = project.entities.find((item) => item.id === selection.entityId);
  if (!entity) {
    return (
      <div className="empty-state">
        <div className="empty-symbol">◫</div>
        <h3>Select something in the world</h3>
        <p>Objects are authored directly in the scene. Select one to edit its state, transform, tags and gameplay properties.</p>
      </div>
    );
  }

  const setAxis = (
    group: "position" | "rotation" | "scale",
    axis: "x" | "y" | "z",
    value: number
  ) => {
    setProject((current) => updateEntity(current, entity.id, (item) => ({
      ...item,
      [group]: { ...item[group], [axis]: Number.isFinite(value) ? value : item[group][axis] }
    })));
  };

  const setProperty = (key: string, value: PropertyValue) => {
    setProject((current) => updateEntity(current, entity.id, (item) => ({
      ...item,
      properties: { ...item.properties, [key]: value }
    })));
  };

  return (
    <>
      <div className="object-header">
        <span className={`entity-dot kind-${entity.kind}`} />
        <div><strong>{entity.name}</strong><small>{entity.kind} · {entity.id}</small></div>
      </div>

      <Section title="Transform">
        {(["position", "rotation", "scale"] as const).map((group) => (
          <div className="vector-row" key={group}>
            <label>{group}</label>
            {(["x", "y", "z"] as const).map((axis) => (
              <span className="axis-field" key={axis}>
                <em>{axis.toUpperCase()}</em>
                <input
                  type="number"
                  step={group === "rotation" ? 5 : 0.1}
                  value={entity[group][axis]}
                  onChange={(event) => setAxis(group, axis, Number(event.target.value))}
                />
              </span>
            ))}
          </div>
        ))}
      </Section>

      <Section title="World state">
        <Toggle
          checked={entity.active}
          label="Active in simulation"
          onChange={(next) => setProject((current) => updateEntity(current, entity.id, (item) => ({ ...item, active: next })))}
        />
        <Toggle
          checked={entity.visible}
          label="Visible"
          onChange={(next) => setProject((current) => updateEntity(current, entity.id, (item) => ({ ...item, visible: next })))}
        />
        <div className="property-list">
          {Object.entries(entity.properties).map(([key, value]) => (
            <div className="property-row" key={key}>
              <span>{key}</span>
              {typeof value === "boolean" ? (
                <button className={value ? "pill positive" : "pill"} onClick={() => setProperty(key, !value)}>
                  {value ? "true" : "false"}
                </button>
              ) : (
                <input
                  value={String(value ?? "")}
                  onChange={(event) => {
                    const raw = event.target.value;
                    setProperty(key, typeof value === "number" && raw !== "" ? Number(raw) : raw);
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </Section>

      <Section title="Identity">
        <div className="tag-wrap">
          {entity.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}
        </div>
      </Section>

      {(entity.kind === "door" || entity.kind === "npc" || entity.kind === "item") && (
        <button className="primary wide" onClick={() => onInteract(entity.id)}>
          Interact as Player
        </button>
      )}
    </>
  );
}

function ImprintInspector({ project, setProject, selection, setSelection }: Props) {
  const selected = project.imprints.find((rule) => rule.id === selection.imprintId) ?? project.imprints[0];

  const createRule = () => {
    const target = selection.entityId ?? "gate";
    const rule: ImprintRule = {
      id: uid("imprint"),
      name: "New world-state Imprint",
      description: "Define what must be true and what should change when this interaction occurs.",
      enabled: true,
      trigger: { type: "interaction", sourceId: "player", targetId: target },
      conditions: [],
      effects: [],
      priority: 50,
      cooldownMs: 400
    };
    setProject((current) => ({ ...current, imprints: [rule, ...current.imprints] }));
    setSelection((current) => ({ ...current, imprintId: rule.id }));
  };

  const patch = (changes: Partial<ImprintRule>) => {
    if (!selected) return;
    setProject((current) => ({
      ...current,
      imprints: current.imprints.map((rule) => rule.id === selected.id ? { ...rule, ...changes } : rule)
    }));
  };

  return (
    <>
      <div className="panel-toolbar">
        <div><span className="eyebrow">WORLD-STATE AUTHORING</span><strong>Imprint</strong></div>
        <button className="primary small" onClick={createRule}>+ New Imprint</button>
      </div>
      <div className="card-list compact">
        {project.imprints.map((rule) => (
          <button
            key={rule.id}
            className={selected?.id === rule.id ? "select-card selected" : "select-card"}
            onClick={() => setSelection((current) => ({ ...current, imprintId: rule.id }))}
          >
            <span className={rule.enabled ? "status-led active" : "status-led"} />
            <div><strong>{rule.name}</strong><small>{rule.conditions.length} conditions · {rule.effects.length} changes</small></div>
          </button>
        ))}
      </div>
      {selected && (
        <>
          <Section title="Imprint identity">
            <input className="text-input" value={selected.name} onChange={(event) => patch({ name: event.target.value })} />
            <textarea className="text-area" value={selected.description} onChange={(event) => patch({ description: event.target.value })} />
            <Toggle checked={selected.enabled} label="Enabled" onChange={(enabled) => patch({ enabled })} />
          </Section>
          <Section title="Trigger">
            <div className="logic-card">
              <span className="logic-glyph">◎</span>
              <div>
                <strong>{selected.trigger.type}</strong>
                <small>
                  {selected.trigger.type === "interaction"
                    ? `${selected.trigger.sourceId} → ${selected.trigger.targetId}`
                    : "World-driven trigger"}
                </small>
              </div>
            </div>
          </Section>
          <Section title="Current state · conditions">
            {selected.conditions.length === 0 && <p className="muted">No conditions yet — the trigger can run whenever it occurs.</p>}
            {selected.conditions.map((condition) => (
              <div className="logic-line" key={condition.id}>
                <code>{condition.sourceId}.{condition.path}</code>
                <span>{condition.operator}</span>
                <b>{String(condition.value)}</b>
              </div>
            ))}
          </Section>
          <Section title="Desired state · changes">
            {selected.effects.length === 0 && <p className="muted">Add desired state changes to teach the world what should become different.</p>}
            {selected.effects.map((effect) => (
              <div className="logic-line effect" key={effect.id}>
                <code>{effect.targetId}.{effect.path}</code>
                <span>{effect.operation}</span>
                <b>{String(effect.value)}</b>
              </div>
            ))}
          </Section>
          <Section title="Execution">
            <label className="range-field">
              <span>Priority <b>{selected.priority}</b></span>
              <input type="range" min="0" max="100" value={selected.priority} onChange={(e) => patch({ priority: Number(e.target.value) })} />
            </label>
            <label className="inline-field"><span>Cooldown</span><input type="number" value={selected.cooldownMs} onChange={(e) => patch({ cooldownMs: Number(e.target.value) })} /><em>ms</em></label>
          </Section>
        </>
      )}
    </>
  );
}

function WeaveInspector({ project, setProject, selection }: Props) {
  const selectedId = selection.entityId ?? "player";
  const relevant = project.weave.filter((relation) => relation.fromId === selectedId || relation.toId === selectedId);
  const add = () => {
    const target = project.entities.find((entity) => entity.id !== selectedId)?.id;
    if (!target) return;
    setProject((current) => ({
      ...current,
      weave: [{
        id: uid("relation"),
        fromId: selectedId,
        toId: target,
        kind: "custom",
        strength: 0.5
      }, ...current.weave]
    }));
  };

  return (
    <>
      <div className="panel-toolbar">
        <div><span className="eyebrow">RELATIONSHIP MODEL</span><strong>World Weave</strong></div>
        <button className="primary small" onClick={add}>+ Relation</button>
      </div>
      <div className="weave-map">
        <div className="weave-core">{selectedId}</div>
        {relevant.slice(0, 6).map((relation, index) => {
          const other = relation.fromId === selectedId ? relation.toId : relation.fromId;
          return (
            <div className={`weave-node n${index + 1}`} key={relation.id}>
              <span>{other}</span><small>{relation.kind}</small>
            </div>
          );
        })}
      </div>
      <Section title="Relationships">
        {project.weave.map((relation) => (
          <div className="relation-row" key={relation.id}>
            <span className="relation-kind">{relation.kind}</span>
            <code>{relation.fromId}</code>
            <span>→</span>
            <code>{relation.toId}</code>
            <b>{Math.round(relation.strength * 100)}%</b>
          </div>
        ))}
      </Section>
      <p className="info-box">World Weave stores meaning between things. Imprints can change state; ECHO and Emergence use these relationships as world context rather than requiring hand-wired node graphs.</p>
    </>
  );
}

function BodyInspector({ project, setProject, selection, setSelection }: Props) {
  const byEntity = project.entities.find((entity) => entity.id === selection.entityId)?.rigId;
  const rig = project.rigs.find((item) => item.id === selection.rigId)
    ?? project.rigs.find((item) => item.id === byEntity)
    ?? project.rigs[0];

  if (!rig) return <div className="empty-state"><h3>No rig selected</h3></div>;

  const patchRig = (changes: Partial<typeof rig>) => setProject((current) => ({
    ...current,
    rigs: current.rigs.map((item) => item.id === rig.id ? { ...item, ...changes } : item)
  }));

  return (
    <>
      <div className="panel-toolbar">
        <div><span className="eyebrow">ANATOMICAL RELATIONSHIPS</span><strong>Body Atlas</strong></div>
        <select value={rig.id} onChange={(e) => setSelection((current) => ({ ...current, rigId: e.target.value }))}>
          {project.rigs.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </div>
      <div className="rig-preview">
        <div className="rig-head" />
        <div className="rig-spine" />
        <div className="rig-arm left" />
        <div className="rig-arm right" />
        <div className="rig-leg left" />
        <div className="rig-leg right" />
        {rig.joints.map((joint, index) => <i key={joint.id} className={`rig-joint j${Math.min(index, 6)}`} title={joint.name} />)}
      </div>
      <Section title="Rig">
        <div className="stat-grid">
          <div><b>{rig.joints.length}</b><span>joints</span></div>
          <div><b>{rig.chains.length}</b><span>chains</span></div>
          <div><b>{rig.anatomy}</b><span>anatomy</span></div>
        </div>
        <Toggle checked={rig.mirrorEditing} label="Mirror joint edits" onChange={(mirrorEditing) => patchRig({ mirrorEditing })} />
      </Section>
      <Section title="Joint atlas">
        <div className="joint-list">
          {rig.joints.map((joint) => (
            <div className="joint-row" key={joint.id}>
              <span className="joint-icon">◇</span>
              <div><strong>{joint.name}</strong><small>{joint.role} · parent {joint.parentId ?? "world"}</small></div>
              <em>{joint.limit.min.x}°…{joint.limit.max.x}°</em>
            </div>
          ))}
        </div>
      </Section>
      <Section title="IK chains">
        {rig.chains.map((chain) => (
          <div className="property-row" key={chain.id}>
            <span>{chain.name}</span>
            <b>{chain.ikEnabled ? "IK" : "FK"}</b>
            <small>{Math.round(chain.stiffness * 100)}% stiff</small>
          </div>
        ))}
      </Section>
    </>
  );
}

function MotionInspector({ project, setProject, selection, setSelection }: Props) {
  const clip = project.motions.find((item) => item.id === selection.motionId) ?? project.motions[0];
  if (!clip) return null;
  const patch = (changes: Partial<typeof clip>) => setProject((current) => ({
    ...current,
    motions: current.motions.map((item) => item.id === clip.id ? { ...item, ...changes } : item)
  }));
  const patchCharacter = (key: keyof typeof clip.character, value: number) =>
    patch({ character: { ...clip.character, [key]: value } });

  return (
    <>
      <div className="panel-toolbar">
        <div><span className="eyebrow">MOVEMENT AUTHORING</span><strong>Motion Atlas</strong></div>
        <span className="pill positive">{clip.loop ? "loop" : "one-shot"}</span>
      </div>
      <div className="motion-library">
        {project.motions.map((motion) => (
          <button
            key={motion.id}
            className={motion.id === clip.id ? "motion-card selected" : "motion-card"}
            onClick={() => setSelection((current) => ({ ...current, motionId: motion.id }))}
          >
            <span className="motion-wave">∿</span>
            <strong>{motion.name}</strong>
            <small>{motion.durationMs} ms</small>
          </button>
        ))}
      </div>
      <Section title="Motion imprint">
        <div className="pose-strip">
          {clip.poses.map((pose, index) => (
            <div className="pose" key={pose.id}>
              <div className="mini-person"><i /><b /><em /></div>
              <span>{index === 0 ? "Start" : index === clip.poses.length - 1 ? "End" : `${Math.round(pose.at * 100)}%`}</span>
            </div>
          ))}
          <div className="pose-line" />
        </div>
        <Toggle checked={clip.loop} label="Loop motion" onChange={(loop) => patch({ loop })} />
      </Section>
      <Section title="Motion character">
        {Object.entries(clip.character).map(([key, value]) => (
          <label className="range-field" key={key}>
            <span>{key}<b>{Math.round(value * 100)}%</b></span>
            <input type="range" min="0" max="100" value={value * 100} onChange={(e) => patchCharacter(key as keyof typeof clip.character, Number(e.target.value) / 100)} />
          </label>
        ))}
      </Section>
      <p className="info-box">Motion Atlas uses reusable clips, joint constraints and pose interpolation. ECHO can select motions from actual activity instead of maintaining a separate animation graph.</p>
    </>
  );
}

function MaterialsInspector({ project, setProject, selection }: Props) {
  const entity = project.entities.find((item) => item.id === selection.entityId) ?? project.entities.find((item) => item.kind === "building");
  if (!entity) return null;
  const color = String(entity.properties.surfaceColor ?? "#7d8ca3");
  const roughness = Number(entity.properties.roughness ?? 0.72);
  const metalness = Number(entity.properties.metalness ?? 0.03);
  const patch = (key: string, value: PropertyValue) => setProject((current) => updateEntity(current, entity.id, (item) => ({
    ...item,
    properties: { ...item.properties, [key]: value }
  })));

  return (
    <>
      <div className="panel-toolbar">
        <div><span className="eyebrow">SURFACE WORKSHOP</span><strong>Materials</strong></div>
        <span className="pill">{entity.name}</span>
      </div>
      <div className="material-preview" style={{ background: `radial-gradient(circle at 35% 28%, white 0, ${color} 16%, ${color} 52%, #111 130%)` }}>
        <div className="material-orb" style={{ backgroundColor: color }} />
      </div>
      <Section title="Surface">
        <label className="color-field"><span>Base color</span><input type="color" value={color} onChange={(e) => patch("surfaceColor", e.target.value)} /><code>{color}</code></label>
        <label className="range-field"><span>Roughness <b>{roughness.toFixed(2)}</b></span><input type="range" min="0" max="100" value={roughness * 100} onChange={(e) => patch("roughness", Number(e.target.value) / 100)} /></label>
        <label className="range-field"><span>Metalness <b>{metalness.toFixed(2)}</b></span><input type="range" min="0" max="100" value={metalness * 100} onChange={(e) => patch("metalness", Number(e.target.value) / 100)} /></label>
      </Section>
      <Section title="World-aware material">
        <Toggle checked={Boolean(entity.properties.receiveWeather ?? true)} label="Respond to world weather" onChange={(next) => patch("receiveWeather", next)} />
        <Toggle checked={Boolean(entity.properties.receiveLight ?? true)} label="Receive scene lighting" onChange={(next) => patch("receiveLight", next)} />
      </Section>
    </>
  );
}

function EchoInspector({ project, setProject, selection, setSelection }: Props) {
  const npc = project.npcs.find((item) => item.id === selection.npcId)
    ?? project.npcs.find((item) => item.entityId === selection.entityId)
    ?? project.npcs[0];
  if (!npc) return null;

  const patch = (changes: Partial<Npc>) => setProject((current) => updateNpc(current, npc.id, (item) => ({ ...item, ...changes })));
  const job = project.jobs.find((item) => item.id === npc.career.jobId);

  return (
    <>
      <div className="panel-toolbar">
        <div><span className="eyebrow">LIVING WORLD ENGINE</span><strong>ECHO</strong></div>
        <select value={npc.id} onChange={(e) => setSelection((current) => ({ ...current, npcId: e.target.value }))}>
          {project.npcs.map((item) => <option key={item.id} value={item.id}>{item.displayName}</option>)}
        </select>
      </div>
      <div className="npc-hero">
        <div className="npc-avatar">{npc.displayName.split(" ").map((part) => part[0]).join("").slice(0, 2)}</div>
        <div><h3>{npc.displayName}</h3><p>{npc.currentAction}</p></div>
        <span className={`autonomy-badge ${npc.autonomy}`}>{npc.autonomy}</span>
      </div>
      <Section title="Identity Core">
        <label className="inline-field">
          <span>Autonomy</span>
          <select value={npc.autonomy} onChange={(e) => patch({ autonomy: e.target.value as Npc["autonomy"] })}>
            <option value="directed">Directed</option>
            <option value="adaptive">Adaptive</option>
            <option value="emergent">Emergent</option>
          </select>
        </label>
        <Toggle checked={npc.protectedRole} label="Protect story role" onChange={(protectedRole) => patch({ protectedRole })} />
        <div className="chip-cloud">
          {Object.entries(npc.traits).sort((a, b) => b[1] - a[1]).map(([trait, value]) => (
            <span className="trait-chip" key={trait}>{trait}<b>{Math.round(value * 100)}</b></span>
          ))}
        </div>
      </Section>
      <Section title="Changing needs">
        {(Object.entries(npc.needs) as [string, number][]).map(([key, value]) => <Meter key={key} label={key} value={value} />)}
      </Section>
      <Section title="Career">
        <div className="career-card">
          <span className="career-icon">⌂</span>
          <div><strong>{job?.title ?? "Between jobs"}</strong><small>{npc.career.workplaceId ?? "No workplace"} · satisfaction {Math.round(npc.career.satisfaction * 100)}%</small></div>
          <b>Lv {npc.career.level}</b>
        </div>
        {npc.goals.filter((goal) => goal.status === "active").map((goal) => (
          <div className="goal-card" key={goal.id}>
            <div><strong>{goal.title}</strong><small>{goal.category}</small></div>
            <span>{Math.round(goal.progress * 100)}%</span>
            <div className="goal-progress"><i style={{ width: `${goal.progress * 100}%` }} /></div>
          </div>
        ))}
      </Section>
      <Section title="Experience Memory">
        {npc.memories.length === 0 && <p className="muted">No important long-term memories yet.</p>}
        {npc.memories.slice(0, 5).map((memory) => (
          <div className="memory-card" key={memory.id}>
            <span>{memory.kind}</span>
            <p>{memory.summary}</p>
            <b>{Math.round(memory.importance * 100)}</b>
          </div>
        ))}
      </Section>
      <Section title="Social Fabric">
        {npc.relationships.length === 0 && <p className="muted">Relationships will form through encounters and world events.</p>}
        {npc.relationships.map((relationship) => {
          const other = project.npcs.find((item) => item.id === relationship.npcId);
          return (
            <div className="relationship-card" key={relationship.npcId}>
              <strong>{other?.displayName ?? relationship.npcId}</strong>
              <Meter label="trust" value={relationship.trust} />
              <Meter label="affection" value={relationship.affection} />
              <Meter label="tension" value={relationship.tension} />
            </div>
          );
        })}
      </Section>
    </>
  );
}

function EmergenceInspector({ project, setProject }: Props) {
  const patchSettings = (changes: Partial<VeryaProject["settings"]>) =>
    setProject((current) => ({ ...current, settings: { ...current.settings, ...changes } }));

  return (
    <>
      <div className="panel-toolbar">
        <div><span className="eyebrow">SYSTEMIC CHANGE</span><strong>Emergence</strong></div>
        <span className="pill positive">{project.emergence.filter((event) => !event.resolved).length} active</span>
      </div>
      <Section title="Creator boundaries">
        <Toggle checked={project.settings.allowCareerChanges} label="NPC career changes" onChange={(value) => patchSettings({ allowCareerChanges: value })} />
        <Toggle checked={project.settings.allowRelationshipEvolution} label="Relationships evolve" onChange={(value) => patchSettings({ allowRelationshipEvolution: value })} />
        <Toggle checked={project.settings.allowWorldChangingDecisions} label="World-changing decisions" onChange={(value) => patchSettings({ allowWorldChangingDecisions: value })} />
      </Section>
      <Section title="World economy">
        <div className="economy-grid">
          {Object.keys(project.economy.prices).map((resource) => (
            <div key={resource}>
              <span>{resource}</span>
              <strong>${project.economy.prices[resource].toFixed(2)}</strong>
              <small>{(project.economy.supply[resource] ?? 0).toFixed(0)} supply · {(project.economy.demand[resource] ?? 0).toFixed(0)} demand</small>
            </div>
          ))}
        </div>
      </Section>
      <Section title="Evolving occupations">
        {project.jobs.map((job) => {
          const occupied = project.npcs.filter((npc) => npc.career.jobId === job.id).length;
          return (
            <div className="job-row" key={job.id}>
              <div><strong>{job.title}</strong><small>${job.payPerDay}/day</small></div>
              <span>{occupied}/{job.capacity} occupied</span>
              <div className="occupancy"><i style={{ width: `${Math.min(100, (occupied / Math.max(job.capacity, 1)) * 100)}%` }} /></div>
            </div>
          );
        })}
      </Section>
      <Section title="Emergent events">
        {project.emergence.length === 0 && <p className="muted">Run the world. Vacancies, shortages and opportunities are derived from simulation state rather than pre-scripted event chains.</p>}
        {project.emergence.slice(0, 10).map((event) => (
          <div className={event.resolved ? "event-card resolved" : "event-card"} key={event.id}>
            <span>{event.type}</span>
            <div><strong>{event.title}</strong><p>{event.detail}</p></div>
            <b>{Math.round(event.severity * 100)}</b>
          </div>
        ))}
      </Section>
    </>
  );
}

function TraceInspector({ project }: Props) {
  return (
    <>
      <div className="panel-toolbar">
        <div><span className="eyebrow">EXPLAINABLE RUNTIME</span><strong>Trace</strong></div>
        <span className="pill">{project.trace.length} entries</span>
      </div>
      <p className="info-box">Verya’s runtime is inspectable. This feed records why Imprints fired, what ECHO chose, and which systemic events emerged.</p>
      <div className="trace-list">
        {project.trace.map((entry) => (
          <div className={`trace-card trace-${entry.category}`} key={entry.id}>
            <span className="trace-type">{entry.category}</span>
            <div><strong>{entry.title}</strong><p>{entry.detail}</p><small>{new Date(entry.at).toLocaleTimeString()}</small></div>
          </div>
        ))}
      </div>
    </>
  );
}

function PlayInspector({ project, onInteract, selection }: Props) {
  const entity = project.entities.find((item) => item.id === selection.entityId);
  return (
    <>
      <div className="panel-toolbar">
        <div><span className="eyebrow">LIVE WORLD</span><strong>Play</strong></div>
        <span className={project.settings.running ? "pill positive" : "pill"}>{project.settings.running ? "simulation running" : "paused"}</span>
      </div>
      <div className="play-card">
        <div className="play-orb">▶</div>
        <h3>The editor and game share one world state.</h3>
        <p>Interact with objects, watch ECHO characters make decisions, then open Trace to see exactly why the world changed.</p>
      </div>
      {entity && (
        <Section title="Selected target">
          <div className="object-header">
            <span className={`entity-dot kind-${entity.kind}`} />
            <div><strong>{entity.name}</strong><small>{entity.kind}</small></div>
          </div>
          <button className="primary wide" onClick={() => onInteract(entity.id)}>Player interacts with {entity.name}</button>
        </Section>
      )}
      <Section title="Living population">
        {project.npcs.map((npc) => (
          <div className="npc-live-row" key={npc.id}>
            <span className="npc-mini">{npc.displayName[0]}</span>
            <div><strong>{npc.displayName}</strong><small>{npc.currentAction}</small></div>
            <em>{npc.autonomy}</em>
          </div>
        ))}
      </Section>
    </>
  );
}

export default function WorkspacePanel(props: Props) {
  const { selection } = props;
  return (
    <aside className="workspace-panel panel">
      <div className="workspace-scroll">
        {selection.workspace === "world" && <WorldInspector {...props} />}
        {selection.workspace === "imprint" && <ImprintInspector {...props} />}
        {selection.workspace === "weave" && <WeaveInspector {...props} />}
        {selection.workspace === "body" && <BodyInspector {...props} />}
        {selection.workspace === "motion" && <MotionInspector {...props} />}
        {selection.workspace === "materials" && <MaterialsInspector {...props} />}
        {selection.workspace === "echo" && <EchoInspector {...props} />}
        {selection.workspace === "emergence" && <EmergenceInspector {...props} />}
        {selection.workspace === "trace" && <TraceInspector {...props} />}
        {selection.workspace === "play" && <PlayInspector {...props} />}
      </div>
    </aside>
  );
}
