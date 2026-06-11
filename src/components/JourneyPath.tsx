/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { CheckCircle, Play, ArrowRight, Clock } from "lucide-react";
import { motion } from "motion/react";
import { JOURNEY_STAGES, JourneyStage } from "../journey";

interface JourneyPathProps {
  completedIds: Set<string>;
  onStartStage: (stage: JourneyStage) => void;
}

export default function JourneyPath({ completedIds, onStartStage }: JourneyPathProps) {
  const doneCount = JOURNEY_STAGES.filter((s) => completedIds.has(s.id)).length;
  const currentStage = JOURNEY_STAGES.find((s) => !completedIds.has(s.id)) ?? null;
  const total = JOURNEY_STAGES.length;

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">

      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="font-mono font-bold text-lg text-white">Learning Journey</h2>
        <p className="text-xs font-mono text-slate-500 mt-1">From Hello World to algorithms — one step at a time</p>

        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-indigo-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(doneCount / total) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <span className="text-xs font-mono text-slate-400 shrink-0">{doneCount}/{total} stages</span>
        </div>

        <div className="mt-4">
          {currentStage ? (
            <button
              onClick={() => onStartStage(currentStage)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-mono font-semibold transition"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              {doneCount === 0 ? "Start: " : "Continue: "}{currentStage.title}
            </button>
          ) : (
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-mono font-semibold">
              <CheckCircle className="w-3.5 h-3.5" />
              Journey complete!
            </span>
          )}
        </div>
      </div>

      {/* Stage map */}
      <div className="relative pl-5">
        <div className="absolute left-[9px] top-4 bottom-4 w-px bg-slate-800" />

        <div className="flex flex-col gap-3">
          {JOURNEY_STAGES.map((stage, idx) => {
            const done = completedIds.has(stage.id);
            const isCurrent = currentStage?.id === stage.id;
            return (
              <motion.div
                key={stage.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.05 }}
                className="relative"
              >
                {/* Node */}
                <div className="absolute -left-5 top-5">
                  {done ? (
                    <CheckCircle className="w-[18px] h-[18px] text-emerald-400 bg-slate-950 rounded-full" />
                  ) : isCurrent ? (
                    <span className="block w-[18px] h-[18px] rounded-full bg-slate-950 border-2 border-indigo-500 relative">
                      <span className="absolute inset-[3px] rounded-full bg-indigo-500 animate-pulse" />
                    </span>
                  ) : (
                    <span className="block w-[18px] h-[18px] rounded-full bg-slate-950 border-2 border-slate-700" />
                  )}
                </div>

                {/* Card */}
                <div
                  className={`ml-2 rounded-xl border p-4 transition ${
                    isCurrent
                      ? "bg-slate-900 border-indigo-500/50"
                      : done
                      ? "bg-slate-900 border-slate-800"
                      : "bg-slate-900/50 border-slate-800 opacity-70"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono text-slate-600">{idx + 1}.</span>
                        <h3 className={`text-sm font-mono font-bold ${done || isCurrent ? "text-white" : "text-slate-400"}`}>
                          {stage.title}
                        </h3>
                        {isCurrent && (
                          <span className="text-[9px] font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                            ← continue here
                          </span>
                        )}
                        {done && (
                          <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                            done
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-mono text-slate-500 mt-1">{stage.blurb}</p>
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-600 mt-2">
                        <Clock className="w-3 h-3" />
                        ~{stage.estMinutes} min
                      </span>
                    </div>

                    <button
                      onClick={() => onStartStage(stage)}
                      className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition ${
                        isCurrent
                          ? "bg-indigo-600 hover:bg-indigo-500 text-white"
                          : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                      }`}
                    >
                      {done ? "Review" : "Open"}
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
