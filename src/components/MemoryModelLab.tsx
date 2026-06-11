/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Play, SkipForward, ArrowRight, GitFork, Minimize2, Trash2, ArrowLeft, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function MemoryModelLab({
  learningMode,
  initialSubTab,
}: {
  learningMode: "beginner" | "intermediate" | "advanced" | "expert";
  initialSubTab?: "references" | "callstack" | "recursion" | "garbage";
}) {
  const [activeSubTab, setActiveSubTab] = useState<"references" | "callstack" | "recursion" | "garbage">(initialSubTab ?? "references");

  // Subtab 1 State: References & Mutability
  const [refStep, setRefStep] = useState<number>(0);
  const [listValues, setListValues] = useState<number[]>([1, 2, 3]);

  // Subtab 2 State: Call Stack
  const [callstackStep, setCallstackStep] = useState<number>(0);

  // Subtab 3 State: Recursion Explorer
  const [recStep, setRecStep] = useState<number>(0);

  // Subtab 4 State: Garbage Collection
  const [refCountMap, setRefCountMap] = useState({
    objectA: { address: "0xHe7B1", values: [1, 2], refCount: 2, refs: ["a", "b"] },
  });

  const handleRefStepForward = () => {
    setRefStep((prev) => {
      const next = prev + 1;
      if (next > 2) return 2;
      return next;
    });
  };

  const handleRefStepBackward = () => {
    setRefStep((prev) => {
      const next = prev - 1;
      if (next < 0) return 0;
      return next;
    });
  };

  useEffect(() => {
    if (refStep === 2) {
      setListValues([1, 2, 3, 4]);
    } else {
      setListValues([1, 2, 3]);
    }
  }, [refStep]);

  // Recursion stages info
  const recursionStack = [
    { frame: "factorial(4)", localN: 4, returned: null, desc: "Invoked. Returns 4 * factorial(3)" },
    { frame: "factorial(3)", localN: 3, returned: null, desc: "Invoked. Returns 3 * factorial(2)" },
    { frame: "factorial(2)", localN: 2, returned: null, desc: "Invoked. Returns 2 * factorial(1)" },
    { frame: "factorial(1)", localN: 1, returned: 1, desc: "Base case reached! Returns 1 directly" },
    { frame: "factorial(2)", localN: 2, returned: 2, desc: "Unwound. Calculated 2 * 1 = 2" },
    { frame: "factorial(3)", localN: 3, returned: 6, desc: "Unwound. Calculated 3 * 2 = 6" },
    { frame: "factorial(4)", localN: 4, returned: 24, desc: "Complete. Calculated 4 * 6 = 24" }
  ];

  const handleRecForward = () => {
    setRecStep((prev) => Math.min(prev + 1, recursionStack.length - 1));
  };
  const handleRecBackward = () => {
    setRecStep((prev) => Math.max(prev - 1, 0));
  };

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded p-4 h-full flex flex-col" id="memory-model-lab-container">
      
      {/* SCOPE EXPANDER NAVIGATION */}
      <div className="flex border-b border-[#30363d] pb-2 mb-4 gap-2 overflow-x-auto select-none">
        <button
          onClick={() => setActiveSubTab("references")}
          className={`px-3 py-1.5 text-xs font-mono rounded transition shrink-0 ${
            activeSubTab === "references" ? "bg-[#21262d] text-amber-300 border border-[#30363d] font-bold" : "text-slate-400 hover:text-slate-200"
          }`}
          id="subtab-references-btn"
        >
          ● References & Aliasing
        </button>
        <button
          onClick={() => setActiveSubTab("callstack")}
          className={`px-3 py-1.5 text-xs font-mono rounded transition shrink-0 ${
            activeSubTab === "callstack" ? "bg-[#21262d] text-amber-300 border border-[#30363d] font-bold" : "text-slate-400 hover:text-slate-200"
          }`}
          id="subtab-callstack-btn"
        >
          ● Call Stack Push & Pop
        </button>
        <button
          onClick={() => setActiveSubTab("recursion")}
          className={`px-3 py-1.5 text-xs font-mono rounded transition shrink-0 ${
            activeSubTab === "recursion" ? "bg-[#21262d] text-amber-300 border border-[#30363d] font-bold" : "text-slate-400 hover:text-slate-200"
          }`}
          id="subtab-recursion-btn"
        >
          ● Recursion Unwinder
        </button>
        <button
          onClick={() => setActiveSubTab("garbage")}
          className={`px-3 py-1.5 text-xs font-mono rounded transition shrink-0 ${
            activeSubTab === "garbage" ? "bg-[#21262d] text-amber-300 border border-[#30363d] font-bold" : "text-slate-400 hover:text-slate-200"
          }`}
          id="subtab-garbage-btn"
        >
          ● Garbage Collector (GC)
        </button>
      </div>

      {activeSubTab === "references" && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1 overflow-y-auto" id="sandbox-references-engine">
          <div className="md:col-span-4 flex flex-col gap-3">
            <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 font-mono">CODE TIMELINE</h4>
            <div className="bg-[#0d1117] border border-[#30363d] rounded p-3 font-mono text-xs flex-1 space-y-2 select-none h-[140px] md:h-auto">
              <div className={`p-1.5 rounded transition ${refStep === 0 ? "bg-amber-500/15 text-amber-300 font-bold border-l-2 border-amber-500" : "text-slate-500"}`}>
                x = [1, 2, 3]
              </div>
              <div className={`p-1.5 rounded transition ${refStep === 1 ? "bg-amber-500/15 text-amber-300 font-bold border-l-2 border-amber-500" : "text-slate-500"}`}>
                y = x  # Shared reference
              </div>
              <div className={`p-1.5 rounded transition ${refStep === 2 ? "bg-amber-500/15 text-amber-300 font-bold border-l-2 border-amber-500" : "text-slate-500"}`}>
                y.append(4)  # Mutates heap object
              </div>
            </div>

            <div className="flex gap-2 bg-[#0d1117] p-2 rounded border border-[#30363d]">
              <button
                onClick={handleRefStepBackward}
                disabled={refStep === 0}
                className="flex-1 py-1.5 rounded text-xs bg-[#21262d] border border-[#30363d] text-slate-200 flex items-center justify-center gap-1 hover:bg-[#30363d] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                id="ref-prev-btn"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
              <button
                onClick={handleRefStepForward}
                disabled={refStep === 2}
                className="flex-1 py-1.5 rounded text-xs bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                id="ref-next-btn"
              >
                Step <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="md:col-span-8 flex flex-col bg-[#0d1117] border border-[#30363d] rounded p-4 relative overflow-hidden min-h-[220px]">
            <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 font-mono mb-4">HEAP ADDRESS ROUTER VISUAL</h4>

            <div className="flex-1 flex flex-col md:flex-row justify-around items-center relative gap-8 py-6">
              
              {/* VARIABLES INDEX */}
              <div className="flex flex-col gap-4 w-[120px]">
                {/* Pointer X */}
                <div className="bg-[#161b22] border border-[#30363d] p-2 rounded text-center relative flex items-center justify-between">
                  <span className="font-mono font-bold text-blue-400 text-xs">x</span>
                  <div className="w-4 h-4 rounded-full bg-blue-500/20 border border-blue-500 flex items-center justify-center text-[8px] text-blue-300 font-mono">p</div>
                </div>

                {/* Pointer Y (only visible from step 1 onward) */}
                {refStep >= 1 ? (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-[#161b22] border border-[#30363d] p-2 rounded text-center relative flex items-center justify-between"
                  >
                    <span className="font-mono font-bold text-emerald-400 text-xs">y</span>
                    <div className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-[8px] text-emerald-300 font-mono">p</div>
                  </motion.div>
                ) : (
                  <div className="border border-dashed border-[#30363d] py-3 text-center text-[10px] text-slate-600 font-mono rounded">
                    y unallocated
                  </div>
                )}
              </div>

              {/* HEAP CELL OBJECTS */}
              <div className="flex flex-col items-center justify-center min-w-[200px]">
                <div className="text-[10px] text-slate-500 font-mono mb-1">Heap Address: 0xAlloc162C</div>
                <div className="bg-[#1f242c] border-2 border-[#bc8cff] p-4 rounded-lg flex gap-2 relative shadow-lg">
                  {listValues.map((val, i) => (
                    <motion.div
                      key={i}
                      layout
                      initial={{ scale: 0.7 }}
                      animate={{ scale: 1 }}
                      className="w-10 h-10 bg-[#30363d] border border-theme-accented-border flex items-center justify-center font-bold text-indigo-200 rounded font-mono"
                    >
                      {val}
                    </motion.div>
                  ))}
                  {refStep === 2 && (
                    <div className="absolute top-[-10px] right-2 bg-emerald-500 text-white text-[8px] uppercase tracking-wider font-bold px-1 py-0.5 rounded shadow">
                      Mutated!
                    </div>
                  )}
                </div>
              </div>

              {/* BOUNDARY VECTOR PATH CONNECTIONS */}
              <svg className="absolute inset-0 pointer-events-none hidden md:block" style={{ width: "100%", height: "100%" }}>
                {/* Pointer line X */}
                <path d="M 140 50 Q 210 50 270 95" stroke="#58a6ff" strokeWidth="1.5" fill="none" strokeDasharray="3" />
                {/* Pointer line Y */}
                {refStep >= 1 && (
                  <path d="M 140 115 Q 210 115 270 105" stroke="#7ee787" strokeWidth="1.5" fill="none" strokeDasharray="3" />
                )}
              </svg>

            </div>

            <div className="mt-4 border-t border-[#30363d]/50 pt-3 text-[11px] text-slate-400 font-mono leading-relaxed bg-[#0d1117] p-2 rounded">
              {refStep === 0 && (
                <span>Variable <strong className="text-white">x</strong> is assigned to a list in heap memory at <span className="text-amber-300">0xAlloc162C</span>.</span>
              )}
              {refStep === 1 && (
                <span>Variable <strong className="text-white">y</strong> receives the exact reference of <strong className="text-white">x</strong>. No new list object is made in the Heap! This is called an <strong className="text-amber-400">alias</strong>.</span>
              )}
              {refStep === 2 && (
                <span>Appending to <strong className="text-white">y</strong> modifies the same shared object. Therefore, <strong className="text-white">x</strong> also sees the values as <strong className="text-emerald-400 font-bold">[1, 2, 3, 4]</strong> because they reference the identical heap box.</span>
              )}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === "callstack" && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1 overflow-y-auto" id="sandbox-callstack-engine">
          <div className="md:col-span-5 flex flex-col gap-3">
            <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 font-mono">CALL SEQUENCES</h4>
            <div className="bg-[#0d1117] border border-[#30363d] rounded p-3 font-mono text-xs flex-1 space-y-2 select-none">
              <div className="text-slate-400 font-bold text-[10px] tracking-wider uppercase border-b border-[#30363d] pb-1 flex justify-between">
                <span>Code Frame Execution</span>
                <span className="text-[#a371f7]">Scope stack</span>
              </div>
              <div className={`p-1.5 rounded transition ${callstackStep === 0 ? "bg-amber-500/15 text-amber-300 font-bold border-l-2 border-amber-500" : "text-slate-500"}`}>
                1. def check_user(): login_active = true
              </div>
              <div className={`p-1.5 rounded transition ${callstackStep === 1 ? "bg-amber-500/15 text-amber-300 font-bold border-l-2 border-amber-500" : "text-slate-500"}`}>
                2. def get_meta(): type="admin" ; check_user()
              </div>
              <div className={`p-1.5 rounded transition ${callstackStep === 2 ? "bg-amber-500/15 text-amber-300 font-bold border-l-2 border-amber-500" : "text-slate-500"}`}>
                3. check_user() returned ➔ Popping back scope
              </div>
            </div>

            <div className="flex gap-2 bg-[#0d1117] p-2 rounded border border-[#30363d]">
              <button
                onClick={() => setCallstackStep(Math.max(0, callstackStep - 1))}
                disabled={callstackStep === 0}
                className="flex-1 py-1.5 rounded text-xs bg-[#21262d] border border-[#30363d] text-slate-200 flex items-center justify-center gap-1 hover:bg-[#30363d] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={() => setCallstackStep(Math.min(2, callstackStep + 1))}
                disabled={callstackStep === 2}
                className="flex-1 py-1.5 rounded text-xs bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Step forward Stack
              </button>
            </div>
          </div>

          {/* DYNAMIC SCENE DRAW */}
          <div className="md:col-span-7 flex flex-col bg-[#0d1117] border border-[#30363d] rounded p-4">
            <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 font-mono mb-3">RUNTIME STACK VISUAL</h4>
            
            <div className="flex-1 flex flex-col-reverse justify-start items-center gap-2 py-4 border border-dashed border-[#30363d] rounded bg-[#161b22]/50 p-3 min-h-[220px]">
              
              {/* GLOBAL SCOPE ALWAYS PRESENT */}
              <div className="w-full max-w-[280px] bg-[#21262d] border border-[#484f58] p-2.5 rounded shadow">
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold border-b border-slate-700 pb-1 mb-1.5">
                  <span>FRAME: global()</span>
                  <span className="text-blue-400">0x7FFFF2C0</span>
                </div>
                <div className="text-[10px] text-slate-300 font-mono space-y-0.5">
                  <div>db_connected = True</div>
                </div>
              </div>

              {/* GET_META CALL STACK FRAME */}
              {callstackStep >= 1 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="w-full max-w-[280px] bg-[#1a2333] border border-blue-900 p-2.5 rounded shadow"
                >
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold border-b border-slate-700 pb-1 mb-1.5">
                    <span>FRAME: get_meta()</span>
                    <span className="text-indigo-400">0x7FFFF2A0</span>
                  </div>
                  <div className="text-[10px] text-slate-300 font-mono space-y-0.5">
                    <div>type = "admin"</div>
                  </div>
                </motion.div>
              )}

              {/* CHECK_USER CALL STACK FRAME */}
              {callstackStep === 1 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="w-full max-w-[280px] bg-[#1a332a] border border-emerald-950 p-2.5 rounded shadow"
                >
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold border-b border-slate-700 pb-1 mb-1.5">
                    <span>FRAME: check_user()</span>
                    <span className="text-emerald-400">0x7FFFF280</span>
                  </div>
                  <div className="text-[10px] text-slate-300 font-mono space-y-0.5">
                    <div>login_active = True</div>
                  </div>
                </motion.div>
              )}

            </div>
          </div>
        </div>
      )}

      {activeSubTab === "recursion" && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1 overflow-y-auto" id="sandbox-recursion-engine">
          <div className="md:col-span-4 flex flex-col gap-3">
            <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 font-mono">RECURSION ACTIONS</h4>
            <div className="bg-[#0d1117] border border-[#30363d] rounded p-3 font-mono text-[11px] flex-grow space-y-2 select-none text-slate-400">
              <span className="text-[#a371f7] text-[10px] block uppercase font-bold">Trace Stage {recStep + 1} of {recursionStack.length}</span>
              <div className="text-slate-100 font-bold bg-[#161b22] p-2 rounded border border-[#30363d]">
                {recursionStack[recStep].frame}
              </div>
              <div className="text-[11px] mt-1 text-slate-400 italic">
                {recursionStack[recStep].desc}
              </div>
            </div>

            <div className="flex gap-2 bg-[#0d1117] p-2 rounded border border-[#30363d]">
              <button
                onClick={handleRecBackward}
                disabled={recStep === 0}
                className="flex-1 py-1.5 rounded text-xs bg-[#21262d] border border-[#30363d] text-slate-200 flex items-center justify-center gap-1 hover:bg-[#30363d] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={handleRecForward}
                disabled={recStep === recursionStack.length - 1}
                className="flex-1 py-1.5 rounded text-xs bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Forward
              </button>
            </div>
          </div>

          <div className="md:col-span-8 flex flex-col bg-[#0d1117] border border-[#30363d] rounded p-4 relative min-h-[260px]">
            <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 font-mono mb-3">FACTORIAL(4) RECURSIVE VISUAL UNWIND TREE</h4>
            
            <div className="flex-grow flex flex-col justify-center items-center gap-2 py-4">
              {recursionStack.slice(0, recStep + 1).map((frameInfo, index) => {
                const isTopFrame = index === recStep;
                return (
                  <motion.div
                    key={index}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`w-full max-w-[340px] px-3 py-2 rounded border text-xs font-mono flex items-center justify-between ${
                      isTopFrame
                        ? "bg-amber-500/15 border-amber-500 text-amber-300 font-bold scale-102"
                        : "bg-[#21262d] border-[#30363d] text-slate-400 opacity-60"
                    }`}
                  >
                    <span>{frameInfo.frame}</span>
                    <span className="text-[10px] bg-[#161b22] px-2 py-0.5 rounded text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-300 font-semibold">
                      {frameInfo.returned !== null ? `Returned: ${frameInfo.returned}` : "Evaluating..."}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === "garbage" && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1 overflow-y-auto" id="sandbox-garbage-engine">
          <div className="md:col-span-4 flex flex-col gap-3">
            <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 font-mono">REFERENCE RE-ASSIGNMENTS</h4>
            <div className="bg-[#0d1117] border border-[#30363d] rounded p-3 font-mono text-xs flex-grow divide-y divide-[#30363d]">
              
              <div className="py-2 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-200">a = None</div>
                  <div className="text-[9px] text-slate-500">Unbinds reference 'a'</div>
                </div>
                <button
                  onClick={() => {
                    setRefCountMap((prev) => {
                      const item = { ...prev.objectA };
                      item.refs = item.refs.filter(r => r !== "a");
                      item.refCount = item.refs.length;
                      return { objectA: item };
                    });
                  }}
                  disabled={!refCountMap.objectA.refs.includes("a")}
                  className="px-2 py-1 bg-[#10141b] rounded text-[10px] text-red-400 border border-red-900/30 font-semibold transition"
                >
                  Apply None
                </button>
              </div>

              <div className="py-2 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-200">b = None</div>
                  <div className="text-[9px] text-slate-500">Unbinds reference 'b'</div>
                </div>
                <button
                  onClick={() => {
                    setRefCountMap((prev) => {
                      const item = { ...prev.objectA };
                      item.refs = item.refs.filter(r => r !== "b");
                      item.refCount = item.refs.length;
                      return { objectA: item };
                    });
                  }}
                  disabled={!refCountMap.objectA.refs.includes("b")}
                  className="px-2 py-1 bg-[#10141b] rounded text-[10px] text-red-400 border border-red-900/30 font-semibold transition"
                >
                  Apply None
                </button>
              </div>

              <div className="py-2.5">
                <button
                  onClick={() => {
                    setRefCountMap({
                      objectA: { address: "0xHe7B1", values: [1, 2], refCount: 2, refs: ["a", "b"] }
                    });
                  }}
                  className="w-full py-1.5 bg-[#21262d] border border-[#30363d] rounded text-xs text-slate-300 font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset Object & References
                </button>
              </div>

            </div>
          </div>

          <div className="md:col-span-8 flex flex-col bg-[#0d1117] border border-[#30363d] rounded p-4 relative justify-center items-center h-[260px]">
            <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 font-mono mb-6 absolute top-4 left-4">GARBAGE COLLECTION SCHEDULER</h4>

            <AnimatePresence mode="popLayout">
              {refCountMap.objectA.refCount > 0 ? (
                <motion.div
                  key="active-object"
                  exit={{ opacity: 0, scale: 0.8, rotate: -3 }}
                  className="p-5 rounded-lg border-2 border-dashed border-[#a371f7] bg-[#1a1426] text-center w-full max-w-[280px]"
                >
                  <div className="text-[9px] font-mono text-[#a371f7] mb-1">Heap Slot: {refCountMap.objectA.address}</div>
                  <div className="text-xl font-bold font-mono text-white tracking-widest">[1, 2]</div>
                  <div className="text-xs text-slate-400 mt-2 font-mono">
                    Reference List Count = <strong className="text-amber-400 text-sm">{refCountMap.objectA.refCount}</strong>
                  </div>
                  <div className="flex gap-1 justify-center mt-3">
                    {refCountMap.objectA.refs.map(r => (
                      <span key={r} className="px-1.5 py-0.5 bg-blue-900/30 text-blue-400 border border-blue-900/50 rounded font-mono text-[9px] font-bold">
                        ref: {r}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="collected"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center p-6 border-2 border-dashed border-red-900/40 rounded-lg max-w-[280px] bg-red-950/5"
                >
                  <Trash2 className="w-12 h-12 text-red-500 mx-auto mb-3" />
                  <div className="text-sm font-bold font-mono text-red-400">GC: TRASH DEALLOCATED!</div>
                  <p className="text-[10px] text-slate-500 mt-1 font-mono leading-relaxed">
                    Reference count hit exactly 0. Object automatically swept from RAM and heap space freed.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>
      )}

    </div>
  );
}
