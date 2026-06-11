/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Shield, Globe, RefreshCcw, Terminal } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { usePlayer, PlayerBar, Narration, LabInsight, SubTabBar } from "./labShared";

type SubTab = "os" | "network" | "async";

/* ---------------- OS system calls ---------------- */

interface OsStep {
  zone: "user" | "kernel";
  label: string;
  fd3: string | null;
  stdout: string[];
  note: string;
}

const OS_TRACE: OsStep[] = [
  { zone: "user",   label: 'fd = open("file.txt")', fd3: null,       stdout: [], note: 'Your program calls open("file.txt") — but user-space code is NOT allowed to touch the disk. It can only ask.' },
  { zone: "kernel", label: "TRAP → SYS_open",        fd3: null,       stdout: [], note: "A trap instruction switches the CPU into kernel mode. Your program is frozen; the OS takes over." },
  { zone: "kernel", label: "permissions ✓ · FD[3]",  fd3: "file.txt", stdout: [], note: "The kernel checks permissions, finds the file on disk, and records it in this process's file-descriptor table at slot 3." },
  { zone: "user",   label: "return fd = 3",          fd3: "file.txt", stdout: [], note: "Control returns to user space. Your program receives just the number 3 — a ticket, not the file itself." },
  { zone: "kernel", label: "read(3) → SYS_read",     fd3: "file.txt", stdout: [], note: "read(fd) traps into the kernel again. The kernel uses slot 3 to find the open file and copies bytes from disk into your buffer." },
  { zone: "user",   label: '"Hello from disk!"',     fd3: "file.txt", stdout: ["Hello from disk!"], note: "The data lands in your program's memory and gets printed. Every file/network/screen interaction works exactly like this." },
  { zone: "kernel", label: "close(3) → SYS_close",   fd3: null,       stdout: ["Hello from disk!"], note: "close(fd) frees slot 3 in the kernel's table. Forgetting this leaks file descriptors — a real bug in real servers." },
];

function OsTab() {
  const player = usePlayer(OS_TRACE.length, 1500);
  const s = player.idx >= 0 ? OS_TRACE[player.idx] : null;

  return (
    <div className="flex flex-col gap-4">
      <PlayerBar player={player} />
      <Narration text={s ? s.note : "Programs can't touch hardware directly — they ask the OS kernel through system calls. Press Run to open, read, and close a file the real way."} />

      <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
        <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-stretch">
          {/* User space */}
          <div className={`rounded-xl border p-4 transition ${s?.zone === "user" ? "border-indigo-500/60 bg-indigo-500/5" : "border-slate-800 bg-slate-900/50"}`}>
            <div className="text-[10px] font-mono text-indigo-400 font-bold mb-2">USER SPACE — unprivileged</div>
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-xs text-slate-300">
              app.py
              <div className="text-[10px] text-slate-500 mt-1">can compute, can't touch hardware</div>
            </div>
            <div className="mt-3 bg-slate-950 border border-slate-800 rounded-lg p-2.5">
              <span className="text-[9px] font-mono text-slate-600 uppercase flex items-center gap-1"><Terminal className="w-3 h-3" /> stdout</span>
              {s && s.stdout.length > 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs font-mono text-emerald-400 mt-1">› {s.stdout[0]}</motion.div>
              ) : (
                <div className="text-[10px] font-mono text-slate-700 italic mt-1">no output yet</div>
              )}
            </div>
          </div>

          {/* Boundary */}
          <div className="flex flex-col items-center justify-center gap-2 w-28">
            <div className="text-[8px] font-mono text-red-400/80 uppercase tracking-wide text-center">protection<br />boundary</div>
            <div className="relative h-32 w-px bg-gradient-to-b from-transparent via-red-500/50 to-transparent">
              {s && (
                <motion.div
                  key={player.idx}
                  initial={{ x: s.zone === "kernel" ? -44 : 44, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.55 }}
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 left-1/2"
                >
                  <span className={`block px-2 py-1 rounded-md border text-[9px] font-mono font-bold whitespace-nowrap ${
                    s.zone === "kernel" ? "bg-amber-500/15 border-amber-400 text-amber-300" : "bg-emerald-500/15 border-emerald-400 text-emerald-300"
                  }`}>
                    {s.label}
                  </span>
                </motion.div>
              )}
            </div>
            <Shield className="w-4 h-4 text-red-400/60" />
          </div>

          {/* Kernel space */}
          <div className={`rounded-xl border p-4 transition ${s?.zone === "kernel" ? "border-amber-500/60 bg-amber-500/5" : "border-slate-800 bg-slate-900/50"}`}>
            <div className="text-[10px] font-mono text-amber-400 font-bold mb-2">KERNEL SPACE — full hardware access</div>
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
              <span className="text-[9px] font-mono text-slate-600 uppercase block mb-1.5">file descriptor table</span>
              <div className="space-y-1 font-mono text-[11px]">
                <div className="flex justify-between text-slate-400"><span>FD[0]</span><span>stdin</span></div>
                <div className="flex justify-between text-slate-400"><span>FD[1]</span><span>stdout</span></div>
                <div className="flex justify-between">
                  <span className="text-slate-400">FD[3]</span>
                  <motion.span key={String(s?.fd3)} initial={{ scale: 1.2 }} animate={{ scale: 1 }}
                    className={s?.fd3 ? "text-emerald-400 font-bold" : "text-slate-700 italic"}>
                    {s?.fd3 ?? "free"}
                  </motion.span>
                </div>
              </div>
            </div>
            <div className="text-[10px] font-mono text-slate-500 mt-3">drivers · disk · network · memory</div>
          </div>
        </div>
      </div>

      <LabInsight>
        The number your program gets back (fd = 3) is the whole trick: user space never holds the file, only an index into a table the kernel guards. Security and stability come from this one boundary.
      </LabInsight>
    </div>
  );
}

/* ---------------- Network request lifecycle ---------------- */

interface NetStep {
  dir: "out" | "in";
  phase: "dns" | "tcp" | "http";
  packet: string;
  note: string;
}

const NET_TRACE: NetStep[] = [
  { dir: "out", phase: "dns",  packet: "DNS: where is api.example.com?", note: "You can't send anything to a NAME. First a DNS query goes to a resolver asking for the server's IP address." },
  { dir: "in",  phase: "dns",  packet: "DNS: 93.184.216.34",             note: "The resolver answers with the IP. Now we know WHERE to send packets — DNS is the internet's phone book." },
  { dir: "out", phase: "tcp",  packet: "TCP SYN",                        note: "TCP handshake 1/3: SYN says 'I want to talk, here's my starting sequence number.'" },
  { dir: "in",  phase: "tcp",  packet: "TCP SYN-ACK",                    note: "Handshake 2/3: the server agrees and sends its own sequence number back." },
  { dir: "out", phase: "tcp",  packet: "TCP ACK",                        note: "Handshake 3/3: acknowledged. Both sides now agree a reliable, ordered connection exists." },
  { dir: "out", phase: "http", packet: "GET /api/data HTTP/1.1",         note: "Only NOW can the actual request travel — plain text riding inside TCP segments inside IP packets." },
  { dir: "in",  phase: "http", packet: "200 OK · {\"data\": …}",          note: "The server responds. Three protocol layers cooperated for one fetch() — and every one was visible here." },
];

const PHASES: { id: NetStep["phase"]; label: string }[] = [
  { id: "dns",  label: "1 · DNS lookup" },
  { id: "tcp",  label: "2 · TCP handshake" },
  { id: "http", label: "3 · HTTP exchange" },
];

function NetworkTab() {
  const player = usePlayer(NET_TRACE.length, 1500);
  const s = player.idx >= 0 ? NET_TRACE[player.idx] : null;
  const phaseDone = (p: NetStep["phase"]) => {
    const last = { dns: 1, tcp: 4, http: 6 }[p];
    return player.idx >= last;
  };

  return (
    <div className="flex flex-col gap-4">
      <PlayerBar player={player} />
      <Narration text={s ? s.note : "One innocent fetch('api.example.com/data') is really three conversations: DNS, a TCP handshake, then HTTP. Press Run to watch every packet."} />

      {/* phase checklist */}
      <div className="flex gap-2">
        {PHASES.map((p) => (
          <div key={p.id} className={`flex-1 rounded-lg border px-3 py-2 text-[10px] font-mono font-semibold text-center transition ${
            s?.phase === p.id && !phaseDone(p.id) ? "bg-amber-500/10 border-amber-400 text-amber-300"
            : phaseDone(p.id) ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
            : "bg-slate-900 border-slate-800 text-slate-600"
          }`}>
            {phaseDone(p.id) ? "✓ " : ""}{p.label}
          </div>
        ))}
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center gap-4">
          <div className="text-center shrink-0">
            <div className="w-14 h-14 rounded-xl bg-slate-900 border border-indigo-500/40 flex items-center justify-center mx-auto">
              <Terminal className="w-6 h-6 text-indigo-400" />
            </div>
            <div className="text-[10px] font-mono text-slate-500 mt-2">your machine</div>
          </div>

          <div className="flex-1 relative h-14">
            <div className="absolute top-1/2 left-0 right-0 border-t border-dashed border-slate-700" />
            {s && (
              <motion.div
                key={player.idx}
                initial={{ left: s.dir === "out" ? "0%" : "85%", opacity: 0 }}
                animate={{ left: s.dir === "out" ? "85%" : "0%", opacity: 1 }}
                transition={{ duration: 1.1, ease: "easeInOut" }}
                className="absolute top-1/2 -translate-y-1/2"
              >
                <span className={`block px-2 py-1 rounded-md border text-[9px] font-mono font-bold whitespace-nowrap ${
                  s.phase === "dns" ? "bg-sky-500/15 border-sky-400 text-sky-300"
                  : s.phase === "tcp" ? "bg-amber-500/15 border-amber-400 text-amber-300"
                  : "bg-emerald-500/15 border-emerald-400 text-emerald-300"
                }`}>
                  {s.dir === "out" ? "→ " : "← "}{s.packet}
                </span>
              </motion.div>
            )}
          </div>

          <div className="text-center shrink-0">
            <div className="w-14 h-14 rounded-xl bg-slate-900 border border-emerald-500/40 flex items-center justify-center mx-auto">
              <Globe className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="text-[10px] font-mono text-slate-500 mt-2">api.example.com</div>
          </div>
        </div>
      </div>

      <LabInsight>
        Seven packets minimum before your data arrives — that's why latency matters more than bandwidth for small requests, and why HTTP/2, keep-alive, and CDNs exist: they skip repeating these steps.
      </LabInsight>
    </div>
  );
}

/* ---------------- Async event loop ---------------- */

interface LoopStep {
  stack: string[];
  io: string[];
  micro: string[];
  stdout: string[];
  loopHot: boolean;
  note: string;
}

const LOOP_TRACE: LoopStep[] = [
  { stack: ["main()"],                  io: [],                  micro: [],                   stdout: [],                loopHot: false, note: "Synchronous code first: main() runs on the call stack like any normal function." },
  { stack: ["main()", "fetch_data()"], io: [],                  micro: [],                   stdout: [],                loopHot: false, note: "fetch_data() is called and hits an await on a slow network request." },
  { stack: ["main()"],                  io: ["fetch (waiting…)"], micro: [],                   stdout: [],                loopHot: false, note: "Key move: await hands the slow work to the runtime's I/O engine and RETURNS immediately. The stack never blocks." },
  { stack: [],                          io: ["fetch (waiting…)"], micro: [],                   stdout: [],                loopHot: false, note: "main() finishes and the stack is EMPTY — yet the program isn't done. One thread, zero waiting." },
  { stack: [],                          io: [],                  micro: ["resume coroutine"], stdout: [],                loopHot: false, note: "The network responds! The I/O engine queues a callback to resume the paused function — it does NOT interrupt anything." },
  { stack: ["resume coroutine"],        io: [],                  micro: [],                   stdout: [],                loopHot: true,  note: "The event loop's one rule: stack empty + queue not empty → move the callback onto the stack." },
  { stack: [],                          io: [],                  micro: [],                   stdout: ["data ready!"],   loopHot: false, note: "The resumed code prints the result. This loop is how one thread juggles thousands of simultaneous waits." },
];

function Box({ title, items, palette, empty }: { title: string; items: string[]; palette: string; empty: string }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex-1">
      <span className="text-[9px] font-mono text-slate-600 uppercase block mb-2">{title}</span>
      <div className="flex flex-col-reverse gap-1 min-h-[58px] justify-end">
        <AnimatePresence>
          {items.length === 0 ? (
            <span className="text-[10px] font-mono text-slate-700 italic">{empty}</span>
          ) : (
            items.map((it) => (
              <motion.span key={it} layout initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono font-bold text-center ${palette}`}>
                {it}
              </motion.span>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function AsyncTab() {
  const player = usePlayer(LOOP_TRACE.length, 1500);
  const s = player.idx >= 0 ? LOOP_TRACE[player.idx] : null;

  return (
    <div className="flex flex-col gap-4">
      <PlayerBar player={player} />
      <Narration text={s ? s.note : "How does one thread handle thousands of network calls without freezing? The event loop. Press Run to trace an async/await round trip."} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Box title="call stack — runs code" items={s?.stack ?? []} palette="bg-indigo-500/10 border-indigo-500/40 text-indigo-300" empty="idle (this is GOOD)" />
        <Box title="I/O engine — waits elsewhere" items={s?.io ?? []} palette="bg-sky-500/10 border-sky-500/40 text-sky-300" empty="nothing in flight" />
        <Box title="microtask queue — ready callbacks" items={s?.micro ?? []} palette="bg-amber-500/10 border-amber-500/40 text-amber-300" empty="empty" />
      </div>

      <div className={`rounded-xl border px-4 py-3 flex items-center gap-3 transition ${s?.loopHot ? "bg-emerald-500/10 border-emerald-400" : "bg-slate-900 border-slate-800"}`}>
        <motion.div animate={s?.loopHot ? { rotate: 360 } : { rotate: 0 }} transition={{ duration: 0.8 }}>
          <RefreshCcw className={`w-4 h-4 ${s?.loopHot ? "text-emerald-400" : "text-slate-600"}`} />
        </motion.div>
        <span className={`text-[11px] font-mono ${s?.loopHot ? "text-emerald-300 font-bold" : "text-slate-500"}`}>
          event loop: while(true) {"{ if (stack.empty && queue.hasWork) stack.push(queue.shift()) }"}
        </span>
        <span className="ml-auto text-[10px] font-mono text-slate-600">
          stdout: {s && s.stdout.length > 0 ? <strong className="text-emerald-400">› {s.stdout[0]}</strong> : <em className="text-slate-700">—</em>}
        </span>
      </div>

      <LabInsight>
        Nothing here is parallel — it's one thread taking turns. The magic is that WAITING happens off the stack, so the thread is always free to run whatever is ready next.
      </LabInsight>
    </div>
  );
}

/* ---------------- main ---------------- */

export default function SystemNetworkLab() {
  const [tab, setTab] = useState<SubTab>("os");
  return (
    <div className="flex flex-col gap-4">
      <SubTabBar
        tabs={[
          { id: "os",      label: "System Calls",  icon: <Shield className="w-3 h-3" /> },
          { id: "network", label: "Network Round Trip", icon: <Globe className="w-3 h-3" /> },
          { id: "async",   label: "Event Loop",    icon: <RefreshCcw className="w-3 h-3" /> },
        ]}
        active={tab}
        onSelect={setTab}
      />
      {tab === "os" && <OsTab />}
      {tab === "network" && <NetworkTab />}
      {tab === "async" && <AsyncTab />}
    </div>
  );
}
