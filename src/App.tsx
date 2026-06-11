/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Eye, Plus, BookOpen, Users, GraduationCap, Route, ChevronDown } from "lucide-react";
import MemoryVisualizer from "./components/MemoryVisualizer";
import DragDropWorkspace from "./components/DragDropWorkspace";
import LessonPlans from "./components/LessonPlans";
import CollaborationRoom from "./components/CollaborationRoom";
import Dashboard from "./components/Dashboard";
import JourneyPath from "./components/JourneyPath";
import Landing from "./components/Landing";
import { StackVariable, HeapObject } from "./types";
import { motion, AnimatePresence } from "motion/react";
import { localAuth, localDb } from "./firebase";
import { Language, LANGUAGES, getLanguageMeta } from "./languages";
import {
  JourneyStage,
  WorkspaceTab,
  MemorySubTab,
  getLocalJourneyProgress,
  addLocalJourneyProgress,
} from "./journey";

type Tab = "home" | "journey" | "visualizer" | "blocks" | "lessons" | "pair" | "educator";

const LESSON_IDS = ["vals_vs_refs", "stack_scope", "pointer_alias", "garbage_collect"];

interface VisualizerRequest {
  workspaceTab: WorkspaceTab;
  memorySubTab?: MemorySubTab;
  stage: JourneyStage | null;
}

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "journey",    label: "Journey",    icon: <Route className="w-3.5 h-3.5" /> },
  { id: "visualizer", label: "Visualizer", icon: <Eye className="w-3.5 h-3.5" /> },
  { id: "blocks",     label: "Blocks",     icon: <Plus className="w-3.5 h-3.5" /> },
  { id: "lessons",    label: "Lessons",    icon: <BookOpen className="w-3.5 h-3.5" /> },
  { id: "pair",       label: "Pairs",      icon: <Users className="w-3.5 h-3.5" /> },
  { id: "educator",   label: "Educator",   icon: <GraduationCap className="w-3.5 h-3.5" /> },
];

export default function App() {
  const [code, setCode] = useState<string>(
    `# Double Mutation Laboratory\nitems = [100, 200]\nalias_ref = items\nalias_ref.append(300)\nalias_ref[0] = 999\nprint(items)\n`
  );
  const [currentLine, setCurrentLine] = useState<number>(-1);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [user, setUser] = useState<any>(null);
  const [localJourney, setLocalJourney] = useState<string[]>(getLocalJourneyProgress);
  const [visualizerRequest, setVisualizerRequest] = useState<VisualizerRequest | null>(null);
  const [language, setLanguage] = useState<Language>("python");
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!langMenuOpen) return;
    const close = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setLangMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [langMenuOpen]);

  const journeyDone = useMemo(
    () => new Set([...completedLessons, ...localJourney]),
    [completedLessons, localJourney]
  );

  useEffect(() => {
    const unsub = localAuth.subscribe((u) => {
      setUser(u);
      if (u?.completedLessons) setCompletedLessons(u.completedLessons);
    });
    return unsub;
  }, []);

  const handleCompleteLesson = (lessonId: string) => {
    if (completedLessons.includes(lessonId)) return;
    const updated = [...completedLessons, lessonId];
    setCompletedLessons(updated);
    localAuth.updateUserCompletedLessons(lessonId);
    const cls = localDb.getItem("classrooms", "CLASS-V7");
    if (cls && user) {
      const students = cls.students?.map((s: any) =>
        s.uid === user.uid || s.email === user.email
          ? { ...s, completedLessons: updated }
          : s
      ) ?? [];
      if (!students.some((s: any) => s.email === user.email)) {
        students.push({ uid: user.uid, email: user.email, name: user.name, completedLessons: updated });
      }
      localDb.setItem("classrooms", "CLASS-V7", { ...cls, students });
    }
  };

  const handleLoadCode = (c: string) => {
    setCode(c);
    setLanguage("python");
    setVisualizerRequest(null);
    setActiveTab("visualizer");
  };

  const handleSelectLanguage = (lang: Language) => {
    setLanguage(lang);
    setCode(getLanguageMeta(lang).sample);
    setVisualizerRequest(null);
    setLangMenuOpen(false);
    setActiveTab("visualizer");
  };

  const handleCompleteStage = (stageId: string) => {
    setLocalJourney(addLocalJourneyProgress(stageId));
    if (LESSON_IDS.includes(stageId) && user) {
      handleCompleteLesson(stageId);
    }
  };

  const handleStartStage = (stage: JourneyStage) => {
    setLanguage("python");
    if (stage.target.kind === "debugger") {
      setCode(stage.target.code);
      setVisualizerRequest({ workspaceTab: "debugger", stage });
    } else {
      setVisualizerRequest({
        workspaceTab: stage.target.workspaceTab,
        memorySubTab: stage.target.memorySubTab,
        stage,
      });
    }
    setActiveTab("visualizer");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">

      <header className="border-b border-slate-800 bg-slate-950 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-5 h-14 flex items-center justify-between gap-4">
          <button
            onClick={() => {
              setVisualizerRequest(null);
              setActiveTab("home");
            }}
            className="flex items-center shrink-0 cursor-pointer"
          >
            <img src="/logo.svg" alt="Deeper | devfrogs — visual memory debugger" className="h-11 w-auto" />
          </button>

          <nav className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 gap-0.5 overflow-x-auto scrollbar-none">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setVisualizerRequest(null);
                  setActiveTab(t.id);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold whitespace-nowrap transition ${
                  activeTab === t.id
                    ? "bg-slate-950 text-white border border-slate-700 shadow"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {t.icon}
                <span className="hidden sm:block">{t.label}</span>
              </button>
            ))}
          </nav>

          <div className="shrink-0 flex items-center gap-2">
            {/* Language dropdown */}
            <div className="relative" ref={langMenuRef}>
              <button
                onClick={() => setLangMenuOpen((o) => !o)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-lg text-xs font-mono font-semibold transition"
              >
                {getLanguageMeta(language).label}
                <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform ${langMenuOpen ? "rotate-180" : ""}`} />
              </button>
              {langMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 bg-slate-900 border border-slate-800 rounded-lg shadow-xl overflow-hidden z-50 min-w-[120px]">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.id}
                      onClick={() => handleSelectLanguage(lang.id)}
                      className={`w-full text-left px-3 py-2 text-xs font-mono transition ${
                        language === lang.id
                          ? "bg-slate-950 text-white font-semibold"
                          : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {user ? (
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                <span className="text-slate-300">{user.name.split(" ")[0]}</span>
                <button
                  onClick={() => localAuth.signOutSimulated()}
                  className="text-slate-600 hover:text-red-400 transition ml-1 border-l border-slate-800 pl-2"
                >
                  out
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  const name = prompt("Student username:");
                  if (name) localAuth.signInSimulated(name, "student");
                }}
                className="text-xs font-mono text-slate-500 hover:text-slate-300 border border-slate-800 px-3 py-1.5 rounded-lg transition"
              >
                Sign in
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-5 py-6">
        <AnimatePresence mode="wait">
          {activeTab === "home" && (
            <motion.div key="home" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
              <Landing
                onStartJourney={() => setActiveTab("journey")}
                onOpenVisualizer={() => setActiveTab("visualizer")}
                onSelectLanguage={handleSelectLanguage}
              />
            </motion.div>
          )}
          {activeTab === "journey" && (
            <motion.div key="journey" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
              <JourneyPath completedIds={journeyDone} onStartStage={handleStartStage} />
            </motion.div>
          )}
          {activeTab === "visualizer" && (
            <motion.div key="visualizer" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
              <MemoryVisualizer
                code={code}
                setCode={setCode}
                language={language}
                externalLine={currentLine}
                onStateChange={(_, __, line) => setCurrentLine(line)}
                initialWorkspaceTab={visualizerRequest?.workspaceTab}
                initialMemorySubTab={visualizerRequest?.memorySubTab}
                journeyStage={visualizerRequest?.stage ?? null}
                stageCompleted={visualizerRequest?.stage ? journeyDone.has(visualizerRequest.stage.id) : false}
                onStageComplete={handleCompleteStage}
              />
            </motion.div>
          )}
          {activeTab === "blocks" && (
            <motion.div key="blocks" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
              <DragDropWorkspace onCompile={handleLoadCode} />
            </motion.div>
          )}
          {activeTab === "lessons" && (
            <motion.div key="lessons" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
              <LessonPlans onLoadLesson={handleLoadCode} completedLessons={completedLessons} onCompleteLesson={handleCompleteLesson} />
            </motion.div>
          )}
          {activeTab === "pair" && (
            <motion.div key="pair" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
              <CollaborationRoom currentCode={code} onCodeSynced={setCode} currentLine={currentLine} onLineSynced={setCurrentLine} />
            </motion.div>
          )}
          {activeTab === "educator" && (
            <motion.div key="educator" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
              <Dashboard onLoadCode={handleLoadCode} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="border-t border-slate-900 py-3 text-center">
        <div className="flex items-center justify-center gap-3">
          <img src="/logo.svg" alt="Deeper | devfrogs" className="h-7 w-auto opacity-50" />
          <span className="text-[11px] font-mono text-slate-700">© 2026</span>
        </div>
      </footer>

    </div>
  );
}
