import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  SkipForward,
} from "lucide-react";
import type { AStarResult } from "../algorithms/astar";

interface StepPlayerProps {
  astarResult: AStarResult | null;
  activeStepIndex: number | null;
  isPlaying: boolean;
  speedMs: number;
  onTogglePlay: () => void;
  onStepBack: () => void;
  onStepForward: () => void;
  onJumpToEnd: () => void;
  onResetTrace: () => void;
  onSpeedChange: (ms: number) => void;
}

export const StepPlayer: React.FC<StepPlayerProps> = ({
  astarResult,
  activeStepIndex,
  isPlaying,
  speedMs,
  onTogglePlay,
  onStepBack,
  onStepForward,
  onJumpToEnd,
  onResetTrace,
  onSpeedChange,
}) => {
  const steps = astarResult?.steps ?? [];
  const totalSteps = steps.length;
  const resolvedIndex =
    activeStepIndex !== null ? activeStepIndex : Math.max(0, totalSteps - 1);
  const currentStep = steps[resolvedIndex] ?? null;

  return (
    <section
      id="step-trace-section"
      aria-label="Step-by-Step A* Search Trace"
      className="liquid-glass rounded-2xl p-5 space-y-4 scroll-mt-20"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            A* Step-by-Step Exploration
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Inspect priority queue selections using{" "}
            <span className="font-mono text-slate-800">
              f(n) = g(n) + h(n)
            </span>
            .
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label
            htmlFor="step-speed-select"
            className="text-xs text-slate-700 whitespace-nowrap"
          >
            Speed
          </label>
          <select
            id="step-speed-select"
            value={speedMs}
            onChange={(e) => onSpeedChange(Number(e.target.value))}
            className="rounded-xl liquid-glass-input px-2.5 py-1 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
          >
            <option value={1200}>0.5x</option>
            <option value={700}>1.0x</option>
            <option value={350}>2.0x</option>
          </select>
        </div>
      </div>

      {/* Playback Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-900/8">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={!astarResult || totalSteps === 0}
            onClick={onTogglePlay}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-40 rounded-xl shadow-xs transition-colors whitespace-nowrap cursor-pointer"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5" aria-hidden="true" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" aria-hidden="true" />
                Animate A*
              </>
            )}
          </button>

          <button
            type="button"
            disabled={!astarResult || resolvedIndex <= 0}
            onClick={onStepBack}
            aria-label="Previous exploration step"
            className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-medium text-slate-700 liquid-glass-subtle hover:bg-white/90 disabled:opacity-40 rounded-xl transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
            Prev
          </button>

          <button
            type="button"
            disabled={!astarResult || resolvedIndex >= totalSteps - 1}
            onClick={onStepForward}
            aria-label="Next exploration step"
            className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-medium text-slate-700 liquid-glass-subtle hover:bg-white/90 disabled:opacity-40 rounded-xl transition-colors cursor-pointer"
          >
            Next
            <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>

          <button
            type="button"
            disabled={!astarResult || resolvedIndex >= totalSteps - 1}
            onClick={onJumpToEnd}
            aria-label="Jump to final path"
            className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-medium text-slate-700 liquid-glass-subtle hover:bg-white/90 disabled:opacity-40 rounded-xl transition-colors cursor-pointer"
          >
            <SkipForward className="w-3.5 h-3.5" aria-hidden="true" />
            Final
          </button>

          <button
            type="button"
            disabled={!astarResult || totalSteps === 0}
            onClick={onResetTrace}
            className="px-2.5 py-2 text-xs font-medium text-slate-700 liquid-glass-subtle hover:bg-white/90 disabled:opacity-40 rounded-xl transition-colors cursor-pointer"
          >
            Restart Trace
          </button>
        </div>

        <div className="text-xs font-mono tabular-nums text-slate-700">
          {totalSteps > 0
            ? `Step ${resolvedIndex + 1} of ${totalSteps}`
            : "No active trace"}
        </div>
      </div>

      {/* Step Details */}
      {currentStep ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          <div className="md:col-span-5 space-y-3 liquid-glass-subtle rounded-xl p-3.5">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs font-medium text-slate-600">
                Popped Node
              </span>
              <span className="text-sm font-semibold text-slate-900">
                {currentStep.node}
              </span>
            </div>

            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs font-medium text-slate-600">
                Predecessor
              </span>
              <span className="text-xs font-medium text-slate-800">
                {currentStep.parent ?? "Start Origin"}
              </span>
            </div>

            <div className="pt-2.5 border-t border-slate-900/8 grid grid-cols-3 gap-2 font-mono tabular-nums">
              <div>
                <div className="text-[11px] text-slate-600">g(n) actual</div>
                <div className="text-sm font-semibold text-slate-900">
                  {currentStep.gScore.toFixed(1)}m
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-600">h(n) heuristic</div>
                <div className="text-sm font-semibold text-sky-700">
                  {currentStep.hScore.toFixed(1)}m
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-600">f(n) = g + h</div>
                <div className="text-sm font-semibold text-amber-700">
                  {currentStep.fScore.toFixed(1)}m
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-7 space-y-2.5">
            <div className="text-xs font-medium text-slate-700">
              Open Set Priority Queue ({currentStep.openSet.length} candidates)
            </div>
            {currentStep.openSet.length > 0 ? (
              <div className="divide-y divide-slate-900/6 liquid-glass-subtle rounded-xl overflow-hidden">
                {currentStep.openSet.slice(0, 6).map((cand, idx) => (
                  <div
                    key={cand.node}
                    className={`flex items-center justify-between px-3 py-1.5 text-xs ${
                      idx === 0 ? "bg-sky-500/12 font-medium" : ""
                    }`}
                  >
                    <span className="text-slate-800 truncate">{cand.node}</span>
                    <span className="font-mono tabular-nums text-slate-600 shrink-0 ml-2">
                      g={cand.gScore.toFixed(0)} + h={cand.hScore.toFixed(1)} →{" "}
                      <strong className="text-slate-900">
                        f={cand.fScore.toFixed(1)}
                      </strong>
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-600 liquid-glass-subtle rounded-xl p-3">
                Open set empty — destination reached or search complete.
              </div>
            )}

            <div className="text-[11px] text-slate-600 leading-relaxed">
              <span className="font-medium text-slate-800">Closed Set:</span>{" "}
              {currentStep.closedSet.join(" · ")}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-xs text-slate-600">
          Select a starting location and destination to inspect A* node
          expansions.
        </p>
      )}
    </section>
  );
};
