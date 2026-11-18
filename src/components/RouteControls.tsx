import React from "react";
import { ArrowLeftRight, Navigation, RotateCcw } from "lucide-react";
import { PRESET_ROUTES } from "../data/campusData";

interface RouteControlsProps {
  locations: string[];
  start: string;
  goal: string;
  validationError: string | null;
  onStartChange: (value: string) => void;
  onGoalChange: (value: string) => void;
  onSwap: () => void;
  onCalculate: () => void;
  onReset: () => void;
  onSelectPreset: (start: string, goal: string) => void;
}

export const RouteControls: React.FC<RouteControlsProps> = ({
  locations,
  start,
  goal,
  validationError,
  onStartChange,
  onGoalChange,
  onSwap,
  onCalculate,
  onReset,
  onSelectPreset,
}) => {
  return (
    <section
      aria-label="Route Planner Controls"
      className="liquid-glass rounded-2xl p-4 space-y-3.5"
    >
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold text-slate-900">
          Route Configuration
        </h2>
        <button
          type="button"
          onClick={onSwap}
          aria-label="Swap starting location and destination"
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-slate-950 bg-white/60 hover:bg-white/90 border border-white/80 rounded-lg transition-colors cursor-pointer whitespace-nowrap shadow-2xs"
        >
          <ArrowLeftRight className="w-3.5 h-3.5" aria-hidden="true" />
          Swap
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
        <div>
          <label
            htmlFor="start-location-select"
            className="block text-xs font-medium text-slate-700 mb-1"
          >
            Starting Location
          </label>
          <select
            id="start-location-select"
            value={start}
            onChange={(e) => onStartChange(e.target.value)}
            className="w-full rounded-xl liquid-glass-input px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/25 focus:border-blue-600"
          >
            <option value="">Select starting location...</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="goal-location-select"
            className="block text-xs font-medium text-slate-700 mb-1"
          >
            Destination
          </label>
          <select
            id="goal-location-select"
            value={goal}
            onChange={(e) => onGoalChange(e.target.value)}
            className="w-full rounded-xl liquid-glass-input px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/25 focus:border-blue-600"
          >
            <option value="">Select destination...</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>
      </div>

      {validationError && (
        <div
          role="alert"
          className="rounded-xl border border-red-300/80 bg-red-50/85 backdrop-blur-md px-3 py-2 text-xs text-red-900"
        >
          {validationError}
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onCalculate}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-slate-900/95 hover:bg-slate-800 rounded-xl shadow-sm transition-colors whitespace-nowrap cursor-pointer"
        >
          <Navigation className="w-4 h-4" aria-hidden="true" />
          Find Shortest Path
        </button>
        <button
          type="button"
          onClick={onReset}
          aria-label="Reset route selection"
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 liquid-glass-subtle hover:bg-white/90 rounded-xl transition-colors whitespace-nowrap cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" aria-hidden="true" />
          Reset
        </button>
      </div>

      <div className="pt-3 border-t border-slate-900/8">
        <h3 className="text-xs font-semibold text-slate-700 mb-2">
          Quick Preset Routes
        </h3>
        <div className="grid grid-cols-2 gap-1.5">
          {PRESET_ROUTES.map((preset) => {
            const isActive = start === preset.start && goal === preset.goal;
            return (
              <button
                key={`${preset.start}-${preset.goal}`}
                type="button"
                title={preset.note}
                onClick={() => onSelectPreset(preset.start, preset.goal)}
                className={`text-left px-2.5 py-1.5 rounded-xl border text-xs transition-colors cursor-pointer ${
                  isActive
                    ? "bg-emerald-500/15 border-emerald-500/45 text-emerald-950 font-semibold shadow-2xs"
                    : "liquid-glass-subtle text-slate-700 hover:bg-white/85"
                }`}
              >
                <div className="truncate">
                  {preset.start} → {preset.goal}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
