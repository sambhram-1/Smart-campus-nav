import { CampusGraph } from "./graph";
import { buildRouteSegments, type RouteSegment } from "./astar";

export interface BFSResult {
  readonly path: string[];
  readonly totalDistance: number;
  readonly exploredNodes: string[];
  readonly segments: RouteSegment[];
  readonly executionTimeMs: number;
}

export function bfsSearchDetailed(
  graph: CampusGraph,
  start: string,
  goal: string
): BFSResult {
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
      segments: [],
      executionTimeMs: elapsedMs,
    };
  }

  const queue: Array<{ node: string; path: string[]; distance: number }> = [
    { node: startNode, path: [startNode], distance: 0 },
  ];
  const visited = new Set<string>([startNode]);
  const exploredOrder: string[] = [];

  let head = 0;
  while (head < queue.length) {
    const { node: current, path, distance } = queue[head++];
    exploredOrder.push(current);

    if (current === goalNode) {
      const elapsedMs = performance.now() - tStart;
      return {
        path,
        totalDistance: Math.round(distance * 100) / 100,
        exploredNodes: exploredOrder,
        segments: buildRouteSegments(graph, path),
        executionTimeMs: elapsedMs,
      };
    }

    for (const { neighbor, weight } of graph.getNeighbors(current)) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push({
          node: neighbor,
          path: [...path, neighbor],
          distance: distance + weight,
        });
      }
    }
  }

  const elapsedMs = performance.now() - tStart;
  return {
    path: [],
    totalDistance: Infinity,
    exploredNodes: exploredOrder,
    segments: [],
    executionTimeMs: elapsedMs,
  };
}
