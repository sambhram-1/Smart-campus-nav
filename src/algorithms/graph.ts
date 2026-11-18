import {
  CAMPUS_EDGES,
  CAMPUS_NODES,
  NODE_ALIASES,
  type CampusEdgeDef,
  type Coordinates,
} from "../data/campusData";

export interface NeighborEdge {
  readonly neighbor: string;
  readonly weight: number;
}

export class CampusGraph {
  readonly nodes: Map<string, Coordinates>;
  readonly aliases: Map<string, string>;
  readonly adjacencyList: Map<string, NeighborEdge[]>;
  readonly edges: CampusEdgeDef[];

  constructor(
    nodes: Readonly<Record<string, Coordinates>> = CAMPUS_NODES,
    edges: readonly CampusEdgeDef[] = CAMPUS_EDGES,
    aliases: Readonly<Record<string, string>> = NODE_ALIASES
  ) {
    this.nodes = new Map(Object.entries(nodes));
    this.aliases = new Map(Object.entries(aliases));
    this.adjacencyList = new Map();
    this.edges = [];

    for (const node of this.nodes.keys()) {
      this.adjacencyList.set(node, []);
    }

    for (const edge of edges) {
      this.addEdge(edge.u, edge.v, edge.weight);
    }
  }

  resolveNode(name: string): string {
    const cleaned = name.trim();
    return this.aliases.get(cleaned) ?? cleaned;
  }

  hasNode(name: string): boolean {
    const resolved = this.resolveNode(name);
    return this.nodes.has(resolved);
  }

  addNode(name: string, coords: Coordinates): void {
    this.nodes.set(name, coords);
    if (!this.adjacencyList.has(name)) {
      this.adjacencyList.set(name, []);
    }
  }

  addEdge(u: string, v: string, weight: number): void {
    const uRes = this.resolveNode(u);
    const vRes = this.resolveNode(v);
    if (!this.nodes.has(uRes)) {
      throw new Error(`Unknown campus node: '${u}'`);
    }
    if (!this.nodes.has(vRes)) {
      throw new Error(`Unknown campus node: '${v}'`);
    }
    if (weight <= 0) {
      throw new Error(`Edge weight must be positive, got ${weight}`);
    }

    this.adjacencyList.get(uRes)!.push({ neighbor: vRes, weight });
    this.adjacencyList.get(vRes)!.push({ neighbor: uRes, weight });
    this.edges.push({ u: uRes, v: vRes, weight });
  }

  getNeighbors(node: string): readonly NeighborEdge[] {
    const resolved = this.resolveNode(node);
    if (!this.nodes.has(resolved)) {
      throw new Error(`Unknown campus node: '${node}'`);
    }
    return this.adjacencyList.get(resolved) ?? [];
  }

  getCoordinates(node: string): Coordinates {
    const resolved = this.resolveNode(node);
    const coords = this.nodes.get(resolved);
    if (!coords) {
      throw new Error(`Unknown campus node: '${node}'`);
    }
    return coords;
  }

  getEdgeWeight(u: string, v: string): number | null {
    const uRes = this.resolveNode(u);
    const vRes = this.resolveNode(v);
    const neighbors = this.adjacencyList.get(uRes) ?? [];
    for (const edge of neighbors) {
      if (edge.neighbor === vRes) {
        return edge.weight;
      }
    }
    return null;
  }

  /**
   * Straight-line Euclidean distance between two nodes:
   * h(n) = sqrt((x2 - x1)^2 + (y2 - y1)^2)
   */
  euclideanDistance(nodeA: string, nodeB: string): number {
    const a = this.getCoordinates(nodeA);
    const b = this.getCoordinates(nodeB);
    return Math.hypot(b.x - a.x, b.y - a.y);
  }

  /**
   * Verify that every edge weight is >= the Euclidean distance between its nodes.
   * Returns an array of violation descriptions (empty array if all edges are valid).
   */
  validateAdmissibility(): string[] {
    const violations: string[] = [];
    for (const { u, v, weight } of this.edges) {
      const straightLine = this.euclideanDistance(u, v);
      if (weight + 1e-9 < straightLine) {
        violations.push(
          `Edge (${u} <-> ${v}) weight ${weight.toFixed(2)}m is less than Euclidean distance ${straightLine.toFixed(2)}m`
        );
      }
    }
    return violations;
  }

  getSortedLocations(): string[] {
    return Array.from(this.nodes.keys()).sort((a, b) => a.localeCompare(b));
  }
}
