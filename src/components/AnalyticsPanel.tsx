import React, { useMemo, useState } from "react";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  buildComparisonChartData,
  estimateWalkingSeconds,
  formatWalkingTime,
  type ComparisonMetricRow,
} from "../data/campusData";
import type { AStarResult } from "../algorithms/astar";
import type { BFSResult } from "../algorithms/bfs";

interface AnalyticsPanelProps {
  start: string;
  goal: string;
  astarResult: AStarResult | null;
  bfsResult: BFSResult | null;
  admissibilityViolations: string[];
  totalEdges: number;
}

type ChartScaleMode = "normalized" | "raw";

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: ComparisonMetricRow;
  }>;
}

const FrostedChartTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
}) => {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0].payload;
  return (
    <div className="liquid-glass rounded-xl px-3.5 py-2.5 text-xs space-y-1.5 border border-white/90 shadow-lg">
      <div className="font-semibold text-slate-900">{row.metric}</div>
      <div className="flex items-center justify-between gap-4 font-mono tabular-nums">
        <span className="text-emerald-800 font-medium">A* Search:</span>
        <span className="font-semibold text-emerald-950">
          {row.astarDisplay}
        </span>
      </div>
      <div className="flex items-center justify-between gap-4 font-mono tabular-nums">
        <span className="text-violet-800 font-medium">BFS:</span>
        <span className="font-semibold text-violet-950">{row.bfsDisplay}</span>
      </div>
    </div>
  );
};

export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({
  start,
  goal,
  astarResult,
  bfsResult,
  admissibilityViolations,
  totalEdges,
}) => {
  const [scaleMode, setScaleMode] = useState<ChartScaleMode>("raw");

  const hasRoute =
    astarResult !== null &&
    bfsResult !== null &&
    astarResult.path.length > 0 &&
    Number.isFinite(astarResult.totalDistance);

  const distanceSaved =
    hasRoute && bfsResult && astarResult
      ? Math.round((bfsResult.totalDistance - astarResult.totalDistance) * 100) /
        100
      : 0;

  const nodesSaved =
    hasRoute && bfsResult && astarResult
      ? bfsResult.exploredNodes.length - astarResult.exploredNodes.length
      : 0;

  const astarHops = astarResult ? Math.max(0, astarResult.path.length - 1) : 0;
  const bfsHops = bfsResult ? Math.max(0, bfsResult.path.length - 1) : 0;

  const chartData = useMemo(() => {
    if (!hasRoute || !astarResult || !bfsResult) return [];
    return buildComparisonChartData(
      astarResult.totalDistance,
      bfsResult.totalDistance,
      astarResult.exploredNodes.length,
      bfsResult.exploredNodes.length
    );
  }, [hasRoute, astarResult, bfsResult]);

  const astarDataKey =
    scaleMode === "normalized" ? "astarNormalized" : "astarRaw";
  const bfsDataKey = scaleMode === "normalized" ? "bfsNormalized" : "bfsRaw";

  return (
    <div className="space-y-6">
      {/* KPI Summary Strip */}
      <section
        aria-label="Route Summary Metrics"
        className="liquid-glass rounded-2xl p-5"
      >
        <div className="flex items-baseline justify-between gap-2 pb-3 border-b border-slate-900/8">
          <h2 className="text-base font-semibold text-slate-900">
            Optimal Route Summary
          </h2>
          {hasRoute && (
            <span className="text-xs font-medium text-emerald-800">
              Optimal A* Solution
            </span>
          )}
        </div>

        {hasRoute && astarResult ? (
          <>
            <div className="grid grid-cols-2 gap-3 py-3.5">
              <div className="liquid-glass-subtle rounded-xl px-3.5 py-2.5">
                <div className="text-xs text-slate-600 whitespace-nowrap">
                  Total Distance
                </div>
                <div
                  data-testid="astar-total-distance"
                  className="text-xl font-semibold font-mono tabular-nums text-slate-900 mt-0.5 whitespace-nowrap"
                >
                  {astarResult.totalDistance.toFixed(0)} m
                </div>
              </div>
              <div className="liquid-glass-subtle rounded-xl px-3.5 py-2.5">
                <div className="text-xs text-slate-600 whitespace-nowrap">
                  Est. Walking Time
                </div>
                <div className="text-xl font-semibold font-mono tabular-nums text-slate-900 mt-0.5 whitespace-nowrap">
                  {formatWalkingTime(astarResult.totalDistance)}
                </div>
              </div>
              <div className="liquid-glass-subtle rounded-xl px-3.5 py-2.5">
                <div className="text-xs text-slate-600 whitespace-nowrap">
                  Walkway Hops
                </div>
                <div className="text-xl font-semibold font-mono tabular-nums text-slate-900 mt-0.5 whitespace-nowrap">
                  {astarHops}
                </div>
              </div>
              <div className="liquid-glass-subtle rounded-xl px-3.5 py-2.5">
                <div className="text-xs text-slate-600 whitespace-nowrap">
                  Nodes Explored
                </div>
                <div className="text-xl font-semibold font-mono tabular-nums text-slate-900 mt-0.5 whitespace-nowrap">
                  {astarResult.exploredNodes.length}
                </div>
              </div>
            </div>

            {/* Ordered Route Breakdown */}
            <div className="pt-3.5 border-t border-slate-900/8 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800">
                  Ordered Route Breakdown
                </span>
                <span className="text-slate-600 font-mono tabular-nums">
                  {start} → {goal}
                </span>
              </div>

              {astarResult.segments.length > 0 ? (
                <ol className="divide-y divide-slate-900/6 liquid-glass-subtle rounded-xl overflow-hidden">
                  {astarResult.segments.map((seg, idx) => (
                    <li
                      key={`${seg.from}-${seg.to}`}
                      className="flex items-center justify-between gap-3 px-3.5 py-2 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="font-mono tabular-nums text-slate-500 w-4 shrink-0">
                          {idx + 1}.
                        </span>
                        <span className="font-medium text-slate-900 truncate">
                          {seg.from} → {seg.to}
                        </span>
                      </div>
                      <div className="font-mono tabular-nums text-slate-700 shrink-0">
                        +{seg.distance.toFixed(0)}m{" "}
                        <span className="text-slate-500">
                          ({seg.cumulativeDistance.toFixed(0)}m)
                        </span>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-xs text-slate-700 liquid-glass-subtle rounded-xl px-3.5 py-2.5">
                  Start and destination are both <strong>{start}</strong> — 0 m
                  walk required.
                </p>
              )}
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-600 py-4">
            Choose both a starting location and a destination to compute the
            shortest campus route.
          </p>
        )}
      </section>

      {/* Side-by-Side Comparison: Recharts BarChart + Table */}
      <section
        id="comparison-section"
        aria-label="A* vs BFS Comparison"
        className="liquid-glass rounded-2xl p-5 space-y-4 scroll-mt-20"
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              A* vs BFS Performance Comparison
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Distance, node expansions, and walking time across algorithms.
            </p>
          </div>

          {hasRoute && (
            <div
              className="inline-flex items-center p-0.5 rounded-lg bg-slate-900/6 border border-white/70"
              role="group"
              aria-label="Chart scale mode"
            >
              <button
                type="button"
                onClick={() => setScaleMode("raw")}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  scaleMode === "raw"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Raw Scale
              </button>
              <button
                type="button"
                onClick={() => setScaleMode("normalized")}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  scaleMode === "normalized"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Normalized %
              </button>
            </div>
          )}
        </div>

        {hasRoute && astarResult && bfsResult ? (
          <>
            {/* Recharts Visual Comparison Bar Chart */}
            <div
              data-testid="algorithm-comparison-chart"
              className="liquid-glass-subtle rounded-xl p-3 pt-4"
            >
              <div className="h-56 w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 12, left: -12, bottom: 4 }}
                    barGap={6}
                    barCategoryGap="24%"
                  >
                    <defs>
                      <linearGradient
                        id="astarBarGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.95} />
                        <stop offset="100%" stopColor="#059669" stopOpacity={0.82} />
                      </linearGradient>
                      <linearGradient
                        id="bfsBarGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.95} />
                        <stop offset="100%" stopColor="#6d28d9" stopOpacity={0.82} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="rgba(15, 23, 42, 0.08)"
                    />
                    <XAxis
                      dataKey="shortLabel"
                      tick={{ fontSize: 11, fill: "#334155", fontWeight: 500 }}
                      axisLine={{ stroke: "rgba(15, 23, 42, 0.12)" }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{
                        fontSize: 10,
                        fill: "#64748b",
                        fontFamily: "var(--font-mono)",
                      }}
                      axisLine={false}
                      tickLine={false}
                      domain={scaleMode === "normalized" ? [0, 115] : [0, "auto"]}
                      unit={scaleMode === "normalized" ? "%" : ""}
                    />
                    <Tooltip
                      content={<FrostedChartTooltip />}
                      cursor={{ fill: "rgba(148, 163, 184, 0.12)" }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: "11px", paddingTop: "6px" }}
                      iconType="circle"
                    />
                    <Bar
                      name="A* Search"
                      dataKey={astarDataKey}
                      fill="url(#astarBarGradient)"
                      radius={[6, 6, 0, 0]}
                      minPointSize={8}
                      isAnimationActive={false}
                    >
                      <LabelList
                        dataKey="astarRaw"
                        position="top"
                        style={{
                          fontSize: "10px",
                          fill: "#065f46",
                          fontFamily: "var(--font-mono)",
                          fontWeight: 600,
                        }}
                      />
                    </Bar>
                    <Bar
                      name="BFS (Uninformed)"
                      dataKey={bfsDataKey}
                      fill="url(#bfsBarGradient)"
                      radius={[6, 6, 0, 0]}
                      minPointSize={8}
                      isAnimationActive={false}
                    >
                      <LabelList
                        dataKey="bfsRaw"
                        position="top"
                        style={{
                          fontSize: "10px",
                          fill: "#5b21b6",
                          fontFamily: "var(--font-mono)",
                          fontWeight: 600,
                        }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Tabular Breakdown */}
            <div className="overflow-x-auto liquid-glass-subtle rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-900/8 text-slate-600 bg-white/40">
                    <th className="py-2.5 px-3.5 font-semibold">Metric</th>
                    <th className="py-2.5 px-3.5 font-semibold text-emerald-800">
                      A* Search
                    </th>
                    <th className="py-2.5 px-3.5 font-semibold text-violet-800">
                      BFS
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/6">
                  <tr>
                    <td className="py-2 px-3.5 font-medium text-slate-700">
                      Total Distance
                    </td>
                    <td className="py-2 px-3.5 font-mono tabular-nums font-semibold text-emerald-700">
                      {astarResult.totalDistance.toFixed(1)} m
                    </td>
                    <td className="py-2 px-3.5 font-mono tabular-nums font-semibold text-violet-700">
                      {bfsResult.totalDistance.toFixed(1)} m
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3.5 font-medium text-slate-700">
                      Nodes Expanded
                    </td>
                    <td className="py-2 px-3.5 font-mono tabular-nums text-slate-900">
                      {astarResult.exploredNodes.length}
                    </td>
                    <td className="py-2 px-3.5 font-mono tabular-nums text-slate-900">
                      {bfsResult.exploredNodes.length}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3.5 font-medium text-slate-700">
                      Est. Walk Time
                    </td>
                    <td className="py-2 px-3.5 font-mono tabular-nums text-slate-900">
                      {formatWalkingTime(astarResult.totalDistance)} (
                      {estimateWalkingSeconds(astarResult.totalDistance)}s)
                    </td>
                    <td className="py-2 px-3.5 font-mono tabular-nums text-slate-900">
                      {formatWalkingTime(bfsResult.totalDistance)} (
                      {estimateWalkingSeconds(bfsResult.totalDistance)}s)
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3.5 font-medium text-slate-700">
                      Edge Hops
                    </td>
                    <td className="py-2 px-3.5 font-mono tabular-nums text-slate-900">
                      {astarHops}
                    </td>
                    <td className="py-2 px-3.5 font-mono tabular-nums text-slate-900">
                      {bfsHops}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3.5 font-medium text-slate-700">
                      Selected Route
                    </td>
                    <td className="py-2 px-3.5 text-slate-800">
                      {astarResult.path.join(" → ")}
                    </td>
                    <td className="py-2 px-3.5 text-slate-800">
                      {bfsResult.path.join(" → ")}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Dynamic Algorithmic Insight */}
            <div className="liquid-glass-subtle rounded-xl p-3.5 space-y-1.5 text-xs text-slate-700">
              <div className="font-semibold text-slate-900">
                Algorithmic Insight
              </div>
              {distanceSaved > 0 ? (
                <p className="leading-relaxed">
                  A* saved{" "}
                  <strong className="font-mono text-emerald-700">
                    {distanceSaved.toFixed(1)} m
                  </strong>{" "}
                  over BFS on this route. Because BFS minimizes edge hops
                  without reading walkway weights, it took the{" "}
                  <span className="font-mono">{bfsHops}</span>-hop{" "}
                  <span className="font-mono">
                    {bfsResult.totalDistance.toFixed(0)}m
                  </span>{" "}
                  path, whereas A* balanced edge costs with Euclidean{" "}
                  <span className="font-mono">h(n)</span> to find the{" "}
                  <span className="font-mono">
                    {astarResult.totalDistance.toFixed(0)}m
                  </span>{" "}
                  corridor.
                </p>
              ) : nodesSaved > 0 ? (
                <p className="leading-relaxed">
                  Both algorithms matched at{" "}
                  <span className="font-mono">
                    {astarResult.totalDistance.toFixed(0)} m
                  </span>
                  , but A* directed its search toward the goal and expanded{" "}
                  <strong className="font-mono text-emerald-700">
                    {nodesSaved} fewer node{nodesSaved === 1 ? "" : "s"}
                  </strong>{" "}
                  than BFS ({astarResult.exploredNodes.length} vs{" "}
                  {bfsResult.exploredNodes.length}).
                </p>
              ) : (
                <p className="leading-relaxed">
                  On this route both A* and BFS found the{" "}
                  <span className="font-mono">
                    {astarResult.totalDistance.toFixed(0)} m
                  </span>{" "}
                  path. Try{" "}
                  <span className="font-medium text-slate-900">
                    Classroom Block → Auditorium
                  </span>{" "}
                  or{" "}
                  <span className="font-medium text-slate-900">
                    Main Gate → Admin Block
                  </span>{" "}
                  to see A* beat BFS in total walking distance.
                </p>
              )}
            </div>
          </>
        ) : (
          <p className="text-xs text-slate-600">
            Select a start and destination to compare A* Search against BFS.
          </p>
        )}
      </section>

      {/* Admissibility Verification Card */}
      <section
        id="admissibility-section"
        aria-label="Heuristic Admissibility Verification"
        className="liquid-glass rounded-2xl p-5 space-y-2.5 scroll-mt-20"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck
              className="w-4 h-4 text-emerald-700"
              aria-hidden="true"
            />
            <h2 className="text-sm font-semibold text-slate-900">
              Euclidean Heuristic Admissibility Check
            </h2>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-mono font-medium text-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
            {admissibilityViolations.length === 0
              ? `${totalEdges}/${totalEdges} edges valid`
              : `${admissibilityViolations.length} violations`}
          </span>
        </div>
        <p className="text-xs text-slate-700 leading-relaxed">
          Every walkway distance <span className="font-mono">w(u, v)</span> is
          verified{" "}
          <span className="font-mono">
            &ge; sqrt((x2-x1)&sup2; + (y2-y1)&sup2;)
          </span>
          . Because straight-line Euclidean distance never overestimates true
          path cost and obeys the triangle inequality,{" "}
          <span className="font-mono">h(n)</span> is both admissible and
          consistent — guaranteeing optimal shortest paths.
        </p>
      </section>
    </div>
  );
};
