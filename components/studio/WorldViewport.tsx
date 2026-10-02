"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { WorldEntity } from "@/lib/verya/types";

type Props = {
  entities: WorldEntity[];
  selectedId?: string;
  onSelect: (id?: string) => void;
  playMode: boolean;
};

function entityColor(kind: WorldEntity["kind"], selected: boolean) {
  if (selected) return "#ffcf66";
  switch (kind) {
    case "player": return "#8ad8ff";
    case "npc": return "#8ce6b0";
    case "door": return "#d2a56d";
    case "building": return "#7d8ca3";
    case "item": return "#f1d86f";
    case "light": return "#fff0a8";
    case "zone": return "#537d77";
    default: return "#9aa7b8";
  }
}

function CameraControls() {
  const { camera, gl } = useThree();
  useEffect(() => {
    const controls = new OrbitControls(camera, gl.domElement);
    controls.target.set(7, 0.5, 7);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 5;
    controls.maxDistance = 42;
    controls.maxPolarAngle = Math.PI * 0.48;
    const frame = () => controls.update();
    controls.addEventListener("change", frame);
    controls.update();
    return () => {
      controls.removeEventListener("change", frame);
      controls.dispose();
    };
  }, [camera, gl]);
  return null;
}

function EntityMesh({ entity, selected, onSelect }: { entity: WorldEntity; selected: boolean; onSelect: () => void }) {
  const size = useMemo<[number, number, number]>(() => {
    if (entity.kind === "npc" || entity.kind === "player") return [0.55, 1.7, 0.55];
    if (entity.kind === "door") return [0.35, 2.2, 1.6];
    if (entity.kind === "item") return [0.35, 0.35, 0.35];
    if (entity.kind === "zone") return [entity.scale.x * 2, 0.06, entity.scale.z * 2];
    return [entity.scale.x * 1.4, Math.max(0.7, entity.scale.y * 1.4), entity.scale.z * 1.4];
  }, [entity]);

  return (
    <group
      position={[entity.position.x, entity.position.y, entity.position.z]}
      rotation={[
        (entity.rotation.x * Math.PI) / 180,
        (entity.rotation.y * Math.PI) / 180,
        (entity.rotation.z * Math.PI) / 180
      ]}
      visible={entity.visible}
    >
      <mesh
        position={[0, size[1] / 2, 0]}
        onClick={(event) => {
          event.stopPropagation();
          onSelect();
        }}
        castShadow
        receiveShadow
      >
        {entity.kind === "npc" || entity.kind === "player" ? (
          <capsuleGeometry args={[0.28, 1.05, 6, 12]} />
        ) : entity.kind === "item" ? (
          <octahedronGeometry args={[0.28, 0]} />
        ) : (
          <boxGeometry args={size} />
        )}
        <meshStandardMaterial
          color={selected ? "#ffcf66" : String(entity.properties.surfaceColor ?? entityColor(entity.kind, false))}
          transparent={entity.kind === "zone"}
          opacity={entity.kind === "zone" ? 0.22 : 1}
          roughness={Number(entity.properties.roughness ?? 0.72)}
          metalness={Number(entity.properties.metalness ?? (entity.kind === "item" ? 0.25 : 0.03))}
        />
      </mesh>
      {selected && (
        <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.42, 0.52, 36]} />
          <meshBasicMaterial color="#ffcf66" />
        </mesh>
      )}
    </group>
  );
}

export default function WorldViewport({ entities, selectedId, onSelect, playMode }: Props) {
  return (
    <div className="world-viewport">
      <Canvas
        shadows
        camera={{ position: [15, 13, 18], fov: 43, near: 0.1, far: 100 }}
        onPointerMissed={() => onSelect(undefined)}
      >
        <color attach="background" args={[playMode ? "#111b28" : "#0d131d"]} />
        <fog attach="fog" args={[playMode ? "#111b28" : "#0d131d", 24, 58]} />
        <CameraControls />
        <ambientLight intensity={0.95} />
        <directionalLight position={[10, 16, 8]} intensity={2.1} castShadow />
        <hemisphereLight args={["#9dc8ff", "#263528", 0.75]} />
        <gridHelper args={[34, 34, "#314155", "#1e2a38"]} position={[7, 0, 7]} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[7, -0.03, 7]} receiveShadow>
          <planeGeometry args={[34, 34]} />
          <meshStandardMaterial color="#151d25" roughness={1} />
        </mesh>
        {entities.filter((entity) => entity.active).map((entity) => (
          <EntityMesh
            key={entity.id}
            entity={entity}
            selected={entity.id === selectedId}
            onSelect={() => onSelect(entity.id)}
          />
        ))}
      </Canvas>
      <div className="viewport-badge">
        <span className={playMode ? "live-dot live" : "live-dot"} />
        {playMode ? "PLAYING WORLD" : "AUTHORING WORLD"}
      </div>
      <div className="viewport-help">
        Click an object to inspect it · Scene uses real Three.js/WebGL geometry
      </div>
    </div>
  );
}
