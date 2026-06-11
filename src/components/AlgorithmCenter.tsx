/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { BarChart3, Search, GitFork, Shuffle, Layers, Zap, Sigma, Network } from "lucide-react";
import { motion } from "motion/react";
import { usePlayer, PlayerBar, Narration, LabInsight, SubTabBar } from "./labShared";

type SubTab = "sort" | "merge" | "quick" | "search" | "graph" | "dijkstra" | "dp";

/* ============================================================
   BUBBLE SORT
   ============================================================ */

interface Bar { id: number; val: number; }
interface SortStep { order: Bar[]; cmp: [number, number] | null; swapped: boolean; sortedFrom: number; cmps: number; swaps: number; note: string; }

function buildSortTrace(initial: Bar[]): SortStep[] {
  const steps: SortStep[] = [];
  const a = [...initial];
  const n = a.length;
  let cmps = 0, swaps = 0;
  for (let pass = 0; pass < n - 1; pass++) {
    let swappedInPass = false;
    for (let i = 0; i < n - 1 - pass; i++) {
      cmps++;
      const left = a[i].val, right = a[i + 1].val;
      if (left > right) {
        [a[i], a[i + 1]] = [a[i + 1], a[i]];
        swaps++;
        swappedInPass = true;
        steps.push({ order: [...a], cmp: [i, i + 1], swapped: true, sortedFrom: n - pass, cmps, swaps, note: `${left} > ${right} — SWAP. The bigger value bubbles one slot to the right.` });
      } else {
        steps.push({ order: [...a], cmp: [i, i + 1], swapped: false, sortedFrom: n - pass, cmps, swaps, note: `${left} ≤ ${right} — already in order, move on.` });
      }
    }
    steps.push({ order: [...a], cmp: null, swapped: false, sortedFrom: n - 1 - pass, cmps, swaps, note: `Pass ${pass + 1} done — the largest unsorted value (${a[n - 1 - pass].val}) is locked in place.` });
    if (!swappedInPass) break;
  }
  steps.push({ order: [...a], cmp: null, swapped: false, sortedFrom: 0, cmps, swaps, note: `Sorted! ${cmps} comparisons and ${swaps} swaps — that's why bubble sort is O(n²).` });
  return steps;
}

const randomBars = (): Bar[] => Array.from({ length: 8 }, (_, i) => ({ id: i, val: Math.floor(Math.random() * 90) + 10 }));

function SortTab() {
  const [bars, setBars] = useState<Bar[]>([
    { id: 0, val: 45 }, { id: 1, val: 12 }, { id: 2, val: 85 }, { id: 3, val: 32 },
    { id: 4, val: 56 }, { id: 5, val: 70 }, { id: 6, val: 22 }, { id: 7, val: 10 },
  ]);
  const trace = useMemo(() => buildSortTrace(bars), [bars]);
  const player = usePlayer(trace.length, 700);
  const s = player.idx >= 0 ? trace[player.idx] : null;
  const order = s ? s.order : bars;
  const sortedFrom = s ? s.sortedFrom : bars.length;

  return (
    <div className="flex flex-col gap-4">
      <PlayerBar
        player={player}
        extra={
          <button
            onClick={() => { player.reset(); setBars(randomBars()); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono font-semibold bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition ml-auto"
          >
            <Shuffle className="w-3.5 h-3.5" />
            Randomize
          </button>
        }
      />
      <Narration text={s ? s.note : "Bubble sort compares neighbors and swaps when they're out of order. Press Run — the biggest values 'bubble' to the right."} />
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
        <div className="flex items-end justify-center gap-2 h-[180px]">
          {order.map((bar, idx) => {
            const comparing = s?.cmp?.includes(idx) ?? false;
            const locked = idx >= sortedFrom;
            return (
              <motion.div key={bar.id} layout transition={{ type: "spring", stiffness: 400, damping: 30 }}
                style={{ height: `${(bar.val / 100) * 160 + 16}px` }}
                className={`w-10 rounded-t-lg flex items-end justify-center pb-1 font-mono text-[10px] font-bold border transition-colors ${
                  comparing ? s?.swapped ? "bg-pink-500/80 border-pink-400 text-white" : "bg-amber-500/80 border-amber-400 text-slate-950"
                  : locked ? "bg-emerald-600/70 border-emerald-500 text-white"
                  : "bg-indigo-600/60 border-indigo-500 text-indigo-100"
                }`}
              >
                {bar.val}
              </motion.div>
            );
          })}
        </div>
        <div className="flex justify-center gap-5 mt-4 text-[10px] font-mono">
          <span className="text-slate-500">comparisons: <strong className="text-white">{s?.cmps ?? 0}</strong></span>
          <span className="text-slate-500">swaps: <strong className="text-white">{s?.swaps ?? 0}</strong></span>
          <span className="text-slate-500">complexity: <strong className="text-pink-400">O(n²)</strong></span>
        </div>
      </div>
      <LabInsight>
        Watch the green zone grow from the right: after each pass, one more value is guaranteed final. n−1 passes × up to n−1 comparisons each = quadratic work.
      </LabInsight>
    </div>
  );
}

/* ============================================================
   MERGE SORT
   ============================================================ */

interface MergeStep {
  arr: number[];
  leftRange: [number, number] | null;
  rightRange: [number, number] | null;
  compareIdx: [number, number] | null;
  mergedRange: [number, number] | null;
  note: string;
}

function buildMergeTrace(initial: number[]): MergeStep[] {
  const steps: MergeStep[] = [];
  const arr = [...initial];

  function merge(a: number[], l: number, m: number, r: number) {
    const left = a.slice(l, m + 1);
    const right = a.slice(m + 1, r + 1);
    steps.push({
      arr: [...a], leftRange: [l, m], rightRange: [m + 1, r],
      compareIdx: null, mergedRange: null,
      note: `Merge [${left.join(", ")}] (blue) with [${right.join(", ")}] (pink). Pick the smaller front element each time.`,
    });
    let i = 0, j = 0, k = l;
    while (i < left.length && j < right.length) {
      steps.push({
        arr: [...a], leftRange: [l, m], rightRange: [m + 1, r],
        compareIdx: [l + i, m + 1 + j], mergedRange: null,
        note: `${left[i]} vs ${right[j]} — write ${left[i] <= right[j] ? left[i] : right[j]} (the smaller one).`,
      });
      if (left[i] <= right[j]) a[k++] = left[i++];
      else a[k++] = right[j++];
    }
    while (i < left.length) a[k++] = left[i++];
    while (j < right.length) a[k++] = right[j++];
    steps.push({
      arr: [...a], leftRange: null, rightRange: null,
      compareIdx: null, mergedRange: [l, r],
      note: `Merge complete for [${l}..${r}] → [${a.slice(l, r + 1).join(", ")}]. This region is now fully sorted.`,
    });
  }

  function mergeSort(a: number[], l: number, r: number) {
    if (l >= r) return;
    const m = Math.floor((l + r) / 2);
    mergeSort(a, l, m);
    mergeSort(a, m + 1, r);
    merge(a, l, m, r);
  }

  mergeSort(arr, 0, arr.length - 1);
  steps.push({
    arr: [...arr], leftRange: null, rightRange: null,
    compareIdx: null, mergedRange: [0, arr.length - 1],
    note: `Sorted! Merge sort is always O(n log n) — log n levels deep, each level does n total work. It's stable: equal elements keep their original order.`,
  });
  return steps;
}

function MergeSortTab() {
  const [vals, setVals] = useState([45, 12, 85, 32, 56, 70, 22]);
  const trace = useMemo(() => buildMergeTrace(vals), [vals]);
  const player = usePlayer(trace.length, 900);
  const s = player.idx >= 0 ? trace[player.idx] : null;
  const display = s ? s.arr : vals;

  return (
    <div className="flex flex-col gap-4">
      <PlayerBar
        player={player}
        extra={
          <button
            onClick={() => { player.reset(); setVals(Array.from({ length: 7 }, () => Math.floor(Math.random() * 90) + 10)); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono font-semibold bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition ml-auto"
          >
            <Shuffle className="w-3.5 h-3.5" />
            Randomize
          </button>
        }
      />
      <Narration text={s ? s.note : "Merge sort splits the array in half recursively until each piece has one element, then merges the pieces back in sorted order."} />
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
        <div className="flex items-end justify-center gap-2 h-[180px]">
          {display.map((val, idx) => {
            const inLeft = s?.leftRange ? idx >= s.leftRange[0] && idx <= s.leftRange[1] : false;
            const inRight = s?.rightRange ? idx >= s.rightRange[0] && idx <= s.rightRange[1] : false;
            const comparing = s?.compareIdx?.includes(idx) ?? false;
            const merged = s?.mergedRange ? idx >= s.mergedRange[0] && idx <= s.mergedRange[1] : false;
            return (
              <motion.div key={idx} layout transition={{ type: "spring", stiffness: 400, damping: 30 }}
                style={{ height: `${(val / 100) * 160 + 16}px` }}
                className={`w-10 rounded-t-lg flex items-end justify-center pb-1 font-mono text-[10px] font-bold border transition-colors ${
                  comparing ? "bg-amber-500/80 border-amber-400 text-slate-950"
                  : merged ? "bg-emerald-600/70 border-emerald-500 text-white"
                  : inLeft ? "bg-indigo-600/60 border-indigo-500 text-indigo-100"
                  : inRight ? "bg-pink-600/60 border-pink-500 text-pink-100"
                  : "bg-slate-800 border-slate-700 text-slate-400"
                }`}
              >
                {val}
              </motion.div>
            );
          })}
        </div>
        <div className="flex justify-center gap-4 mt-4 text-[10px] font-mono flex-wrap">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-indigo-600/60 border border-indigo-500 inline-block" />left half</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-pink-600/60 border border-pink-500 inline-block" />right half</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-500/80 border border-amber-400 inline-block" />comparing</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-600/70 border border-emerald-500 inline-block" />merged</span>
        </div>
      </div>
      <LabInsight>
        Unlike bubble sort, merge sort never does redundant work — every comparison makes progress. The trade-off is O(n) extra space for the temporary halves during merging.
      </LabInsight>
    </div>
  );
}

/* ============================================================
   QUICK SORT
   ============================================================ */

interface QuickStep {
  arr: number[];
  pivotIdx: number;
  jPtr: number;
  sortedSet: number[];
  phase: "pick" | "compare" | "swap" | "place" | "done";
  note: string;
}

function buildQuickTrace(initial: number[]): QuickStep[] {
  const steps: QuickStep[] = [];
  const arr = [...initial];
  const sorted: number[] = [];

  function partition(a: number[], lo: number, hi: number): number {
    const pivot = a[hi];
    let i = lo - 1;
    steps.push({
      arr: [...a], pivotIdx: hi, jPtr: lo, sortedSet: [...sorted],
      phase: "pick",
      note: `Pick pivot = ${pivot} (last of subarray [${lo}..${hi}]). Everything < ${pivot} goes left; everything ≥ goes right.`,
    });
    for (let j = lo; j < hi; j++) {
      steps.push({
        arr: [...a], pivotIdx: hi, jPtr: j, sortedSet: [...sorted],
        phase: "compare",
        note: `a[${j}] = ${a[j]} ${a[j] < pivot ? `< pivot ${pivot} → swap into left zone.` : `≥ pivot ${pivot} → leave in right zone.`}`,
      });
      if (a[j] < pivot) {
        i++;
        if (i !== j) {
          [a[i], a[j]] = [a[j], a[i]];
          steps.push({
            arr: [...a], pivotIdx: hi, jPtr: j, sortedSet: [...sorted],
            phase: "swap",
            note: `Swapped indices ${i} and ${j}. Left zone now ends at ${i}.`,
          });
        }
      }
    }
    [a[i + 1], a[hi]] = [a[hi], a[i + 1]];
    sorted.push(i + 1);
    steps.push({
      arr: [...a], pivotIdx: i + 1, jPtr: hi, sortedSet: [...sorted],
      phase: "place",
      note: `Pivot ${pivot} placed at index ${i + 1} — its FINAL position forever. Left < ${pivot} < right.`,
    });
    return i + 1;
  }

  function quickSort(a: number[], lo: number, hi: number) {
    if (lo > hi) return;
    if (lo === hi) { sorted.push(lo); return; }
    const p = partition(a, lo, hi);
    quickSort(a, lo, p - 1);
    quickSort(a, p + 1, hi);
  }

  quickSort(arr, 0, arr.length - 1);
  steps.push({
    arr: [...arr], pivotIdx: -1, jPtr: -1, sortedSet: [...sorted],
    phase: "done",
    note: `Sorted! Average O(n log n). Worst case O(n²) when the pivot is always the maximum — randomizing the pivot prevents this in practice.`,
  });
  return steps;
}

function QuickSortTab() {
  const [vals, setVals] = useState([64, 34, 25, 12, 22, 11, 90]);
  const trace = useMemo(() => buildQuickTrace(vals), [vals]);
  const player = usePlayer(trace.length, 900);
  const s = player.idx >= 0 ? trace[player.idx] : null;
  const display = s ? s.arr : vals;

  return (
    <div className="flex flex-col gap-4">
      <PlayerBar
        player={player}
        extra={
          <button
            onClick={() => { player.reset(); setVals(Array.from({ length: 7 }, () => Math.floor(Math.random() * 90) + 10)); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono font-semibold bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition ml-auto"
          >
            <Shuffle className="w-3.5 h-3.5" />
            Randomize
          </button>
        }
      />
      <Narration text={s ? s.note : "Quick sort picks a pivot, partitions everything smaller to its left and larger to its right, then recurses on both sides."} />
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
        <div className="flex items-end justify-center gap-2 h-[180px]">
          {display.map((val, idx) => {
            const isPivot = idx === s?.pivotIdx && !(s?.sortedSet.includes(idx));
            const isJ = idx === s?.jPtr && (s?.phase === "compare" || s?.phase === "swap");
            const isSorted = s?.sortedSet.includes(idx) ?? false;
            return (
              <motion.div key={idx} layout transition={{ type: "spring", stiffness: 400, damping: 30 }}
                style={{ height: `${(val / 100) * 160 + 16}px` }}
                className={`relative w-10 rounded-t-lg flex flex-col items-center justify-end pb-1 font-mono text-[10px] font-bold border transition-colors ${
                  isSorted ? "bg-emerald-600/70 border-emerald-500 text-white"
                  : isPivot ? "bg-amber-500/80 border-amber-400 text-slate-950"
                  : isJ ? "bg-sky-500/60 border-sky-400 text-white"
                  : "bg-indigo-600/60 border-indigo-500 text-indigo-100"
                }`}
              >
                {isPivot && <span className="absolute -top-5 text-[8px] font-mono text-amber-400">pivot</span>}
                {val}
              </motion.div>
            );
          })}
        </div>
        <div className="flex justify-center gap-4 mt-4 text-[10px] font-mono flex-wrap">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-500/80 border border-amber-400 inline-block" />pivot</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-sky-500/60 border border-sky-400 inline-block" />comparing (j)</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-600/70 border border-emerald-500 inline-block" />final position</span>
        </div>
      </div>
      <LabInsight>
        Each partition call places exactly one element in its permanent final position. After n partitions, all n elements are locked — no extra merging pass needed.
      </LabInsight>
    </div>
  );
}

/* ============================================================
   BINARY SEARCH
   ============================================================ */

const SEARCH_LIST = [5, 12, 18, 22, 35, 46, 58, 67, 80, 95];

interface SearchStep { l: number; r: number; m: number; found: boolean; note: string; }

function buildSearchTrace(target: number): SearchStep[] {
  const steps: SearchStep[] = [];
  let l = 0, r = SEARCH_LIST.length - 1;
  while (l <= r) {
    const m = Math.floor((l + r) / 2);
    if (SEARCH_LIST[m] === target) {
      steps.push({ l, r, m, found: true, note: `Middle of [${l}..${r}] is index ${m} → ${SEARCH_LIST[m]}. That IS the target — found in ${steps.length + 1} step${steps.length ? "s" : ""}!` });
      return steps;
    }
    if (SEARCH_LIST[m] < target) {
      steps.push({ l, r, m, found: false, note: `Middle of [${l}..${r}] is index ${m} → ${SEARCH_LIST[m]} < ${target}. Target must be RIGHT — throw away the whole left half.` });
      l = m + 1;
    } else {
      steps.push({ l, r, m, found: false, note: `Middle of [${l}..${r}] is index ${m} → ${SEARCH_LIST[m]} > ${target}. Target must be LEFT — throw away the whole right half.` });
      r = m - 1;
    }
  }
  steps.push({ l, r, m: -1, found: false, note: "Range collapsed — the target isn't in the list." });
  return steps;
}

function SearchTab() {
  const [target, setTarget] = useState(67);
  const trace = useMemo(() => buildSearchTrace(target), [target]);
  const player = usePlayer(trace.length, 1300);
  const s = player.idx >= 0 ? trace[player.idx] : null;
  const l = s?.l ?? 0, r = s?.r ?? SEARCH_LIST.length - 1, m = s?.m ?? -1;

  return (
    <div className="flex flex-col gap-4">
      <PlayerBar
        player={player}
        extra={
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-2 rounded-lg ml-auto">
            <span className="text-[10px] font-mono text-slate-500">target</span>
            <select value={target} onChange={(e) => { player.reset(); setTarget(Number(e.target.value)); }}
              className="bg-transparent text-xs font-mono text-indigo-300 outline-none cursor-pointer">
              {SEARCH_LIST.map((v) => <option key={v} value={v} className="bg-slate-900">{v}</option>)}
            </select>
          </div>
        }
      />
      <Narration text={s ? s.note : `Find ${target} in a sorted list by always checking the middle. Each step halves the remaining search space.`} />
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 flex flex-col items-center gap-4">
        <div className="flex flex-wrap gap-1.5 justify-center">
          {SEARCH_LIST.map((val, idx) => {
            const inRange = idx >= l && idx <= r;
            const isMid = idx === m;
            const isFound = isMid && s?.found;
            return (
              <div key={idx} className="flex flex-col items-center gap-1">
                <motion.div
                  animate={isMid ? { scale: 1.12, y: -3 } : { scale: 1, y: 0 }}
                  className={`w-11 h-11 rounded-lg border font-mono text-xs font-bold flex flex-col items-center justify-center transition-colors ${
                    isFound ? "bg-emerald-500/20 border-emerald-400 text-emerald-300"
                    : isMid ? "bg-amber-500/15 border-amber-400 text-amber-300"
                    : inRange ? "bg-slate-900 border-indigo-500/40 text-slate-200"
                    : "bg-slate-950 border-slate-800 text-slate-700 opacity-40"
                  }`}
                >
                  <span>{val}</span>
                  <span className="text-[7px] opacity-50">[{idx}]</span>
                </motion.div>
                <div className="h-4 flex gap-0.5 text-[8px] font-mono font-bold">
                  {idx === l && s && <span className="bg-sky-500/20 text-sky-300 border border-sky-500/40 px-1 rounded">L</span>}
                  {isMid && <span className="bg-amber-500 text-slate-950 px-1 rounded">M</span>}
                  {idx === r && s && <span className="bg-pink-500/20 text-pink-300 border border-pink-500/40 px-1 rounded">R</span>}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex gap-5 text-[10px] font-mono">
          <span className="text-slate-500">steps used: <strong className="text-white">{player.idx + 1 > 0 ? player.idx + 1 : 0}</strong></span>
          <span className="text-slate-500">linear worst case: <strong className="text-pink-400">10</strong></span>
          <span className="text-slate-500">binary worst case: <strong className="text-emerald-400">⌈log₂ 10⌉ = 4</strong></span>
        </div>
      </div>
      <LabInsight>
        The dimmed cells are PROVEN impossible — that's the power move. A million sorted items need at most 20 checks; a billion need 30. That's O(log n).
      </LabInsight>
    </div>
  );
}

/* ============================================================
   GRAPH — BFS / DFS
   ============================================================ */

const NODES: Record<string, { x: number; y: number }> = {
  A: { x: 200, y: 30 }, B: { x: 110, y: 115 }, C: { x: 290, y: 115 },
  D: { x: 55, y: 195 }, E: { x: 165, y: 195 }, F: { x: 290, y: 195 },
};
const EDGES: [string, string][] = [["A", "B"], ["A", "C"], ["B", "D"], ["B", "E"], ["C", "F"]];
const ADJ: Record<string, string[]> = { A: ["B", "C"], B: ["D", "E"], C: ["F"], D: [], E: [], F: [] };

interface GraphStep { current: string; visited: string[]; frontier: string[]; note: string; }

function buildGraphTrace(mode: "BFS" | "DFS"): GraphStep[] {
  const steps: GraphStep[] = [];
  const container = ["A"];
  const visited: string[] = [];
  while (container.length > 0) {
    const current = mode === "BFS" ? container.shift()! : container.pop()!;
    visited.push(current);
    const kids = mode === "BFS" ? ADJ[current] : [...ADJ[current]].reverse();
    const added: string[] = [];
    kids.forEach((k) => {
      if (!visited.includes(k) && !container.includes(k)) { container.push(k); added.push(k); }
    });
    const verb = mode === "BFS" ? "Dequeue" : "Pop";
    steps.push({
      current, visited: [...visited], frontier: [...container],
      note: `${verb} ${current} and visit it.${added.length ? ` ${mode === "BFS" ? "Enqueue" : "Push"} children: ${added.join(", ")}.` : " No new children."} Frontier: [${container.join(", ") || "empty"}].`,
    });
  }
  steps.push({ current: "", visited, frontier: [], note: `Done — visit order: ${visited.join(" → ")}. ${mode === "BFS" ? "Queue → level by level." : "Stack → deep before backtracking."}` });
  return steps;
}

function GraphTab() {
  const [mode, setMode] = useState<"BFS" | "DFS">("BFS");
  const trace = useMemo(() => buildGraphTrace(mode), [mode]);
  const player = usePlayer(trace.length, 1100);
  const s = player.idx >= 0 ? trace[player.idx] : null;

  return (
    <div className="flex flex-col gap-4">
      <PlayerBar
        player={player}
        extra={
          <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-0.5 gap-0.5 ml-auto">
            {(["BFS", "DFS"] as const).map((mo) => (
              <button key={mo} onClick={() => { player.reset(); setMode(mo); }}
                className={`px-3 py-1.5 rounded text-[10px] font-mono font-bold transition ${mode === mo ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-300"}`}>
                {mo} {mo === "BFS" ? "(queue)" : "(stack)"}
              </button>
            ))}
          </div>
        }
      />
      <Narration text={s ? s.note : `${mode} explores the graph using a ${mode === "BFS" ? "QUEUE — first in, first out, spreading level by level" : "STACK — last in, first out, diving deep before backtracking"}. Press Run.`} />
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-8 bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-center">
          <svg viewBox="0 0 400 230" className="w-full max-w-[440px]">
            {EDGES.map(([a, b]) => {
              const lit = s ? s.visited.includes(b) || s.frontier.includes(b) : false;
              return (
                <line key={a + b} x1={NODES[a].x} y1={NODES[a].y} x2={NODES[b].x} y2={NODES[b].y}
                  stroke={lit ? "#7ee787" : "#30363d"} strokeWidth={lit ? 2 : 1.2}
                  strokeDasharray={lit ? "none" : "4"} className="transition-all duration-500" />
              );
            })}
            {Object.entries(NODES).map(([name, pos]) => {
              const isCurrent = s?.current === name;
              const isVisited = s?.visited.includes(name) ?? false;
              const inFrontier = s?.frontier.includes(name) ?? false;
              return (
                <g key={name}>
                  <motion.circle cx={pos.x} cy={pos.y} r={16}
                    animate={isCurrent ? { r: 19 } : { r: 16 }}
                    fill={isCurrent ? "#d29922" : isVisited ? "#238636" : inFrontier ? "#1f242c" : "#161b22"}
                    stroke={isCurrent ? "#e3b341" : isVisited ? "#56d364" : inFrontier ? "#d29922" : "#484f58"}
                    strokeWidth={2} className="transition-colors duration-300" />
                  <text x={pos.x} y={pos.y + 4} textAnchor="middle" className="fill-white font-mono font-bold" fontSize={12}>{name}</text>
                </g>
              );
            })}
          </svg>
        </div>
        <div className="md:col-span-4 flex flex-col gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
            <span className="text-[9px] font-mono text-slate-600 uppercase block mb-2">frontier — {mode === "BFS" ? "queue (FIFO)" : "stack (LIFO)"}</span>
            <div className="flex gap-1.5 flex-wrap min-h-[26px]">
              {!s || s.frontier.length === 0
                ? <span className="text-[10px] font-mono text-slate-700 italic">empty</span>
                : s.frontier.map((f) => (
                    <motion.span key={f} layout initial={{ scale: 0.7 }} animate={{ scale: 1 }}
                      className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/40 rounded text-amber-300 text-xs font-mono font-bold">{f}</motion.span>
                  ))}
            </div>
            <div className="text-[9px] font-mono text-slate-600 mt-1.5">
              {mode === "BFS" ? "← removed from front · added at back →" : "← pushed and popped from the same end"}
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
            <span className="text-[9px] font-mono text-slate-600 uppercase block mb-2">visit order</span>
            <div className="flex gap-1 flex-wrap min-h-[26px] items-center">
              {!s || s.visited.length === 0
                ? <span className="text-[10px] font-mono text-slate-700 italic">none yet</span>
                : s.visited.map((v, i) => (
                    <React.Fragment key={v}>
                      {i > 0 && <span className="text-slate-700 text-[10px]">→</span>}
                      <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/40 rounded text-emerald-300 text-xs font-mono font-bold">{v}</span>
                    </React.Fragment>
                  ))}
            </div>
          </div>
          <LabInsight>
            Same graph, one swapped data structure: queue → BFS A B C D E F; stack → DFS A B D E C F. The container IS the algorithm.
          </LabInsight>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   DIJKSTRA'S SHORTEST PATH
   ============================================================ */

const DIJK_NODES: Record<string, { x: number; y: number }> = {
  A: { x: 200, y: 25 },
  B: { x: 75, y: 115 }, C: { x: 325, y: 115 },
  D: { x: 75, y: 215 }, E: { x: 325, y: 215 },
};
const DIJK_EDGES: { from: string; to: string; w: number }[] = [
  { from: "A", to: "B", w: 4 }, { from: "A", to: "C", w: 2 },
  { from: "B", to: "C", w: 3 }, { from: "B", to: "D", w: 5 },
  { from: "C", to: "E", w: 6 }, { from: "D", to: "E", w: 1 },
];

interface DijkStep {
  current: string;
  dist: Record<string, number>;
  visited: string[];
  frontier: string[];
  relaxed: string[];
  note: string;
}

function buildDijkstraTrace(start: string): DijkStep[] {
  const nodes = Object.keys(DIJK_NODES);
  const adj: Record<string, { to: string; w: number }[]> = {};
  nodes.forEach(n => { adj[n] = []; });
  DIJK_EDGES.forEach(e => {
    adj[e.from].push({ to: e.to, w: e.w });
    adj[e.to].push({ to: e.from, w: e.w });
  });

  const dist: Record<string, number> = {};
  nodes.forEach(n => { dist[n] = n === start ? 0 : Infinity; });
  const visited: string[] = [];
  const unvisited = new Set(nodes);
  const steps: DijkStep[] = [];

  steps.push({
    current: "", dist: { ...dist }, visited: [], frontier: [...unvisited], relaxed: [],
    note: `Initialize: dist[${start}] = 0, everything else = ∞. Always pick the unvisited node with the smallest known distance.`,
  });

  while (unvisited.size > 0) {
    let u = "";
    let minD = Infinity;
    unvisited.forEach(n => { if (dist[n] < minD) { minD = dist[n]; u = n; } });
    if (!u) break;

    unvisited.delete(u);
    visited.push(u);

    const relaxed: string[] = [];
    adj[u].forEach(({ to: v, w }) => {
      if (!unvisited.has(v)) return;
      const alt = dist[u] + w;
      if (alt < dist[v]) { dist[v] = alt; relaxed.push(v); }
    });

    steps.push({
      current: u, dist: { ...dist }, visited: [...visited],
      frontier: [...unvisited], relaxed,
      note: `Visit ${u} (locked dist = ${dist[u]}). Relax neighbors: ${
        relaxed.length ? relaxed.map(v => `${v} → ${dist[v]}`).join(", ") : "no improvements"
      }.`,
    });
  }

  steps.push({
    current: "", dist: { ...dist }, visited: [...visited], frontier: [], relaxed: [],
    note: `Complete! Shortest distances from ${start}: ${nodes.filter(n => n !== start).map(n => `${n} = ${dist[n]}`).join(", ")}.`,
  });
  return steps;
}

function DijkstraTab() {
  const [start, setStart] = useState("A");
  const trace = useMemo(() => buildDijkstraTrace(start), [start]);
  const player = usePlayer(trace.length, 1300);
  const s = player.idx >= 0 ? trace[player.idx] : null;

  return (
    <div className="flex flex-col gap-4">
      <PlayerBar
        player={player}
        extra={
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-2 rounded-lg ml-auto">
            <span className="text-[10px] font-mono text-slate-500">start</span>
            <select value={start} onChange={(e) => { player.reset(); setStart(e.target.value); }}
              className="bg-transparent text-xs font-mono text-indigo-300 outline-none cursor-pointer">
              {Object.keys(DIJK_NODES).map(n => <option key={n} value={n} className="bg-slate-900">{n}</option>)}
            </select>
          </div>
        }
      />
      <Narration text={s ? s.note : `Dijkstra's finds the shortest path from ${start} to every other node. Always process the closest unvisited node next. Press Run.`} />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-7 bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-center">
          <svg viewBox="0 0 400 255" className="w-full max-w-[420px]">
            {DIJK_EDGES.map(e => {
              const a = DIJK_NODES[e.from], b = DIJK_NODES[e.to];
              const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
              const isRelaxed = s?.current === e.from && s.relaxed.includes(e.to) || s?.current === e.to && s.relaxed.includes(e.from);
              const bothVisited = s ? s.visited.includes(e.from) && s.visited.includes(e.to) : false;
              return (
                <g key={e.from + e.to}>
                  <line x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                    stroke={isRelaxed ? "#d29922" : bothVisited ? "#238636" : "#30363d"}
                    strokeWidth={isRelaxed ? 2.5 : bothVisited ? 2 : 1.2}
                    className="transition-all duration-500" />
                  <rect x={mx - 9} y={my - 9} width={18} height={18} rx={4} fill="#0d1117" />
                  <text x={mx} y={my + 4} textAnchor="middle" fontSize={11} fill="#6e7681" fontFamily="ui-monospace,monospace" fontWeight="bold">{e.w}</text>
                </g>
              );
            })}
            {Object.entries(DIJK_NODES).map(([name, pos]) => {
              const isCurrent = s?.current === name;
              const isVisited = s?.visited.includes(name) ?? false;
              const d = s?.dist[name];
              return (
                <g key={name}>
                  <motion.circle cx={pos.x} cy={pos.y} r={22}
                    animate={{ r: isCurrent ? 25 : 22 }}
                    fill={isCurrent ? "#d29922" : isVisited ? "#238636" : "#161b22"}
                    stroke={isCurrent ? "#e3b341" : isVisited ? "#56d364" : "#444c56"}
                    strokeWidth={2} className="transition-colors duration-300" />
                  <text x={pos.x} y={pos.y + 5} textAnchor="middle" fontSize={13} fill="white" fontFamily="ui-monospace,monospace" fontWeight="bold">{name}</text>
                  <text x={pos.x} y={pos.y + 38} textAnchor="middle" fontSize={10}
                    fill={d !== undefined && d !== Infinity ? "#56d364" : "#30363d"}
                    fontFamily="ui-monospace,monospace" fontWeight="bold">
                    {d === undefined ? "" : d === Infinity ? "∞" : d}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="md:col-span-5 flex flex-col gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
            <span className="text-[9px] font-mono text-slate-600 uppercase block mb-2">distance table</span>
            {Object.keys(DIJK_NODES).map(n => {
              const d = s?.dist[n];
              const isVisited = s?.visited.includes(n) ?? false;
              const isCurrent = s?.current === n;
              return (
                <div key={n} className={`flex items-center justify-between py-1.5 border-b border-slate-800/50 last:border-0 text-xs font-mono ${
                  isCurrent ? "text-amber-300" : isVisited ? "text-emerald-300" : "text-slate-500"
                }`}>
                  <span className="font-bold">{n}</span>
                  <span>{d === undefined || d === Infinity ? "∞" : d}</span>
                  {isVisited && <span className="text-[8px] text-emerald-700 font-mono">locked</span>}
                  {isCurrent && <span className="text-[8px] text-amber-600 font-mono">visiting</span>}
                  {!isVisited && !isCurrent && <span className="text-[8px] text-slate-700 font-mono">pending</span>}
                </div>
              );
            })}
          </div>
          <LabInsight>
            The greedy choice is safe because all weights are positive — once a node's distance is finalized, no future shorter path can exist.
          </LabInsight>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   DYNAMIC PROGRAMMING — Fibonacci memoization
   ============================================================ */

interface DPStep {
  table: (number | null)[];
  current: number;
  deps: number[];
  note: string;
}

function buildDPTrace(n: number): DPStep[] {
  const steps: DPStep[] = [];
  const table: (number | null)[] = Array(n + 1).fill(null);

  table[0] = 0;
  steps.push({ table: [...table], current: 0, deps: [], note: "Base case: fib(0) = 0. Written to the table — no recomputation ever." });
  if (n >= 1) {
    table[1] = 1;
    steps.push({ table: [...table], current: 1, deps: [], note: "Base case: fib(1) = 1. Written to the table — no recomputation ever." });
  }

  for (let i = 2; i <= n; i++) {
    steps.push({
      table: [...table], current: i, deps: [i - 1, i - 2],
      note: `fib(${i}) = fib(${i - 1}) + fib(${i - 2}) = ${table[i - 1]} + ${table[i - 2]}. Read from the table in O(1).`,
    });
    table[i] = table[i - 1]! + table[i - 2]!;
    steps.push({
      table: [...table], current: i, deps: [],
      note: `Store fib(${i}) = ${table[i]}. Any future lookup for fib(${i}) is now O(1).`,
    });
  }

  const naiveCalls = Math.round(Math.pow(1.618, n));
  steps.push({
    table: [...table], current: -1, deps: [],
    note: `Done! fib(${n}) = ${table[n]}. DP: ${n + 1} operations. Naive recursion: ~${naiveCalls.toLocaleString()} calls. That's the difference between O(n) and O(2ⁿ).`,
  });
  return steps;
}

function DPTab() {
  const [n, setN] = useState(8);
  const trace = useMemo(() => buildDPTrace(n), [n]);
  const player = usePlayer(trace.length, 1000);
  const s = player.idx >= 0 ? trace[player.idx] : null;
  const table = s ? s.table : Array(n + 1).fill(null);

  return (
    <div className="flex flex-col gap-4">
      <PlayerBar
        player={player}
        extra={
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-2 rounded-lg ml-auto">
            <span className="text-[10px] font-mono text-slate-500">n =</span>
            <select value={n} onChange={(e) => { player.reset(); setN(Number(e.target.value)); }}
              className="bg-transparent text-xs font-mono text-indigo-300 outline-none cursor-pointer">
              {[5, 6, 7, 8, 9, 10].map(v => <option key={v} value={v} className="bg-slate-900">{v}</option>)}
            </select>
          </div>
        }
      />
      <Narration text={s ? s.note : `Compute fib(${n}) by building a table from the bottom up. Each value is computed exactly once and looked up — never recomputed. Press Run.`} />

      <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-wrap gap-2 justify-center">
          {table.map((val, idx) => {
            const isCurrent = idx === s?.current;
            const isDep = s?.deps.includes(idx) ?? false;
            const isSet = val !== null;
            return (
              <div key={idx} className="flex flex-col items-center gap-1">
                <motion.div
                  animate={isCurrent ? { scale: 1.1, y: -4 } : { scale: 1, y: 0 }}
                  className={`w-14 h-14 rounded-xl border font-mono flex flex-col items-center justify-center transition-colors ${
                    isCurrent ? "bg-amber-500/20 border-amber-400 text-amber-200"
                    : isDep ? "bg-indigo-500/20 border-indigo-400 text-indigo-200"
                    : isSet ? "bg-emerald-600/20 border-emerald-500/60 text-emerald-300"
                    : "bg-slate-900 border-slate-800 text-slate-700"
                  }`}
                >
                  <span className="text-[8px] text-slate-600">[{idx}]</span>
                  <span className="text-sm font-bold">{val !== null ? val : "?"}</span>
                </motion.div>
                {isDep && (
                  <motion.span initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                    className="text-[8px] font-mono text-indigo-400">dep</motion.span>
                )}
              </div>
            );
          })}
        </div>
        <div className="text-center mt-4 text-[10px] font-mono text-slate-600">
          recurrence: <span className="text-indigo-300">fib(n) = fib(n−1) + fib(n−2)</span>
          <span className="mx-3">·</span>
          base: <span className="text-emerald-300">fib(0)=0, fib(1)=1</span>
        </div>
      </div>

      <LabInsight>
        Naive recursion computes fib(n−2) exponentially many times — fib(8) alone spawns 67 redundant calls. DP collapses that exponential tree into a flat line by remembering results.
      </LabInsight>
    </div>
  );
}

/* ============================================================
   MAIN
   ============================================================ */

export default function AlgorithmCenter() {
  const [tab, setTab] = useState<SubTab>("sort");
  return (
    <div className="flex flex-col gap-4">
      <SubTabBar
        tabs={[
          { id: "sort",     label: "Bubble Sort",    icon: <BarChart3 className="w-3 h-3" /> },
          { id: "merge",    label: "Merge Sort",     icon: <Layers className="w-3 h-3" /> },
          { id: "quick",    label: "Quick Sort",     icon: <Zap className="w-3 h-3" /> },
          { id: "search",   label: "Binary Search",  icon: <Search className="w-3 h-3" /> },
          { id: "graph",    label: "BFS / DFS",      icon: <GitFork className="w-3 h-3" /> },
          { id: "dijkstra", label: "Dijkstra",       icon: <Network className="w-3 h-3" /> },
          { id: "dp",       label: "Dynamic Prog.",  icon: <Sigma className="w-3 h-3" /> },
        ]}
        active={tab}
        onSelect={setTab}
      />
      {tab === "sort"     && <SortTab />}
      {tab === "merge"    && <MergeSortTab />}
      {tab === "quick"    && <QuickSortTab />}
      {tab === "search"   && <SearchTab />}
      {tab === "graph"    && <GraphTab />}
      {tab === "dijkstra" && <DijkstraTab />}
      {tab === "dp"       && <DPTab />}
    </div>
  );
}
