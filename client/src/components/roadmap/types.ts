// Shared types for the roadmap drill-down.

export type Orient = 'horizontal' | 'vertical';

export type Level =
  | { kind: 'milestone' }
  | { kind: 'module'; milestoneId: string }
  | { kind: 'lab-group'; milestoneId: string; moduleId: string };

export type DrillTarget =
  | { kind: 'module'; milestoneId: string }
  | { kind: 'lab-group'; milestoneId: string; moduleId: string };

export type NodeKind = 'milestone' | 'module' | 'lab-group' | 'empty';

export interface BreadcrumbSegment {
  label: string;
  levelIdx: number; // index into the history stack this segment represents
}
