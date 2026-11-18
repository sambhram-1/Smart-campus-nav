import React, { useEffect, useMemo, useState } from "react";
import { Play } from "lucide-react";
import { CampusGraph } from "./algorithms/graph";
import { astarSearchDetailed, type AStarResult } from "./algorithms/astar";
import { bfsSearchDetailed, type BFSResult } from "./algorithms/bfs";
import { CampusMap, type MapPickTarget } from "./components/CampusMap";
import { RouteControls } from "./components/RouteControls";
import { StepPlayer } from "./components/StepPlayer";
import { AnalyticsPanel } from "./components/AnalyticsPanel";

const DEFAULT_START = "Classroom Block";
const DEFAULT_GOAL = "Auditorium";

export default function App() {
  const graph = useMemo(() => new CampusGraph(), []);
  const locations = useMemo(() => graph.getSortedLocations(), [graph]);
  const admissibilityViolations = useMemo(
    () => graph.validateAdmissibility(),
    [graph]
  );

  const [start, setStart] = useState<string>(DEFAULT_START);
  const [goal, setGoal] = useState<string>(DEFAULT_GOAL);
  const [pickTarget, setPickTarget] = useState<MapPickTarget>("start");
  const [validationError, setValidationError] = useState<string | null>(null);

  const [astarResult, setAstarResult] = useState<AStarResult | null>(null);
  const [bfsResult, setBfsResult] = useState<BFSResult | null>(null);

  const [activeStepIndex, setActiveStepIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speedMs, setSpeedMs] = useState<number>(700);

  const [showBfsOverlay, setShowBfsOverlay] = useState<boolean>(true);
  const [showEdgeWeights, setShowEdgeWeights] = useState<boolean>(false);
  const [showHeuristicLine, setShowHeuristicLine] = useState<boolean>(true);

  const runSearch = (
    startVal: string,
    goalVal: string,
    startInStepMode = false
  ) => {
    setIsPlaying(false);
    if (!startVal.trim() || !goalVal.trim()) {
      setValidationError(
        "Please select both a starting location and a destination."
      );
      setAstarResult(null);
      setBfsResult(null);
      setActiveStepIndex(null);
      return;
    }

    try {
      const astar = astarSearchDetailed(graph, startVal, goalVal);
      const bfs = bfsSearchDetailed(graph, startVal, goalVal);
      setValidationError(null);
      setAstarResult(astar);
      setBfsResult(bfs);
      if (startInStepMode) {
        setActiveStepIndex(0);
        setIsPlaying(astar.steps.length > 1);
      } else {
        setActiveStepIndex(
          astar.steps.length > 0 ? astar.steps.length - 1 : null
        );
      }
    } catch (err) {
      setValidationError(
        err instanceof Error ? err.message : "Unable to compute route."
      );
      setAstarResult(null);
      setBfsResult(null);
      setActiveStepIndex(null);
    }
  };

  // Compute initial route on mount
  useEffect(() => {
    runSearch(DEFAULT_START, DEFAULT_GOAL, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Playback timer for step-by-step animation
  useEffect(() => {
    if (!isPlaying || !astarResult) return;
    const total = astarResult.steps.length;
    if (total <= 1) {
      setIsPlaying(false);
      return;
    }

    const timer = window.setInterval(() => {
      setActiveStepIndex((prev) => {
        const current = prev === null ? 0 : prev;
        if (current >= total - 1) {
          setIsPlaying(false);
          return total - 1;
        }
        return current + 1;
      });
    }, speedMs);

    return () => window.clearInterval(timer);
  }, [isPlaying, speedMs, astarResult]);

  const handleStartChange = (value: string) => {
    setStart(value);
    if (value && goal) {
      runSearch(value, goal, false);
    } else {
      setIsPlaying(false);
      setValidationError(null);
      setAstarResult(null);
      setBfsResult(null);
      setActiveStepIndex(null);
    }
  };

  const handleGoalChange = (value: string) => {
    setGoal(value);
    if (start && value) {
      runSearch(start, value, false);
    } else {
      setIsPlaying(false);
      setValidationError(null);
      setAstarResult(null);
      setBfsResult(null);
      setActiveStepIndex(null);
    }
  };

  const handleSwap = () => {
    const nextStart = goal;
    const nextGoal = start;
    setStart(nextStart);
    setGoal(nextGoal);
    if (nextStart && nextGoal) {
      runSearch(nextStart, nextGoal, false);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setStart("");
    setGoal("");
    setValidationError(null);
    setAstarResult(null);
    setBfsResult(null);
    setActiveStepIndex(null);
  };

  const handleSelectPreset = (presetStart: string, presetGoal: string) => {
    setStart(presetStart);
    setGoal(presetGoal);
    runSearch(presetStart, presetGoal, false);
  };

  const handleMapNodeClick = (nodeName: string) => {
    if (pickTarget === "start") {
      setStart(nodeName);
      setPickTarget("goal");
      if (goal) {
        runSearch(nodeName, goal, false);
      } else {
        setValidationError(null);
      }
    } else {
      setGoal(nodeName);
      setPickTarget("start");
      if (start) {
        runSearch(start, nodeName, false);
      } else {
        setValidationError(null);
      }
    }
  };

  const handleTogglePlay = () => {
    if (!astarResult || astarResult.steps.length === 0) return;
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }
    const lastIdx = astarResult.steps.length - 1;
    if (activeStepIndex === null || activeStepIndex >= lastIdx) {
      setActiveStepIndex(0);
    }
    setIsPlaying(true);
  };

  const handleHeaderAnimate = () => {
    if (!start || !goal) {
      setStart(DEFAULT_START);
      setGoal(DEFAULT_GOAL);
      runSearch(DEFAULT_START, DEFAULT_GOAL, true);
      return;
    }
    runSearch(start, goal, true);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen liquid-ambient-bg text-slate-900 flex flex-col">
      {/* Top Bar (3-zone contract: wordmark — concise nav links — 1 primary CTA) */}
      <header className="liquid-glass-header sticky top-0 z-20">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3 md:gap-8">
          <a
            href="#campus-map-section"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection("campus-map-section");
            }}
            className="text-base sm:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            Smart Campus Navigator
          </a>

          <nav
            aria-label="Primary sections"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-700"
          >
            <a
              href="#campus-map-section"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection("campus-map-section");
              }}
              className="hover:text-slate-950 transition-colors whitespace-nowrap shrink-0"
            >
              Campus Map
            </a>
            <a
              href="#step-trace-section"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection("step-trace-section");
              }}
              className="hover:text-slate-950 transition-colors whitespace-nowrap shrink-0"
            >
              Step Trace
            </a>
            <a
              href="#comparison-section"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection("comparison-section");
              }}
              className="hover:text-slate-950 transition-colors whitespace-nowrap shrink-0"
            >
              A* vs BFS
            </a>
            <a
              href="#admissibility-section"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection("admissibility-section");
              }}
              className="hover:text-slate-950 transition-colors whitespace-nowrap shrink-0"
            >
              Admissibility
            </a>
          </nav>

          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={handleHeaderAnimate}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900/95 hover:bg-slate-800 rounded-xl shadow-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" aria-hidden="true" />
              Animate Search
            </button>
          </div>
        </div>
      </header>

      {/* Main Two-Zone Simulation Workspace */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-6">
        <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 text-balance">
              Campus Pathfinding Simulator
            </h1>
            <p className="text-sm text-slate-600 mt-0.5">
              17 campus locations · 38 weighted walkways · Euclidean heuristic{" "}
              <span className="font-mono text-slate-800">
                f(n) = g(n) + h(n)
              </span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left / Main Stage (8 cols): Interactive Map + Step-by-Step Trace */}
          <div className="lg:col-span-8 min-w-0 space-y-6">
            <CampusMap
              graph={graph}
              start={start}
              goal={goal}
              astarResult={astarResult}
              bfsResult={bfsResult}
              activeStepIndex={activeStepIndex}
              pickTarget={pickTarget}
              onPickTargetChange={setPickTarget}
              onSelectNode={handleMapNodeClick}
              showBfsOverlay={showBfsOverlay}
              onToggleBfsOverlay={() => setShowBfsOverlay((v) => !v)}
              showEdgeWeights={showEdgeWeights}
              onToggleEdgeWeights={() => setShowEdgeWeights((v) => !v)}
              showHeuristicLine={showHeuristicLine}
              onToggleHeuristicLine={() => setShowHeuristicLine((v) => !v)}
            />

            <StepPlayer
              astarResult={astarResult}
              activeStepIndex={activeStepIndex}
              isPlaying={isPlaying}
              speedMs={speedMs}
              onTogglePlay={handleTogglePlay}
              onStepBack={() => {
                setIsPlaying(false);
                setActiveStepIndex((prev) => Math.max(0, (prev ?? 0) - 1));
              }}
              onStepForward={() => {
                if (!astarResult) return;
                setIsPlaying(false);
                setActiveStepIndex((prev) =>
                  Math.min(astarResult.steps.length - 1, (prev ?? 0) + 1)
                );
              }}
              onJumpToEnd={() => {
                if (!astarResult) return;
                setIsPlaying(false);
                setActiveStepIndex(Math.max(0, astarResult.steps.length - 1));
              }}
              onResetTrace={() => {
                setIsPlaying(false);
                setActiveStepIndex(0);
              }}
              onSpeedChange={setSpeedMs}
            />
          </div>

          {/* Right Deck (4 cols): Controls + Analytics & A* vs BFS Comparison */}
          <div className="lg:col-span-4 min-w-0 space-y-6">
            <RouteControls
              locations={locations}
              start={start}
              goal={goal}
              validationError={validationError}
              onStartChange={handleStartChange}
              onGoalChange={handleGoalChange}
              onSwap={handleSwap}
              onCalculate={() => runSearch(start, goal, false)}
              onReset={handleReset}
              onSelectPreset={handleSelectPreset}
            />

            <AnalyticsPanel
              start={start}
              goal={goal}
              astarResult={astarResult}
              bfsResult={bfsResult}
              admissibilityViolations={admissibilityViolations}
              totalEdges={graph.edges.length}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
