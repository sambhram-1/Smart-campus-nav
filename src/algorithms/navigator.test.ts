import test from "node:test";
import assert from "node:assert/strict";
import { CampusGraph } from "./graph";
import { astarSearchDetailed } from "./astar";
import { bfsSearchDetailed } from "./bfs";
import { PRESET_ROUTES, buildComparisonChartData } from "../data/campusData";

const graph = new CampusGraph();

test("campus dataset has 17 nodes, 38 edges, and zero admissibility violations", () => {
  assert.equal(graph.nodes.size, 17);
  assert.equal(graph.edges.length, 38);
  const violations = graph.validateAdmissibility();
  assert.deepEqual(violations, []);
});

test("aliases resolve to canonical campus locations", () => {
  assert.equal(graph.resolveNode("Classroom"), "Classroom Block");
  assert.equal(graph.resolveNode("CS Block"), "Computer Science Block");
  assert.equal(graph.resolveNode("Admin"), "Admin Block");
});

test("A* finds optimal path for Classroom Block -> Auditorium (280m via Labs beats 295m direct)", () => {
  const astar = astarSearchDetailed(graph, "Classroom Block", "Auditorium");
  const bfs = bfsSearchDetailed(graph, "Classroom Block", "Auditorium");

  assert.deepEqual(astar.path, ["Classroom Block", "Labs", "Auditorium"]);
  assert.equal(astar.totalDistance, 280);

  // BFS takes the 1-hop 295m stepped walkway instead of the shorter 2-hop 280m corridor
  assert.deepEqual(bfs.path, ["Classroom Block", "Auditorium"]);
  assert.equal(bfs.totalDistance, 295);
  assert.ok(astar.totalDistance < bfs.totalDistance);
});

test("A* finds optimal path for Main Gate -> Admin Block (235m via Security Post beats 265m perimeter)", () => {
  const astar = astarSearchDetailed(graph, "Main Gate", "Admin Block");
  const bfs = bfsSearchDetailed(graph, "Main Gate", "Admin Block");

  assert.deepEqual(astar.path, ["Main Gate", "Security Post", "Admin Block"]);
  assert.equal(astar.totalDistance, 235);

  assert.deepEqual(bfs.path, ["Main Gate", "Admin Block"]);
  assert.equal(bfs.totalDistance, 265);
});

test("all preset routes return valid paths where A* distance <= BFS distance", () => {
  for (const preset of PRESET_ROUTES) {
    const astar = astarSearchDetailed(graph, preset.start, preset.goal);
    const bfs = bfsSearchDetailed(graph, preset.start, preset.goal);

    assert.equal(astar.path[0], preset.start);
    assert.equal(astar.path[astar.path.length - 1], preset.goal);
    assert.ok(astar.totalDistance <= bfs.totalDistance);
    assert.ok(astar.steps.length > 0);
    assert.equal(astar.segments.length, astar.path.length - 1);
  }
});

test("start === goal edge case returns 0m route with 1 node", () => {
  const astar = astarSearchDetailed(graph, "Library", "Library");
  const bfs = bfsSearchDetailed(graph, "Library", "Library");

  assert.deepEqual(astar.path, ["Library"]);
  assert.equal(astar.totalDistance, 0);
  assert.deepEqual(bfs.path, ["Library"]);
  assert.equal(bfs.totalDistance, 0);
});

test("invalid or empty locations throw descriptive errors", () => {
  assert.throws(() => astarSearchDetailed(graph, "", "Library"), /cannot be empty/i);
  assert.throws(() => astarSearchDetailed(graph, "Library", "   "), /cannot be empty/i);
  assert.throws(() => astarSearchDetailed(graph, "Helipad", "Library"), /does not exist/i);
  assert.throws(() => bfsSearchDetailed(graph, "Library", "Helipad"), /does not exist/i);
});

test("buildComparisonChartData computes distance, node expansion count, and estimated time for A* vs BFS", () => {
  const rows = buildComparisonChartData(280, 295, 3, 7);
  assert.equal(rows.length, 3);
  assert.equal(rows[0].metric, "Total Distance");
  assert.equal(rows[0].astarRaw, 280);
  assert.equal(rows[0].bfsRaw, 295);
  assert.equal(rows[1].metric, "Nodes Expanded");
  assert.equal(rows[1].astarRaw, 3);
  assert.equal(rows[1].bfsRaw, 7);
  assert.equal(rows[2].metric, "Est. Walk Time");
  assert.equal(rows[2].astarRaw, 207);
  assert.equal(rows[2].bfsRaw, 219);
});
