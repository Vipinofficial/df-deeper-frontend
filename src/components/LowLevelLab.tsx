/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { Cpu, Binary } from "lucide-react";
import { motion } from "motion/react";
import { usePlayer, PlayerBar, Narration, LabInsight, SubTabBar } from "./labShared";

type SubTab = "cpu" | "bit";

/* ---------------- CPU fetch–decode–execute ---------------- */

interface CpuStep {
  pc: number;
  regA: number | null;
  regB: number | null;
  acc: number | null;
  ramOut: number | null;
  busy: "ram-read" | "alu" | "ram-write" | null;
  note: string;
}

function buildCpuTrace(a: number, b: number): CpuStep[] {
  const sum = a + b;
  return [
    { pc: 0, regA: a,    regB: null, acc: null, ramOut: null, busy: "ram-read",  note: `FETCH instruction 0, DECODE it as a load, EXECUTE: copy ${a} from RAM 0x1001 across the bus into Register A.` },
    { pc: 1, regA: a,    regB: b,    acc: null, ramOut: null, busy: "ram-read",  note: `Instruction 1: load ${b} from RAM 0x1002 into Register B. Each round trip to RAM is ~100× slower than touching a register.` },
    { pc: 2, regA: a,    regB: b,    acc: sum,  ramOut: null, busy: "alu",       note: `Instruction 2: the ALU reads both registers, adds them in one clock cycle, and latches ${a} + ${b} = ${sum} into the accumulator.` },
    { pc: 3, regA: a,    regB: b,    acc: sum,  ramOut: sum,  busy: "ram-write", note: `Instruction 3: write the accumulator (${sum}) back to RAM 0x1003. The result now survives outside the CPU.` },
    { pc: 4, regA: null, regB: null, acc: null, ramOut: sum,  busy: null,        note: `Program done. Registers are scratch space — they were cleared, but RAM keeps ${sum}. This fetch→decode→execute loop is ALL a CPU ever does, billions of times per second.` },
  ];
}

const INSTRUCTIONS = ["LOAD A, [0x1001]", "LOAD B, [0x1002]", "ADD A, B → ACC", "STORE ACC, [0x1003]"];

function Cell({ label, value, hot, color = "text-white" }: { label: string; value: React.ReactNode; hot?: boolean; color?: string }) {
  return (
    <div className={`bg-slate-950 border rounded-lg p-2 text-center transition-colors ${hot ? "border-amber-400" : "border-slate-800"}`}>
      <div className="text-[9px] font-mono text-slate-600">{label}</div>
      <motion.div key={String(value)} initial={{ scale: 1.25, opacity: 0.5 }} animate={{ scale: 1, opacity: 1 }} className={`text-sm font-mono font-bold ${color}`}>
        {value}
      </motion.div>
    </div>
  );
}

function CpuTab() {
  const [ramA, setRamA] = useState(12);
  const [ramB, setRamB] = useState(8);
  const trace = useMemo(() => buildCpuTrace(ramA, ramB), [ramA, ramB]);
  const player = usePlayer(trace.length, 1400);
  const s = player.idx >= 0 ? trace[player.idx] : null;

  return (
    <div className="flex flex-col gap-4">
      <PlayerBar
        player={player}
        extra={
          <div className="flex items-center gap-2 ml-auto">
            {[["0x1001", ramA, setRamA], ["0x1002", ramB, setRamB]].map(([addr, val, set]: any) => (
              <div key={addr} className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded-lg">
                <span className="text-[10px] font-mono text-slate-500">{addr}</span>
                <input
                  type="number" value={val}
                  onChange={(e) => { player.reset(); set(Number(e.target.value) || 0); }}
                  className="w-12 bg-transparent text-xs font-mono text-slate-100 outline-none"
                />
              </div>
            ))}
          </div>
        }
      />
      <Narration text={s ? s.note : "A CPU only does one thing: fetch an instruction, decode it, execute it, repeat. Press Run to add two numbers the way silicon actually does it."} />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Program */}
        <div className="md:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 mb-3">
            <span className="text-xs font-mono font-semibold text-slate-300">Program</span>
            <span className="text-[10px] font-mono text-slate-500">PC = {s ? s.pc : 0}</span>
          </div>
          <div className="space-y-1 font-mono text-xs">
            {INSTRUCTIONS.map((ins, idx) => {
              const active = s !== null && s.pc === idx;
              const done = s !== null && s.pc > idx;
              return (
                <div
                  key={idx}
                  className={`px-2.5 py-1.5 rounded-lg border flex items-center gap-2 transition ${
                    active ? "bg-amber-500/15 border-amber-400 text-amber-300 font-bold"
                    : done ? "bg-slate-950 border-emerald-900/40 text-emerald-400/60"
                    : "bg-slate-950 border-slate-800 text-slate-500"
                  }`}
                >
                  {active && <span className="text-[9px] bg-amber-400 text-slate-950 px-1 rounded font-bold">PC</span>}
                  <span className="text-slate-700">{idx}</span>
                  {ins}
                </div>
              );
            })}
          </div>
          <LabInsight>
            The Program Counter (PC) is just a register holding the address of the NEXT instruction. Loops and ifs are nothing but writes to the PC.
          </LabInsight>
        </div>

        {/* RAM */}
        <div className={`md:col-span-4 bg-slate-900 border rounded-xl p-4 transition ${s?.busy === "ram-read" || s?.busy === "ram-write" ? "border-sky-500/50" : "border-slate-800"}`}>
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 mb-3">
            <span className="text-xs font-mono font-semibold text-slate-300">RAM</span>
            <span className="text-[10px] font-mono text-sky-400">~100ns away</span>
          </div>
          <div className="space-y-2">
            <Cell label="0x1001" value={ramA} hot={s?.pc === 0 && s.busy === "ram-read"} />
            <Cell label="0x1002" value={ramB} hot={s?.pc === 1 && s.busy === "ram-read"} />
            <Cell label="0x1003 (result)" value={s?.ramOut ?? "?"} hot={s?.busy === "ram-write"} color={s?.ramOut != null ? "text-emerald-400" : "text-slate-600"} />
          </div>
          <div className="text-center text-[9px] font-mono text-slate-600 mt-3">
            {s?.busy === "ram-read" ? "→ value travelling over the bus to the CPU →" : s?.busy === "ram-write" ? "← result travelling back over the bus ←" : "— memory bus idle —"}
          </div>
        </div>

        {/* CPU */}
        <div className={`md:col-span-4 bg-slate-900 border rounded-xl p-4 transition ${s?.busy === "alu" ? "border-amber-500/50" : "border-slate-800"}`}>
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 mb-3">
            <span className="text-xs font-mono font-semibold text-slate-300">CPU</span>
            <span className="text-[10px] font-mono text-amber-400">~0.3ns per cycle</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Cell label="Register A" value={s?.regA ?? "—"} hot={s?.pc === 0} color="text-sky-300" />
            <Cell label="Register B" value={s?.regB ?? "—"} hot={s?.pc === 1} color="text-pink-300" />
          </div>
          <div className={`mt-2 rounded-lg border p-3 text-center transition ${s?.busy === "alu" ? "bg-amber-500/10 border-amber-400" : "bg-slate-950 border-slate-800"}`}>
            <div className="text-[9px] font-mono text-slate-600 mb-1">ALU (arithmetic logic unit)</div>
            <motion.div key={String(s?.acc)} initial={{ scale: 1.2 }} animate={{ scale: 1 }} className="text-sm font-mono font-bold text-amber-300">
              {s?.acc != null ? `${s.regA} + ${s.regB} = ${s.acc}` : "idle"}
            </motion.div>
          </div>
          <div className="mt-2">
            <Cell label="Accumulator" value={s?.acc ?? "—"} hot={s?.busy === "alu"} color="text-emerald-300" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Bit-level lab ---------------- */

const toBits = (n: number) => (n >>> 0).toString(2).padStart(4, "0").slice(-4);

const OP_HINTS: Record<string, string> = {
  "&": "AND — result bit is 1 only when BOTH input bits are 1. Used for masking bits off.",
  "|": "OR — result bit is 1 when EITHER input bit is 1. Used for setting bits on.",
  "^": "XOR — result bit is 1 when the inputs DIFFER. Used for toggling and checksums.",
  "<<": "Left shift — every bit slides one place left; a 0 enters on the right. Same as ×2.",
  ">>": "Right shift — every bit slides one place right; the lowest bit falls off. Same as ÷2 (integer).",
};

function BitTab() {
  const [a, setA] = useState(5);
  const [b, setB] = useState(3);
  const [op, setOp] = useState<"&" | "|" | "^" | "<<" | ">>">("&");
  const [hoverCol, setHoverCol] = useState<number | null>(null);

  const isShift = op === "<<" || op === ">>";
  const result = op === "&" ? a & b : op === "|" ? a | b : op === "^" ? a ^ b : op === "<<" ? (a << 1) & 15 : a >> 1;
  const aBits = toBits(a), bBits = toBits(b), rBits = toBits(result);

  const bitCell = (bit: string, palette: string, col: number) => (
    <motion.span
      key={`${col}-${bit}-${palette}`}
      initial={{ scale: 1.2, opacity: 0.5 }}
      animate={{ scale: 1, opacity: 1 }}
      onMouseEnter={() => setHoverCol(col)}
      onMouseLeave={() => setHoverCol(null)}
      className={`w-9 h-9 rounded-lg border flex items-center justify-center font-mono text-sm font-bold cursor-help transition ${
        hoverCol === col ? "ring-1 ring-amber-400 " : ""
      }${bit === "1" ? palette : "bg-slate-950 border-slate-800 text-slate-700"}`}
    >
      {bit}
    </motion.span>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded-lg">
          <span className="text-[10px] font-mono text-slate-500">A</span>
          <input type="number" min={0} max={15} value={a}
            onChange={(e) => setA(Math.min(15, Math.max(0, Number(e.target.value) || 0)))}
            className="w-10 bg-transparent text-xs font-mono text-sky-300 outline-none" />
        </div>
        {!isShift && (
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded-lg">
            <span className="text-[10px] font-mono text-slate-500">B</span>
            <input type="number" min={0} max={15} value={b}
              onChange={(e) => setB(Math.min(15, Math.max(0, Number(e.target.value) || 0)))}
              className="w-10 bg-transparent text-xs font-mono text-pink-300 outline-none" />
          </div>
        )}
        <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-0.5 gap-0.5">
          {(["&", "|", "^", "<<", ">>"] as const).map((o) => (
            <button key={o} onClick={() => setOp(o)}
              className={`px-3 py-1.5 rounded text-xs font-mono font-bold transition ${op === o ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-300"}`}>
              {o}
            </button>
          ))}
        </div>
      </div>

      <Narration text={OP_HINTS[op]} />

      <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 flex flex-col items-center gap-3">
        <div className="grid grid-cols-[70px_repeat(4,2.25rem)_90px] gap-2 items-center font-mono text-xs">
          <span className="text-sky-300 text-right pr-1">A = {a}</span>
          {aBits.split("").map((bit, i) => bitCell(bit, "bg-sky-500/20 border-sky-500 text-sky-300", i))}
          <span />

          <span className="text-slate-400 text-right pr-1 text-base">{op}</span>
          {isShift
            ? [0, 1, 2, 3].map((i) => (
                <span key={i} className="w-9 h-9 flex items-center justify-center text-slate-600 text-lg">
                  {op === "<<" ? "←" : "→"}
                </span>
              ))
            : bBits.split("").map((bit, i) => bitCell(bit, "bg-pink-500/20 border-pink-500 text-pink-300", i))}
          <span className="text-[9px] text-slate-600">{isShift ? "by 1 place" : ""}</span>

          <span className="text-slate-700 col-span-6 border-t border-slate-800 h-0 my-1" />

          <span className="text-emerald-300 text-right pr-1">= {result}</span>
          {rBits.split("").map((bit, i) => bitCell(bit, "bg-emerald-500/20 border-emerald-500 text-emerald-300", i))}
          <span />
        </div>

        <div className="min-h-[20px] text-center">
          {hoverCol !== null && !isShift ? (
            <span className="text-[11px] font-mono text-amber-300">
              column {hoverCol}: {aBits[hoverCol]} {op} {bBits[hoverCol]} = {rBits[hoverCol]}
            </span>
          ) : (
            <span className="text-[10px] font-mono text-slate-700 italic">
              {isShift ? `${a} ${op} 1 = ${result} — shifting is how CPUs multiply and divide by powers of two for free` : "hover a column to see that single gate's truth"}
            </span>
          )}
        </div>
      </div>

      <LabInsight>
        Every bit column is an independent physical circuit of transistors — a logic gate. A 64-bit AND is just 64 of these gates firing at once in a single clock tick.
      </LabInsight>
    </div>
  );
}

/* ---------------- main ---------------- */

export default function LowLevelLab() {
  const [tab, setTab] = useState<SubTab>("cpu");
  return (
    <div className="flex flex-col gap-4">
      <SubTabBar
        tabs={[
          { id: "cpu", label: "Fetch–Decode–Execute", icon: <Cpu className="w-3 h-3" /> },
          { id: "bit", label: "Bits & Logic Gates",   icon: <Binary className="w-3 h-3" /> },
        ]}
        active={tab}
        onSelect={setTab}
      />
      {tab === "cpu" && <CpuTab />}
      {tab === "bit" && <BitTab />}
    </div>
  );
}
