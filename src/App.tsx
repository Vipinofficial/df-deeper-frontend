/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Eye, Plus, BookOpen, Users, GraduationCap, Route, ChevronDown, LayoutDashboard } from "lucide-react";
import { useCentralAuth, redirectToLogin, centralLogout } from "@devfrogs/auth-ui";
import MemoryVisualizer from "./components/MemoryVisualizer";
import DragDropWorkspace from "./components/DragDropWorkspace";
import LessonPlans from "./components/LessonPlans";
import CollaborationRoom from "./components/CollaborationRoom";
import Dashboard from "./components/Dashboard";
import UserDashboard from "./components/UserDashboard";
import JourneyPath from "./components/JourneyPath";
import Landing from "./components/Landing";
import LandingPage from "./components/LandingPage";
import { StackVariable, HeapObject } from "./types";
import { motion, AnimatePresence } from "motion/react";
import { localDb } from "./localSim";
import { Language, LANGUAGES, getLanguageMeta } from "./languages";
import { api } from "./api";
import {
  JourneyStage,
  WorkspaceTab,
  MemorySubTab,
  getLocalJourneyProgress,
  addLocalJourneyProgress,
} from "./journey";

type Tab = "home" | "journey" | "visualizer" | "blocks" | "lessons" | "pair" | "dashboard" | "educator";

const LESSON_IDS = ["vals_vs_refs", "stack_scope", "pointer_alias", "garbage_collect"];

interface VisualizerRequest {
  workspaceTab: WorkspaceTab;
  memorySubTab?: MemorySubTab;
  stage: JourneyStage | null;
}

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "journey", label: "Journey", icon: <Route className="w-3.5 h-3.5" /> },
  { id: "visualizer", label: "Visualizer", icon: <Eye className="w-3.5 h-3.5" /> },
  { id: "blocks", label: "Blocks", icon: <Plus className="w-3.5 h-3.5" /> },
  { id: "lessons", label: "Lessons", icon: <BookOpen className="w-3.5 h-3.5" /> },
  { id: "pair", label: "Pairs", icon: <Users className="w-3.5 h-3.5" /> },
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
  { id: "educator", label: "Educator", icon: <GraduationCap className="w-3.5 h-3.5" /> },
];

function Shell() {
  const central = useCentralAuth({ appId: "deeper", autoRedirect: false });

  const [code, setCode] = useState<string>(
    `# Double Mutation Laboratory\nitems = [100, 200]\nalias_ref = items\nalias_ref.append(300)\nalias_ref[0] = 999\nprint(items)\n`
  );
  const [currentLine, setCurrentLine] = useState<number>(-1);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [localJourney, setLocalJourney] = useState<string[]>(getLocalJourneyProgress);
  const [remoteJourney, setRemoteJourney] = useState<string[] | null>(null);
  const [journeySyncing, setJourneySyncing] = useState(false);
  const [journeySyncError, setJourneySyncError] = useState<string | null>(null);
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

  // Load the signed-in user's authoritative journey progress from the backend once they're
  // known. The localStorage copy (localJourney) stays as an optimistic cache that keeps
  // working offline / before this resolves.
  useEffect(() => {
    if (!central.user) return;
    let cancelled = false;
    setJourneySyncing(true);
    api
      .getJourneyProgress()
      .then((res) => {
        if (!cancelled) setRemoteJourney(res.completedStageIds);
      })
      .catch(() => {
        if (!cancelled) setJourneySyncError("Couldn't reach the server — showing locally cached progress.");
      })
      .finally(() => {
        if (!cancelled) setJourneySyncing(false);
      });
    return () => {
      cancelled = true;
    };
  }, [central.user]);

  const journeyDone = useMemo(
    () => new Set([...completedLessons, ...localJourney, ...(remoteJourney ?? [])]),
    [completedLessons, localJourney, remoteJourney]
  );

  // Best-effort sync of a completed lesson into the deferred, localStorage-backed classroom
  // simulation (Dashboard.tsx's hardcoded "CLASS-V7" room) — keyed off the real DevFrogs
  // identity now that sign-in is central SSO, not a real backend collection.
  const handleCompleteLesson = (lessonId: string) => {
    if (completedLessons.includes(lessonId)) return;
    const updated = [...completedLessons, lessonId];
    setCompletedLessons(updated);
    const cls = localDb.getItem("classrooms", "CLASS-V7");
    if (cls && central.user) {
      const students =
        cls.students?.map((s: any) =>
          s.uid === central.user!.id || s.email === central.user!.email
            ? { ...s, completedLessons: updated }
            : s
        ) ?? [];
      if (!students.some((s: any) => s.email === central.user!.email)) {
        students.push({ uid: central.user.id, email: central.user.email, name: central.user.name, completedLessons: updated });
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
    // Optimistic local write so the UI updates instantly and still works offline...
    setLocalJourney(addLocalJourneyProgress(stageId));
    // ...then persist to the backend, the real source of truth for the dashboard.
    api
      .completeJourneyStage(stageId)
      .then((res) => setRemoteJourney(res.completedStageIds))
      .catch(() => setJourneySyncError("Progress saved locally but couldn't sync to the server yet."));
    if (LESSON_IDS.includes(stageId) && central.user) {
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

  if (central.loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <span className="text-xs font-mono text-slate-500">Loading…</span>
      </div>
    );
  }

  if (!central.user) {
    return <LandingPage onSignIn={() => redirectToLogin()} />;
  }

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

            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
              <span className="text-slate-300">{central.user.name.split(" ")[0]}</span>
              <button
                onClick={() => void centralLogout()}
                className="text-slate-600 hover:text-red-400 transition ml-1 border-l border-slate-800 pl-2"
              >
                out
              </button>
            </div>
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
          {activeTab === "dashboard" && (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
              <UserDashboard
                user={central.user}
                remoteCompletedIds={remoteJourney}
                localCompletedIds={journeyDone}
                syncing={journeySyncing}
                syncError={journeySyncError}
              />
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

export default function App() {
  return <Shell />;
}
