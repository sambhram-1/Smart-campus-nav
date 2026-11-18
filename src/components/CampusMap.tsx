import React, { useMemo, useState } from "react";
import {
  CAMPUS_NODES,
  NODE_LABEL_OFFSETS,
} from "../data/campusData";
import type { CampusGraph } from "../algorithms/graph";
import type { AStarResult, ExplorationStep } from "../algorithms/astar";
import type { BFSResult } from "../algorithms/bfs";

export type MapPickTarget = "start" | "goal";

interface CampusMapProps {
  graph: CampusGraph;
  start: string;
  goal: string;
  astarResult: AStarResult | null;
  bfsResult: BFSResult | null;
  activeStepIndex: number | null;
  pickTarget: MapPickTarget;
  onPickTargetChange: (target: MapPickTarget) => void;
  onSelectNode: (nodeName: string) => void;
  showBfsOverlay: boolean;
  onToggleBfsOverlay: () => void;
  showEdgeWeights: boolean;
  onToggleEdgeWeights: () => void;
  showHeuristicLine: boolean;
  onToggleHeuristicLine: () => void;
}

function edgeKey(u: string, v: string): string {
  return u < v ? `${u}::${v}` : `${v}::${u}`;
}

export const CampusMap: React.FC<CampusMapProps> = ({
  graph,
  start,
  goal,
  astarResult,
  bfsResult,
  activeStepIndex,
  pickTarget,
  onPickTargetChange,
  onSelectNode,
  showBfsOverlay,
  onToggleBfsOverlay,
  showEdgeWeights,
  onToggleEdgeWeights,
  showHeuristicLine,
  onToggleHeuristicLine,
}) => {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const currentStep: ExplorationStep | null = useMemo(() => {
    if (!astarResult || activeStepIndex === null) return null;
    return astarResult.steps[activeStepIndex] ?? null;
  }, [astarResult, activeStepIndex]);

  const isAnimatingOrStepping =
    astarResult !== null &&
    activeStepIndex !== null &&
    activeStepIndex < astarResult.steps.length - 1;

  const exploredMap = useMemo(() => {
    const map = new Map<string, number>();
    if (!astarResult) return map;
    const limit =
      activeStepIndex !== null
        ? Math.min(activeStepIndex + 1, astarResult.steps.length)
        : astarResult.exploredNodes.length;
    for (let i = 0; i < limit; i++) {
      const node = astarResult.exploredNodes[i];
      if (node && !map.has(node)) {
        map.set(node, i + 1);
      }
    }
    return map;
  }, [astarResult, activeStepIndex]);

  const frontierSet = useMemo(() => {
    if (!currentStep) return new Set<string>();
    return new Set(currentStep.openSet.map((c) => c.node));
  }, [currentStep]);

  const astarPathEdges = useMemo(() => {
    const set = new Set<string>();
    if (!astarResult || isAnimatingOrStepping) return set;
    for (let i = 0; i < astarResult.path.length - 1; i++) {
      set.add(edgeKey(astarResult.path[i], astarResult.path[i + 1]));
    }
    return set;
  }, [astarResult, isAnimatingOrStepping]);

  const astarPathNodes = useMemo(() => {
    if (!astarResult || isAnimatingOrStepping) return new Set<string>();
    return new Set(astarResult.path);
  }, [astarResult, isAnimatingOrStepping]);

  const bfsPathEdges = useMemo(() => {
    const set = new Set<string>();
    if (!bfsResult || !showBfsOverlay) return set;
    for (let i = 0; i < bfsResult.path.length - 1; i++) {
      set.add(edgeKey(bfsResult.path[i], bfsResult.path[i + 1]));
    }
    return set;
  }, [bfsResult, showBfsOverlay]);

  const heuristicSourceNode = useMemo(() => {
    if (hoveredNode && graph.hasNode(hoveredNode)) return hoveredNode;
    if (currentStep && currentStep.node !== goal) return currentStep.node;
    if (start && graph.hasNode(start)) return start;
    return null;
  }, [hoveredNode, currentStep, start, goal, graph]);

  const heuristicDistance = useMemo(() => {
    if (!heuristicSourceNode || !goal || !graph.hasNode(goal)) return null;
    return graph.euclideanDistance(heuristicSourceNode, goal);
  }, [graph, heuristicSourceNode, goal]);

  const astarPolylinePoints = useMemo(() => {
    if (!astarResult || isAnimatingOrStepping || astarResult.path.length < 2) {
      return "";
    }
    return astarResult.path
      .map((node) => {
        const c = CAMPUS_NODES[node];
        return `${c.x},${c.y}`;
      })
      .join(" ");
  }, [astarResult, isAnimatingOrStepping]);

  const bfsPolylinePoints = useMemo(() => {
    if (!bfsResult || !showBfsOverlay || bfsResult.path.length < 2) {
      return "";
    }
    return bfsResult.path
      .map((node) => {
        const c = CAMPUS_NODES[node];
        return `${c.x},${c.y}`;
      })
      .join(" ");
  }, [bfsResult, showBfsOverlay]);

  const inspectedNode = hoveredNode ?? currentStep?.node ?? null;
  const inspectedCoords = inspectedNode ? CAMPUS_NODES[inspectedNode] : null;
  const inspectedH =
    inspectedNode && goal && graph.hasNode(goal)
      ? graph.euclideanDistance(inspectedNode, goal)
      : null;

  return (
    <section
      id="campus-map-section"
      aria-label="Interactive Campus Map"
      className="liquid-glass rounded-2xl overflow-hidden scroll-mt-20"
    >
      {/* Map Control Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-white/80 bg-white/45 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-600 whitespace-nowrap">
            Map click sets:
          </span>
          <div
            className="inline-flex items-center p-0.5 bg-slate-900/6 border border-white/75 rounded-xl"
            role="group"
            aria-label="Map node click assignment mode"
          >
            <button
              type="button"
              onClick={() => onPickTargetChange("start")}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                pickTarget === "start"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-700 hover:text-slate-900"
              }`}
            >
              Start (S)
            </button>
            <button
              type="button"
              onClick={() => onPickTargetChange("goal")}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                pickTarget === "goal"
                  ? "bg-red-600 text-white shadow-xs"
                  : "text-slate-700 hover:text-slate-900"
              }`}
            >
              Destination (G)
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onToggleEdgeWeights}
            aria-pressed={showEdgeWeights}
            className={`px-3 py-1.5 text-xs font-medium rounded-xl border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              showEdgeWeights
                ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                : "liquid-glass-subtle text-slate-700 hover:bg-white/90"
            }`}
          >
            Edge Weights
          </button>
          <button
            type="button"
            onClick={onToggleHeuristicLine}
            aria-pressed={showHeuristicLine}
            className={`px-3 py-1.5 text-xs font-medium rounded-xl border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              showHeuristicLine
                ? "bg-sky-700 text-white border-sky-700 shadow-xs"
                : "liquid-glass-subtle text-slate-700 hover:bg-white/90"
            }`}
          >
            Heuristic h(n)
          </button>
          <button
            type="button"
            onClick={onToggleBfsOverlay}
            aria-pressed={showBfsOverlay}
            className={`px-3 py-1.5 text-xs font-medium rounded-xl border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              showBfsOverlay
                ? "bg-violet-700 text-white border-violet-700 shadow-xs"
                : "liquid-glass-subtle text-slate-700 hover:bg-white/90"
            }`}
          >
            BFS Path Overlay
          </button>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative bg-white/35">
        <svg
          data-testid="campus-map-svg"
          viewBox="0 0 860 580"
          className="w-full h-auto block select-none"
          role="img"
          aria-label="Campus graph with 17 locations and 38 weighted pathways"
        >
          <defs>
            <pattern
              id="campus-grid-100"
              width="100"
              height="100"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 100 0 L 0 0 0 100"
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="1"
              />
            </pattern>
            <pattern
              id="campus-grid-25"
              width="25"
              height="25"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 25 0 L 0 0 0 25"
                fill="none"
                stroke="#f1f5f9"
                strokeWidth="0.75"
              />
            </pattern>
          </defs>

          {/* Blueprint Grid */}
          <rect width="860" height="580" fill="#f8fafc" />
          <rect width="860" height="580" fill="url(#campus-grid-25)" />
          <rect width="860" height="580" fill="url(#campus-grid-100)" />

          {/* Coordinate axis markers along top/left */}
          {[100, 200, 300, 400, 500, 600, 700, 800].map((x) => (
            <text
              key={`x-${x}`}
              x={x + 4}
              y={14}
              fontSize="10"
              fontFamily="var(--font-mono)"
              fill="#94a3b8"
            >
              {x}m
            </text>
          ))}
          {[100, 200, 300, 400, 500].map((y) => (
            <text
              key={`y-${y}`}
              x={6}
              y={y - 4}
              fontSize="10"
              fontFamily="var(--font-mono)"
              fill="#94a3b8"
            >
              {y}m
            </text>
          ))}

          {/* Campus Scale Bar & Compass */}
          <g transform="translate(24, 544)">
            <line
              x1="0"
              y1="8"
              x2="100"
              y2="8"
              stroke="#475569"
              strokeWidth="2"
            />
            <line
              x1="0"
              y1="3"
              x2="0"
              y2="13"
              stroke="#475569"
              strokeWidth="2"
            />
            <line
              x1="100"
              y1="3"
              x2="100"
              y2="13"
              stroke="#475569"
              strokeWidth="2"
            />
            <text
              x="50"
              y="22"
              textAnchor="middle"
              fontSize="10"
              fontFamily="var(--font-mono)"
              fill="#475569"
              fontWeight="500"
            >
              100 metres (1:1 scale)
            </text>
          </g>

          {/* All 38 Campus Walkway Edges */}
          {graph.edges.map(({ u, v, weight }) => {
            const c1 = CAMPUS_NODES[u];
            const c2 = CAMPUS_NODES[v];
            const key = edgeKey(u, v);
            const onAstarPath = astarPathEdges.has(key);
            const onBfsPath = bfsPathEdges.has(key);
            const touchesHover = hoveredNode === u || hoveredNode === v;

            const midX = (c1.x + c2.x) / 2;
            const midY = (c1.y + c2.y) / 2;

            return (
              <g key={key}>
                <line
                  x1={c1.x}
                  y1={c1.y}
                  x2={c2.x}
                  y2={c2.y}
                  stroke={
                    onAstarPath
                      ? "#059669"
                      : touchesHover
                        ? "#64748b"
                        : "#cbd5e1"
                  }
                  strokeWidth={onAstarPath ? 4.5 : touchesHover ? 2.5 : 1.75}
                  strokeLinecap="round"
                />

                {(showEdgeWeights || onAstarPath || onBfsPath || touchesHover) && (
                  <g transform={`translate(${midX}, ${midY})`}>
                    <rect
                      x="-18"
                      y="-9"
                      width="36"
                      height="16"
                      rx="4"
                      fill={onAstarPath ? "#ecfdf5" : "#ffffff"}
                      fillOpacity="0.92"
                      stroke={onAstarPath ? "#10b981" : "#e2e8f0"}
                      strokeWidth="0.75"
                    />
                    <text
                      x="0"
                      y="2.5"
                      textAnchor="middle"
                      fontSize="9.5"
                      fontFamily="var(--font-mono)"
                      fontWeight={onAstarPath ? "600" : "500"}
                      fill={onAstarPath ? "#065f46" : "#475569"}
                    >
                      {Math.round(weight)}m
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Animated A* Optimal Path Flow Overlay */}
          {astarPolylinePoints && (
            <polyline
              points={astarPolylinePoints}
              fill="none"
              stroke="#34d399"
              strokeWidth="2.5"
              strokeDasharray="8 6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-route-flow pointer-events-none"
            />
          )}

          {/* Optional BFS Path Overlay */}
          {bfsPolylinePoints && (
            <polyline
              points={bfsPolylinePoints}
              fill="none"
              stroke="#7c3aed"
              strokeWidth="3"
              strokeDasharray="6 5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="pointer-events-none"
            />
          )}

          {/* Optional Straight-line Euclidean Heuristic h(n) Line */}
          {showHeuristicLine &&
            heuristicSourceNode &&
            goal &&
            graph.hasNode(goal) &&
            heuristicSourceNode !== goal && (
              <g className="pointer-events-none">
                <line
                  x1={CAMPUS_NODES[heuristicSourceNode].x}
                  y1={CAMPUS_NODES[heuristicSourceNode].y}
                  x2={CAMPUS_NODES[goal].x}
                  y2={CAMPUS_NODES[goal].y}
                  stroke="#0284c7"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
                {heuristicDistance !== null && (
                  <g
                    transform={`translate(${
                      (CAMPUS_NODES[heuristicSourceNode].x +
                        CAMPUS_NODES[goal].x) /
                      2
                    }, ${
                      (CAMPUS_NODES[heuristicSourceNode].y +
                        CAMPUS_NODES[goal].y) /
                        2 -
                      24
                    })`}
                  >
                    <rect
                      x="-46"
                      y="-10"
                      width="92"
                      height="18"
                      rx="4"
                      fill="#0369a1"
                    />
                    <text
                      x="0"
                      y="2.5"
                      textAnchor="middle"
                      fontSize="10"
                      fontFamily="var(--font-mono)"
                      fontWeight="600"
                      fill="#ffffff"
                    >
                      h = {heuristicDistance.toFixed(1)}m
                    </text>
                  </g>
                )}
              </g>
            )}

          {/* Active Search Tree Parent Pointer during Step-by-Step */}
          {currentStep && currentStep.parent && (
            <line
              x1={CAMPUS_NODES[currentStep.parent].x}
              y1={CAMPUS_NODES[currentStep.parent].y}
              x2={CAMPUS_NODES[currentStep.node].x}
              y2={CAMPUS_NODES[currentStep.node].y}
              stroke="#d97706"
              strokeWidth="3.5"
              strokeLinecap="round"
              className="pointer-events-none"
            />
          )}

          {/* All 17 Campus Nodes */}
          {Object.entries(CAMPUS_NODES).map(([name, coords]) => {
            const isStart = name === start;
            const isGoal = name === goal;
            const isCurrentStep = currentStep?.node === name;
            const exploredOrder = exploredMap.get(name);
            const isExplored = exploredOrder !== undefined;
            const isFrontier = frontierSet.has(name);
            const isOnFinalPath = astarPathNodes.has(name);
            const isHovered = hoveredNode === name;

            let fill = "#ffffff";
            let stroke = "#475569";
            let textColor = "#0f172a";
            let badgeText = "";

            if (isStart && isGoal) {
              fill = "#2563eb";
              stroke = "#dc2626";
              textColor = "#ffffff";
              badgeText = "S/G";
            } else if (isStart) {
              fill = "#2563eb";
              stroke = "#1d4ed8";
              textColor = "#ffffff";
              badgeText = "S";
            } else if (isGoal) {
              fill = "#dc2626";
              stroke = "#b91c1c";
              textColor = "#ffffff";
              badgeText = "G";
            } else if (isCurrentStep) {
              fill = "#f59e0b";
              stroke = "#b45309";
              textColor = "#ffffff";
              badgeText = `${exploredOrder ?? ""}`;
            } else if (isOnFinalPath) {
              fill = "#059669";
              stroke = "#047857";
              textColor = "#ffffff";
              badgeText = exploredOrder ? `${exploredOrder}` : "";
            } else if (isExplored) {
              fill = "#fef3c7";
              stroke = "#d97706";
              textColor = "#92400e";
              badgeText = `${exploredOrder}`;
            } else if (isFrontier) {
              fill = "#e0f2fe";
              stroke = "#0284c7";
              textColor = "#0369a1";
              badgeText = "?";
            }

            const offset = NODE_LABEL_OFFSETS[name] ?? {
              dx: 0,
              dy: -18,
              anchor: "middle",
            };
            const radius = isStart || isGoal || isCurrentStep ? 13 : 10.5;

            return (
              <g
                key={name}
                role="button"
                tabIndex={0}
                aria-label={`${name} at (${coords.x}, ${coords.y}) metres. Click to set as ${pickTarget === "start" ? "start" : "destination"}.`}
                onClick={() => onSelectNode(name)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectNode(name);
                  }
                }}
                onMouseEnter={() => setHoveredNode(name)}
                onMouseLeave={() => setHoveredNode((prev) => (prev === name ? null : prev))}
                className="cursor-pointer focus:outline-none"
              >
                {/* Outer focus/active halo */}
                {(isHovered || isCurrentStep) && (
                  <circle
                    cx={coords.x}
                    cy={coords.y}
                    r={radius + 6}
                    fill="none"
                    stroke={isCurrentStep ? "#d97706" : "#334155"}
                    strokeWidth="2"
                    strokeDasharray={isCurrentStep ? "none" : "3 3"}
                  />
                )}

                {isFrontier && !isStart && !isGoal && !isExplored && (
                  <circle
                    cx={coords.x}
                    cy={coords.y}
                    r={radius + 4}
                    fill="none"
                    stroke="#0284c7"
                    strokeWidth="1.5"
                    strokeDasharray="3 2"
                  />
                )}

                <circle
                  cx={coords.x}
                  cy={coords.y}
                  r={radius}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={isStart && isGoal ? 3.5 : 2.25}
                />

                {badgeText && (
                  <text
                    x={coords.x}
                    y={coords.y + 3.5}
                    textAnchor="middle"
                    fontSize={badgeText.length > 2 ? "8" : "9.5"}
                    fontFamily="var(--font-mono)"
                    fontWeight="600"
                    fill={textColor}
                  >
                    {badgeText}
                  </text>
                )}

                {/* Crisp high-contrast label with white halo */}
                <text
                  x={coords.x + offset.dx}
                  y={coords.y + offset.dy}
                  textAnchor={offset.anchor}
                  fontSize="11.5"
                  fontWeight={isStart || isGoal || isOnFinalPath ? "700" : "600"}
                  fill="#0f172a"
                  stroke="#f8fafc"
                  strokeWidth="3.5"
                  paintOrder="stroke"
                >
                  {name}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Live Coordinate & Heuristic Telemetry Strip */}
        <div className="px-4 py-2.5 border-t border-white/80 bg-white/55 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <span className="inline-flex items-center gap-1.5 text-slate-700">
              <span className="w-3 h-3 rounded-full bg-blue-600 inline-block" aria-hidden="true" />
              Start (S)
            </span>
            <span className="inline-flex items-center gap-1.5 text-slate-700">
              <span className="w-3 h-3 rounded-full bg-red-600 inline-block" aria-hidden="true" />
              Goal (G)
            </span>
            <span className="inline-flex items-center gap-1.5 text-slate-700">
              <span className="w-3 h-3 rounded-full bg-amber-100 border-2 border-amber-600 inline-block" aria-hidden="true" />
              Explored (#)
            </span>
            <span className="inline-flex items-center gap-1.5 text-slate-700">
              <span className="w-3 h-3 rounded-full bg-sky-100 border-2 border-sky-600 inline-block" aria-hidden="true" />
              Frontier (?)
            </span>
            <span className="inline-flex items-center gap-1.5 text-slate-700">
              <span className="w-4 h-1 rounded-full bg-emerald-600 inline-block" aria-hidden="true" />
              A* Shortest Path
            </span>
            {showBfsOverlay && (
              <span className="inline-flex items-center gap-1.5 text-slate-700">
                <span className="w-4 h-0.5 border-t-2 border-dashed border-violet-600 inline-block" aria-hidden="true" />
                BFS Path
              </span>
            )}
          </div>

          <div className="font-mono tabular-nums text-slate-700">
            {inspectedNode && inspectedCoords ? (
              <span>
                {inspectedNode} ({inspectedCoords.x}, {inspectedCoords.y})m
                {inspectedH !== null ? ` · h = ${inspectedH.toFixed(1)}m` : ""}
              </span>
            ) : (
              <span>Click any campus building node to assign {pickTarget}</span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
