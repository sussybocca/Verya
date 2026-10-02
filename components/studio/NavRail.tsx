"use client";

import type { Workspace } from "@/lib/verya/types";

const items: { id: Workspace; icon: string; label: string }[] = [
  { id: "world", icon: "◫", label: "World" },
  { id: "imprint", icon: "◎", label: "Imprint" },
  { id: "weave", icon: "⌘", label: "World Weave" },
  { id: "body", icon: "◇", label: "Body Atlas" },
  { id: "motion", icon: "∿", label: "Motion Atlas" },
  { id: "materials", icon: "◈", label: "Materials" },
  { id: "echo", icon: "◉", label: "ECHO" },
  { id: "emergence", icon: "✦", label: "Emergence" },
  { id: "trace", icon: "≋", label: "Trace" },
  { id: "play", icon: "▶", label: "Play" }
];

export default function NavRail({ active, onChange }: { active: Workspace; onChange: (workspace: Workspace) => void }) {
  return (
    <nav className="nav-rail" aria-label="Verya workspaces">
      <div className="brand-mark">V</div>
      <div className="nav-items">
        {items.map((item) => (
          <button
            key={item.id}
            className={active === item.id ? "nav-item active" : "nav-item"}
            onClick={() => onChange(item.id)}
            title={item.label}
          >
            <span>{item.icon}</span>
            <small>{item.label}</small>
          </button>
        ))}
      </div>
    </nav>
  );
}
