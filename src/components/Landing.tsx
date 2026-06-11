/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Route, Eye, FlaskConical, Play, ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { LANGUAGES, Language } from "../languages";

interface LandingProps {
  onStartJourney: () => void;
  onOpenVisualizer: () => void;
  onSelectLanguage: (lang: Language) => void;
}

const FEATURES = [
  {
    icon: <Route className="w-5 h-5 text-indigo-400" />,
    title: "Guided Journey",
    body: "A 7-stage path that takes a complete beginner from their first Hello World all the way to sorting algorithms — one small win at a time.",
  },
  {
    icon: <Eye className="w-5 h-5 text-emerald-400" />,
    title: "See RAM, live",
    body: "Step through code line by line and watch the Stack and Heap update in real time — pointers, ref counts, garbage collection, all animated.",
  },
  {
    icon: <FlaskConical className="w-5 h-5 text-pink-400" />,
    title: "Interactive Labs",
    body: "Hands-on simulators for data structures, recursion, the CPU, bytecode pipelines, and more — poke them, break them, understand them.",
  },
];

export default function Landing({ onStartJourney, onOpenVisualizer, onSelectLanguage }: LandingProps) {
  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-10 py-6">

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="text-center flex flex-col items-center gap-4 pt-6"
      >
        <img src="/logo.svg" alt="Deeper | devfrogs — visual memory debugger" className="h-24 w-auto" />
        <h1 className="font-mono font-bold text-3xl text-white tracking-tight">
          See what your code does to memory
        </h1>
        <p className="text-sm font-mono text-slate-400 max-w-xl leading-relaxed">
          A visual debugger that shows the Stack, the Heap, pointers, and garbage collection
          while your program runs — so memory stops being magic. Learn it once in Python,
          then see how C, C++, Java, and Node.js do it differently.
        </p>
        <div className="flex items-center gap-3 mt-2">
          <button
            onClick={onStartJourney}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-mono font-semibold transition"
          >
            <Play className="w-4 h-4 fill-current" />
            Start the Journey
          </button>
          <button
            onClick={onOpenVisualizer}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-mono font-semibold transition"
          >
            Open Visualizer
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {/* Feature cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.1 + i * 0.08 }}
            className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-3"
          >
            <div className="w-10 h-10 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center">
              {f.icon}
            </div>
            <h3 className="text-sm font-mono font-bold text-white">{f.title}</h3>
            <p className="text-xs font-mono text-slate-500 leading-relaxed">{f.body}</p>
          </motion.div>
        ))}
      </div>

      {/* Languages */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.35 }}
        className="bg-slate-900 border border-slate-800 rounded-xl p-6"
      >
        <h3 className="text-sm font-mono font-bold text-white">Same concepts, five languages</h3>
        <p className="text-xs font-mono text-slate-500 mt-1 leading-relaxed">
          Pick a language to load a memory demo built for it — stack arrays and malloc in C,
          value-copying vectors in C++, heap references in Java and JS.
        </p>
        <div className="flex flex-wrap gap-2 mt-4">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.id}
              onClick={() => onSelectLanguage(lang.id)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-lg text-xs font-mono font-semibold transition"
            >
              {lang.label}
              <ArrowRight className="w-3 h-3 text-slate-600" />
            </button>
          ))}
        </div>
      </motion.div>

    </div>
  );
}
