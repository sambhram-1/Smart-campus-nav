import { CampusGraph } from "./graph";

export interface FrontierCandidate {
  readonly node: string;
  readonly gScore: number;
  readonly hScore: number;
  readonly fScore: number;
}

export interface ExplorationStep {
  readonly stepNumber: number;
  readonly node: string;
  readonly parent: string | null;
  readonly gScore: number;
  readonly hScore: number;
  readonly fScore: number;
  readonly closedSet: readonly string[];
  readonly openSet: readonly FrontierCandidate[];
}

export interface RouteSegment {
  readonly from: string;
  readonly to: string;
  readonly distance: number;
  readonly cumulativeDistance: number;
}

export interface AStarResult {
  readonly path: string[];
  readonly totalDistance: number;
  readonly exploredNodes: string[];
  readonly steps: ExplorationStep[];
  readonly segments: RouteSegment[];
  readonly executionTimeMs: number;
}

interface HeapItem {
  f: number;
  g: number;
  tie: number;
  node: string;
}

class MinHeap {
  private data: HeapItem[] = [];

  get size(): number {
    return this.data.length;
  }

  push(item: HeapItem): void {
    this.data.push(item);
    this.bubbleUp(this.data.length - 1);
  }

  pop(): HeapItem | undefined {
    if (this.data.length === 0) return undefined;
    const top = this.data[0];
    const last = this.data.pop()!;
    if (this.data.length > 0) {
      this.data[0] = last;
      this.sinkDown(0);
    }
    return top;
  }

  private bubbleUp(index: number): void {
    let idx = index;
    while (idx > 0) {
      const parentIdx = Math.floor((idx - 1) / 2);
      if (this.compare(this.data[idx], this.data[parentIdx]) < 0) {
        [this.data[idx], this.data[parentIdx]] = [this.data[parentIdx], this.data[idx]];
        idx = parentIdx;
      } else {
        break;
      }
    }
  }

  private sinkDown(index: number): void {
    let idx = index;
    const length = this.data.length;
    while (true) {
      const left = 2 * idx + 1;
      const right = 2 * idx + 2;
      let smallest = idx;

      if (left < length && this.compare(this.data[left], this.data[smallest]) < 0) {
        smallest = left;
      }
      if (right < length && this.compare(this.data[right], this.data[smallest]) < 0) {
        smallest = right;
      }
      if (smallest !== idx) {
        [this.data[idx], this.data[smallest]] = [this.data[smallest], this.data[idx]];
        idx = smallest;
      } else {
        break;
      }
    }
  }

  private compare(a: HeapItem, b: HeapItem): number {
    if (Math.abs(a.f - b.f) > 1e-9) return a.f - b.f;
    if (Math.abs(a.g - b.g) > 1e-9) return a.g - b.g;
    return a.tie - b.tie;
  }
}

export function buildRouteSegments(graph: CampusGraph, path: readonly string[]): RouteSegment[] {
  const segments: RouteSegment[] = [];
  let cumulative = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const from = path[i];
    const to = path[i + 1];
    const weight = graph.getEdgeWeight(from, to) ?? 0;
    cumulative += weight;
    segments.push({
      from,
      to,
      distance: weight,
      cumulativeDistance: Math.round(cumulative * 100) / 100,
    });
  }
  return segments;
}

function reconstructPath(cameFrom: Map<string, string | null>, current: string): string[] {
  const path: string[] = [];
  let node: string | null | undefined = current;
  while (node != null) {
    path.push(node);
    node = cameFrom.get(node);
  }
  path.reverse();
  return path;
}

export function astarSearchDetailed(
  graph: CampusGraph,
  start: string,
  goal: string
): AStarResult {
  if (!start || !start.trim()) {
    throw new Error("Starting location cannot be empty.");
  }
  if (!goal || !goal.trim()) {
    throw new Error("Destination location cannot be empty.");
  }

  const startNode = graph.resolveNode(start);
  const goalNode = graph.resolveNode(goal);

  if (!graph.hasNode(startNode)) {
    throw new Error(`Starting location '${start}' does not exist on the campus map.`);
  }
  if (!graph.hasNode(goalNode)) {
    throw new Error(`Destination location '${goal}' does not exist on the campus map.`);
  }

  const tStart = performance.now();

  if (startNode === goalNode) {
    const elapsedMs = performance.now() - tStart;
    return {
      path: [startNode],
      totalDistance: 0,
      exploredNodes: [startNode],
      steps: [
        {
          stepNumber: 1,
          node: startNode,
          parent: null,
          gScore: 0,
          hScore: 0,
          fScore: 0,
          closedSet: [startNode],
          openSet: [],
        },
      ],
      segments: [],
      executionTimeMs: elapsedMs,
    };
  }

  const hStart = graph.euclideanDistance(startNode, goalNode);
  const openHeap = new MinHeap();
  openHeap.push({ f: hStart, g: 0, tie: 0, node: startNode });
  let tieCounter = 0;

  const gScores = new Map<string, number>([[startNode, 0]]);
  const openCandidates = new Map<string, FrontierCandidate>([
    [startNode, { node: startNode, gScore: 0, hScore: hStart, fScore: hStart }],
  ]);
  const cameFrom = new Map<string, string | null>([[startNode, null]]);
  const closedSet = new Set<string>();
  const exploredOrder: string[] = [];
  const steps: ExplorationStep[] = [];

  while (openHeap.size > 0) {
    const item = openHeap.pop()!;
    const current = item.node;

    if (closedSet.has(current)) {
      continue;
    }

    closedSet.add(current);
    openCandidates.delete(current);
    exploredOrder.push(current);

    const hCurrent = graph.euclideanDistance(current, goalNode);

    if (current === goalNode) {
      steps.push({
        stepNumber: exploredOrder.length,
        node: current,
        parent: cameFrom.get(current) ?? null,
        gScore: item.g,
        hScore: hCurrent,
        fScore: item.f,
        closedSet: Array.from(closedSet),
        openSet: Array.from(openCandidates.values()).sort((a, b) => a.fScore - b.fScore),
      });

      const path = reconstructPath(cameFrom, current);
      const elapsedMs = performance.now() - tStart;
      return {
        path,
        totalDistance: Math.round(item.g * 100) / 100,
        exploredNodes: exploredOrder,
        steps,
        segments: buildRouteSegments(graph, path),
        executionTimeMs: elapsedMs,
      };
    }

    for (const { neighbor, weight } of graph.getNeighbors(current)) {
      if (closedSet.has(neighbor)) {
        continue;
      }

      const tentativeG = item.g + weight;
      const existingG = gScores.get(neighbor) ?? Infinity;
      if (tentativeG < existingG) {
        cameFrom.set(neighbor, current);
        gScores.set(neighbor, tentativeG);
        const hNeighbor = graph.euclideanDistance(neighbor, goalNode);
        const fNeighbor = tentativeG + hNeighbor;
        tieCounter += 1;
        openHeap.push({ f: fNeighbor, g: tentativeG, tie: tieCounter, node: neighbor });
        openCandidates.set(neighbor, {
          node: neighbor,
          gScore: tentativeG,
          hScore: hNeighbor,
          fScore: fNeighbor,
        });
      }
    }

    steps.push({
      stepNumber: exploredOrder.length,
      node: current,
      parent: cameFrom.get(current) ?? null,
      gScore: item.g,
      hScore: hCurrent,
      fScore: item.f,
      closedSet: Array.from(closedSet),
      openSet: Array.from(openCandidates.values()).sort((a, b) => a.fScore - b.fScore),
    });
  }

  const elapsedMs = performance.now() - tStart;
  return {
    path: [],
    totalDistance: Infinity,
    exploredNodes: exploredOrder,
    steps,
    segments: [],
    executionTimeMs: elapsedMs,
  };
}
