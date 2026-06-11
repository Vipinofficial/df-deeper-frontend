/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { ChevronRight, ArrowRight, Play, Database, Layers, Hash } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function DataStructureLab() {
  const [activeDS, setActiveDS] = useState<"list" | "stack" | "queue" | "hash">("list");

  // DS State variables
  const [list, setList] = useState<string[]>(["A", "B", "C", "D"]);
  const [listInput, setListInput] = useState<string>("E");
  const [listIndexInput, setListIndexInput] = useState<number>(2);

  const [stack, setStack] = useState<string[]>(["A", "B", "C"]);
  const [stackInput, setStackInput] = useState<string>("D");
  const [stackPeek, setStackPeek] = useState<string | null>(null);

  const [queue, setQueue] = useState<string[]>(["A", "B", "C"]);
  const [queueInput, setQueueInput] = useState<string>("D");

  const [hashTable, setHashTable] = useState<{ [key: string]: string }>({
    "name": "Vipin",
    "role": "Admin",
    "app": "PyLab",
  });
  const [hashKeyInput, setHashKeyInput] = useState<string>("lang");
  const [hashValInput, setHashValInput] = useState<string>("Python");
  const [lastHashResult, setLastHashResult] = useState<{ slot: number; hash: number } | null>(null);

  // List operations
  const handleAppend = () => {
    if (!listInput) return;
    setList([...list, listInput]);
  };

  const handlePop = () => {
    if (list.length === 0) return;
    setList(list.slice(0, -1));
  };

  const handleInsert = () => {
    if (!listInput) return;
    const newList = [...list];
    newList.splice(listIndexInput, 0, listInput);
    setList(newList);
  };

  const handleRemove = () => {
    const idx = list.indexOf(listInput);
    if (idx > -1) {
      const newList = [...list];
      newList.splice(idx, 1);
      setList(newList);
    }
  };

  // Stack operations
  const handleStackPush = () => {
    if (!stackInput) return;
    setStack([...stack, stackInput]);
    setStackPeek(null);
  };

  const handleStackPop = () => {
    if (stack.length === 0) return;
    setStack(stack.slice(0, -1));
    setStackPeek(null);
  };

  const handleStackPeek = () => {
    if (stack.length === 0) return;
    setStackPeek(stack[stack.length - 1]);
  };

  // Queue operations
  const handleEnqueue = () => {
    if (!queueInput) return;
    setQueue([...queue, queueInput]);
  };

  const handleDequeue = () => {
    if (queue.length === 0) return;
    setQueue(queue.slice(1));
  };

  // Simple string hash function for Visualizer
  const computeHash = (key: string) => {
    let result = 0;
    for (let i = 0; i < key.length; i++) {
      result += key.charCodeAt(i);
    }
    const slot = result % 8; // 8 buckets
    return { hash: result, slot };
  };

  const handleHashAdd = () => {
    if (!hashKeyInput || !hashValInput) return;
    const res = computeHash(hashKeyInput);
    setLastHashResult(res);
    setHashTable({ ...hashTable, [hashKeyInput]: hashValInput });
  };

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded p-4 h-full flex flex-col" id="data-structure-laboratory">
      {/* SELECTION BAR */}
      <div className="flex border-b border-[#30363d] pb-2 mb-4 gap-2 overflow-x-auto select-none">
        <button
          onClick={() => setActiveDS("list")}
          className={`px-3 py-1.5 text-xs font-mono rounded transition shrink-0 ${
            activeDS === "list" ? "bg-[#21262d] text-[#58a6ff] border border-[#30363d] font-bold" : "text-slate-400 hover:text-slate-200"
          }`}
          id="ds-select-list-btn"
        >
          ● Dynamic Array (List)
        </button>
        <button
          onClick={() => setActiveDS("stack")}
          className={`px-3 py-1.5 text-xs font-mono rounded transition shrink-0 ${
            activeDS === "stack" ? "bg-[#21262d] text-[#58a6ff] border border-[#30363d] font-bold" : "text-slate-400 hover:text-slate-200"
          }`}
          id="ds-select-stack-btn"
        >
          ● LIFO Stack
        </button>
        <button
          onClick={() => setActiveDS("queue")}
          className={`px-3 py-1.5 text-xs font-mono rounded transition shrink-0 ${
            activeDS === "queue" ? "bg-[#21262d] text-[#58a6ff] border border-[#30363d] font-bold" : "text-slate-400 hover:text-slate-200"
          }`}
          id="ds-select-queue-btn"
        >
          ● FIFO Queue
        </button>
        <button
          onClick={() => setActiveDS("hash")}
          className={`px-3 py-1.5 text-xs font-mono rounded transition shrink-0 ${
            activeDS === "hash" ? "bg-[#21262d] text-[#58a6ff] border border-[#30363d] font-bold" : "text-slate-400 hover:text-slate-200"
          }`}
          id="ds-select-hash-btn"
        >
          ● Hash Dictionary (Dict)
        </button>
      </div>

      {activeDS === "list" && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1 overflow-y-auto" id="ds-list-container">
          <div className="md:col-span-4 flex flex-col gap-3">
            <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 font-mono">LIST CONTROLLER</h4>
            <div className="bg-[#0d1117] border border-[#30363d] rounded p-3 font-mono space-y-3">
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Value String</label>
                <input
                  type="text"
                  maxLength={5}
                  value={listInput}
                  onChange={(e) => setListInput(e.target.value.toUpperCase())}
                  className="w-full bg-[#161b22] border border-[#30363d] rounded px-2.5 py-1 text-xs text-white outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Target Index for insert()</label>
                <input
                  type="number"
                  min={0}
                  max={list.length}
                  value={listIndexInput}
                  onChange={(e) => setListIndexInput(Number(e.target.value))}
                  className="w-full bg-[#161b22] border border-[#30363d] rounded px-2.5 py-1 text-xs text-white outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button onClick={handleAppend} className="py-1 px-2 bg-blue-900/30 text-blue-400 border border-blue-900/50 hover:bg-blue-900/50 text-[11px] rounded transition">
                  append()
                </button>
                <button onClick={handlePop} className="py-1 px-2 bg-red-900/30 text-red-400 border border-red-900/50 hover:bg-red-900/50 text-[11px] rounded transition">
                  pop()
                </button>
                <button onClick={handleInsert} className="py-1 px-2 bg-[#2ea043]/30 text-[#7ee787] border border-emerald-900/50 hover:bg-[#2ea043]/50 text-[11px] rounded transition col-span-2">
                  insert(index)
                </button>
                <button onClick={handleRemove} className="py-1 px-2 bg-amber-900/30 text-amber-300 border border-amber-900/50 hover:bg-amber-900/50 text-[11px] rounded transition col-span-2">
                  remove(val)
                </button>
              </div>
            </div>
          </div>

          <div className="md:col-span-8 flex flex-col bg-[#0d1117] border border-[#30363d] rounded p-4 relative min-h-[220px]">
            <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 font-mono mb-4">DYNAMIC ARRAY MEMORY SLOTS</h4>
            
            <div className="flex-1 flex flex-wrap justify-center items-center gap-2 py-4">
              <AnimatePresence mode="popLayout">
                {list.length === 0 ? (
                  <div className="text-slate-600 font-mono italic text-xs">List array is physically empty in RAM.</div>
                ) : (
                  list.map((item, idx) => (
                    <motion.div
                      key={idx}
                      layout
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className="flex flex-col items-center bg-[#161b22] border border-[#30363d] p-3 rounded shadow"
                    >
                      <div className="text-[9px] font-mono text-slate-500 mb-1">Index {idx}</div>
                      <div className="w-10 h-10 border border-blue-500/70 bg-blue-500/10 text-white font-bold flex items-center justify-center font-mono rounded">
                        {item}
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}

      {activeDS === "stack" && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1 overflow-y-auto" id="ds-stack-container">
          <div className="md:col-span-4 flex flex-col gap-3">
            <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 font-mono">STACK CONTROLLER (LIFO)</h4>
            <div className="bg-[#0d1117] border border-[#30363d] rounded p-3 font-mono space-y-3">
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Value String</label>
                <input
                  type="text"
                  maxLength={5}
                  value={stackInput}
                  onChange={(e) => setStackInput(e.target.value.toUpperCase())}
                  className="w-full bg-[#161b22] border border-[#30363d] rounded px-2.5 py-1 text-xs text-white outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <button onClick={handleStackPush} className="w-full py-1.5 bg-indigo-500/10 border border-indigo-400 text-indigo-300 text-[11px] rounded transition">
                  push(val)
                </button>
                <button onClick={handleStackPop} className="w-full py-1.5 bg-red-900/30 text-red-400 border border-red-900/50 text-[11px] rounded transition">
                  pop()
                </button>
                <button onClick={handleStackPeek} className="w-full py-1.5 bg-[#21262d] border border-[#30363d] text-slate-300 text-[11px] rounded transition">
                  peek()
                </button>
              </div>

              {stackPeek && (
                <div className="bg-[#161b22] p-2.5 rounded border border-[#30363d] text-[11px] text-amber-300 font-mono text-center">
                  Peek returned element: <strong>{stackPeek}</strong> (No removal)
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-8 flex flex-col bg-[#0d1117] border border-[#30363d] rounded p-4 relative min-h-[220px]">
            <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 font-mono mb-4 text-center">STACK FRAMING VERTICAL</h4>
            
            <div className="flex-1 flex flex-col-reverse items-center justify-center gap-1.5 py-4 w-full max-w-[240px] mx-auto border-x border-b border-[#30363d]/70 rounded-b p-2">
              <AnimatePresence mode="popLayout">
                {stack.length === 0 ? (
                  <div className="text-slate-650 font-mono italic text-xs py-10">Stack container is empty.</div>
                ) : (
                  stack.map((item, idx) => {
                    const isTop = idx === stack.length - 1;
                    return (
                      <motion.div
                        key={idx}
                        layout
                        initial={{ scale: 0.95, y: -10, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.95, y: -15, opacity: 0 }}
                        className={`w-full py-2.5 text-center font-mono font-bold text-xs border rounded ${
                          isTop
                            ? "bg-amber-500/10 border-amber-500 text-amber-300 scale-102 shadow-lg"
                            : "bg-[#161b22] border-[#30363d] text-slate-400"
                        }`}
                      >
                        {item} {isTop && " ➔ TOP element"}
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}

      {activeDS === "queue" && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1 overflow-y-auto" id="ds-queue-container">
          <div className="md:col-span-4 flex flex-col gap-3">
            <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 font-mono">QUEUE CONTROLLER (FIFO)</h4>
            <div className="bg-[#0d1117] border border-[#30363d] rounded p-3 font-mono space-y-3">
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Value String</label>
                <input
                  type="text"
                  maxLength={5}
                  value={queueInput}
                  onChange={(e) => setQueueInput(e.target.value.toUpperCase())}
                  className="w-full bg-[#161b22] border border-[#30363d] rounded px-2.5 py-1 text-xs text-white outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <button onClick={handleEnqueue} className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] rounded transition">
                  enqueue(val)
                </button>
                <button onClick={handleDequeue} className="w-full py-1.5 bg-red-900/30 text-red-400 border border-red-900/50 text-[11px] rounded transition">
                  dequeue()
                </button>
              </div>
            </div>
          </div>

          <div className="md:col-span-8 flex flex-col bg-[#0d1117] border border-[#30363d] rounded p-4 relative min-h-[220px]">
            <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 font-mono mb-4">QUEUE STREAM</h4>
            
            <div className="flex-1 flex items-center justify-center gap-1.5 py-4 overflow-x-auto">
              <span className="text-[10px] font-mono text-slate-500">FRONT</span>
              <AnimatePresence mode="popLayout">
                {queue.length === 0 ? (
                  <div className="text-slate-600 font-mono italic text-xs px-12">Queue is empty.</div>
                ) : (
                  queue.map((item, idx) => (
                    <motion.div
                      key={idx}
                      layout
                      initial={{ scale: 0.8, x: 20 }}
                      animate={{ scale: 1, x: 0 }}
                      className="px-4 py-3 bg-[#161b22] border border-[#30363d] rounded text-white font-bold font-mono text-xs shadow"
                    >
                      {item}
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
              <span className="text-[10px] font-mono text-slate-500">REAR</span>
            </div>
          </div>
        </div>
      )}

      {activeDS === "hash" && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1 overflow-y-auto" id="ds-hash-container">
          <div className="md:col-span-4 flex flex-col gap-3">
            <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 font-mono">MAP CONTROLLER</h4>
            <div className="bg-[#0d1117] border border-[#30363d] rounded p-3 font-mono space-y-3">
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Key Name</label>
                <input
                  type="text"
                  maxLength={10}
                  value={hashKeyInput}
                  onChange={(e) => setHashKeyInput(e.target.value.toLowerCase())}
                  className="w-full bg-[#161b22] border border-[#30363d] rounded px-2.5 py-1 text-xs text-white outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Value String</label>
                <input
                  type="text"
                  maxLength={12}
                  value={hashValInput}
                  onChange={(e) => setHashValInput(e.target.value)}
                  className="w-full bg-[#161b22] border border-[#30363d] rounded px-2.5 py-1 text-xs text-white outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <button onClick={handleHashAdd} className="w-full py-1.5 bg-[#1f6feb] hover:bg-[#1f6feb]/95 text-white text-[11px] font-bold rounded transition">
                Map Item data[{hashKeyInput}] = "{hashValInput}"
              </button>

              {lastHashResult && (
                <div className="bg-[#161b22] p-2.5 rounded border border-[#30363d] text-[10px] space-y-0.5 font-mono">
                  <div className="flex justify-between">
                    <span>ASCII Hash calculation:</span>
                    <strong className="text-[#a371f7]">{lastHashResult.hash}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Modulo (% 8 buckets):</span>
                    <strong className="text-amber-400">Slot Index {lastHashResult.slot}</strong>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-8 flex flex-col bg-[#0d1117] border border-[#30363d] rounded p-4 relative min-h-[220px]">
            <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 font-mono mb-3">HASH TABLE SLOTS LAYOUT</h4>
            
            <div className="flex-grow grid grid-cols-2 md:grid-cols-4 gap-2 py-2">
              {Array.from({ length: 8 }).map((_, idx) => {
                // Determine if key is mapped here
                const itemsMapped = Object.keys(hashTable).filter(k => computeHash(k).slot === idx);
                const isTargetCell = lastHashResult?.slot === idx;

                return (
                  <div
                    key={idx}
                    className={`p-2 rounded border font-mono flex flex-col justify-between transition-all ${
                      isTargetCell
                        ? "bg-amber-500/10 border-amber-500 scale-[1.01]"
                        : "bg-[#161b22] border-[#30363d]"
                    }`}
                  >
                    <div className="flex justify-between text-[9px] text-slate-500 font-semibold mb-1 border-b border-slate-800 pb-0.5">
                      <span>SLOT {idx}</span>
                      <span>Index</span>
                    </div>

                    <div className="flex-grow flex flex-col gap-1 justify-center min-h-[40px]">
                      {itemsMapped.length === 0 ? (
                        <div className="text-[9px] text-slate-650 text-center italic">Empty</div>
                      ) : (
                        itemsMapped.map(k => (
                          <div key={k} className="text-[10px] text-slate-300 leading-tight">
                            <strong className="text-emerald-400">"{k}"</strong> ➔ {hashTable[k]}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
