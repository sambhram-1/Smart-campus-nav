export interface Coordinates {
  readonly x: number;
  readonly y: number;
}

export interface CampusEdgeDef {
  readonly u: string;
  readonly v: string;
  readonly weight: number;
}

export interface PresetRoute {
  readonly start: string;
  readonly goal: string;
  readonly note: string;
}

/**
 * 17 Campus Locations: Name -> (x, y) coordinates in metres.
 * Coordinate & Distance Convention:
 * - Each node has (x, y) coordinates where 1 unit = 1 metre on the ground
 *   (mapping 1:1 to an 860x580 SVG coordinate space).
 * - Every edge weight (in metres) is strictly >= the straight-line Euclidean
 *   distance between its two endpoint nodes, guaranteeing h(n) is admissible.
 */
export const CAMPUS_NODES: Readonly<Record<string, Coordinates>> = {
  "Main Gate": { x: 65, y: 300 },
  "Security Post": { x: 165, y: 300 },
  "Parking": { x: 140, y: 460 },
  "Medical Center": { x: 220, y: 140 },
  "Admin Block": { x: 260, y: 220 },
  "Seminar Hall": { x: 300, y: 100 },
  "Student Center": { x: 320, y: 470 },
  "Central Lawn": { x: 350, y: 310 },
  "Library": { x: 420, y: 170 },
  "Canteen": { x: 450, y: 420 },
  "Classroom Block": { x: 520, y: 260 },
  "Sports Ground": { x: 560, y: 520 },
  "Labs": { x: 640, y: 310 },
  "Computer Science Block": { x: 670, y: 160 },
  "Hostel": { x: 740, y: 480 },
  "Auditorium": { x: 780, y: 290 },
  "Research Center": { x: 790, y: 120 },
};

/**
 * Optional aliases so queries like "Classroom" automatically map to "Classroom Block".
 */
export const NODE_ALIASES: Readonly<Record<string, string>> = {
  "Classroom": "Classroom Block",
  "CS Block": "Computer Science Block",
  "Admin": "Admin Block",
};

/**
 * Node label placement hints for crisp, overlap-free map typography.
 */
export const NODE_LABEL_OFFSETS: Readonly<Record<string, { dx: number; dy: number; anchor: "start" | "middle" | "end" }>> = {
  "Main Gate": { dx: 0, dy: -18, anchor: "middle" },
  "Security Post": { dx: 0, dy: 24, anchor: "middle" },
  "Parking": { dx: 0, dy: 24, anchor: "middle" },
  "Medical Center": { dx: -12, dy: -16, anchor: "middle" },
  "Admin Block": { dx: 0, dy: -18, anchor: "middle" },
  "Seminar Hall": { dx: 0, dy: -16, anchor: "middle" },
  "Student Center": { dx: 0, dy: 24, anchor: "middle" },
  "Central Lawn": { dx: 0, dy: -18, anchor: "middle" },
  "Library": { dx: 0, dy: -18, anchor: "middle" },
  "Canteen": { dx: 0, dy: 24, anchor: "middle" },
  "Classroom Block": { dx: 0, dy: -18, anchor: "middle" },
  "Sports Ground": { dx: 0, dy: 24, anchor: "middle" },
  "Labs": { dx: 0, dy: 24, anchor: "middle" },
  "Computer Science Block": { dx: 0, dy: -18, anchor: "middle" },
  "Hostel": { dx: 0, dy: 24, anchor: "middle" },
  "Auditorium": { dx: 12, dy: 24, anchor: "middle" },
  "Research Center": { dx: 0, dy: -16, anchor: "middle" },
};

/**
 * 38 Undirected Weighted Edges: (Node A, Node B, Distance in Metres).
 * Every weight is verified to be >= Euclidean distance between Node A and Node B.
 */
export const CAMPUS_EDGES: readonly CampusEdgeDef[] = [
  { u: "Main Gate", v: "Security Post", weight: 105.0 },
  { u: "Main Gate", v: "Parking", weight: 185.0 },
  { u: "Main Gate", v: "Medical Center", weight: 230.0 },
  { u: "Main Gate", v: "Admin Block", weight: 265.0 },
  { u: "Security Post", v: "Admin Block", weight: 130.0 },
  { u: "Security Post", v: "Central Lawn", weight: 195.0 },
  { u: "Security Post", v: "Parking", weight: 165.0 },
  { u: "Parking", v: "Student Center", weight: 185.0 },
  { u: "Medical Center", v: "Admin Block", weight: 95.0 },
  { u: "Medical Center", v: "Seminar Hall", weight: 100.0 },
  { u: "Admin Block", v: "Seminar Hall", weight: 130.0 },
  { u: "Admin Block", v: "Library", weight: 175.0 },
  { u: "Admin Block", v: "Central Lawn", weight: 135.0 },
  { u: "Seminar Hall", v: "Library", weight: 145.0 },
  { u: "Seminar Hall", v: "Computer Science Block", weight: 415.0 },
  { u: "Library", v: "Central Lawn", weight: 160.0 },
  { u: "Library", v: "Classroom Block", weight: 140.0 },
  { u: "Library", v: "Computer Science Block", weight: 260.0 },
  { u: "Central Lawn", v: "Classroom Block", weight: 185.0 },
  { u: "Central Lawn", v: "Canteen", weight: 155.0 },
  { u: "Central Lawn", v: "Student Center", weight: 165.0 },
  { u: "Student Center", v: "Canteen", weight: 145.0 },
  { u: "Student Center", v: "Sports Ground", weight: 250.0 },
  { u: "Classroom Block", v: "Canteen", weight: 180.0 },
  { u: "Classroom Block", v: "Computer Science Block", weight: 185.0 },
  { u: "Classroom Block", v: "Labs", weight: 135.0 },
  { u: "Classroom Block", v: "Auditorium", weight: 295.0 },
  { u: "Canteen", v: "Labs", weight: 225.0 },
  { u: "Canteen", v: "Sports Ground", weight: 155.0 },
  { u: "Canteen", v: "Hostel", weight: 305.0 },
  { u: "Computer Science Block", v: "Labs", weight: 160.0 },
  { u: "Computer Science Block", v: "Research Center", weight: 135.0 },
  { u: "Computer Science Block", v: "Auditorium", weight: 180.0 },
  { u: "Labs", v: "Auditorium", weight: 145.0 },
  { u: "Labs", v: "Hostel", weight: 205.0 },
  { u: "Research Center", v: "Auditorium", weight: 175.0 },
  { u: "Auditorium", v: "Hostel", weight: 200.0 },
  { u: "Sports Ground", v: "Hostel", weight: 190.0 },
];

/**
 * Preset routes highlighted in the UI for quick one-click testing.
 */
export const PRESET_ROUTES: readonly PresetRoute[] = [
  {
    start: "Main Gate",
    goal: "Library",
    note: "Shows inner walkway optimality vs perimeter road",
  },
  {
    start: "Library",
    goal: "Canteen",
    note: "Direct lawn crossing through Central Lawn",
  },
  {
    start: "Canteen",
    goal: "Computer Science Block",
    note: "Evaluates Classroom Block vs Labs corridor",
  },
  {
    start: "Classroom Block",
    goal: "Auditorium",
    note: "A* beats BFS: 280m via Labs vs 295m 1-hop direct",
  },
  {
    start: "Main Gate",
    goal: "Auditorium",
    note: "Cross-campus route comparing A* vs BFS exploration",
  },
  {
    start: "Parking",
    goal: "Research Center",
    note: "Diagonal south-west to north-east traversal",
  },
];

/**
 * Average pedestrian walking speed in m/s (~1.35 m/s = ~4.86 km/h).
 */
export const WALKING_SPEED_MPS = 1.35;

export function estimateWalkingSeconds(distanceMetres: number): number {
  if (!Number.isFinite(distanceMetres) || distanceMetres < 0) return 0;
  return Math.round(distanceMetres / WALKING_SPEED_MPS);
}

export function formatWalkingTime(distanceMetres: number): string {
  if (!Number.isFinite(distanceMetres) || distanceMetres < 0) return "Unreachable";
  if (distanceMetres === 0) return "0s";
  const totalSeconds = estimateWalkingSeconds(distanceMetres);
  if (totalSeconds < 60) {
    return `${totalSeconds}s`;
  }
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return seconds === 0 ? `${minutes}m` : `${minutes}m ${seconds}s`;
}

export interface ComparisonMetricRow {
  readonly metric: string;
  readonly shortLabel: string;
  readonly unit: string;
  readonly astarRaw: number;
  readonly bfsRaw: number;
  readonly astarNormalized: number;
  readonly bfsNormalized: number;
  readonly astarDisplay: string;
  readonly bfsDisplay: string;
}

export function buildComparisonChartData(
  astarDistance: number,
  bfsDistance: number,
  astarNodes: number,
  bfsNodes: number
): ComparisonMetricRow[] {
  const astarTimeSec = estimateWalkingSeconds(astarDistance);
  const bfsTimeSec = estimateWalkingSeconds(bfsDistance);

  const distMax = Math.max(astarDistance, bfsDistance, 1);
  const nodesMax = Math.max(astarNodes, bfsNodes, 1);
  const timeMax = Math.max(astarTimeSec, bfsTimeSec, 1);

  return [
    {
      metric: "Total Distance",
      shortLabel: "Distance (m)",
      unit: "m",
      astarRaw: Math.round(astarDistance * 10) / 10,
      bfsRaw: Math.round(bfsDistance * 10) / 10,
      astarNormalized: Math.round((astarDistance / distMax) * 100),
      bfsNormalized: Math.round((bfsDistance / distMax) * 100),
      astarDisplay: `${Math.round(astarDistance)}m`,
      bfsDisplay: `${Math.round(bfsDistance)}m`,
    },
    {
      metric: "Nodes Expanded",
      shortLabel: "Nodes Expanded",
      unit: "nodes",
      astarRaw: astarNodes,
      bfsRaw: bfsNodes,
      astarNormalized: Math.round((astarNodes / nodesMax) * 100),
      bfsNormalized: Math.round((bfsNodes / nodesMax) * 100),
      astarDisplay: `${astarNodes}`,
      bfsDisplay: `${bfsNodes}`,
    },
    {
      metric: "Est. Walk Time",
      shortLabel: "Est. Time (s)",
      unit: "s",
      astarRaw: astarTimeSec,
      bfsRaw: bfsTimeSec,
      astarNormalized: Math.round((astarTimeSec / timeMax) * 100),
      bfsNormalized: Math.round((bfsTimeSec / timeMax) * 100),
      astarDisplay: `${astarTimeSec}s (${formatWalkingTime(astarDistance)})`,
      bfsDisplay: `${bfsTimeSec}s (${formatWalkingTime(bfsDistance)})`,
    },
  ];
}
