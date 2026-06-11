/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Play, Pause, SkipForward, RefreshCw, Terminal, FileCode } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Token {
  value: string;
  type: string;
  explanation: string;
  color: string;
}

interface ASTNode {
  name: string;
  kind: string;
  order: number;
  explanation: string;
  children?: ASTNode[];
}

interface Bytecode {
  op: string;
  arg: string;
  explanation: string;
}

const SOURCE = "x = 10\ny = 20\nprint(x + y)";

const TOKENS: Token[] = [
  { value: "x",       type: "Identifier",  explanation: "Variable name — a label for a memory location.", color: "text-sky-400" },
  { value: "=",       type: "Assignment",  explanation: "Binds the right-hand value to the left-hand name.", color: "text-amber-400" },
  { value: "10",      type: "Int literal", explanation: "Integer constant — will become a LOAD_CONST.", color: "text-emerald-400" },
  { value: "↵",       type: "Newline",     explanation: "Ends the logical line.", color: "text-slate-500" },
  { value: "y",       type: "Identifier",  explanation: "Variable name.", color: "text-sky-400" },
  { value: "=",       type: "Assignment",  explanation: "Assignment operator.", color: "text-amber-400" },
  { value: "20",      type: "Int literal", explanation: "Integer constant.", color: "text-emerald-400" },
  { value: "↵",       type: "Newline",     explanation: "Ends the logical line.", color: "text-slate-500" },
  { value: "print",   type: "Builtin",     explanation: "Built-in function that writes to stdout.", color: "text-pink-400" },
  { value: "(",       type: "Delimiter",   explanation: "Opens the call's argument list.", color: "text-slate-400" },
  { value: "x",       type: "Identifier",  explanation: "Reads the value bound to 'x'.", color: "text-sky-400" },
  { value: "+",       type: "Operator",    explanation: "Binary addition — becomes BINARY_ADD.", color: "text-amber-400" },
  { value: "y",       type: "Identifier",  explanation: "Reads the value bound to 'y'.", color: "text-sky-400" },
  { value: ")",       type: "Delimiter",   explanation: "Closes the argument list.", color: "text-slate-400" },
];

const AST_ROOT: ASTNode = {
  name: "Module", kind: "root", order: 0,
  explanation: "The whole file becomes one Module node — the root of the tree.",
  children: [
    {
      name: "Assign", kind: "stmt", order: 1,
      explanation: "Statement: assign a value to a name.",
      children: [
        { name: "Name: x",      kind: "target", order: 2, explanation: "Assignment target — the variable 'x'." },
        { name: "Const: 10",    kind: "value",  order: 3, explanation: "The literal value being assigned." },
      ],
    },
    {
      name: "Assign", kind: "stmt", order: 4,
      explanation: "Second assignment statement.",
      children: [
        { name: "Name: y",      kind: "target", order: 5, explanation: "Assignment target — the variable 'y'." },
        { name: "Const: 20",    kind: "value",  order: 6, explanation: "The literal value being assigned." },
      ],
    },
    {
      name: "Call: print", kind: "stmt", order: 7,
      explanation: "Expression statement: a function call.",
      children: [
        {
          name: "BinOp: +", kind: "expr", order: 8,
          explanation: "The argument is itself an expression — addition gets its own subtree.",
          children: [
            { name: "Name: x", kind: "operand", order: 9,  explanation: "Left operand — looked up in locals at runtime." },
            { name: "Name: y", kind: "operand", order: 10, explanation: "Right operand — looked up in locals at runtime." },
          ],
        },
      ],
    },
  ],
};

const AST_COUNT = 11;

const BYTECODES: Bytecode[] = [
  { op: "LOAD_CONST", arg: "10",  explanation: "Push the constant 10 onto the evaluation stack." },
  { op: "STORE_NAME", arg: "x",   explanation: "Pop the top of stack and bind it to the name 'x'." },
  { op: "LOAD_CONST", arg: "20",  explanation: "Push the constant 20 onto the evaluation stack." },
  { op: "STORE_NAME", arg: "y",   explanation: "Pop the top of stack and bind it to the name 'y'." },
  { op: "LOAD_NAME",  arg: "x",   explanation: "Look up 'x' in locals and push its value (10)." },
  { op: "LOAD_NAME",  arg: "y",   explanation: "Look up 'y' in locals and push its value (20)." },
  { op: "BINARY_ADD", arg: "",    explanation: "Pop two values, add them, push the result (30) back." },
  { op: "CALL print", arg: "",    explanation: "Pop the result and write it to stdout." },
];

// Pipeline phase boundaries (cumulative step counts)
const TOK_END = TOKENS.length;            // 14
const AST_END = TOK_END + AST_COUNT;      // 25
const BC_END  = AST_END + BYTECODES.length; // 33
const VM_END  = BC_END + BYTECODES.length;  // 41

type Phase = "idle" | "tokenize" | "parse" | "compile" | "execute" | "done";

function phaseOf(step: number): Phase {
  if (step <= 0) return "idle";
  if (step <= TOK_END) return "tokenize";
  if (step <= AST_END) return "parse";
  if (step <= BC_END) return "compile";
  if (step < VM_END) return "execute";
  return "done";
}

const PHASE_SPEED: Record<Phase, number> = {
  idle: 250, tokenize: 250, parse: 480, compile: 300, execute: 1200, done: 1000,
};

const PHASES: { id: Phase; label: string; jump: number }[] = [
  { id: "tokenize", label: "1 Tokenize", jump: 0 },
  { id: "parse",    label: "2 Parse",    jump: TOK_END },
  { id: "compile",  label: "3 Compile",  jump: AST_END },
  { id: "execute",  label: "4 Execute",  jump: BC_END },
];

export default function PythonPipelineLab({ learningMode }: { learningMode: "beginner" | "intermediate" | "advanced" | "expert" }) {
  const [step, setStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [tokenHovered, setTokenHovered] = useState<Token | null>(null);

  const phase = phaseOf(step);
  const tokenProgress = Math.min(step, TOK_END);
  const astProgress   = Math.max(0, Math.min(step - TOK_END, AST_COUNT));
  const bcProgress    = Math.max(0, Math.min(step - AST_END, BYTECODES.length));
  const vmProgress    = Math.max(0, Math.min(step - BC_END, BYTECODES.length));

  useEffect(() => {
    if (!isPlaying) return;
    if (step >= VM_END) { setIsPlaying(false); return; }
    const t = setTimeout(() => setStep((s) => s + 1), PHASE_SPEED[phase]);
    return () => clearTimeout(t);
  }, [isPlaying, step, phase]);

  const reset = () => { setStep(0); setIsPlaying(false); };

  // ---- VM state derived from vmProgress ----
  let vmStack: number[] = [];
  const vmScope: Record<string, number> = {};
  let vmStdout: string[] = [];
  for (let i = 0; i < vmProgress; i++) {
    if (i === 0) vmStack = [10];
    else if (i === 1) { vmStack = []; vmScope["x"] = 10; }
    else if (i === 2) { vmStack = [20]; vmScope["x"] = 10; }
    else if (i === 3) { vmStack = []; vmScope["x"] = 10; vmScope["y"] = 20; }
    else if (i === 4) { vmStack = [10]; vmScope["x"] = 10; vmScope["y"] = 20; }
    else if (i === 5) { vmStack = [10, 20]; vmScope["x"] = 10; vmScope["y"] = 20; }
    else if (i === 6) { vmStack = [30]; vmScope["x"] = 10; vmScope["y"] = 20; }
    else if (i === 7) { vmStack = []; vmScope["x"] = 10; vmScope["y"] = 20; vmStdout = ["30"]; }
  }

  // Active source line during execution
  const activeLine = phase === "execute" || phase === "done"
    ? (vmProgress <= 2 ? 1 : vmProgress <= 4 ? 2 : 3)
    : -1;

  // During execution, highlight the AST statement subtree being run
  const execHighlight = (order: number): boolean => {
    if (phase !== "execute") return false;
    if (vmProgress <= 2) return order >= 1 && order <= 3;
    if (vmProgress <= 4) return order >= 4 && order <= 6;
    return order >= 7;
  };

  // ---- "Now happening" explanation ----
  let nowText = "Press Auto Trace to watch your source travel through the full Python pipeline: tokens → syntax tree → bytecode → virtual machine.";
  if (phase === "tokenize" && tokenProgress > 0) {
    const t = TOKENS[tokenProgress - 1];
    nowText = `Tokenizer: read "${t.value === "↵" ? "newline" : t.value}" (${t.type}). ${t.explanation}`;
  } else if (phase === "parse" && astProgress > 0) {
    const flat: ASTNode[] = [];
    const walk = (n: ASTNode) => { flat.push(n); n.children?.forEach(walk); };
    walk(AST_ROOT);
    const node = flat.find((n) => n.order === astProgress - 1);
    if (node) nowText = `Parser: built ${node.name}. ${node.explanation}`;
  } else if (phase === "compile" && bcProgress > 0) {
    const bc = BYTECODES[bcProgress - 1];
    nowText = `Compiler: emitted ${bc.op}${bc.arg ? " " + bc.arg : ""}. ${bc.explanation}`;
  } else if ((phase === "execute" || phase === "done") && vmProgress > 0) {
    const bc = BYTECODES[vmProgress - 1];
    nowText = `VM: executing ${bc.op}${bc.arg ? " " + bc.arg : ""}. ${bc.explanation}`;
  }
  if (phase === "done") nowText = `Pipeline complete — "30" reached stdout. Source became tokens, tokens became a tree, the tree became bytecode, and the VM ran it.`;

  // ---- AST renderer with growth + execution highlight ----
  const renderAST = (node: ASTNode, path = "0"): React.ReactNode => {
    const revealed = astProgress > node.order || phase === "compile" || phase === "execute" || phase === "done";
    const justBuilt = phase === "parse" && astProgress - 1 === node.order;
    const hot = justBuilt || execHighlight(node.order);
    if (!revealed) return null;
    return (
      <motion.div
        key={path}
        initial={{ opacity: 0, y: -8, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center select-none"
      >
        <div
          className={`px-3 py-1.5 rounded-lg border text-center font-mono transition-all duration-300 ${
            hot
              ? "bg-amber-500/15 border-amber-400 shadow-lg shadow-amber-500/10 scale-105"
              : "bg-slate-950 border-slate-800"
          }`}
          title={node.explanation}
        >
          <div className={`text-[11px] font-semibold ${hot ? "text-amber-300" : "text-slate-200"}`}>{node.name}</div>
          <div className="text-[8px] text-slate-600 uppercase mt-0.5">{node.kind}</div>
        </div>
        {node.children && node.children.some((c) => astProgress > c.order || phase !== "parse") && (
          <div className="flex gap-3 mt-5 relative">
            <motion.span
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              className="absolute top-[-20px] left-1/2 w-px h-[20px] bg-slate-700 origin-top"
            />
            {node.children.map((child, i) => renderAST(child, `${path}-${i}`))}
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="flex flex-col gap-4">

      {/* Pipeline phase bar + controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => {
            if (step >= VM_END) setStep(0);
            setIsPlaying((p) => !p);
          }}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-mono font-semibold transition ${
            isPlaying ? "bg-amber-500 text-slate-950 hover:bg-amber-400" : "bg-indigo-600 text-white hover:bg-indigo-500"
          }`}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          {isPlaying ? "Pause" : "Auto Trace"}
        </button>
        <button
          onClick={() => step < VM_END && setStep(step + 1)}
          disabled={isPlaying}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 transition"
        >
          <SkipForward className="w-3.5 h-3.5" />
          Step
        </button>
        <button
          onClick={reset}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono font-semibold bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reset
        </button>

        {/* Phase chips */}
        <div className="flex items-center gap-1 ml-auto bg-slate-900 border border-slate-800 rounded-lg p-1">
          {PHASES.map((p) => (
            <button
              key={p.id}
              onClick={() => { setIsPlaying(false); setStep(p.jump + 1); }}
              className={`px-2.5 py-1 rounded text-[10px] font-mono font-semibold transition ${
                phase === p.id || (phase === "done" && p.id === "execute")
                  ? "bg-indigo-600 text-white"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Now happening */}
      <motion.div
        key={nowText}
        initial={{ opacity: 0.5 }}
        animate={{ opacity: 1 }}
        className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5"
      >
        <p className="text-xs font-mono text-slate-300 leading-relaxed">{nowText}</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* LEFT: source + tokens */}
        <div className="lg:col-span-4 flex flex-col gap-4">

          {/* Source */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800">
              <div className="flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-xs font-mono font-semibold text-slate-400">main.py</span>
              </div>
              <span className="text-[9px] font-mono text-slate-600">fixed demo</span>
            </div>
            <div className="py-2 font-mono text-sm">
              {SOURCE.split("\n").map((txt, idx) => {
                const isCurrent = activeLine === idx + 1;
                return (
                  <div
                    key={idx}
                    className={`flex items-start px-3 py-0.5 ${
                      isCurrent ? "bg-amber-500/12 border-l-2 border-amber-400" : "border-l-2 border-transparent"
                    }`}
                  >
                    <span className={`w-5 text-right shrink-0 text-[11px] pr-3 select-none ${isCurrent ? "text-amber-400" : "text-slate-700"}`}>
                      {idx + 1}
                    </span>
                    <span className={isCurrent ? "text-white font-semibold" : "text-slate-400"}>{txt}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tokens */}
          <div className={`bg-slate-900 border rounded-xl p-4 transition ${phase === "tokenize" ? "border-indigo-500/50" : "border-slate-800"}`}>
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 mb-3">
              <span className="text-xs font-mono font-semibold text-slate-300">Tokens</span>
              <span className="text-[10px] font-mono text-slate-500">{tokenProgress}/{TOKENS.length}</span>
            </div>
            <div className="flex flex-wrap gap-1.5 min-h-[64px]">
              <AnimatePresence>
                {TOKENS.slice(0, Math.max(tokenProgress, phase !== "idle" && phase !== "tokenize" ? TOKENS.length : 0)).map((tok, idx) => {
                  const justRead = phase === "tokenize" && idx === tokenProgress - 1;
                  return (
                    <motion.button
                      key={idx}
                      initial={{ opacity: 0, scale: 0.6, y: -6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      onMouseEnter={() => setTokenHovered(tok)}
                      onMouseLeave={() => setTokenHovered(null)}
                      className={`px-2 py-1 rounded text-[11px] font-mono border cursor-help transition ${
                        justRead
                          ? "bg-amber-500/15 border-amber-400 text-amber-300 font-bold"
                          : `bg-slate-950 border-slate-800 ${tok.color}`
                      }`}
                    >
                      {tok.value}
                    </motion.button>
                  );
                })}
              </AnimatePresence>
              {step === 0 && (
                <span className="text-[10px] font-mono text-slate-700 italic self-center">Tokens will stream in here…</span>
              )}
            </div>
            <div className="mt-3 pt-2 border-t border-slate-800 min-h-[36px]">
              {tokenHovered ? (
                <p className="text-[11px] font-mono text-slate-400 leading-relaxed">
                  <span className={`font-bold ${tokenHovered.color}`}>{tokenHovered.type}</span> — {tokenHovered.explanation}
                </p>
              ) : (
                <p className="text-[10px] font-mono text-slate-700 italic">hover a token to inspect it</p>
              )}
            </div>
          </div>

        </div>

        {/* RIGHT: AST + bytecode + VM */}
        <div className="lg:col-span-8 flex flex-col gap-4">

          {/* AST */}
          <div className={`bg-slate-900 border rounded-xl p-4 transition ${phase === "parse" ? "border-indigo-500/50" : "border-slate-800"}`}>
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 mb-3">
              <span className="text-xs font-mono font-semibold text-slate-300">Abstract Syntax Tree</span>
              <span className="text-[10px] font-mono text-slate-500">{astProgress > 0 || phase === "compile" || phase === "execute" || phase === "done" ? `${phase === "parse" ? astProgress : AST_COUNT}/${AST_COUNT} nodes` : "waiting for tokens"}</span>
            </div>
            <div className="flex items-center justify-center py-5 bg-slate-950 rounded-lg border border-slate-800 overflow-x-auto min-h-[210px]">
              {step > TOK_END ? (
                renderAST(AST_ROOT)
              ) : (
                <span className="text-[11px] font-mono text-slate-700 italic">The parser grows the tree here, node by node, once tokenizing finishes.</span>
              )}
            </div>
          </div>

          {/* Bytecode + VM */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Bytecode */}
            <div className={`bg-slate-900 border rounded-xl p-4 flex flex-col h-[300px] transition ${phase === "compile" ? "border-indigo-500/50" : "border-slate-800"}`}>
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 mb-3">
                <span className="text-xs font-mono font-semibold text-slate-300">Bytecode</span>
                <span className="text-[10px] font-mono text-slate-500">
                  {bcProgress > 0 || phase === "execute" || phase === "done" ? `${phase === "compile" ? bcProgress : BYTECODES.length} instructions` : "waiting for AST"}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-1 font-mono text-xs pr-1">
                {step <= AST_END && (
                  <p className="text-[10px] font-mono text-slate-700 italic pt-2">The compiler walks the finished tree and emits flat instructions here.</p>
                )}
                <AnimatePresence>
                  {BYTECODES.slice(0, phase === "compile" ? bcProgress : step > AST_END ? BYTECODES.length : 0).map((bc, idx) => {
                    const emitted = phase === "compile" && idx === bcProgress - 1;
                    const executing = (phase === "execute" || phase === "done") && idx === vmProgress - 1;
                    const ran = (phase === "execute" || phase === "done") && idx < vmProgress - 1;
                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`px-2.5 py-1.5 rounded-lg border flex justify-between items-center transition ${
                          executing || emitted
                            ? "bg-amber-500/15 border-amber-400 text-amber-300 font-bold"
                            : ran
                            ? "bg-slate-950 border-emerald-900/40 text-emerald-400/60"
                            : "bg-slate-950 border-slate-800 text-slate-500"
                        }`}
                      >
                        <span>
                          <span className="text-slate-700 mr-2">{String(idx * 2).padStart(2, "0")}</span>
                          {bc.op}
                        </span>
                        <span className="text-slate-500">{bc.arg}</span>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>

            {/* VM */}
            <div className={`bg-slate-900 border rounded-xl p-4 flex flex-col h-[300px] gap-3 transition ${phase === "execute" ? "border-indigo-500/50" : "border-slate-800"}`}>
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                <span className="text-xs font-mono font-semibold text-slate-300">Virtual Machine</span>
                <span className="text-[10px] font-mono text-slate-500">{vmProgress > 0 ? `step ${vmProgress}/${BYTECODES.length}` : "waiting for bytecode"}</span>
              </div>

              {/* Evaluation stack */}
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 flex-1 flex flex-col min-h-0">
                <span className="text-[9px] font-mono text-slate-600 uppercase mb-1.5">Evaluation stack</span>
                <div className="flex-1 flex flex-col-reverse justify-start gap-1 overflow-hidden">
                  {vmStack.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-[10px] font-mono text-slate-700 italic">empty</div>
                  ) : (
                    <AnimatePresence>
                      {vmStack.map((val, idx) => (
                        <motion.div
                          key={`${idx}-${val}`}
                          layout
                          initial={{ opacity: 0, y: -10, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.85 }}
                          className="py-1 px-3 bg-indigo-600/80 border border-indigo-400/40 rounded text-center text-white text-xs font-mono font-bold"
                        >
                          {val}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  )}
                </div>
              </div>

              {/* Locals */}
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5">
                <span className="text-[9px] font-mono text-slate-600 uppercase block mb-1">Locals</span>
                {Object.keys(vmScope).length === 0 ? (
                  <span className="text-[10px] font-mono text-slate-700 italic">no names bound yet</span>
                ) : (
                  Object.entries(vmScope).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-[11px] font-mono py-0.5">
                      <span className="text-sky-300">{k}</span>
                      <span className="text-emerald-400">→ {v}</span>
                    </div>
                  ))
                )}
              </div>

              {/* stdout */}
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5">
                <span className="text-[9px] font-mono text-slate-600 uppercase mb-1 flex items-center gap-1">
                  <Terminal className="w-3 h-3" /> stdout
                </span>
                {vmStdout.length === 0 ? (
                  <span className="text-[10px] font-mono text-slate-700 italic">waiting on print…</span>
                ) : (
                  vmStdout.map((l, i) => (
                    <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs font-mono text-emerald-400">
                      › {l}
                    </motion.div>
                  ))
                )}
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
