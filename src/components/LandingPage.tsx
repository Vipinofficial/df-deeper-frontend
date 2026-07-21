/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { BrandLockup, Footer, FullPage, type PageKey } from "@devfrogs/auth-ui";
import { Route, Eye, FlaskConical, Sparkles, GraduationCap, Users, ArrowRight, CheckCircle2 } from "lucide-react";

interface Props {
  onSignIn: () => void;
}

const FEATURES = [
  {
    icon: <Route className="w-5 h-5" />,
    title: "Guided Journey",
    body: "A 7-stage path from your first Hello World to sorting algorithms and graph traversal — one small win at a time, with progress saved to your account.",
    color: "#818cf8",
    featured: true,
  },
  {
    icon: <Eye className="w-5 h-5" />,
    title: "Live RAM Visualizer",
    body: "Step through code line by line and watch the Stack and Heap update in real time — pointers, reference counts, and garbage collection, all animated.",
    color: "#34d399",
    featured: false,
  },
  {
    icon: <FlaskConical className="w-5 h-5" />,
    title: "Interactive Labs",
    body: "Hands-on simulators for data structures, recursion, the call stack, the CPU, and bytecode pipelines. Poke them, break them, understand them.",
    color: "#f472b6",
    featured: false,
  },
  {
    icon: <Sparkles className="w-5 h-5" />,
    title: "AI Explanations",
    body: "Stuck on why a reference changed? Get a plain-language, Gemini-generated explanation of exactly what just happened on the Stack and Heap.",
    color: "#fbbf24",
    featured: false,
  },
  {
    icon: <GraduationCap className="w-5 h-5" />,
    title: "AI Lesson Plans",
    body: "Educators can generate ready-to-teach, hands-on lesson plans for any low-level CS concept in seconds.",
    color: "#38bdf8",
    featured: false,
  },
  {
    icon: <Users className="w-5 h-5" />,
    title: "Five Languages",
    body: "Learn the concepts once in Python, then see how C, C++, Java, and Node.js represent the same memory differently.",
    color: "#a78bfa",
    featured: false,
  },
];

const STEPS = [
  { n: "01", title: "Start the journey", body: "Jump into stage one — no setup, no install. Your first program runs in the browser in seconds." },
  { n: "02", title: "Watch memory happen", body: "Every line you run animates the Stack and Heap so you see exactly where your variables live." },
  { n: "03", title: "Track your progress", body: "Sign in once and your completed stages follow you — pick up the journey on any device." },
];

const FAQS = [
  { q: "Do I need to install anything?", a: "No. Deeper runs entirely in your browser — the code editor, the visual debugger, and the algorithm labs are all client-side." },
  { q: "What languages does it cover?", a: "The guided journey and stack/heap visualizer use Python. Once you know the concepts, you can load equivalent demos in C, C++, Java, and Node.js to see how each language represents memory." },
  { q: "Is my progress saved?", a: "Yes. Sign in with your DevFrogs account and your completed journey stages are saved to your account, not just this browser." },
  { q: "Is this for teachers too?", a: "Yes — the AI Lesson Plan generator produces ready-to-teach material for any low-level CS topic, and the classroom dashboard lets an instructor track a class's progress." },
];

export default function LandingPage({ onSignIn }: Props) {
  const [openPage, setOpenPage] = useState<PageKey | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  if (openPage) return <FullPage pageKey={openPage} onBack={() => setOpenPage(null)} />;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-mono">
      {/* NAV */}
      <nav className="sticky top-0 z-30 h-16 px-5 flex items-center justify-between border-b border-slate-900 bg-slate-950/90 backdrop-blur">
        <BrandLockup appName="Deeper" abbr="D" accent="#4f46e5" nameColor="#fff" subColor="#94a3b8" />
        <div className="flex items-center gap-2">
          <button
            onClick={onSignIn}
            className="hidden sm:block px-4 py-2 rounded-lg border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 text-xs font-semibold transition"
          >
            Sign In
          </button>
          <button
            onClick={onSignIn}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-950 transition"
          >
            Get Started Free
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden px-5 py-20 sm:py-28">
        <div aria-hidden className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -left-32 w-[560px] h-[560px] rounded-full bg-indigo-600/10 blur-3xl" />
          <div className="absolute -bottom-32 -right-24 w-[440px] h-[440px] rounded-full bg-emerald-500/10 blur-3xl" />
        </div>
        <div className="relative max-w-3xl mx-auto text-center flex flex-col items-center gap-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-[11px] font-semibold text-indigo-300 tracking-wide uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            Free to start · AI-powered CS fundamentals
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
            See what your code does to memory
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-xl leading-relaxed">
            Deeper is a guided learning journey and live RAM visualizer for Python and CS
            fundamentals — the Stack, the Heap, pointers, and garbage collection, animated
            while your program runs. Memory stops being magic.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
            <button
              onClick={onSignIn}
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-950 transition"
            >
              Start the Journey
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onSignIn}
              className="px-6 py-3 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900/60 text-slate-200 text-sm font-semibold transition"
            >
              Sign In
            </button>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 mt-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> No install required</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 7-stage guided journey</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Free to start</span>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="px-5 py-16 border-t border-slate-900">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-indigo-400 mb-2">Features</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Everything you need to go deeper</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className={`rounded-xl border p-5 flex flex-col gap-3 ${
                  f.featured ? "border-indigo-500/30 bg-indigo-500/5" : "border-slate-800 bg-slate-900/60"
                }`}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center border"
                  style={{ color: f.color, borderColor: `${f.color}40`, background: `${f.color}14` }}
                >
                  {f.icon}
                </div>
                <h3 className="text-sm font-bold text-white">{f.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="px-5 py-16 border-t border-slate-900">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-400 mb-2">How it works</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Up and running in minutes</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 relative overflow-hidden">
                <div aria-hidden className="absolute top-3 right-4 text-4xl font-bold text-slate-800 select-none">{s.n}</div>
                <h3 className="text-sm font-bold text-white mb-2">{s.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-5 py-16 border-t border-slate-900">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-indigo-400 mb-2">FAQ</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Frequently asked questions</h2>
          </div>
          <div className="rounded-xl border border-slate-800 overflow-hidden">
            {FAQS.map((item, i) => {
              const isOpen = openFaq === i;
              return (
                <div key={item.q} className={i < FAQS.length - 1 ? "border-b border-slate-800" : ""}>
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-white bg-slate-900/40 hover:bg-slate-900/70 transition"
                  >
                    <span>{item.q}</span>
                    <span className={`shrink-0 text-lg text-slate-500 transition-transform ${isOpen ? "rotate-45 text-indigo-400" : ""}`}>+</span>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 bg-slate-900/20">
                      <p className="text-xs text-slate-400 leading-relaxed">{item.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 pb-16">
        <div className="max-w-4xl mx-auto rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-600/10 to-slate-900 p-10 text-center flex flex-col items-center gap-4">
          <img src="/logo.svg" alt="Deeper | devfrogs" className="h-10 w-auto opacity-90" />
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Ready to see what your code is really doing?</h2>
          <p className="text-sm text-slate-400 max-w-md">
            Start the guided journey free — your progress follows you across every DevFrogs app.
          </p>
          <button
            onClick={onSignIn}
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-950 transition"
          >
            Get Started Free
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      <Footer onPageClick={setOpenPage} brandLogoUrl="/favicon.svg" brandLogoAlt="DevFrogs" brandName="DevFrogs" />
    </div>
  );
}
