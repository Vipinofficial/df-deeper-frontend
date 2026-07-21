/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from "react";
import { CheckCircle2, Circle, Clock, TrendingUp, User } from "lucide-react";
import type { CentralUser } from "@devfrogs/auth-ui";
import { JOURNEY_STAGES } from "../journey";

interface Props {
  user: CentralUser;
  /** Authoritative once loaded (App.tsx fetches GET /api/journey/progress); null while loading/offline. */
  remoteCompletedIds: string[] | null;
  /** Optimistic local cache (localStorage) — used only as a fallback while remote is unresolved. */
  localCompletedIds: Set<string>;
  syncing: boolean;
  syncError: string | null;
}

export default function UserDashboard({ user, remoteCompletedIds, localCompletedIds, syncing, syncError }: Props) {
  // Backend is the source of truth once loaded; fall back to the local optimistic cache
  // (e.g. while the request is in flight, or if it failed).
  const doneIds = useMemo(
    () => new Set(remoteCompletedIds ?? Array.from(localCompletedIds)),
    [remoteCompletedIds, localCompletedIds]
  );

  const total = JOURNEY_STAGES.length;
  const doneCount = JOURNEY_STAGES.filter((s) => doneIds.has(s.id)).length;
  const pct = total === 0 ? 0 : Math.round((doneCount / total) * 100);
  const minutesRemaining = JOURNEY_STAGES.filter((s) => !doneIds.has(s.id)).reduce((sum, s) => sum + s.estMinutes, 0);

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      {/* Profile header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shrink-0">
          <User className="w-5 h-5 text-indigo-400" />
        </div>
        <div className="min-w-0">
          <h2 className="font-mono font-bold text-lg text-white truncate">{user.name}</h2>
          <p className="text-xs font-mono text-slate-500 truncate">{user.email}</p>
        </div>
      </div>

      {syncError && (
        <div className="text-xs font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-2.5">
          {syncError}
        </div>
      )}

      {/* Progress summary */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h3 className="font-mono font-bold text-sm text-white">Journey Progress</h3>
          {syncing && <span className="text-[10px] font-mono text-slate-600">syncing…</span>}
        </div>

        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-center">
            <div className="text-xl font-mono font-bold text-white">
              {doneCount}/{total}
            </div>
            <div className="text-[10px] font-mono text-slate-500 mt-1">stages done</div>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-center">
            <div className="text-xl font-mono font-bold text-emerald-400">{pct}%</div>
            <div className="text-[10px] font-mono text-slate-500 mt-1">complete</div>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-center">
            <div className="text-xl font-mono font-bold text-indigo-400">~{minutesRemaining}m</div>
            <div className="text-[10px] font-mono text-slate-500 mt-1">remaining</div>
          </div>
        </div>

        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Stage checklist */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h3 className="font-mono font-bold text-sm text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-slate-500" />
          Stage Checklist
        </h3>
        <div className="flex flex-col gap-2">
          {JOURNEY_STAGES.map((stage, idx) => {
            const done = doneIds.has(stage.id);
            return (
              <div
                key={stage.id}
                className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 ${
                  done ? "border-emerald-500/20 bg-emerald-500/5" : "border-slate-800 bg-slate-950/40"
                }`}
              >
                {done ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-700 shrink-0" />
                )}
                <span className="text-[10px] font-mono text-slate-600 shrink-0">{idx + 1}.</span>
                <span className={`text-xs font-mono flex-1 truncate ${done ? "text-slate-300" : "text-slate-500"}`}>
                  {stage.title}
                </span>
                <span className="flex items-center gap-1 text-[10px] font-mono text-slate-600 shrink-0">
                  <Clock className="w-3 h-3" />
                  {stage.estMinutes}m
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
