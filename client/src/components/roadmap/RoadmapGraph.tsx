import { memo, useEffect, useMemo, useRef } from 'react';
import {
  Background,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type Node,
  type NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useTheme } from '../../hooks/useTheme';
import type { CoursePlanningTree, LabGroup, ModuleEntity, Milestone, Lab } from '../../types/domain';
import MilestoneNode, { type MilestoneNodeData } from './MilestoneNode';
import ModuleNode, { type ModuleNodeData } from './ModuleNode';
import LabGroupNode, { type LabGroupNodeData } from './LabGroupNode';
import EmptyNode from './EmptyNode';
import type { DrillTarget, Level, Orient } from './types';

interface Props {
  planning: CoursePlanningTree;
  level: Level;
  onDrillDown: (next: DrillTarget) => void;
}

const CARD_W = 320;
const HEADER = 130; // title + description + chip
const GAP_X = 96;
const GAP_Y = 72;
// Vary height by node type so LabGroupNode (taller) gets its own stack step.
const LABGROUP_EXTRA = 220;

function byOrder<T extends { order: number }>(a: T, b: T): number {
  return a.order - b.order;
}

interface Items {
  orient: Orient;
  nodes: Node[];
  edges: Edge[];
}

function buildItems(
  planning: CoursePlanningTree,
  level: Level,
  onDrillDown: Props['onDrillDown'],
): Items {
  if (level.kind === 'milestone') {
    const ms: Array<Milestone & { modules: ModuleEntity[] }> = [...planning.milestones].sort(
      (a, b) => a.order - b.order || a._id.localeCompare(b._id),
    );

    if (ms.length === 0) {
      return {
        orient: 'horizontal',
        nodes: [{
          id: 'empty-l1',
          type: 'empty',
          position: { x: 0, y: 0 },
          data: { message: 'No milestones yet', hint: 'Create one in Lab Planning.' } as unknown as Record<string, unknown>,
        }],
        edges: [],
      };
    }

    const orient: Orient = ms.length <= 4 ? 'horizontal' : 'vertical';
    const nodes: Node[] = ms.map((m, i) => {
      const data: MilestoneNodeData = {
        milestone: m,
        moduleCount: m.modules.length,
        isCapstone: i === ms.length - 1 && ms.length > 1,
        orient,
        onDrillDown,
      };
      return {
        id: `ms-${m._id}`,
        type: 'milestone',
        position:
          orient === 'horizontal'
            ? { x: i * (CARD_W + GAP_X), y: 0 }
            : { x: 0, y: i * (HEADER + GAP_Y) },
        data: data as unknown as Record<string, unknown>,
        draggable: false,
        selectable: false,
        style: { width: CARD_W, background: 'transparent', border: 0, padding: 0 },
      };
    });

    const edges: Edge[] = ms.slice(1).map((_m, i) => ({
      id: `e-l1-${i}`,
      source: `ms-${ms[i]._id}`,
      target: `ms-${ms[i + 1]._id}`,
      type: 'smoothstep',
      markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 },
      style: { strokeWidth: 2 },
      className: 'rf-edge',
    }));

    return { orient, nodes, edges };
  }

  if (level.kind === 'module') {
    const ms = planning.milestones.find((m) => m._id === level.milestoneId);
    const mods: Array<ModuleEntity & { labGroups: LabGroup[] }> = ms
      ? [...ms.modules].sort(byOrder)
      : [];

    if (mods.length === 0) {
      return {
        orient: 'horizontal',
        nodes: [{
          id: 'empty-l2',
          type: 'empty',
          position: { x: 0, y: 0 },
          data: { message: 'No modules in this milestone', hint: 'Add one in Lab Planning.' } as unknown as Record<string, unknown>,
        }],
        edges: [],
      };
    }

    const orient: Orient = mods.length <= 4 ? 'horizontal' : 'vertical';
    const nodes: Node[] = mods.map((mod, i) => {
      const data: ModuleNodeData = {
        module: mod,
        labGroupCount: mod.labGroups.length,
        orient,
        onDrillDown,
      };
      return {
        id: `mod-${mod._id}`,
        type: 'module',
        position:
          orient === 'horizontal'
            ? { x: i * (CARD_W + GAP_X), y: 0 }
            : { x: 0, y: i * (HEADER + GAP_Y) },
        data: data as unknown as Record<string, unknown>,
        draggable: false,
        selectable: false,
        style: { width: CARD_W, background: 'transparent', border: 0, padding: 0 },
      };
    });

    const edges: Edge[] = mods.slice(1).map((_mod, i) => ({
      id: `e-l2-${i}`,
      source: `mod-${mods[i]._id}`,
      target: `mod-${mods[i + 1]._id}`,
      type: 'smoothstep',
      markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 },
      style: { strokeWidth: 2 },
      className: 'rf-edge',
    }));

    return { orient, nodes, edges };
  }

  // level.kind === 'lab-group'
  const ms = planning.milestones.find((m) => m._id === level.milestoneId);
  const mod = ms?.modules.find((m) => m._id === level.moduleId);
  const groups: Array<LabGroup & { labs: Lab[] }> = mod
    ? [...mod.labGroups].sort(byOrder)
    : [];

  if (groups.length === 0) {
    return {
      orient: 'horizontal',
      nodes: [{
        id: 'empty-l3',
        type: 'empty',
        position: { x: 0, y: 0 },
        data: { message: 'No lab groups in this module', hint: 'Add one in Lab Planning.' } as unknown as Record<string, unknown>,
      }],
      edges: [],
    };
  }

  const orient: Orient = groups.length <= 4 ? 'horizontal' : 'vertical';
  const nodes: Node[] = groups.map((g, i) => {
    const data: LabGroupNodeData = {
      labGroup: g,
      orient,
    };
    const stepY = HEADER + LABGROUP_EXTRA;
    return {
      id: `lg-${g._id}`,
      type: 'lab-group',
      position:
        orient === 'horizontal'
          ? { x: i * (CARD_W + GAP_X), y: 0 }
          : { x: 0, y: i * stepY },
      data: data as unknown as Record<string, unknown>,
      draggable: false,
      selectable: false,
      style: { width: CARD_W, background: 'transparent', border: 0, padding: 0 },
    };
  });

  const edges: Edge[] = groups.slice(1).map((_g, i) => ({
    id: `e-l3-${i}`,
    source: `lg-${groups[i]._id}`,
    target: `lg-${groups[i + 1]._id}`,
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 },
    style: { strokeWidth: 2 },
    className: 'rf-edge',
  }));

  return { orient, nodes, edges };
}

const nodeTypesByKind: NodeTypes = {
  milestone: MilestoneNode,
  module: ModuleNode,
  'lab-group': LabGroupNode,
  empty: EmptyNode,
};

function RoadmapGraphInner({ planning, level, onDrillDown }: Props) {
  const { resolved } = useTheme();
  const flow = useReactFlow();
  const wrapperRef = useRef<HTMLDivElement>(null);

  const { orient, nodes, edges } = useMemo(
    () => buildItems(planning, level, onDrillDown),
    [planning, level, onDrillDown],
  );

  // Fit view on mount + when container resizes.
  useEffect(() => {
    const fit = () => {
      try { flow.fitView({ padding: 0.2, duration: 250 }); } catch { /* ignore */ }
    };
    fit();
    const el = wrapperRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [flow, resolved]);

  return (
    <div ref={wrapperRef} className="roadmap-graph-page" data-orient={orient}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypesByKind}
        onNodesChange={() => {}}
        onEdgesChange={() => {}}
        nodesDraggable={false}
        nodesConnectable={false}
        nodesFocusable={false}
        edgesFocusable={false}
        elementsSelectable={false}
        panOnDrag={[1, 2]}
        panOnScroll={false}
        zoomOnScroll
        zoomOnPinch
        zoomOnDoubleClick={false}
        selectionOnDrag={false}
        proOptions={{ hideAttribution: true }}
        colorMode={resolved}
        minZoom={0.2}
        maxZoom={2}
        fitView
        defaultEdgeOptions={{ type: 'smoothstep' }}
      >
        <Background gap={20} size={1.4} />
        <MiniMap pannable zoomable maskColor="rgba(0,0,0,0.08)" className="rf-minimap" />
        <Controls className="rf-controls" showInteractive={false} />
      </ReactFlow>
    </div>
  );
}

function RoadmapGraph(props: Props) {
  // Re-mount the whole tree (provider + canvas) on level change so the viewport
  // resets and fitView runs once. The keyed wrapper forces React to drop both
  // the Provider state and the canvas when the level changes.
  return (
    <div key={props.level.kind} className="roadmap-graph-keyed">
      <ReactFlowProvider>
        <RoadmapGraphInner {...props} />
      </ReactFlowProvider>
    </div>
  );
}

export default memo(RoadmapGraph);
