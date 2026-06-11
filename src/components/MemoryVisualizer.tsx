/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, SkipForward, RefreshCw, Terminal, Sparkles, HelpCircle, FileCode, Flag, CheckCircle, Pencil, Check } from "lucide-react";
import { StackVariable, HeapObject } from "../types";
import { JourneyStage, WorkspaceTab, MemorySubTab } from "../journey";
import { Language, traceProgram, getLanguageMeta } from "../languages";
import { motion, AnimatePresence } from "motion/react";

import PythonPipelineLab from "./PythonPipelineLab";
import MemoryModelLab from "./MemoryModelLab";
import DataStructureLab from "./DataStructureLab";
import OOPFactoryLab from "./OOPFactoryLab";
import AlgorithmCenter from "./AlgorithmCenter";
import LowLevelLab from "./LowLevelLab";
import SystemNetworkLab from "./SystemNetworkLab";

interface MemoryVisualizerProps {
  code: string;
  setCode: (code: string) => void;
  language?: Language;
  onStateChange?: (stack: StackVariable[], heap: { [addr: string]: HeapObject }, line: number) => void;
  externalLine?: number;
  isCollaborative?: boolean;
  initialWorkspaceTab?: WorkspaceTab;
  initialMemorySubTab?: MemorySubTab;
  journeyStage?: JourneyStage | null;
  stageCompleted?: boolean;
  onStageComplete?: (stageId: string) => void;
}

type LearningMode = "beginner" | "intermediate" | "advanced" | "expert";

const WORKSPACE_TABS: { id: WorkspaceTab; label: string }[] = [
  { id: "debugger", label: "Debugger" },
  { id: "pvm",      label: "PVM Pipeline" },
  { id: "memory",   label: "Memory Model" },
  { id: "data",     label: "Data Structures" },
  { id: "oop",      label: "OOP Factory" },
  { id: "algo",     label: "Algorithms" },
  { id: "cpu",      label: "CPU / ALU" },
  { id: "os",       label: "OS & Network" },
];

export default function MemoryVisualizer({
  code,
  setCode,
  language = "python",
  onStateChange,
  externalLine = 0,
  isCollaborative = false,
  initialWorkspaceTab,
  initialMemorySubTab,
  journeyStage = null,
  stageCompleted = false,
  onStageComplete,
}: MemoryVisualizerProps) {
  const [lines, setLines] = useState<string[]>([]);
  const [currentLine, setCurrentLine] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1200);
  const [stack, setStack] = useState<StackVariable[]>([]);
  const [heap, setHeap] = useState<{ [address: string]: HeapObject }>({});
  const [stdout, setStdout] = useState<string[]>([]);
  const [explanation, setExplanation] = useState<string>("Click Run or Step to start tracing execution.");
  const [hoveredVar, setHoveredVar] = useState<string | null>(null);
  const [hoveredHeapAddr, setHoveredHeapAddr] = useState<string | null>(null);
  const [explainAiLoading, setExplainAiLoading] = useState<boolean>(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<WorkspaceTab>(initialWorkspaceTab ?? "debugger");
  const [learningMode, setLearningMode] = useState<LearningMode>("intermediate");
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const [connections, setConnections] = useState<{ fromId: string; toId: string }[]>([]);

  const stepsInfo = useRef<ReturnType<typeof traceProgram>>([]);

  useEffect(() => {
    setLines(code.split("\n").map((l) => l.trim()));
    // Any code or language change invalidates the precomputed trajectory.
    stepsInfo.current = [];
    setCurrentLine(-1);
    setStack([]);
    setHeap({});
    setStdout([]);
    setIsPlaying(false);
  }, [code, language]);

  useEffect(() => {
    if (externalLine !== undefined && isCollaborative) {
      setCurrentLine(externalLine);
    }
  }, [externalLine, isCollaborative]);

  useEffect(() => {
    const newConns: { fromId: string; toId: string }[] = [];
    stack.forEach((v) => {
      if (v.isPointer && v.pointsTo) {
        newConns.push({ fromId: `stack-${v.name}-${v.scope}`, toId: `heap-${v.pointsTo}` });
      }
    });
    setConnections(newConns);
  }, [stack, heap]);

  const resetDebugger = () => {
    setCurrentLine(-1);
    setStack([]);
    setHeap({});
    setStdout([]);
    setExplanation("Debugger reset. Ready to trace from the first line.");
    setIsPlaying(false);
    setAiExplanation(null);
    stepsInfo.current = [];
  };

  const stepForward = () => {
    if (stepsInfo.current.length === 0) {
      stepsInfo.current = traceProgram(language, code);
    }
    const nextLine = currentLine + 1;
    if (nextLine >= lines.length) {
      setIsPlaying(false);
      setExplanation("Simulation complete — review the final stack and heap layout above.");
      if (journeyStage?.task.autoCompleteOnSimEnd && !stageCompleted) {
        onStageComplete?.(journeyStage.id);
      }
      return;
    }
    const nextStep = stepsInfo.current[nextLine];
    if (nextStep) {
      setCurrentLine(nextLine);
      setStack(nextStep.stack);
      setHeap(nextStep.heap);
      setStdout(nextStep.stdout);
      setExplanation(nextStep.explanation);
      onStateChange?.(nextStep.stack, nextStep.heap, nextLine);
    }
  };

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(stepForward, speed);
    return () => clearInterval(interval);
  }, [isPlaying, currentLine, lines, speed]);

  const handleExplainAi = async () => {
    setExplainAiLoading(true);
    setAiExplanation(null);
    try {
      const res = await fetch("/api/gemini/explain-memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, stateInfo: { currentLineIndex: currentLine, currentLineCode: lines[currentLine] || "", stack, heap } }),
      });
      const data = await res.json();
      setAiExplanation(data.explanation ?? "No explanation returned.");
    } catch {
      setAiExplanation("AI service offline. Local diagnostics are active.");
    } finally {
      setExplainAiLoading(false);
    }
  };

  const isLabTab = activeTab !== "debugger";
  const fileName = getLanguageMeta(language).fileName;

  return (
    <div className="flex flex-col gap-4">

      {/* Journey task strip */}
      {journeyStage && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 min-w-0">
            <Flag className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] font-mono font-bold text-amber-400 uppercase">Stage task — {journeyStage.title}</span>
              <p className="text-xs font-mono text-slate-300 leading-relaxed mt-0.5">{journeyStage.task.instructions}</p>
            </div>
          </div>
          {stageCompleted ? (
            <span className="shrink-0 inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
              <CheckCircle className="w-3.5 h-3.5" />
              Done
            </span>
          ) : (
            !journeyStage.task.autoCompleteOnSimEnd && (
              <button
                onClick={() => onStageComplete?.(journeyStage.id)}
                className="shrink-0 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-mono font-semibold transition"
              >
                Mark complete
              </button>
            )
          )}
        </div>
      )}

      {/* Flat tab row */}
      <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1 overflow-x-auto scrollbar-none">
        {WORKSPACE_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold whitespace-nowrap transition shrink-0 ${
              activeTab === t.id
                ? "bg-slate-950 text-white border border-slate-700 shadow"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Debugger */}
      {!isLabTab && (
        <div className="flex flex-col gap-4">

          {/* Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                if (isEditing) return;
                if (stepsInfo.current.length === 0) stepsInfo.current = traceProgram(language, code);
                setIsPlaying(!isPlaying);
              }}
              disabled={isEditing}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-mono font-semibold transition disabled:opacity-40 ${
                isPlaying
                  ? "bg-amber-500 text-slate-950 hover:bg-amber-400"
                  : "bg-indigo-600 text-white hover:bg-indigo-500"
              }`}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              {isPlaying ? "Pause" : "Run"}
            </button>

            <button
              onClick={stepForward}
              disabled={isPlaying || isEditing}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 transition"
            >
              <SkipForward className="w-3.5 h-3.5" />
              Step
            </button>

            <button
              onClick={resetDebugger}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono font-semibold bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset
            </button>

            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-2 rounded-lg ml-auto">
              <span className="text-[10px] font-mono text-slate-500">Speed</span>
              <select
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="bg-transparent text-xs font-mono text-indigo-300 border-none outline-none cursor-pointer"
              >
                <option value="2000" className="bg-slate-900">Slow</option>
                <option value="1200" className="bg-slate-900">Medium</option>
                <option value="500"  className="bg-slate-900">Fast</option>
              </select>
            </div>
          </div>

          {/* Code / Stack / Heap */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 relative" ref={containerRef}>

            {/* SVG pointer arrows */}
            <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
              <svg className="w-full h-full">
                <defs>
                  <marker id="arr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#7ee787" />
                  </marker>
                </defs>
                {connections.map((conn, idx) => {
                  const from = document.getElementById(conn.fromId);
                  const to = document.getElementById(conn.toId);
                  const container = containerRef.current;
                  if (!from || !to || !container) return null;
                  const rf = from.getBoundingClientRect();
                  const rt = to.getBoundingClientRect();
                  const rc = container.getBoundingClientRect();
                  const x1 = rf.right - rc.left;
                  const y1 = rf.top + rf.height / 2 - rc.top;
                  const x2 = rt.left - rc.left;
                  const y2 = rt.top + rt.height / 2 - rc.top;
                  const cx = x1 + (x2 - x1) * 0.4;
                  return (
                    <motion.path
                      key={idx}
                      d={`M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2 - 10} ${y2}`}
                      fill="none" stroke="#7ee787" strokeWidth="1.5" strokeDasharray="4"
                      markerEnd="url(#arr)"
                      initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.35 }}
                    />
                  );
                })}
              </svg>
            </div>

            {/* Code panel */}
            <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[420px]">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800">
                <div className="flex items-center gap-1.5">
                  <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-xs font-mono font-semibold text-slate-400">{fileName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      if (isEditing) {
                        setIsEditing(false);
                      } else {
                        setIsPlaying(false);
                        setIsEditing(true);
                      }
                    }}
                    className={`flex items-center gap-1 text-[11px] font-mono font-semibold transition ${
                      isEditing ? "text-emerald-400 hover:text-emerald-300" : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {isEditing ? <Check className="w-3 h-3" /> : <Pencil className="w-3 h-3" />}
                    {isEditing ? "Done" : "Edit"}
                  </button>
                  <div className="flex gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                  </div>
                </div>
              </div>
              {isEditing ? (
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  spellCheck={false}
                  autoFocus
                  className="flex-1 w-full bg-transparent font-mono text-sm leading-relaxed text-slate-200 p-3 resize-none outline-none border-none"
                />
              ) : (
                <div className="flex-1 overflow-y-auto font-mono text-sm leading-relaxed py-2">
                  {code.split("\n").map((lineTxt, idx) => {
                    const isCurrent = idx === currentLine;
                    return (
                      <div
                        key={idx}
                        onClick={() => !isPlaying && setCurrentLine(idx)}
                        className={`flex items-start px-3 py-0.5 cursor-pointer transition ${
                          isCurrent
                            ? "bg-amber-500/12 border-l-2 border-amber-400"
                            : "border-l-2 border-transparent hover:bg-slate-800/50"
                        }`}
                      >
                        <span className={`w-6 text-right shrink-0 text-[11px] font-mono pr-3 select-none ${isCurrent ? "text-amber-400" : "text-slate-700"}`}>
                          {idx + 1}
                        </span>
                        <span className={`whitespace-pre text-sm ${isCurrent ? "text-white font-semibold" : "text-slate-400"}`}>
                          {lineTxt || " "}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Stack + Heap */}
            <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4 h-[420px]">

              {/* Stack */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 mb-3">
                  <span className="text-xs font-mono font-semibold text-slate-300">Stack</span>
                  <span className="text-[10px] font-mono text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded">variables</span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {stack.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600 text-center py-10">
                      <p className="text-xs">Empty</p>
                      <p className="text-[10px] mt-1 text-slate-700">Assignments will appear here</p>
                    </div>
                  ) : (
                    <AnimatePresence>
                      {stack.map((v) => {
                        const hovered = hoveredVar === v.name;
                        return (
                          <motion.div
                            id={`stack-${v.name}-${v.scope}`}
                            key={`${v.name}-${v.scope}`}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onMouseEnter={() => { setHoveredVar(v.name); if (v.pointsTo) setHoveredHeapAddr(v.pointsTo); }}
                            onMouseLeave={() => { setHoveredVar(null); setHoveredHeapAddr(null); }}
                            className={`p-2.5 rounded-lg border transition ${
                              hovered ? "bg-indigo-500/10 border-indigo-500/50" : "bg-slate-950 border-slate-800"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-mono text-[10px] text-indigo-400">{v.address}</span>
                              <span className="text-[9px] font-mono text-slate-600 border border-slate-800 px-1.5 rounded">{v.scope}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-sm text-slate-100 font-semibold">{v.name}</span>
                              <span className="font-mono text-xs text-indigo-300 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded max-w-[110px] truncate">
                                {v.isPointer ? `→ ${v.value.substring(0, 10)}` : v.value}
                              </span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  )}
                </div>
              </div>

              {/* Heap */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 mb-3">
                  <span className="text-xs font-mono font-semibold text-slate-300">Heap</span>
                  <span className="text-[10px] font-mono text-pink-400 bg-pink-500/10 border border-pink-500/20 px-2 py-0.5 rounded">dynamic objects</span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {Object.keys(heap).length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600 text-center py-10">
                      <p className="text-xs">Empty</p>
                      <p className="text-[10px] mt-1 text-slate-700">Dynamic allocations live here</p>
                    </div>
                  ) : (
                    <AnimatePresence>
                      {(Object.values(heap) as HeapObject[]).map((h) => {
                        const hovered = hoveredHeapAddr === h.address;
                        return (
                          <motion.div
                            id={`heap-${h.address}`}
                            key={h.address}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            onMouseEnter={() => setHoveredHeapAddr(h.address)}
                            onMouseLeave={() => setHoveredHeapAddr(null)}
                            className={`p-3 rounded-xl border transition ${
                              hovered ? "bg-pink-500/10 border-pink-500/50" : "bg-slate-950 border-slate-800"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-mono text-[10px] text-pink-400 font-semibold">{h.address}</span>
                              <div className="flex gap-1 font-mono text-[9px]">
                                <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded uppercase">{h.type}</span>
                                <span className="text-slate-400 bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded">refs: {h.refCount}</span>
                              </div>
                            </div>
                            <div className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5">
                              <p className="font-mono text-xs text-slate-300 whitespace-pre-wrap break-all">
                                {Array.isArray(h.value) ? `[ ${h.value.join(", ")} ]` : String(h.value)}
                              </p>
                              {h.label && (
                                <p className="font-mono text-[9px] text-slate-500 mt-1">{h.label}</p>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* Explanation + Console */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

            <div className="md:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-start gap-2.5">
                <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <p className="text-xs font-mono text-slate-300 leading-relaxed">{explanation}</p>
              </div>
              <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
                <button
                  onClick={handleExplainAi}
                  disabled={explainAiLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-lg text-xs font-mono font-semibold transition disabled:opacity-50"
                >
                  <Sparkles className="w-3 h-3" />
                  {explainAiLoading ? "Asking AI…" : "Ask AI"}
                </button>
                <span className="text-[10px] text-slate-600 font-mono">Gemini can explain the current state</span>
              </div>
            </div>

            <div className="md:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col min-h-[100px]">
              <div className="flex items-center gap-1.5 pb-2 border-b border-slate-800 mb-2">
                <Terminal className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-[10px] font-mono text-slate-500">stdout</span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-1">
                {stdout.length === 0 ? (
                  <p className="text-[10px] font-mono text-slate-700 italic">no output yet</p>
                ) : (
                  stdout.map((line, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 border-l-2 border-indigo-500/40 pl-2">
                      <span className="text-slate-600 font-mono text-xs select-none">›</span>
                      <span className="text-xs font-mono text-slate-200">{line}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* AI explanation */}
          {aiExplanation && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-indigo-950/30 border border-indigo-500/20 rounded-xl p-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-indigo-500/15 mb-3">
                <span className="flex items-center gap-1.5 text-xs font-mono font-semibold text-indigo-300">
                  <Sparkles className="w-3.5 h-3.5" />
                  Gemini memory analysis
                </span>
                <button
                  onClick={() => setAiExplanation(null)}
                  className="text-xs font-mono text-slate-500 hover:text-slate-300 transition"
                >
                  dismiss
                </button>
              </div>
              <p className="text-xs font-mono text-indigo-100 leading-relaxed whitespace-pre-wrap">{aiExplanation}</p>
            </motion.div>
          )}

        </div>
      )}

      {/* Labs */}
      {isLabTab && (
        <div className="flex flex-col gap-4">

          {/* Learning level */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-slate-600">Level:</span>
            <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-0.5 gap-0.5">
              {(["beginner", "intermediate", "advanced", "expert"] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setLearningMode(lvl)}
                  className={`px-2.5 py-1 rounded text-[10px] font-mono font-semibold capitalize transition ${
                    learningMode === lvl ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Lab content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              {activeTab === "pvm"    && <PythonPipelineLab learningMode={learningMode} />}
              {activeTab === "memory" && <MemoryModelLab learningMode={learningMode} initialSubTab={initialMemorySubTab} />}
              {activeTab === "data"   && <DataStructureLab />}
              {activeTab === "oop"    && <OOPFactoryLab />}
              {activeTab === "algo"   && <AlgorithmCenter />}
              {activeTab === "cpu"    && <LowLevelLab />}
              {activeTab === "os"     && <SystemNetworkLab />}
            </motion.div>
          </AnimatePresence>

        </div>
      )}

    </div>
  );
}
