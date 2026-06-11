/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Play, Pause, SkipForward, RefreshCw } from "lucide-react";
import { motion } from "motion/react";

export interface Player {
  idx: number;
  playing: boolean;
  step: () => void;
  toggle: () => void;
  reset: () => void;
}

/** Steps through a precomputed trace: idx -1 = not started, then 0..length-1. */
export function usePlayer(length: number, speed = 1100): Player {
  const [idx, setIdx] = useState(-1);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    if (idx >= length - 1) { setPlaying(false); return; }
    const t = setTimeout(() => setIdx((i) => i + 1), speed);
    return () => clearTimeout(t);
  }, [playing, idx, length, speed]);

  return {
    idx,
    playing,
    step: () => { if (idx < length - 1) setIdx(idx + 1); },
    toggle: () => {
      if (!playing && idx >= length - 1) setIdx(-1);
      setPlaying(!playing);
    },
    reset: () => { setIdx(-1); setPlaying(false); },
  };
}

export function PlayerBar({ player, extra }: { player: Player; extra?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        onClick={player.toggle}
        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-mono font-semibold transition ${
          player.playing ? "bg-amber-500 text-slate-950 hover:bg-amber-400" : "bg-indigo-600 text-white hover:bg-indigo-500"
        }`}
      >
        {player.playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
        {player.playing ? "Pause" : "Run"}
      </button>
      <button
        onClick={player.step}
        disabled={player.playing}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 transition"
      >
        <SkipForward className="w-3.5 h-3.5" />
        Step
      </button>
      <button
        onClick={player.reset}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono font-semibold bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Reset
      </button>
      {extra}
    </div>
  );
}

export function Narration({ text }: { text: string }) {
  return (
    <motion.div
      key={text}
      initial={{ opacity: 0.4 }}
      animate={{ opacity: 1 }}
      className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5"
    >
      <p className="text-xs font-mono text-slate-300 leading-relaxed">{text}</p>
    </motion.div>
  );
}

export function LabInsight({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-lg px-3 py-2">
      <p className="text-[11px] font-mono text-indigo-200 leading-relaxed">{children}</p>
    </div>
  );
}

export function SubTabBar<T extends string>({ tabs, active, onSelect }: {
  tabs: { id: T; label: string; icon?: React.ReactNode }[];
  active: T;
  onSelect: (id: T) => void;
}) {
  return (
    <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1 overflow-x-auto scrollbar-none">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onSelect(t.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold whitespace-nowrap transition shrink-0 ${
            active === t.id ? "bg-slate-950 text-white border border-slate-700 shadow" : "text-slate-500 hover:text-slate-300"
          }`}
        >
          {t.icon}
          {t.label}
        </button>
      ))}
    </div>
  );
}
