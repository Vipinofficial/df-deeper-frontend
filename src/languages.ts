/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StackVariable, HeapObject } from "./types";

export type Language = "python" | "c" | "cpp" | "java" | "nodejs";

export interface TraceStep {
  line: number;
  stack: StackVariable[];
  heap: { [addr: string]: HeapObject };
  stdout: string[];
  explanation: string;
}

export const LANGUAGES: { id: Language; label: string; fileName: string; sample: string }[] = [
  {
    id: "python",
    label: "Python",
    fileName: "source.py",
    sample: `# Double Mutation Laboratory\nitems = [100, 200]\nalias_ref = items\nalias_ref.append(300)\nalias_ref[0] = 999\nprint(items)\n`,
  },
  {
    id: "c",
    label: "C",
    fileName: "main.c",
    sample: `// Manual memory in C\nint x = 42;\nint a[] = {10, 20, 30};\nint *p = &x;\n*p = 99;\nint *h = malloc(8);\nprintf("%d\\n", x);\nfree(h);\n`,
  },
  {
    id: "cpp",
    label: "C++",
    fileName: "main.cpp",
    sample: `// Value semantics in C++\nstd::vector<int> v = {1, 2};\nauto w = v;\nv.push_back(3);\nint* p = new int(5);\nstd::cout << "v has 3 items" << std::endl;\ndelete p;\n`,
  },
  {
    id: "java",
    label: "Java",
    fileName: "Main.java",
    sample: `// References in Java\nint x = 42;\nint[] a = {10, 20};\nint[] b = a;\na[0] = 99;\nString name = "Duke";\nSystem.out.println(x);\nb = null;\n`,
  },
  {
    id: "nodejs",
    label: "Node.js",
    fileName: "app.js",
    sample: `// Object references in JS\nlet x = 42;\nlet list = [10, 20];\nlet alias = list;\nalias.push(30);\nlist[0] = 99;\nconsole.log(list);\nlist = null;\n`,
  },
];

export function getLanguageMeta(lang: Language) {
  return LANGUAGES.find((l) => l.id === lang) ?? LANGUAGES[0];
}

/* ---------------- shared tracer machinery ---------------- */

interface Ctx {
  stack: StackVariable[];
  heap: { [addr: string]: HeapObject };
  out: string[];
  steps: TraceStep[];
  hc: number;
  // C/C++ helpers: pointer-to-stack targets and stack-resident arrays
  ptrTargets: Record<string, string>;
  cArrays: Record<string, (number | string)[]>;
}

const newCtx = (): Ctx => ({ stack: [], heap: {}, out: [], steps: [], hc: 1000, ptrTargets: {}, cArrays: {} });

const stackAddr = () => `0x7fff${Math.floor(Math.random() * 90000 + 10000)}`;

function alloc(ctx: Ctx, type: HeapObject["type"], value: any, label?: string): string {
  const addr = `0xHeap${ctx.hc}`;
  ctx.hc += 16;
  ctx.heap[addr] = { address: addr, type, value, refCount: 1, highlighted: false, label };
  return addr;
}

function find(ctx: Ctx, name: string) {
  return ctx.stack.find((s) => s.name === name);
}

/** Decrement a heap ref; delete when it hits 0. Returns an explanation suffix. */
function dropRef(ctx: Ctx, addr: string): string {
  const obj = ctx.heap[addr];
  if (!obj) return "";
  obj.refCount -= 1;
  if (obj.refCount <= 0) {
    delete ctx.heap[addr];
    return ` Ref count hit 0 — object at ${addr} was freed.`;
  }
  return ` Ref count of ${addr} is now ${obj.refCount}.`;
}

/** Remove a variable, dropping its heap ref if it was a pointer. */
function removeVar(ctx: Ctx, name: string): string {
  const sv = find(ctx, name);
  let suffix = "";
  if (sv?.isPointer && sv.pointsTo) suffix = dropRef(ctx, sv.pointsTo);
  ctx.stack = ctx.stack.filter((s) => s.name !== name);
  return suffix;
}

function setPrim(ctx: Ctx, name: string, value: string) {
  removeVar(ctx, name);
  ctx.stack.push({ address: stackAddr(), name, value, isPointer: false, pointsTo: null, scope: "global" });
}

function setPtr(ctx: Ctx, name: string, addr: string) {
  removeVar(ctx, name);
  ctx.stack.push({ address: stackAddr(), name, value: addr, isPointer: true, pointsTo: addr, scope: "global" });
}

function record(ctx: Ctx, line: number, explanation: string) {
  ctx.steps.push({
    line,
    stack: JSON.parse(JSON.stringify(ctx.stack)),
    heap: JSON.parse(JSON.stringify(ctx.heap)),
    stdout: [...ctx.out],
    explanation,
  });
}

/** Resolve simple arithmetic after substituting non-pointer variables. */
function safeEval(ctx: Ctx, expr: string): string {
  let resolved = expr.trim();
  ctx.stack.forEach((v) => {
    if (!v.isPointer) resolved = resolved.replace(new RegExp(`\\b${v.name}\\b`, "g"), v.value);
  });
  try {
    if (/^[0-9+\-*/()\s.]+$/.test(resolved)) return String(Function(`"use strict";return (${resolved})`)());
  } catch {}
  return expr.trim();
}

const parseItems = (s: string) =>
  s.split(",").map((it) => it.trim()).filter(Boolean).map((it) => (isNaN(Number(it)) ? it.replace(/^["']|["']$/g, "") : Number(it)));

/* ---------------- Python ---------------- */

function tracePython(code: string): TraceStep[] {
  const ctx = newCtx();
  const lines = code.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i].trim();
    if (!ln || ln.startsWith("#")) {
      record(ctx, i, "Comments and empty lines are skipped.");
      continue;
    }

    let exp = `Executing: "${ln}"`;
    let m: RegExpMatchArray | null;

    if ((m = ln.match(/^([a-zA-Z_]\w*)\[\s*(.+)\s*\]\s*=\s*(.+)$/))) {
      const sv = find(ctx, m[1]);
      const idx = parseInt(safeEval(ctx, m[2]));
      const val = safeEval(ctx, m[3]);
      if (sv?.isPointer && sv.pointsTo && ctx.heap[sv.pointsTo]?.type === "list" && !isNaN(idx)) {
        const arr = [...ctx.heap[sv.pointsTo].value];
        if (idx < arr.length) {
          arr[idx] = Number(val) || val;
          ctx.heap[sv.pointsTo].value = arr;
          exp = `Heap mutation: replaced index [${idx}] of '${m[1]}' with '${val}'. All aliases see the change instantly.`;
        }
      }
    } else if ((m = ln.match(/^([a-zA-Z_]\w*)\.append\((.+)\)$/))) {
      const sv = find(ctx, m[1]);
      const val = safeEval(ctx, m[2].trim());
      if (sv?.isPointer && sv.pointsTo && ctx.heap[sv.pointsTo]?.type === "list") {
        ctx.heap[sv.pointsTo].value = [...ctx.heap[sv.pointsTo].value, Number(val) || val];
        exp = `Heap append: added '${val}' to list '${m[1]}'. The heap block grows dynamically.`;
      }
    } else if ((m = ln.match(/^([a-zA-Z_]\w*)\s*=\s*None$/))) {
      const suffix = removeVar(ctx, m[1]);
      exp = `GC: '${m[1]}' set to None.${suffix || " Variable removed from the stack."}`;
    } else if ((m = ln.match(/^([a-zA-Z_]\w*)\s*=\s*\[\s*([^\]]*)\s*\]$/))) {
      const addr = alloc(ctx, "list", parseItems(m[2]));
      setPtr(ctx, m[1], addr);
      exp = `Heap alloc: list [${parseItems(m[2]).join(", ")}] at ${addr} — pointer '${m[1]}' pushed to stack.`;
    } else if ((m = ln.match(/^([a-zA-Z_]\w*)\s*=\s*\{\s*([^}]*)\s*\}$/))) {
      const addr = alloc(ctx, "dict", ln.substring(ln.indexOf("{")));
      setPtr(ctx, m[1], addr);
      exp = `Heap alloc: dict at ${addr} — reference '${m[1]}' stored on stack.`;
    } else if ((m = ln.match(/^([a-zA-Z_]\w*)\s*=\s*([a-zA-Z_]\w*)$/))) {
      const origin = find(ctx, m[2]);
      if (origin) {
        if (origin.isPointer && origin.pointsTo) {
          removeVar(ctx, m[1]);
          ctx.heap[origin.pointsTo].refCount += 1;
          ctx.stack.push({ address: stackAddr(), name: m[1], value: origin.pointsTo, isPointer: true, pointsTo: origin.pointsTo, scope: "global" });
          exp = `Pointer alias: '${m[1]}' now points to '${m[2]}''s address (${origin.pointsTo}). Ref count → ${ctx.heap[origin.pointsTo].refCount}. No new allocation!`;
        } else {
          setPrim(ctx, m[1], origin.value);
          exp = `Value copy: copied primitive '${origin.value}' from '${m[2]}' to '${m[1]}'.`;
        }
      }
    } else if ((m = ln.match(/^print\((.+)\)$/))) {
      const expr = m[1].trim();
      const sv = find(ctx, expr);
      let val = expr;
      if (sv) {
        val = sv.isPointer && sv.pointsTo ? JSON.stringify(ctx.heap[sv.pointsTo]?.value) : sv.value;
      } else {
        const lit = expr.match(/^(["'])(.*)\1$/);
        if (lit) val = lit[2];
      }
      ctx.out.push(val);
      exp = `stdout: printed "${val}".`;
    } else if ((m = ln.match(/^([a-zA-Z_]\w*)\s*=\s*(["'])(.*)\2$/))) {
      setPrim(ctx, m[1], m[3]);
      exp = `Stack alloc: string "${m[3]}" stored in '${m[1]}'.`;
    } else if ((m = ln.match(/^([a-zA-Z_]\w*)\s*=\s*(.+)$/))) {
      const val = safeEval(ctx, m[2]);
      setPrim(ctx, m[1], val);
      exp = `Stack alloc: '${m[2]}' → '${val}' pushed to stack as '${m[1]}'.`;
    }

    record(ctx, i, exp);
  }
  return ctx.steps;
}

/* ---------------- C ---------------- */

const C_SKIP = [/^\/\//, /^#include/, /^int\s+main/, /^[{}]$/, /^return\b/, /^\/\*/];

function traceC(code: string): TraceStep[] {
  const ctx = newCtx();
  const lines = code.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i].trim();
    if (!ln || C_SKIP.some((r) => r.test(ln))) {
      record(ctx, i, "Structural line (comment / include / braces) — nothing allocated.");
      continue;
    }

    let exp = `Executing: "${ln}"`;
    let m: RegExpMatchArray | null;

    if ((m = ln.match(/^(?:int|float|double|long|char)\s*\*\s*(\w+)\s*=\s*.*malloc\s*\((.+)\)\s*;$/))) {
      const addr = alloc(ctx, "object", `raw block (${m[2].trim()} bytes)`, "malloc'd — YOU must free this");
      setPtr(ctx, m[1], addr);
      exp = `Heap alloc: malloc reserved ${m[2].trim()} bytes at ${addr}. C will NEVER free this automatically — you must call free().`;
    } else if ((m = ln.match(/^free\s*\(\s*(\w+)\s*\)\s*;$/))) {
      const sv = find(ctx, m[1]);
      if (sv?.isPointer && sv.pointsTo && ctx.heap[sv.pointsTo]) {
        delete ctx.heap[sv.pointsTo];
        sv.isPointer = false;
        sv.pointsTo = null;
        sv.value = "dangling!";
        exp = `Manual free: heap block released. '${m[1]}' is now a DANGLING pointer — using it is undefined behavior.`;
      }
    } else if ((m = ln.match(/^(?:int|float|double|char)\s+(\w+)\s*\[\s*\]\s*=\s*\{(.*)\}\s*;$/))) {
      const items = parseItems(m[2]);
      ctx.cArrays[m[1]] = items;
      setPrim(ctx, m[1], `[${items.join(", ")}]`);
      exp = `Stack array: in C, '${m[1]}' is a contiguous block INSIDE the stack frame — not the heap. It dies when the function returns.`;
    } else if ((m = ln.match(/^(?:int|float|double|long|char)\s*\*\s*(\w+)\s*=\s*&\s*(\w+)\s*;$/))) {
      const target = find(ctx, m[2]);
      if (target) {
        ctx.ptrTargets[m[1]] = m[2];
        setPrim(ctx, m[1], `&${m[2]} (${target.address})`);
        exp = `Address-of: '${m[1]}' stores the stack address of '${m[2]}' (${target.address}). Pointers are just numbers!`;
      }
    } else if ((m = ln.match(/^\*\s*(\w+)\s*=\s*([^;]+);$/))) {
      const targetName = ctx.ptrTargets[m[1]];
      const target = targetName ? find(ctx, targetName) : undefined;
      if (target) {
        const val = safeEval(ctx, m[2]);
        target.value = val;
        exp = `Dereference write: *${m[1]} reached through the pointer and overwrote '${targetName}' with ${val} — without naming it.`;
      }
    } else if ((m = ln.match(/^(\w+)\[(\d+)\]\s*=\s*([^;]+);$/))) {
      const arr = ctx.cArrays[m[1]];
      const idx = parseInt(m[2]);
      if (arr && idx < arr.length) {
        arr[idx] = Number(safeEval(ctx, m[3])) || safeEval(ctx, m[3]);
        const sv = find(ctx, m[1]);
        if (sv) sv.value = `[${arr.join(", ")}]`;
        exp = `Stack write: ${m[1]}[${idx}] sits at a fixed offset inside the stack frame — updated in place.`;
      }
    } else if ((m = ln.match(/^printf\s*\(\s*"([^"]*)"\s*(?:,\s*(\w+)\s*)?\)\s*;$/))) {
      let val = m[1].replace(/\\n/g, "");
      if (m[2]) {
        const sv = find(ctx, m[2]);
        if (sv) val = sv.value;
      }
      ctx.out.push(val);
      exp = `stdout: printf wrote "${val}".`;
    } else if ((m = ln.match(/^char\s*\*?\s*(\w+)(?:\[\])?\s*=\s*"(.*)"\s*;$/))) {
      setPrim(ctx, m[1], m[2]);
      exp = `Stack alloc: string "${m[2]}" — in real C this points to a read-only literal segment.`;
    } else if ((m = ln.match(/^(?:int|float|double|long)\s+(\w+)\s*=\s*([^;]+);$/))) {
      const val = safeEval(ctx, m[2]);
      setPrim(ctx, m[1], val);
      exp = `Stack alloc: '${m[1]}' = ${val}, a fixed-size slot in the current stack frame.`;
    } else if ((m = ln.match(/^(\w+)\s*=\s*([^;]+);$/))) {
      const val = safeEval(ctx, m[2]);
      const sv = find(ctx, m[1]);
      if (sv && !sv.isPointer) {
        sv.value = val;
        exp = `Stack write: overwrote '${m[1]}' with ${val} in place — same address, new bits.`;
      }
    }

    record(ctx, i, exp);
  }
  return ctx.steps;
}

/* ---------------- C++ ---------------- */

const CPP_SKIP = [/^\/\//, /^#include/, /^int\s+main/, /^[{}]$/, /^return\b/, /^using\s+namespace/];

function traceCpp(code: string): TraceStep[] {
  const ctx = newCtx();
  const lines = code.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i].trim();
    if (!ln || CPP_SKIP.some((r) => r.test(ln))) {
      record(ctx, i, "Structural line (comment / include / braces) — nothing allocated.");
      continue;
    }

    let exp = `Executing: "${ln}"`;
    let m: RegExpMatchArray | null;

    if ((m = ln.match(/^(?:std::)?vector<\w+>\s+(\w+)\s*=?\s*\{(.*)\}\s*;$/))) {
      const items = parseItems(m[2]);
      const addr = alloc(ctx, "list", items, "managed by std::vector");
      setPtr(ctx, m[1], addr);
      exp = `Heap alloc: std::vector '${m[1]}' manages a heap buffer at ${addr} — freed automatically when it goes out of scope (RAII).`;
    } else if ((m = ln.match(/^auto\s+(\w+)\s*=\s*(\w+)\s*;$/))) {
      const origin = find(ctx, m[2]);
      if (origin?.isPointer && origin.pointsTo && ctx.heap[origin.pointsTo]) {
        const src = ctx.heap[origin.pointsTo];
        const addr = alloc(ctx, src.type, JSON.parse(JSON.stringify(src.value)), "deep copy");
        setPtr(ctx, m[1], addr);
        exp = `VALUE SEMANTICS: unlike Python/Java, C++ copies! '${m[1]}' got a brand-new heap buffer at ${addr}. Mutating '${m[2]}' won't touch it.`;
      } else if (origin) {
        setPrim(ctx, m[1], origin.value);
        exp = `Value copy: '${m[1]}' = ${origin.value}.`;
      }
    } else if ((m = ln.match(/^(\w+)\.push_back\((.+)\)\s*;$/))) {
      const sv = find(ctx, m[1]);
      const val = safeEval(ctx, m[2]);
      if (sv?.isPointer && sv.pointsTo && ctx.heap[sv.pointsTo]?.type === "list") {
        ctx.heap[sv.pointsTo].value = [...ctx.heap[sv.pointsTo].value, Number(val) || val];
        exp = `Heap append: push_back added ${val}. If capacity was exceeded, the vector reallocated its whole buffer.`;
      }
    } else if ((m = ln.match(/^(?:int|float|double)\s*\*\s*(\w+)\s*=\s*new\s+\w+\s*\((.+)\)\s*;$/))) {
      const addr = alloc(ctx, "primitive", safeEval(ctx, m[2]), "new'd — delete me");
      setPtr(ctx, m[1], addr);
      exp = `Heap alloc: 'new' placed ${safeEval(ctx, m[2])} on the heap at ${addr}. Forgetting 'delete' = memory leak.`;
    } else if ((m = ln.match(/^delete\s+(\w+)\s*;$/))) {
      const sv = find(ctx, m[1]);
      if (sv?.isPointer && sv.pointsTo && ctx.heap[sv.pointsTo]) {
        delete ctx.heap[sv.pointsTo];
        sv.isPointer = false;
        sv.pointsTo = null;
        sv.value = "dangling!";
        exp = `Manual delete: heap object destroyed. '${m[1]}' now dangles — touching it is undefined behavior.`;
      }
    } else if ((m = ln.match(/^(?:std::)?cout\s*<<\s*(.+?)(?:\s*<<\s*(?:std::)?endl)?\s*;$/))) {
      const expr = m[1].trim();
      const lit = expr.match(/^"(.*)"$/);
      let val = expr;
      if (lit) val = lit[1];
      else {
        const sv = find(ctx, expr);
        if (sv) val = sv.isPointer && sv.pointsTo ? JSON.stringify(ctx.heap[sv.pointsTo]?.value) : sv.value;
      }
      ctx.out.push(val);
      exp = `stdout: cout streamed "${val}".`;
    } else if ((m = ln.match(/^(?:int|float|double|long)\s+(\w+)\s*=\s*([^;]+);$/))) {
      const val = safeEval(ctx, m[2]);
      setPrim(ctx, m[1], val);
      exp = `Stack alloc: '${m[1]}' = ${val} in the current stack frame.`;
    }

    record(ctx, i, exp);
  }
  return ctx.steps;
}

/* ---------------- Java ---------------- */

const JAVA_SKIP = [/^\/\//, /^public\s+class/, /^public\s+static/, /^[{}]$/, /^import\b/];

function traceJava(code: string): TraceStep[] {
  const ctx = newCtx();
  const lines = code.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i].trim();
    if (!ln || JAVA_SKIP.some((r) => r.test(ln))) {
      record(ctx, i, "Structural line (comment / class / braces) — nothing allocated.");
      continue;
    }

    let exp = `Executing: "${ln}"`;
    let m: RegExpMatchArray | null;

    if ((m = ln.match(/^\w+\[\]\s+(\w+)\s*=\s*\{(.*)\}\s*;$/))) {
      const items = parseItems(m[2]);
      const addr = alloc(ctx, "list", items);
      setPtr(ctx, m[1], addr);
      exp = `Heap alloc: Java arrays are ALWAYS heap objects. '${m[1]}' holds a reference to ${addr}.`;
    } else if ((m = ln.match(/^String\s+(\w+)\s*=\s*"(.*)"\s*;$/))) {
      const addr = alloc(ctx, "string", m[2], "interned in the String pool");
      setPtr(ctx, m[1], addr);
      exp = `Heap alloc: Strings are objects in Java. '${m[1]}' references "${m[2]}" at ${addr}.`;
    } else if ((m = ln.match(/^(\w+)\s*=\s*null\s*;$/))) {
      const suffix = removeVar(ctx, m[1]);
      exp = `'${m[1]}' = null.${suffix || ""} The JVM's garbage collector will reclaim unreachable objects on its own schedule.`;
    } else if ((m = ln.match(/^(?:\w+\[\]\s+)?(\w+)\s*=\s*(\w+)\s*;$/)) && find(ctx, m[2])) {
      const origin = find(ctx, m[2])!;
      if (origin.isPointer && origin.pointsTo) {
        removeVar(ctx, m[1]);
        ctx.heap[origin.pointsTo].refCount += 1;
        ctx.stack.push({ address: stackAddr(), name: m[1], value: origin.pointsTo, isPointer: true, pointsTo: origin.pointsTo, scope: "global" });
        exp = `Reference copy: '${m[1]}' and '${m[2]}' now point to the SAME heap object (${origin.pointsTo}). Java never copies objects on assignment.`;
      } else {
        setPrim(ctx, m[1], origin.value);
        exp = `Primitive copy: '${m[1]}' got its own copy of ${origin.value}.`;
      }
    } else if ((m = ln.match(/^(\w+)\[(\d+)\]\s*=\s*([^;]+);$/))) {
      const sv = find(ctx, m[1]);
      const idx = parseInt(m[2]);
      const val = safeEval(ctx, m[3]);
      if (sv?.isPointer && sv.pointsTo && ctx.heap[sv.pointsTo]?.type === "list") {
        const arr = [...ctx.heap[sv.pointsTo].value];
        if (idx < arr.length) {
          arr[idx] = Number(val) || val;
          ctx.heap[sv.pointsTo].value = arr;
          exp = `Heap mutation: ${m[1]}[${idx}] = ${val}. Every reference to this array sees the new value.`;
        }
      }
    } else if ((m = ln.match(/^System\.out\.println\((.+)\)\s*;$/))) {
      const expr = m[1].trim();
      const lit = expr.match(/^"(.*)"$/);
      let val = expr;
      if (lit) val = lit[1];
      else {
        const sv = find(ctx, expr);
        if (sv) val = sv.isPointer && sv.pointsTo ? JSON.stringify(ctx.heap[sv.pointsTo]?.value) : sv.value;
      }
      ctx.out.push(val);
      exp = `stdout: println wrote "${val}".`;
    } else if ((m = ln.match(/^(?:int|double|float|long|boolean|char)\s+(\w+)\s*=\s*([^;]+);$/))) {
      const val = safeEval(ctx, m[2]);
      setPrim(ctx, m[1], val);
      exp = `Stack alloc: primitive '${m[1]}' = ${val} lives directly in the stack frame — no object involved.`;
    }

    record(ctx, i, exp);
  }
  return ctx.steps;
}

/* ---------------- Node.js / JavaScript ---------------- */

function traceNode(code: string): TraceStep[] {
  const ctx = newCtx();
  const lines = code.split("\n");

  const assign = (name: string, rhs: string, declared: boolean): string => {
    const r = rhs.trim().replace(/;$/, "");
    let m: RegExpMatchArray | null;
    if (r === "null" || r === "undefined") {
      const suffix = removeVar(ctx, name);
      return `'${name}' = ${r}.${suffix || ""} V8's garbage collector reclaims unreachable objects automatically.`;
    }
    if ((m = r.match(/^\[\s*(.*)\s*\]$/))) {
      const items = parseItems(m[1]);
      const addr = alloc(ctx, "list", items);
      setPtr(ctx, name, addr);
      return `Heap alloc: array [${items.join(", ")}] at ${addr} — '${name}' holds a reference, not the data.`;
    }
    if ((m = r.match(/^\{(.*)\}$/))) {
      const addr = alloc(ctx, "dict", r);
      setPtr(ctx, name, addr);
      return `Heap alloc: object literal at ${addr} — '${name}' references it.`;
    }
    if ((m = r.match(/^(["'`])(.*)\1$/))) {
      setPrim(ctx, name, m[2]);
      return `Stack alloc: string "${m[2]}" stored in '${name}'.`;
    }
    if ((m = r.match(/^([a-zA-Z_$]\w*)$/)) && find(ctx, m[1])) {
      const origin = find(ctx, m[1])!;
      if (origin.isPointer && origin.pointsTo) {
        removeVar(ctx, name);
        ctx.heap[origin.pointsTo].refCount += 1;
        ctx.stack.push({ address: stackAddr(), name, value: origin.pointsTo, isPointer: true, pointsTo: origin.pointsTo, scope: "global" });
        return `Reference copy: '${name}' points to the SAME object as '${m[1]}' (${origin.pointsTo}). JS never clones objects on assignment.`;
      }
      setPrim(ctx, name, origin.value);
      return `Value copy: primitive ${origin.value} copied into '${name}'.`;
    }
    const val = safeEval(ctx, r);
    setPrim(ctx, name, val);
    return `Stack alloc: '${r}' → ${val}, stored in '${name}'${declared ? "" : " (reassigned in place)"}.`;
  };

  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i].trim();
    if (!ln || ln.startsWith("//")) {
      record(ctx, i, "Comments and empty lines are skipped.");
      continue;
    }

    let exp = `Executing: "${ln}"`;
    let m: RegExpMatchArray | null;

    if ((m = ln.match(/^(\w+)\.push\((.+)\)\s*;?$/))) {
      const sv = find(ctx, m[1]);
      const val = safeEval(ctx, m[2]);
      if (sv?.isPointer && sv.pointsTo && ctx.heap[sv.pointsTo]?.type === "list") {
        ctx.heap[sv.pointsTo].value = [...ctx.heap[sv.pointsTo].value, Number(val) || val];
        exp = `Heap append: push added ${val} to the array at ${sv.pointsTo}. Every alias sees it.`;
      }
    } else if ((m = ln.match(/^(\w+)\[(\d+)\]\s*=\s*(.+?);?$/))) {
      const sv = find(ctx, m[1]);
      const idx = parseInt(m[2]);
      const val = safeEval(ctx, m[3]);
      if (sv?.isPointer && sv.pointsTo && ctx.heap[sv.pointsTo]?.type === "list") {
        const arr = [...ctx.heap[sv.pointsTo].value];
        if (idx < arr.length) {
          arr[idx] = Number(val) || val;
          ctx.heap[sv.pointsTo].value = arr;
          exp = `Heap mutation: ${m[1]}[${idx}] = ${val} — visible through every reference to this array.`;
        }
      }
    } else if ((m = ln.match(/^console\.log\((.+)\)\s*;?$/))) {
      const expr = m[1].trim();
      const lit = expr.match(/^(["'`])(.*)\1$/);
      let val = expr;
      if (lit) val = lit[2];
      else {
        const sv = find(ctx, expr);
        if (sv) val = sv.isPointer && sv.pointsTo ? JSON.stringify(ctx.heap[sv.pointsTo]?.value) : sv.value;
      }
      ctx.out.push(val);
      exp = `stdout: console.log printed "${val}".`;
    } else if ((m = ln.match(/^(?:let|const|var)\s+([a-zA-Z_$]\w*)\s*=\s*(.+?);?$/))) {
      exp = assign(m[1], m[2], true);
    } else if ((m = ln.match(/^([a-zA-Z_$]\w*)\s*=\s*(.+?);?$/))) {
      exp = assign(m[1], m[2], false);
    }

    record(ctx, i, exp);
  }
  return ctx.steps;
}

/* ---------------- dispatcher ---------------- */

export function traceProgram(language: Language, code: string): TraceStep[] {
  switch (language) {
    case "c": return traceC(code);
    case "cpp": return traceCpp(code);
    case "java": return traceJava(code);
    case "nodejs": return traceNode(code);
    case "python":
    default: return tracePython(code);
  }
}
