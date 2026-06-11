/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { BookOpen, Sparkles, Download, ArrowRight, CheckCircle, FileUp, HelpCircle, Loader } from "lucide-react";
import { Lesson } from "../types";

const CURRICULUM_LESSONS: Lesson[] = [
  {
    id: "vals_vs_refs",
    title: "Primitive Integers vs. List References",
    difficulty: "Beginner",
    category: "Pointers & RAM",
    description: "Learn how simple variables (integers) live directly on the Stack, while mutable structures (lists) are saved inside the Heap and link via memory pointers.",
    code: `x = 42\ny = [10, 20]\nz = 42\n`,
    tasks: [
      "Step through the simulation first.",
      "Identify the Stack frame for variable x and z (they hold literal numbers directly).",
      "Identify how 'y' contains an address pointing to a list object in the Heap instead.",
    ],
    explanation: "Integers in Python are quick reference types, but collections require dynamically allocated contiguous memory blocks. The RAM simulation visualizes list 'y' residing safely in the Heap, showing details of reference tracking.",
  },
  {
    id: "stack_scope",
    title: "Stack Scope Boundaries",
    difficulty: "Intermediate",
    category: "Variables & Frames",
    description: "See how variables created inside functions exist dynamically inside separate Stack structures, isolated from global scopes.",
    code: `globals_var = 100\nprint(globals_var)\n# Function local variables are visualised\n`,
    tasks: [
      "Observe that variables belong to specific contexts shown in the scope tags.",
      "Understand variable isolation to keep functions encapsulated.",
    ],
    explanation: "Whenever routines start in Python or low-level setups, unique stack boundaries are reserved to store parameters and local definitions, preventing scope leaking into main modules.",
  },
  {
    id: "pointer_alias",
    title: "The Pointer Aliasing Bug",
    difficulty: "Intermediate",
    category: "Mutations",
    description: "Explore the classical beginner bug: assigning a second variable to an existing list clones the POINTER, not the elements. Modifying one updates both!",
    code: `a = [1, 2]\nb = a\nb.append(3)\nprint(a)\n`,
    tasks: [
      "Watch the Reference Count of list dynamically increment to 2 during execution.",
      "See that there is only ONE list on the Heap, while both variables 'a' and 'b' share its target address.",
    ],
    explanation: "In Python, assignments on objects do not copy. They recreate pointers (references) to the original allocation. This means 'a = b' creates a pointer alias.",
  },
  {
    id: "garbage_collect",
    title: "Deallocation & Garbage Collection",
    difficulty: "Advanced",
    category: "GC Internals",
    description: "Visualize how memory is freed automatically inside RAM when there are no active Stack pointers left tracking a Heap resource.",
    code: `my_data = [9, 8]\nmy_data = None\n`,
    tasks: [
      "Observe the Heap list object '[9, 8]' getting created.",
      "Notice how its Reference Count drops to 0 when assigning my_data = None.",
      "See the Heap object automatically deallocated and cleared from memory!",
    ],
    explanation: "Python frees object memory as soon as its references count falls to zero. This is a critical RAM optimization visualized in the dashboard.",
  },
];

interface LessonPlansProps {
  onLoadLesson: (code: string) => void;
  completedLessons: string[];
  onCompleteLesson: (lessonId: string) => void;
}

export default function LessonPlans({ onLoadLesson, completedLessons, onCompleteLesson }: LessonPlansProps) {
  const [selectedLesson, setSelectedLesson] = useState<Lesson>(CURRICULUM_LESSONS[0]);
  const [promptTopic, setPromptTopic] = useState<string>("");
  const [promptGrade, setPromptGrade] = useState<string>("Beginner");
  const [aiGenerating, setAiGenerating] = useState<boolean>(false);
  const [aiLessonText, setAiLessonText] = useState<string | null>(null);

  // Generate dynamic custom computer science curriculum plan via server-side Gemini route
  const generateCustomLesson = async () => {
    if (!promptTopic) return;
    setAiGenerating(true);
    setAiLessonText(null);
    try {
      const res = await fetch("/api/gemini/generate-lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: promptTopic,
          gradeLevel: promptGrade,
        }),
      });
      const data = await res.json();
      if (data.lessonPlan) {
        setAiLessonText(data.lessonPlan);
      } else {
        setAiLessonText("Failed to generate curriculum lesson template.");
      }
    } catch {
      setAiLessonText("AI Service is loading. Please check credentials or run local offline lessons.");
    } finally {
      setAiGenerating(false);
    }
  };

  const handleExportLesson = (lesson: Lesson | string) => {
    let title = "";
    let content = "";
    if (typeof lesson === "string") {
      title = "Gemini Custom Computer Science Lesson";
      content = lesson;
    } else {
      title = lesson.title;
      content = `
# LESSON COURSE: ${lesson.title}
Difficulty: ${lesson.difficulty} | Unit: ${lesson.category}

## Concept Description
${lesson.description}

## Deep Memory Analysis
${lesson.explanation}

## Hands-on Laboratory Exercise (Run under simulator):
\`\`\`python
${lesson.code}
\`\`\`

## Practical Guided Tasks to complete:
${lesson.tasks.map((t, i) => `${i + 1}. ${t}`).join("\n")}
`;
    }

    const blob = new Blob([content], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${title.toLowerCase().replace(/\s+/g, "_")}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100 flex flex-col h-full" id="lesson-plans-unit">
      
      {/* Title */}
      <div className="flex items-center gap-2.5 border-b border-slate-800 pb-4 mb-5" id="lessons-module-header">
        <div className="bg-emerald-500/10 w-9 h-9 rounded-xl flex items-center justify-center border border-emerald-500/30">
          <BookOpen className="w-4 h-4 text-emerald-400" />
        </div>
        <div>
          <h3 className="font-sans font-bold text-base text-white">Lesson & Materials</h3>
          <p className="text-[11px] text-slate-400">Curriculum templates and custom lesson generators for educators</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 flex-grow overflow-hidden">
        
        {/* LESSONS NAV LIST COLUMN */}
        <div className="md:col-span-5 space-y-3 overflow-y-auto pr-1 max-h-[460px] md:max-h-none">
          <p className="text-[10px] uppercase font-mono tracking-wider font-semibold text-slate-500 ml-1 mb-2">
            Curriculum Path (Curated)
          </p>

          <div className="space-y-2">
            {CURRICULUM_LESSONS.map((les) => {
              const isSelected = selectedLesson.id === les.id;
              const isCompleted = completedLessons.includes(les.id);
              return (
                <div
                  key={les.id}
                  onClick={() => {
                    setSelectedLesson(les);
                    setAiLessonText(null);
                  }}
                  className={`p-3.5 rounded-xl border text-left cursor-pointer transition duration-150 ${
                    isSelected
                      ? "bg-indigo-500/10 border-indigo-400"
                      : "bg-slate-950/60 border-slate-900 hover:border-slate-800"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[9px] bg-slate-900 text-indigo-300 font-mono border border-indigo-500/10 px-2 py-0.5 rounded-md uppercase tracking-wider">
                      {les.difficulty}
                    </span>
                    {isCompleted && (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-sans font-medium">
                        <CheckCircle className="w-3.5 h-3.5 fill-current text-emerald-500/10" />
                        Done
                      </span>
                    )}
                  </div>
                  <h4 className="text-white font-semibold font-sans text-xs mb-1.5">{les.title}</h4>
                  <p className="text-[10px] text-slate-400 line-clamp-2 leading-normal">{les.description}</p>
                </div>
              );
            })}
          </div>

          {/* DYNAMIC GEMINI GENERATOR SECTION */}
          <div className="bg-slate-950 border border-slate-800/85 rounded-xl p-4 mt-5 space-y-3 shadow-inner">
            <span className="text-[9px] bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 w-fit">
              <Sparkles className="w-2.5 h-2.5 text-purple-400" />
              Gemini Lesson Creator
            </span>
            <p className="text-[10px] text-slate-400 leading-normal">
              Educators: enter any Python memory concept (e.g., Recursion stack, Classes) to instantly generate lesson plans!
            </p>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Key Topic (e.g. Memory Leak)"
                value={promptTopic}
                onChange={(e) => setPromptTopic(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono p-2 outline-none text-slate-100 focus:border-purple-500/60"
              />
              <div className="flex gap-2">
                <select
                  value={promptGrade}
                  onChange={(e) => setPromptGrade(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg text-xs font-sans text-slate-300 p-2 outline-none flex-grow"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
                <button
                  onClick={generateCustomLesson}
                  disabled={aiGenerating || !promptTopic}
                  className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-sans text-xs font-medium px-4 py-2 rounded-lg transition duration-150 flex items-center gap-1.5"
                >
                  {aiGenerating ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>Draft Concept</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* DETAILS VISUALIZER PREVIEW COLUMN */}
        <div className="md:col-span-7 flex flex-col bg-slate-950 border border-slate-800/60 rounded-xl p-5 overflow-y-auto max-h-[500px] md:max-h-none h-full relative" id="lesson-detail-panel">
          
          {aiLessonText ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-mono text-purple-400 font-bold uppercase tracking-wider">Generated Class Material</span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleExportLesson(aiLessonText)}
                    className="p-1 px-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] rounded-lg text-slate-300 flex items-center gap-1.5 transition"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download Plan</span>
                  </button>
                </div>
              </div>
              <div className="prose prose-invert pl-1 text-xs space-y-3 leading-relaxed text-slate-300">
                <p className="whitespace-pre-wrap font-mono">{aiLessonText}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 flex flex-col justify-between h-full">
              <div className="space-y-4">
                <div className="flex items-start justify-between pb-3 border-b border-slate-800">
                  <div>
                    <span className="text-[9px] uppercase font-mono tracking-widest text-slate-500">{selectedLesson.category}</span>
                    <h3 className="text-sm font-bold text-white mt-1">{selectedLesson.title}</h3>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleExportLesson(selectedLesson)}
                      className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 flex items-center gap-1 transition text-[10px]"
                      title="Download Lesson Material as Markdown"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-lg leading-relaxed text-[11px] text-slate-300">
                    <p>{selectedLesson.description}</p>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-mono text-indigo-400 font-semibold">Lesson Targets:</span>
                    <ul className="space-y-1 pl-4 list-disc text-[11px] text-slate-400">
                      {selectedLesson.tasks.map((task, is) => (
                        <li key={is}>{task}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-mono text-emerald-400 font-semibold">Teacher's Guide Notes:</span>
                    <p className="bg-slate-900/40 p-3 rounded-lg leading-relaxed text-[11px] text-slate-400 border border-slate-800/40">
                      {selectedLesson.explanation}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex gap-3 flex-wrap">
                <button
                  onClick={() => onLoadLesson(selectedLesson.code)}
                  className="flex-grow flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 font-sans text-xs text-white rounded-lg font-semibold transition"
                >
                  <span>Inject Code to Simulator</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onCompleteLesson(selectedLesson.id)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-slate-800 text-xs font-sans font-semibold rounded-lg transition shrink-0"
                >
                  Mark Unit Finished
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
