/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Hammer, Lock, Unlock, GitFork, Repeat, Shapes, Play, RefreshCw, ShieldAlert, CheckCircle, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

type SubTab = "objects" | "encapsulation" | "inheritance" | "polymorphism" | "abstraction";

const SUB_TABS: { id: SubTab; label: string; icon: React.ReactNode }[] = [
  { id: "objects",       label: "Classes & Objects", icon: <Hammer className="w-3 h-3" /> },
  { id: "encapsulation", label: "Encapsulation",     icon: <Lock className="w-3 h-3" /> },
  { id: "inheritance",   label: "Inheritance",       icon: <GitFork className="w-3 h-3" /> },
  { id: "polymorphism",  label: "Polymorphism",      icon: <Repeat className="w-3 h-3" /> },
  { id: "abstraction",   label: "Abstraction",       icon: <Shapes className="w-3 h-3" /> },
];

/* ---------- shared bits ---------- */

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-[11px] leading-relaxed text-slate-300 overflow-x-auto whitespace-pre">
      {code}
    </pre>
  );
}

function Insight({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-lg px-3 py-2">
      <p className="text-[11px] font-mono text-indigo-200 leading-relaxed">{children}</p>
    </div>
  );
}

/* ---------- Tab 1: Classes & Objects ---------- */

interface StudentInstance { id: string; name: string; score: number; }

const gradeOf = (s: number) => (s >= 90 ? "A" : s >= 80 ? "B" : s >= 70 ? "C" : "F");

function ObjectsTab() {
  const [instances, setInstances] = useState<StudentInstance[]>([
    { id: "i1", name: "Alex", score: 85 },
    { id: "i2", name: "Sam", score: 92 },
  ]);
  const [name, setName] = useState("Luna");
  const [score, setScore] = useState(74);

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
      <div className="md:col-span-4 flex flex-col gap-3">
        <CodeBlock code={`class Student:\n    school = "Hilltop High"   # class attr\n\n    def __init__(self, name, score):\n        self.name = name      # instance attr\n        self.score = score\n\n    def grade(self):\n        return "A" if self.score >= 90 ...`} />
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2.5">
          <div>
            <label className="text-[10px] font-mono text-slate-500 block mb-1">name</label>
            <input value={name} onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-100 outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="text-[10px] font-mono text-slate-500 block mb-1">score (0–100)</label>
            <input type="number" min={0} max={100} value={score} onChange={(e) => setScore(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-100 outline-none focus:border-indigo-500" />
          </div>
          <button
            onClick={() => name && setInstances([...instances, { id: `i${Date.now()}`, name, score }])}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-semibold rounded-lg flex items-center justify-center gap-1.5 transition"
          >
            <Hammer className="w-3.5 h-3.5" />
            Student("{name}", {score})
          </button>
        </div>
        <Insight>
          One blueprint, many objects. Methods and class attributes are stored ONCE on the class object — each instance only stores its own data and points back to the class.
        </Insight>
      </div>

      <div className="md:col-span-8 bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col gap-4 min-h-[320px]">
        {/* class object */}
        <div className="mx-auto bg-slate-900 border border-pink-500/40 rounded-xl p-3 font-mono min-w-[220px]">
          <div className="flex justify-between items-center text-[9px] border-b border-slate-800 pb-1 mb-1.5">
            <span className="text-pink-400 font-bold">0xClass500</span>
            <span className="text-slate-500">class Student</span>
          </div>
          <div className="text-[10px] space-y-0.5 text-slate-300">
            <div className="flex justify-between gap-6"><span>school:</span><span className="text-amber-300">"Hilltop High"</span></div>
            <div className="flex justify-between gap-6"><span>__init__:</span><span className="text-sky-300">&lt;function&gt;</span></div>
            <div className="flex justify-between gap-6"><span>grade:</span><span className="text-sky-300">&lt;function&gt;</span></div>
          </div>
        </div>

        <div className="text-center text-[9px] font-mono text-slate-600">▲ every instance's methods are looked up here ▲</div>

        {/* instances */}
        <div className="flex flex-wrap justify-center gap-3">
          <AnimatePresence mode="popLayout">
            {instances.map((ins, idx) => (
              <motion.div
                key={ins.id} layout
                initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
                className="bg-slate-900 border border-slate-800 rounded-xl p-3 font-mono min-w-[170px] relative"
              >
                <button
                  onClick={() => setInstances(instances.filter((i) => i.id !== ins.id))}
                  className="absolute top-1.5 right-2 text-[9px] text-slate-600 hover:text-red-400 font-bold transition"
                >
                  del
                </button>
                <div className="flex justify-between items-center text-[9px] border-b border-slate-800 pb-1 mb-1.5 pr-6">
                  <span className="text-indigo-400 font-bold">0x8a9{1000 + idx * 32}</span>
                  <span className="text-emerald-400">Student</span>
                </div>
                <div className="text-[10px] space-y-0.5 text-slate-300">
                  <div className="flex justify-between gap-4"><span>name:</span><span className="text-amber-300">"{ins.name}"</span></div>
                  <div className="flex justify-between gap-4"><span>score:</span><span className="text-sky-300">{ins.score}</span></div>
                  <div className="flex justify-between gap-4"><span>.grade():</span><span className="text-emerald-400 font-bold">"{gradeOf(ins.score)}"</span></div>
                  <div className="flex justify-between gap-4 pt-1 border-t border-slate-800/60"><span className="text-slate-600">__class__:</span><span className="text-pink-400">→ 0xClass500</span></div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* ---------- Tab 2: Encapsulation ---------- */

function EncapsulationTab() {
  const [balance, setBalance] = useState(100);
  const [log, setLog] = useState<{ ok: boolean; text: string }[]>([]);
  const [flash, setFlash] = useState<"ok" | "err" | null>(null);

  const push = (ok: boolean, text: string) => {
    setLog((l) => [...l.slice(-5), { ok, text }]);
    setFlash(ok ? "ok" : "err");
    setTimeout(() => setFlash(null), 600);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
      <div className="md:col-span-5 flex flex-col gap-3">
        <CodeBlock code={`class BankAccount:\n    def __init__(self):\n        self.__balance = 100   # private!\n\n    def deposit(self, amount):\n        if amount > 0:\n            self.__balance += amount\n\n    def withdraw(self, amount):\n        if amount <= self.__balance:\n            self.__balance -= amount\n        else:\n            return "DENIED"\n\n    def get_balance(self):\n        return self.__balance`} />
        <Insight>
          Encapsulation = state is private, behavior is public. Nobody can set the balance to −1000 from outside; every change must pass through methods that enforce the rules.
        </Insight>
      </div>

      <div className="md:col-span-7 flex flex-col gap-3">
        {/* object visual */}
        <div className={`bg-slate-950 border rounded-xl p-5 flex flex-col items-center gap-3 transition-colors duration-300 ${
          flash === "err" ? "border-red-500/60" : flash === "ok" ? "border-emerald-500/60" : "border-slate-800"
        }`}>
          <div className="text-[10px] font-mono text-slate-500">account : BankAccount @ 0x8a92F00</div>
          <div className="relative">
            <div className="bg-slate-900 border border-red-500/30 rounded-xl px-6 py-4 font-mono text-center">
              <Lock className="w-4 h-4 text-red-400 mx-auto mb-1.5" />
              <div className="text-[10px] text-slate-500">__balance (private)</div>
              <motion.div key={balance} initial={{ scale: 1.3, color: "#fbbf24" }} animate={{ scale: 1, color: "#f0f6fc" }} className="text-xl font-bold">
                ${balance}
              </motion.div>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <button onClick={() => push(false, `account.__balance  →  AttributeError! Python name-mangles it to _BankAccount__balance to keep you out.`)}
              className="px-3 py-1.5 bg-slate-900 hover:bg-red-500/10 border border-red-500/30 text-red-300 rounded-lg text-[11px] font-mono transition">
              account.__balance
            </button>
            <button onClick={() => { setBalance((b) => b + 50); push(true, "deposit(50) — passed the amount > 0 check. Balance updated through the public interface."); }}
              className="px-3 py-1.5 bg-slate-900 hover:bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-lg text-[11px] font-mono transition">
              .deposit(50)
            </button>
            <button onClick={() => {
              if (40 <= balance) { setBalance((b) => b - 40); push(true, "withdraw(40) — guard passed, state changed safely."); }
              else push(false, "withdraw(40) → DENIED. The object protected its own invariants.");
            }}
              className="px-3 py-1.5 bg-slate-900 hover:bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-lg text-[11px] font-mono transition">
              .withdraw(40)
            </button>
            <button onClick={() => push(false, `withdraw(99999) → DENIED. The method checked the rules and refused — that's the whole point of hiding state.`)}
              className="px-3 py-1.5 bg-slate-900 hover:bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-lg text-[11px] font-mono transition">
              .withdraw(99999)
            </button>
            <button onClick={() => push(true, `get_balance() → ${balance}. Reading is allowed — through the method the class chose to expose.`)}
              className="px-3 py-1.5 bg-slate-900 hover:bg-sky-500/10 border border-sky-500/30 text-sky-300 rounded-lg text-[11px] font-mono transition">
              .get_balance()
            </button>
          </div>
        </div>

        {/* log */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 min-h-[110px]">
          <span className="text-[9px] font-mono text-slate-600 uppercase block mb-2">access log</span>
          {log.length === 0 ? (
            <p className="text-[10px] font-mono text-slate-700 italic">try the buttons — watch which calls the object allows</p>
          ) : (
            <div className="space-y-1">
              <AnimatePresence>
                {log.map((l, i) => (
                  <motion.div key={i + l.text} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                    className="flex items-start gap-1.5 text-[11px] font-mono leading-relaxed">
                    {l.ok ? <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" /> : <ShieldAlert className="w-3 h-3 text-red-400 shrink-0 mt-0.5" />}
                    <span className={l.ok ? "text-slate-300" : "text-red-300"}>{l.text}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Tab 3: Inheritance (animated method lookup / MRO) ---------- */

const METHODS: Record<string, { onDog: boolean; result: string }> = {
  "fetch()": { onDog: true,  result: `"brings the ball back"` },
  "speak()": { onDog: true,  result: `"Woof!"  (Dog OVERRIDES Animal.speak)` },
  "eat()":   { onDog: false, result: `"nom nom"  (inherited from Animal)` },
};

function InheritanceTab() {
  const [calling, setCalling] = useState<string | null>(null);
  const [lookupStage, setLookupStage] = useState(0); // 0 idle, 1 instance, 2 Dog, 3 Animal/found
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    if (!calling) return;
    const m = METHODS[calling];
    const maxStage = m.onDog ? 2 : 3;
    if (lookupStage < maxStage) {
      const t = setTimeout(() => setLookupStage((s) => s + 1), 650);
      return () => clearTimeout(t);
    }
    setResult(m.result);
  }, [calling, lookupStage]);

  const call = (method: string) => {
    setCalling(method);
    setLookupStage(1);
    setResult(null);
  };

  const m = calling ? METHODS[calling] : null;
  const foundOnDog = m?.onDog ?? false;

  const nodeCls = (active: boolean, found: boolean) =>
    `rounded-xl border px-4 py-3 font-mono transition-all duration-300 ${
      found ? "bg-emerald-500/10 border-emerald-400 shadow-lg shadow-emerald-500/10"
      : active ? "bg-amber-500/10 border-amber-400"
      : "bg-slate-900 border-slate-800"
    }`;

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
      <div className="md:col-span-5 flex flex-col gap-3">
        <CodeBlock code={`class Animal:\n    def eat(self):\n        return "nom nom"\n    def speak(self):\n        return "..."\n\nclass Dog(Animal):      # Dog IS-A Animal\n    def speak(self):    # override\n        return "Woof!"\n    def fetch(self):\n        return "brings the ball back"\n\nrex = Dog()`} />
        <div className="flex flex-wrap gap-2">
          {Object.keys(METHODS).map((method) => (
            <button key={method} onClick={() => call(method)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-mono font-semibold transition">
              rex.{method}
            </button>
          ))}
        </div>
        <Insight>
          When you call a method, Python walks UP the chain (the MRO): instance → its class → parent class — and uses the first match. An override wins because Dog is checked before Animal.
        </Insight>
      </div>

      <div className="md:col-span-7 bg-slate-950 border border-slate-800 rounded-xl p-5 flex flex-col items-center gap-1 min-h-[340px]">
        {/* Animal */}
        <div className={nodeCls(lookupStage >= 3, lookupStage >= 3 && !foundOnDog)}>
          <div className="text-[9px] text-slate-500 mb-1">class — checked {lookupStage >= 3 ? "3rd" : "last"}</div>
          <div className="text-xs font-bold text-slate-100">Animal</div>
          <div className="text-[10px] text-slate-400 mt-1">eat() · speak()</div>
          {lookupStage >= 3 && !foundOnDog && <div className="text-[10px] text-emerald-400 font-bold mt-1">✓ found eat() here</div>}
        </div>
        <motion.div animate={{ opacity: lookupStage >= 3 ? 1 : 0.3 }} className="text-slate-600 text-xs font-mono py-0.5">▲ inherits</motion.div>
        {/* Dog */}
        <div className={nodeCls(lookupStage >= 2, lookupStage >= 2 && foundOnDog)}>
          <div className="text-[9px] text-slate-500 mb-1">class — checked 2nd</div>
          <div className="text-xs font-bold text-slate-100">Dog(Animal)</div>
          <div className="text-[10px] text-slate-400 mt-1">speak() ← override · fetch()</div>
          {lookupStage >= 2 && foundOnDog && <div className="text-[10px] text-emerald-400 font-bold mt-1">✓ found {calling} here</div>}
          {lookupStage >= 3 && !foundOnDog && <div className="text-[10px] text-red-400 mt-1">✗ {calling} not here — go up</div>}
        </div>
        <motion.div animate={{ opacity: lookupStage >= 2 ? 1 : 0.3 }} className="text-slate-600 text-xs font-mono py-0.5">▲ __class__</motion.div>
        {/* instance */}
        <div className={nodeCls(lookupStage >= 1, false)}>
          <div className="text-[9px] text-slate-500 mb-1">instance — checked 1st</div>
          <div className="text-xs font-bold text-slate-100">rex @ 0x8a92A10</div>
          <div className="text-[10px] text-slate-400 mt-1">only data, no methods</div>
        </div>

        <div className="mt-4 min-h-[36px] text-center">
          {result ? (
            <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="text-xs font-mono text-emerald-300">
              rex.{calling} → {result}
            </motion.p>
          ) : calling ? (
            <p className="text-[11px] font-mono text-amber-300 animate-pulse">looking up {calling} …</p>
          ) : (
            <p className="text-[10px] font-mono text-slate-700 italic">call a method to watch the lookup climb the hierarchy</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Tab 4: Polymorphism (animated dispatch loop) ---------- */

const SPEAKERS = [
  { cls: "Dog",   sound: "Woof!",  color: "text-amber-300" },
  { cls: "Cat",   sound: "Meow!",  color: "text-pink-300" },
  { cls: "Duck",  sound: "Quack!", color: "text-emerald-300" },
  { cls: "Robot", sound: "ERROR",  color: "text-red-400" },
];

function PolymorphismTab() {
  const [runIdx, setRunIdx] = useState(-1);
  const [outputs, setOutputs] = useState<string[]>([]);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    if (runIdx >= SPEAKERS.length - 1) { setRunning(false); return; }
    const t = setTimeout(() => {
      const next = runIdx + 1;
      setRunIdx(next);
      const s = SPEAKERS[next];
      setOutputs((o) => [...o, s.cls === "Robot"
        ? `Robot has no speak() → AttributeError! Polymorphism needs each type to answer the same call.`
        : `${s.cls}.speak() → "${s.sound}"`]);
    }, 900);
    return () => clearTimeout(t);
  }, [running, runIdx]);

  const run = () => { setRunIdx(-1); setOutputs([]); setRunning(true); };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
      <div className="md:col-span-5 flex flex-col gap-3">
        <CodeBlock code={`animals = [Dog(), Cat(), Duck(), Robot()]\n\nfor animal in animals:\n    animal.speak()   # ONE call site\n                     # FOUR behaviors`} />
        <button onClick={run} disabled={running}
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-mono font-semibold transition">
          <Play className="w-3.5 h-3.5 fill-current" />
          Run the loop
        </button>
        <Insight>
          Polymorphism: the SAME line of code — animal.speak() — does something different for each type. The caller doesn't check types; each object brings its own behavior. (And Robot shows the contract matters!)
        </Insight>
      </div>

      <div className="md:col-span-7 flex flex-col gap-3">
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-wrap justify-center gap-3 min-h-[140px] items-center">
          {SPEAKERS.map((s, idx) => {
            const active = runIdx === idx && running;
            const done = runIdx >= idx;
            return (
              <motion.div key={s.cls}
                animate={active ? { scale: 1.08, y: -4 } : { scale: 1, y: 0 }}
                className={`rounded-xl border px-4 py-3 font-mono text-center transition-colors min-w-[90px] ${
                  active ? "bg-amber-500/10 border-amber-400" : done ? "bg-slate-900 border-slate-700" : "bg-slate-900 border-slate-800 opacity-60"
                }`}
              >
                <div className="text-xs font-bold text-slate-100">{s.cls}()</div>
                <div className={`text-[11px] mt-1 font-bold ${done ? s.color : "text-slate-700"}`}>
                  {done ? (s.cls === "Robot" ? "✗ no speak()" : `"${s.sound}"`) : "?"}
                </div>
              </motion.div>
            );
          })}
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 min-h-[120px]">
          <span className="text-[9px] font-mono text-slate-600 uppercase block mb-2">stdout</span>
          {outputs.length === 0 ? (
            <p className="text-[10px] font-mono text-slate-700 italic">run the loop — same call, different answers</p>
          ) : (
            outputs.map((o, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                className={`text-[11px] font-mono leading-relaxed ${o.includes("Error") ? "text-red-300" : "text-slate-300"}`}>
                › {o}
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Tab 5: Abstraction ---------- */

interface ShapeInst { id: string; cls: "Circle" | "Square"; param: number; area: string; }

function AbstractionTab() {
  const [shapes, setShapes] = useState<ShapeInst[]>([]);
  const [error, setError] = useState(false);

  const tryShape = () => { setError(true); setTimeout(() => setError(false), 1200); };
  const addCircle = () => setShapes((s) => [...s, { id: `c${Date.now()}`, cls: "Circle", param: 3, area: (Math.PI * 9).toFixed(2) }]);
  const addSquare = () => setShapes((s) => [...s, { id: `s${Date.now()}`, cls: "Square", param: 4, area: "16" }]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
      <div className="md:col-span-5 flex flex-col gap-3">
        <CodeBlock code={`from abc import ABC, abstractmethod\n\nclass Shape(ABC):          # abstract\n    @abstractmethod\n    def area(self): ...    # contract only\n\nclass Circle(Shape):\n    def __init__(self, r): self.r = r\n    def area(self): return 3.14 * self.r**2\n\nclass Square(Shape):\n    def __init__(self, s): self.s = s\n    def area(self): return self.s**2`} />
        <div className="flex flex-wrap gap-2">
          <motion.button onClick={tryShape}
            animate={error ? { x: [0, -6, 6, -4, 4, 0] } : {}}
            className="px-3 py-1.5 bg-slate-900 border border-red-500/30 text-red-300 hover:bg-red-500/10 rounded-lg text-[11px] font-mono transition">
            Shape()
          </motion.button>
          <button onClick={addCircle} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-mono font-semibold transition">
            Circle(r=3)
          </button>
          <button onClick={addSquare} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-mono font-semibold transition">
            Square(s=4)
          </button>
          <button onClick={() => setShapes([])} className="px-3 py-1.5 bg-slate-900 border border-slate-800 text-slate-500 hover:text-slate-300 rounded-lg text-[11px] font-mono transition">
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-[11px] font-mono text-red-300 flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5 shrink-0" />
            TypeError: Can't instantiate abstract class Shape — it's a contract, not a thing.
          </motion.div>
        )}
        <Insight>
          Abstraction: define WHAT something must do (every Shape has an area), hide HOW. Callers can compute area() on any shape without knowing which formula runs underneath.
        </Insight>
      </div>

      <div className="md:col-span-7 bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col gap-3 min-h-[300px]">
        <div className="mx-auto bg-slate-900 border border-dashed border-pink-500/40 rounded-xl px-5 py-3 font-mono text-center">
          <Shapes className="w-4 h-4 text-pink-400 mx-auto mb-1" />
          <div className="text-xs font-bold text-slate-100">Shape (abstract)</div>
          <div className="text-[10px] text-slate-500 mt-0.5">area() — must be implemented</div>
          <div className="text-[9px] text-red-400/80 mt-1">cannot be instantiated</div>
        </div>
        <div className="flex flex-wrap justify-center gap-3 flex-1 items-start pt-2">
          <AnimatePresence mode="popLayout">
            {shapes.length === 0 && (
              <p className="text-[10px] font-mono text-slate-700 italic self-center">instantiate Circle or Square — concrete classes that fulfil the contract</p>
            )}
            {shapes.map((sh) => (
              <motion.div key={sh.id} layout
                initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
                className="bg-slate-900 border border-slate-800 rounded-xl p-3 font-mono text-center min-w-[120px]"
              >
                <div className="flex justify-center mb-1.5">
                  {sh.cls === "Circle"
                    ? <span className="w-8 h-8 rounded-full border-2 border-indigo-400 block" />
                    : <span className="w-8 h-8 border-2 border-emerald-400 block" />}
                </div>
                <div className="text-xs font-bold text-slate-100">{sh.cls}({sh.cls === "Circle" ? `r=${sh.param}` : `s=${sh.param}`})</div>
                <div className="text-[10px] text-slate-400 mt-1">.area() → <span className="text-amber-300 font-bold">{sh.area}</span></div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* ---------- main ---------- */

export default function OOPFactoryLab() {
  const [subTab, setSubTab] = useState<SubTab>("objects");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1 overflow-x-auto scrollbar-none">
        {SUB_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold whitespace-nowrap transition shrink-0 ${
              subTab === t.id ? "bg-slate-950 text-white border border-slate-700 shadow" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={subTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
        >
          {subTab === "objects" && <ObjectsTab />}
          {subTab === "encapsulation" && <EncapsulationTab />}
          {subTab === "inheritance" && <InheritanceTab />}
          {subTab === "polymorphism" && <PolymorphismTab />}
          {subTab === "abstraction" && <AbstractionTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
